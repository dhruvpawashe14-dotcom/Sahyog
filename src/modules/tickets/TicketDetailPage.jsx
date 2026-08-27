import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as ticketService from './services/ticketService';
import { notify } from '../../services/notifications/notificationService';
import { logAudit } from '../../services/audit/auditService';
import { useToast } from '../../components/common/Toast';
import { useEmployees } from '../../hooks/useEmployees';
import { TICKET_STATUSES, TICKET_STATUS_COLORS } from './constants';
import StatusBadge from '../../components/common/StatusBadge';

export default function TicketDetailPage() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const employees = useEmployees();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [body, setBody] = useState('');
  const [addingParticipant, setAddingParticipant] = useState('');
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const load = async () => {
    setTicket(await ticketService.getTicket(id));
    setComments(await ticketService.listComments(id));
    setParticipants(await ticketService.listTicketParticipants(id));
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [comments]);

  const notifyTicketMembers = async (title, snippet) => {
    const participantIds = participants.map((p) => p.user_id);
    const targets = [ticket.raised_by, ticket.assigned_to, ...participantIds].filter((tid) => tid && tid !== user.id);
    for (const targetId of [...new Set(targets)]) {
      await notify({ userId: targetId, title, body: `${profile.full_name}: ${snippet}`, type: 'info', linkType: 'ticket', linkId: id });
    }
  };

  const send = async () => {
    if (!body.trim()) return;
    const sentBody = body;
    await ticketService.sendComment({ ticketId: id, authorId: user.id, authorName: profile.full_name, body: sentBody });
    setBody('');
    await notifyTicketMembers(`New reply on ${ticket.ticket_ref}`, sentBody.slice(0, 80));
    load();
  };

  const sendFile = async (file) => {
    setUploading(true);
    try {
      const url = await ticketService.uploadTicketAttachment(id, file);
      await ticketService.sendComment({ ticketId: id, authorId: user.id, authorName: profile.full_name, body: file.name, isFile: true, fileUrl: url });
      await notifyTicketMembers(`New attachment on ${ticket.ticket_ref}`, file.name);
      load();
    } catch (e) {
      showToast('Upload failed: ' + e.message, 'error');
    } finally {
      setUploading(false);
      fileRef.current.value = '';
    }
  };

  const toggleVoiceReply = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const file = new File([blob], `voice-reply-${Date.now()}.webm`, { type: blob.type });
        setUploading(true);
        try {
          const url = await ticketService.uploadTicketAttachment(id, file);
          await ticketService.sendComment({ ticketId: id, authorId: user.id, authorName: profile.full_name, body: 'Voice reply', isFile: true, fileUrl: url, isVoiceNote: true });
          await notifyTicketMembers(`New voice reply on ${ticket.ticket_ref}`, 'Voice note');
          load();
        } catch (e) {
          showToast('Upload failed: ' + e.message, 'error');
        } finally {
          setUploading(false);
        }
      };
      recorder.start();
      setRecording(true);
    } catch {
      showToast("Couldn't access the microphone", 'error');
    }
  };

  const changeStatus = async (status) => {
    await ticketService.updateTicketStatus(id, status, profile.full_name);
    await logAudit({ userId: user.id, userName: profile.full_name, action: 'UPDATE', module: 'Tickets', recordId: id, details: `Status → ${status}` });
    // Notify the other party — whoever didn't make this change.
    const notifyTargets = [ticket.raised_by, ticket.assigned_to].filter((id) => id && id !== user.id);
    for (const targetId of [...new Set(notifyTargets)]) {
      await notify({ userId: targetId, title: `Ticket ${status.toLowerCase()}`, body: ticket.subject, type: 'info', linkType: 'ticket', linkId: id });
    }
    showToast(`Ticket marked ${status}`, 'success');
    load();
  };

  const addParticipant = async () => {
    if (!addingParticipant) return;
    await ticketService.addTicketParticipant(id, addingParticipant);
    await notify({ userId: addingParticipant, title: 'You were tagged on a ticket', body: ticket.subject, type: 'info', linkType: 'ticket', linkId: id });
    setAddingParticipant('');
    showToast('Team member tagged', 'success');
    load();
  };

  if (!ticket) return <div className="full-loader"><i className="spin ti ti-loader" /></div>;

  const taggableEmployees = employees.filter((e) => e.id !== ticket.assigned_to && !participants.some((p) => p.user_id === e.id));

  return (
    <div className="ticket-detail">
      <div className="ticket-main card">
        <div className="page-hdr">
          <div><span className="ticket-ref">{ticket.ticket_ref}</span><h2>{ticket.subject}</h2></div>
          <select value={ticket.status} onChange={(e) => changeStatus(e.target.value)}>
            {TICKET_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {ticket.description && <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 6 }}>{ticket.description}</p>}
        {ticket.ticket_type && (
          <p style={{ fontSize: 11.5, color: 'var(--text4)', marginBottom: 10 }}>
            {ticket.ticket_type}{ticket.ticket_subtype ? ` · ${ticket.ticket_subtype}` : ''}
          </p>
        )}
        {ticket.status === 'Closed' && ticket.closed_by && (
          <div style={{ fontSize: 11.5, color: 'var(--green)', marginBottom: 10 }}>
            <i className="ti ti-check" /> Closed by {ticket.closed_by} on {new Date(ticket.closed_at).toLocaleString()}
          </div>
        )}
        <div className="chat-messages">
          {comments.length === 0 && <div className="table-empty">No messages yet — say hello to get started</div>}
          {comments.map((c) => (
            <div key={c.id} className={`chat-bubble ${c.author_name === profile.full_name ? 'mine' : ''}`}>
              <div className="chat-author">{c.author_name}</div>
              {c.is_voice_note ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="ti ti-microphone" style={{ color: 'var(--gold)' }} />
                  <audio controls src={c.file_url} style={{ height: 32, maxWidth: 220 }} />
                </div>
              ) : c.is_file ? (
                <a href={c.file_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'inherit' }}>
                  <i className="ti ti-paperclip" /> {c.body}
                </a>
              ) : <div>{c.body}</div>}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="chat-input-row">
          <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={(e) => e.target.files[0] && sendFile(e.target.files[0])} />
          <button className="btn" onClick={() => fileRef.current.click()} disabled={uploading} title="Attach file">
            <i className={uploading ? 'ti ti-loader spin' : 'ti ti-paperclip'} />
          </button>
          <button
            className="btn"
            onClick={toggleVoiceReply}
            disabled={uploading}
            title={recording ? 'Stop recording' : 'Record voice reply'}
            style={recording ? { background: '#C0392B12', borderColor: 'var(--red)', color: 'var(--red)' } : undefined}
          >
            <i className={recording ? 'ti ti-player-stop' : 'ti ti-microphone'} />
          </button>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type message... (Ctrl+Enter to send)"
            onKeyDown={(e) => { if (e.ctrlKey && e.key === 'Enter') send(); }} />
          <button className="btn btn-gold" onClick={send} aria-label="Send message"><i className="ti ti-send" /></button>
        </div>
      </div>
      <div className="ticket-side">
        <div className="card">
          <div className="card-title">Ticket Info</div>
          <div className="dup-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Status</span>
            <StatusBadge status={ticket.status} colors={TICKET_STATUS_COLORS} />
          </div>
          <div className="dup-row">{ticketService.daysOpenLabel(ticket)}</div>
          <div className="dup-row">Priority: {ticket.priority}</div>
          <div className="dup-row">Raised by: {ticket.raised_name}{ticket.raised_via_voice ? ' 🎤' : ''}</div>
          <div className="dup-row">Assigned to: {ticket.assigned_name || '—'}</div>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <div className="card-title">Tagged Team Members</div>
          {participants.length === 0 && <div style={{ fontSize: 12, color: 'var(--text4)' }}>No one else tagged yet</div>}
          {participants.map((p) => (
            <div key={p.user_id} className="dup-row">
              <i className="ti ti-user" /> {p.profiles?.full_name || p.user_id}
            </div>
          ))}
          {taggableEmployees.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <select value={addingParticipant} onChange={(e) => setAddingParticipant(e.target.value)} style={{ flex: 1 }}>
                <option value="">Tag someone...</option>
                {taggableEmployees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
              <button className="btn" onClick={addParticipant} aria-label="Add tagged team member"><i className="ti ti-plus" /></button>
            </div>
          )}
          <p style={{ fontSize: 11, color: 'var(--text4)', marginTop: 10 }}>
            Only people on this list (plus admins) can see this ticket and close it.
          </p>
        </div>
      </div>
    </div>
  );
}
