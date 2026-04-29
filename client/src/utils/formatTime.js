/**
 * Format minutes into a human-readable duration string.
 *
 * Examples:
 *   formatETA(45)  → "45 min"
 *   formatETA(90)  → "1h 30m"
 *   formatETA(120) → "2h 0m"
 *   formatETA(0)   → "0 min"
 *   formatETA(null) → "—"
 */
export function formatETA(minutes) {
  if (minutes == null || isNaN(minutes)) return '—';

  const rounded = Math.round(minutes);

  if (rounded < 60) {
    return `${rounded} min`;
  }

  const hours = Math.floor(rounded / 60);
  const mins  = rounded % 60;

  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
