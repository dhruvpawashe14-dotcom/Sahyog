import { supabase } from '../../../services/supabase/client';

export async function listTasks({ userId, isAdmin }) {
  let q = supabase.from('tasks').select('*').order('due_date', { ascending: true });
  if (!isAdmin) q = q.eq('assigned_to', userId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function createTask(payload) {
  const { data, error } = await supabase.from('tasks').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateTaskStatus(id, status) {
  const { error } = await supabase.from('tasks').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}
