// Real Supabase Auth. Replaces the old hardcoded TEAM[] array + plaintext passwords.
// Session lives in Supabase's own storage; profile row (role, name) is fetched separately.
import { supabase } from '../supabase/client';

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const profile = await fetchOwnProfile();
  return { session: data.session, profile };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function fetchOwnProfile() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userData.user.id)
    .single();
  if (error) throw error;
  return data;
}

// Admin-only: create a new team member. Requires an invite/service-role edge function
// in production (anon key cannot create auth users) — this calls a Supabase Edge Function
// 'admin-create-user' that must be deployed separately with the service role key server-side.
export async function inviteTeamMember({ email, fullName, role }) {
  const { data, error } = await supabase.functions.invoke('admin-create-user', {
    body: { email, fullName, role },
  });
  if (error) throw error;
  return data;
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}
