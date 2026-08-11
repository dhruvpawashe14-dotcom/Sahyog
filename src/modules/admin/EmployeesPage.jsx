import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import * as adminService from './services/adminService';

export default function EmployeesPage() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [employees, setEmployees] = useState([]);

  const load = () => adminService.listEmployees().then(setEmployees);
  useEffect(() => { load(); }, []);

  const changeRole = async (emp, role) => {
    if (emp.id === user.id) { showToast("You can't change your own role", 'error'); return; }
    await adminService.updateEmployeeRole(emp.id, role);
    showToast(`${emp.full_name} is now ${role}`, 'success');
    load();
  };

  const changeStatus = async (emp, status) => {
    await adminService.updateEmployeeStatus(emp.id, status);
    load();
  };

  return (
    <div>
      <div className="page-hdr"><div><h1>Employees</h1><p>{employees.length} team members</p></div></div>
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id}>
                  <td>{e.full_name}</td>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{e.email}</td>
                  <td>
                    <select value={e.role} onChange={(ev) => changeRole(e, ev.target.value)} disabled={e.id === user.id}>
                      <option value="employee">employee</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>
                    <select value={e.status} onChange={(ev) => changeStatus(e, ev.target.value)}>
                      <option>Active</option><option>On Leave</option><option>Inactive</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
