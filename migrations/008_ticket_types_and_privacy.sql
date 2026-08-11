-- ═══════════════════════════════════════════════════════════
-- MIGRATION 008 — Ticket type/subtype + fix ticket privacy
--
-- Two fixes:
-- 1. Adds ticket_type / ticket_subtype columns for the dropdown taxonomy.
-- 2. SECURITY: ticket_comments was readable by ANY authenticated user
--    regardless of whether they're on that ticket. This restricts it to
--    the raiser, assignee, tagged participants, and admins only — and
--    extends the same circle to be able to update ticket status (close it).
-- ═══════════════════════════════════════════════════════════

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_type TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_subtype TEXT;

-- Drop the old overly-broad comment policy and replace it with a scoped one.
DROP POLICY IF EXISTS "comments_select" ON ticket_comments;
CREATE POLICY "comments_select_ticket_members" ON ticket_comments FOR SELECT
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_comments.ticket_id
      AND (t.raised_by = auth.uid() OR t.assigned_to = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM ticket_participants p
      WHERE p.ticket_id = ticket_comments.ticket_id AND p.user_id = auth.uid()
    )
  );

-- Let tagged participants (not just the assignee) see the ticket itself.
DROP POLICY IF EXISTS "tickets_select_employee" ON tickets;
CREATE POLICY "tickets_select_employee" ON tickets FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR raised_by = auth.uid()
    OR EXISTS (SELECT 1 FROM ticket_participants p WHERE p.ticket_id = tickets.id AND p.user_id = auth.uid())
  );

-- Let the raiser and tagged participants close/update status too, not just the assignee.
DROP POLICY IF EXISTS "tickets_update_employee" ON tickets;
CREATE POLICY "tickets_update_employee" ON tickets FOR UPDATE
  USING (
    assigned_to = auth.uid()
    OR raised_by = auth.uid()
    OR EXISTS (SELECT 1 FROM ticket_participants p WHERE p.ticket_id = tickets.id AND p.user_id = auth.uid())
  );

-- Participants list itself should only be visible to people already on the ticket (or admin).
DROP POLICY IF EXISTS "ticket_participants_select" ON ticket_participants;
CREATE POLICY "ticket_participants_select_members" ON ticket_participants FOR SELECT
  USING (
    is_admin()
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_participants.ticket_id
      AND (t.raised_by = auth.uid() OR t.assigned_to = auth.uid())
    )
  );
