import { supabase } from '../../../services/supabase/client';

export async function listClients() {
  const { data, error } = await supabase.from('clients').select('*').order('updated_at', { ascending: false }).limit(1000);
  if (error) throw error;
  return data;
}

export async function getClient(id) {
  const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createClient(payload) {
  const { data, error } = await supabase.from('clients').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateClient(id, payload) {
  const { data, error } = await supabase
    .from('clients')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Duplicate detection: checks mobile + PAN against existing clients before insert.
// Returns an array of potential duplicate matches (empty if none).
export async function findDuplicateClients({ mobile, panNumber, fullName }) {
  const orClauses = [];
  if (mobile) orClauses.push(`mobile.eq.${mobile}`);
  if (panNumber) orClauses.push(`pan_number.eq.${panNumber.toUpperCase()}`);
  if (!orClauses.length) return [];

  const { data, error } = await supabase
    .from('clients')
    .select('id, full_name, mobile, pan_number, email')
    .or(orClauses.join(','));
  if (error) throw error;

  // Also flag close name matches on top of exact mobile/PAN hits, for the UI to show as a softer warning.
  const exact = data ?? [];
  if (fullName && exact.length === 0) {
    const { data: nameMatches } = await supabase
      .from('clients')
      .select('id, full_name, mobile, pan_number, email')
      .ilike('full_name', `%${fullName.trim()}%`)
      .limit(5);
    return (nameMatches ?? []).map((m) => ({ ...m, matchType: 'name' }));
  }

  return exact.map((m) => ({ ...m, matchType: mobile && m.mobile === mobile ? 'mobile' : 'pan' }));
}

export async function listPolicies(clientId) {
  const { data, error } = await supabase
    .from('policies')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createPolicy(payload) {
  const { data, error } = await supabase.from('policies').insert(payload).select().single();
  if (error) throw error;
  return data;
}
