export interface DiagnosisOption {
  value: string;
  label: string;
}

export const DIAGNOSES: DiagnosisOption[] = [
  { value: "TEL",                         label: "TEL — Trastorno Específico del Lenguaje" },
  { value: "TDL",                         label: "TDL — Trastorno del Desarrollo del Lenguaje" },
  { value: "TEA",                         label: "TEA — Trastorno del Espectro Autista" },
  { value: "TDAH",                        label: "TDAH" },
  { value: "TSH",                         label: "TSH — Trastorno de los sonidos del habla" },
  { value: "Trastorno fonológico",        label: "Trastorno fonológico" },
  { value: "Apraxia del habla",           label: "Apraxia del habla" },
  { value: "Disartria",                   label: "Disartria" },
  { value: "Tartamudez",                  label: "Tartamudez / Disfluencia" },
  { value: "Dislexia",                    label: "Dislexia" },
  { value: "Disgrafía",                   label: "Disgrafía" },
  { value: "Discalculia",                 label: "Discalculia" },
  { value: "Retraso del lenguaje",        label: "Retraso del lenguaje" },
  { value: "Retraso madurativo",          label: "Retraso madurativo / del desarrollo" },
  { value: "Deglución atípica",           label: "Deglución atípica" },
  { value: "Voz",                         label: "Trastorno de voz (disfonía, nódulos…)" },
  { value: "Dificultades de aprendizaje", label: "Dificultades de aprendizaje" },
  { value: "Dificultades atencionales",   label: "Dificultades atencionales" },
  { value: "Atención",                    label: "Dificultades de atención" },
  { value: "Comprensión lectora",         label: "Dificultades de comprensión lectora" },
  { value: "Producción escrita",          label: "Dificultades de producción escrita" },
  { value: "Funciones ejecutivas",        label: "Dificultades en funciones ejecutivas" },
  { value: "Memoria",                     label: "Dificultades de memoria" },
  { value: "Matemática",                  label: "Dificultades en matemática" },
  { value: "Estrategias de aprendizaje",  label: "Dificultades en estrategias de aprendizaje" },
];

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

export function getDiagnosisLabel(value: string): string {
  if (value === "Dislalia") return "TSH — Trastorno de los sonidos del habla";
  if (value === "TSH")      return "TSH — Trastorno de los sonidos del habla";
  return DIAGNOSES.find(d => d.value === value)?.label ?? value;
}
