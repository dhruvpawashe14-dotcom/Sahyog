import { supabase } from '../../../services/supabase/client';

export async function listEmployees() {
  const { data, error } = await supabase.from('profiles').select('*').order('full_name');
  if (error) throw error;
  return data;
}

export async function updateEmployeeRole(id, role) {
  const { error } = await supabase.from('profiles').update({ role, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function updateEmployeeStatus(id, status) {
  const { error } = await supabase.from('profiles').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function fetchSetting(key) {
  const { data, error } = await supabase.from('app_settings').select('*').eq('key', key).single();
  if (error) return null;
  return data;
}

export async function fetchAllSettings() {
  const { data, error } = await supabase.from('app_settings').select('*');
  if (error) throw error;
  return data;
}

export async function updateSetting(key, value, userId) {
  const { error } = await supabase.from('app_settings').upsert({ key, value, updated_by: userId, updated_at: new Date().toISOString() });
  if (error) throw error;
}
