-- ═══════════════════════════════════════════════════════════
-- MIGRATION 017 — Employee leave scheduling
--
-- profiles.status already supports 'Active' / 'On Leave' / 'Inactive'
-- (migration 001), but nothing let anyone schedule a leave *in advance* —
-- someone had to remember to flip the dropdown on the actual day. This
-- adds a date range so an admin can set it ahead of time and the status
-- shown across the app (assign/tag pickers, employee list) automatically
-- reflects "On Leave" during that window, without a manual flip.
--
-- This is purely additive — no existing column, constraint, or row is
-- changed.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS leave_from DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS leave_to   DATE;
