import { supabase } from '../../../services/supabase/client';

export async function listMeetings({ userId, isAdmin, from, to }) {
  let q = supabase.from('meetings').select('*').order('meeting_date', { ascending: true });
  if (!isAdmin) q = q.eq('assigned_to', userId);
  if (from) q = q.gte('meeting_date', from);
  if (to) q = q.lte('meeting_date', to);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function createMeeting(payload) {
  const { data, error } = await supabase.from('meetings').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateMeetingStatus(id, status) {
  const { error } = await supabase.from('meetings').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}
