import { supabase } from '../supabase/client';

// Global search foundation — Phase 1 scope: clients + tickets by name/mobile/PAN/subject.
// Phase 3 will expand this (fuzzy matching, claims, leads, full-text indexes).
export async function globalSearch(query) {
  const q = query.trim();
  if (!q) return { clients: [], tickets: [] };

  const [clientsRes, ticketsRes] = await Promise.all([
    supabase
      .from('clients')
      .select('id, full_name, mobile, email, pan_number')
      .or(`full_name.ilike.%${q}%,mobile.ilike.%${q}%,pan_number.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(8),
    supabase
      .from('tickets')
      .select('id, ticket_ref, subject, status')
      .or(`subject.ilike.%${q}%,ticket_ref.ilike.%${q}%`)
      .limit(8),
  ]);

  return {
    clients: clientsRes.data ?? [],
    tickets: ticketsRes.data ?? [],
  };
}
