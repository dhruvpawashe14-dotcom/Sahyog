import { useEmployees } from '../../hooks/useEmployees';

export default function AssigneeSelect({ value, onChange, label = 'Assign To' }) {
  const employees = useEmployees();
  return (
    <div className="fld">
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id} data-name={emp.full_name}>{emp.full_name}{emp.role === 'admin' ? ' (Admin)' : ''}</option>
        ))}
      </select>
    </div>
  );
}
