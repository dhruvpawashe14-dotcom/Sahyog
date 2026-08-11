export default function ListFilterBar({ value, onChange, placeholder = 'Filter...' }) {
  return (
    <div className="list-filter-bar">
      <i className="ti ti-filter" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
