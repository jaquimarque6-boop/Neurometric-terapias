import { db } from "@workspace/db";
import { goalLibraryTable } from "@workspace/db/schema";
import { inArray } from "drizzle-orm";

const SEED_GOALS = [
  // ── LENGUAJE · Comprensión ──────────────────────────────────────────────────
  {
    idObjetivo: "NL-COMP-B-01",
    nombreObjetivo: "Comprender órdenes simples de 1 paso",
    modulo: "Lenguaje",
    area: "lenguaje",
    areaClinica: "lenguaje",
    subarea: "Comprensión",
    nivelDificultad: "básico",
    estadoBanco: "activo",
    definicionOperativa:
      "El paciente sigue instrucciones de una sola acción sin apoyo gestual o visual adicional, en al menos el 70% de los intentos.",
    indicadorTipo: "porcentaje de respuestas correctas",
    metaPorcentaje: "70%",
    intentosSugeridos: "10",
    recomendacionClinica:
      "Presentar instrucciones en voz pausada. Variar el vocabulario paulatinamente. Registrar respuestas con y sin contexto.",
    habilidadesRelacionadas: "atención, comprensión auditiva, memoria a corto plazo",
  },
  {
    idObjetivo: "NL-COMP-B-02",
    nombreObjetivo: "Comprender órdenes de 2 pasos",
    modulo: "Lenguaje",
    area: "lenguaje",
    areaClinica: "lenguaje",
    subarea: "Comprensión",
    nivelDificultad: "básico",
    estadoBanco: "activo",
    definicionOperativa:
      "El paciente ejecuta correctamente dos acciones secuenciales incluidas en una sola instrucción, en al menos el 70% de los intentos.",
    indicadorTipo: "porcentaje de respuestas correctas",
    metaPorcentaje: "70%",
    intentosSugeridos: "10",
    recomendacionClinica:
      "Iniciar con acciones cotidianas. Aumentar la distancia entre los dos pasos progresivamente. Evitar apoyos gestuales inicialmente.",
    habilidadesRelacionadas: "memoria de trabajo, secuenciación, atención sostenida",
  },
  {
    idObjetivo: "NL-COMP-B-03",
    nombreObjetivo: "Responder preguntas básicas (qué, quién)",
    modulo: "Lenguaje",
    area: "lenguaje",
    areaClinica: "lenguaje",
    subarea: "Comprensión",
    nivelDificultad: "básico",
    estadoBanco: "activo",
    definicionOperativa:
      "El paciente responde de forma pertinente a preguntas tipo 'qué' y 'quién' sobre imágenes o situaciones familiares, en al menos el 70% de los intentos.",
    indicadorTipo: "porcentaje de respuestas correctas",
    metaPorcentaje: "70%",
    intentosSugeridos: "10",
    recomendacionClinica:
      "Usar láminas de alta frecuencia. Modelar respuestas cuando el paciente no responde. Registrar tipo de error (sin respuesta, respuesta incorrecta, aproximación).",
    habilidadesRelacionadas: "comprensión de interrogativas, vocabulario receptivo",
  },
  {
    idObjetivo: "NL-COMP-I-01",
    nombreObjetivo: "Identificar absurdos verbales simples",
    modulo: "Lenguaje",
    area: "lenguaje",
    areaClinica: "lenguaje",
    subarea: "Comprensión",
    nivelDificultad: "intermedio",
    estadoBanco: "activo",
    definicionOperativa:
      "El paciente identifica y explica por qué una oración o situación es absurda, en al menos el 75% de los ítems presentados.",
    indicadorTipo: "porcentaje de respuestas correctas",
    metaPorcentaje: "75%",
    intentosSugeridos: "10",
    recomendacionClinica:
      "Comenzar con absurdos visuales antes de los verbales. Pedir que el paciente corrija el absurdo. Graduarte hacia situaciones más abstractas.",
    habilidadesRelacionadas: "razonamiento verbal, comprensión semántica, metalenguaje",
  },
  {
    idObjetivo: "NL-COMP-I-02",
    nombreObjetivo: "Comprender relaciones causa-efecto simples",
    modulo: "Lenguaje",
    area: "lenguaje",
    areaClinica: "lenguaje",
    subarea: "Comprensión",
    nivelDificultad: "intermedio",
    estadoBanco: "activo",
    definicionOperativa:
      "El paciente identifica la causa o el efecto de un evento presentado verbalmente o mediante imagen, en al menos el 75% de los intentos.",
    indicadorTipo: "porcentaje de respuestas correctas",
    metaPorcentaje: "75%",
    intentosSugeridos: "10",
    recomendacionClinica:
      "Usar secuencias de 2 imágenes. Presentar conectores causales ('porque', 'entonces'). Trabajar con situaciones de la vida cotidiana del paciente.",
    habilidadesRelacionadas: "razonamiento inferencial, comprensión narrativa, conectores",
  },
  // ── LENGUAJE · Léxico y Semántica ──────────────────────────────────────────
  {
    idObjetivo: "NL-LEX-B-01",
    nombreObjetivo: "Ampliar vocabulario de objetos cotidianos",
    modulo: "Lenguaje",
    area: "lenguaje",
    areaClinica: "lenguaje",
    subarea: "Léxico y Semántica",
    nivelDificultad: "básico",
    estadoBanco: "activo",
    definicionOperativa:
      "El paciente nombra correctamente objetos de uso frecuente en categorías (hogar, ropa, comida, escuela), alcanzando al menos el 70% de aciertos.",
    indicadorTipo: "porcentaje de respuestas correctas",
    metaPorcentaje: "70%",
    intentosSugeridos: "10",
    recomendacionClinica:
      "Introducir palabras en contexto funcional. Reforzar con objetos reales. Expandir con atributos (color, forma, uso) una vez logrado el nombre.",
    habilidadesRelacionadas: "vocabulario expresivo, denominación, memoria semántica",
  },
  {
    idObjetivo: "NL-LEX-B-02",
    nombreObjetivo: "Nombrar acciones frecuentes",
    modulo: "Lenguaje",
    area: "lenguaje",
    areaClinica: "lenguaje",
    subarea: "Léxico y Semántica",
    nivelDificultad: "básico",
    estadoBanco: "activo",
    definicionOperativa:
      "El paciente evoca verbos de alta frecuencia (comer, correr, dormir, jugar) al observar imágenes de acción, en al menos el 70% de los intentos.",
    indicadorTipo: "porcentaje de respuestas correctas",
    metaPorcentaje: "70%",
    intentosSugeridos: "10",
    recomendacionClinica:
      "Usar láminas con escenas dinámicas. Modelar la acción físicamente. Combinar con rutinas de la sesión (muéstrame cómo saltas).",
    habilidadesRelacionadas: "vocabulario de acción, expresión verbal, semántica verbal",
  },
  {
    idObjetivo: "NL-LEX-I-01",
    nombreObjetivo: "Clasificar palabras por categorías semánticas",
    modulo: "Lenguaje",
    area: "lenguaje",
    areaClinica: "lenguaje",
    subarea: "Léxico y Semántica",
    nivelDificultad: "intermedio",
    estadoBanco: "activo",
    definicionOperativa:
      "El paciente agrupa correctamente palabras o imágenes en categorías semánticas (animales, frutas, muebles, vehículos), en al menos el 75% de los ensayos.",
    indicadorTipo: "porcentaje de respuestas correctas",
    metaPorcentaje: "75%",
    intentosSugeridos: "10",
    recomendacionClinica:
      "Iniciar con categorías básicas y contrasting (animal vs. objeto). Aumentar número de categorías. Incluir ítems atípicos para evaluar flexibilidad semántica.",
    habilidadesRelacionadas: "organización semántica, vocabulario receptivo, razonamiento categorial",
  },
  {
    idObjetivo: "NL-LEX-I-02",
    nombreObjetivo: "Evocar palabras a partir de una categoría",
    modulo: "Lenguaje",
    area: "lenguaje",
    areaClinica: "lenguaje",
    subarea: "Léxico y Semántica",
    nivelDificultad: "intermedio",
    estadoBanco: "activo",
    definicionOperativa:
      "El paciente produce al menos 5 palabras pertenecientes a una categoría dada en 60 segundos (fluidez verbal semántica), en al menos el 75% de los ensayos.",
    indicadorTipo: "porcentaje de respuestas correctas",
    metaPorcentaje: "75%",
    intentosSugeridos: "10",
    recomendacionClinica:
      "Usar categorías de alta familiaridad primero (animales, frutas). Cronometrar y registrar número y variedad de respuestas. Evitar repetir la misma palabra como correcta.",
    habilidadesRelacionadas: "fluidez verbal, recuperación léxica, memoria semántica",
  },
  {
    idObjetivo: "NL-LEX-I-03",
    nombreObjetivo: "Describir objetos por atributos (color, tamaño, función)",
    modulo: "Lenguaje",
    area: "lenguaje",
    areaClinica: "lenguaje",
    subarea: "Léxico y Semántica",
    nivelDificultad: "intermedio",
    estadoBanco: "activo",
    definicionOperativa:
      "El paciente describe un objeto o imagen incluyendo al menos 3 atributos (nombre, función, color/tamaño o pertenencia a categoría), en al menos el 75% de los intentos.",
    indicadorTipo: "porcentaje de respuestas correctas",
    metaPorcentaje: "75%",
    intentosSugeridos: "10",
    recomendacionClinica:
      "Modelar descripciones completas primero. Usar apoyo visual (tabla de atributos). Registrar cuántos atributos incluye espontáneamente vs. con pistas.",
    habilidadesRelacionadas: "elaboración semántica, vocabulario de atributos, expresión verbal organizada",
  },
] as const;

export async function seedGoalLibraryIfNeeded(): Promise<void> {
  const ids = SEED_GOALS.map(g => g.idObjetivo);

  const existing = await db
    .select({ idObjetivo: goalLibraryTable.idObjetivo })
    .from(goalLibraryTable)
    .where(inArray(goalLibraryTable.idObjetivo, ids));

  const existingIds = new Set(existing.map(r => r.idObjetivo));
  const toInsert = (SEED_GOALS as any[]).filter(g => !existingIds.has(g.idObjetivo));

  if (toInsert.length === 0) {
    console.log(`[seed] Goal library: all ${ids.length} seed goals already present.`);
    return;
  }

  await db.insert(goalLibraryTable).values(toInsert);
  console.log(`[seed] Goal library: inserted ${toInsert.length} goals (${toInsert.map((g: any) => g.idObjetivo).join(", ")}).`);
}
