import type { DiagnosisOption } from "./diagnosis-map";

export type Profesion = "fonoaudiologia" | "psicopedagogia";

export function getProfesion(specialty: string | null | undefined): Profesion {
  if (!specialty) return "fonoaudiologia";
  const s = specialty.toLowerCase();
  if (
    s.includes("psicoped") ||
    s.includes("pedagog") ||
    s.includes("aprendizaje")
  ) return "psicopedagogia";
  return "fonoaudiologia";
}

export const DIAGNOSES_FONO: DiagnosisOption[] = [
  { value: "TEL",               label: "TEL – Trastorno Específico del Lenguaje" },
  { value: "TDL",               label: "TDL – Trastorno del Desarrollo del Lenguaje" },
  { value: "TEA",               label: "TEA – Trastorno del Espectro Autista" },
  { value: "TDAH",              label: "TDAH" },
  { value: "TSH",               label: "TSH – Trastorno de los sonidos del habla" },
  { value: "Apraxia del habla", label: "Apraxia del habla" },
  { value: "Disartria",         label: "Disartria" },
  { value: "Tartamudez",        label: "Tartamudez / Disfluencia" },
  { value: "Voz",               label: "Trastorno de voz (disfonía, nódulos…)" },
  { value: "Deglución atípica", label: "Deglución atípica" },
];

export const DIAGNOSES_PSICOPED: DiagnosisOption[] = [
  { value: "Dificultades de aprendizaje",  label: "Dificultades de aprendizaje" },
  { value: "Dislexia",                     label: "Dislexia" },
  { value: "Disgrafía",                    label: "Disgrafía" },
  { value: "Discalculia",                  label: "Discalculia" },
  { value: "TDAH",                         label: "TDAH" },
  { value: "Dificultades atencionales",    label: "Dificultades atencionales" },
  { value: "Comprensión lectora",          label: "Problemas de comprensión lectora" },
  { value: "Funciones ejecutivas",         label: "Dificultades en funciones ejecutivas" },
];

export function getDiagnosesByProfesion(profesion: Profesion): DiagnosisOption[] {
  return profesion === "psicopedagogia" ? DIAGNOSES_PSICOPED : DIAGNOSES_FONO;
}

export const BANCO_AREAS_FONO = [
  "lenguaje", "habla", "pragmática", "motricidad orofacial", "deglución", "estimulación temprana",
];

export const BANCO_AREAS_PSICOPED = [
  "lectoescritura", "cognición",
];

export function getBancoAreas(profesion: Profesion): string[] {
  return profesion === "psicopedagogia" ? BANCO_AREAS_PSICOPED : BANCO_AREAS_FONO;
}

export const PROFESION_LABEL: Record<Profesion, string> = {
  fonoaudiologia: "Fonoaudiología",
  psicopedagogia: "Psicopedagogía",
};
