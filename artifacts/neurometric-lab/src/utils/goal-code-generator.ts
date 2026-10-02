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
  "actividades de la vida diaria y autonomía": "AV",
  "rutinas y hábitos": "RH",
  "procesamiento y regulación sensorial": "RS",
  "motricidad fina y destreza manual": "MF",
  "motricidad gruesa": "MG",
  "coordinación visomotora": "CV",
  "grafomotricidad": "GF",
  "juego": "JU",
  "participación social": "PS",
  "participación escolar": "PE",
  "planificación y organización motora": "PM",
  "entorno y participación": "EP",
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
  "vestido":                   "VES",
  "higiene personal":          "HIG",
  "alimentación funcional":    "ALI",
  "organización de pertenencias": "PER",
  "secuencias cotidianas":    "SEC",
  "transiciones":             "TRANS",
  "autonomía en rutinas":     "AUT",
  "autorregulación sensorial": "REG",
  "participación sensorial":  "PSEN",
  "adaptaciones sensoriales": "ASEN",
  "destreza manual":          "DM",
  "coordinación bimanual":    "BIM",
  "uso funcional de herramientas": "HER",
  "movilidad funcional":      "MOV",
  "equilibrio y coordinación": "EQ",
  "participación motriz":    "PMOT",
  "coordinación ojo-mano":    "OM",
  "organización visuoespacial": "VESP",
  "manipulación con apoyo visual": "MAV",
  "prensión y uso de útiles": "PU",
  "trazos y formas":          "TF",
  "escritura funcional":      "EF",
  "juego funcional":          "JF",
  "juego simbólico":          "JS",
  "juego compartido":         "JC",
  "iniciativa en actividades grupales": "IAG",
  "turnos y roles":           "TR",
  "interacción en contexto":  "IC",
  "rutinas escolares":        "RE",
  "organización de materiales": "OMAT",
  "acceso a tareas escolares": "ATE",
  "secuenciación motora":     "SM",
  "planificación de tareas":  "PT",
  "adaptación de estrategias": "AE",
  "adaptación del entorno":   "AEN",
  "participación en el hogar": "PH",
  "participación en comunidad": "PC",
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
  "actividades de la vida diaria y autonomía": ["Vestido", "Higiene personal", "Alimentación funcional", "Organización de pertenencias"],
  "rutinas y hábitos": ["Secuencias cotidianas", "Transiciones", "Autonomía en rutinas"],
  "procesamiento y regulación sensorial": ["Autorregulación sensorial", "Participación sensorial", "Adaptaciones sensoriales"],
  "motricidad fina y destreza manual": ["Destreza manual", "Coordinación bimanual", "Uso funcional de herramientas"],
  "motricidad gruesa": ["Movilidad funcional", "Equilibrio y coordinación", "Participación motriz"],
  "coordinación visomotora": ["Coordinación ojo-mano", "Organización visuoespacial", "Manipulación con apoyo visual"],
  "grafomotricidad": ["Prensión y uso de útiles", "Trazos y formas", "Escritura funcional"],
  "juego": ["Juego funcional", "Juego simbólico", "Juego compartido"],
  "participación social": ["Iniciativa en actividades grupales", "Turnos y roles", "Interacción en contexto"],
  "participación escolar": ["Rutinas escolares", "Organización de materiales", "Acceso a tareas escolares"],
  "planificación y organización motora": ["Secuenciación motora", "Planificación de tareas", "Adaptación de estrategias"],
  "entorno y participación": ["Adaptación del entorno", "Participación en el hogar", "Participación en comunidad"],
  // Compatibilidad con objetivos existentes bajo etiquetas anteriores.
  "integración sensorial": ["Autorregulación sensorial", "Participación sensorial", "Adaptaciones sensoriales"],
  "motricidad fina": ["Destreza manual", "Coordinación bimanual", "Uso funcional de herramientas"],
  "actividades de la vida diaria": ["Vestido", "Higiene personal", "Alimentación funcional", "Organización de pertenencias"],
  "autorregulación": ["Autorregulación sensorial", "Secuencias cotidianas", "Adaptaciones sensoriales"],
  "praxias": ["Secuenciación motora", "Planificación de tareas", "Adaptación de estrategias"],
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
