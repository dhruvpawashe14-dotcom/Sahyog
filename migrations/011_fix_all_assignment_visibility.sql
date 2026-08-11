-- ═══════════════════════════════════════════════════════════
-- MIGRATION 011 — Fix save failures across Leads, Tasks, Claims, Meetings
--
-- Same root cause as migration 010's client fix: when you create a record
-- and assign it to a colleague (not yourself), Supabase tries to hand back
-- the saved row through a SELECT that's still subject to RLS. If the
-- visibility rule only allows "assigned_to = auth.uid()", that SELECT is
-- denied for the creator, and the whole save fails — even though the
-- INSERT itself succeeded. This affected every module with an assignee
-- picker: Leads, Tasks, Claims, Meetings.
--
-- Ticket visibility is intentionally left untouched — you asked for that
-- to stay restricted to raiser/assignee/tagged members only.
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "leads_select_employee" ON leads;
CREATE POLICY "leads_select_all_authenticated" ON leads FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "activities_select" ON lead_activities;
CREATE POLICY "activities_select_all_authenticated" ON lead_activities FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "docs_select_employee" ON documents;
-- (the client-based documents policy was already fixed team-wide in migration 010;
--  this drops the older leftover leads-based one so it can't conflict)

DROP POLICY IF EXISTS "tasks_select_employee" ON tasks;
CREATE POLICY "tasks_select_all_authenticated" ON tasks FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "claims_select_employee" ON claims;
CREATE POLICY "claims_select_all_authenticated" ON claims FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "claim_activities_select" ON claim_activities;
CREATE POLICY "claim_activities_select_all_authenticated" ON claim_activities FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "claim_documents_select" ON claim_documents;
CREATE POLICY "claim_documents_select_all_authenticated" ON claim_documents FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "meetings_select_employee" ON meetings;
CREATE POLICY "meetings_select_all_authenticated" ON meetings FOR SELECT
  USING (auth.uid() IS NOT NULL);
