import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { createLead } from './services/leadService';
import { logAudit } from '../../services/audit/auditService';

const empty = { full_name: '', mobile: '', email: '', product: '', city: '', notes: '' };

export default function LeadFormPage() {
  const [form, setForm] = useState(empty);
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    if (!form.full_name || !form.mobile) { showToast('Name and mobile are required', 'error'); return; }
    const lead = await createLead({ ...form, assigned_to: user.id, assigned_name: profile.full_name, created_by: user.id, stage: 'New Lead' });
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
        <div className="fld form-full"><label>Notes</label><input value={form.notes} onChange={set('notes')} /></div>
      </div>
      <div className="page-hdr" style={{ marginTop: 16 }}>
        <button className="btn btn-gold" onClick={save}><i className="ti ti-check" /> Save Lead</button>
      </div>
    </div>
  );
}
