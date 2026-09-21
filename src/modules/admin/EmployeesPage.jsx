import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import StatusDot from '../../components/common/StatusDot';
import { effectiveStatus } from '../../utils/employeeStatus';
import * as adminService from './services/adminService';

export default function EmployeesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [leaveDrafts, setLeaveDrafts] = useState({}); // id -> { from, to } while editing

  const load = () => adminService.listEmployees().then(setEmployees);
  useEffect(() => { load(); }, []);

  const changeRole = async (emp, role) => {
    if (emp.id === user.id) { showToast("You can't change your own role", 'error'); return; }
    await adminService.updateEmployeeRole(emp.id, role);
    showToast(`${emp.full_name} is now ${role}`, 'success');
    load();
  };

  const changeStatus = async (emp, status) => {
    try {
      await adminService.updateEmployeeStatus(emp.id, status);
    } catch (e) {
      showToast('Status change failed: ' + e.message, 'error');
    } finally {
      load();
    }
  };

  const draftFor = (emp) => leaveDrafts[emp.id] || { from: emp.leave_from || '', to: emp.leave_to || '' };
  const setDraft = (emp, patch) => setLeaveDrafts((prev) => ({ ...prev, [emp.id]: { ...draftFor(emp), ...patch } }));

  const saveLeave = async (emp) => {
    const { from, to } = draftFor(emp);
    if (from && to && from > to) { showToast('Leave "from" date must be before "to" date', 'error'); return; }
    try {
      await adminService.updateEmployeeLeave(emp.id, from, to);
      showToast(from || to ? `Leave scheduled for ${emp.full_name}` : `Leave cleared for ${emp.full_name}`, 'success');
      setLeaveDrafts((prev) => { const next = { ...prev }; delete next[emp.id]; return next; });
      load();
    } catch (e) {
      showToast('Could not save leave dates: ' + e.message, 'error');
    }
  };

  return (
    <div>
      <div className="page-hdr"><div><h1>Employees</h1><p>{employees.length} team members</p></div></div>
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Scheduled leave (advance)</th></tr></thead>
            <tbody>
              {employees.map((e) => {
                const status = effectiveStatus(e);
                const draft = draftFor(e);
                const dirty = draft.from !== (e.leave_from || '') || draft.to !== (e.leave_to || '');
                return (
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <StatusDot status={status} />
                        <select value={e.status} onChange={(ev) => changeStatus(e, ev.target.value)}>
                          <option>Active</option><option>On Leave</option><option>Inactive</option>
                        </select>
                      </div>
                      {status === 'On Leave' && e.leave_from && e.leave_to && e.status !== 'On Leave' && (
                        <div style={{ fontSize: 10.5, color: 'var(--text4)', marginTop: 2 }}>Auto (scheduled leave active)</div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="date" value={draft.from} onChange={(ev) => setDraft(e, { from: ev.target.value })} style={{ fontSize: 12 }} />
                        <span style={{ color: 'var(--text4)', fontSize: 12 }}>to</span>
                        <input type="date" value={draft.to} onChange={(ev) => setDraft(e, { to: ev.target.value })} style={{ fontSize: 12 }} />
                        {dirty && (
                          <button className="link-btn" onClick={() => saveLeave(e)} style={{ fontSize: 12 }}>Save</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
