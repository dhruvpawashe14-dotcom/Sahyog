import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { createClient, findDuplicateClients } from './services/clientService';
import { uploadDocument } from '../documents/services/documentService';
import { logAudit } from '../../services/audit/auditService';
import IDFieldWithUpload from '../../components/forms/IDFieldWithUpload';

const empty = {
  full_name: '', mobile: '', email: '', dob: '', occupation: '',
  pan_number: '', aadhaar_number: '', passport_number: '', dl_number: '', voter_id: '', gstin: '',
  address: '', city: '', state: '', pincode: '',
};

// Maps each ID field to the doc_type label stored against the uploaded file.
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
  const [idFiles, setIdFiles] = useState({}); // { pan_number: File, aadhaar_number: File, ... }
  const [otherFiles, setOtherFiles] = useState([]); // [{ file, docType }]
  const [duplicates, setDuplicates] = useState([]);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const addOtherFiles = (fileList) => {
    const newOnes = Array.from(fileList).map((file) => ({ file, docType: 'Other' }));
    setOtherFiles((prev) => [...prev, ...newOnes]);
  };
  const removeOtherFile = (idx) => setOtherFiles((prev) => prev.filter((_, i) => i !== idx));

  const checkDuplicates = async () => {
    setChecking(true);
    try {
      const matches = await findDuplicateClients({ mobile: form.mobile, panNumber: form.pan_number, fullName: form.full_name });
      setDuplicates(matches);
    } finally {
      setChecking(false);
    }
  };

  const totalFileCount = Object.keys(idFiles).length + otherFiles.length;

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
          <div className="fld"><label>Occupation</label><input value={form.occupation} onChange={set('occupation')} /></div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-title">Identity Documents <span className="dim">— attach a copy right next to each ID</span></div>
        <div className="form-grid">
          {ID_DOCS.map((doc) => (
            <IDFieldWithUpload
              key={doc.key}
              label={doc.label}
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
