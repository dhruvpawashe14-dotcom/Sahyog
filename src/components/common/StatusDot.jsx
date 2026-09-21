import { STATUS_DOT_COLOR } from '../../utils/employeeStatus';

export default function StatusDot({ status, style }) {
  return (
    <span
      title={status}
      style={{
        display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
        background: STATUS_DOT_COLOR[status] || STATUS_DOT_COLOR.Active,
        marginRight: 6, flexShrink: 0, ...style,
      }}
    />
  );
}
