# MyAdvisor CRM — Migrations

Run in order, once, in Supabase SQL Editor:

1. `001_initial_schema.sql` — your existing schema (already live in prod — skip if already applied).
2. `002_clients_policies.sql` — new `clients` + `policies` tables, ticket participants, RLS.
3. `003_storage_buckets.sql` — KYC + ticket attachment storage buckets and policies.

## Migrating existing users off the old plaintext TEAM[] array

The old app authenticated against a hardcoded array in `index.html`. The new app uses real
Supabase Auth. You need to create one Supabase Auth user per team member:

1. Supabase Dashboard → Authentication → Users → Add User, for each person in the old `TEAM[]`
   list (use their existing email, set a new password — do NOT reuse the old plaintext ones).
2. The `handle_new_user()` trigger (from 001) auto-creates their `profiles` row with role
   `employee` by default.
3. Promote admins manually:
   `UPDATE profiles SET role = 'admin' WHERE email = 'dhruvpawashe@uppercrustwealth.com';`
4. Send each team member their new password via a secure channel (not email in plaintext).

This is a one-time manual step — after that, self-service password reset via Supabase Auth
works normally.
