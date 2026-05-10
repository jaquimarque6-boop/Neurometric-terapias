/**
 * 3-Level taxonomy for the Banco de Objetivos
 *
 * Structure:
 *   Level 1: área clínica  (area_clinica in DB)
 *   Level 2: subárea grupo  (derived — groups of subareas)
 *   Level 3: subcategoría   (subarea in DB)
 *
 * Goals whose subarea isn't listed here fall into "Otras" for their grupo.
 */

export type Taxonomy = Record<string, Record<string, string[]>>;

export const TAXONOMY: Taxonomy = {
  lenguaje: {
    "Comprensión": [
      "Comprensión",
      "Comprensión inferencial",
      "Inferencias",
      "Inferencias pragmáticas",
    ],
    "Expresión": [
      "Lenguaje expresivo",
      "Expresión oral",
    ],
    "Vocabulario y Semántica": [
      "Vocabulario",
      "Léxico",
      "Léxico académico",
      "Léxico descriptivo",
      "Léxico verbal",
      "Semántica",
      "Semántica avanzada",
      "Semántica relacional",
      "Categorías semánticas",
      "Relaciones léxicas",
      "Relaciones semánticas",
    ],
    "Gramática": [
      "Gramática",
      "Morfosintaxis",
      "Morfología",
      "Morfología gramatical",
      "Morfología verbal",
      "Sintaxis compleja",
      "Conectores",
    ],
    "Discurso y Narrativa": [
      "Narrativo",
      "Narrativo avanzado",
      "Narrativo personal",
      "Discurso expositivo",
      "Discurso oral",
    ],
    "Pragmática Lingüística": [
      "Pragmática lingüística",
    ],
  },

  cognición: {
    "Atención": [
      "Atención",
      "Atención sostenida",
      "Atención dividida",
      "Atención selectiva",
      "Atención alternante",
      "Metacognición atencional",
    ],
    "Memoria": [
      "Memoria",
      "Memoria de trabajo",
      "Memoria auditiva de trabajo",
      "Memoria episódica",
      "Memoria visual",
      "Memoria a largo plazo",
      "Estrategias mnemónicas",
      "Estrategias de memoria",
    ],
    "Razonamiento": [
      "Razonamiento",
      "Resolución de problemas",
      "Razonamiento lógico",
      "Razonamiento hipotético",
      "Razonamiento inductivo",
      "Razonamiento causal",
      "Razonamiento abstracto",
      "Razonamiento comparativo",
    ],
    "Funciones Ejecutivas": [
      "Control inhibitorio",
      "Flexibilidad cognitiva",
      "Planificación",
      "Monitoreo ejecutivo",
      "Funciones ejecutivas",
    ],
    "Categorización": [
      "Categorización",
      "Categorización semántica",
    ],
    "Estrategias de aprendizaje": [
      "Estrategias de aprendizaje",
      "Estrategias de estudio",
      "Metacognición",
      "Autorregulación del aprendizaje",
      "Estrategias mnemónicas",
      "Estrategias de memoria",
      "Organización del aprendizaje",
    ],
  },

  "funciones ejecutivas": {
    "Control e Inhibición": [
      "Control de impulsos",
      "Autorregulación",
    ],
    "Planificación": [
      "Planificación",
    ],
    "Organización": [
      "Organización",
    ],
  },

  "comunicación social": {
    "Emociones": [
      "Reconocimiento emocional",
    ],
    "Habilidades Conversacionales": [
      "Habilidades conversacionales",
      "Turnos conversacionales",
    ],
    "Cognición Social": [
      "Inferencia social",
    ],
  },

  habla: {
    "Articulación": [
      "Articulación",
      "Generalización articulatoria",
      "Sílabas complejas",
      "Imitación fonética",
      "Inteligibilidad",
      "Discriminación y producción",
    ],
    "Fonología": [
      "Procesos fonológicos",
      "Discriminación auditiva",
      "Discriminación fonémica",
    ],
    "Fluidez": [
      "Fluidez",
      "Fluidez generalizada",
    ],
    "Prosodia y Ritmo": [
      "Prosodia",
      "Prosodia expresiva",
      "Prosodia léxica",
      "Velocidad y ritmo",
    ],
  },

  pragmática: {
    "Comunicación": [
      "Petición",
      "Funciones comunicativas",
      "Comunicación gestual",
      "Comunicación intencional",
      "Comunicación no verbal",
      "Función interrogativa",
      "Actos de habla indirectos",
      "Atención conjunta",
    ],
    "Conversación": [
      "Habilidades conversacionales",
      "Reparación conversacional",
      "Turnos comunicativos",
      "Discusión grupal",
      "Conversación",
      "Gestión del tópico",
      "Mantenimiento del tópico",
    ],
    "Registro Social": [
      "Cortesía lingüística",
      "Adaptación comunicativa",
      "Adaptación discursiva",
      "Registro lingüístico",
      "Perspectiva del oyente",
      "Narrativa social",
    ],
    "Lenguaje no Literal": [
      "Lenguaje no literal",
    ],
  },

  "motricidad orofacial": {
    "Tono Muscular": [
      "Tono muscular facial",
      "Tono muscular",
      "Tono muscular labial",
      "Tono muscular lingual",
    ],
    "Praxis": [
      "Praxis linguales",
      "Praxis",
      "Praxis labiales",
      "Secuencias praxicas",
      "Diadococinesia",
    ],
    "Deglución": [
      "Deglución",
      "Deglución atípica",
      "Postura deglutoria",
      "Generalización deglutoria",
    ],
    "Respiración": [
      "Respiración",
      "Respiración nasal",
      "Coordinación fono-respiratoria",
      "Soporte respiratorio oral",
    ],
    "Masticación y Hábitos": [
      "Hábitos orales nocivos",
      "Masticación",
      "Musculatura velar",
    ],
  },

  "estimulación temprana": {
    "Comunicación y Lenguaje": [
      "Comunicación preverbal",
      "Primeras palabras",
      "Comprensión léxica temprana",
      "Comprensión de preguntas",
    ],
    "Atención e Imitación": [
      "Atención conjunta",
      "Seguimiento de mirada",
      "Atención conjunta triádica",
      "Imitación",
      "Imitación de acciones",
      "Imitación gestual",
    ],
    "Juego": [
      "Juego funcional",
      "Juego de roles",
      "Juego simbólico",
      "Juego",
    ],
    "Vínculo y Sensorial": [
      "Vínculo de apego",
      "Vínculo e interacción",
      "Integración sensorial",
      "Procesamiento sensorial",
    ],
  },

  lectoescritura: {
    "Conciencia Fonológica": [
      "Conciencia fonológica",
      "Conciencia fonémica",
      "Conciencia fonémica avanzada",
      "Conciencia silábica",
      "Segmentación fonémica",
    ],
    "Lectura": [
      "Lectura",
      "Lectura de palabras",
      "Fluidez lectora",
      "Comprensión lectora",
      "Comprensión inferencial",
      "Conocimiento alfabético",
    ],
    "Comprensión lectora": [
      "Comprensión lectora",
      "Comprensión inferencial",
      "Comprensión literal",
      "Idea principal",
      "Secuencia narrativa",
      "Discriminación de información",
    ],
    "Escritura": [
      "Escritura",
      "Escritura de oraciones",
      "Escritura copiada",
      "Escritura al dictado",
      "Producción textual",
      "Ortografía y puntuación",
    ],
    "Producción escrita": [
      "Producción escrita",
      "Producción textual",
      "Escritura de oraciones",
      "Organización del texto",
      "Ortografía y puntuación",
      "Legibilidad",
    ],
    "Matemática": [
      "Matemática",
      "Cálculo",
      "Número y cantidad",
      "Resolución de problemas matemáticos",
      "Patrones numéricos",
      "Organización numérica",
    ],
  },
};

/** Returns the subárea grupo (level 2) for a given area + subarea combination. */
export function getGrupo(areaClinica: string | null, subarea: string | null): string {
  if (!areaClinica) return "Otras";
  const areaMap = TAXONOMY[areaClinica] ?? {};
  if (!subarea) return "Otras";
  for (const [grupo, subareas] of Object.entries(areaMap)) {
    if (subareas.includes(subarea)) return grupo;
  }
  return "Otras";
}

/** Returns ordered list of subárea grupos for a given área. */
export function getGrupos(areaClinica: string): string[] {
  const groups = Object.keys(TAXONOMY[areaClinica] ?? {});
  return groups;
}

/** Returns all subcategorías (subareas) belonging to a grupo within an área. */
export function getSubareas(areaClinica: string, grupo: string): string[] {
  return TAXONOMY[areaClinica]?.[grupo] ?? [];
}
