-- ═══════════════════════════════════════════════════════════
-- MIGRATION 004 — Claims + Meetings (Phase 2)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS claims (
  id              BIGSERIAL PRIMARY KEY,
  claim_ref       TEXT UNIQUE,
  client_id       BIGINT REFERENCES clients(id) ON DELETE CASCADE,
  client_name     TEXT,
  policy_id       BIGINT REFERENCES policies(id),
  policy_number   TEXT,
  claim_type      TEXT, -- Death, Health, Accident, Maturity, Surrender
  claim_amount    NUMERIC,
  approved_amount NUMERIC,
  status          TEXT DEFAULT 'Filed' CHECK (status IN ('Filed','Under Review','Documents Pending','Approved','Rejected','Settled')),
  priority        TEXT DEFAULT 'Normal' CHECK (priority IN ('Low','Normal','High','Urgent')),
  filed_date      DATE DEFAULT CURRENT_DATE,
  settled_date    DATE,
  assigned_to     UUID REFERENCES profiles(id),
  assigned_name   TEXT,
  notes           TEXT,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claims_client   ON claims(client_id);
CREATE INDEX IF NOT EXISTS idx_claims_status   ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_assigned ON claims(assigned_to);

CREATE OR REPLACE FUNCTION generate_claim_ref()
RETURNS TRIGGER AS $$
BEGIN
  NEW.claim_ref = 'CL-' || LPAD(NEW.id::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_claim_ref BEFORE INSERT ON claims FOR EACH ROW EXECUTE FUNCTION generate_claim_ref();
CREATE TRIGGER trg_claims_updated BEFORE UPDATE ON claims FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS claim_activities (
  id          BIGSERIAL PRIMARY KEY,
  claim_id    BIGINT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  actor_id    UUID REFERENCES profiles(id),
  actor_name  TEXT,
  action      TEXT NOT NULL,
  old_value   TEXT,
  new_value   TEXT,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_claim_activities_claim ON claim_activities(claim_id);

CREATE TABLE IF NOT EXISTS claim_documents (
  id            BIGSERIAL PRIMARY KEY,
  claim_id      BIGINT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  doc_type      TEXT,
  file_name     TEXT,
  file_url      TEXT,
  uploaded_by   UUID REFERENCES profiles(id),
  uploaded_name TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claim_tasks (
  id          BIGSERIAL PRIMARY KEY,
  claim_id    BIGINT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  task_id     BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
);

-- link tasks/tickets to claims directly too, for the cross-links in your spec (Claim -> Ticket, Claim -> Task)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS claim_id BIGINT REFERENCES claims(id);
ALTER TABLE tasks   ADD COLUMN IF NOT EXISTS claim_id BIGINT REFERENCES claims(id);
ALTER TABLE tasks   ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id);

-- ─── MEETINGS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meetings (
  id           BIGSERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  client_id    BIGINT REFERENCES clients(id),
  lead_id      BIGINT REFERENCES leads(id),
  with_name    TEXT,
  meeting_date DATE NOT NULL,
  meeting_time TIME,
  location     TEXT,
  notes        TEXT,
  status       TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled','Completed','Cancelled','No Show')),
  assigned_to  UUID REFERENCES profiles(id),
  assigned_name TEXT,
  created_by   UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_meetings_assigned ON meetings(assigned_to);
CREATE TRIGGER trg_meetings_updated BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── RLS ────────────────────────────────────────────────────
ALTER TABLE claims            ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_activities  ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_documents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings          ENABLE ROW LEVEL SECURITY;

CREATE POLICY "claims_select_admin"    ON claims FOR SELECT USING (is_admin());
CREATE POLICY "claims_select_employee" ON claims FOR SELECT USING (assigned_to = auth.uid());
CREATE POLICY "claims_insert"          ON claims FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "claims_update_admin"    ON claims FOR UPDATE USING (is_admin());
CREATE POLICY "claims_update_employee" ON claims FOR UPDATE USING (assigned_to = auth.uid());

CREATE POLICY "claim_activities_select" ON claim_activities FOR SELECT
  USING (is_admin() OR EXISTS (SELECT 1 FROM claims WHERE claims.id = claim_activities.claim_id AND claims.assigned_to = auth.uid()));
CREATE POLICY "claim_activities_insert" ON claim_activities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "claim_documents_select" ON claim_documents FOR SELECT
  USING (is_admin() OR EXISTS (SELECT 1 FROM claims WHERE claims.id = claim_documents.claim_id AND claims.assigned_to = auth.uid()));
CREATE POLICY "claim_documents_insert" ON claim_documents FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "meetings_select_admin"    ON meetings FOR SELECT USING (is_admin());
CREATE POLICY "meetings_select_employee" ON meetings FOR SELECT USING (assigned_to = auth.uid());
CREATE POLICY "meetings_insert"          ON meetings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "meetings_update_admin"    ON meetings FOR UPDATE USING (is_admin());
CREATE POLICY "meetings_update_employee" ON meetings FOR UPDATE USING (assigned_to = auth.uid());
