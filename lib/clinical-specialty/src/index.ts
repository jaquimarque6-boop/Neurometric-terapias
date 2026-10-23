export const CLINICAL_SPECIALTIES = [
  "fonoaudiologia",
  "psicopedagogia",
  "terapia_ocupacional",
  "psicologia",
  "general",
] as const;

export type ClinicalSpecialty = (typeof CLINICAL_SPECIALTIES)[number];

export const CLINICAL_SPECIALTY_LABELS: Record<ClinicalSpecialty, string> = {
  fonoaudiologia: "Fonoaudiología",
  psicopedagogia: "Psicopedagogía",
  terapia_ocupacional: "Terapia Ocupacional",
  psicologia: "Psicología",
  general: "General",
};

const FONO_PATTERN = /fono|logoped|speech|lenguaje|habla|voz|degluc/;
const PSYCHOLOGY_PATTERN = /psicolog/;
const PSYCHOPEDAGOGY_PATTERN = /psicoped|pedagog|aprendiz/;
const OCCUPATIONAL_THERAPY_PATTERN =
  /ocupacional|ergoter|(^|\s)to($|\s)|\bavd\b|sensori/;

function foldSpecialty(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Maps a stored/display specialty name to a stable key without changing the
 * stored value. Unknown and missing specialties deliberately resolve to the
 * neutral `general` branch.
 */
export function normalizeClinicalSpecialty(
  specialty: string | null | undefined,
): ClinicalSpecialty {
  if (!specialty?.trim()) return "general";

  const normalized = foldSpecialty(specialty);
  if (PSYCHOLOGY_PATTERN.test(normalized)) return "psicologia";
  if (FONO_PATTERN.test(normalized)) return "fonoaudiologia";
  if (PSYCHOPEDAGOGY_PATTERN.test(normalized)) return "psicopedagogia";
  if (OCCUPATIONAL_THERAPY_PATTERN.test(normalized)) {
    return "terapia_ocupacional";
  }
  return "general";
}

/**
 * Prefer the authenticated professional's explicit specialty. If it is
 * absent, infer from assignments only when they agree on one specialty.
 * Ambiguous or unrecognized inputs stay neutral rather than selecting Fono.
 */
export function resolveClinicalSpecialty(
  activeSpecialty: string | null | undefined,
  assignedSpecialties: readonly (string | null | undefined)[] = [],
): ClinicalSpecialty {
  if (activeSpecialty?.trim()) {
    return normalizeClinicalSpecialty(activeSpecialty);
  }

  const assigned = new Set(
    assignedSpecialties
      .map(normalizeClinicalSpecialty)
      .filter((specialty) => specialty !== "general"),
  );
  return assigned.size === 1 ? [...assigned][0] : "general";
}

export function hasSpecialtySpecificContent(
  specialty: ClinicalSpecialty,
): boolean {
  return (
    specialty === "fonoaudiologia" ||
    specialty === "psicopedagogia" ||
    specialty === "terapia_ocupacional"
  );
}

export {
  formatPsychologySessionSummary,
  parsePsychologySessionSummary,
  serializePsychologySessionSummary,
  PSYCHOLOGY_SESSION_SECTION_LABELS,
} from "./psychology-session-format";
export type {
  PsychologySessionArea,
  PsychologySessionFields,
  StructuredPsychologySession,
} from "./psychology-session-format";
