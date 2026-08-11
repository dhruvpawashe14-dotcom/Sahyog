import { supabase } from '../../../services/supabase/client';
import { todayLocalStr, toLocalDateStr } from '../../../utils/date';

export async function fetchDashboardStats({ userId }) {
  const clientsQ = supabase.from('clients').select('id', { count: 'exact', head: true });
  const leadsQ = supabase.from('leads').select('id', { count: 'exact', head: true }).not('stage', 'in', '(Closed Won,Closed Lost,Policy Issued)');
  const ticketsQ = supabase.from('tickets').select('id', { count: 'exact', head: true }).neq('status', 'Closed');
  const claimsQ = supabase.from('claims').select('id', { count: 'exact', head: true }).not('status', 'in', '(Settled,Rejected)');
  const tasksQ = supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('due_date', todayLocalStr()).neq('status', 'Completed');
  const policiesQ = supabase.from('policies').select('id', { count: 'exact', head: true });

  const [clients, leads, tickets, claims, tasks, policies] = await Promise.all([clientsQ, leadsQ, ticketsQ, claimsQ, tasksQ, policiesQ]);
  return {
    totalClients: clients.count ?? 0,
    activeLeads: leads.count ?? 0,
    openTickets: tickets.count ?? 0,
    claimsInProgress: claims.count ?? 0,
    tasksDueToday: tasks.count ?? 0,
    policiesIssued: policies.count ?? 0,
  };
}

// "What needs my attention today" — personal to-do style widget, intentionally scoped to
// the logged-in user (unlike the team-wide list pages) since it answers "what's on ME".
export async function fetchAttentionItems({ userId }) {
  const today = todayLocalStr();
  const in30days = toLocalDateStr(new Date(Date.now() + 30 * 24 * 3600 * 1000));
  const in7days = toLocalDateStr(new Date(Date.now() + 7 * 24 * 3600 * 1000));

  const followupsQ = supabase.from('leads').select('id, full_name, mobile, follow_up_date, assigned_name')
    .lte('follow_up_date', today).not('follow_up_date', 'is', null).eq('assigned_to', userId).order('follow_up_date');
  const renewalsQ = supabase.from('policies').select('id, policy_number, product, renewal_date, client_id, clients(full_name, mobile)')
    .lte('renewal_date', in30days).not('renewal_date', 'is', null).eq('status', 'Active').order('renewal_date');
  const ticketsQ = supabase.from('tickets').select('id, ticket_ref, subject, priority, created_at, assigned_name')
    .not('status', 'in', '(Resolved,Closed)').eq('assigned_to', userId);
  const meetingsQ = supabase.from('meetings').select('id, title, with_name, meeting_date, meeting_time, assigned_name')
    .gte('meeting_date', today).lte('meeting_date', in7days).eq('status', 'Scheduled').eq('assigned_to', userId).order('meeting_date');

  const [{ data: followups }, { data: renewals }, { data: tickets }, { data: meetings }] = await Promise.all([followupsQ, renewalsQ, ticketsQ, meetingsQ]);

  const SLA_HOURS = { Urgent: 4, High: 24, Medium: 48, Low: 96 };
  const breached = (tickets ?? []).filter((t) => {
    const hours = SLA_HOURS[t.priority] ?? 48;
    return new Date() > new Date(new Date(t.created_at).getTime() + hours * 3600 * 1000);
  });

  return { followups: followups ?? [], renewals: renewals ?? [], breachedTickets: breached, meetings: meetings ?? [] };
}

// Admin-only team activity feed. Reuses the existing admin-gated audit_logs RLS policy —
// intentionally NOT opened to everyone, since audit entries include private ticket subjects.
export async function fetchRecentActivity(limit = 8) {
  const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) return []; // non-admins get a permission error here — fail quietly, panel just won't show
  return data;
}
