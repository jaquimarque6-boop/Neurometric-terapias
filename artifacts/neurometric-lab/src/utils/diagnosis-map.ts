export interface DiagnosisOption {
  value: string;
  label: string;
}

export const DIAGNOSES: DiagnosisOption[] = [
  { value: "TEL",                         label: "TEL – Trastorno Específico del Lenguaje" },
  { value: "TDL",                         label: "TDL – Trastorno del Desarrollo del Lenguaje" },
  { value: "TEA",                         label: "TEA – Trastorno del Espectro Autista" },
  { value: "TDAH",                        label: "TDAH" },
  { value: "TSH",                         label: "TSH – Trastorno de los sonidos del habla" },
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
  { value: "Comprensión lectora",         label: "Problemas de comprensión lectora" },
  { value: "Funciones ejecutivas",        label: "Dificultades en funciones ejecutivas" },
];

export const DIAGNOSIS_AREAS: Record<string, string[]> = {
  "TEL":                         ["lenguaje", "habla"],
  "TDL":                         ["lenguaje", "pragmática"],
  "TEA":                         ["pragmática", "cognición"],
  "TDAH":                        ["cognición", "pragmática"],
  "TSH":                         ["habla", "motricidad oral"],
  "Dislalia":                    ["habla", "motricidad oral"],
  "Trastorno fonológico":        ["habla"],
  "Apraxia del habla":           ["habla", "motricidad oral"],
  "Disartria":                   ["habla", "motricidad oral"],
  "Tartamudez":                  ["habla"],
  "Dislexia":                    ["lectoescritura"],
  "Disgrafía":                   ["lectoescritura"],
  "Discalculia":                 ["cognición"],
  "Retraso del lenguaje":        ["lenguaje", "estimulación temprana"],
  "Retraso madurativo":          ["estimulación temprana", "cognición"],
  "Deglución atípica":           ["motricidad oral"],
  "Voz":                         ["voz"],
  "Dificultades de aprendizaje": ["lectoescritura", "cognición"],
  "Dificultades atencionales":   ["cognición"],
  "Comprensión lectora":         ["lectoescritura"],
  "Funciones ejecutivas":        ["cognición"],
};

export function getDiagnosisLabel(value: string): string {
  if (value === "Dislalia") return "TSH — Trastorno de los sonidos del habla";
  if (value === "TSH")      return "TSH — Trastorno de los sonidos del habla";
  return DIAGNOSES.find(d => d.value === value)?.label ?? value;
}
