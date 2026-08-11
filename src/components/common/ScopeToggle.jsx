// "Mine" / "All Team" toggle for list pages. Since the database now shows
// everyone's records to every team member, this lets people narrow back
// down to just their own without losing visibility into the rest.
export default function ScopeToggle({ scope, onChange, mineCount, allCount }) {
  return (
    <div className="scope-toggle">
      <button className={scope === 'mine' ? 'active' : ''} onClick={() => onChange('mine')}>
        Mine {mineCount != null ? `(${mineCount})` : ''}
      </button>
      <button className={scope === 'all' ? 'active' : ''} onClick={() => onChange('all')}>
        All Team {allCount != null ? `(${allCount})` : ''}
      </button>
    </div>
  );
}
