import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listClients } from './services/clientService';
import DataTable from '../../components/common/DataTable';
import QuickContact from '../../components/common/QuickContact';
import ListFilterBar from '../../components/common/ListFilterBar';
import ScopeToggle from '../../components/common/ScopeToggle';
import Pagination from '../../components/common/Pagination';

export default function ClientsListPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [scope, setScope] = useState('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    listClients().then(setClients).finally(() => setLoading(false));
  }, [user]);

  const scoped = scope === 'mine' ? clients.filter((c) => c.assigned_to === user?.id) : clients;
  const q = filter.trim().toLowerCase();
  const filtered = q ? scoped.filter((c) =>
    (c.full_name || '').toLowerCase().includes(q) ||
    (c.mobile || '').includes(q) ||
    (c.pan_number || '').toLowerCase().includes(q) ||
    (c.email || '').toLowerCase().includes(q)
  ) : scoped;

  useEffect(() => { setPage(1); }, [filter, scope]);
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = [
    { key: 'full_name', label: 'Name' },
    { key: 'mobile', label: 'Mobile', render: (r) => <span>{r.mobile} <QuickContact mobile={r.mobile} /></span> },
    { key: 'email', label: 'Email' },
    { key: 'pan_number', label: 'PAN' },
    { key: 'assigned_name', label: 'Advisor' },
    {
      key: 'actions', label: '', render: (row) => (
        <button className="link-btn" onClick={() => navigate(`/clients/${row.id}`)}>View →</button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-hdr">
        <div><h1>Clients</h1><p>{filtered.length} of {clients.length} clients</p></div>
        <button className="btn btn-gold" onClick={() => navigate('/clients/new')}><i className="ti ti-plus" /> Add Client</button>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <ScopeToggle scope={scope} onChange={setScope}
          mineCount={clients.filter((c) => c.assigned_to === user?.id).length}
          allCount={clients.length} />
        <ListFilterBar value={filter} onChange={setFilter} placeholder="Filter by name, mobile, PAN, email..." />
      </div>
      <div className="card" style={{ padding: 0 }}>
        <DataTable columns={columns} rows={pageRows} loading={loading} emptyLabel="No clients yet" />
        <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
      </div>
    </div>
  );
}
