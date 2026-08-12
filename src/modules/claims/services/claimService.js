import { supabase } from '../../../services/supabase/client';
import { validateFileSize } from '../../../utils/validators';

export const CLAIM_STATUSES = ['Filed', 'Under Review', 'Documents Pending', 'Approved', 'Rejected', 'Settled'];

export async function listClaims() {
  const { data, error } = await supabase.from('claims').select('*').order('created_at', { ascending: false }).limit(1000);
  if (error) throw error;
  return data;
}

export async function getClaim(id) {
  const { data, error } = await supabase.from('claims').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function updateClaim(id, payload) {
  const { data, error } = await supabase
    .from('claims')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createClaim(payload) {
  const { data, error } = await supabase.from('claims').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateClaimStatus(id, status, actorId, actorName) {
  const { data: before } = await supabase.from('claims').select('status').eq('id', id).single();
  const patch = { status, updated_at: new Date().toISOString() };
  if (status === 'Settled') patch.settled_date = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase.from('claims').update(patch).eq('id', id).select().single();
  if (error) throw error;
  await logClaimActivity(id, actorId, actorName, 'STATUS_CHANGE', before?.status, status);
  return data;
}

export async function logClaimActivity(claimId, actorId, actorName, action, oldValue, newValue, note) {
  await supabase.from('claim_activities').insert({
    claim_id: claimId, actor_id: actorId, actor_name: actorName,
    action, old_value: oldValue ?? null, new_value: newValue ?? null, note: note ?? null,
  });
}

export async function listClaimActivities(claimId) {
  const { data, error } = await supabase
    .from('claim_activities').select('*').eq('claim_id', claimId).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Aging: days since filed, for claims not yet settled/rejected.
export function claimAgeDays(claim) {
  if (['Settled', 'Rejected'].includes(claim.status)) return null;
  const filed = new Date(claim.filed_date);
  return Math.floor((new Date() - filed) / (1000 * 60 * 60 * 24));
}

export async function listClaimDocuments(claimId) {
  const { data, error } = await supabase
    .from('claim_documents').select('*').eq('claim_id', claimId).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function uploadClaimDocument({ claimId, docType, file, uploadedBy, uploadedName }) {
  const sizeErr = validateFileSize(file);
  if (sizeErr) throw new Error(sizeErr);
  const path = `claims/${claimId}/${Date.now()}_${file.name}`;
  const { error: upErr } = await supabase.storage.from('claim-documents').upload(path, file);
  if (upErr) throw upErr;
  const { data: urlData } = supabase.storage.from('claim-documents').getPublicUrl(path);
  const { data, error } = await supabase.from('claim_documents').insert({
    claim_id: claimId, doc_type: docType, file_name: file.name, file_url: urlData.publicUrl,
    uploaded_by: uploadedBy, uploaded_name: uploadedName,
  }).select().single();
  if (error) throw error;
  return data;
}

// Bulk import from parsed Excel/CSV rows (see xlsx utils on the Claims list page).
export async function bulkImportClaims(rows, actorId) {
  const payload = rows.map((r) => ({
    client_name: r.client_name, policy_number: r.policy_number, claim_type: r.claim_type,
    claim_amount: r.claim_amount ? Number(r.claim_amount) : null,
    status: r.status || 'Filed', filed_date: r.filed_date || new Date().toISOString().slice(0, 10),
    created_by: actorId,
  }));
  const { data, error } = await supabase.from('claims').insert(payload).select();
  if (error) throw error;
  return data;
}
