import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listTickets, slaStatus } from './services/ticketService';
import DataTable from '../../components/common/DataTable';

const SLA_LABEL = { 'on-track': 'On track', breached: 'SLA breached', met: 'Closed' };
const SLA_CLASS = { 'on-track': 'b-green', breached: 'b-red', met: 'b-gold' };

export default function TicketsListPage() {
  const { user, isAdmin } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    listTickets({ userId: user.id, isAdmin }).then(setTickets).finally(() => setLoading(false));
  }, [user, isAdmin]);

  const columns = [
    { key: 'ticket_ref', label: 'Ref' },
    { key: 'subject', label: 'Subject' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status' },
    {
      key: 'sla', label: 'SLA', render: (row) => {
        const s = slaStatus(row);
        return <span className={`badge ${SLA_CLASS[s]}`}>{SLA_LABEL[s]}</span>;
      },
    },
    {
      key: 'actions', label: '', render: (row) => (
        <button className="link-btn" onClick={() => navigate(`/tickets/${row.id}`)}>Open →</button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-hdr">
        <div><h1>Tickets</h1><p>{tickets.length} tickets</p></div>
        <button className="btn btn-gold" onClick={() => navigate('/tickets/new')}><i className="ti ti-plus" /> New Ticket</button>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <DataTable columns={columns} rows={tickets} loading={loading} emptyLabel="No tickets" />
      </div>
    </div>
  );
}
