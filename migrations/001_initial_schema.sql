-- ═══════════════════════════════════════════════════════════
-- MYADVISOR CRM — SUPABASE SQL SETUP
-- Run this entire file in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES (linked to Supabase Auth users) ───────────────
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  mobile      TEXT,
  role        TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin','employee')),
  status      TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','On Leave','Inactive')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── LEADS ──────────────────────────────────────────────────
CREATE TABLE leads (
  id                  BIGSERIAL PRIMARY KEY,
  -- Basic
  full_name           TEXT NOT NULL,
  mobile              TEXT,
  email               TEXT,
  address             TEXT,
  city                TEXT,
  state               TEXT,
  pincode             TEXT,
  dob                 DATE,
  occupation          TEXT,
  annual_income       TEXT,
  -- Insurance
  product             TEXT,
  policy_type         TEXT,
  premium             TEXT,
  existing_insurance  TEXT,
  nominee             TEXT,
  -- Health
  height              NUMERIC,
  weight              NUMERIC,
  smoking_status      TEXT DEFAULT 'Non-smoker',
  alcohol_status      TEXT DEFAULT 'Non-drinker',
  diabetes            TEXT DEFAULT 'No',
  blood_pressure      TEXT DEFAULT 'Normal',
  cancer              TEXT DEFAULT 'No',
  heart_disease       TEXT DEFAULT 'No',
  asthma              TEXT DEFAULT 'No',
  medical_notes       TEXT,
  -- KYC Numbers
  pan_number          TEXT,
  aadhaar_number      TEXT,
  passport_number     TEXT,
  dl_number           TEXT,
  -- Tracking
  stage               TEXT NOT NULL DEFAULT 'New Lead',
  priority            TEXT DEFAULT 'Normal',
  follow_up_date      DATE,
  notes               TEXT,
  assigned_to         UUID REFERENCES profiles(id),
  assigned_name       TEXT,
  created_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_stage         ON leads(stage);
CREATE INDEX idx_leads_assigned_to   ON leads(assigned_to);
CREATE INDEX idx_leads_follow_up     ON leads(follow_up_date);
CREATE INDEX idx_leads_mobile        ON leads(mobile);
CREATE INDEX idx_leads_pan           ON leads(pan_number);

-- ─── LEAD ACTIVITIES (Timeline) ─────────────────────────────
CREATE TABLE lead_activities (
  id          BIGSERIAL PRIMARY KEY,
  lead_id     BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  actor_id    UUID REFERENCES profiles(id),
  actor_name  TEXT,
  action      TEXT NOT NULL,
  old_value   TEXT,
  new_value   TEXT,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lead_activities_lead ON lead_activities(lead_id);

-- ─── TASKS ──────────────────────────────────────────────────
CREATE TABLE tasks (
  id           BIGSERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT,
  assigned_to  UUID REFERENCES profiles(id),
  assigned_name TEXT,
  lead_id      BIGINT REFERENCES leads(id),
  priority     TEXT DEFAULT 'Normal' CHECK (priority IN ('Low','Normal','High','Urgent')),
  status       TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','In Progress','Completed','Delayed')),
  due_date     DATE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence   TEXT,
  created_by   UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_due      ON tasks(due_date);
CREATE INDEX idx_tasks_status   ON tasks(status);

-- ─── TICKETS ────────────────────────────────────────────────
CREATE TABLE tickets (
  id           BIGSERIAL PRIMARY KEY,
  ticket_ref   TEXT UNIQUE, -- e.g. TK-0041
  subject      TEXT NOT NULL,
  description  TEXT,
  raised_by    UUID REFERENCES profiles(id),
  raised_name  TEXT,
  assigned_to  UUID REFERENCES profiles(id),
  assigned_name TEXT,
  lead_id      BIGINT REFERENCES leads(id),
  priority     TEXT DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High','Urgent')),
  status       TEXT DEFAULT 'Open' CHECK (status IN ('Open','In Progress','Waiting','Resolved','Closed')),
  due_date     DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tickets_assigned ON tickets(assigned_to);
CREATE INDEX idx_tickets_status   ON tickets(status);

-- Auto-generate ticket ref
CREATE OR REPLACE FUNCTION generate_ticket_ref()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_ref = 'TK-' || LPAD(NEW.id::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_ref
  BEFORE INSERT ON tickets
  FOR EACH ROW EXECUTE FUNCTION generate_ticket_ref();

-- ─── TICKET COMMENTS ────────────────────────────────────────
CREATE TABLE ticket_comments (
  id          BIGSERIAL PRIMARY KEY,
  ticket_id   BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES profiles(id),
  author_name TEXT,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DOCUMENTS (KYC Vault) ──────────────────────────────────
CREATE TABLE documents (
  id            BIGSERIAL PRIMARY KEY,
  lead_id       BIGINT REFERENCES leads(id) ON DELETE CASCADE,
  doc_type      TEXT NOT NULL, -- PAN, Aadhaar, Passport, Medical, etc.
  file_name     TEXT,
  file_path     TEXT, -- Supabase Storage path
  file_size     BIGINT,
  mime_type     TEXT,
  status        TEXT DEFAULT 'Uploaded' CHECK (status IN ('Uploaded','Verified','Rejected','Under Review')),
  uploaded_by   UUID REFERENCES profiles(id),
  uploaded_name TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_lead ON documents(lead_id);

-- ─── NOTIFICATIONS ──────────────────────────────────────────
CREATE TABLE notifications (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT,
  type        TEXT DEFAULT 'info', -- info, warning, success, error
  is_read     BOOLEAN DEFAULT FALSE,
  link_type   TEXT, -- lead, ticket, task
  link_id     BIGINT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_user   ON notifications(user_id);
CREATE INDEX idx_notif_unread ON notifications(user_id, is_read);

-- ─── AUDIT LOGS ─────────────────────────────────────────────
CREATE TABLE audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id),
  user_name   TEXT,
  action      TEXT NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, UPLOAD, ASSIGN
  module      TEXT NOT NULL, -- Leads, Tasks, Tickets, Auth, KYC Vault
  record_id   BIGINT,
  details     TEXT,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user   ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) — CRITICAL FOR DATA ISOLATION
-- ═══════════════════════════════════════════════════════════

ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads            ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs       ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- PROFILES — users see own, admins see all
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (id = auth.uid() OR is_admin());

CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (id = auth.uid() OR is_admin());

-- LEADS — employees see only assigned leads; admins see all
CREATE POLICY "leads_select_admin"    ON leads FOR SELECT USING (is_admin());
CREATE POLICY "leads_select_employee" ON leads FOR SELECT USING (assigned_to = auth.uid());
CREATE POLICY "leads_insert"          ON leads FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "leads_update_admin"    ON leads FOR UPDATE USING (is_admin());
CREATE POLICY "leads_update_employee" ON leads FOR UPDATE USING (assigned_to = auth.uid());

-- LEAD ACTIVITIES
CREATE POLICY "activities_select" ON lead_activities FOR SELECT
  USING (is_admin() OR EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_activities.lead_id AND leads.assigned_to = auth.uid()));
CREATE POLICY "activities_insert" ON lead_activities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- TASKS
CREATE POLICY "tasks_select_admin"    ON tasks FOR SELECT USING (is_admin());
CREATE POLICY "tasks_select_employee" ON tasks FOR SELECT USING (assigned_to = auth.uid());
CREATE POLICY "tasks_insert"          ON tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "tasks_update_admin"    ON tasks FOR UPDATE USING (is_admin());
CREATE POLICY "tasks_update_employee" ON tasks FOR UPDATE USING (assigned_to = auth.uid());

-- TICKETS
CREATE POLICY "tickets_select_admin"    ON tickets FOR SELECT USING (is_admin());
CREATE POLICY "tickets_select_employee" ON tickets FOR SELECT USING (assigned_to = auth.uid() OR raised_by = auth.uid());
CREATE POLICY "tickets_insert"          ON tickets FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "tickets_update_admin"    ON tickets FOR UPDATE USING (is_admin());
CREATE POLICY "tickets_update_employee" ON tickets FOR UPDATE USING (assigned_to = auth.uid());

-- TICKET COMMENTS
CREATE POLICY "comments_select" ON ticket_comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "comments_insert" ON ticket_comments FOR INSERT WITH CHECK (author_id = auth.uid());

-- DOCUMENTS
CREATE POLICY "docs_select_admin"    ON documents FOR SELECT USING (is_admin());
CREATE POLICY "docs_select_employee" ON documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM leads WHERE leads.id = documents.lead_id AND leads.assigned_to = auth.uid()));
CREATE POLICY "docs_insert" ON documents FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- NOTIFICATIONS — own only
CREATE POLICY "notif_select" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notif_update" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- AUDIT LOGS — admins only
CREATE POLICY "audit_select" ON audit_logs FOR SELECT USING (is_admin());
CREATE POLICY "audit_insert" ON audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ═══════════════════════════════════════════════════════════
-- AUTO-UPDATE updated_at TRIGGER
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_leads_updated    BEFORE UPDATE ON leads    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tasks_updated    BEFORE UPDATE ON tasks    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tickets_updated  BEFORE UPDATE ON tickets  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════
-- AUTO-CREATE PROFILE ON SIGNUP
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════
-- SUPABASE STORAGE BUCKET (run separately in Storage tab)
-- ═══════════════════════════════════════════════════════════
-- INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false);
-- Policy: authenticated users upload, admins download all, employees download their client docs only

-- ═══════════════════════════════════════════════════════════
-- SEED: CREATE FIRST ADMIN USER
-- After creating user in Supabase Auth Dashboard, run:
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@myadvisor.in';
-- ═══════════════════════════════════════════════════════════
