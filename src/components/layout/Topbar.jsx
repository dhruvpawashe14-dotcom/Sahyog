import { useEffect, useRef, useState } from 'react';
import { globalSearch } from '../../services/search/searchService';
import NotificationBell from './NotificationBell';

export default function Topbar({ title, onMenuClick }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => { if (searchOpen) inputRef.current?.focus(); }, [searchOpen]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setSearchOpen(false);
        setQuery('');
        setResults(null);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const debounceRef = useRef(null);

  const onSearch = (v) => {
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.trim().length < 2) { setResults(null); return; }
    debounceRef.current = setTimeout(async () => {
      setResults(await globalSearch(v));
    }, 350);
  };

  return (
    <header className="topbar">
      <button className="hamburger-btn icon-btn" onClick={onMenuClick} aria-label="Open menu"><i className="ti ti-menu-2" /></button>
      <span className="page-title">{title}</span>
      <div className="topbar-spacer" />
      <div className="search-wrap-minimal" ref={wrapRef}>
        {!searchOpen ? (
          <button className="icon-btn" onClick={() => setSearchOpen(true)} title="Search" aria-label="Open search"><i className="ti ti-search" /></button>
        ) : (
          <div className="search-wrap">
            <i className="ti ti-search" />
            <input ref={inputRef} placeholder="Search clients, tickets, PAN, mobile..." value={query} onChange={(e) => onSearch(e.target.value)} />
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
        )}
      </div>
      <div className="topbar-right">
        <NotificationBell />
      </div>
    </header>
  );
}
