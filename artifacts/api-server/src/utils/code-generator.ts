/**
 * Neurometric Lab — Intelligent Goal Code Generator
 *
 * Code format: AREA-MIN-MAX-SUBAREA-DIFICULTAD-SEQ
 * Example:     NL-2-4-LEX-B-01
 *   NL   = área clínica prefix
 *   2    = franja etaria mínima
 *   4    = franja etaria máxima
 *   LEX  = subárea/categoría
 *   B    = nivel de dificultad (B/I/A)
 *   01   = número secuencial (padded 2 digits)
 */

// ─── Mapping tables (source of truth — extend here for new areas/subareas) ───

export const AREA_PREFIXES: Record<string, string> = {
  "lenguaje":              "NL",
  "habla":                 "HB",
  "pragmática":            "PR",
  "motricidad orofacial":  "MO",
  "deglución":             "DG",
  "lectoescritura":        "LE",
  "cognición":             "CG",
  "estimulación temprana": "ET",
};

export const SUBAREA_CODES: Record<string, string> = {
  // Lenguaje
  "léxico":                   "LEX",
  "morfosintaxis":             "MS",
  "comprensión":               "COMP",
  "narrativo":                 "NAR",
  "conectores":                "CON",
  "semántica":                 "SEM",
  "categorías semánticas":     "CAT",
  "morfología":                "MORF",
  "metalenguaje":              "META",
  // Habla
  "articulación":              "ART",
  "procesos fonológicos":      "FON",
  "inteligibilidad":           "INT",
  "fluidez":                   "FLU",
  "discriminación auditiva":   "DA",
  // Pragmática
  "comunicación no verbal":    "CNV",
  "conversación":              "CONV",
  "habilidades conversacionales": "HC",
  "comunicación intencional":  "CI",
  "adaptación discursiva":     "AD",
  // Motricidad orofacial
  "tono muscular":             "TM",
  "praxis":                    "PRAX",
  "respiración":               "RESP",
  // Deglución
  "deglución":                 "DEG",
  // Lectoescritura
  "conciencia fonológica":     "CF",
  "lectura":                   "LEC",
  "comprensión lectora":       "CL",
  "escritura":                 "ESC",
  // Cognición
  "atención":                  "AT",
  "memoria":                   "MEM",
  "funciones ejecutivas":      "FE",
  "razonamiento":              "RAZ",
  "flexibilidad cognitiva":    "FC",
  // Estimulación temprana
  "atención conjunta":         "AC",
  "imitación":                 "IMIT",
  "juego":                     "JUE",
  "comunicación preverbal":    "CPV",
  "primeras palabras":         "PP",
  // Genérico
  "expresión":                 "EXPR",
  "expresivo":                 "EXPR",
};

export const DIFFICULTY_CODES: Record<string, string> = {
  "básico":     "B",
  "intermedio": "I",
  "avanzado":   "A",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalize a string for lookup (lowercase, trim, remove diacritics for matching) */
function norm(s: string): string {
  return s.toLowerCase().trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function lookupArea(area: string): string {
  const key = Object.keys(AREA_PREFIXES).find(k => norm(k) === norm(area));
  return key ? AREA_PREFIXES[key] : area.slice(0, 2).toUpperCase();
}

function lookupSubarea(subarea: string): string {
  const key = Object.keys(SUBAREA_CODES).find(k => norm(k) === norm(subarea));
  return key ? SUBAREA_CODES[key] : subarea.slice(0, 4).toUpperCase().replace(/\s/g, "");
}

function lookupDifficulty(nivel: string): string {
  const key = Object.keys(DIFFICULTY_CODES).find(k => norm(k) === norm(nivel));
  return key ? DIFFICULTY_CODES[key] : nivel.slice(0, 1).toUpperCase();
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface CodeParams {
  areaClinica: string;
  franjaEtariaMin?: number | null;
  franjaEtariaMax?: number | null;
  subarea?: string | null;
  nivelDificultad?: string | null;
}

/** Build the repeating prefix (all segments except sequence) */
export function buildCodePrefix(p: CodeParams): string {
  const area = lookupArea(p.areaClinica);
  const min  = p.franjaEtariaMin != null ? String(p.franjaEtariaMin) : "0";
  const max  = p.franjaEtariaMax != null ? String(p.franjaEtariaMax) : "0";
  const sub  = p.subarea ? lookupSubarea(p.subarea) : "GEN";
  const dif  = p.nivelDificultad ? lookupDifficulty(p.nivelDificultad) : "B";
  return `${area}-${min}-${max}-${sub}-${dif}`;
}

/** Build the full code from a prefix and sequence number */
export function buildFullCode(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(2, "0")}`;
}

/** Generate a full suggested code given params and an existing list of codes to avoid duplicates */
export function generateUniqueCode(p: CodeParams, existingCodes: string[]): { code: string; prefix: string; sequence: number } {
  const prefix = buildCodePrefix(p);
  const matching = existingCodes.filter(c => c.startsWith(prefix + "-"));
  let seq = matching.length + 1;
  let code = buildFullCode(prefix, seq);
  // Ensure uniqueness even with gaps
  while (existingCodes.includes(code)) {
    seq++;
    code = buildFullCode(prefix, seq);
  }
  return { code, prefix, sequence: seq };
}

/** Validate the structure of a code string */
export function isValidCodeFormat(code: string): boolean {
  // AREA-MIN-MAX-SUBAREA-DIFF-SEQ  (6 segments separated by hyphens, with variants)
  return /^[A-Z]{2,4}-\d+-\d+-[A-Z]{1,6}-[A-Z]{1,4}-\d{2,}$/.test(code);
}

/** Parse a code into its segments (best effort) */
export function parseCode(code: string): {
  areaPrefix: string; min: string; max: string; subareaCode: string; diffCode: string; seq: string;
} | null {
  const parts = code.split("-");
  if (parts.length < 6) return null;
  return {
    areaPrefix:  parts[0],
    min:         parts[1],
    max:         parts[2],
    subareaCode: parts[3],
    diffCode:    parts[4],
    seq:         parts.slice(5).join("-"),
  };
}

/** Get label for an area prefix */
export function areaLabelFromPrefix(prefix: string): string {
  const entry = Object.entries(AREA_PREFIXES).find(([, v]) => v === prefix);
  return entry ? entry[0] : prefix;
}

/** Get label for a subarea code */
export function subareaLabelFromCode(code: string): string {
  const entry = Object.entries(SUBAREA_CODES).find(([, v]) => v === code);
  return entry ? entry[0] : code;
}

/** Get all area prefix options for admin UI */
export function getAllAreaOptions() {
  return Object.entries(AREA_PREFIXES).map(([label, prefix]) => ({ label, prefix }));
}

/** Get all subarea code options for admin UI */
export function getAllSubareaOptions() {
  return Object.entries(SUBAREA_CODES).map(([label, code]) => ({ label, code }));
}
