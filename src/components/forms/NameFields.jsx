// First / Middle / Last name inputs — shared by the client create and edit forms
// so the entry order is identical everywhere.
export default function NameFields({ value, onChange }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  return (
    <>
      <div className="fld"><label>First Name *</label><input value={value.first_name} onChange={set('first_name')} /></div>
      <div className="fld"><label>Middle Name</label><input value={value.middle_name} onChange={set('middle_name')} /></div>
      <div className="fld"><label>Last Name *</label><input value={value.last_name} onChange={set('last_name')} /></div>
    </>
  );
}
