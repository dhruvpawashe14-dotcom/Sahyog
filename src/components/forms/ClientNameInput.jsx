import { useEffect, useState } from 'react';
import { listClients } from '../../modules/clients/services/clientService';

// Free-text client name with suggestions from existing clients, so tickets
// spell a client the same way the Clients list does.
export default function ClientNameInput({ value, onChange }) {
  const [names, setNames] = useState([]);
  useEffect(() => {
    listClients().then((rows) => setNames([...new Set(rows.map((c) => c.full_name).filter(Boolean))])).catch(() => {});
  }, []);
  return (
    <div className="fld form-full">
      <label>Client Name</label>
      <input list="ticket-client-names" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Which client is this about?" />
      <datalist id="ticket-client-names">{names.map((n) => <option key={n} value={n} />)}</datalist>
    </div>
  );
}
