// Local-safe date formatting — never use toISOString() for calendar dates, it converts to UTC
// and silently shifts the date by a day for any timezone ahead of UTC (like India, UTC+5:30).
export function toLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
