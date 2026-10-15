-- ═══════════════════════════════════════════════════════════
-- MIGRATION 018 — Split client names, ticket client name, duplicate guard
--
-- 1) clients: first_name / middle_name / last_name. full_name stays as the
--    composed display value so every existing screen keeps working.
--    Existing rows are backfilled by splitting full_name on spaces
--    (first word = first, last word = last, anything between = middle).
--    Rows that were typed surname-first stay as typed — fix those by hand.
--
-- 2) tickets: client_name (which client the ticket is about).
--
-- 3) Duplicate guard: a lead can only ever convert into ONE client.
--    The index is created only if no duplicates exist yet; otherwise a
--    NOTICE tells you to clean up first (query below).
--
--    Find existing duplicate conversions:
--      SELECT source_lead_id, COUNT(*), array_agg(id ORDER BY id) AS client_ids
--      FROM clients WHERE source_lead_id IS NOT NULL
--      GROUP BY source_lead_id HAVING COUNT(*) > 1;
-- ═══════════════════════════════════════════════════════════

ALTER TABLE clients ADD COLUMN IF NOT EXISTS first_name  TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS middle_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_name   TEXT;

WITH parts AS (
  SELECT id, regexp_split_to_array(trim(full_name), '\s+') AS p
  FROM clients WHERE first_name IS NULL AND full_name IS NOT NULL
)
UPDATE clients c SET
  first_name  = parts.p[1],
  last_name   = CASE WHEN array_length(parts.p, 1) > 1 THEN parts.p[array_length(parts.p, 1)] END,
  middle_name = CASE WHEN array_length(parts.p, 1) > 2
                     THEN array_to_string(parts.p[2:array_length(parts.p, 1) - 1], ' ') END
FROM parts WHERE c.id = parts.id;

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS client_name TEXT;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM clients WHERE source_lead_id IS NOT NULL
             GROUP BY source_lead_id HAVING COUNT(*) > 1) THEN
    RAISE NOTICE 'Duplicate clients exist for the same lead — clean them up, then re-run this block to add the unique index.';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS uq_clients_source_lead
      ON clients(source_lead_id) WHERE source_lead_id IS NOT NULL;
  END IF;
END $$;
