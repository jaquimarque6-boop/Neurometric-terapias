/**
 * Normalizes any old-format age range string (e.g. "2-4", "4-6", "8-10")
 * to the standardized 6-group system used across the app.
 *
 * Uses the midpoint of the old range to determine the best-fit group.
 * Also accepts the new standardized values and passes them through unchanged.
 */
export function normalizarFranja(franja: string | null | undefined): string | null {
  if (!franja) return null;
  const cleaned = franja.replace(/–/g, "-").trim();
  const parts = cleaned.split("-");
  if (parts.length !== 2) return franja;
  const lo = parseInt(parts[0], 10);
  const hi = parseInt(parts[1], 10);
  if (isNaN(lo) || isNaN(hi)) return franja;
  const mid = (lo + hi) / 2;
  if (mid <= 2)  return "0-2";
  if (mid <= 5)  return "3-5";
  if (mid <= 8)  return "6-8";
  if (mid <= 12) return "9-12";
  if (mid <= 16) return "13-16";
  return "17-20";
}

/** Human-readable label for a normalized franja. */
export function franjaLabel(franja: string | null | undefined): string {
  const norm = normalizarFranja(franja);
  if (!norm) return "";
  return `${norm} años`;
}
