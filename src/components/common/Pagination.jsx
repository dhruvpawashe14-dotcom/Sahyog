export default function Pagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="pagination-bar">
      <span className="dim">{from}–{to} of {total}</span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <i className="ti ti-chevron-left" />
        </button>
        <span style={{ fontSize: 12.5, padding: '8px 4px', color: 'var(--text3)' }}>Page {page} of {totalPages}</span>
        <button className="btn" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          <i className="ti ti-chevron-right" />
        </button>
      </div>
    </div>
  );
}
