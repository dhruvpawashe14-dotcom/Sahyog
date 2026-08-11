import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as leadService from './services/leadService';
import DataTable from '../../components/common/DataTable';
import QuickContact from '../../components/common/QuickContact';
import ListFilterBar from '../../components/common/ListFilterBar';

export default function LeadsPage() {
  const { user, profile, isAdmin } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [view, setView] = useState('list'); // 'list' | 'pipeline'
  const [dragId, setDragId] = useState(null);
  const navigate = useNavigate();

  const load = () => leadService.listLeads({ userId: user.id, isAdmin }).then(setLeads).finally(() => setLoading(false));
  useEffect(() => { if (user) load(); }, [user, isAdmin]);

  const q = filter.trim().toLowerCase();
  const filtered = leads.filter((l) => {
    const matchesText = !q || (l.full_name || '').toLowerCase().includes(q) || (l.mobile || '').includes(q) || (l.product || '').toLowerCase().includes(q);
    const matchesStage = !stageFilter || l.stage === stageFilter;
    return matchesText && matchesStage;
  });

  const onDrop = async (stage) => {
    if (!dragId) return;
    await leadService.updateLeadStage(dragId, stage, user.id, profile.full_name);
    setDragId(null);
    load();
  };

  const columns = [
    { key: 'full_name', label: 'Name' },
    { key: 'mobile', label: 'Mobile', render: (r) => <span>{r.mobile} <QuickContact mobile={r.mobile} /></span> },
    { key: 'product', label: 'Product' },
    { key: 'lead_category', label: 'Category', render: (r) => r.lead_category || '—' },
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
        <button className="btn btn-gold" onClick={() => navigate('/leads/new')}><i className="ti ti-plus" /> Add Lead</button>
      </div>

      <div className="view-toggle">
        <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><i className="ti ti-list" /> List</button>
        <button className={view === 'pipeline' ? 'active' : ''} onClick={() => setView('pipeline')}><i className="ti ti-layout-kanban" /> Pipeline</button>
      </div>

      {view === 'list' && (
        <>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <ListFilterBar value={filter} onChange={setFilter} placeholder="Filter by name, mobile, product..." />
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} style={{ marginBottom: 12 }}>
              <option value="">All stages</option>
              {leadService.STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="card" style={{ padding: 0 }}>
            <DataTable columns={columns} rows={filtered} loading={loading} emptyLabel="No leads yet" />
          </div>
        </>
      )}

      {view === 'pipeline' && (
        <div className="pipeline-scroll-wrap">
          <div className="pipeline-board">
            {leadService.STAGES.map((stage) => {
              const cards = filtered.filter((l) => l.stage === stage);
              return (
                <div key={stage} className="pipeline-col" onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(stage)}>
                  <div className="pipeline-col-hdr">{stage} <span className="dim">{cards.length}</span></div>
                  {cards.map((c) => (
                    <div key={c.id} className="pipeline-card" draggable onDragStart={() => setDragId(c.id)} onClick={() => navigate(`/leads/${c.id}`)}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{c.full_name}</div>
                      <div className="dim" style={{ fontSize: 11 }}>{c.mobile} · {c.product || '—'}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
