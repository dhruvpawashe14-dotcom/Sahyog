import { supabase } from '../../../services/supabase/client';
import { todayLocalStr, toLocalDateStr } from '../../../utils/date';

export async function fetchDashboardStats({ userId, isAdmin }) {
  const clientsQ = supabase.from('clients').select('id', { count: 'exact', head: true });
  const ticketsQ = supabase.from('tickets').select('id', { count: 'exact', head: true }).neq('status', 'Closed');
  const policiesQ = supabase.from('policies').select('id', { count: 'exact', head: true });
  const followupsQ = supabase.from('leads').select('id', { count: 'exact', head: true }).eq('follow_up_date', todayLocalStr());

  const [clients, tickets, policies, followups] = await Promise.all([clientsQ, ticketsQ, policiesQ, followupsQ]);
  return {
    totalClients: clients.count ?? 0,
    openTickets: tickets.count ?? 0,
    policiesIssued: policies.count ?? 0,
    followupsToday: followups.count ?? 0,
  };
}

// "What needs attention today" — follow-ups, renewals due soon, SLA-breached open tickets, upcoming meetings.
export async function fetchAttentionItems({ userId, isAdmin }) {
  const today = todayLocalStr();
  const in30days = toLocalDateStr(new Date(Date.now() + 30 * 24 * 3600 * 1000));
  const in7days = toLocalDateStr(new Date(Date.now() + 7 * 24 * 3600 * 1000));

  let followupsQ = supabase.from('leads').select('id, full_name, mobile, follow_up_date, assigned_name')
    .lte('follow_up_date', today).not('follow_up_date', 'is', null).order('follow_up_date');
  let renewalsQ = supabase.from('policies').select('id, policy_number, product, renewal_date, client_id, clients(full_name, mobile)')
    .lte('renewal_date', in30days).not('renewal_date', 'is', null).eq('status', 'Active').order('renewal_date');
  let ticketsQ = supabase.from('tickets').select('id, ticket_ref, subject, priority, created_at, assigned_name')
    .not('status', 'in', '(Resolved,Closed)');
  let meetingsQ = supabase.from('meetings').select('id, title, with_name, meeting_date, meeting_time, assigned_name')
    .gte('meeting_date', today).lte('meeting_date', in7days).eq('status', 'Scheduled').order('meeting_date');

  if (!isAdmin) {
    followupsQ = followupsQ.eq('assigned_to', userId);
    ticketsQ = ticketsQ.eq('assigned_to', userId);
    meetingsQ = meetingsQ.eq('assigned_to', userId);
  }

  const [{ data: followups }, { data: renewals }, { data: tickets }, { data: meetings }] = await Promise.all([followupsQ, renewalsQ, ticketsQ, meetingsQ]);

  const SLA_HOURS = { Urgent: 4, High: 24, Medium: 48, Low: 96 };
  const breached = (tickets ?? []).filter((t) => {
    const hours = SLA_HOURS[t.priority] ?? 48;
    return new Date() > new Date(new Date(t.created_at).getTime() + hours * 3600 * 1000);
  });

  return { followups: followups ?? [], renewals: renewals ?? [], breachedTickets: breached, meetings: meetings ?? [] };
}
