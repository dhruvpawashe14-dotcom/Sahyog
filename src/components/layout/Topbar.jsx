import { useState } from 'react';
import { globalSearch } from '../../services/search/searchService';

export default function Topbar({ title }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);

  const onSearch = async (v) => {
    setQuery(v);
    if (v.trim().length < 2) { setResults(null); return; }
    setResults(await globalSearch(v));
  };

  return (
    <header className="topbar">
      <span className="page-title">{title}</span>
      <div className="search-wrap">
        <i className="ti ti-search" />
        <input placeholder="Search clients, tickets, PAN, mobile..." value={query} onChange={(e) => onSearch(e.target.value)} />
        {results && (results.clients.length || results.tickets.length) ? (
          <div className="search-results">
            {results.clients.map((c) => (
              <div key={`c-${c.id}`} className="search-row">
                <i className="ti ti-user" /> {c.full_name} <span className="dim">{c.mobile}</span>
              </div>
            ))}
            {results.tickets.map((t) => (
              <div key={`t-${t.id}`} className="search-row">
                <i className="ti ti-ticket" /> {t.ticket_ref} — {t.subject}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}
