import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { createTicket, addTicketParticipant } from './services/ticketService';
import { logAudit } from '../../services/audit/auditService';
import { useEmployees } from '../../hooks/useEmployees';

const SLA_HOURS = { Urgent: 4, High: 24, Medium: 48, Low: 96 };

export default function TicketFormPage() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const employees = useEmployees();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [assignedTo, setAssignedTo] = useState(user?.id || '');
  const [participantIds, setParticipantIds] = useState([]);

  const save = async () => {
    if (!subject) { showToast('Subject is required', 'error'); return; }
    const assignee = employees.find((e) => e.id === assignedTo);
    const ticket = await createTicket({
      subject, description, priority,
      raised_by: user.id,
      raised_name: profile.full_name,
      assigned_to: assignedTo || user.id,
      assigned_name: assignee?.full_name || profile.full_name,
    });
    for (const pid of participantIds) {
      if (pid !== assignedTo) await addTicketParticipant(ticket.id, pid);
    }
    await logAudit({ userId: user.id, userName: profile.full_name, action: 'CREATE', module: 'Tickets', recordId: ticket.id, details: `Ticket raised: ${ticket.subject}` });
    showToast('Ticket created', 'success');
    navigate(`/tickets/${ticket.id}`);
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
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
              </select>
            </div>
          </div>
          <div className="page-hdr" style={{ marginTop: 18 }}>
            <button className="btn btn-gold" onClick={save}><i className="ti ti-check" /> Create Ticket</button>
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
