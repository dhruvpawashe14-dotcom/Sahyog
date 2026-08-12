// Defines exactly which fields appear for each claim type, in order, and where each
// field's value is stored: a real `claims` column (top-level) or the `details` JSONB bag.
// `target: 'top'` fields use `field` as the claims table column name.
// `target: 'details'` fields use `field` as the key inside claims.details.

export const CLAIM_TYPES = ['Health', 'Motor', 'Non-Motor'];

export const CLAIM_FIELD_CONFIG = {
  Health: [
    { label: 'Policy Holder Name', field: 'client_name', target: 'top', type: 'text', required: true },
    { label: 'Patient Name', field: 'patient_name', target: 'details', type: 'text' },
    { label: 'Policy Product Name', field: 'policy_product_name', target: 'details', type: 'text' },
    { label: 'Claim Number', field: 'claim_number', target: 'details', type: 'text' },
    { label: 'Claim Intimation Date', field: 'claim_intimation_date', target: 'details', type: 'date' },
    { label: 'Insurance Company', field: 'insurance_company', target: 'details', type: 'text' },
    { label: 'File Scanned Date', field: 'file_scanned_date', target: 'details', type: 'date' },
    { label: 'Query Received On', field: 'query_received_on', target: 'details', type: 'date' },
    { label: 'Query Submit Date', field: 'query_submit_date', target: 'details', type: 'date' },
    { label: 'Claim Amount', field: 'claim_amount', target: 'top', type: 'number' },
    { label: 'Approved Rs.', field: 'approved_amount', target: 'top', type: 'number' },
    { label: 'Final Status', field: 'status', target: 'top', type: 'status' },
    { label: 'Remarks if any', field: 'notes', target: 'top', type: 'textarea' },
  ],
  Motor: [
    { label: 'Customer Name', field: 'client_name', target: 'top', type: 'text', required: true },
    { label: 'Insurance Company', field: 'insurance_company', target: 'details', type: 'text' },
    { label: 'Policy Number', field: 'policy_number', target: 'top', type: 'text' },
    { label: 'Claim Number', field: 'claim_number', target: 'details', type: 'text' },
    { label: 'Accident Date', field: 'accident_date', target: 'details', type: 'date' },
    { label: 'Claim Intimation Date', field: 'claim_intimation_date', target: 'details', type: 'date' },
    { label: 'Vehicle Number', field: 'vehicle_number', target: 'details', type: 'text' },
    { label: 'Survey Date', field: 'survey_date', target: 'details', type: 'date' },
    { label: 'External Date', field: 'external_date', target: 'details', type: 'date' },
    { label: 'Work Approval Date', field: 'work_approval_date', target: 'details', type: 'date' },
    { label: 'Query Received On', field: 'query_received_on', target: 'details', type: 'date' },
    { label: 'Workshop', field: 'workshop', target: 'details', type: 'text' },
    { label: 'Claim Settle Amount', field: 'claim_amount', target: 'top', type: 'number' },
    { label: 'Surveyor', field: 'surveyor', target: 'details', type: 'text' },
    { label: 'Final Status', field: 'status', target: 'top', type: 'status' },
  ],
  'Non-Motor': [
    { label: 'Customer Name', field: 'client_name', target: 'top', type: 'text', required: true },
    { label: 'Insurance Company', field: 'insurance_company', target: 'details', type: 'text' },
    { label: 'Claim Number', field: 'claim_number', target: 'details', type: 'text' },
    { label: 'Claim Intimation Date', field: 'claim_intimation_date', target: 'details', type: 'date' },
    { label: 'Product Name', field: 'product_name', target: 'details', type: 'text' },
    { label: 'Documents Received Date', field: 'documents_received_date', target: 'details', type: 'date' },
    { label: 'File Scanned Date', field: 'file_scanned_date', target: 'details', type: 'date' },
    { label: 'Sent To Insurance Company Date', field: 'sent_to_insurance_date', target: 'details', type: 'date' },
    { label: 'Query Received On', field: 'query_received_on', target: 'details', type: 'date' },
    { label: 'Query Submitted To Insurance Company Date', field: 'query_submitted_date', target: 'details', type: 'date' },
    { label: 'Second Query Received On', field: 'second_query_received_on', target: 'details', type: 'date' },
    { label: 'Second Query Submitted To Insurance Company Date', field: 'second_query_submitted_date', target: 'details', type: 'date' },
    { label: 'Claim Amount', field: 'claim_amount', target: 'top', type: 'number' },
    { label: 'Approved Amount', field: 'approved_amount', target: 'top', type: 'number' },
    { label: 'Final Status', field: 'status', target: 'top', type: 'status' },
    { label: 'Remarks if any', field: 'notes', target: 'top', type: 'textarea' },
  ],
};

// Builds { topLevelPayload, details } from a flat form-values object keyed by field name,
// given which claim type's config is active. "status"-typed fields are excluded — that's
// handled separately by the existing claim status workflow, not entered at creation time.
export function splitFormValues(claimType, values) {
  const config = CLAIM_FIELD_CONFIG[claimType] || [];
  const top = {};
  const details = {};
  for (const f of config) {
    if (f.type === 'status') continue; // status starts at 'Filed', changed later via the workflow dropdown
    const v = values[f.field];
    if (v === undefined || v === '') continue;
    if (f.target === 'top') top[f.field] = f.type === 'number' ? Number(v) : v;
    else details[f.field] = v;
  }
  return { top, details };
}
