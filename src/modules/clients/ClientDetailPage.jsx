import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getClient, listPolicies } from './services/clientService';
import { listClientDocuments } from '../documents/services/documentService';

export default function ClientDetailPage() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    getClient(id).then(setClient);
    listPolicies(id).then(setPolicies);
    listClientDocuments(id).then(setDocuments);
  }, [id]);

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
        <div className="card" style={{ marginTop: 12 }}>
          {documents.length === 0 ? <div className="table-empty">No documents uploaded</div> :
            documents.map((d) => (
              <div key={d.id} className="dup-row"><i className="ti ti-file" /> {d.doc_type} — {d.file_name} <span className="dim">{d.status}</span></div>
            ))}
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
