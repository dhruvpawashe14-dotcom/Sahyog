// Ticket type/subtype taxonomy, as defined by the ops team.
export const TICKET_TAXONOMY = {
  'Policy printing related query': [
    'Change in GST Number',
    'Change in Mobile Number',
    'Change in Mail ID',
    'NCB Certificate',
  ],
  'Policy print (soft copy) related query': [
    'Send soft copy through mail',
    'Send hard copy print',
  ],
  'Neft Refund related query': [
    'Refund Status',
  ],
  'Service related query - GI': [
    'Corporate policy related query',
    'Pvt car & two-wheeler quota generate & send payment link.',
    'Endorsement',
    'Others or Misc',
    'Free Medical check up',
  ],
  'Other type of query - GI': [
    'Prepare quotation of MEDICLAIM',
    'Required quote for Fire/Marine/CPP/OPP',
    'Two-Wheeler or Pvt Car Quote',
    'Claim Intimation',
    'Others or Misc',
  ],
};

export const TICKET_TYPES = Object.keys(TICKET_TAXONOMY);
