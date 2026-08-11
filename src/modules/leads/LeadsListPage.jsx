import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listLeads } from './services/leadService';
import DataTable from '../../components/common/DataTable';

export default function LeadsListPage() {
  const { user, isAdmin } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    listLeads({ userId: user.id, isAdmin }).then(setLeads).finally(() => setLoading(false));
  }, [user, isAdmin]);

  const columns = [
    { key: 'full_name', label: 'Name' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'product', label: 'Product' },
    { key: 'stage', label: 'Stage' },
    { key: 'assigned_name', label: 'Advisor' },
    {
      key: 'actions', label: '', render: (row) => (
        <button className="link-btn" onClick={() => navigate(`/leads/${row.id}`)}>View →</button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-hdr">
        <div><h1>Leads</h1><p>{leads.length} leads</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={() => navigate('/pipeline')}><i className="ti ti-layout-kanban" /> Pipeline view</button>
          <button className="btn btn-gold" onClick={() => navigate('/leads/new')}><i className="ti ti-plus" /> Add Lead</button>
        </div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <DataTable columns={columns} rows={leads} loading={loading} emptyLabel="No leads yet" />
      </div>
    </div>
  );
}
