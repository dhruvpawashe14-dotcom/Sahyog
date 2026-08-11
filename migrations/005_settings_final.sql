-- ═══════════════════════════════════════════════════════════
-- MIGRATION 005 — App settings + final RLS hardening (Phase 3)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS app_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  updated_by  UUID REFERENCES profiles(id),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_settings (key, value) VALUES
  ('company_name', 'MyAdvisor Insurance Pvt. Ltd.'),
  ('admin_email', 'dhruvpawashe@uppercrustwealth.com')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_select" ON app_settings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "settings_update_admin" ON app_settings FOR UPDATE USING (is_admin());

-- Security review: confirm every table has RLS enabled (should already be true from prior
-- migrations, this is a safety net in case any table slipped through).
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads               ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies            ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims              ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_activities    ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_documents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings        ENABLE ROW LEVEL SECURITY;

-- Admins can update any profile's role (needed for the new Employees admin screen).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_update_admin_role') THEN
    CREATE POLICY "profiles_update_admin_role" ON profiles FOR UPDATE USING (is_admin());
  END IF;
END $$;
