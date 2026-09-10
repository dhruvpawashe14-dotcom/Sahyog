-- ═══════════════════════════════════════════════════════════
-- MIGRATION 014 — Ticket status CHECK fix + follow-up query
-- tracking + missing scale indexes
--
-- WHY THIS MIGRATION EXISTS (read before running):
--
-- 1. CRITICAL BUG: migration 001 created `tickets.status` with
--    CHECK (status IN ('Open','In Progress','Waiting','Resolved','Closed')).
--    No later migration ever updated that constraint. But
--    src/modules/tickets/constants.js (the actual dropdown the app
--    uses) has ALWAYS offered 10 statuses, including 'Quote Sent',
--    'Policy Sent', 'Payment Pending', 'Claim Intimated',
--    'Claim Settled', 'Waiting on Client' — none of which the old
--    constraint allows. Every one of those updates fails at the
--    database with a 23514 constraint-violation error. This was
--    likely masked in dev only because it appears some of these
--    values were written before the constraint was strictly
--    enforced / via direct table edits. On a clean database built
--    from these migrations, staff selecting "Quote Sent" (a
--    routine, frequent action) will hit a hard error. This
--    migration rebuilds the constraint to match the app's real
--    status list.
--
-- 2. FEATURE — follow-up queries on an already-open ticket:
--    Today "days/hours open" is always measured from created_at.
--    If a ticket sits open for a month, gets its first request
--    fulfilled, and the client then asks a *second* question on
--    the same ticket, the ticket still shows "30d open" — which
--    reads as an abandoned/neglected ticket to anyone scanning the
--    list, even though staff responded promptly to the second ask.
--    Adds `query_count` and `last_query_at` so the UI can measure
--    "open for" from the latest follow-up instead of the original
--    creation date, while still keeping the true origin date
--    available for reporting/SLA purposes.
--
-- 3. Missing indexes that matter once real day-to-day ticket
--    volume builds up across the whole team.
-- ═══════════════════════════════════════════════════════════

-- ── 1. Fix the stale status CHECK constraint ──────────────────
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_status_check CHECK (
  status IN (
    'Open', 'In Progress', 'Quote Sent', 'Policy Sent', 'Payment Pending',
    'Claim Intimated', 'Claim Settled', 'Waiting on Client', 'Resolved', 'Closed'
  )
);

-- ── 2. Follow-up query tracking ───────────────────────────────
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS query_count INTEGER NOT NULL DEFAULT 1;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS last_query_at TIMESTAMPTZ;

-- Backfill: every existing ticket's most recent query is, by definition,
-- its creation (we have no way to know past follow-ups retroactively).
UPDATE tickets SET last_query_at = created_at WHERE last_query_at IS NULL;

ALTER TABLE tickets ALTER COLUMN last_query_at SET DEFAULT NOW();
ALTER TABLE tickets ALTER COLUMN last_query_at SET NOT NULL;

-- ── 3. Scale indexes ───────────────────────────────────────────
-- Non-admin ticket list filters on raised_by as well as assigned_to;
-- only the latter was indexed.
CREATE INDEX IF NOT EXISTS idx_tickets_raised_by ON tickets(raised_by);
-- Every list view sorts by created_at DESC.
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
-- Every ticket detail view loads all comments for one ticket, in order.
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_created ON ticket_comments(ticket_id, created_at);
-- Non-admin ticket list looks up "which tickets is this user tagged on"
-- by user_id — the existing UNIQUE(ticket_id, user_id) index doesn't
-- help that lookup direction.
CREATE INDEX IF NOT EXISTS idx_ticket_participants_user ON ticket_participants(user_id);
