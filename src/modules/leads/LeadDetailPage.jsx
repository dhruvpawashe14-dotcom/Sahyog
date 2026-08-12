import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import * as leadService from './services/leadService';
import { logAudit } from '../../services/audit/auditService';
import { notify } from '../../services/notifications/notificationService';
import { listLeadDocuments } from '../documents/services/documentService';

export default function LeadDetailPage() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [attachments, setAttachments] = useState([]);

  const load = async () => {
    setLead(await leadService.getLead(id));
    setActivities(await leadService.listActivities(id));
    setAttachments(await listLeadDocuments(id));
  };
  useEffect(() => { load(); }, [id]);

  const changeStage = async (stage) => {
    await leadService.updateLeadStage(id, stage, user.id, profile.full_name);
    if (lead.assigned_to && lead.assigned_to !== user.id) {
      await notify({ userId: lead.assigned_to, title: `Lead stage: ${stage}`, body: lead.full_name, type: 'info', linkType: 'lead', linkId: id });
    }
    showToast(`Stage → ${stage}`, 'success');
    load();
  };

  const convert = async () => {
    const client = await leadService.convertToClient(lead, user.id, profile.full_name);
    await logAudit({ userId: user.id, userName: profile.full_name, action: 'UPDATE', module: 'Leads', recordId: lead.id, details: `Converted to client #${client.id}` });
    showToast('Lead converted to client', 'success');
    navigate(`/clients/${client.id}`);
  };

  if (!lead) return <div className="full-loader"><i className="spin ti ti-loader" /></div>;

  return (
    <div className="ticket-detail">
      <div className="ticket-main card">
        <div className="page-hdr">
          <div><h1>{lead.full_name}</h1><p>{lead.mobile} · {lead.product || 'no product'}</p></div>
          <select value={lead.stage} onChange={(e) => changeStage(e.target.value)}>
            {leadService.STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="card-title" style={{ marginTop: 10 }}>Activity Timeline</div>
        <div className="chat-messages" style={{ maxHeight: 320 }}>
          {activities.length === 0 && <div className="table-empty">No activity yet</div>}
          {activities.map((a) => (
            <div key={a.id} className="dup-row">
              <b>{a.actor_name}</b> — {a.action.replace(/_/g, ' ')}
              {a.old_value ? <span className="dim"> {a.old_value} → {a.new_value}</span> : a.new_value ? <span className="dim"> {a.new_value}</span> : null}
              <div style={{ fontSize: 11, color: 'var(--text4)' }}>{new Date(a.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="ticket-side">
        <div className="card">
          <div className="card-title">Lead Info</div>
          <div className="dup-row">Advisor: {lead.assigned_name}</div>
          <div className="dup-row">City: {lead.city || '—'}</div>
          <div className="dup-row">Notes: {lead.notes || '—'}</div>
        </div>
        {attachments.length > 0 && (
          <div className="card" style={{ marginTop: 12 }}>
            <div className="card-title">Attachments</div>
            {attachments.map((a) => (
              <div key={a.id} className="dup-row">
                <i className="ti ti-file" /> {a.doc_type} — {a.file_name}
                {a.file_url && <a href={a.file_url} target="_blank" rel="noreferrer" className="link-btn" style={{ marginLeft: 8 }}>View</a>}
              </div>
            ))}
          </div>
        )}
        {lead.stage !== 'Closed Lost' && (
          <button className="btn btn-gold" style={{ width: '100%', marginTop: 12 }} onClick={convert}>
            <i className="ti ti-user-check" /> Convert to Client
          </button>
        )}
      </div>
    </div>
  );
}
