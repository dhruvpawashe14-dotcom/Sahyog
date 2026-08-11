import { supabase } from '../../../services/supabase/client';

export async function listClientDocuments(clientId) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function uploadDocument({ clientId, docType, file, uploadedBy, uploadedName }) {
  const path = `kyc/${clientId}/${Date.now()}_${file.name}`;
  const { error: upErr } = await supabase.storage.from('kyc-documents').upload(path, file);
  if (upErr) throw upErr;
  const { data: urlData } = supabase.storage.from('kyc-documents').getPublicUrl(path);

  const { data, error } = await supabase.from('documents').insert({
    client_id: clientId,
    doc_type: docType,
    file_name: file.name,
    file_path: path,
    file_url: urlData.publicUrl,
    file_size: file.size,
    mime_type: file.type,
    status: 'Uploaded',
    uploaded_by: uploadedBy,
    uploaded_name: uploadedName,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateDocumentStatus(id, status) {
  const { error } = await supabase.from('documents').update({ status }).eq('id', id);
  if (error) throw error;
}

// Lead attachments — reuses the same 'documents' table (it already has a lead_id column
// from the original schema) with a free-typed label instead of a fixed doc_type list.
export async function listLeadDocuments(leadId) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function uploadLeadDocument({ leadId, label, file, uploadedBy, uploadedName }) {
  const path = `leads/${leadId}/${Date.now()}_${file.name}`;
  const { error: upErr } = await supabase.storage.from('kyc-documents').upload(path, file);
  if (upErr) throw upErr;
  const { data: urlData } = supabase.storage.from('kyc-documents').getPublicUrl(path);

  const { data, error } = await supabase.from('documents').insert({
    lead_id: leadId,
    doc_type: label,
    file_name: file.name,
    file_path: path,
    file_url: urlData.publicUrl,
    file_size: file.size,
    mime_type: file.type,
    status: 'Uploaded',
    uploaded_by: uploadedBy,
    uploaded_name: uploadedName,
  }).select().single();
  if (error) throw error;
  return data;
}
