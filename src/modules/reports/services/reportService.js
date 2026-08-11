import { supabase } from '../../../services/supabase/client';

export async function fetchLeadsByStage() {
  const { data, error } = await supabase.from('leads').select('stage');
  if (error) throw error;
  const counts = {};
  data.forEach((l) => { counts[l.stage] = (counts[l.stage] || 0) + 1; });
  return counts;
}

export async function fetchProductMix() {
  const { data, error } = await supabase.from('leads').select('product');
  if (error) throw error;
  const counts = {};
  data.forEach((l) => { const p = l.product || 'Unspecified'; counts[p] = (counts[p] || 0) + 1; });
  return counts;
}

export async function fetchConversionStats() {
  const { data, error } = await supabase.from('leads').select('stage');
  if (error) throw error;
  const total = data.length;
  const won = data.filter((l) => l.stage === 'Closed Won' || l.stage === 'Policy Issued').length;
  return { total, won, rate: total ? Math.round((won / total) * 100) : 0 };
}

export async function fetchEmployeeProductivity() {
  const [{ data: leads }, { data: tickets }, { data: claims }] = await Promise.all([
    supabase.from('leads').select('assigned_name, stage'),
    supabase.from('tickets').select('assigned_name, status'),
    supabase.from('claims').select('assigned_name, status'),
  ]);
  const byName = {};
  const bump = (name, key) => {
    if (!name) return;
    byName[name] = byName[name] || { name, leads: 0, leadsWon: 0, tickets: 0, ticketsClosed: 0, claims: 0, claimsSettled: 0 };
    byName[name][key]++;
  };
  (leads ?? []).forEach((l) => { bump(l.assigned_name, 'leads'); if (['Closed Won', 'Policy Issued'].includes(l.stage)) bump(l.assigned_name, 'leadsWon'); });
  (tickets ?? []).forEach((t) => { bump(t.assigned_name, 'tickets'); if (t.status === 'Closed') bump(t.assigned_name, 'ticketsClosed'); });
  (claims ?? []).forEach((c) => { bump(c.assigned_name, 'claims'); if (c.status === 'Settled') bump(c.assigned_name, 'claimsSettled'); });
  return Object.values(byName);
}
