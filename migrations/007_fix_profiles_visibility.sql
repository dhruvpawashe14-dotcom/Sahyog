-- ═══════════════════════════════════════════════════════════
-- MIGRATION 007 — Fix: team members invisible in Assign To dropdowns
--
-- Root cause: the original schema only let each user SELECT their own
-- profiles row. That's fine for a consumer app, but wrong for an internal
-- CRM — everyone on the team needs to see the full roster to assign work
-- to each other. This adds that missing policy.
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "profiles_select_all_authenticated" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);
