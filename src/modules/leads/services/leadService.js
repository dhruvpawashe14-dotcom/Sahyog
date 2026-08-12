import { supabase } from '../../../services/supabase/client';

export const STAGES = [
  'New Lead', 'Contacted', 'Interested', 'Meeting Scheduled', 'Follow-up Pending',
  'Documentation Pending', 'Proposal Shared', 'Payment Pending', 'Policy Issued',
  'Closed Won', 'Closed Lost',
];

export async function listLeads() {
  const { data, error } = await supabase.from('leads').select('*').order('updated_at', { ascending: false }).limit(1000);
  if (error) throw error;
  return data;
}

export async function getLead(id) {
  const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createLead(payload) {
  const { data, error } = await supabase.from('leads').insert(payload).select().single();
  if (error) throw error;
  return data;
}

// Duplicate detection for leads — mirrors the client-side check, since a lead entered twice
// wastes just as much advisor time as a duplicate client.
export async function findDuplicateLeads({ mobile, fullName }) {
  if (!mobile) return [];
  const { data, error } = await supabase.from('leads').select('id, full_name, mobile, stage, assigned_name').eq('mobile', mobile);
  if (error) throw error;
  return (data ?? []).map((m) => ({ ...m, matchType: 'mobile' }));
}

export async function updateLeadStage(id, stage, actorId, actorName) {
  const { data: before } = await supabase.from('leads').select('stage').eq('id', id).single();
  const { data, error } = await supabase
    .from('leads')
    .update({ stage, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  await logActivity(id, actorId, actorName, 'STAGE_CHANGE', before?.stage, stage);
  return data;
}

export async function assignLead(id, userId, userName, actorId, actorName) {
  const { error } = await supabase
    .from('leads')
    .update({ assigned_to: userId, assigned_name: userName, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
  await logActivity(id, actorId, actorName, 'ASSIGNED', null, userName);
}

export async function logActivity(leadId, actorId, actorName, action, oldValue, newValue, note) {
  await supabase.from('lead_activities').insert({
    lead_id: leadId, actor_id: actorId, actor_name: actorName,
    action, old_value: oldValue ?? null, new_value: newValue ?? null, note: note ?? null,
  });
}

export async function listActivities(leadId) {
  const { data, error } = await supabase
    .from('lead_activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Lead → Client conversion (Phase 1 built createClient; this wires the button + activity log)
export async function convertToClient(lead, actorId, actorName) {
  const { data: client, error } = await supabase.from('clients').insert({
    full_name: lead.full_name, mobile: lead.mobile, email: lead.email,
    address: lead.address, city: lead.city, state: lead.state,
    pan_number: lead.pan_number, aadhaar_number: lead.aadhaar_number,
    assigned_to: lead.assigned_to, assigned_name: lead.assigned_name,
    source_lead_id: lead.id, created_by: actorId,
  }).select().single();
  if (error) throw error;
  await updateLeadStage(lead.id, 'Policy Issued', actorId, actorName);
  await logActivity(lead.id, actorId, actorName, 'CONVERTED_TO_CLIENT', null, `client #${client.id}`);
  return client;
}
