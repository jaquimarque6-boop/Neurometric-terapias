export type DiagnosisCategory =
  | "Lenguaje"
  | "Habla y fluidez"
  | "Voz"
  | "Deglución"
  | "Audición"
  | "Neurodesarrollo"
  | "Aprendizaje"
  | "Cognición"
  | "Sensorial y motriz"
  | "Otros";

export interface DiagnosisOption {
  value: string;
  label: string;
  category: DiagnosisCategory;
}

// Orden de presentación de las categorías en el selector.
export const CATEGORY_ORDER: DiagnosisCategory[] = [
  "Lenguaje",
  "Habla y fluidez",
  "Voz",
  "Deglución",
  "Audición",
  "Neurodesarrollo",
  "Aprendizaje",
  "Cognición",
  "Sensorial y motriz",
  "Otros",
];

// ── Banco maestro de diagnósticos ─────────────────────────────────────────────
// Fuente única de etiquetas y categorías. Las listas por profesión
// (profession-map.ts) son subconjuntos de este banco.
export const DIAGNOSES: DiagnosisOption[] = [
  // ── Lenguaje ────────────────────────────────────────────────────────────────
  { value: "TEL",                          label: "TEL — Trastorno Específico del Lenguaje",   category: "Lenguaje" },
  { value: "TDL",                          label: "TDL — Trastorno del Desarrollo del Lenguaje", category: "Lenguaje" },
  { value: "Retraso del lenguaje",         label: "Retraso del lenguaje",                       category: "Lenguaje" },
  { value: "Retraso madurativo",           label: "Retraso madurativo / del desarrollo",        category: "Lenguaje" },
  { value: "Afasia",                       label: "Afasia",                                     category: "Lenguaje" },

  // ── Habla y fluidez ───────────────────────────────────────────────────────────
  { value: "TSH",                          label: "TSH — Trastorno de los sonidos del habla",   category: "Habla y fluidez" },
  { value: "Trastorno fonológico",         label: "Trastorno fonológico",                       category: "Habla y fluidez" },
  { value: "Apraxia del habla",            label: "Apraxia del habla",                          category: "Habla y fluidez" },
  { value: "Disartria",                    label: "Disartria",                                  category: "Habla y fluidez" },
  { value: "Tartamudez",                   label: "Tartamudez / Disfluencia",                   category: "Habla y fluidez" },

  // ── Voz ───────────────────────────────────────────────────────────────────────
  { value: "Voz",                          label: "Trastorno de voz (disfonía, nódulos…)",      category: "Voz" },
  { value: "Disfonía",                     label: "Disfonía",                                   category: "Voz" },

  // ── Deglución ─────────────────────────────────────────────────────────────────
  { value: "Deglución atípica",            label: "Deglución atípica",                          category: "Deglución" },
  { value: "Disfagia",                     label: "Disfagia",                                   category: "Deglución" },

  // ── Audición ──────────────────────────────────────────────────────────────────
  { value: "Hipoacusia",                   label: "Hipoacusia",                                 category: "Audición" },
  { value: "Implante coclear",             label: "Implante coclear",                           category: "Audición" },

  // ── Neurodesarrollo ───────────────────────────────────────────────────────────
  { value: "TEA",                          label: "TEA — Trastorno del Espectro Autista",       category: "Neurodesarrollo" },
  { value: "TDAH",                         label: "TDAH",                                       category: "Neurodesarrollo" },
  { value: "Discapacidad intelectual",     label: "Discapacidad intelectual",                   category: "Neurodesarrollo" },
  { value: "TDC",                          label: "TDC — Trastorno del Desarrollo de la Coordinación", category: "Neurodesarrollo" },
  { value: "Parálisis cerebral",           label: "Parálisis cerebral",                         category: "Neurodesarrollo" },
  { value: "Hipotonía",                    label: "Hipotonía / alteración del tono",            category: "Neurodesarrollo" },

  // ── Aprendizaje ───────────────────────────────────────────────────────────────
  { value: "Dificultades de aprendizaje",  label: "Dificultades de aprendizaje",                category: "Aprendizaje" },
  { value: "Trastorno específico del aprendizaje", label: "Trastorno específico del aprendizaje", category: "Aprendizaje" },
  { value: "Dislexia",                     label: "Dislexia",                                   category: "Aprendizaje" },
  { value: "Disgrafía",                    label: "Disgrafía",                                  category: "Aprendizaje" },
  { value: "Discalculia",                  label: "Discalculia",                                category: "Aprendizaje" },
  { value: "Comprensión lectora",          label: "Dificultades de comprensión lectora",        category: "Aprendizaje" },
  { value: "Producción escrita",           label: "Dificultades de producción escrita",         category: "Aprendizaje" },
  { value: "Escritura",                    label: "Escritura",                                  category: "Aprendizaje" },
  { value: "Matemática",                   label: "Dificultades en matemática",                 category: "Aprendizaje" },

  // ── Cognición ─────────────────────────────────────────────────────────────────
  { value: "Atención",                     label: "Dificultades de atención",                   category: "Cognición" },
  { value: "Dificultades atencionales",    label: "Dificultades atencionales",                  category: "Cognición" },
  { value: "Funciones ejecutivas",         label: "Dificultades en funciones ejecutivas",       category: "Cognición" },
  { value: "Memoria",                      label: "Dificultades de memoria",                    category: "Cognición" },
  { value: "Estrategias de aprendizaje",   label: "Dificultades en estrategias de aprendizaje", category: "Cognición" },

  // ── Sensorial y motriz ────────────────────────────────────────────────────────
  { value: "TPS",                          label: "TPS — Trastorno del Procesamiento Sensorial", category: "Sensorial y motriz" },
  { value: "Integración sensorial",        label: "Integración sensorial",                      category: "Sensorial y motriz" },
  { value: "Hiperreactividad sensorial",   label: "Hiperreactividad / defensividad sensorial",  category: "Sensorial y motriz" },
  { value: "Hiporreactividad sensorial",   label: "Hiporreactividad / búsqueda sensorial",      category: "Sensorial y motriz" },
  { value: "Dispraxia",                    label: "Dispraxia / dificultades práxicas",          category: "Sensorial y motriz" },
  { value: "Dificultades motricidad fina", label: "Dificultades en motricidad fina",            category: "Sensorial y motriz" },
  { value: "Dificultades motricidad gruesa", label: "Dificultades en motricidad gruesa",        category: "Sensorial y motriz" },
  { value: "Dificultades grafomotoras",    label: "Dificultades grafomotoras",                  category: "Sensorial y motriz" },
  { value: "Dificultades en AVD",          label: "Dificultades en actividades de la vida diaria (AVD)", category: "Sensorial y motriz" },
  { value: "Dificultades de autorregulación", label: "Dificultades de autorregulación",         category: "Sensorial y motriz" },

  // ── Otros ─────────────────────────────────────────────────────────────────────
  { value: "Pragmática",                   label: "Pragmática / habilidades sociales",          category: "Otros" },
  { value: "Comunicación aumentativa",     label: "Comunicación aumentativa y alternativa (CAA)", category: "Otros" },
];

