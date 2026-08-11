import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { createTicket } from './services/ticketService';
import { logAudit } from '../../services/audit/auditService';

const empty = { subject: '', description: '', priority: 'Medium' };

export default function TicketFormPage() {
  const [form, setForm] = useState(empty);
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    if (!form.subject) { showToast('Subject is required', 'error'); return; }
    const ticket = await createTicket({
      ...form,
      raised_by: user.id,
      raised_name: profile.full_name,
      assigned_to: user.id,
      assigned_name: profile.full_name,
    });
    await logAudit({ userId: user.id, userName: profile.full_name, action: 'CREATE', module: 'Tickets', recordId: ticket.id, details: `Ticket raised: ${ticket.subject}` });
    showToast('Ticket created', 'success');
    navigate(`/tickets/${ticket.id}`);
  };

  return (
    <div>
      <div className="page-hdr"><h1>New Ticket</h1></div>
      <div className="card form-grid">
        <div className="fld form-full"><label>Subject *</label><input value={form.subject} onChange={set('subject')} placeholder="Brief summary of the issue" /></div>
        <div className="fld form-full"><label>Description</label><input value={form.description} onChange={set('description')} placeholder="Details..." /></div>
        <div className="fld">
          <label>Priority</label>
          <select value={form.priority} onChange={set('priority')}>
            <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
          </select>
        </div>
      </div>
      <div className="page-hdr" style={{ marginTop: 16 }}>
        <button className="btn btn-gold" onClick={save}><i className="ti ti-check" /> Create Ticket</button>
      </div>
    </div>
  );
}
