import { supabase } from '../supabase/client';

export async function fetchMyNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return data;
}

export async function markRead(id) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

export async function notify({ userId, title, body, type = 'info', linkType, linkId }) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    body,
    type,
    link_type: linkType ?? null,
    link_id: linkId ?? null,
  });
  if (error) throw error;

  // Email fallback — best-effort, never blocks or fails the in-app notification above.
  // If the Edge Function isn't deployed yet, this just fails silently and logs a warning.
  supabase.functions.invoke('send-notification-email', { body: { userId, title, body } })
    .catch((e) => console.warn('Email notification failed (in-app notification still succeeded):', e.message));
}

export function subscribeToNotifications(userId, onInsert) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => onInsert(payload.new)
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}
