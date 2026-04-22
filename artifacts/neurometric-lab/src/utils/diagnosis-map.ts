export interface DiagnosisOption {
  value: string;
  label: string;
}

export const DIAGNOSES: DiagnosisOption[] = [
  { value: "TEL",                  label: "TEL – Trastorno Específico del Lenguaje" },
  { value: "TDL",                  label: "TDL – Trastorno del Desarrollo del Lenguaje" },
  { value: "TEA",                  label: "TEA – Trastorno del Espectro Autista" },
  { value: "TDAH",                 label: "TDAH" },
  { value: "Dislalia",             label: "TSH (Trastornos de los sonidos del habla)" },
  { value: "Trastorno fonológico", label: "Trastorno fonológico" },
  { value: "Apraxia del habla",    label: "Apraxia del habla" },
  { value: "Disartria",            label: "Disartria" },
  { value: "Tartamudez",           label: "Tartamudez / Disfluencia" },
  { value: "Dislexia",             label: "Dislexia" },
  { value: "Retraso del lenguaje", label: "Retraso del lenguaje" },
  { value: "Retraso madurativo",   label: "Retraso madurativo / del desarrollo" },
  { value: "Deglución atípica",    label: "Deglución atípica" },
  { value: "Voz",                  label: "Trastorno de voz (disfonía, nódulos…)" },
];

export const DIAGNOSIS_AREAS: Record<string, string[]> = {
  "TEL":                  ["lenguaje", "habla"],
  "TDL":                  ["lenguaje", "pragmática"],
  "TEA":                  ["pragmática", "cognición"],
  "TDAH":                 ["cognición", "pragmática"],
  "Dislalia":             ["habla", "motricidad oral"],
  "Trastorno fonológico": ["habla"],
  "Apraxia del habla":    ["habla", "motricidad oral"],
  "Disartria":            ["habla", "motricidad oral"],
  "Tartamudez":           ["habla"],
  "Dislexia":             ["lectoescritura"],
  "Retraso del lenguaje": ["lenguaje", "estimulación temprana"],
  "Retraso madurativo":   ["estimulación temprana", "cognición"],
  "Deglución atípica":    ["motricidad oral"],
  "Voz":                  ["voz"],
};

export function getDiagnosisLabel(value: string): string {
  if (value === "Dislalia") return "TSH (Trastornos de los sonidos del habla)";
  return DIAGNOSES.find(d => d.value === value)?.label ?? value;
}
