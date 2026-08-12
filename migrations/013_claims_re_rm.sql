-- ═══════════════════════════════════════════════════════════
-- MIGRATION 013 — Claims: RE/RM dropdowns (mirrors clients pattern)
-- ═══════════════════════════════════════════════════════════

ALTER TABLE claims ADD COLUMN IF NOT EXISTS rm_id UUID REFERENCES profiles(id);
ALTER TABLE claims ADD COLUMN IF NOT EXISTS rm_name TEXT;

-- Fix existing lowercase names at the source (display-time capitalization is also
-- being added as a safety net, but fixing the actual data is better).
UPDATE profiles SET full_name = INITCAP(full_name) WHERE full_name IS NOT NULL;
