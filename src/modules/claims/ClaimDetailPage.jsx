import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import * as claimService from './services/claimService';
import { notify } from '../../services/notifications/notificationService';
import { logAudit } from '../../services/audit/auditService';
import { useEmployees } from '../../hooks/useEmployees';
import { CLAIM_FIELD_CONFIG } from './claimFieldConfig';
import { capitalizeWords } from '../../utils/text';

const DOC_TYPES = ['Claim Form', 'Death Certificate', 'Medical Report', 'Discharge Summary', 'Policy Copy', 'ID Proof', 'Other'];

export default function ClaimDetailPage() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const employees = useEmployees();
  const [claim, setClaim] = useState(null);
  const [activities, setActivities] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [tab, setTab] = useState('overview');
  const [docType, setDocType] = useState('Other');
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [editRe, setEditRe] = useState('');
  const [editRm, setEditRm] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    setClaim(await claimService.getClaim(id));
    setActivities(await claimService.listClaimActivities(id));
    setDocuments(await claimService.listClaimDocuments(id));
  };
  useEffect(() => { load(); }, [id]);

  const startEdit = () => {
    const fields = CLAIM_FIELD_CONFIG[claim.claim_type] || [];
    const vals = {};
    for (const f of fields) {
      if (f.type === 'status') continue;
      vals[f.field] = f.target === 'top' ? (claim[f.field] ?? '') : (claim.details?.[f.field] ?? '');
    }
    setEditValues(vals);
    setEditRe(claim.assigned_to || '');
    setEditRm(claim.rm_id || '');
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = async () => {
    setSaving(true);
    try {
      const fields = CLAIM_FIELD_CONFIG[claim.claim_type] || [];
      const top = {};
      const details = { ...claim.details };
      for (const f of fields) {
        if (f.type === 'status') continue;
        const v = editValues[f.field];
        if (f.target === 'top') top[f.field] = f.type === 'number' ? (v === '' ? null : Number(v)) : (v || null);
        else details[f.field] = v || null;
      }
      const re = employees.find((e) => e.id === editRe);
      const rm = employees.find((e) => e.id === editRm);
      await claimService.updateClaim(id, {
        ...top, details,
        assigned_to: editRe || null,
        assigned_name: re?.full_name || null,
        rm_id: editRm || null,
        rm_name: rm?.full_name || null,
      });
      await claimService.logClaimActivity(id, user.id, profile.full_name, 'CLAIM_EDITED', null, null, 'Details updated');
      await logAudit({ userId: user.id, userName: profile.full_name, action: 'UPDATE', module: 'Claims', recordId: id, details: 'Claim details edited' });
      const notifyTargets = [editRe, editRm, claim.assigned_to, claim.rm_id].filter((tid) => tid && tid !== user.id);
      for (const targetId of [...new Set(notifyTargets)]) {
        await notify({ userId: targetId, title: 'Claim details updated', body: claim.client_name, type: 'info', linkType: 'claim', linkId: id });
      }
      showToast('Claim updated', 'success');
      setEditing(false);
      load();
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (status) => {
    await claimService.updateClaimStatus(id, status, user.id, profile.full_name);
    const notifyTargets = [claim.assigned_to, claim.rm_id].filter((tid) => tid && tid !== user.id);
    for (const targetId of [...new Set(notifyTargets)]) {
      await notify({ userId: targetId, title: `Claim status: ${status}`, body: claim.client_name, type: 'info', linkType: 'claim', linkId: id });
    }
    showToast(`Claim status → ${status}`, 'success');
    load();
  };

  const onUpload = async (files) => {
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        await claimService.uploadClaimDocument({ claimId: id, docType, file, uploadedBy: user.id, uploadedName: profile.full_name });
      }
      await claimService.logClaimActivity(id, user.id, profile.full_name, 'DOCUMENT_UPLOADED', null, `${files.length} file(s)`);
      showToast(`${files.length} document(s) uploaded`, 'success');
      load();
    } catch (e) {
      showToast('Upload failed: ' + e.message, 'error');
    } finally {
      setUploading(false);
      fileRef.current.value = '';
    }
  };

  if (!claim) return <div className="full-loader"><i className="spin ti ti-loader" /></div>;
  const days = claimService.claimAgeDays(claim);
  const fields = (CLAIM_FIELD_CONFIG[claim.claim_type] || []).filter((f) => f.type !== 'status');

  return (
    <div className="ticket-detail">
      <div className="ticket-main card">
        <div className="page-hdr">
          <div>
            <span className="ticket-ref">{claim.claim_ref}</span>
            {claim.claim_type && <span className="badge b-gold" style={{ marginLeft: 8 }}>{claim.claim_type}</span>}
            <h1>{claim.client_name}</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={claim.status} onChange={(e) => changeStatus(e.target.value)}>
              {claimService.CLAIM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {tab === 'overview' && !editing && (
              <button className="btn" onClick={startEdit}><i className="ti ti-edit" /> Edit</button>
            )}
          </div>
        </div>

        <div className="tabs">
          {['overview', 'documents', 'timeline'].map((t) => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => { setTab(t); setEditing(false); }}>{t[0].toUpperCase() + t.slice(1)}</button>
          ))}
        </div>

        {tab === 'overview' && !editing && (
          <div className="form-grid" style={{ marginTop: 12 }}>
            {fields.map((f) => {
              let val = f.target === 'top' ? claim[f.field] : claim.details?.[f.field];
              if (f.type === 'number' && val) val = `₹${Number(val).toLocaleString('en-IN')}`;
              return (
                <div key={f.field} className={`fld ${f.type === 'textarea' ? 'form-full' : ''}`}>
                  <label>{f.label}</label>
                  <div className="field-val">{val || '—'}</div>
                </div>
              );
            })}
            <div className="fld"><label>Age</label><div className="field-val">{days === null ? 'Closed' : `${days} days`}</div></div>
          </div>
        )}

        {tab === 'overview' && editing && (
          <div style={{ marginTop: 12 }}>
            <div className="form-grid">
              <div className="fld">
                <label>RE (Relationship Executive)</label>
                <select value={editRe} onChange={(e) => setEditRe(e.target.value)}>
                  {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
                </select>
              </div>
              <div className="fld">
                <label>RM (Relationship Manager)</label>
                <select value={editRm} onChange={(e) => setEditRm(e.target.value)}>
                  <option value="">None</option>
                  {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
                </select>
              </div>
              {fields.map((f) => (
                <div key={f.field} className={`fld ${f.type === 'textarea' ? 'form-full' : ''}`}>
                  <label>{f.label}</label>
                  <input
                    type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                    value={editValues[f.field] || ''}
                    onChange={(e) => setEditValues({ ...editValues, [f.field]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="page-hdr" style={{ marginTop: 16 }}>
              <button className="btn" onClick={cancelEdit}>Cancel</button>
              <button className="btn btn-gold" onClick={saveEdit} disabled={saving}>
                <i className="ti ti-check" /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {tab === 'documents' && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
              <select value={docType} onChange={(e) => setDocType(e.target.value)}>
                {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={(e) => onUpload(Array.from(e.target.files))} />
              <button className="btn btn-gold" onClick={() => fileRef.current.click()} disabled={uploading}>
                <i className="ti ti-cloud-upload" /> {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
            {documents.length === 0 ? <div className="table-empty">No documents uploaded</div> :
              documents.map((d) => (
                <div key={d.id} className="dup-row">
                  <i className="ti ti-file" /> {d.doc_type} — {d.file_name}
                  {d.file_url && <a href={d.file_url} target="_blank" rel="noreferrer" className="link-btn" style={{ marginLeft: 10 }}>View</a>}
                </div>
              ))}
          </div>
        )}

        {tab === 'timeline' && (
          <div className="chat-messages" style={{ maxHeight: 300, marginTop: 12 }}>
            {activities.length === 0 && <div className="table-empty">No activity yet</div>}
            {activities.map((a) => (
              <div key={a.id} className="dup-row">
                <b>{a.actor_name}</b> — {a.action.replace(/_/g, ' ')}
                {a.old_value ? <span className="dim"> {a.old_value} → {a.new_value}</span> : a.new_value ? <span className="dim"> {a.new_value}</span> : null}
                {a.note ? <span className="dim"> — {a.note}</span> : null}
                <div style={{ fontSize: 11, color: 'var(--text4)' }}>{new Date(a.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="ticket-side">
        <div className="card">
          <div className="card-title">Claim Info</div>
          <div className="dup-row">RE: {capitalizeWords(claim.assigned_name) || '—'}</div>
          <div className="dup-row">RM: {capitalizeWords(claim.rm_name) || '—'}</div>
          <div className="dup-row">Filed: {claim.filed_date}</div>
          <div className="dup-row">Notes: {claim.notes || '—'}</div>
        </div>
      </div>
    </div>
  );
}
