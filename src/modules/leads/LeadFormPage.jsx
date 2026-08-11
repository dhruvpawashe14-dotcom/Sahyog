import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { createLead, findDuplicateLeads } from './services/leadService';
import { uploadLeadDocument } from '../documents/services/documentService';
import { logAudit } from '../../services/audit/auditService';
import { useEmployees } from '../../hooks/useEmployees';
import { INSURANCE_PRODUCTS } from '../../constants/products';

const empty = { full_name: '', mobile: '', email: '', product: '', city: '', notes: '', follow_up_date: '', assigned_to: '', lead_category: '' };

export default function LeadFormPage() {
  const [form, setForm] = useState(empty);
  const [duplicates, setDuplicates] = useState([]);
  const [checking, setChecking] = useState(false);
  const [attachments, setAttachments] = useState([]); // [{ file, label }]
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const employees = useEmployees();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => { if (user && !form.assigned_to) setForm((f) => ({ ...f, assigned_to: user.id })); }, [user]);

  // Auto duplicate check, same pattern as clients — no manual button.
  useEffect(() => {
    if (!form.mobile) { setDuplicates([]); return; }
    const t = setTimeout(async () => {
      setChecking(true);
      try { setDuplicates(await findDuplicateLeads({ mobile: form.mobile, fullName: form.full_name })); }
      finally { setChecking(false); }
    }, 600);
    return () => clearTimeout(t);
  }, [form.mobile, form.full_name]);

  const addAttachment = (fileList) => {
    setAttachments((prev) => [...prev, ...Array.from(fileList).map((file) => ({ file, label: file.name.replace(/\.[^.]+$/, '') }))]);
  };
  const updateAttachmentLabel = (idx, label) => setAttachments((prev) => prev.map((a, i) => i === idx ? { ...a, label } : a));
  const removeAttachment = (idx) => setAttachments((prev) => prev.filter((_, i) => i !== idx));

  const save = async () => {
    if (!form.full_name || !form.mobile) { showToast('Name and mobile are required', 'error'); return; }
    const assignee = employees.find((e) => e.id === form.assigned_to) || profile;
    const lead = await createLead({
      ...form,
      follow_up_date: form.follow_up_date || null,
      lead_category: form.lead_category || null,
      assigned_to: form.assigned_to || user.id,
      assigned_name: assignee.full_name,
      created_by: user.id,
      stage: 'New Lead',
    });
    await logAudit({ userId: user.id, userName: profile.full_name, action: 'CREATE', module: 'Leads', recordId: lead.id, details: `Lead created: ${lead.full_name}` });

    for (const a of attachments) {
      await uploadLeadDocument({ leadId: lead.id, label: a.label || 'Attachment', file: a.file, uploadedBy: user.id, uploadedName: profile.full_name });
    }

    showToast('Lead created' + (attachments.length ? ` with ${attachments.length} attachment(s)` : ''), 'success');
    navigate(`/leads/${lead.id}`);
  };

  return (
    <div>
      <div className="page-hdr"><h1>Add New Lead</h1></div>
      <div className="card">
        <div className="form-grid">
          <div className="fld">
            <label>Client Category</label>
            <select value={form.lead_category} onChange={set('lead_category')}>
              <option value="">Select...</option>
              <option>Fresh</option>
              <option>Rollover</option>
            </select>
          </div>
          <div className="fld"><label>Full Name *</label><input value={form.full_name} onChange={set('full_name')} /></div>
          <div className="fld"><label>Mobile *</label><input value={form.mobile} onChange={set('mobile')} /></div>
          <div className="fld"><label>Email</label><input value={form.email} onChange={set('email')} /></div>
          <div className="fld">
            <label>Product</label>
            <select value={form.product} onChange={set('product')}>
              <option value="">Select...</option>
              {INSURANCE_PRODUCTS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="fld"><label>City</label><input value={form.city} onChange={set('city')} /></div>
          <div className="fld"><label>Followup / Due Date</label><input type="date" value={form.follow_up_date} onChange={set('follow_up_date')} /></div>
          <div className="fld">
            <label>Assign To</label>
            <select value={form.assigned_to} onChange={set('assigned_to')}>
              {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.full_name}{emp.id === user.id ? ' (You)' : ''}</option>)}
            </select>
          </div>
          <div className="fld form-full"><label>Notes</label><input value={form.notes} onChange={set('notes')} /></div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-title">Attachments <span className="dim">— name each file however you like</span></div>
        <label className="dropzone">
          <i className="ti ti-cloud-upload" style={{ fontSize: 24, color: 'var(--gold)' }} />
          <div>Click to select files</div>
          <input type="file" multiple style={{ display: 'none' }} onChange={(e) => addAttachment(e.target.files)} />
        </label>
        {attachments.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {attachments.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <i className="ti ti-paperclip" />
                <input value={a.label} onChange={(e) => updateAttachmentLabel(i, e.target.value)} placeholder="Attachment name" style={{ flex: 1 }} />
                <span className="dim" style={{ fontSize: 11 }}>{a.file.name}</span>
                <button type="button" className="link-btn" onClick={() => removeAttachment(i)}><i className="ti ti-x" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {duplicates.length > 0 && (
        <div className="card duplicate-warning">
          <div className="card-title"><i className="ti ti-alert-triangle" /> This lead may already exist</div>
          {duplicates.map((d) => (
            <div key={d.id} className="dup-row">{d.full_name} — {d.mobile} <span className="dim">{d.stage} · {d.assigned_name}</span></div>
          ))}
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>You can still save — this is just a heads-up.</p>
          <div className="modal-footer">
            <button className="btn" onClick={() => navigate(`/leads/${duplicates[0].id}`)}>View existing lead instead</button>
          </div>
        </div>
      )}

      <div className="page-hdr" style={{ marginTop: 16 }}>
        <div />
        <button className="btn btn-gold" onClick={save}><i className="ti ti-check" /> Save Lead</button>
      </div>
    </div>
  );
}
