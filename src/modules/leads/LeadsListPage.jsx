import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listLeads, STAGES } from './services/leadService';
import DataTable from '../../components/common/DataTable';
import QuickContact from '../../components/common/QuickContact';
import ListFilterBar from '../../components/common/ListFilterBar';

export default function LeadsListPage() {
  const { user, isAdmin } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    listLeads({ userId: user.id, isAdmin }).then(setLeads).finally(() => setLoading(false));
  }, [user, isAdmin]);

  const q = filter.trim().toLowerCase();
  const filtered = leads.filter((l) => {
    const matchesText = !q || (l.full_name || '').toLowerCase().includes(q) || (l.mobile || '').includes(q) || (l.product || '').toLowerCase().includes(q);
    const matchesStage = !stageFilter || l.stage === stageFilter;
    return matchesText && matchesStage;
  });

  const columns = [
    { key: 'full_name', label: 'Name' },
    { key: 'mobile', label: 'Mobile', render: (r) => <span>{r.mobile} <QuickContact mobile={r.mobile} /></span> },
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
        <div><h1>Leads</h1><p>{filtered.length} of {leads.length} leads</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={() => navigate('/pipeline')}><i className="ti ti-layout-kanban" /> Pipeline view</button>
          <button className="btn btn-gold" onClick={() => navigate('/leads/new')}><i className="ti ti-plus" /> Add Lead</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <ListFilterBar value={filter} onChange={setFilter} placeholder="Filter by name, mobile, product..." />
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} style={{ marginBottom: 12 }}>
          <option value="">All stages</option>
          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <DataTable columns={columns} rows={filtered} loading={loading} emptyLabel="No leads yet" />
      </div>
    </div>
  );
}
