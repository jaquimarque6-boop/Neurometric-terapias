/**
 * Static clinical content for goal guidance panels.
 * Keyed by: area (lowercase) → grupo (from TAXONOMY).
 *
 * Covers all 371 library goals via the existing 3-level taxonomy.
 * Fallbacks: area-level entry used when grupo is not matched.
 */

export type ClinicalContent = {
  marcoConceptual: string;
  sugerenciaFamilia: string[];
};

type ContentMap = Record<string, Record<string, ClinicalContent>>;

const CONTENT: ContentMap = {
  // ─── Lenguaje ───────────────────────────────────────────────────────────────
  lenguaje: {
    "Comprensión": {
      marcoConceptual: "La comprensión del lenguaje es la base para el aprendizaje: sin ella el niño no puede seguir instrucciones, participar en clase ni interpretar el mundo que lo rodea.",
      sugerenciaFamilia: [
        "Durante el juego, dar instrucciones simples con 1-2 pasos y esperar que el niño las ejecute antes de ayudar.",
        "Leer cuentos cortos y hacer preguntas concretas: \"¿Quién era?\", \"¿Qué pasó?\" apuntando a las imágenes.",
      ],
    },
    "Expresión": {
      marcoConceptual: "La expresión oral permite al niño comunicar necesidades, ideas y emociones; su desarrollo impacta directamente en la autoestima y la participación social.",
      sugerenciaFamilia: [
        "Crear momentos de conversación sin pantallas: describir juntos lo que ven en un paseo o en casa.",
        "Cuando el niño señale algo, esperar 3-5 segundos antes de nombrarlo, invitándolo a intentar decirlo primero.",
      ],
    },
    "Vocabulario y Semántica": {
      marcoConceptual: "Un léxico amplio facilita la comprensión de textos, el rendimiento escolar y la capacidad de expresarse con precisión en distintos contextos.",
      sugerenciaFamilia: [
        "Nombrar objetos, acciones y categorías en las rutinas diarias (baño, comida, ropa) sin forzar repetición.",
        "Jugar a \"¿qué es?\" describiendo cosas por su uso o categoría: \"Es redonda, se come, es dulce…\".",
      ],
    },
    "Gramática": {
      marcoConceptual: "Las estructuras gramaticales son la arquitectura del mensaje: dominarlas permite al niño construir oraciones coherentes y comprender textos escolares más complejos.",
      sugerenciaFamilia: [
        "Al leer, señalar frases y preguntar quién hace qué: \"¿Quién corre?\", \"¿A dónde va?\".",
        "Cuando el niño produzca un error gramatical, repetir la forma correcta en el turno siguiente sin corregir directamente.",
      ],
    },
    "Discurso y Narrativa": {
      marcoConceptual: "La capacidad narrativa integra vocabulario, gramática y coherencia lógica; es esencial para el desempeño académico y la comunicación social.",
      sugerenciaFamilia: [
        "Pedir al niño que cuente qué hizo hoy usando una secuencia: primero… después… al final.",
        "Ver juntos un video corto y pedirle que lo cuente a otro familiar, guiándolo con preguntas de inicio, desarrollo y final.",
      ],
    },
    "Pragmática Lingüística": {
      marcoConceptual: "El uso adecuado del lenguaje en contexto permite al niño adaptarse a distintos interlocutores y situaciones, favoreciendo relaciones sociales exitosas.",
      sugerenciaFamilia: [
        "Modelar cómo pedir algo cortésmente y agradecer en situaciones cotidianas reales.",
        "Practicar saludos y despedidas con personas conocidas y desconocidas en distintos contextos.",
      ],
    },
    "_default": {
      marcoConceptual: "El desarrollo del lenguaje es el eje central del aprendizaje y la comunicación; cada habilidad trabajada contribuye al desempeño global del niño.",
      sugerenciaFamilia: [
        "Hablar con el niño durante las rutinas del día, describiendo acciones y nombrando objetos.",
        "Leer juntos al menos 10 minutos diarios, haciendo preguntas simples sobre lo leído.",
      ],
    },
  },

  // ─── Cognición ──────────────────────────────────────────────────────────────
  cognición: {
    "Atención": {
      marcoConceptual: "La atención sostenida y selectiva es el punto de partida de todo aprendizaje: sin ella el niño no puede procesar ni retener información en el aula.",
      sugerenciaFamilia: [
        "Practicar actividades de atención en lapsos breves (5-10 min) y aumentar progresivamente: puzzles, juegos de mesa, colorear.",
        "Reducir estímulos distractores en el espacio de tarea: apagar la televisión y retirar juguetes del campo visual.",
      ],
    },
    "Memoria": {
      marcoConceptual: "La memoria de trabajo sostiene la comprensión lectora, el cálculo mental y el seguimiento de instrucciones; su entrenamiento potencia el aprendizaje en todas las áreas.",
      sugerenciaFamilia: [
        "Practicar el juego de memoria con tarjetas de imágenes, comenzando con pocos pares e incrementando gradualmente.",
        "Dar secuencias de 2-3 instrucciones orales y pedir al niño que las realice en orden sin repetirlas.",
      ],
    },
    "Razonamiento": {
      marcoConceptual: "El razonamiento lógico permite al niño analizar situaciones, establecer relaciones causa-efecto y resolver problemas, habilidades clave para el pensamiento académico.",
      sugerenciaFamilia: [
        "Plantear situaciones cotidianas de causa-efecto: \"¿Por qué crees que pasó esto?\" al leer o ver un cuento.",
        "Jugar a clasificar objetos de casa por distintas propiedades: tamaño, color, uso, material.",
      ],
    },
    "Funciones Ejecutivas": {
      marcoConceptual: "Las funciones ejecutivas regulan la planificación, el control inhibitorio y la flexibilidad mental; su desarrollo es determinante para la conducta adaptativa y el rendimiento escolar.",
      sugerenciaFamilia: [
        "Establecer rutinas visuales claras (secuencia de imágenes) para que el niño anticipe y organice sus actividades.",
        "Jugar a juegos de turnos o de reglas simples que requieran esperar y controlar el impulso de actuar.",
      ],
    },
    "Categorización": {
      marcoConceptual: "Categorizar es organizar el conocimiento: facilita la comprensión semántica, el acceso léxico y la capacidad de generalizaraprendizajes nuevos.",
      sugerenciaFamilia: [
        "Ordenar juntos objetos del hogar en grupos: frutas, ropa, utensilios de cocina, y nombrar la categoría.",
        "En el supermercado, pedir al niño que busque \"algo para comer\" o \"algo para limpiar\" como juego.",
      ],
    },
    "_default": {
      marcoConceptual: "El fortalecimiento de las habilidades cognitivas impacta directamente en el rendimiento escolar y la capacidad del niño de adaptarse a nuevas situaciones.",
      sugerenciaFamilia: [
        "Integrar actividades de juego que desafíen la memoria y el razonamiento en la rutina diaria.",
        "Mantener un ambiente estructurado y predecible que reduzca la demanda cognitiva en tareas cotidianas.",
      ],
    },
  },

  // ─── Funciones ejecutivas ────────────────────────────────────────────────────
  "funciones ejecutivas": {
    "Control e Inhibición": {
      marcoConceptual: "El control inhibitorio permite al niño frenar respuestas automáticas y reflexionar antes de actuar, reduciendo conductas impulsivas que interfieren con el aprendizaje y la convivencia.",
      sugerenciaFamilia: [
        "Jugar a \"Simón dice\" o \"luz roja/luz verde\" para practicar parar y esperar en un contexto lúdico.",
        "Antes de responder, modelar en voz alta la pausa: \"Primero pienso… ahora respondo.\"",
      ],
    },
    "Planificación": {
      marcoConceptual: "La planificación permite al niño organizar pasos hacia una meta, habilidad esencial para terminar tareas escolares y manejar proyectos de mayor complejidad.",
      sugerenciaFamilia: [
        "Antes de iniciar una tarea, pedir al niño que diga en voz alta qué va a hacer primero, después y al final.",
        "Usar una lista visual de pasos para actividades cotidianas como preparar la mochila o hacer la tarea.",
      ],
    },
    "Organización": {
      marcoConceptual: "La organización del entorno y del tiempo reduce la carga cognitiva y favorece la autonomía, el cumplimiento de rutinas y la reducción de conductas disruptivas.",
      sugerenciaFamilia: [
        "Designar un lugar fijo para los materiales escolares y revisar juntos cada día que estén completos.",
        "Usar un calendario visual semanal donde el niño pueda ver y anticipar las actividades del día.",
      ],
    },
    "_default": {
      marcoConceptual: "Las funciones ejecutivas son el sistema de gestión del cerebro: su desarrollo mejora el autocontrol, la organización y la capacidad de aprender en contextos desafiantes.",
      sugerenciaFamilia: [
        "Mantener rutinas predecibles en casa que estructuren el tiempo del niño.",
        "Reforzar positivamente cuando el niño espera su turno o sigue los pasos de una tarea sin ayuda.",
      ],
    },
  },

  // ─── Comunicación social ─────────────────────────────────────────────────────
  "comunicación social": {
    "Emociones": {
      marcoConceptual: "Reconocer y nombrar emociones propias y ajenas es la base de la empatía y la regulación emocional, habilidades esenciales para las relaciones interpersonales.",
      sugerenciaFamilia: [
        "Nombrar emociones propias durante el día: \"Estoy contento porque...\" y pedir al niño que haga lo mismo.",
        "Al leer cuentos, señalar la cara de los personajes y preguntar: \"¿Cómo se siente aquí?\".",
      ],
    },
    "Habilidades Conversacionales": {
      marcoConceptual: "Las habilidades de conversación —iniciar, mantener y cerrar un intercambio— son fundamentales para la integración social y el éxito en entornos escolares y laborales.",
      sugerenciaFamilia: [
        "Practicar el turno de conversación en la mesa: cada persona habla sin interrumpir, usando un objeto símbolo si es necesario.",
        "Modelar cómo iniciar una conversación con una pregunta y cómo despedirse de forma apropiada.",
      ],
    },
    "Cognición Social": {
      marcoConceptual: "La cognición social implica comprender las intenciones y perspectivas de otros, una habilidad clave para la cooperación, la resolución de conflictos y el trabajo en equipo.",
      sugerenciaFamilia: [
        "Al ver una película o leer un cuento, preguntar: \"¿Qué crees que está pensando ese personaje?\".",
        "Hablar sobre situaciones sociales reales del niño: \"¿Por qué crees que tu amigo se puso así?\".",
      ],
    },
    "_default": {
      marcoConceptual: "Las habilidades de comunicación social permiten al niño participar de manera efectiva en distintos contextos, favoreciendo la integración y el bienestar emocional.",
      sugerenciaFamilia: [
        "Propiciar situaciones de juego con pares en un ambiente estructurado y con roles claros.",
        "Modelar interacciones sociales respetuosas durante las actividades familiares cotidianas.",
      ],
    },
  },

  // ─── Habla ───────────────────────────────────────────────────────────────────
  habla: {
    "Articulación": {
      marcoConceptual: "La articulación precisa de los fonemas garantiza la inteligibilidad del habla, condición necesaria para la comunicación eficaz y la participación plena en contextos sociales y escolares.",
      sugerenciaFamilia: [
        "Practicar el sonido trabajado en sesión mediante palabras sencillas durante el juego, sin exigir perfección.",
        "Leer en voz alta juntos textos cortos y señalar palabras que contengan el sonido objetivo.",
      ],
    },
    "Fonología": {
      marcoConceptual: "El sistema fonológico organiza los sonidos del habla; su maduración es esencial para la adquisición de la lectura y la escritura.",
      sugerenciaFamilia: [
        "Jugar a identificar el sonido inicial de palabras: \"¿Con qué sonido empieza 'pelota'?\".",
        "Cantar canciones y rimas que enfaticen la rima y la repetición de sonidos.",
      ],
    },
    "Fluidez": {
      marcoConceptual: "Un habla fluida favorece la comunicación natural y la confianza del hablante; reducir las disfluencias mejora la participación oral en situaciones cotidianas y académicas.",
      sugerenciaFamilia: [
        "Modelar un ritmo de habla tranquilo sin apresurarse, especialmente al iniciar conversaciones.",
        "Escuchar al niño sin interrumpir ni completar sus oraciones; mantener contacto visual relajado.",
      ],
    },
    "Prosodia y Ritmo": {
      marcoConceptual: "La prosodia —entonación, ritmo y acento— transmite intención y emoción en el discurso oral; su desarrollo mejora la comprensión y la expresividad comunicativa.",
      sugerenciaFamilia: [
        "Leer cuentos con diferentes tonos de voz para cada personaje, invitando al niño a imitarlos.",
        "Practicar poemas breves o trabalenguas haciendo énfasis en el ritmo y la entonación.",
      ],
    },
    "_default": {
      marcoConceptual: "El desarrollo del habla impacta directamente en la inteligibilidad y la confianza comunicativa del niño en todos los contextos de su vida.",
      sugerenciaFamilia: [
        "Hablar claramente y a ritmo moderado frente al niño, siendo un modelo articulatorio consistente.",
        "Evitar corregir el habla de forma directa; en cambio, repetir la palabra o frase correctamente en el turno siguiente.",
      ],
    },
  },

  // ─── Pragmática ─────────────────────────────────────────────────────────────
  pragmática: {
    "Comunicación": {
      marcoConceptual: "Las funciones comunicativas —pedir, comentar, informar, protestar— son los pilares de la intención comunicativa y la base de toda interacción social significativa.",
      sugerenciaFamilia: [
        "Crear oportunidades en las que el niño necesite comunicar algo para obtener lo que quiere, esperando antes de ayudar.",
        "Responder siempre a cualquier intento comunicativo del niño, verbal o no verbal, validándolo y expandiéndolo.",
      ],
    },
    "Conversación": {
      marcoConceptual: "Mantener y gestionar una conversación requiere coordinar escucha, respuesta y mantenimiento del tema, habilidades que determinan el éxito en interacciones sociales y académicas.",
      sugerenciaFamilia: [
        "Durante la cena, turnarse para hablar sobre algo del día, modelando el respeto por los turnos.",
        "Si el niño cambia de tema bruscamente, señalarlo de forma amable: \"Espera, todavía estábamos hablando de...\".",
      ],
    },
    "Registro Social": {
      marcoConceptual: "Adaptar el lenguaje según el interlocutor y el contexto —formal o informal— es una habilidad pragmática avanzada que favorece la inclusión social y la competencia comunicativa.",
      sugerenciaFamilia: [
        "Practicar cómo hablar diferente con un amigo, un adulto conocido y un desconocido usando situaciones reales.",
        "Señalar cuando alguien usa un registro adecuado o inadecuado en películas o series, comentándolo con el niño.",
      ],
    },
    "Lenguaje no Literal": {
      marcoConceptual: "Comprender el lenguaje figurado —metáforas, ironías, modismos— es esencial para la comprensión lectora avanzada y la comunicación en contextos sociales complejos.",
      sugerenciaFamilia: [
        "Explicar expresiones idiomáticas en contexto natural: \"Cuando digo 'está lloviendo a cántaros' quiero decir que llueve muchísimo.\"",
        "Al leer o ver TV, identificar juntos cuando alguien dice algo que no debe tomarse literalmente.",
      ],
    },
    "_default": {
      marcoConceptual: "Las habilidades pragmáticas permiten usar el lenguaje de forma efectiva y apropiada en cada contexto social, fundamentales para la integración del niño.",
      sugerenciaFamilia: [
        "Modelar interacciones sociales apropiadas en situaciones cotidianas reales.",
        "Propiciar juegos de rol donde el niño practique diferentes situaciones comunicativas.",
      ],
    },
  },

  // ─── Motricidad orofacial ────────────────────────────────────────────────────
  "motricidad orofacial": {
    "Tono Muscular": {
      marcoConceptual: "El tono muscular orofacial adecuado es la base biomecánica para la articulación, la masticación y la deglución; su trabajo contribuye a la función y a la estética facial.",
      sugerenciaFamilia: [
        "Realizar los ejercicios de tono indicados por el terapeuta 5-10 minutos al día frente al espejo, haciendo de ello un juego.",
        "Incluir alimentos de diferentes texturas en la dieta según las indicaciones del profesional para estimular la musculatura.",
      ],
    },
    "Praxis": {
      marcoConceptual: "Las praxias orofaciales voluntarias coordinan la musculatura oral para producir movimientos precisos, mejorando la articulación y la conciencia del aparato fonoarticulador.",
      sugerenciaFamilia: [
        "Practicar los movimientos indicados frente al espejo de forma breve y lúdica, imitando al terapeuta.",
        "Usar soplar como actividad motivadora: velas, burbujas, molinillos, según la indicación clínica.",
      ],
    },
    "Deglución": {
      marcoConceptual: "Un patrón de deglución maduro garantiza la seguridad alimentaria y evita efectos negativos sobre la oclusión dental y la postura lingual en reposo.",
      sugerenciaFamilia: [
        "Recordar al niño la postura correcta de lengua y labios durante las comidas según las instrucciones del terapeuta.",
        "Evitar reforzar conductas de deglución atípica y consultar al terapeuta ante dudas sobre texturas o alimentos.",
      ],
    },
    "Respiración": {
      marcoConceptual: "La respiración nasal correcta favorece la oxigenación, el desarrollo facial armónico y la coordinación fono-respiratoria necesaria para un habla fluida y bien sustentada.",
      sugerenciaFamilia: [
        "Recordar al niño mantener la boca cerrada durante el descanso y al caminar, de forma amable y sin presión.",
        "Practicar ejercicios de respiración nasal en juegos de soplido o relajación, según indicación del terapeuta.",
      ],
    },
    "Masticación y Hábitos": {
      marcoConceptual: "Una masticación eficiente y la eliminación de hábitos orales nocivos (succión, onicofagia) protegen el desarrollo dental, el tono muscular y el patrón articulatorio.",
      sugerenciaFamilia: [
        "Ofrecer alimentos que requieran masticación bilateral y diversidad de texturas según el plan terapéutico.",
        "Identificar y registrar los momentos del día en que aparece el hábito nocivo para trabajarlo junto al terapeuta.",
      ],
    },
    "_default": {
      marcoConceptual: "La motricidad orofacial eficiente es la base funcional del habla, la deglución y la respiración; su trabajo complementa directamente la intervención comunicativa.",
      sugerenciaFamilia: [
        "Realizar los ejercicios indicados de forma breve y diaria, integrándolos en la rutina del baño o las comidas.",
        "Observar y reportar al terapeuta cualquier cambio en los patrones de habla, deglución o postura oral.",
      ],
    },
  },

  // ─── Estimulación temprana ────────────────────────────────────────────────────
  "estimulación temprana": {
    "Comunicación y Lenguaje": {
      marcoConceptual: "Las primeras palabras y la comprensión léxica temprana son hitos críticos que predicen el desarrollo lingüístico posterior y la competencia lectora escolar.",
      sugerenciaFamilia: [
        "Hablar continuamente al niño describiendo lo que hacen juntos, usando oraciones cortas y un tono cálido.",
        "Nombrar objetos, personas y acciones del entorno inmediato repetidamente en el contexto natural.",
      ],
    },
    "Atención e Imitación": {
      marcoConceptual: "La atención conjunta y la imitación son los mecanismos fundacionales del aprendizaje social y del desarrollo del lenguaje en los primeros años de vida.",
      sugerenciaFamilia: [
        "Seguir la mirada y el señalamiento del niño, nombrando lo que mira para crear momentos de atención compartida.",
        "Imitar los sonidos y gestos del niño para establecer turnos comunicativos y modelar la imitación.",
      ],
    },
    "Juego": {
      marcoConceptual: "El juego funcional y simbólico es el principal medio de aprendizaje infantil temprano: a través de él el niño desarrolla lenguaje, cognición y habilidades sociales.",
      sugerenciaFamilia: [
        "Dedicar al menos 20 minutos diarios a jugar siguiendo el interés del niño, sin dirigir ni evaluar.",
        "Ofrecer juguetes que promuevan la imaginación: muñecos, autos, elementos de cocina, construcciones simples.",
      ],
    },
    "Vínculo y Sensorial": {
      marcoConceptual: "Un vínculo de apego seguro y una adecuada integración sensorial son las bases del desarrollo emocional, comunicativo y cognitivo en la primera infancia.",
      sugerenciaFamilia: [
        "Crear rutinas predecibles de afecto —canciones, abrazos, lectura— que refuercen el vínculo y la seguridad.",
        "Explorar distintas texturas y sensaciones en el juego siguiendo el ritmo y las preferencias del niño.",
      ],
    },
    "_default": {
      marcoConceptual: "La estimulación temprana en los primeros años aprovecha la alta plasticidad neuronal para sentar las bases del desarrollo lingüístico, cognitivo y social.",
      sugerenciaFamilia: [
        "Interactuar con el niño durante todas las rutinas del día: baño, comida, cambio de ropa.",
        "Ofrecer variedad de experiencias sensoriales, sociales y de juego en un entorno seguro y cálido.",
      ],
    },
  },

  // ─── Lectoescritura ──────────────────────────────────────────────────────────
  lectoescritura: {
    "Conciencia Fonológica": {
      marcoConceptual: "La conciencia fonológica —identificar, segmentar y manipular los sonidos del habla— es el predictor más sólido del aprendizaje lector y la prevención de la dislexia.",
      sugerenciaFamilia: [
        "Jugar a separar palabras en sílabas con palmadas durante las comidas o los trayectos en auto.",
        "Buscar palabras que rimen en canciones y cuentos, señalándolas y repitiéndolas con el niño.",
      ],
    },
    "Lectura": {
      marcoConceptual: "La lectura fluida y comprensiva abre el acceso al conocimiento en todas las áreas; su dificultad impacta globalmente el rendimiento académico y la autoestima.",
      sugerenciaFamilia: [
        "Leer juntos en voz alta textos del nivel del niño, alternando quién lee cada frase o párrafo.",
        "Después de leer, hacer 1-2 preguntas sobre el texto: \"¿Qué pasó primero?\" o \"¿Por qué crees que hizo eso?\".",
      ],
    },
    "Escritura": {
      marcoConceptual: "La escritura integra habilidades fonológicas, ortográficas y expresivas; su desarrollo fortalece simultáneamente la lectura y el pensamiento organizado.",
      sugerenciaFamilia: [
        "Pedir al niño que escriba listas cotidianas (compras, tareas pendientes) o tarjetas breves para familiares.",
        "Revisar juntos una oración escrita buscando mayúsculas y puntos, sin marcar todos los errores a la vez.",
      ],
    },
    "_default": {
      marcoConceptual: "Las habilidades de lectoescritura son el eje del aprendizaje escolar; su fortalecimiento tiene un efecto multiplicador en todas las áreas del currículo.",
      sugerenciaFamilia: [
        "Crear un hábito de lectura diaria de al menos 15 minutos en un ambiente tranquilo y sin presión.",
        "Celebrar cada avance en lectura y escritura reforzando el esfuerzo, no solo el resultado.",
      ],
    },
  },
};

// ─── Lookup API ───────────────────────────────────────────────────────────────

import { getGrupo } from "./goal-taxonomy";

/**
 * Returns pre-defined clinical content (marcoConceptual + sugerenciaFamilia)
 * for a given area + optional subarea.
 *
 * Lookup priority:
 *   1. area → grupo (resolved via taxonomy)
 *   2. area → "_default"
 *   3. null (no content available)
 */
export function getClinicalContent(
  area: string | null | undefined,
  subarea?: string | null,
): ClinicalContent | null {
  if (!area) return null;

  const normalizedArea = area.toLowerCase().trim();
  const areaContent = CONTENT[normalizedArea];
  if (!areaContent) return null;

  // Try to find grupo-specific content
  if (subarea) {
    const grupo = getGrupo(normalizedArea, subarea);
    if (grupo !== "Otras" && areaContent[grupo]) {
      return areaContent[grupo];
    }
  }

  // Fall back to area default
  return areaContent["_default"] ?? null;
}
