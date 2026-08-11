-- ═══════════════════════════════════════════════════════════
-- MIGRATION 002 — Client Master DB + Policies
-- Adds the real 'clients' table (separate from leads) + 'policies'.
-- Run in Supabase SQL Editor. Safe to run once; guards included.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS clients (
  id              BIGSERIAL PRIMARY KEY,
  full_name       TEXT NOT NULL,
  mobile          TEXT,
  email           TEXT,
  address         TEXT,
  city            TEXT,
  state           TEXT,
  pincode         TEXT,
  dob             DATE,
  occupation      TEXT,
  pan_number      TEXT,
  aadhaar_number  TEXT,
  passport_number TEXT,
  dl_number       TEXT,
  voter_id        TEXT,
  gstin           TEXT,
  source_lead_id  BIGINT REFERENCES leads(id),
  assigned_to     UUID REFERENCES profiles(id),
  assigned_name   TEXT,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_mobile ON clients(mobile);
CREATE INDEX IF NOT EXISTS idx_clients_pan    ON clients(pan_number);
CREATE INDEX IF NOT EXISTS idx_clients_assigned ON clients(assigned_to);

CREATE TABLE IF NOT EXISTS policies (
  id             BIGSERIAL PRIMARY KEY,
  client_id      BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  policy_number  TEXT,
  product        TEXT,
  insurer        TEXT,
  premium        NUMERIC,
  sum_assured    NUMERIC,
  start_date     DATE,
  renewal_date   DATE,
  status         TEXT DEFAULT 'Active' CHECK (status IN ('Active','Lapsed','Matured','Cancelled')),
  created_by     UUID REFERENCES profiles(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policies_client  ON policies(client_id);
CREATE INDEX IF NOT EXISTS idx_policies_renewal ON policies(renewal_date);

-- documents table: repoint from lead_id to client_id (Phase 1 uses clients, not leads, for KYC).
ALTER TABLE documents ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_url TEXT;
CREATE INDEX IF NOT EXISTS idx_documents_client ON documents(client_id);

-- tickets: allow linking to a client, not just a lead
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id);

-- Multi-user ticket tagging (participants), separate from single assigned_to
CREATE TABLE IF NOT EXISTS ticket_participants (
  id         BIGSERIAL PRIMARY KEY,
  ticket_id  BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id),
  added_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ticket_id, user_id)
);

ALTER TABLE ticket_comments ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES profiles(id);
ALTER TABLE ticket_comments ADD COLUMN IF NOT EXISTS is_file BOOLEAN DEFAULT FALSE;
ALTER TABLE ticket_comments ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE ticket_comments ADD COLUMN IF NOT EXISTS is_bookmarked BOOLEAN DEFAULT FALSE;

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS closed_by TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

CREATE TRIGGER trg_clients_updated  BEFORE UPDATE ON clients  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_policies_updated BEFORE UPDATE ON policies FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── RLS: clients, policies, ticket_participants ─────────────
ALTER TABLE clients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_select_admin"    ON clients FOR SELECT USING (is_admin());
CREATE POLICY "clients_select_employee" ON clients FOR SELECT USING (assigned_to = auth.uid());
CREATE POLICY "clients_insert"          ON clients FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "clients_update_admin"    ON clients FOR UPDATE USING (is_admin());
CREATE POLICY "clients_update_employee" ON clients FOR UPDATE USING (assigned_to = auth.uid());

CREATE POLICY "policies_select" ON policies FOR SELECT
  USING (is_admin() OR EXISTS (SELECT 1 FROM clients WHERE clients.id = policies.client_id AND clients.assigned_to = auth.uid()));
CREATE POLICY "policies_insert" ON policies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "policies_update" ON policies FOR UPDATE
  USING (is_admin() OR EXISTS (SELECT 1 FROM clients WHERE clients.id = policies.client_id AND clients.assigned_to = auth.uid()));

CREATE POLICY "ticket_participants_select" ON ticket_participants FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ticket_participants_insert" ON ticket_participants FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- documents RLS needs to also check client_id ownership now
CREATE POLICY "docs_select_client_employee" ON documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = documents.client_id AND clients.assigned_to = auth.uid()));
