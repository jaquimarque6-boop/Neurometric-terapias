/**
 * Structured psychopedagogy activity bank.
 *
 * Source: spec Pasted-Add-a-structured-psychopedagogy-objective-and-activity-_1777936059551.txt
 *
 * Each activity is self-contained and session-ready.
 * Fields:
 *   nombre       — display name
 *   area         — clinical area (matches TAXONOMY area labels)
 *   objetivo     — therapeutic objective addressed
 *   materiales   — required materials
 *   procedimiento — step-by-step procedure
 *   varianteSimple   — simplified version for lower performance
 *   varianteCompleja — advanced version for higher performance
 */

export interface PsicopedActivity {
  id: string;
  nombre: string;
  area: string;
  objetivo: string;
  materiales: string[];
  procedimiento: string[];
  varianteSimple: string;
  varianteCompleja: string;
}

export const PSICOPED_ACTIVITY_BANK: PsicopedActivity[] = [
  {
    id: "act-pp-01",
    nombre: "Detectives del texto",
    area: "Comprensión lectora",
    objetivo: "Identificar la idea principal en textos breves",
    materiales: [
      "Texto breve impreso o proyectado (2–5 oraciones)",
      "Lápiz o marcador",
      "Ficha de registro de respuestas",
    ],
    procedimiento: [
      "Presentar el texto al paciente y leerlo juntos en voz alta.",
      "El terapeuta explica: 'Vamos a ser detectives y a encontrar la idea más importante del texto'.",
      "El paciente relee en silencio y subraya o señala la oración que considera más importante.",
      "El paciente explica con sus propias palabras por qué eligió esa oración.",
      "El terapeuta proporciona retroalimentación y juntos confirman o ajustan la selección.",
      "Registrar: ¿subrayó la idea principal?, ¿pudo justificar su elección?",
    ],
    varianteSimple: "Ofrecer dos opciones concretas y pedir al paciente que elija cuál es la idea principal señalando con el dedo.",
    varianteCompleja: "Pedir al paciente que justifique su respuesta por escrito en 1-2 oraciones y compare su idea principal con la de otro párrafo del mismo texto.",
  },
  {
    id: "act-pp-02",
    nombre: "Armo la oración",
    area: "Producción escrita",
    objetivo: "Estructuración sintáctica de oraciones simples",
    materiales: [
      "Tarjetas de palabras sueltas (sustantivos, verbos, adjetivos)",
      "Superficie plana o pizarrón para ordenar las tarjetas",
      "Imagen de apoyo temático (opcional)",
    ],
    procedimiento: [
      "Preparar un set de 3–5 tarjetas con palabras que forman una oración completa.",
      "Presentarlas desordenadas al paciente y pedir que las ordene para formar una oración con sentido.",
      "El paciente lee la oración en voz alta para verificar que suene correcta.",
      "El terapeuta refuerza la estructura: '¿Quién hace qué? ¿Dónde?'",
      "Repetir con 3 sets distintos de tarjetas de complejidad creciente.",
      "Registrar: número de oraciones formadas correctamente, errores de orden más frecuentes.",
    ],
    varianteSimple: "Usar solo 3 palabras por oración (sujeto + verbo + objeto simple) con apoyo de imagen.",
    varianteCompleja: "Usar 5–7 palabras incluyendo adjetivos, adverbios o conectores; pedir al paciente que escriba la oración armada en su cuaderno.",
  },
  {
    id: "act-pp-03",
    nombre: "Encuentra el error",
    area: "Atención",
    objetivo: "Fortalecer la atención selectiva y la capacidad de detección de errores",
    materiales: [
      "Hoja con texto, imagen o listado que contiene errores deliberados (ortográficos, lógicos o visuales)",
      "Lápiz de color para marcar errores",
      "Cronómetro (opcional para registro)",
    ],
    procedimiento: [
      "Presentar la hoja al paciente y explicar: 'Hay N errores escondidos; tu misión es encontrarlos todos'.",
      "El paciente revisa la hoja con atención y marca cada error que encuentra.",
      "Al finalizar (o al agotar el tiempo), el terapeuta y el paciente revisan juntos.",
      "Contar errores encontrados vs. errores totales; identificar el tipo de error más frecuente.",
      "Reflexionar: '¿Cómo te fijaste? ¿Qué estrategia usaste?'",
      "Registrar: número de errores detectados, tiempo empleado, tipo de distractor más desafiante.",
    ],
    varianteSimple: "Usar pocos estímulos (5–8 ítems en la hoja), errores visualmente obvios y sin límite de tiempo.",
    varianteCompleja: "Usar muchos estímulos (15–20 ítems), errores sutiles (diferencias mínimas), con límite de tiempo y registro de velocidad.",
  },
  {
    id: "act-pp-04",
    nombre: "Planifico y hago",
    area: "Funciones ejecutivas",
    objetivo: "Desarrollar la planificación y organización de pasos antes de ejecutar una tarea",
    materiales: [
      "Tarea estructurada de nivel apropiado (armar un rompecabezas, ordenar una secuencia de imágenes, resolver un problema sencillo)",
      "Hoja de planificación en blanco o con organizador visual (paso 1, paso 2, paso 3…)",
      "Lápiz",
    ],
    procedimiento: [
      "Presentar la tarea SIN permitir que el paciente la comience de inmediato.",
      "Pedir: 'Antes de empezar, dime qué vas a hacer primero, después y al final'.",
      "El paciente verbaliza o anota el plan en la hoja de planificación.",
      "El terapeuta revisa el plan con el paciente y hace preguntas si falta algún paso.",
      "El paciente ejecuta la tarea siguiendo su propio plan.",
      "Al finalizar, comparar lo planificado con lo que realmente hizo: ¿siguió el plan? ¿lo ajustó?",
      "Registrar: pasos planificados vs. pasos ejecutados, necesidad de ajuste y autonomía durante la ejecución.",
    ],
    varianteSimple: "Tarea de 2 pasos con apoyo visual del terapeuta en la hoja de planificación; verbalización oral sin escritura.",
    varianteCompleja: "Tarea de 4–5 pasos con múltiples decisiones intermedias; el paciente escribe su plan de forma autónoma y luego evalúa por escrito si lo cumplió.",
  },
  {
    id: "act-pp-05",
    nombre: "Memoria visual",
    area: "Memoria",
    objetivo: "Desarrollar la retención y evocación de información visual",
    materiales: [
      "Set de 6–10 tarjetas con imágenes o palabras",
      "Tela o cartulina para cubrir las tarjetas",
      "Ficha de registro",
    ],
    procedimiento: [
      "Disponer las tarjetas boca arriba durante 10–15 segundos para que el paciente las observe.",
      "Cubrir todas las tarjetas con la tela.",
      "Pedir al paciente que nombre o señale todas las tarjetas que recuerda (recuerdo libre).",
      "Registrar cuántas evocó correctamente.",
      "Dar pistas categóricas para las que no recordó (recuerdo asistido).",
      "Comparar recuerdo libre vs. asistido como indicador de la calidad del almacenamiento.",
      "Opcional: al inicio de la siguiente sesión, repetir sin nueva presentación para evaluar memoria a largo plazo.",
    ],
    varianteSimple: "Usar 4 tarjetas con imágenes concretas de objetos conocidos; tiempo de observación de 20 segundos.",
    varianteCompleja: "Usar 10 tarjetas con imágenes abstractas o pares imagen-palabra; reducir el tiempo de observación a 8 segundos y agregar una tarea distractora de 2 minutos antes del recuerdo.",
  },
];

/**
 * Returns all activities for a given area label (case-insensitive partial match).
 */
export function getActivitiesByArea(area: string): PsicopedActivity[] {
  const lower = area.toLowerCase();
  return PSICOPED_ACTIVITY_BANK.filter(a => a.area.toLowerCase().includes(lower));
}
