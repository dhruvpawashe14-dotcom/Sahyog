import { useEffect, useState } from 'react';
import { fetchAuditLogs } from '../../services/audit/auditService';
import DataTable from '../../components/common/DataTable';

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchAuditLogs({ limit: 300 }).then(setLogs).finally(() => setLoading(false)); }, []);

  const filtered = filter ? logs.filter((l) => l.module === filter) : logs;
  const modules = [...new Set(logs.map((l) => l.module))];

  const columns = [
    { key: 'created_at', label: 'When', render: (r) => new Date(r.created_at).toLocaleString() },
    { key: 'user_name', label: 'User' },
    { key: 'action', label: 'Action' },
    { key: 'module', label: 'Module' },
    { key: 'details', label: 'Details' },
  ];

  return (
    <div>
      <div className="page-hdr">
        <div><h1>Audit Log</h1><p>{filtered.length} entries</p></div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All modules</option>
          {modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <DataTable columns={columns} rows={filtered} loading={loading} emptyLabel="No audit entries yet" />
      </div>
    </div>
  );
}
