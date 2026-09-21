// Ticket type/subtype taxonomy, as defined by the ops team.
export const TICKET_TAXONOMY = {
  'Quotation': [
    'Motor Insurance',
    'Health Insurance',
    'Non-Motor Insurance',
  ],
  'Payment Link': [
    'Motor Insurance',
    'Health Insurance',
    'Non-Motor Insurance',
  ],
  'Policy copy': [
    'Soft copy',
    'Hard copy',
  ],
  'Endorsement': [
    'Motor Insurance',
    'Health Insurance',
    'Non-Motor Insurance',
  ],
  // Everything that doesn't fit the four categories above — carried over
  // from the old taxonomy so nothing that used to have a home loses one.
  'Other type of query': [
    'GST / Mobile / Email Update',
    'NCB Certificate',
    'Refund Status',
    'Claim Intimation',
    'Others / Misc',
  ],
};

export const TICKET_TYPES = Object.keys(TICKET_TAXONOMY);

// Ticket lifecycle stages, written for how insurance ops actually work —
// not a generic helpdesk flow. Order here is also the order shown in dropdowns.
export const TICKET_STATUSES = [
  'Open',
  'In Progress',
  'Quote Sent',
  'Policy Sent',
  'Payment Pending',
  'Claim Intimated',
  'Claim Settled',
  'Waiting on Client',
  'Resolved',
  'Closed',
];

// Statuses that mean "done" — used to freeze the "days open" counter.
export const TICKET_CLOSED_STATUSES = ['Resolved', 'Closed', 'Claim Settled'];

// Colour per status for badges. Hex only — components derive the light bg tint from this.
export const TICKET_STATUS_COLORS = {
  'Open': '#2E75B6',
  'In Progress': '#B8730A',
  'Quote Sent': '#7952B3',
  'Policy Sent': '#0F9D8F',
  'Payment Pending': '#C0392B',
  'Claim Intimated': '#5B4B8A',
  'Claim Settled': '#1A7A4A',
  'Waiting on Client': '#6B6B6B',
  'Resolved': '#1A7A4A',
  'Closed': '#3A3A3A',
};
