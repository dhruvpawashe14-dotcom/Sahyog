// Colour-coded status pill. `colors` is a { statusLabel: '#hex' } map — component
// derives a light background tint from the hex so callers only define one colour per status.
export default function StatusBadge({ status, colors, fallback = '#6B6B6B' }) {
  const hex = colors[status] || fallback;
  return (
    <span
      className="badge"
      style={{ background: `${hex}18`, color: hex, whiteSpace: 'nowrap' }}
    >
      {status}
    </span>
  );
}
