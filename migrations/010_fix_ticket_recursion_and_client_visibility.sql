-- ═══════════════════════════════════════════════════════════
-- MIGRATION 010 — Fix ticket RLS infinite recursion + make
-- clients/KYC visible to the whole team, not just the assigned advisor
--
-- BUG 1: Migration 008's tickets policy checked ticket_participants, and
-- ticket_participants' policy checked tickets right back — Postgres can't
-- resolve that circular check ("infinite recursion detected"). Fixed with
-- a SECURITY DEFINER helper function, same pattern as is_admin() below,
-- which breaks the cycle by bypassing RLS for just that internal check.
--
-- BUG 2 (by request): clients and their KYC documents should be visible
-- to the whole team, not locked to whoever they're assigned to. Ticket
-- privacy (raiser/assignee/tagged-only) is intentionally different and
-- stays as-is — that was a deliberate, separate request.
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION is_ticket_member(ticket_id_param BIGINT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tickets t
    WHERE t.id = ticket_id_param
    AND (t.raised_by = auth.uid() OR t.assigned_to = auth.uid())
  ) OR EXISTS (
    SELECT 1 FROM ticket_participants p
    WHERE p.ticket_id = ticket_id_param AND p.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

DROP POLICY IF EXISTS "tickets_select_employee" ON tickets;
CREATE POLICY "tickets_select_employee" ON tickets FOR SELECT
  USING (assigned_to = auth.uid() OR raised_by = auth.uid() OR is_ticket_member(id));

DROP POLICY IF EXISTS "tickets_update_employee" ON tickets;
CREATE POLICY "tickets_update_employee" ON tickets FOR UPDATE
  USING (assigned_to = auth.uid() OR raised_by = auth.uid() OR is_ticket_member(id));

DROP POLICY IF EXISTS "ticket_participants_select_members" ON ticket_participants;
CREATE POLICY "ticket_participants_select_members" ON ticket_participants FOR SELECT
  USING (is_admin() OR user_id = auth.uid() OR is_ticket_member(ticket_id));

DROP POLICY IF EXISTS "comments_select_ticket_members" ON ticket_comments;
CREATE POLICY "comments_select_ticket_members" ON ticket_comments FOR SELECT
  USING (is_admin() OR is_ticket_member(ticket_id));

-- ─── Clients & KYC visible to the whole team ───────────────────────────
DROP POLICY IF EXISTS "clients_select_employee" ON clients;
CREATE POLICY "clients_select_all_authenticated" ON clients FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "docs_select_client_employee" ON documents;
DROP POLICY IF EXISTS "docs_select_admin" ON documents;
CREATE POLICY "docs_select_all_authenticated" ON documents FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policies (tied 1:1 with a client) should follow the same team-wide visibility.
DROP POLICY IF EXISTS "policies_select" ON policies;
CREATE POLICY "policies_select_all_authenticated" ON policies FOR SELECT
  USING (auth.uid() IS NOT NULL);
