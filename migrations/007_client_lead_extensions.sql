-- ═══════════════════════════════════════════════════════════
-- MIGRATION 007 — Client RE/RM + category, Lead product/category
-- ═══════════════════════════════════════════════════════════

-- Clients: split single "advisor" into RE (Relationship Executive, existing assigned_to)
-- and RM (Relationship Manager, new). Add client category.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rm_id UUID REFERENCES profiles(id);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rm_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_category TEXT CHECK (client_category IN ('Retail','Corporate'));

-- A client should be visible to their RM too, not just their RE (assigned_to).
DROP POLICY IF EXISTS "clients_select_employee" ON clients;
CREATE POLICY "clients_select_employee" ON clients FOR SELECT
  USING (assigned_to = auth.uid() OR rm_id = auth.uid());

DROP POLICY IF EXISTS "clients_update_employee" ON clients;
CREATE POLICY "clients_update_employee" ON clients FOR UPDATE
  USING (assigned_to = auth.uid() OR rm_id = auth.uid());

-- Leads: category (Fresh / Rollover) for prospecting classification.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_category TEXT CHECK (lead_category IN ('Fresh','Rollover'));

-- documents table already supports lead_id (from the original schema) — reused for lead
-- attachments with a free-typed label instead of a fixed doc_type list. No change needed there.
