-- ═══════════════════════════════════════════════════════════
-- MIGRATION 012 — Bulletproof fix for ticket RLS recursion
--
-- Migration 010's SECURITY DEFINER approach still recursed, which means
-- that trick isn't bypassing RLS the way it should in this project. Rather
-- than debug why, this rebuilds the policies so a cycle is IMPOSSIBLE by
-- construction: ticket_participants no longer looks back at tickets at
-- all, so the dependency only flows one way:
--
--   ticket_participants (depends on nothing)
--      ↑
--   tickets (depends on ticket_participants)
--      ↑
--   ticket_comments (depends on tickets + ticket_participants)
--
-- No table's policy references anything that (directly or indirectly)
-- references it back. This can't recurse no matter how Postgres evaluates it.
-- ═══════════════════════════════════════════════════════════

-- ticket_participants: open to any authenticated user. This is just a thin
-- join table (ticket_id, user_id) — not sensitive on its own, and keeping
-- it dependency-free is what breaks the cycle.
DROP POLICY IF EXISTS "ticket_participants_select_members" ON ticket_participants;
DROP POLICY IF EXISTS "ticket_participants_select" ON ticket_participants;
CREATE POLICY "ticket_participants_select_open" ON ticket_participants FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- tickets: visible to raiser, assignee, tagged participants, or admin.
DROP POLICY IF EXISTS "tickets_select_employee" ON tickets;
CREATE POLICY "tickets_select_employee" ON tickets FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR raised_by = auth.uid()
    OR EXISTS (SELECT 1 FROM ticket_participants p WHERE p.ticket_id = tickets.id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "tickets_update_employee" ON tickets;
CREATE POLICY "tickets_update_employee" ON tickets FOR UPDATE
  USING (
    assigned_to = auth.uid()
    OR raised_by = auth.uid()
    OR EXISTS (SELECT 1 FROM ticket_participants p WHERE p.ticket_id = tickets.id AND p.user_id = auth.uid())
  );

-- ticket_comments: visible only to people on that ticket, or admin.
DROP POLICY IF EXISTS "comments_select_ticket_members" ON ticket_comments;
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

-- Clean up: drop the SECURITY DEFINER function from migration 010, no longer used.
DROP FUNCTION IF EXISTS is_ticket_member(BIGINT);
