import { getDiagnosisOptions, type DiagnosisOption } from "./diagnosis-map";

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

// Subconjuntos relevantes por profesión (referencian el banco maestro
// de diagnosis-map.ts — las etiquetas y categorías viven allí).
const DIAGNOSES_FONO_VALUES = [
  "TEL", "TDL", "Retraso del lenguaje", "Retraso madurativo", "Afasia",
  "TSH", "Trastorno fonológico", "Apraxia del habla", "Disartria", "Tartamudez",
  "Voz", "Disfonía",
  "Deglución atípica", "Disfagia",
  "Hipoacusia", "Implante coclear",
  "TEA", "TDAH",
  "Pragmática", "Comunicación aumentativa",
];

const DIAGNOSES_PSICOPED_VALUES = [
  "Dificultades de aprendizaje", "Trastorno específico del aprendizaje",
  "Dislexia", "Disgrafía", "Discalculia",
  "Comprensión lectora", "Producción escrita", "Escritura", "Matemática",
  "Atención", "Dificultades atencionales", "Funciones ejecutivas",
  "Memoria", "Estrategias de aprendizaje",
  "TDAH", "TEA", "Discapacidad intelectual",
];

const DIAGNOSES_TO_VALUES = [
  "TPS", "Integración sensorial", "Hiperreactividad sensorial", "Hiporreactividad sensorial",
  "Dispraxia", "TDC",
  "Dificultades motricidad fina", "Dificultades motricidad gruesa", "Dificultades grafomotoras",
  "Dificultades en AVD", "Dificultades de autorregulación",
  "TEA", "TDAH", "Retraso madurativo", "Parálisis cerebral", "Hipotonía", "Discapacidad intelectual",
];

export const DIAGNOSES_FONO: DiagnosisOption[] = getDiagnosisOptions(DIAGNOSES_FONO_VALUES);
export const DIAGNOSES_PSICOPED: DiagnosisOption[] = getDiagnosisOptions(DIAGNOSES_PSICOPED_VALUES);
export const DIAGNOSES_TO: DiagnosisOption[] = getDiagnosisOptions(DIAGNOSES_TO_VALUES);

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
