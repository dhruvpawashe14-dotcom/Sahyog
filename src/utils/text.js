// Normalizes a name to Proper Case regardless of how it was typed/stored —
// "hiren" -> "Hiren", "PRANAV SHAH" -> "Pranav Shah".
export function capitalizeWords(str) {
  if (!str) return str;
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
