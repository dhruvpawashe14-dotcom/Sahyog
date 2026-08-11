import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { getClient, listPolicies, createPolicy, updateClient } from './services/clientService';
import Modal from '../../components/common/Modal';
import { listClientDocuments, uploadDocument } from '../documents/services/documentService';
import QuickContact from '../../components/common/QuickContact';
import { useEmployees } from '../../hooks/useEmployees';
import { logAudit } from '../../services/audit/auditService';

const DOC_TYPES = ['PAN Card', 'Aadhaar Card', 'Passport', 'Driving License', 'Voter ID', 'GSTIN Certificate', 'Photo', 'Other'];

export default function ClientDetailPage() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const employees = useEmployees();
  const [client, setClient] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [tab, setTab] = useState('overview');
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('Other');
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [policyForm, setPolicyForm] = useState({ policy_number: '', product: '', insurer: '', premium: '', sum_assured: '', start_date: '', renewal_date: '' });
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const fileRef = useRef(null);

  const load = () => {
    getClient(id).then(setClient);
    listPolicies(id).then(setPolicies);
    listClientDocuments(id).then(setDocuments);
  };
  useEffect(() => { load(); }, [id]);

  const startEdit = () => {
    setEditForm({
      full_name: client.full_name || '', mobile: client.mobile || '', email: client.email || '',
      pan_number: client.pan_number || '', aadhaar_number: client.aadhaar_number || '',
      passport_number: client.passport_number || '', dl_number: client.dl_number || '',
      voter_id: client.voter_id || '', gstin: client.gstin || '',
      address: client.address || '', city: client.city || '', state: client.state || '', pincode: client.pincode || '',
      client_category: client.client_category || '', assigned_to: client.assigned_to || '', rm_id: client.rm_id || '',
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    const re = employees.find((e) => e.id === editForm.assigned_to);
    const rm = employees.find((e) => e.id === editForm.rm_id);
    await updateClient(id, {
      ...editForm,
      pan_number: editForm.pan_number.toUpperCase(),
      assigned_name: re?.full_name || client.assigned_name,
      rm_name: rm?.full_name || null,
    });
    await logAudit({ userId: user.id, userName: profile.full_name, action: 'UPDATE', module: 'Clients', recordId: id, details: `Client details updated: ${editForm.full_name}` });
    setEditing(false);
    showToast('Client updated', 'success');
    load();
  };

  const onUpload = async (files) => {
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        await uploadDocument({ clientId: id, docType, file, uploadedBy: user.id, uploadedName: profile.full_name });
      }
      showToast(`${files.length} document(s) uploaded`, 'success');
      load();
    } catch (e) {
      showToast('Upload failed: ' + e.message, 'error');
    } finally {
      setUploading(false);
      fileRef.current.value = '';
    }
  };

  const savePolicy = async () => {
    if (!policyForm.policy_number || !policyForm.product) { showToast('Policy number and product are required', 'error'); return; }
    await createPolicy({
      ...policyForm, client_id: id,
      premium: policyForm.premium ? Number(policyForm.premium) : null,
      sum_assured: policyForm.sum_assured ? Number(policyForm.sum_assured) : null,
      start_date: policyForm.start_date || null, renewal_date: policyForm.renewal_date || null,
      created_by: user.id,
    });
    setPolicyModalOpen(false);
    setPolicyForm({ policy_number: '', product: '', insurer: '', premium: '', sum_assured: '', start_date: '', renewal_date: '' });
    showToast('Policy added', 'success');
    load();
  };

  if (!client) return <div className="full-loader"><i className="spin ti ti-loader" /></div>;

  return (
    <div>
      <div className="page-hdr">
        <div><h1>{client.full_name}</h1><p>{client.mobile} <QuickContact mobile={client.mobile} /> · {client.email || 'no email'}</p></div>
        {tab === 'overview' && !editing && (
          <button className="btn" onClick={startEdit}><i className="ti ti-edit" /> Edit</button>
        )}
      </div>

      <div className="tabs">
        {['overview', 'policies', 'documents'].map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => { setTab(t); setEditing(false); }}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && !editing && (
        <div className="card form-grid" style={{ marginTop: 12 }}>
          <Field label="Client Category" value={client.client_category} />
          <Field label="RE" value={client.assigned_name} />
          <Field label="RM" value={client.rm_name} />
          <Field label="PAN" value={client.pan_number} />
          <Field label="Aadhaar" value={client.aadhaar_number} />
          <Field label="Passport" value={client.passport_number} />
          <Field label="Driving License" value={client.dl_number} />
          <Field label="Voter ID" value={client.voter_id} />
          <Field label="GSTIN" value={client.gstin} />
          <Field label="City" value={client.city} />
          <Field label="State" value={client.state} />
          <Field label="Address" value={client.address} full />
        </div>
      )}

      {tab === 'overview' && editing && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="form-grid">
            <div className="fld form-full"><label>Full Name</label><input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} /></div>
            <div className="fld"><label>Mobile</label><input value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} /></div>
            <div className="fld"><label>Email</label><input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
            <div className="fld">
              <label>Client Category</label>
              <select value={editForm.client_category} onChange={(e) => setEditForm({ ...editForm, client_category: e.target.value })}>
                <option value="">Select...</option><option>Retail</option><option>Corporate</option>
              </select>
            </div>
            <div className="fld">
              <label>RE (Relationship Executive)</label>
              <select value={editForm.assigned_to} onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value })}>
                {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
              </select>
            </div>
            <div className="fld">
              <label>RM (Relationship Manager)</label>
              <select value={editForm.rm_id} onChange={(e) => setEditForm({ ...editForm, rm_id: e.target.value })}>
                <option value="">None</option>
                {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
              </select>
            </div>
            <div className="fld"><label>PAN</label><input value={editForm.pan_number} onChange={(e) => setEditForm({ ...editForm, pan_number: e.target.value })} style={{ textTransform: 'uppercase' }} /></div>
            <div className="fld"><label>Aadhaar</label><input value={editForm.aadhaar_number} onChange={(e) => setEditForm({ ...editForm, aadhaar_number: e.target.value })} /></div>
            <div className="fld"><label>Passport</label><input value={editForm.passport_number} onChange={(e) => setEditForm({ ...editForm, passport_number: e.target.value })} /></div>
            <div className="fld"><label>Driving License</label><input value={editForm.dl_number} onChange={(e) => setEditForm({ ...editForm, dl_number: e.target.value })} /></div>
            <div className="fld"><label>Voter ID</label><input value={editForm.voter_id} onChange={(e) => setEditForm({ ...editForm, voter_id: e.target.value })} /></div>
            <div className="fld"><label>GSTIN</label><input value={editForm.gstin} onChange={(e) => setEditForm({ ...editForm, gstin: e.target.value })} /></div>
            <div className="fld form-full"><label>Address</label><input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} /></div>
            <div className="fld"><label>City</label><input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} /></div>
            <div className="fld"><label>State</label><input value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} /></div>
            <div className="fld"><label>Pincode</label><input value={editForm.pincode} onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })} /></div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn btn-gold" onClick={saveEdit}>Save Changes</button>
          </div>
        </div>
      )}

      {tab === 'policies' && (
        <div style={{ marginTop: 12 }}>
          <div className="page-hdr" style={{ marginBottom: 10 }}>
            <div />
            <button className="btn btn-gold" onClick={() => setPolicyModalOpen(true)}><i className="ti ti-plus" /> Add Policy</button>
          </div>
          <div className="card">
            {policies.length === 0 ? <div className="table-empty">No policies yet</div> :
              policies.map((p) => (
                <div key={p.id} className="dup-row">{p.policy_number} — {p.product} · ₹{p.premium} <span className="dim">{p.status}{p.renewal_date ? ` · renews ${p.renewal_date}` : ''}</span></div>
              ))}
          </div>
        </div>
      )}

      <Modal open={policyModalOpen} title="Add Policy" onClose={() => setPolicyModalOpen(false)} footer={<button className="btn btn-gold" onClick={savePolicy}>Save</button>}>
        <div className="form-grid">
          <div className="fld"><label>Policy Number *</label><input value={policyForm.policy_number} onChange={(e) => setPolicyForm({ ...policyForm, policy_number: e.target.value })} /></div>
          <div className="fld"><label>Product *</label><input value={policyForm.product} onChange={(e) => setPolicyForm({ ...policyForm, product: e.target.value })} /></div>
          <div className="fld"><label>Insurer</label><input value={policyForm.insurer} onChange={(e) => setPolicyForm({ ...policyForm, insurer: e.target.value })} /></div>
          <div className="fld"><label>Premium (₹)</label><input type="number" value={policyForm.premium} onChange={(e) => setPolicyForm({ ...policyForm, premium: e.target.value })} /></div>
          <div className="fld"><label>Sum Assured (₹)</label><input type="number" value={policyForm.sum_assured} onChange={(e) => setPolicyForm({ ...policyForm, sum_assured: e.target.value })} /></div>
          <div className="fld"><label>Start Date</label><input type="date" value={policyForm.start_date} onChange={(e) => setPolicyForm({ ...policyForm, start_date: e.target.value })} /></div>
          <div className="fld"><label>Renewal Date</label><input type="date" value={policyForm.renewal_date} onChange={(e) => setPolicyForm({ ...policyForm, renewal_date: e.target.value })} /></div>
        </div>
      </Modal>

      {tab === 'documents' && (
        <div style={{ marginTop: 12 }}>
          <div className="card" style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
            <select value={docType} onChange={(e) => setDocType(e.target.value)}>
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={(e) => onUpload(Array.from(e.target.files))} />
            <button className="btn btn-gold" onClick={() => fileRef.current.click()} disabled={uploading}>
              <i className="ti ti-cloud-upload" /> {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
          <div className="card">
            {documents.length === 0 ? <div className="table-empty">No documents uploaded</div> :
              documents.map((d) => (
                <div key={d.id} className="dup-row">
                  <i className="ti ti-file" /> {d.doc_type} — {d.file_name} <span className="dim">{d.status}</span>
                  {d.file_url && <a href={d.file_url} target="_blank" rel="noreferrer" className="link-btn" style={{ marginLeft: 10 }}>View</a>}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, full }) {
  return (
    <div className={`fld ${full ? 'form-full' : ''}`}>
      <label>{label}</label>
      <div className="field-val">{value || '—'}</div>
    </div>
  );
}
