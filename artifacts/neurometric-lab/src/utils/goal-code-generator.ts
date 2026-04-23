/**
 * Client-side goal code generator — mirrors the backend logic for instant preview.
 * No API call needed for code preview. API is called only to get the next sequence number.
 *
 * Code format: AREA-MIN-MAX-SUBAREA-DIFICULTAD-SEQ
 * Example:     NL-2-4-LEX-B-01
 */

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
  "léxico":                    "LEX",
  "morfosintaxis":             "MS",
  "comprensión":               "COMP",
  "narrativo":                 "NAR",
  "conectores":                "CON",
  "semántica":                 "SEM",
  "categorías semánticas":     "CAT",
  "morfología":                "MORF",
  "metalenguaje":              "META",
  "articulación":              "ART",
  "procesos fonológicos":      "FON",
  "inteligibilidad":           "INT",
  "fluidez":                   "FLU",
  "discriminación auditiva":   "DA",
  "comunicación no verbal":    "CNV",
  "conversación":              "CONV",
  "habilidades conversacionales": "HC",
  "comunicación intencional":  "CI",
  "adaptación discursiva":     "AD",
  "tono muscular":             "TM",
  "praxis":                    "PRAX",
  "respiración":               "RESP",
  "deglución":                 "DEG",
  "conciencia fonológica":     "CF",
  "lectura":                   "LEC",
  "comprensión lectora":       "CL",
  "escritura":                 "ESC",
  "atención":                  "AT",
  "memoria":                   "MEM",
  "funciones ejecutivas":      "FE",
  "razonamiento":              "RAZ",
  "flexibilidad cognitiva":    "FC",
  "atención conjunta":         "AC",
  "imitación":                 "IMIT",
  "juego":                     "JUE",
  "comunicación preverbal":    "CPV",
  "primeras palabras":         "PP",
  "expresión":                 "EXPR",
};

export const DIFFICULTY_CODES: Record<string, string> = {
  "básico":     "B",
  "intermedio": "I",
  "avanzado":   "A",
};

// Subarea options grouped by area for smart dropdowns
export const AREA_SUBAREAS: Record<string, string[]> = {
  "lenguaje": ["Léxico", "Morfosintaxis", "Comprensión", "Narrativo", "Conectores", "Semántica", "Categorías semánticas", "Morfología", "Metalenguaje"],
  "habla": ["Articulación", "Procesos fonológicos", "Inteligibilidad", "Fluidez", "Voz", "Higiene vocal", "Discriminación auditiva"],
  "pragmática": ["Comunicación no verbal", "Conversación", "Habilidades conversacionales", "Comunicación intencional", "Adaptación discursiva"],
  "motricidad orofacial": ["Tono muscular", "Praxis", "Respiración"],
  "deglución": ["Deglución"],
  "lectoescritura": ["Conciencia fonológica", "Lectura", "Comprensión lectora", "Escritura"],
  "cognición": ["Atención", "Memoria", "Funciones ejecutivas", "Razonamiento", "Flexibilidad cognitiva"],
  "estimulación temprana": ["Atención conjunta", "Imitación", "Juego", "Comunicación preverbal", "Primeras palabras"],
};

function norm(s: string): string {
  return s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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

export interface CodePreviewParams {
  areaClinica?: string;
  franjaEtariaMin?: number | null;
  franjaEtariaMax?: number | null;
  subarea?: string;
  nivelDificultad?: string;
}

/** Build code prefix — all segments except the sequence number */
export function buildCodePrefix(p: CodePreviewParams): string {
  const area = p.areaClinica ? lookupArea(p.areaClinica) : "??";
  const min  = p.franjaEtariaMin != null ? String(p.franjaEtariaMin) : "?";
  const max  = p.franjaEtariaMax != null ? String(p.franjaEtariaMax) : "?";
  const sub  = p.subarea ? lookupSubarea(p.subarea) : "???";
  const dif  = p.nivelDificultad ? lookupDifficulty(p.nivelDificultad) : "?";
  return `${area}-${min}-${max}-${sub}-${dif}`;
}

/** Preview a code with placeholder sequence (call API for the real sequence) */
export function previewCode(p: CodePreviewParams, seq: number = 1): string {
  return `${buildCodePrefix(p)}-${String(seq).padStart(2, "0")}`;
}

/** Validate code format */
export function isValidCodeFormat(code: string): boolean {
  return /^[A-Z]{2,4}-\d+-\d+-[A-Z]{1,6}-[A-Z]{1,4}-\d{2,}$/.test(code);
}

/** Parse code into labeled segments */
export function parseCode(code: string) {
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

/** Tooltip/description of each code segment */
export function explainCode(code: string): string {
  const parsed = parseCode(code);
  if (!parsed) return "Formato de código no reconocido";
  const { areaPrefix, min, max, subareaCode, diffCode, seq } = parsed;
  const areaEntry = Object.entries(AREA_PREFIXES).find(([, v]) => v === areaPrefix);
  const subareaEntry = Object.entries(SUBAREA_CODES).find(([, v]) => v === subareaCode);
  const diffEntry = Object.entries(DIFFICULTY_CODES).find(([, v]) => v === diffCode);
  return [
    `Área: ${areaEntry ? areaEntry[0] : areaPrefix}`,
    `Franja: ${min}–${max} años`,
    `Subárea: ${subareaEntry ? subareaEntry[0] : subareaCode}`,
    `Nivel: ${diffEntry ? diffEntry[0] : diffCode}`,
    `N.° ${parseInt(seq, 10)}`,
  ].join(" · ");
}
