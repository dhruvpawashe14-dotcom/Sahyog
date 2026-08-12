import { useEffect, useState } from 'react';
import { listEmployees } from '../modules/admin/services/adminService';
import { capitalizeWords } from '../utils/text';

// Shared across every "Assign to" / RE / RM dropdown in the app — one fetch, cached,
// names normalized to Proper Case regardless of how they're stored.
export function useEmployees() {
  const [employees, setEmployees] = useState([]);
  useEffect(() => {
    listEmployees()
      .then((rows) => setEmployees(rows.map((r) => ({ ...r, full_name: capitalizeWords(r.full_name) }))))
      .catch(() => {});
  }, []);
  return employees;
}
