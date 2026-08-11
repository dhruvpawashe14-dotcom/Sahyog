import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { getClient, listPolicies } from './services/clientService';
import { listClientDocuments, uploadDocument } from '../documents/services/documentService';

const DOC_TYPES = ['PAN Card', 'Aadhaar Card', 'Passport', 'Driving License', 'Voter ID', 'GSTIN Certificate', 'Photo', 'Other'];

export default function ClientDetailPage() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [client, setClient] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [tab, setTab] = useState('overview');
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('Other');
  const fileRef = useRef(null);

  const load = () => {
    getClient(id).then(setClient);
    listPolicies(id).then(setPolicies);
    listClientDocuments(id).then(setDocuments);
  };
  useEffect(() => { load(); }, [id]);

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

  if (!client) return <div className="full-loader"><i className="spin ti ti-loader" /></div>;

  return (
    <div>
      <div className="page-hdr">
        <div><h1>{client.full_name}</h1><p>{client.mobile} · {client.email || 'no email'}</p></div>
      </div>

      <div className="tabs">
        {['overview', 'policies', 'documents'].map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="card form-grid" style={{ marginTop: 12 }}>
          <Field label="PAN" value={client.pan_number} />
          <Field label="Aadhaar" value={client.aadhaar_number} />
          <Field label="Passport" value={client.passport_number} />
          <Field label="Driving License" value={client.dl_number} />
          <Field label="Voter ID" value={client.voter_id} />
          <Field label="GSTIN" value={client.gstin} />
          <Field label="City" value={client.city} />
          <Field label="State" value={client.state} />
          <Field label="Advisor" value={client.assigned_name} />
          <Field label="Address" value={client.address} full />
        </div>
      )}

      {tab === 'policies' && (
        <div className="card" style={{ marginTop: 12 }}>
          {policies.length === 0 ? <div className="table-empty">No policies yet</div> :
            policies.map((p) => (
              <div key={p.id} className="dup-row">{p.policy_number} — {p.product} · ₹{p.premium} <span className="dim">{p.status}</span></div>
            ))}
        </div>
      )}

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
