import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listTickets, daysOpenLabel, hasFollowUps, isTicketClosed, fmtShortDate } from './services/ticketService';
import { TICKET_STATUS_COLORS } from './constants';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';

export default function TicketsListPage() {
  const { user, isAdmin } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('open'); // closed tickets are done — keep them out of the way by default
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    listTickets({ userId: user.id, isAdmin }).then(setTickets).finally(() => setLoading(false));
  }, [user, isAdmin]);

  const openTickets = tickets.filter((t) => !isTicketClosed(t));
  const closedTickets = tickets.filter(isTicketClosed);
  const visible = tab === 'open' ? openTickets : closedTickets;

  useEffect(() => { setPage(1); }, [tab]);
  const pageRows = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = [
    { key: 'ticket_ref', label: 'Ref' },
    {
      key: 'subject', label: 'Subject',
      render: (row) => (
        <span>
          {row.subject}
          {hasFollowUps(row) && (
            <span title={`${row.query_count} queries logged`} style={{ marginLeft: 6, fontSize: 10.5, fontWeight: 600, color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: 20, padding: '0px 6px' }}>
              ×{row.query_count}
            </span>
          )}
        </span>
      ),
    },
    { key: 'raised_name', label: 'Raised by', render: (row) => row.raised_name || '—' },
    { key: 'created_at', label: 'Date', render: (row) => fmtShortDate(row.created_at) },
    {
      key: 'status', label: 'Status',
      render: (row) => <StatusBadge status={row.status} colors={TICKET_STATUS_COLORS} />,
    },
    {
      key: 'open_for', label: tab === 'open' ? 'Open for' : 'Resolution time',
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
        <div><h1>Tickets</h1><p>{visible.length} of {tickets.length} tickets</p></div>
        <button className="btn btn-gold" onClick={() => navigate('/tickets/new')}><i className="ti ti-plus" /> New Ticket</button>
      </div>
      <div className="scope-toggle" style={{ marginBottom: 12 }}>
        <button className={tab === 'open' ? 'active' : ''} onClick={() => setTab('open')}>Open ({openTickets.length})</button>
        <button className={tab === 'closed' ? 'active' : ''} onClick={() => setTab('closed')}>Closed ({closedTickets.length})</button>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <DataTable columns={columns} rows={pageRows} loading={loading} emptyLabel={tab === 'open' ? 'No open tickets' : 'No closed tickets yet'} />
        <Pagination page={page} pageSize={PAGE_SIZE} total={visible.length} onPageChange={setPage} />
      </div>
    </div>
  );
}
