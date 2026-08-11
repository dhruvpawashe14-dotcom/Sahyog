import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { createTicket, addTicketParticipant, uploadTicketAttachment, sendComment } from './services/ticketService';
import { logAudit } from '../../services/audit/auditService';
import { useEmployees } from '../../hooks/useEmployees';
import { TICKET_TAXONOMY, TICKET_TYPES } from './constants';

const SLA_HOURS = { Urgent: 4, High: 24, Medium: 48, Low: 96 };

export default function TicketFormPage() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const employees = useEmployees();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [ticketType, setTicketType] = useState('');
  const [ticketSubtype, setTicketSubtype] = useState('');
  const [assignedTo, setAssignedTo] = useState(user?.id || '');
  const [participantIds, setParticipantIds] = useState([]);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  const addFiles = (fileList) => setFiles((prev) => [...prev, ...Array.from(fileList)]);
  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const save = async () => {
    if (!subject) { showToast('Subject is required', 'error'); return; }
    setSaving(true);
    try {
      const assignee = employees.find((e) => e.id === assignedTo);
      const ticket = await createTicket({
        subject, description, priority,
        ticket_type: ticketType || null,
        ticket_subtype: ticketSubtype || null,
        raised_by: user.id,
        raised_name: profile.full_name,
        assigned_to: assignedTo || user.id,
        assigned_name: assignee?.full_name || profile.full_name,
      });

      for (const pid of participantIds) {
        if (pid !== assignedTo) await addTicketParticipant(ticket.id, pid);
      }

      for (const file of files) {
        const url = await uploadTicketAttachment(ticket.id, file);
        await sendComment({ ticketId: ticket.id, authorId: user.id, authorName: profile.full_name, body: file.name, isFile: true, fileUrl: url });
      }

      await logAudit({ userId: user.id, userName: profile.full_name, action: 'CREATE', module: 'Tickets', recordId: ticket.id, details: `Ticket raised: ${ticket.subject}` });
      showToast('Ticket created', 'success');
      navigate(`/tickets/${ticket.id}`);
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleParticipant = (id) => {
    setParticipantIds((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  return (
    <div>
      <div className="page-hdr"><h1>New Ticket</h1></div>
      <div className="ticket-detail">
        <div className="card">
          <div className="card-title">Ticket Details</div>
          <div className="form-grid">
            <div className="fld form-full"><label>Subject *</label><input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary of the issue" /></div>
            <div className="fld form-full"><label>Description</label><input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details..." /></div>
            <div className="fld">
              <label>Type</label>
              <select value={ticketType} onChange={(e) => { setTicketType(e.target.value); setTicketSubtype(''); }}>
                <option value="">Select...</option>
                {TICKET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="fld">
              <label>Subtype</label>
              <select value={ticketSubtype} onChange={(e) => setTicketSubtype(e.target.value)} disabled={!ticketType}>
                <option value="">Select...</option>
                {(TICKET_TAXONOMY[ticketType] || []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="fld">
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
              </select>
            </div>
          </div>

          <div className="card-title" style={{ marginTop: 16 }}>Attachments</div>
          <label className="dropzone" style={{ padding: 18 }}>
            <i className="ti ti-cloud-upload" style={{ fontSize: 22, color: 'var(--gold)' }} />
            <div style={{ fontSize: 12.5 }}>Click to attach files</div>
            <input type="file" multiple style={{ display: 'none' }} onChange={(e) => addFiles(e.target.files)} />
          </label>
          {files.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {files.map((f, i) => (
                <div key={i} className="id-file-chip" style={{ marginTop: 0 }}>
                  <i className="ti ti-file" /><span>{f.name}</span>
                  <button type="button" onClick={() => removeFile(i)}><i className="ti ti-x" /></button>
                </div>
              ))}
            </div>
          )}

          <div className="page-hdr" style={{ marginTop: 18 }}>
            <button className="btn btn-gold" onClick={save} disabled={saving}><i className="ti ti-check" /> {saving ? 'Creating...' : 'Create Ticket'}</button>
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
            {employees.length > 1 && (
              <div className="fld" style={{ marginTop: 12 }}>
                <label>Also tag (optional)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {employees.filter((e) => e.id !== assignedTo).map((emp) => (
                    <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, cursor: 'pointer' }}>
                      <input type="checkbox" checked={participantIds.includes(emp.id)} onChange={() => toggleParticipant(emp.id)} />
                      {emp.full_name}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <p style={{ fontSize: 11, color: 'var(--text4)', marginTop: 10 }}>
              Only the raiser, assignee, and tagged team members (plus admins) can see and reply to this ticket.
            </p>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="card-title">SLA Target</div>
            <p style={{ fontSize: 12.5, color: 'var(--text3)' }}>
              At <b>{priority}</b> priority, this ticket should be resolved within <b>{SLA_HOURS[priority]} hours</b> of creation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
