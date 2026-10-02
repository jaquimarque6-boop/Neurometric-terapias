export type ClinicalDiscipline =
  | "fonoaudiología"
  | "psicopedagogía"
  | "terapia_ocupacional"
  | "general";

function normalize(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const OCCUPATIONAL_AREA_PATTERN =
  /autonomi|avd|sensori|motricidad|ocup|participac|rutina|habito|juego|planific|organiz|entorno|visomotor|grafomotor|destreza|regulacion|praxia|actividad(?:es)? de la vida diaria/;

export function detectClinicalDiscipline(
  specialty: string,
  goalAreas: string[],
): ClinicalDiscipline {
  const normalizedSpecialty = normalize(specialty);
  if (/fono|fonoaudio|speech|lenguaje|habla|voz|degluc/.test(normalizedSpecialty)) {
    return "fonoaudiología";
  }
  if (/psicoped|aprendiz|cognitiv|educati|neuropsico/.test(normalizedSpecialty)) {
    return "psicopedagogía";
  }
  if (/ocup|terapia.?ocup|^to$|avd|sensori|ergot/.test(normalizedSpecialty)) {
    return "terapia_ocupacional";
  }

  const normalizedAreas = normalize(goalAreas.join(" "));
  if (/lenguaje|habla|fonolog|articulac|pragmat|comunicac|voz|degluc/.test(normalizedAreas)) {
    return "fonoaudiología";
  }
  if (/atenci|memoria|ejecutiv|lectoescrit|comprens|aprendiz|cognic/.test(normalizedAreas)) {
    return "psicopedagogía";
  }
  if (OCCUPATIONAL_AREA_PATTERN.test(normalizedAreas)) {
    return "terapia_ocupacional";
  }

  return "general";
}