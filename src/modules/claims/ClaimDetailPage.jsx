import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import * as claimService from './services/claimService';

export default function ClaimDetailPage() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [claim, setClaim] = useState(null);
  const [activities, setActivities] = useState([]);

  const load = async () => {
    setClaim(await claimService.getClaim(id));
    setActivities(await claimService.listClaimActivities(id));
  };
  useEffect(() => { load(); }, [id]);

  const changeStatus = async (status) => {
    await claimService.updateClaimStatus(id, status, user.id, profile.full_name);
    showToast(`Claim status → ${status}`, 'success');
    load();
  };

  if (!claim) return <div className="full-loader"><i className="spin ti ti-loader" /></div>;
  const days = claimService.claimAgeDays(claim);

  return (
    <div className="ticket-detail">
      <div className="ticket-main card">
        <div className="page-hdr">
          <div><span className="ticket-ref">{claim.claim_ref}</span><h1>{claim.client_name}</h1></div>
          <select value={claim.status} onChange={(e) => changeStatus(e.target.value)}>
            {claimService.CLAIM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-grid">
          <div className="fld"><label>Policy Number</label><div className="field-val">{claim.policy_number || '—'}</div></div>
          <div className="fld"><label>Claim Type</label><div className="field-val">{claim.claim_type || '—'}</div></div>
          <div className="fld"><label>Amount</label><div className="field-val">{claim.claim_amount ? `₹${Number(claim.claim_amount).toLocaleString('en-IN')}` : '—'}</div></div>
          <div className="fld"><label>Age</label><div className="field-val">{days === null ? 'Closed' : `${days} days`}</div></div>
        </div>

        <div className="card-title" style={{ marginTop: 10 }}>Activity Timeline</div>
        <div className="chat-messages" style={{ maxHeight: 300 }}>
          {activities.length === 0 && <div className="table-empty">No activity yet</div>}
          {activities.map((a) => (
            <div key={a.id} className="dup-row">
              <b>{a.actor_name}</b> — {a.action.replace(/_/g, ' ')}
              {a.old_value ? <span className="dim"> {a.old_value} → {a.new_value}</span> : null}
              <div style={{ fontSize: 11, color: 'var(--text4)' }}>{new Date(a.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="ticket-side">
        <div className="card">
          <div className="card-title">Claim Info</div>
          <div className="dup-row">Assigned: {claim.assigned_name || '—'}</div>
          <div className="dup-row">Filed: {claim.filed_date}</div>
          <div className="dup-row">Notes: {claim.notes || '—'}</div>
        </div>
      </div>
    </div>
  );
}
