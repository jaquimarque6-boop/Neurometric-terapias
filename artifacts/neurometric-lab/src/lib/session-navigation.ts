export type SessionType = "quick" | "complete";

const SESSION_PATHS: Record<SessionType, string> = {
  quick: "/sesion-rapida",
  complete: "/nueva-sesion",
};

export function parsePatientId(search: string): number | null {
  const value = new URLSearchParams(search).get("patientId");
  if (!value || !/^[1-9]\d*$/.test(value)) return null;

  const patientId = Number(value);
  return Number.isSafeInteger(patientId) ? patientId : null;
}

export function findAccessiblePatient<T extends { id: number }>(
  patients: readonly T[],
  patientId: number | null,
): T | null {
  if (patientId === null) return null;
  return patients.find(patient => patient.id === patientId) ?? null;
}

export function buildSessionPath(
  type: SessionType,
  patientId?: number | null,
): string {
  const path = SESSION_PATHS[type];
  if (!Number.isSafeInteger(patientId) || !patientId || patientId < 1) return path;

  return `${path}?patientId=${patientId}`;
}
