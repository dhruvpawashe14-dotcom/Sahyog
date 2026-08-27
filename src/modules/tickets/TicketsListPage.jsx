import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listTickets, daysOpenLabel } from './services/ticketService';
import { TICKET_STATUS_COLORS } from './constants';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';

export default function TicketsListPage() {
  const { user, isAdmin } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    listTickets({ userId: user.id, isAdmin }).then(setTickets).finally(() => setLoading(false));
  }, [user, isAdmin]);

  const pageRows = tickets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = [
    { key: 'ticket_ref', label: 'Ref' },
    { key: 'subject', label: 'Subject' },
    {
      key: 'status', label: 'Status',
      render: (row) => <StatusBadge status={row.status} colors={TICKET_STATUS_COLORS} />,
    },
    {
      key: 'open_for', label: 'Open for',
      render: (row) => <span style={{ fontSize: 12.5, color: 'var(--text3)' }}>{daysOpenLabel(row)}</span>,
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
        <DataTable columns={columns} rows={pageRows} loading={loading} emptyLabel="No tickets" />
        <Pagination page={page} pageSize={PAGE_SIZE} total={tickets.length} onPageChange={setPage} />
      </div>
    </div>
  );
}
