import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import * as claimService from './services/claimService';
import { notify } from '../../services/notifications/notificationService';
import QuickContact from '../../components/common/QuickContact';
import { CLAIM_FIELD_CONFIG } from './claimFieldConfig';
import { capitalizeWords } from '../../utils/text';

const DOC_TYPES = ['Claim Form', 'Death Certificate', 'Medical Report', 'Discharge Summary', 'Policy Copy', 'ID Proof', 'Other'];

export default function ClaimDetailPage() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [claim, setClaim] = useState(null);
  const [activities, setActivities] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [tab, setTab] = useState('overview');
  const [docType, setDocType] = useState('Other');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    setClaim(await claimService.getClaim(id));
    setActivities(await claimService.listClaimActivities(id));
    setDocuments(await claimService.listClaimDocuments(id));
  };
  useEffect(() => { load(); }, [id]);

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

  return (
    <div className="ticket-detail">
      <div className="ticket-main card">
        <div className="page-hdr">
          <div>
            <span className="ticket-ref">{claim.claim_ref}</span>
            {claim.claim_type && <span className="badge b-gold" style={{ marginLeft: 8 }}>{claim.claim_type}</span>}
            <h1>{claim.client_name}</h1>
          </div>
          <select value={claim.status} onChange={(e) => changeStatus(e.target.value)}>
            {claimService.CLAIM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="tabs">
          {['overview', 'documents', 'timeline'].map((t) => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="form-grid" style={{ marginTop: 12 }}>
            {(CLAIM_FIELD_CONFIG[claim.claim_type] || []).filter((f) => f.type !== 'status').map((f) => {
              let val;
              if (f.target === 'top') val = claim[f.field];
              else val = claim.details?.[f.field];
              if (f.type === 'number' && val) val = `₹${Number(val).toLocaleString('en-IN')}`;
              return (
                <div key={f.field} className={`fld ${f.type === 'textarea' ? 'form-full' : ''}`}>
                  <label>{f.label}</label>
                  <div className="field-val">{val || '—'}</div>
                </div>
              );
            })}
            {!claim.claim_type && (
              <>
                <div className="fld"><label>Client</label><div className="field-val">{claim.client_name || '—'}</div></div>
                <div className="fld"><label>Policy Number</label><div className="field-val">{claim.policy_number || '—'}</div></div>
                <div className="fld"><label>Amount</label><div className="field-val">{claim.claim_amount ? `₹${Number(claim.claim_amount).toLocaleString('en-IN')}` : '—'}</div></div>
              </>
            )}
            <div className="fld"><label>Age</label><div className="field-val">{days === null ? 'Closed' : `${days} days`}</div></div>
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
