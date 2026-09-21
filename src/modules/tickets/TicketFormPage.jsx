import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { createTicket, addTicketParticipant, uploadTicketAttachment, sendComment } from './services/ticketService';
import { notify } from '../../services/notifications/notificationService';
import { logAudit } from '../../services/audit/auditService';
import { useEmployees } from '../../hooks/useEmployees';
import { filterValidFiles } from '../../utils/validators';
import { TICKET_TAXONOMY, TICKET_TYPES } from './constants';
import { STATUS_EMOJI } from '../../utils/employeeStatus';
import StatusDot from '../../components/common/StatusDot';
import VoiceRecorder from '../../components/common/VoiceRecorder';

// Same Assignment sidebar for both voice and typed tickets — one dropdown to
// pick the assignee, one checklist to tag others. Previously voice mode used
// a separate tap-to-assign chip grid with no explicit "Assign To" control;
// now both modes work identically.
function AssignmentPanel({ employees, user, assignedTo, setAssignedTo, participantIds, toggleParticipant }) {
  return (
    <div className="card">
      <div className="card-title">Assignment</div>
      <div className="fld">
        <label>Assign To</label>
        <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {STATUS_EMOJI[emp.effective_status] || '🟢'} {emp.full_name}{emp.id === user.id ? ' (You)' : ''}
              {emp.effective_status === 'On Leave' ? ' — On Leave' : ''}
            </option>
          ))}
        </select>
      </div>
      {employees.length > 1 && (
        <div className="fld" style={{ marginTop: 12 }}>
          <label>Also tag (optional)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            {employees.filter((e) => e.id !== assignedTo).map((emp) => (
              <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={participantIds.includes(emp.id)} onChange={() => toggleParticipant(emp.id)} />
                <StatusDot status={emp.effective_status} />
                {emp.full_name}
                {emp.effective_status === 'On Leave' && <span style={{ fontSize: 10.5, color: 'var(--text4)' }}>(On Leave)</span>}
              </label>
            ))}
          </div>
        </div>
      )}
      <p style={{ fontSize: 11, color: 'var(--text4)', marginTop: 10 }}>
        Only the raiser, assignee, and tagged team members (plus admins) can see and reply to this ticket.
      </p>
    </div>
  );
}

