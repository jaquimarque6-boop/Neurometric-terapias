import type { DiagnosisOption } from "./diagnosis-map";

export type Profesion = "fonoaudiologia" | "psicopedagogia" | "ocupacional";

export function getProfesion(specialty: string | null | undefined): Profesion {
  if (!specialty) return "fonoaudiologia";
  const s = specialty.toLowerCase();
  if (
    s.includes("ocupacional") ||
    s.includes(" to ") ||
    s === "to"
  ) return "ocupacional";
  if (
    s.includes("psicoped") ||
    s.includes("pedagog") ||
    s.includes("aprendizaje")
  ) return "psicopedagogia";
  return "fonoaudiologia";
}

export const DIAGNOSES_FONO: DiagnosisOption[] = [
  // Lenguaje
  { value: "TEL",                   label: "TEL — Trastorno Específico del Lenguaje" },
  { value: "TDL",                   label: "TDL — Trastorno del Desarrollo del Lenguaje" },
  { value: "Retraso del lenguaje",  label: "Retraso del lenguaje" },
  { value: "Retraso madurativo",    label: "Retraso madurativo / del desarrollo" },
  // Habla y fonología
  { value: "TSH",                   label: "TSH — Trastorno de los sonidos del habla" },
  { value: "Trastorno fonológico",  label: "Trastorno fonológico" },
  { value: "Apraxia del habla",     label: "Apraxia del habla" },
  { value: "Disartria",             label: "Disartria" },
  // Fluidez
  { value: "Tartamudez",            label: "Tartamudez / Disfluencia" },
  // Neurodesarrollo
  { value: "TEA",                   label: "TEA — Trastorno del Espectro Autista" },
  { value: "TDAH",                  label: "TDAH" },
  // Orofacial y voz
  { value: "Voz",                   label: "Trastorno de voz (disfonía, nódulos…)" },
  { value: "Deglución atípica",     label: "Deglución atípica" },
];

export const DIAGNOSES_PSICOPED: DiagnosisOption[] = [
  { value: "Dificultades de aprendizaje",     label: "Dificultades de aprendizaje" },
  { value: "Dislexia",                        label: "Dislexia" },
  { value: "Disgrafía",                       label: "Disgrafía" },
  { value: "Discalculia",                     label: "Discalculia" },
  { value: "TDAH",                            label: "TDAH" },
  { value: "Dificultades atencionales",       label: "Dificultades atencionales" },
  { value: "Atención",                        label: "Dificultades de atención" },
  { value: "Comprensión lectora",             label: "Dificultades de comprensión lectora" },
  { value: "Producción escrita",              label: "Dificultades de producción escrita" },
  { value: "Funciones ejecutivas",            label: "Dificultades en funciones ejecutivas" },
  { value: "Memoria",                         label: "Dificultades de memoria" },
  { value: "Matemática",                      label: "Dificultades en matemática" },
  { value: "Estrategias de aprendizaje",      label: "Dificultades en estrategias de aprendizaje" },
];

export const DIAGNOSES_TO: DiagnosisOption[] = [
  // Procesamiento sensorial
  { value: "TPS",                          label: "TPS — Trastorno del Procesamiento Sensorial" },
  { value: "Hiperreactividad sensorial",   label: "Hiperreactividad / defensividad sensorial" },
  { value: "Hiporreactividad sensorial",   label: "Hiporreactividad / búsqueda sensorial" },
  // Praxis y coordinación
  { value: "TDC",                          label: "TDC — Trastorno del Desarrollo de la Coordinación" },
  { value: "Dispraxia",                    label: "Dispraxia / dificultades práxicas" },
  { value: "Dificultades motricidad fina", label: "Dificultades en motricidad fina" },
  { value: "Dificultades motricidad gruesa", label: "Dificultades en motricidad gruesa" },
  { value: "Dificultades grafomotoras",    label: "Dificultades grafomotoras" },
  // Autonomía y desempeño ocupacional
  { value: "Dificultades en AVD",          label: "Dificultades en actividades de la vida diaria (AVD)" },
  { value: "Dificultades de autorregulación", label: "Dificultades de autorregulación" },
  // Neurodesarrollo y condiciones asociadas
  { value: "TEA",                          label: "TEA — Trastorno del Espectro Autista" },
  { value: "TDAH",                         label: "TDAH" },
  { value: "Retraso madurativo",           label: "Retraso madurativo / del desarrollo" },
  { value: "Parálisis cerebral",           label: "Parálisis cerebral" },
  { value: "Hipotonía",                    label: "Hipotonía / alteración del tono" },
];

export function getDiagnosesByProfesion(profesion: Profesion): DiagnosisOption[] {
  if (profesion === "psicopedagogia") return DIAGNOSES_PSICOPED;
  if (profesion === "ocupacional")    return DIAGNOSES_TO;
  return DIAGNOSES_FONO;
}

// ── Banco de objetivos: áreas disponibles por profesión ──────────────────────
// These drive the "Área clínica" dropdown in the goal bank.
// Every area here must have a corresponding key in goal-library's AREA_GUIDANCE
// and ideally active library goals tagged with that area.

export const BANCO_AREAS_FONO = [
  "lenguaje",
  "habla",
  "pragmática",
  "motricidad orofacial",
  "deglución",
  "voz",
  "estimulación temprana",
];

export const BANCO_AREAS_PSICOPED = [
  "lectoescritura",
  "comprensión lectora",
  "producción escrita",
  "disgrafía",
  "matemáticas",
  "cognición",
  "funciones ejecutivas",
  "memoria",
  "estrategias de aprendizaje",
];

export const BANCO_AREAS_TO = [
  "integración sensorial",
  "motricidad fina",
  "motricidad gruesa",
  "coordinación visomotora",
  "actividades de la vida diaria",
  "grafomotricidad",
  "autorregulación",
  "praxias",
];

export function getBancoAreas(profesion: Profesion): string[] {
  if (profesion === "psicopedagogia") return BANCO_AREAS_PSICOPED;
  if (profesion === "ocupacional")    return BANCO_AREAS_TO;
  return BANCO_AREAS_FONO;
}

export const PROFESION_LABEL: Record<Profesion, string> = {
  fonoaudiologia: "Fonoaudiología",
  psicopedagogia: "Psicopedagogía",
  ocupacional: "Terapia Ocupacional",
};
