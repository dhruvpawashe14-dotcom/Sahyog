import { supabase } from '../../../services/supabase/client';
import { validateFileSize } from '../../../utils/validators';

const SLA_HOURS = { Urgent: 4, High: 24, Medium: 48, Low: 96 };

export function slaDeadline(ticket) {
  const hours = SLA_HOURS[ticket.priority] ?? 48;
  return new Date(new Date(ticket.created_at).getTime() + hours * 3600 * 1000);
}

export function slaStatus(ticket) {
  if (['Resolved', 'Closed'].includes(ticket.status)) return 'met';
  const deadline = slaDeadline(ticket);
  return new Date() > deadline ? 'breached' : 'on-track';
}

export async function listTickets({ userId, userName, isAdmin }) {
  if (isAdmin) {
    const { data, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false }).limit(1000);
    if (error) throw error;
    return data;
  }
  // Non-admins see tickets they raised, are assigned, OR were tagged as a participant on.
  const [{ data: own, error: e1 }, { data: participantRows, error: e2 }] = await Promise.all([
    supabase.from('tickets').select('*').or(`assigned_to.eq.${userId},raised_by.eq.${userId}`),
    supabase.from('ticket_participants').select('ticket_id').eq('user_id', userId),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;

  const participantTicketIds = (participantRows ?? []).map((r) => r.ticket_id);
  let tagged = [];
  if (participantTicketIds.length) {
    const { data, error } = await supabase.from('tickets').select('*').in('id', participantTicketIds);
    if (error) throw error;
    tagged = data ?? [];
  }

  const merged = [...(own ?? []), ...tagged];
  const deduped = Array.from(new Map(merged.map((t) => [t.id, t])).values());
  return deduped.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function getTicket(id) {
  const { data, error } = await supabase.from('tickets').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createTicket(payload) {
  const { data, error } = await supabase.from('tickets').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateTicketStatus(id, status, actorName) {
  const patch = { status, updated_at: new Date().toISOString() };
  if (status === 'Closed') { patch.closed_by = actorName; patch.closed_at = new Date().toISOString(); }
  const { data, error } = await supabase.from('tickets').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// Multi-user ticket tagging: participants stored in a join table, not a single assignee.
export async function addTicketParticipant(ticketId, userId) {
  const { error } = await supabase.from('ticket_participants').insert({ ticket_id: ticketId, user_id: userId });
  if (error) throw error;
}

export async function listTicketParticipants(ticketId) {
  const { data, error } = await supabase
    .from('ticket_participants')
    .select('user_id, profiles(full_name, email)')
    .eq('ticket_id', ticketId);
  if (error) throw error;
  return data;
}

export async function listComments(ticketId) {
  const { data, error } = await supabase
    .from('ticket_comments')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function sendComment({ ticketId, authorId, authorName, body, isFile = false, fileUrl = null }) {
  const { error } = await supabase.from('ticket_comments').insert({
    ticket_id: ticketId, author_id: authorId, author_name: authorName,
    body, is_file: isFile, file_url: fileUrl, created_at: new Date().toISOString(),
  });
  if (error) throw error;
  await supabase.from('tickets').update({ status: 'In Progress', updated_at: new Date().toISOString() }).eq('id', ticketId);
}

export async function uploadTicketAttachment(ticketId, file) {
  const sizeErr = validateFileSize(file);
  if (sizeErr) throw new Error(sizeErr);
  const path = `tickets/${ticketId}/${Date.now()}_${file.name}`;
  const { error: upErr } = await supabase.storage.from('ticket-attachments').upload(path, file);
  if (upErr) throw upErr;
  const { data } = supabase.storage.from('ticket-attachments').getPublicUrl(path);
  return data.publicUrl;
}
