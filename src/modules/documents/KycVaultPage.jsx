import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listClients } from '../clients/services/clientService';

export default function KycVaultPage() {
  const { user, isAdmin } = useAuth();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    listClients({ assignedTo: user.id, isAdmin }).then(setClients);
  }, [user, isAdmin]);

  const filtered = clients.filter((c) =>
    !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.mobile?.includes(search) || c.pan_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-hdr"><div><h1>KYC Vault</h1><p>{clients.length} clients on file</p></div></div>
      <div className="card" style={{ marginBottom: 14 }}>
        <input placeholder="Search by name, mobile, or PAN..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%' }} />
      </div>
      <div className="kyc-grid">
        {filtered.map((c) => (
          <div key={c.id} className="card kyc-card" onClick={() => navigate(`/clients/${c.id}`)}>
            <div className="card-title">{c.full_name}</div>
            <div className="dim">{c.mobile}</div>
            <div className="dim">{c.pan_number || 'No PAN on file'}</div>
          </div>
        ))}
        {filtered.length === 0 && <div className="table-empty">No clients found</div>}
      </div>
    </div>
  );
}