const DIAGNOSIS_BY_VALUE: Record<string, DiagnosisOption> = Object.fromEntries(
  DIAGNOSES.map(d => [d.value, d]),
);

export function getDiagnosisOptions(values: string[]): DiagnosisOption[] {
  return values
    .map(v => DIAGNOSIS_BY_VALUE[v])
    .filter((d): d is DiagnosisOption => Boolean(d));
}

export const DIAGNOSIS_AREAS: Record<string, string[]> = {
  // ── Fonoaudiología — lenguaje ────────────────────────────────────────────────
  "TEL":                         ["lenguaje", "habla"],
  "TDL":                         ["lenguaje", "pragmática"],
  "Retraso del lenguaje":        ["lenguaje", "estimulación temprana"],
  "Retraso madurativo":          ["estimulación temprana", "cognición"],

  // ── Fonoaudiología — habla / motricidad ─────────────────────────────────────
  "TSH":                         ["habla", "motricidad oral"],
  "Dislalia":                    ["habla", "motricidad oral"],   // alias histórico de TSH
  "Trastorno fonológico":        ["habla"],
  "Apraxia del habla":           ["habla", "motricidad oral"],
  "Disartria":                   ["habla", "motricidad oral"],
  "Tartamudez":                  ["habla"],

  // ── Fonoaudiología — otras áreas ────────────────────────────────────────────
  "Deglución atípica":           ["motricidad oral"],
  "Voz":                         ["voz"],

  // ── Transversal (fono + psicopedagogía) ─────────────────────────────────────
  "TEA":                         ["pragmática", "cognición"],
  "TDAH":                        ["cognición", "pragmática"],

  // ── Psicopedagogía — lectoescritura específica ──────────────────────────────
  "Dislexia":                    ["lectoescritura"],
  "Disgrafía":                   ["disgrafía"],
  "Discalculia":                 ["matemáticas"],
  "Comprensión lectora":         ["comprensión lectora"],
  "Producción escrita":          ["producción escrita"],
  "Matemática":                  ["matemáticas"],
  "Dificultades de aprendizaje": ["lectoescritura", "cognición"],

  // ── Psicopedagogía — cognición específica ───────────────────────────────────
  "Dificultades atencionales":   ["cognición"],
  "Atención":                    ["cognición"],
  "Funciones ejecutivas":        ["funciones ejecutivas"],
  "Memoria":                     ["memoria"],
  "Estrategias de aprendizaje":  ["estrategias de aprendizaje"],
};

// ── Helpers para diagnóstico único o múltiple (lista separada por comas) ───────
// Compatible hacia atrás: un único diagnóstico se guarda/lee igual que antes.
export function parseDiagnoses(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

export function serializeDiagnoses(values: string[]): string {
  const seen = new Set<string>();
  const unique = values.map(v => v.trim()).filter(v => {
    if (!v || seen.has(v)) return false;
    seen.add(v);
    return true;
  });
  return unique.join(", ");
}

function getSingleLabel(value: string): string {
  const v = value.trim();
  if (v === "Dislalia") return "TSH — Trastorno de los sonidos del habla";
  return DIAGNOSIS_BY_VALUE[v]?.label ?? v;
}

// Acepta valor único o lista por comas y devuelve etiquetas legibles.
export function getDiagnosisLabel(value: string | null | undefined): string {
  const list = parseDiagnoses(value);
  if (list.length === 0) return value?.trim() ?? "";
  return list.map(getSingleLabel).join(", ");
}
