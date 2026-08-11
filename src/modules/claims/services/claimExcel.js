import * as XLSX from 'xlsx';
import { supabase } from '../../../services/supabase/client';

// Excel export of claims (Phase 2 scope: claim-level fields, flattened).
export function exportClaimsToExcel(claims, filename = 'claims-export.xlsx') {
  const rows = claims.map((c) => ({
    'Claim Ref': c.claim_ref, 'Client': c.clients?.full_name || '', 'Type': c.claim_type,
    'Incident Date': c.incident_date, 'Claim Amount': c.claim_amount, 'Approved Amount': c.approved_amount,
    'Status': c.status, 'Responsible': c.responsible_name, 'Filed On': c.created_at?.slice(0, 10),
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Claims');
  XLSX.writeFile(wb, filename);
}

// Excel import: expects columns matching the export headers (minus computed ones).
export async function importClaimsFromExcel(file, { createdBy }) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  const payload = rows.map((r) => ({
    client_id: r['Client ID'] || null,
    claim_type: r['Type'] || r['Claim Type'],
    incident_date: r['Incident Date'] || null,
    claim_amount: r['Claim Amount'] || null,
    status: r['Status'] || 'Filed',
    responsible_name: r['Responsible'] || null,
    created_by: createdBy,
  })).filter((r) => r.client_id);

  if (!payload.length) throw new Error('No valid rows found — make sure a "Client ID" column is present and populated.');

  const { data, error } = await supabase.from('claims').insert(payload).select();
  if (error) throw error;
  return data;
}
