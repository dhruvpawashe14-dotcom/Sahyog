import { supabase } from '../../../services/supabase/client';

export async function listTasks() {
  const { data, error } = await supabase.from('tasks').select('*').order('due_date', { ascending: true }).limit(1000);
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
