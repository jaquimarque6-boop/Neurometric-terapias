export const ANAMNESIS_IMPORT_FIELDS = [
  { key: "motivoConsulta", label: "Motivo de consulta" },
  { key: "antecedentes", label: "Antecedentes relevantes" },
  { key: "historiaFamiliar", label: "Historia familiar" },
  { key: "escolaridad", label: "Escolaridad / Aprendizaje" },
  { key: "observaciones", label: "Observaciones" },
  { key: "lenguajeComunicacion", label: "Lenguaje y comunicación" },
  { key: "atencionConducta", label: "Atención y conducta" },
  { key: "vozHabla", label: "Voz y habla" },
  { key: "deglucion", label: "Deglución" },
  { key: "impresionClinica", label: "Impresión clínica inicial" },
  { key: "rutinasHabitos", label: "Rutinas y hábitos" },
  { key: "entornoParticipacion", label: "Entorno y participación" },
] as const;

export type AnamnesisImportKey = typeof ANAMNESIS_IMPORT_FIELDS[number]["key"];
export type AnamnesisImportValues = Record<AnamnesisImportKey, string>;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeAnamnesisImportValues(value: unknown): AnamnesisImportValues {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return Object.fromEntries(
    ANAMNESIS_IMPORT_FIELDS.map(({ key }) => [key, text(source[key])]),
  ) as AnamnesisImportValues;
}

function mergeForReview(existingValue: string, proposedValue: string): string {
  const existing = text(existingValue);
  const proposed = text(proposedValue);
  if (!existing) return proposed;
  if (!proposed || existing === proposed) return existing;
  return `${existing}\n\n${proposed}`;
}

export function buildAnamnesisImportDraft(
  existingValue: unknown,
  proposedValue: unknown,
): AnamnesisImportValues {
  const existing = normalizeAnamnesisImportValues(existingValue);
  const proposed = normalizeAnamnesisImportValues(proposedValue);
  return Object.fromEntries(
    ANAMNESIS_IMPORT_FIELDS.map(({ key }) => [
      key,
      mergeForReview(existing[key], proposed[key]),
    ]),
  ) as AnamnesisImportValues;
}