import {
  formatPsychologySessionSummary,
  parsePsychologySessionSummary,
} from "@workspace/clinical-specialty";

export const MAX_REPORT_CONTEXT_CHARS = 48_000;
export const MAX_EXISTING_REPORT_DRAFT_CHARS = 20_000;

export type ExistingReportDraft = {
  resumen: string;
  conducta: string;
  areas: Record<string, string>;
  removedAreas: string[];
  sugerencias: string;
};

export function normalizeExistingReportDraft(value: unknown): ExistingReportDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const draft = value as Record<string, unknown>;
  if (typeof draft.resumen !== "string" || typeof draft.conducta !== "string"
    || typeof draft.sugerencias !== "string" || !draft.areas || typeof draft.areas !== "object"
    || Array.isArray(draft.areas) || !Array.isArray(draft.removedAreas)
    || !draft.removedAreas.every(name => typeof name === "string" && name.length <= 120)) return null;

  const entries = Object.entries(draft.areas);
  if (entries.length > 100 || entries.some(([name, text]) =>
    typeof name !== "string" || !name.trim() || name.length > 120 || typeof text !== "string")) return null;

  let serializedLength: number;
  try {
    serializedLength = JSON.stringify(draft).length;
  } catch {
    return null;
  }
  if (serializedLength > MAX_EXISTING_REPORT_DRAFT_CHARS) return null;

  return {
    resumen: draft.resumen,
    conducta: draft.conducta,
    areas: Object.fromEntries(entries.map(([name, text]) => [name.trim(), text as string])),
    removedAreas: [...draft.removedAreas] as string[],
    sugerencias: draft.sugerencias,
  };
}

export function hasExistingReportDraftContent(draft: ExistingReportDraft): boolean {
  return Boolean(
    draft.resumen.trim()
    || draft.conducta.trim()
    || draft.sugerencias.trim()
    || Object.values(draft.areas).some(value => value.trim()),
  );
}

export function formatExistingReportDraft(draft: ExistingReportDraft): string {
  const areas = Object.entries(draft.areas)
    .filter(([, text]) => text.trim())
    .map(([name, text]) => `- ${name}: ${text}`)
    .join("\n");
  return [
    `Resumen: ${draft.resumen || "(vacío)"}`,
    `Conducta: ${draft.conducta || "(vacío)"}`,
    `Áreas:\n${areas || "(vacías)"}`,
    `Sugerencias: ${draft.sugerencias || "(vacío)"}`,
    `Áreas retiradas por el profesional: ${draft.removedAreas.join(", ") || "(ninguna)"}`,
  ].join("\n\n");
}

export type SessionContextRecord = {
  fecha: string | null;
  professionalName?: string | null;
  resumenSesion?: string | null;
  observaciones?: string | null;
  recomendacionesHogar?: string | null;
  materialesActividades?: Array<{ nombre?: string | null }> | null;
};

export type ClinicalAreaPatientSources = {
  lenguajeComunicacion?: string | null;
  atencionConducta?: string | null;
  vozHabla?: string | null;
  deglucion?: string | null;
  rutinasHabitos?: string | null;
  entornoParticipacion?: string | null;
};

export function documentedAreaSources(
  patient: ClinicalAreaPatientSources,
  goalAreas: Array<string | null | undefined>,
  sessionAreas: Array<string | null | undefined> = [],
): string[] {
  const anamnesis = [
    ["Lenguaje y comunicación", patient.lenguajeComunicacion],
    ["Atención y conducta", patient.atencionConducta],
    ["Voz y habla", patient.vozHabla],
    ["Deglución", patient.deglucion],
    ["Rutinas y hábitos", patient.rutinasHabitos],
    ["Entorno y participación", patient.entornoParticipacion],
  ].filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    .map(([label]) => label as string);
  return [...new Set([
    ...anamnesis,
    ...goalAreas.map(area => area?.trim()).filter((area): area is string => Boolean(area)),
    ...sessionAreas.map(area => area?.trim()).filter((area): area is string => Boolean(area)),
  ])];
}

function isValidClinicalDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function buildSessionContext(records: SessionContextRecord[]): string {
  if (records.length === 0) return "";
  return records.map(record => {
    const dateIsValid = isValidClinicalDate(record.fecha);
    const parts = [`Fecha: ${dateIsValid ? record.fecha : "No consignada"}`];
    if (record.professionalName) parts.push(`Profesional: ${record.professionalName}`);
    if (record.resumenSesion) {
      parts.push(`Resumen: ${formatPsychologySessionSummary(record.resumenSesion)}`);
    }
    if (record.observaciones) parts.push(`Observaciones: ${record.observaciones}`);
    const materials = (record.materialesActividades ?? [])
      .map(material => material.nombre?.trim())
      .filter((name): name is string => Boolean(name));
    if (materials.length) parts.push(`Actividades y materiales: ${materials.join(", ")}`);
    if (record.recomendacionesHogar) parts.push(`Recomendaciones hogar: ${record.recomendacionesHogar}`);
    return parts.join("\n");
  }).join("\n\n");
}

export function reportContextLength(systemPrompt: string, userPrompt: string): number {
  return systemPrompt.length + userPrompt.length;
}

export function reportContextWithinBudget(systemPrompt: string, userPrompt: string): boolean {
  return reportContextLength(systemPrompt, userPrompt) <= MAX_REPORT_CONTEXT_CHARS;
}

export function normalizeReportAreas(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([name, text]) => name.trim().length > 0 && typeof text === "string" && text.trim().length > 0)
      .map(([name, text]) => [name.trim(), (text as string).trim()]),
  );
}

export function documentedSessionAreas(records: SessionContextRecord[]): string[] {
  return [...new Set(records.flatMap(record =>
    parsePsychologySessionSummary(record.resumenSesion)?.areas
      .map(area => area.label.trim())
      .filter(Boolean) ?? [],
  ))];
}
