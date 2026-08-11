import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { createLead, findDuplicateLeads } from './services/leadService';
import { logAudit } from '../../services/audit/auditService';
import { useEmployees } from '../../hooks/useEmployees';

const empty = { full_name: '', mobile: '', email: '', product: '', city: '', notes: '', follow_up_date: '', assigned_to: '' };

export default function LeadFormPage() {
  const [form, setForm] = useState(empty);
  const [duplicates, setDuplicates] = useState([]);
  const [checking, setChecking] = useState(false);
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const employees = useEmployees();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => { if (user && !form.assigned_to) setForm((f) => ({ ...f, assigned_to: user.id })); }, [user]);

  const checkDuplicates = async () => {
    setChecking(true);
    try {
      setDuplicates(await findDuplicateLeads({ mobile: form.mobile, fullName: form.full_name }));
    } finally {
      setChecking(false);
    }
  };

  const save = async (force = false) => {
    if (!form.full_name || !form.mobile) { showToast('Name and mobile are required', 'error'); return; }
    if (!force) {
      const matches = await findDuplicateLeads({ mobile: form.mobile, fullName: form.full_name });
      if (matches.length) { setDuplicates(matches); return; }
    }
    const assignee = employees.find((e) => e.id === form.assigned_to) || profile;
    const lead = await createLead({
      ...form,
      follow_up_date: form.follow_up_date || null,
      assigned_to: form.assigned_to || user.id,
      assigned_name: assignee.full_name,
      created_by: user.id,
      stage: 'New Lead',
    });
    await logAudit({ userId: user.id, userName: profile.full_name, action: 'CREATE', module: 'Leads', recordId: lead.id, details: `Lead created: ${lead.full_name}` });
    showToast('Lead created', 'success');
    navigate(`/leads/${lead.id}`);
  };

  return (
    <div>
      <div className="page-hdr"><h1>Add New Lead</h1></div>
      <div className="card form-grid">
        <div className="fld form-full"><label>Full Name *</label><input value={form.full_name} onChange={set('full_name')} /></div>
        <div className="fld"><label>Mobile *</label><input value={form.mobile} onChange={set('mobile')} /></div>
        <div className="fld"><label>Email</label><input value={form.email} onChange={set('email')} /></div>
        <div className="fld"><label>Product</label><input value={form.product} onChange={set('product')} placeholder="e.g. Term Life" /></div>
        <div className="fld"><label>City</label><input value={form.city} onChange={set('city')} /></div>
        <div className="fld"><label>Follow-up Date</label><input type="date" value={form.follow_up_date} onChange={set('follow_up_date')} /></div>
        <div className="fld">
          <label>Assign To</label>
          <select value={form.assigned_to} onChange={set('assigned_to')}>
            {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.full_name}{emp.id === user.id ? ' (You)' : ''}</option>)}
          </select>
        </div>
        <div className="fld form-full"><label>Notes</label><input value={form.notes} onChange={set('notes')} /></div>
      </div>

      {duplicates.length > 0 && (
        <div className="card duplicate-warning">
          <div className="card-title"><i className="ti ti-alert-triangle" /> Possible duplicate lead{duplicates.length > 1 ? 's' : ''} found</div>
          {duplicates.map((d) => (
            <div key={d.id} className="dup-row">{d.full_name} — {d.mobile} <span className="dim">{d.stage} · {d.assigned_name}</span></div>
          ))}
          <div className="modal-footer">
            <button className="btn" onClick={() => navigate(`/leads/${duplicates[0].id}`)}>View existing lead</button>
            <button className="btn btn-gold" onClick={() => save(true)}>Save anyway (new lead)</button>
          </div>
        </div>
      )}

      <div className="page-hdr" style={{ marginTop: 16 }}>
        <button className="btn" onClick={checkDuplicates} disabled={checking}>{checking ? 'Checking...' : 'Check duplicates'}</button>
        <button className="btn btn-gold" onClick={() => save(false)}><i className="ti ti-check" /> Save Lead</button>
      </div>
    </div>
  );
}