export default function TicketFormPage() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const employees = useEmployees(); // inactive employees already excluded — see useEmployees.js

  const [mode, setMode] = useState('voice'); // 'voice' | 'type'
  const [saving, setSaving] = useState(false);

  // shared
  const [priority, setPriority] = useState('Medium');
  const [participantIds, setParticipantIds] = useState([]);
  const [assignedTo, setAssignedTo] = useState(user?.id || '');

  // type mode fields
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [ticketType, setTicketType] = useState('');
  const [ticketSubtype, setTicketSubtype] = useState('');
  const [files, setFiles] = useState([]);

  // voice mode
  const [voiceFile, setVoiceFile] = useState(null);

  const addFiles = (fileList) => {
    const { valid, errors } = filterValidFiles(fileList);
    errors.forEach((e) => showToast(e, 'error'));
    setFiles((prev) => [...prev, ...valid]);
  };
  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const toggleParticipant = (id) => {
    setParticipantIds((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  const notifyRecipients = async (ticket, assignee) => {
    for (const pid of participantIds) {
      if (pid !== assignee) {
        await addTicketParticipant(ticket.id, pid);
        await notify({ userId: pid, title: 'You were tagged on a ticket', body: ticket.subject, type: 'info', linkType: 'ticket', linkId: ticket.id });
      }
    }
    if (assignee && assignee !== user.id) {
      await notify({ userId: assignee, title: 'New ticket assigned to you', body: ticket.subject, type: 'info', linkType: 'ticket', linkId: ticket.id });
    }
  };

  const saveVoice = async () => {
    if (!voiceFile) { showToast('Record a voice note first', 'error'); return; }
    setSaving(true);
    try {
      const assignee = employees.find((e) => e.id === assignedTo);
      const ticket = await createTicket({
        subject: `Voice ticket from ${profile.full_name} — ${new Date().toLocaleString()}`,
        description: null,
        ticket_type: null,
        ticket_subtype: null,
        raised_by: user.id,
        raised_name: profile.full_name,
        assigned_to: assignedTo || user.id,
        assigned_name: assignee?.full_name || profile.full_name,
        priority,
        raised_via_voice: true,
      });

      const path = await uploadTicketAttachment(ticket.id, voiceFile);
      await sendComment({
        ticketId: ticket.id, authorId: user.id, authorName: profile.full_name,
        body: 'Voice note', isFile: true, filePath: path, isVoiceNote: true,
      });

      await notifyRecipients(ticket, assignedTo);

      await logAudit({ userId: user.id, userName: profile.full_name, action: 'CREATE', module: 'Tickets', recordId: ticket.id, details: `Voice ticket raised: ${ticket.subject}` });
      showToast('Ticket sent', 'success');
      navigate(`/tickets/${ticket.id}`);
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveTyped = async () => {
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

      await notifyRecipients(ticket, assignedTo);

      for (const file of files) {
        const path = await uploadTicketAttachment(ticket.id, file);
        await sendComment({ ticketId: ticket.id, authorId: user.id, authorName: profile.full_name, body: file.name, isFile: true, filePath: path });
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

  return (
    <div>
      <div className="page-hdr"><h1>New Ticket</h1></div>

      <div className="mode-toggle" style={{ maxWidth: 420 }}>
        <button className={mode === 'voice' ? 'active' : ''} onClick={() => setMode('voice')}>
          <i className="ti ti-microphone" /> Voice note
        </button>
        <button className={mode === 'type' ? 'active' : ''} onClick={() => setMode('type')}>
          <i className="ti ti-keyboard" /> Type it out
        </button>
      </div>

      {mode === 'voice' ? (
        <div className="ticket-detail">
          <div className="card">
            <div className="card-title">Record your issue</div>
            <p style={{ fontSize: 12.5, color: 'var(--text3)', marginBottom: 12 }}>
              Say what's going on and any details — no form filling. Pick who it's for on the right.
            </p>
            <VoiceRecorder
              onRecorded={(file) => setVoiceFile(file)}
              onClear={() => setVoiceFile(null)}
              disabled={saving}
            />

            <div className="fld" style={{ marginTop: 16, maxWidth: 220 }}>
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
              </select>
            </div>

            <div className="page-hdr" style={{ marginTop: 20 }}>
              <button className="btn btn-gold" onClick={saveVoice} disabled={saving || !voiceFile}>
                <i className="ti ti-send" /> {saving ? 'Sending...' : 'Send Ticket'}
              </button>
            </div>
          </div>

          <div className="ticket-side">
            <AssignmentPanel
              employees={employees} user={user} assignedTo={assignedTo} setAssignedTo={setAssignedTo}
              participantIds={participantIds} toggleParticipant={toggleParticipant}
            />
            <div className="card" style={{ marginTop: 12 }}>
              <div className="card-title">How this works</div>
              <p style={{ fontSize: 12.5, color: 'var(--text3)' }}>
                Your recording is attached to the ticket exactly like a chat voice note —
                the assignee and anyone tagged can play it straight away. No typing needed.
              </p>
            </div>
          </div>
        </div>
      ) : (
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
                    <button type="button" onClick={() => removeFile(i)} aria-label={`Remove ${f.name}`}><i className="ti ti-x" /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="page-hdr" style={{ marginTop: 18 }}>
              <button className="btn btn-gold" onClick={saveTyped} disabled={saving}><i className="ti ti-check" /> {saving ? 'Creating...' : 'Create Ticket'}</button>
            </div>
          </div>

          <div className="ticket-side">
            <AssignmentPanel
              employees={employees} user={user} assignedTo={assignedTo} setAssignedTo={setAssignedTo}
              participantIds={participantIds} toggleParticipant={toggleParticipant}
            />
          </div>
        </div>
      )}
    </div>
  );
}
