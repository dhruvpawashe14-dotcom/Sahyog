import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { createClaim } from './services/claimService';
import { logAudit } from '../../services/audit/auditService';
import { useEmployees } from '../../hooks/useEmployees';

const empty = { client_name: '', policy_number: '', claim_type: '', claim_amount: '', notes: '', assigned_to: '' };

export default function ClaimFormPage() {
  const [form, setForm] = useState(empty);
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const employees = useEmployees();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => { if (user && !form.assigned_to) setForm((f) => ({ ...f, assigned_to: user.id })); }, [user]);

  const save = async () => {
    if (!form.client_name) { showToast('Client name is required', 'error'); return; }
    const assignee = employees.find((e) => e.id === form.assigned_to) || profile;
    const claim = await createClaim({
      ...form,
      claim_amount: form.claim_amount ? Number(form.claim_amount) : null,
      assigned_to: form.assigned_to || user.id,
      assigned_name: assignee.full_name,
      created_by: user.id,
    });
    await logAudit({ userId: user.id, userName: profile.full_name, action: 'CREATE', module: 'Claims', recordId: claim.id, details: `Claim filed: ${claim.client_name}` });
    showToast('Claim filed', 'success');
    navigate(`/claims/${claim.id}`);
  };

  return (
    <div>
      <div className="page-hdr"><h1>File New Claim</h1></div>
      <div className="card form-grid">
        <div className="fld form-full"><label>Client Name *</label><input value={form.client_name} onChange={set('client_name')} /></div>
        <div className="fld"><label>Policy Number</label><input value={form.policy_number} onChange={set('policy_number')} /></div>
        <div className="fld">
          <label>Claim Type</label>
          <select value={form.claim_type} onChange={set('claim_type')}>
            <option value="">Select...</option>
            <option>Death</option><option>Health</option><option>Accident</option><option>Maturity</option><option>Surrender</option>
          </select>
        </div>
        <div className="fld"><label>Claim Amount (₹)</label><input type="number" value={form.claim_amount} onChange={set('claim_amount')} /></div>
        <div className="fld">
          <label>Assign To</label>
          <select value={form.assigned_to} onChange={set('assigned_to')}>
            {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.full_name}{emp.id === user.id ? ' (You)' : ''}</option>)}
          </select>
        </div>
        <div className="fld form-full"><label>Notes</label><input value={form.notes} onChange={set('notes')} /></div>
      </div>
      <div className="page-hdr" style={{ marginTop: 16 }}>
        <button className="btn btn-gold" onClick={save}><i className="ti ti-check" /> File Claim</button>
      </div>
    </div>
  );
}
