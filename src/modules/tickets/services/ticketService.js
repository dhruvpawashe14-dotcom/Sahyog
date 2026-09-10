import { supabase } from '../../../services/supabase/client';
import { validateFileSize } from '../../../utils/validators';
import { TICKET_CLOSED_STATUSES } from '../constants';
 
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
 
// Simple "how long has this been open" view — this is what people on the ground
// actually want to know, not an SLA-hours calculation.
export function isTicketClosed(ticket) {
  return TICKET_CLOSED_STATUSES.includes(ticket.status);
}

// Has this ticket had a follow-up query logged since it was first raised?
export function hasFollowUps(ticket) {
  return (ticket.query_count ?? 1) > 1;
}

export function daysOpenLabel(ticket) {
  const closed = isTicketClosed(ticket);
  if (closed) {
    const start = new Date(ticket.created_at);
    const end = ticket.closed_at ? new Date(ticket.closed_at) : new Date();
    const diffMs = Math.max(0, end - start);
    const days = Math.floor(diffMs / 86400000);
    if (days < 1) return `Took ${Math.max(1, Math.floor(diffMs / 3600000))}h`;
    return `Took ${days}d`;
  }
  // Open ticket: clock runs from the most recent query, not the original
  // creation date. Otherwise a ticket that just got a fresh follow-up
  // question still reads as "30d open" — indistinguishable from one
  // nobody has touched in a month. last_query_at is bumped every time
  // logNewQuery() is called; it starts out equal to created_at.
  const start = new Date(ticket.last_query_at || ticket.created_at);
  const diffMs = Math.max(0, new Date() - start);
  const days = Math.floor(diffMs / 86400000);
  if (days < 1) return `${Math.max(1, Math.floor(diffMs / 3600000))}h open`;
  return `${days}d open`;
}

// True total age of the ticket since it was first raised, regardless of
// follow-ups — for reporting/audits, not the list-view "open for" column.
export function totalAgeLabel(ticket) {
  const diffMs = Math.max(0, new Date() - new Date(ticket.created_at));
  const days = Math.floor(diffMs / 86400000);
  if (days < 1) return `${Math.max(1, Math.floor(diffMs / 3600000))}h ago`;
  return `${days}d ago`;
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
 
// Admin-only — RLS enforces this server-side too (see migration 018). Cascades to
// ticket_comments and ticket_participants automatically.
export async function deleteTicket(id) {
  const { error } = await supabase.from('tickets').delete().eq('id', id);
  if (error) throw error;
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
 
export async function sendComment({ ticketId, authorId, authorName, body, isFile = false, filePath = null, isVoiceNote = false }) {
  const { error } = await supabase.from('ticket_comments').insert({
    ticket_id: ticketId, author_id: authorId, author_name: authorName,
    body, is_file: isFile, file_path: filePath, is_voice_note: isVoiceNote, created_at: new Date().toISOString(),
  });
  if (error) throw error;
  await supabase.from('tickets').update({ status: 'In Progress', updated_at: new Date().toISOString() }).eq('id', ticketId);
}
 
// Staff clicks this when the client raises a NEW question on an already-open
// ticket, instead of the ticket just sitting there aging from its original
// creation date. Bumps last_query_at (what daysOpenLabel uses) and
// query_count, and drops a system comment so the follow-up is visible in
// the thread and to anyone auditing the ticket later.
export async function logNewQuery({ ticketId, authorId, authorName }) {
  const ticket = await getTicket(ticketId);
  const nextCount = (ticket.query_count ?? 1) + 1;
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('tickets')
    .update({ query_count: nextCount, last_query_at: now, updated_at: now })
    .eq('id', ticketId);
  if (error) throw error;
  // sendComment() also flips status to 'In Progress', which is correct here —
  // a fresh query means someone needs to act on it again.
  await sendComment({
    ticketId, authorId, authorName,
    body: `📩 New query received from client — this is follow-up #${nextCount} on this ticket. Clock reset.`,
  });
  return nextCount;
}

export async function uploadTicketAttachment(ticketId, file) {
  const sizeErr = validateFileSize(file);
  if (sizeErr) throw new Error(sizeErr);
  const path = `tickets/${ticketId}/${Date.now()}_${file.name}`;
  // ticket-attachments is a PRIVATE bucket — return the path, not a permanent
  // public URL. Access is via a short-lived signed URL minted on demand.
  const { error: upErr } = await supabase.storage.from('ticket-attachments').upload(path, file);
  if (upErr) throw upErr;
  return path;
}
