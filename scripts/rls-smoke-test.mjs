// RLS Access Control Smoke Test
// ================================
// This is NOT part of `npm test` — it makes real network calls against your live
// Supabase project using two real user accounts, so it needs credentials and shouldn't
// run in CI. Run it manually after any RLS/migration change to catch regressions like
// the ticket-visibility bugs found during development.
//
// Usage:
//   1. Create two test accounts in Supabase Auth (or reuse two real employee accounts
//      who are NOT admins) — e.g. test-a@myadvisor.in and test-b@myadvisor.in.
//   2. Set env vars and run:
//        VITE_SUPABASE_URL=https://xxx.supabase.co \
//        VITE_SUPABASE_ANON_KEY=your-anon-key \
//        TEST_USER_A_EMAIL=test-a@myadvisor.in TEST_USER_A_PASSWORD=... \
//        TEST_USER_B_EMAIL=test-b@myadvisor.in TEST_USER_B_PASSWORD=... \
//        node scripts/rls-smoke-test.mjs
//
// What it checks:
//   - User A can create a ticket assigned only to themselves.
//   - User B (not raiser, not assignee, not tagged) CANNOT see that ticket.
//   - User B CAN see a client record created by User A (clients are team-wide by design).
//   - Cleans up the test records it creates.

import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const emailA = process.env.TEST_USER_A_EMAIL;
const passA = process.env.TEST_USER_A_PASSWORD;
const emailB = process.env.TEST_USER_B_EMAIL;
const passB = process.env.TEST_USER_B_PASSWORD;

if (!url || !anonKey || !emailA || !passA || !emailB || !passB) {
  console.error('Missing required env vars. See the comment at the top of this script.');
  process.exit(1);
}

let failures = 0;
function check(label, condition) {
  if (condition) {
    console.log(`✓ ${label}`);
  } else {
    console.error(`✗ FAILED: ${label}`);
    failures++;
  }
}

async function main() {
  const clientA = createClient(url, anonKey);
  const clientB = createClient(url, anonKey);

  const { data: sessionA, error: errA } = await clientA.auth.signInWithPassword({ email: emailA, password: passA });
  if (errA) { console.error('User A login failed:', errA.message); process.exit(1); }
  const { data: sessionB, error: errB } = await clientB.auth.signInWithPassword({ email: emailB, password: passB });
  if (errB) { console.error('User B login failed:', errB.message); process.exit(1); }

  console.log(`Logged in as A (${emailA}) and B (${emailB})\n`);

  // --- Test 1: ticket privacy ---
  const { data: ticket, error: ticketErr } = await clientA.from('tickets').insert({
    subject: '[RLS TEST] private ticket', priority: 'Low',
    raised_by: sessionA.user.id, raised_name: 'Test A',
    assigned_to: sessionA.user.id, assigned_name: 'Test A',
  }).select().single();
  check('User A can create a ticket assigned to themselves', !ticketErr && ticket);

  if (ticket) {
    const { data: seenByB } = await clientB.from('tickets').select('*').eq('id', ticket.id);
    check('User B (uninvolved) cannot see that ticket', !seenByB || seenByB.length === 0);

    await clientA.from('tickets').delete().eq('id', ticket.id); // cleanup
  }

  // --- Test 2: client team-wide visibility ---
  const { data: client, error: clientErr } = await clientA.from('clients').insert({
    full_name: '[RLS TEST] Test Client', mobile: '9999999999',
    assigned_to: sessionA.user.id, assigned_name: 'Test A', created_by: sessionA.user.id,
  }).select().single();
  check('User A can create a client', !clientErr && client);

  if (client) {
    const { data: seenByB } = await clientB.from('clients').select('*').eq('id', client.id);
    check('User B CAN see a client created by A (team-wide by design)', seenByB && seenByB.length === 1);

    await clientA.from('clients').delete().eq('id', client.id); // cleanup
  }

  console.log(`\n${failures === 0 ? '✓ All checks passed' : `✗ ${failures} check(s) failed`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
