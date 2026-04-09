const FRANJAS_ESTANDAR = ["0-2", "3-5", "6-8", "9-12", "13-16", "17-20"] as const;
export type FranjaEtaria = typeof FRANJAS_ESTANDAR[number];

/** Returns the ordered list of all standard age ranges. */
export function franjasEstandar(): readonly string[] {
  return FRANJAS_ESTANDAR;
}

/** Human-readable label for a standardized franja. */
export function franjaLabel(franja: string | null | undefined): string {
  if (!franja) return "";
  return `${franja} años`;
}
