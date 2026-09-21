import { useEffect, useState } from 'react';
import { listEmployees } from '../modules/admin/services/adminService';
import { capitalizeWords } from '../utils/text';
import { effectiveStatus } from '../utils/employeeStatus';

// Shared across every "Assign to" / RE / RM / tag picker in the app — one fetch,
// cached, names normalized to Proper Case regardless of how they're stored.
//
// Inactive employees are excluded by default: an account the admin turned off
// shouldn't still be selectable for new work anywhere in the app. Pass
// { includeInactive: true } for the rare screen (e.g. Employees admin page)
// that needs to manage inactive accounts rather than assign work to them.
// On-leave employees are still included (just flagged) so people can plan
// around them.
export function useEmployees({ includeInactive = false } = {}) {
  const [employees, setEmployees] = useState([]);
  useEffect(() => {
    listEmployees()
      .then((rows) => {
        const withStatus = rows.map((r) => ({
          ...r,
          full_name: capitalizeWords(r.full_name),
          effective_status: effectiveStatus(r),
        }));
        setEmployees(includeInactive ? withStatus : withStatus.filter((e) => e.effective_status !== 'Inactive'));
      })
      .catch(() => {});
  }, [includeInactive]);
  return employees;
}
