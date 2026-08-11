-- ═══════════════════════════════════════════════════════════
-- MIGRATION 009 — Claim type-specific fields (Health / Motor / Non-Motor)
--
-- Rather than adding ~40 mostly-empty columns (most fields only apply to
-- one of the three claim types), this adds a single flexible JSONB column
-- for the type-specific fields. The fields that are common and already
-- useful for search/reports/aging stay as real columns: client_name,
-- policy_number, claim_amount, approved_amount, notes, status.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE claims ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;

-- Restrict claim_type to exactly the three categories now in use.
-- (Not adding a CHECK constraint since existing rows may have old values
-- like 'Death'/'Accident'/'Maturity'/'Surrender' — those stay valid/readable,
-- just no longer offered as options for new claims.)
