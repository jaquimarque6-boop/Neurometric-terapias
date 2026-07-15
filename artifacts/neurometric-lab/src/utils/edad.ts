// ── Cálculo y formato de edad ─────────────────────────────────────────────────
// Regla de negocio:
//   • Si el paciente tiene fecha de nacimiento válida → edad calculada automáticamente.
//   • Si no → se usa la edad manual (campo `age`).
//   • Menores de 6 años → "3 años 8 meses"; desde 6 años → "8 años".

export interface EdadCalculada {
  anios: number;
  meses: number;
  /** true si proviene de fecha de nacimiento; false si es edad manual */
  desdeFechaNacimiento: boolean;
}

function parseFechaNacimiento(fecha?: string | null): Date | null {
  if (!fecha || !fecha.trim()) return null;
  // Acepta "YYYY-MM-DD" (se ancla a mediodía local para evitar corrimiento por zona horaria)
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(fecha.trim()) ? `${fecha.trim()}T12:00:00` : fecha;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  if (d.getTime() > Date.now()) return null; // fecha futura → inválida
  return d;
}

export function calcularEdad(
  fechaNacimiento?: string | null,
  ageManual?: number | string | null,
): EdadCalculada | null {
  const birth = parseFechaNacimiento(fechaNacimiento);
  if (birth) {
    const today = new Date();
    let anios = today.getFullYear() - birth.getFullYear();
    let meses = today.getMonth() - birth.getMonth();
    if (today.getDate() < birth.getDate()) meses--;
    if (meses < 0) { anios--; meses += 12; }
    if (anios < 0) return null;
    return { anios, meses, desdeFechaNacimiento: true };
  }
  if (ageManual !== null && ageManual !== undefined && ageManual !== "") {
    const n = typeof ageManual === "string" ? parseInt(ageManual, 10) : ageManual;
    if (!isNaN(n) && n >= 0) return { anios: n, meses: 0, desdeFechaNacimiento: false };
  }
  return null;
}

/** Edad en años completos (número), o null si no hay dato. */
export function edadEnAnios(
  fechaNacimiento?: string | null,
  ageManual?: number | string | null,
): number | null {
  return calcularEdad(fechaNacimiento, ageManual)?.anios ?? null;
}

/**
 * Edad legible: "3 años 8 meses" para menores de 6, "8 años" desde los 6.
 * La edad manual (sin fecha) siempre se muestra en años completos.
 */
export function formatEdad(
  fechaNacimiento?: string | null,
  ageManual?: number | string | null,
): string | null {
  const edad = calcularEdad(fechaNacimiento, ageManual);
  if (!edad) return null;
  const { anios, meses, desdeFechaNacimiento } = edad;
  if (desdeFechaNacimiento && anios < 6) {
    const a = `${anios} año${anios === 1 ? "" : "s"}`;
    if (meses === 0) return a;
    return `${a} ${meses} mes${meses === 1 ? "" : "es"}`;
  }
  return `${anios} año${anios === 1 ? "" : "s"}`;
}

/** Versión corta para chips/listados: "3a 8m" o "8a". */
export function formatEdadCorta(
  fechaNacimiento?: string | null,
  ageManual?: number | string | null,
): string | null {
  const edad = calcularEdad(fechaNacimiento, ageManual);
  if (!edad) return null;
  if (edad.desdeFechaNacimiento && edad.anios < 6 && edad.meses > 0) {
    return `${edad.anios}a ${edad.meses}m`;
  }
  return `${edad.anios}a`;
}
