// Local-timezone-safe date formatting. NEVER use Date.toISOString().slice(0,10) for
// local calendar dates — in timezones ahead of UTC (like IST, +5:30), local midnight
// converts to the PREVIOUS day in UTC, silently shifting every date back by one.
export function toLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayLocalStr() {
  return toLocalDateStr(new Date());
}
