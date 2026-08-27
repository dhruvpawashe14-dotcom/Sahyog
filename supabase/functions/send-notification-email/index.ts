// Supabase Edge Function — daily reminder for tickets that have gone stale.
// Deploy: supabase functions deploy ticket-reminders
// Schedule: Supabase Dashboard → Edge Functions → ticket-reminders → Cron,
//   e.g. "0 9 * * *" (9am daily). This function does NOT need to be public —
//   the scheduler calls it with the service role automatically.
//
// Logic: any ticket not in a closed-ish status (Resolved / Closed / Claim Settled)
// whose updated_at is more than REMINDER_AFTER_HOURS old, and hasn't already been
// reminded in the last REMINDER_COOLDOWN_HOURS, gets one in-app notification sent
// to its assignee (and raiser, if different). Then last_reminded_at is stamped so
// it won't nag again until the cooldown passes.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const REMINDER_AFTER_HOURS = 24;
const REMINDER_COOLDOWN_HOURS = 24;
const CLOSED_STATUSES = ['Resolved', 'Closed', 'Claim Settled'];

Deno.serve(async () => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );

    const staleBefore = new Date(Date.now() - REMINDER_AFTER_HOURS * 3600 * 1000).toISOString();
    const cooldownBefore = new Date(Date.now() - REMINDER_COOLDOWN_HOURS * 3600 * 1000).toISOString();

    const { data: tickets, error } = await supabaseAdmin
      .from('tickets')
      .select('id, ticket_ref, subject, status, assigned_to, raised_by, updated_at, last_reminded_at')
      .not('status', 'in', `(${CLOSED_STATUSES.map((s) => `"${s}"`).join(',')})`)
      .lt('updated_at', staleBefore)
      .or(`last_reminded_at.is.null,last_reminded_at.lt.${cooldownBefore}`);

    if (error) throw error;

    let reminded = 0;
    for (const ticket of tickets ?? []) {
      const targets = [...new Set([ticket.assigned_to, ticket.raised_by].filter(Boolean))];
      for (const userId of targets) {
        await supabaseAdmin.from('notifications').insert({
          user_id: userId,
          title: `Reminder: ${ticket.ticket_ref} still ${ticket.status}`,
          body: ticket.subject,
          type: 'warning',
          link_type: 'ticket',
          link_id: ticket.id,
        });
      }
      await supabaseAdmin.from('tickets').update({ last_reminded_at: new Date().toISOString() }).eq('id', ticket.id);
      reminded++;
    }

    return new Response(JSON.stringify({ ok: true, reminded }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
