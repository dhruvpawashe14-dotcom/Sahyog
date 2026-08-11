import { supabase } from '../../../services/supabase/client';

export async function fetchDashboardStats({ userId, isAdmin }) {
  const clientsQ = supabase.from('clients').select('id', { count: 'exact', head: true });
  const ticketsQ = supabase.from('tickets').select('id', { count: 'exact', head: true }).neq('status', 'Closed');
  const policiesQ = supabase.from('policies').select('id', { count: 'exact', head: true });
  const followupsQ = supabase.from('leads').select('id', { count: 'exact', head: true }).eq('follow_up_date', new Date().toISOString().slice(0, 10));

  if (!isAdmin) {
    clientsQ.eq('assigned_to', userId);
  }

  const [clients, tickets, policies, followups] = await Promise.all([clientsQ, ticketsQ, policiesQ, followupsQ]);
  return {
    totalClients: clients.count ?? 0,
    openTickets: tickets.count ?? 0,
    policiesIssued: policies.count ?? 0,
    followupsToday: followups.count ?? 0,
  };
}
