import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listClaims, claimAgeDays, bulkImportClaims } from './services/claimService';
import { parseExcelFile, exportToExcel } from '../../utils/excel';
import { useToast } from '../../components/common/Toast';
import DataTable from '../../components/common/DataTable';
import ListFilterBar from '../../components/common/ListFilterBar';

export default function ClaimsListPage() {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const fileRef = useRef(null);
  const navigate = useNavigate();

  const load = () => listClaims({ userId: user.id, isAdmin }).then(setClaims).finally(() => setLoading(false));
  useEffect(() => { if (user) load(); }, [user, isAdmin]);

  const onImport = async (file) => {
    if (!file) return;
    try {
      const rows = await parseExcelFile(file);
      await bulkImportClaims(rows, user.id);
      showToast(`Imported ${rows.length} claims`, 'success');
      load();
    } catch (e) {
      showToast('Import failed: ' + e.message, 'error');
    }
    fileRef.current.value = '';
  };

  const onExport = () => {
    exportToExcel(claims.map((c) => ({
      claim_ref: c.claim_ref, client_name: c.client_name, policy_number: c.policy_number,
      claim_type: c.claim_type, claim_amount: c.claim_amount, status: c.status, filed_date: c.filed_date,
    })), 'claims-export.xlsx');
  };

  const q = filter.trim().toLowerCase();
  const filtered = q ? claims.filter((c) =>
    (c.client_name || '').toLowerCase().includes(q) ||
    (c.claim_ref || '').toLowerCase().includes(q) ||
    (c.policy_number || '').toLowerCase().includes(q)
  ) : claims;

  const columns = [
    { key: 'claim_ref', label: 'Ref' },
    { key: 'client_name', label: 'Client' },
    { key: 'claim_type', label: 'Type' },
    { key: 'claim_amount', label: 'Amount', render: (r) => r.claim_amount ? `₹${Number(r.claim_amount).toLocaleString('en-IN')}` : '—' },
    { key: 'status', label: 'Status' },
    {
      key: 'age', label: 'Age', render: (r) => {
        const days = claimAgeDays(r);
        if (days === null) return '—';
        return <span className={days > 15 ? 'badge b-red' : 'badge b-gold'}>{days}d</span>;
      },
    },
    {
      key: 'actions', label: '', render: (row) => (
        <button className="link-btn" onClick={() => navigate(`/claims/${row.id}`)}>Open →</button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-hdr">
        <div><h1>Claims</h1><p>{filtered.length} of {claims.length} claims</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={(e) => onImport(e.target.files[0])} />
          <button className="btn" onClick={() => fileRef.current.click()}><i className="ti ti-file-import" /> Import</button>
          <button className="btn" onClick={onExport}><i className="ti ti-file-export" /> Export</button>
          <button className="btn btn-gold" onClick={() => navigate('/claims/new')}><i className="ti ti-plus" /> New Claim</button>
        </div>
      </div>
      <ListFilterBar value={filter} onChange={setFilter} placeholder="Filter by client, ref, policy number..." />
      <div className="card" style={{ padding: 0 }}>
        <DataTable columns={columns} rows={filtered} loading={loading} emptyLabel="No claims yet" />
      </div>
    </div>
  );
}
