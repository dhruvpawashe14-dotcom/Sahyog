import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listClients } from './services/clientService';
import DataTable from '../../components/common/DataTable';
import QuickContact from '../../components/common/QuickContact';
import ListFilterBar from '../../components/common/ListFilterBar';

export default function ClientsListPage() {
  const { user, isAdmin } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    listClients({ assignedTo: user.id, isAdmin }).then(setClients).finally(() => setLoading(false));
  }, [user, isAdmin]);

  const q = filter.trim().toLowerCase();
  const filtered = q ? clients.filter((c) =>
    (c.full_name || '').toLowerCase().includes(q) ||
    (c.mobile || '').includes(q) ||
    (c.pan_number || '').toLowerCase().includes(q) ||
    (c.email || '').toLowerCase().includes(q)
  ) : clients;

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
      <ListFilterBar value={filter} onChange={setFilter} placeholder="Filter by name, mobile, PAN, email..." />
      <div className="card" style={{ padding: 0 }}>
        <DataTable columns={columns} rows={filtered} loading={loading} emptyLabel="No clients yet" />
      </div>
    </div>
  );
}
