export type CoverageSuggestionPatient = {
  id: number;
  assignedProfessionalId?: number | null;
  coberturaMedica?: string | null;
};

export function getCoverageSuggestions(
  patients: readonly CoverageSuggestionPatient[],
  professionalUserId: number | null | undefined,
  excludePatientId?: number,
): string[] {
  if (professionalUserId == null) return [];

  const names = new Map<string, string>();
  for (const patient of patients) {
    if (
      patient.assignedProfessionalId !== undefined &&
      patient.assignedProfessionalId !== professionalUserId
    ) {
      continue;
    }

    if (
      patient.id === excludePatientId ||
      typeof patient.coberturaMedica !== "string"
    ) {
      continue;
    }

    const name = patient.coberturaMedica.trim();
    if (!name) continue;

    const normalized = name.toLocaleLowerCase("es");
    if (!names.has(normalized)) names.set(normalized, name);
  }

  return [...names.values()].sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" }),
  );
}
