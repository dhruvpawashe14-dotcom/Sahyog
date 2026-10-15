// Client names are stored as first / middle / last, with full_name kept as the
// composed display value so lists, search, claims and tickets keep working.

export function joinName({ first_name, middle_name, last_name }) {
  return [first_name, middle_name, last_name].map((s) => (s || '').trim()).filter(Boolean).join(' ');
}

// Best-effort split for a single string (used when a lead converts to a client).
export function splitFullName(full) {
  const parts = (full || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: '', middle_name: '', last_name: '' };
  if (parts.length === 1) return { first_name: parts[0], middle_name: '', last_name: '' };
  return {
    first_name: parts[0],
    middle_name: parts.slice(1, -1).join(' '),
    last_name: parts[parts.length - 1],
  };
}
