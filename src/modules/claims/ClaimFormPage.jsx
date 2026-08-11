import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { createClaim } from './services/claimService';
import { logAudit } from '../../services/audit/auditService';
import { useEmployees } from '../../hooks/useEmployees';
import { CLAIM_TYPES, CLAIM_FIELD_CONFIG, splitFormValues } from './claimFieldConfig';

export default function ClaimFormPage() {
  const [claimType, setClaimType] = useState('');
  const [values, setValues] = useState({});
  const [assignedTo, setAssignedTo] = useState('');
  const [saving, setSaving] = useState(false);
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const employees = useEmployees();

  useEffect(() => { if (user && !assignedTo) setAssignedTo(user.id); }, [user]);

  const setField = (field) => (e) => setValues({ ...values, [field]: e.target.value });

  const fields = CLAIM_FIELD_CONFIG[claimType] || [];
  const visibleFields = fields.filter((f) => f.type !== 'status'); // status set later via workflow

  const save = async () => {
    if (!claimType) { showToast('Please select a claim type', 'error'); return; }
    const nameField = fields.find((f) => f.field === 'client_name');
    if (nameField && !values.client_name) { showToast(`${nameField.label} is required`, 'error'); return; }

    setSaving(true);
    try {
      const { top, details } = splitFormValues(claimType, values);
      const assignee = employees.find((e) => e.id === assignedTo) || profile;
      const claim = await createClaim({
        ...top,
        claim_type: claimType,
        details,
        assigned_to: assignedTo || user.id,
        assigned_name: assignee.full_name,
        created_by: user.id,
      });
      await logAudit({ userId: user.id, userName: profile.full_name, action: 'CREATE', module: 'Claims', recordId: claim.id, details: `${claimType} claim filed: ${claim.client_name}` });
      showToast('Claim filed', 'success');
      navigate(`/claims/${claim.id}`);
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-hdr"><h1>File New Claim</h1></div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="fld" style={{ maxWidth: 320 }}>
          <label>Claim Type *</label>
          <select value={claimType} onChange={(e) => { setClaimType(e.target.value); setValues({}); }}>
            <option value="">Select...</option>
            {CLAIM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {claimType && (
        <div className="ticket-detail">
          <div className="card">
            <div className="card-title">{claimType} Claim Details</div>
            <div className="form-grid">
              {visibleFields.map((f) => (
                <div key={f.field} className={`fld ${f.type === 'textarea' ? 'form-full' : ''}`}>
                  <label>{f.label}{f.required ? ' *' : ''}</label>
                  <input
                    type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                    value={values[f.field] || ''}
                    onChange={setField(f.field)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="ticket-side">
            <div className="card">
              <div className="card-title">Assignment</div>
              <div className="fld">
                <label>Assign To</label>
                <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                  {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.full_name}{emp.id === user.id ? ' (You)' : ''}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-gold" style={{ width: '100%', marginTop: 12 }} onClick={save} disabled={saving}>
              <i className="ti ti-check" /> {saving ? 'Filing...' : 'File Claim'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
