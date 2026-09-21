// Single source of truth for "is this person available right now" — used
// everywhere a teammate gets picked (ticket assign/tag, claim RE/RM, task
// assignee, meeting attendee) and on the Employees page itself.
//
// `status` is the admin's on/off switch (Active/On Leave/Inactive).
// `leave_from`/`leave_to` let an admin schedule a leave window in advance —
// if today falls inside it, the person shows as "On Leave" automatically,
// with no one needing to remember to flip the dropdown on the day.
export function effectiveStatus(emp) {
  if (!emp) return 'Active';
  if (emp.status === 'Inactive') return 'Inactive';
  const today = new Date().toISOString().slice(0, 10);
  if (emp.leave_from && emp.leave_to && emp.leave_from <= today && today <= emp.leave_to) {
    return 'On Leave';
  }
  return emp.status === 'On Leave' ? 'On Leave' : 'Active';
}

export const STATUS_DOT_COLOR = {
  'Active': '#1A7A4A',
  'On Leave': '#B8730A',
  'Inactive': '#C0392B',
};

// Native <select><option> elements can't render styled HTML (like a colored
// dot span) in any browser — an emoji prefix is the only reliable way to
// carry status into a plain dropdown option.
export const STATUS_EMOJI = {
  'Active': '🟢',
  'On Leave': '🟠',
  'Inactive': '🔴',
};
