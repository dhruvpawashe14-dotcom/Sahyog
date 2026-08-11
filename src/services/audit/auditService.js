import { supabase } from '../supabase/client';

// module: 'Clients' | 'Tickets' | 'KYC Vault' | 'Auth' | 'Leads' | 'Tasks' | 'Claims'
// action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'UPLOAD' | 'ASSIGN'
export async function logAudit({ userId, userName, action, module, recordId, details }) {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      user_name: userName,
      action,
      module,
      record_id: recordId ?? null,
      details: details ?? null,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    // Audit logging must never break the primary user action.
    console.error('Audit log failed:', e);
  }
}

export async function fetchAuditLogs({ limit = 100 } = {}) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
