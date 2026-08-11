import { useEffect, useState } from 'react';
import { listEmployees } from '../modules/admin/services/adminService';

// Shared across every "Assign to" dropdown in the app — one fetch, cached for the component's lifetime.
export function useEmployees() {
  const [employees, setEmployees] = useState([]);
  useEffect(() => { listEmployees().then(setEmployees).catch(() => {}); }, []);
  return employees;
}
