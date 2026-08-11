import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { createClient, findDuplicateClients } from './services/clientService';
import { uploadDocument } from '../documents/services/documentService';
import { logAudit } from '../../services/audit/auditService';
import IDFieldWithUpload from '../../components/forms/IDFieldWithUpload';
import { useEmployees } from '../../hooks/useEmployees';

const empty = {
  full_name: '', mobile: '', email: '', dob: '',
  pan_number: '', aadhaar_number: '', passport_number: '', dl_number: '', voter_id: '', gstin: '',
  address: '', city: '', state: '', pincode: '',
  client_category: '', assigned_to: '', rm_id: '',
};

const ID_DOCS = [
  { key: 'pan_number', label: 'PAN', docType: 'PAN Card', uppercase: true },
  { key: 'aadhaar_number', label: 'Aadhaar', docType: 'Aadhaar Card' },
  { key: 'passport_number', label: 'Passport Number', docType: 'Passport', uppercase: true },
  { key: 'dl_number', label: 'Driving License', docType: 'Driving License' },
  { key: 'voter_id', label: 'Voter ID', docType: 'Voter ID' },
  { key: 'gstin', label: 'GSTIN', docType: 'GSTIN Certificate' },
];

export default function ClientFormPage() {
  const [form, setForm] = useState(empty);
  const [idFiles, setIdFiles] = useState({});
  const [otherFiles, setOtherFiles] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [dupChecked, setDupChecked] = useState(''); // fingerprint of what we last checked, to avoid re-checking on every keystroke
  const [saving, setSaving] = useState(false);
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const employees = useEmployees();

  useEffect(() => { if (user && !form.assigned_to) setForm((f) => ({ ...f, assigned_to: user.id })); }, [user]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Automatic duplicate detection — runs whenever mobile, email, PAN, Aadhaar or name settle
  // (debounced), no manual button needed.
  useEffect(() => {
    const fingerprint = `${form.mobile}|${form.email}|${form.pan_number}|${form.aadhaar_number}|${form.full_name}`;
    if (fingerprint === dupChecked) return;
    if (!form.mobile && !form.pan_number && !form.aadhaar_number && !form.email) return;
    const t = setTimeout(async () => {
      const matches = await findDuplicateClients({ mobile: form.mobile, panNumber: form.pan_number, fullName: form.full_name });
      setDuplicates(matches);
      setDupChecked(fingerprint);
    }, 600);
    return () => clearTimeout(t);
  }, [form.mobile, form.email, form.pan_number, form.aadhaar_number, form.full_name]);

  const addOtherFiles = (fileList) => {
    const newOnes = Array.from(fileList).map((file) => ({ file, docType: 'Other' }));
    setOtherFiles((prev) => [...prev, ...newOnes]);
  };
  const removeOtherFile = (idx) => setOtherFiles((prev) => prev.filter((_, i) => i !== idx));

  const totalFileCount = Object.keys(idFiles).length + otherFiles.length;

  const save = async () => {
    if (!form.full_name || !form.mobile) { showToast('Name and mobile are required', 'error'); return; }
    if (!form.pan_number.trim()) { showToast('PAN number is required', 'error'); return; }
    if (!form.aadhaar_number.trim()) { showToast('Aadhaar number is required', 'error'); return; }
    setSaving(true);
    try {
      const re = employees.find((e) => e.id === form.assigned_to) || profile;
      const rm = employees.find((e) => e.id === form.rm_id);
      const client = await createClient({
        ...form,
        dob: form.dob || null,
        pan_number: form.pan_number.toUpperCase(),
        passport_number: form.passport_number?.toUpperCase() || null,
        client_category: form.client_category || null,
        assigned_to: form.assigned_to || user.id,
        assigned_name: re.full_name,
        rm_id: form.rm_id || null,
        rm_name: rm?.full_name || null,
        created_by: user.id,
      });
      await logAudit({ userId: user.id, userName: profile.full_name, action: 'CREATE', module: 'Clients', recordId: client.id, details: `Client created: ${client.full_name}` });

      for (const doc of ID_DOCS) {
        const file = idFiles[doc.key];
        if (file) await uploadDocument({ clientId: client.id, docType: doc.docType, file, uploadedBy: user.id, uploadedName: profile.full_name });
      }
      for (const f of otherFiles) {
        await uploadDocument({ clientId: client.id, docType: f.docType, file: f.file, uploadedBy: user.id, uploadedName: profile.full_name });
      }
      if (totalFileCount) {
        await logAudit({ userId: user.id, userName: profile.full_name, action: 'UPLOAD', module: 'KYC Vault', recordId: client.id, details: `${totalFileCount} document(s) uploaded for ${client.full_name}` });
      }

      showToast('Client created' + (totalFileCount ? ` with ${totalFileCount} document(s)` : ''), 'success');
      navigate(`/clients/${client.id}`);
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-hdr"><h1>Add New Client</h1></div>

      <div className="card">
        <div className="card-title">Personal Details</div>
        <div className="form-grid">
          <div className="fld form-full"><label>Full Name *</label><input value={form.full_name} onChange={set('full_name')} /></div>
          <div className="fld"><label>Mobile *</label><input value={form.mobile} onChange={set('mobile')} /></div>
          <div className="fld"><label>Email</label><input value={form.email} onChange={set('email')} /></div>
          <div className="fld"><label>Date of Birth</label><input type="date" value={form.dob} onChange={set('dob')} /></div>
          <div className="fld">
            <label>Client Category</label>
            <select value={form.client_category} onChange={set('client_category')}>
              <option value="">Select...</option>
              <option>Retail</option>
              <option>Corporate</option>
            </select>
          </div>
          <div className="fld">
            <label>RE (Relationship Executive)</label>
            <select value={form.assigned_to} onChange={set('assigned_to')}>
              {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.full_name}{emp.id === user.id ? ' (You)' : ''}</option>)}
            </select>
          </div>
          <div className="fld">
            <label>RM (Relationship Manager)</label>
            <select value={form.rm_id} onChange={set('rm_id')}>
              <option value="">None</option>
              {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-title">Identity Documents <span className="dim">— PAN & Aadhaar numbers required, files optional</span></div>
        <div className="form-grid">
          {ID_DOCS.map((doc) => (
            <IDFieldWithUpload
              key={doc.key}
              label={doc.key === 'pan_number' || doc.key === 'aadhaar_number' ? `${doc.label} *` : doc.label}
              value={form[doc.key]}
              onChange={set(doc.key)}
              uppercase={doc.uppercase}
              file={idFiles[doc.key]}
              onFileSelect={(file) => setIdFiles((prev) => ({ ...prev, [doc.key]: file }))}
              onFileRemove={() => setIdFiles((prev) => { const p = { ...prev }; delete p[doc.key]; return p; })}
            />
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-title">Address</div>
        <div className="form-grid">
          <div className="fld form-full"><label>Address</label><input value={form.address} onChange={set('address')} /></div>
          <div className="fld"><label>City</label><input value={form.city} onChange={set('city')} /></div>
          <div className="fld"><label>State</label><input value={form.state} onChange={set('state')} /></div>
          <div className="fld"><label>Pincode</label><input value={form.pincode} onChange={set('pincode')} /></div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-title">Other Documents <span className="dim">— photo, extra papers, etc.</span></div>
        <label className="dropzone">
          <i className="ti ti-cloud-upload" style={{ fontSize: 24, color: 'var(--gold)' }} />
          <div>Click to select files</div>
          <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={(e) => addOtherFiles(e.target.files)} />
        </label>
        {otherFiles.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {otherFiles.map((f, i) => (
              <div key={i} className="id-file-chip" style={{ marginTop: 0 }}>
                <i className="ti ti-file" /><span>{f.file.name}</span>
                <button type="button" onClick={() => removeOtherFile(i)}><i className="ti ti-x" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {duplicates.length > 0 && (
        <div className="card duplicate-warning">
          <div className="card-title"><i className="ti ti-alert-triangle" /> This client may already exist</div>
          {duplicates.map((d) => (
            <div key={d.id} className="dup-row">
              {d.full_name} — {d.mobile} {d.pan_number ? `· ${d.pan_number}` : ''} <span className="dim">({d.matchType} match)</span>
            </div>
          ))}
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>You can still save — this is just a heads-up.</p>
          <div className="modal-footer">
            <button className="btn" onClick={() => navigate(`/clients/${duplicates[0].id}`)}>View existing client instead</button>
          </div>
        </div>
      )}

      <div className="page-hdr" style={{ marginTop: 16 }}>
        <div />
        <button className="btn btn-gold" onClick={save} disabled={saving}>
          <i className="ti ti-check" /> {saving ? 'Saving...' : 'Save Client'}
        </button>
      </div>
    </div>
  );
}
