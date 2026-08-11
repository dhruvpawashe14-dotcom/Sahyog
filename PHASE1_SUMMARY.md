# Phase 1 — Completed

## What was changed
- Rebuilt from one 1493-line `index.html` into a modular React + Vite app
  (`src/modules/*`, `src/services/*`, `src/components/*`).
- Replaced the hardcoded `TEAM[]` plaintext-password login with real Supabase Auth
  (`signInWithPassword`, session-based, RLS-aware).
- Added a proper `clients` table — previously `leads` doubled as both lead and client record.
- Added `policies` table, linked to clients.
- Added `ticket_participants` table for multi-user ticket tagging (was single assignee only).
- Added SLA tracking on tickets (priority → deadline → on-track/breached badge).
- Added duplicate-client detection (mobile + PAN exact match, name fuzzy match) before save.
- Migrated: dashboard, tickets (list/detail/chat/status workflow), KYC/documents (client-linked),
  audit logging, notifications foundation, global search foundation.

## Files created
Full new tree under `sahyog-v2/` — see file listing. Key ones:
- `src/services/supabase/client.js` — single Supabase client, env-var driven (no hardcoded keys).
- `src/services/auth/authService.js` — real auth.
- `src/context/AuthContext.jsx` — session + role state.
- `src/modules/clients/*` — client list, form (with duplicate check), detail (overview/policies/documents tabs).
- `src/modules/tickets/*` — list (SLA badges), detail (chat, status workflow).
- `src/services/audit/`, `notifications/`, `search/` — shared services.

## Files modified
None — this is a parallel rebuild (`sahyog-v2/`). Your live `index.html` app is untouched
until you're ready to cut over.

## Database changes
- `migrations/002_clients_policies.sql` — new tables + RLS (additive, doesn't touch existing data).
- `migrations/003_storage_buckets.sql` — KYC + ticket attachment buckets.
- No destructive changes. `leads` table untouched (Phase 2 will wire lead→client conversion).

## Environment variables required
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
(Set as Railway service Variables — see `.env.example` for local dev.)

## Features completed (Phase 1 checklist)
✅ Auth (real) · ✅ Roles/permissions (RLS-backed) · ✅ Dashboard foundation · ✅ Global search foundation
✅ Client master DB · ✅ Client detail page · ✅ KYC vault (client-linked) · ✅ Duplicate detection
✅ Policies · ✅ Ticket system · ✅ Multi-user ticket tagging · ✅ Ticket messaging/attachments
✅ Ticket status workflow · ✅ Ticket SLA · ✅ Audit trail · ✅ Notifications foundation

Not yet done (explicitly Phase 2/3 per your spec): leads pipeline UI, claims module, tasks
module UI, meetings/calendar, Excel import/export, analytics dashboards, employees/settings admin
screens. Services layer is structured so these slot in without touching Phase 1 code.

## Testing performed
- `npm run build` — clean production build, no errors (407 KB bundle, gzipped 117 KB).
- Not yet tested against a live Supabase project (needs your real URL/anon key + migrations run).

## Known issues / things to do before go-live
1. **You must run migrations 002 and 003** on your existing Supabase project.
2. **You must create real Supabase Auth users** for your team (see `migrations/README.md`) —
   old plaintext passwords will not work and should be considered compromised (they were visible
   in browser source). Treat this as a required password rotation.
3. Old `documents.lead_id` records won't automatically show under the new `clients` — no
   auto-migration script written yet for lead→client backfill (flag if you want this before cutover).
4. `inviteTeamMember()` in authService references a Supabase Edge Function
   (`admin-create-user`) that doesn't exist yet — for Phase 1 use the Dashboard to add users
   manually (see migrations README); build the Edge Function in Phase 3 (Admin Management) if wanted.

## How to deploy
1. Run migrations 002 + 003 in Supabase SQL Editor.
2. Create Supabase Auth users for your team, promote admins.
3. Push `sahyog-v2/` to GitHub (new repo or new branch — your call).
4. On Railway: new service pointed at that repo, set `VITE_SUPABASE_URL` /
   `VITE_SUPABASE_ANON_KEY` variables. `railway.json` handles build/start.

## Git commit recommendation
Since this is a fresh parallel codebase, one initial commit is reasonable:
`feat: Phase 1 — modular React rebuild (auth, clients, tickets, kyc, audit)`
Then follow your requested convention (`feat(module): ...`) from Phase 2 onward.

---
Waiting for your instruction to start **Phase 2**.
