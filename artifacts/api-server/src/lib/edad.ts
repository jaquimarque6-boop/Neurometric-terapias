// ── Cálculo de edad (backend) ─────────────────────────────────────────────────
// Misma regla que el frontend (src/utils/edad.ts):
//   fecha de nacimiento → edad automática; si no hay, edad manual.
//   <6 años → "3 años 8 meses"; desde 6 → "8 años".

function parseFechaNacimiento(fecha?: string | null): Date | null {
  if (!fecha || !fecha.trim()) return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(fecha.trim()) ? `${fecha.trim()}T12:00:00` : fecha;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  if (d.getTime() > Date.now()) return null;
  return d;
}

export function calcularEdad(
  fechaNacimiento?: string | null,
  ageManual?: number | null,
): { anios: number; meses: number; desdeFechaNacimiento: boolean } | null {
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
  if (ageManual !== null && ageManual !== undefined && !isNaN(ageManual) && ageManual >= 0) {
    return { anios: ageManual, meses: 0, desdeFechaNacimiento: false };
  }
  return null;
}

export function formatEdad(
  fechaNacimiento?: string | null,
  ageManual?: number | null,
): string | null {
  const edad = calcularEdad(fechaNacimiento, ageManual);
  if (!edad) return null;
  const { anios, meses, desdeFechaNacimiento } = edad;
  if (desdeFechaNacimiento && anios < 6) {
    const a = `${anios} año${anios === 1 ? "" : "s"}`;
    return meses === 0 ? a : `${a} ${meses} mes${meses === 1 ? "" : "es"}`;
  }
  return `${anios} año${anios === 1 ? "" : "s"}`;
}

// ── Diagnóstico principal / asociados ─────────────────────────────────────────
// `patients.diagnosis` guarda una lista separada por comas con orden preservado:
// el PRIMERO es el diagnóstico principal; el resto son asociados.
export function splitDiagnosis(diagnosis?: string | null): { principal: string | null; asociados: string[] } {
  if (!diagnosis || !diagnosis.trim()) return { principal: null, asociados: [] };
  const list = diagnosis.split(",").map(s => s.trim()).filter(Boolean);
  if (list.length === 0) return { principal: null, asociados: [] };
  return { principal: list[0], asociados: list.slice(1) };
}
