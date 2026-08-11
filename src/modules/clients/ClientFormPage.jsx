import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { createClient, findDuplicateClients } from './services/clientService';
import { uploadDocument } from '../documents/services/documentService';
import { logAudit } from '../../services/audit/auditService';

const DOC_TYPES = ['PAN Card', 'Aadhaar Card', 'Passport', 'Driving License', 'Voter ID', 'GSTIN Certificate', 'Photo', 'Other'];

const empty = {
  full_name: '', mobile: '', email: '', dob: '', occupation: '',
  pan_number: '', aadhaar_number: '', passport_number: '', dl_number: '', voter_id: '', gstin: '',
  address: '', city: '', state: '', pincode: '',
};

export default function ClientFormPage() {
  const [form, setForm] = useState(empty);
  const [duplicates, setDuplicates] = useState([]);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState([]); // { file, docType }
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const addFiles = (fileList) => {
    const newOnes = Array.from(fileList).map((file) => ({ file, docType: 'Other' }));
    setFiles((prev) => [...prev, ...newOnes]);
  };
  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));
  const setFileDocType = (idx, docType) => setFiles((prev) => prev.map((f, i) => i === idx ? { ...f, docType } : f));

  const checkDuplicates = async () => {
    setChecking(true);
    try {
      const matches = await findDuplicateClients({ mobile: form.mobile, panNumber: form.pan_number, fullName: form.full_name });
      setDuplicates(matches);
    } finally {
      setChecking(false);
    }
  };

  const save = async (force = false) => {
    if (!form.full_name || !form.mobile) { showToast('Name and mobile are required', 'error'); return; }
    if (!force) {
      const matches = await findDuplicateClients({ mobile: form.mobile, panNumber: form.pan_number, fullName: form.full_name });
      if (matches.length) { setDuplicates(matches); return; }
    }
    setSaving(true);
    try {
      const client = await createClient({
        ...form,
        dob: form.dob || null,
        pan_number: form.pan_number?.toUpperCase() || null,
        passport_number: form.passport_number?.toUpperCase() || null,
        assigned_to: user.id,
        assigned_name: profile.full_name,
        created_by: user.id,
      });
      await logAudit({ userId: user.id, userName: profile.full_name, action: 'CREATE', module: 'Clients', recordId: client.id, details: `Client created: ${client.full_name}` });

      for (const f of files) {
        await uploadDocument({ clientId: client.id, docType: f.docType, file: f.file, uploadedBy: user.id, uploadedName: profile.full_name });
      }
      if (files.length) {
        await logAudit({ userId: user.id, userName: profile.full_name, action: 'UPLOAD', module: 'KYC Vault', recordId: client.id, details: `${files.length} document(s) uploaded for ${client.full_name}` });
      }

      showToast('Client created' + (files.length ? ` with ${files.length} document(s)` : ''), 'success');
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
      <div className="card form-grid">
        <div className="fld form-full"><label>Full Name *</label><input value={form.full_name} onChange={set('full_name')} /></div>
        <div className="fld"><label>Mobile *</label><input value={form.mobile} onChange={set('mobile')} /></div>
        <div className="fld"><label>Email</label><input value={form.email} onChange={set('email')} /></div>
        <div className="fld"><label>Date of Birth</label><input type="date" value={form.dob} onChange={set('dob')} /></div>
        <div className="fld"><label>Occupation</label><input value={form.occupation} onChange={set('occupation')} /></div>

        <div className="fld"><label>PAN</label><input value={form.pan_number} onChange={set('pan_number')} style={{ textTransform: 'uppercase' }} /></div>
        <div className="fld"><label>Aadhaar</label><input value={form.aadhaar_number} onChange={set('aadhaar_number')} /></div>
        <div className="fld"><label>Passport Number</label><input value={form.passport_number} onChange={set('passport_number')} style={{ textTransform: 'uppercase' }} /></div>
        <div className="fld"><label>Driving License</label><input value={form.dl_number} onChange={set('dl_number')} /></div>
        <div className="fld"><label>Voter ID</label><input value={form.voter_id} onChange={set('voter_id')} /></div>
        <div className="fld"><label>GSTIN</label><input value={form.gstin} onChange={set('gstin')} /></div>

        <div className="fld form-full"><label>Address</label><input value={form.address} onChange={set('address')} /></div>
        <div className="fld"><label>City</label><input value={form.city} onChange={set('city')} /></div>
        <div className="fld"><label>State</label><input value={form.state} onChange={set('state')} /></div>
        <div className="fld"><label>Pincode</label><input value={form.pincode} onChange={set('pincode')} /></div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-title">Documents</div>
        <label className="dropzone">
          <i className="ti ti-cloud-upload" style={{ fontSize: 28, color: 'var(--gold)' }} />
          <div>Click to select files, or drag them here</div>
          <div className="dim" style={{ fontSize: 11 }}>PDF, JPG, PNG accepted</div>
          <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={(e) => addFiles(e.target.files)} />
        </label>

        {files.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {files.map((f, i) => (
              <div key={i} className="dup-row" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className="ti ti-file" />
                <span style={{ flex: 1 }}>{f.file.name}</span>
                <select value={f.docType} onChange={(e) => setFileDocType(i, e.target.value)}>
                  {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <button className="link-btn" onClick={() => removeFile(i)}><i className="ti ti-x" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {duplicates.length > 0 && (
        <div className="card duplicate-warning">
          <div className="card-title"><i className="ti ti-alert-triangle" /> Possible duplicate client{duplicates.length > 1 ? 's' : ''} found</div>
          {duplicates.map((d) => (
            <div key={d.id} className="dup-row">
              {d.full_name} — {d.mobile} {d.pan_number ? `· ${d.pan_number}` : ''} <span className="dim">({d.matchType} match)</span>
            </div>
          ))}
          <div className="modal-footer">
            <button className="btn" onClick={() => navigate(`/clients/${duplicates[0].id}`)}>View existing client</button>
            <button className="btn btn-gold" onClick={() => save(true)}>Save anyway (new client)</button>
          </div>
        </div>
      )}

      <div className="page-hdr" style={{ marginTop: 16 }}>
        <button className="btn" onClick={checkDuplicates} disabled={checking}>{checking ? 'Checking...' : 'Check duplicates'}</button>
        <button className="btn btn-gold" onClick={() => save(false)} disabled={saving}>
          <i className="ti ti-check" /> {saving ? 'Saving...' : 'Save Client'}
        </button>
      </div>
    </div>
  );
}
