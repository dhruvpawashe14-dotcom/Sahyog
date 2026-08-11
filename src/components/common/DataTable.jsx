export default function DataTable({ columns, rows, loading, emptyLabel = 'No records' }) {
  if (loading) {
    return <div className="table-empty"><i className="spin ti ti-loader" /> Loading...</div>;
  }
  if (!rows?.length) {
    return <div className="table-empty">{emptyLabel}</div>;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i}>
              {columns.map((c) => <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
