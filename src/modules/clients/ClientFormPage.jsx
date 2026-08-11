import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { createClient, findDuplicateClients } from './services/clientService';
import { logAudit } from '../../services/audit/auditService';

const empty = { full_name: '', mobile: '', email: '', pan_number: '', aadhaar_number: '', address: '', city: '', state: '' };

export default function ClientFormPage() {
  const [form, setForm] = useState(empty);
  const [duplicates, setDuplicates] = useState([]);
  const [checking, setChecking] = useState(false);
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

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
    const client = await createClient({
      ...form,
      pan_number: form.pan_number?.toUpperCase() || null,
      assigned_to: user.id,
      assigned_name: profile.full_name,
      created_by: user.id,
    });
    await logAudit({ userId: user.id, userName: profile.full_name, action: 'CREATE', module: 'Clients', recordId: client.id, details: `Client created: ${client.full_name}` });
    showToast('Client created', 'success');
    navigate(`/clients/${client.id}`);
  };

  return (
    <div>
      <div className="page-hdr"><h1>Add New Client</h1></div>
      <div className="card form-grid">
        <div className="fld form-full"><label>Full Name *</label><input value={form.full_name} onChange={set('full_name')} /></div>
        <div className="fld"><label>Mobile *</label><input value={form.mobile} onChange={set('mobile')} /></div>
        <div className="fld"><label>Email</label><input value={form.email} onChange={set('email')} /></div>
        <div className="fld"><label>PAN</label><input value={form.pan_number} onChange={set('pan_number')} style={{ textTransform: 'uppercase' }} /></div>
        <div className="fld"><label>Aadhaar</label><input value={form.aadhaar_number} onChange={set('aadhaar_number')} /></div>
        <div className="fld form-full"><label>Address</label><input value={form.address} onChange={set('address')} /></div>
        <div className="fld"><label>City</label><input value={form.city} onChange={set('city')} /></div>
        <div className="fld"><label>State</label><input value={form.state} onChange={set('state')} /></div>
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
        <button className="btn btn-gold" onClick={() => save(false)}><i className="ti ti-check" /> Save Client</button>
      </div>
    </div>
  );
}
