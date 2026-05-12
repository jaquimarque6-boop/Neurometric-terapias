/**
 * Static clinical content for goal guidance panels.
 * Keyed by: area (lowercase) → grupo (from TAXONOMY).
 *
 * Covers all 371 library goals via the existing 3-level taxonomy.
 * Fallbacks: area-level "_default" entry used when grupo is not matched.
 */

export type ClinicalContent = {
  marcoConceptual: string;
  actividadesClinicas: string[];
  actividadesHogar: string[];
};

type ContentMap = Record<string, Record<string, ClinicalContent>>;

const CONTENT: ContentMap = {
  // ─── Lenguaje ───────────────────────────────────────────────────────────────
  lenguaje: {
    "Comprensión": {
      marcoConceptual: "La comprensión del lenguaje es la base para el aprendizaje: sin ella el niño no puede seguir instrucciones, participar en clase ni interpretar el mundo que lo rodea.",
      actividadesClinicas: [
        "Dar instrucciones de 1, 2 y 3 pasos con apoyo visual y luego sin él; registrar niveles de ejecución.",
        "Usar láminas de escenas para hacer preguntas de comprensión inferencial: '¿Por qué crees que pasó esto?'",
        "Actividad de seguimiento de instrucciones en juego simbólico: 'Pon el osito dentro de la caja roja'.",
        "Narrar una secuencia de 4-5 imágenes y pedir al niño que señale el evento correcto según la pregunta.",
      ],
      actividadesHogar: [
        "Durante el juego, dar instrucciones con 1-2 pasos y esperar que el niño las ejecute antes de ayudar.",
        "Leer cuentos cortos y hacer preguntas concretas: '¿Quién era?', '¿Qué pasó?' apuntando a las imágenes.",
      ],
    },
    "Expresión": {
      marcoConceptual: "La expresión oral permite al niño comunicar necesidades, ideas y emociones; su desarrollo impacta directamente en la autoestima y la participación social.",
      actividadesClinicas: [
        "Describir láminas con creciente nivel de detalle: desde una palabra hasta una oración completa.",
        "Juego de roles con marionetas o muñecos donde el niño asume el turno del narrador.",
        "Expansión de emisiones: el terapeuta repite lo que el niño dice con más estructura y pide imitación.",
        "Completar frases abiertas con apoyo visual: 'El niño está… porque…'",
      ],
      actividadesHogar: [
        "Crear momentos de conversación sin pantallas: describir juntos lo que ven en un paseo o en casa.",
        "Cuando el niño señale algo, esperar 3-5 segundos antes de nombrarlo, invitándolo a intentar decirlo primero.",
      ],
    },
    "Vocabulario y Semántica": {
      marcoConceptual: "Un léxico amplio facilita la comprensión de textos, el rendimiento escolar y la capacidad de expresarse con precisión en distintos contextos.",
      actividadesClinicas: [
        "Actividad de asociación semántica: emparejar palabras con su categoría, función o características.",
        "Definición de palabras: '¿Qué es un hospital?' → registrar nivel de abstracción de la respuesta.",
        "Juego de categorías: nombrar el mayor número de items de una categoría en 30 segundos.",
        "Actividad de campos semánticos: dado un concepto, generar palabras relacionadas en mapa mental.",
      ],
      actividadesHogar: [
        "Nombrar objetos, acciones y categorías en las rutinas diarias (baño, comida, ropa) sin forzar repetición.",
        "Jugar a '¿qué es?' describiendo cosas por su uso o categoría: 'Es redonda, se come, es dulce…'",
      ],
    },
    "Gramática": {
      marcoConceptual: "Las estructuras gramaticales son la arquitectura del mensaje: dominarlas permite al niño construir oraciones coherentes y comprender textos escolares más complejos.",
      actividadesClinicas: [
        "Juego de completar oraciones con morfología verbal: 'Ayer yo ___, hoy yo ___'.",
        "Construcción de oraciones a partir de imágenes, aumentando la complejidad sintáctica progresivamente.",
        "Identificación y corrección de errores en oraciones presentadas oralmente por el terapeuta.",
        "Actividad de recombinación: unir dos oraciones simples con conectores (y, porque, pero, cuando).",
      ],
      actividadesHogar: [
        "Al leer, señalar frases y preguntar quién hace qué: '¿Quién corre?', '¿A dónde va?'",
        "Cuando el niño produzca un error gramatical, repetir la forma correcta en el turno siguiente sin corregir directamente.",
      ],
    },
    "Discurso y Narrativa": {
      marcoConceptual: "La capacidad narrativa integra vocabulario, gramática y coherencia lógica; es esencial para el desempeño académico y la comunicación social.",
      actividadesClinicas: [
        "Renarración de cuentos con apoyo de secuencias de imágenes; registrar elementos narrativos incluidos.",
        "Construir una historia en turnos (terapeuta–niño) utilizando personajes, problema y resolución.",
        "Actividad de ordenamiento de secuencias: ordenar viñetas y narrar la historia con conectores temporales.",
        "Evaluación de la microestructura narrativa: contar episodios con inicio, nudo y desenlace completos.",
      ],
      actividadesHogar: [
        "Pedir al niño que cuente qué hizo hoy usando una secuencia: primero… después… al final.",
        "Ver juntos un video corto y pedirle que lo cuente a otro familiar, guiándolo con preguntas de inicio, desarrollo y final.",
      ],
    },
    "Pragmática Lingüística": {
      marcoConceptual: "El uso adecuado del lenguaje en contexto permite al niño adaptarse a distintos interlocutores y situaciones, favoreciendo relaciones sociales exitosas.",
      actividadesClinicas: [
        "Role-play de situaciones comunicativas variadas: pedir ayuda, saludar, agradecer, disculparse.",
        "Juego de interacción donde el niño debe adaptar su lenguaje según el interlocutor (adulto vs. par).",
        "Actividad de análisis de intenciones comunicativas en viñetas o videos breves.",
        "Práctica de reparación conversacional: ¿qué hago cuando no me entendieron?",
      ],
      actividadesHogar: [
        "Modelar cómo pedir algo cortésmente y agradecer en situaciones cotidianas reales.",
        "Practicar saludos y despedidas con personas conocidas y desconocidas en distintos contextos.",
      ],
    },
    "_default": {
      marcoConceptual: "El desarrollo del lenguaje es el eje central del aprendizaje y la comunicación; cada habilidad trabajada contribuye al desempeño global del niño.",
      actividadesClinicas: [
        "Actividades de comprensión y expresión en contextos de juego semiestructurado.",
        "Uso de láminas temáticas para estimular producción oral con apoyo visual.",
        "Expansión y recasting de las emisiones del niño para modelar formas más complejas.",
      ],
      actividadesHogar: [
        "Hablar con el niño durante las rutinas del día, describiendo acciones y nombrando objetos.",
        "Leer juntos al menos 10 minutos diarios, haciendo preguntas simples sobre lo leído.",
      ],
    },
  },

  // ─── Cognición ──────────────────────────────────────────────────────────────
  cognición: {
    "Atención": {
      marcoConceptual: "La atención sostenida y selectiva es el punto de partida de todo aprendizaje: sin ella el niño no puede procesar ni retener información en el aula.",
      actividadesClinicas: [
        "Tareas de cancelación visual: tachar un símbolo específico en una hoja con distractores.",
        "Juego de 'Stop': escuchar una lista de palabras y aplaudir solo cuando aparece la palabra objetivo.",
        "Actividades de atención dividida: seguir un patrón de colores mientras realiza una tarea motora.",
        "Registro de tiempo en tarea para monitorear avance de atención sostenida sesión a sesión.",
      ],
      actividadesHogar: [
        "Practicar actividades de atención en lapsos breves (5-10 min) y aumentar progresivamente: puzzles, juegos de mesa, colorear.",
        "Reducir estímulos distractores en el espacio de tarea: apagar la televisión y retirar juguetes del campo visual.",
      ],
    },
    "Memoria": {
      marcoConceptual: "La memoria de trabajo sostiene la comprensión lectora, el cálculo mental y el seguimiento de instrucciones; su entrenamiento potencia el aprendizaje en todas las áreas.",
      actividadesClinicas: [
        "Repetición de series de dígitos en orden directo e inverso, registrando el span de memoria.",
        "Actividad de recuerdo diferido: mostrar 5-7 imágenes, cubrir y pedir que las recuerde después de 5 minutos.",
        "Juego de memoria de pares (matching) con fichas de imágenes, aumentando el número progresivamente.",
        "Seguimiento de instrucciones multistep sin apoyo visual: 3-4 pasos en secuencia.",
      ],
      actividadesHogar: [
        "Practicar el juego de memoria con tarjetas de imágenes, comenzando con pocos pares e incrementando gradualmente.",
        "Dar secuencias de 2-3 instrucciones orales y pedir al niño que las realice en orden sin repetirlas.",
      ],
    },
    "Razonamiento": {
      marcoConceptual: "El razonamiento lógico permite al niño analizar situaciones, establecer relaciones causa-efecto y resolver problemas, habilidades clave para el pensamiento académico.",
      actividadesClinicas: [
        "Completar analogías verbales: 'El día es al sol como la noche es a la ___'.",
        "Actividad de resolución de problemas con imágenes de situaciones cotidianas: '¿Qué haría el niño si…?'",
        "Clasificación de objetos por múltiples criterios: tamaño, forma, uso, categoría.",
        "Juego de causa-efecto: presentar una consecuencia y pedir al niño que explique la causa posible.",
      ],
      actividadesHogar: [
        "Plantear situaciones cotidianas de causa-efecto: '¿Por qué crees que pasó esto?' al leer o ver un cuento.",
        "Jugar a clasificar objetos de casa por distintas propiedades: tamaño, color, uso, material.",
      ],
    },
    "Funciones Ejecutivas": {
      marcoConceptual: "Las funciones ejecutivas regulan la planificación, el control inhibitorio y la flexibilidad mental; su desarrollo es determinante para la conducta adaptativa y el rendimiento escolar.",
      actividadesClinicas: [
        "Tarea de cambio de set: alternar entre dos reglas de clasificación según una señal del terapeuta.",
        "Actividad de planificación: organizar los pasos para realizar una tarea antes de comenzar (Torre de Hanói simplificada).",
        "Juego de Go/No-Go: responder a un estímulo pero inhibir la respuesta ante otro.",
        "Evaluación de la flexibilidad cognitiva: proponer usos alternativos para objetos cotidianos.",
      ],
      actividadesHogar: [
        "Establecer rutinas visuales claras (secuencia de imágenes) para que el niño anticipe y organice sus actividades.",
        "Jugar a juegos de turnos o de reglas simples que requieran esperar y controlar el impulso de actuar.",
      ],
    },
    "Categorización": {
      marcoConceptual: "Categorizar es organizar el conocimiento: facilita la comprensión semántica, el acceso léxico y la capacidad de generalizar aprendizajes nuevos.",
      actividadesClinicas: [
        "Clasificar tarjetas de imágenes en grupos semánticos; pedir justificación verbal de cada categoría.",
        "Actividad de inclusión de clase: '¿El perro es un animal? ¿Todos los animales son perros?'",
        "Detectar el elemento intruso en una serie y explicar por qué no pertenece.",
        "Crear subclasificaciones dentro de una categoría: animales → domésticos / salvajes / marinos.",
      ],
      actividadesHogar: [
        "Ordenar juntos objetos del hogar en grupos: frutas, ropa, utensilios de cocina, y nombrar la categoría.",
        "En el supermercado, pedir al niño que busque 'algo para comer' o 'algo para limpiar' como juego.",
      ],
    },
    "Estrategias de aprendizaje": {
      marcoConceptual: "Las estrategias de aprendizaje son herramientas metacognitivas que permiten al estudiante planificar, monitorear y evaluar su propio proceso de aprendizaje, mejorando la autonomía y la eficacia académica.",
      actividadesClinicas: [
        "Enseñar y practicar el subrayado de ideas clave en un texto breve; comparar qué subrayó el niño vs. el terapeuta.",
        "Actividad de 'planificación antes de empezar': antes de iniciar, el niño enuncia en voz alta qué va a hacer y en qué orden.",
        "Uso de mapas conceptuales para organizar información nueva: construirlos juntos y luego pedir al niño que los reproduzca.",
        "Actividad de autoevaluación: al finalizar la tarea, el niño califica su desempeño en escala 1-5 y justifica su nota.",
        "Práctica de repetición espaciada: revisar contenido trabajado en la sesión anterior antes de introducir material nuevo.",
      ],
      actividadesHogar: [
        "Antes de estudiar, pedir al niño que explique con sus palabras qué ya sabe del tema y qué le resulta más difícil.",
        "Enseñar una estrategia sencilla de repaso: releer, tapar el texto y recordar, luego verificar — practicarla juntos.",
      ],
    },
    "_default": {
      marcoConceptual: "El fortalecimiento de las habilidades cognitivas impacta directamente en el rendimiento escolar y la capacidad del niño de adaptarse a nuevas situaciones.",
      actividadesClinicas: [
        "Actividades de juego cognitivo semiestructurado con materiales concretos.",
        "Registro de desempeño en tareas cognitivas para monitorear el avance.",
        "Estrategias de mediación verbal para facilitar el procesamiento de la información.",
      ],
      actividadesHogar: [
        "Integrar actividades de juego que desafíen la memoria y el razonamiento en la rutina diaria.",
        "Mantener un ambiente estructurado y predecible que reduzca la demanda cognitiva en tareas cotidianas.",
      ],
    },
  },

  // ─── Funciones ejecutivas ────────────────────────────────────────────────────
  "funciones ejecutivas": {
    "Control e Inhibición": {
      marcoConceptual: "El control inhibitorio permite al niño frenar respuestas automáticas y reflexionar antes de actuar, reduciendo conductas impulsivas que interfieren con el aprendizaje y la convivencia.",
      actividadesClinicas: [
        "Juego de Simón dice: seguir solo las instrucciones precedidas de 'Simón dice'.",
        "Tarea de día/noche: responder 'día' cuando se muestra la luna y 'noche' cuando se muestra el sol.",
        "Actividad de pausa-planifica: antes de responder, el niño debe contar 3 segundos en silencio.",
        "Registro de impulsos: contar cuántas veces el niño espera su turno correctamente en una dinámica grupal o de pareja.",
      ],
      actividadesHogar: [
        "Jugar a 'Simón dice' o 'luz roja/luz verde' para practicar parar y esperar en un contexto lúdico.",
        "Antes de responder, modelar en voz alta la pausa: 'Primero pienso… ahora respondo.'",
      ],
    },
    "Planificación": {
      marcoConceptual: "La planificación permite al niño organizar pasos hacia una meta, habilidad esencial para terminar tareas escolares y manejar proyectos de mayor complejidad.",
      actividadesClinicas: [
        "Pedir al niño que planifique en voz alta los pasos para resolver una tarea antes de comenzarla.",
        "Actividad de torres o laberintos donde el niño debe anticipar el recorrido antes de actuar.",
        "Crear una lista secuenciada de pasos para completar una actividad cotidiana compleja.",
        "Comparar el plan inicial con el resultado y analizar diferencias juntos.",
      ],
      actividadesHogar: [
        "Antes de iniciar una tarea, pedir al niño que diga en voz alta qué va a hacer primero, después y al final.",
        "Usar una lista visual de pasos para actividades cotidianas como preparar la mochila o hacer la tarea.",
      ],
    },
    "Organización": {
      marcoConceptual: "La organización del entorno y del tiempo reduce la carga cognitiva y favorece la autonomía, el cumplimiento de rutinas y la reducción de conductas disruptivas.",
      actividadesClinicas: [
        "Actividad de ordenamiento: clasificar y organizar materiales de trabajo por categorías o uso.",
        "Ejercicio de gestión del tiempo: estimar cuánto tarda una tarea y comparar con el tiempo real.",
        "Uso de agenda o planificador visual durante la sesión como herramienta de autorregulación.",
        "Revisión y reorganización de una tarea desordenada: identificar errores y proponer correcciones.",
      ],
      actividadesHogar: [
        "Designar un lugar fijo para los materiales escolares y revisar juntos cada día que estén completos.",
        "Usar un calendario visual semanal donde el niño pueda ver y anticipar las actividades del día.",
      ],
    },
    "_default": {
      marcoConceptual: "Las funciones ejecutivas son el sistema de gestión del cerebro: su desarrollo mejora el autocontrol, la organización y la capacidad de aprender en contextos desafiantes.",
      actividadesClinicas: [
        "Actividades de autorregulación en contexto de juego semiestructurado.",
        "Uso de mediación verbal para apoyar la planificación y el monitoreo de tareas.",
        "Registro de estrategias ejecutivas empleadas durante la sesión.",
      ],
      actividadesHogar: [
        "Mantener rutinas predecibles en casa que estructuren el tiempo del niño.",
        "Reforzar positivamente cuando el niño espera su turno o sigue los pasos de una tarea sin ayuda.",
      ],
    },
  },

  // ─── Comunicación social ─────────────────────────────────────────────────────
  "comunicación social": {
    "Emociones": {
      marcoConceptual: "Reconocer y nombrar emociones propias y ajenas es la base de la empatía y la regulación emocional, habilidades esenciales para las relaciones interpersonales.",
      actividadesClinicas: [
        "Identificación de emociones en tarjetas de expresiones faciales con distintos niveles de intensidad.",
        "Role-play de situaciones emocionales; el niño identifica y nombra la emoción del personaje.",
        "Actividad de termómetro emocional: ubicar en una escala visual la intensidad de una emoción.",
        "Lectura de cuentos con pausa para preguntar '¿cómo se siente el personaje?' y justificar la respuesta.",
      ],
      actividadesHogar: [
        "Nombrar emociones propias durante el día: 'Estoy contento porque...' y pedir al niño que haga lo mismo.",
        "Al leer cuentos, señalar la cara de los personajes y preguntar: '¿Cómo se siente aquí?'",
      ],
    },
    "Habilidades Conversacionales": {
      marcoConceptual: "Las habilidades de conversación —iniciar, mantener y cerrar un intercambio— son fundamentales para la integración social y el éxito en entornos escolares y laborales.",
      actividadesClinicas: [
        "Práctica de inicio de conversación con distintos interlocutores y temas usando guión visual.",
        "Registro de turnos conversacionales: contar cuántos turnos completos se mantienen antes de romper el tema.",
        "Juego de conversación encadenada: cada turno debe relacionarse con el anterior.",
        "Actividad de cierre apropiado de conversación: practicar despedidas y transiciones de tema.",
      ],
      actividadesHogar: [
        "Practicar el turno de conversación en la mesa: cada persona habla sin interrumpir, usando un objeto símbolo si es necesario.",
        "Modelar cómo iniciar una conversación con una pregunta y cómo despedirse de forma apropiada.",
      ],
    },
    "Cognición Social": {
      marcoConceptual: "La cognición social implica comprender las intenciones y perspectivas de otros, una habilidad clave para la cooperación, la resolución de conflictos y el trabajo en equipo.",
      actividadesClinicas: [
        "Actividad de teoría de la mente: tarea de creencias falsas adaptada al nivel del niño.",
        "Análisis de intenciones en viñetas o fragmentos de video: '¿Qué quería hacer ese personaje?'",
        "Juego de perspectivas: terapeuta y niño tienen información diferente; el niño debe inferir la perspectiva del otro.",
        "Resolución de conflictos sociales: presentar dilemas y analizar opciones con sus consecuencias.",
      ],
      actividadesHogar: [
        "Al ver una película o leer un cuento, preguntar: '¿Qué crees que está pensando ese personaje?'",
        "Hablar sobre situaciones sociales reales del niño: '¿Por qué crees que tu amigo se puso así?'",
      ],
    },
    "_default": {
      marcoConceptual: "Las habilidades de comunicación social permiten al niño participar de manera efectiva en distintos contextos, favoreciendo la integración y el bienestar emocional.",
      actividadesClinicas: [
        "Role-play de situaciones sociales con retroalimentación inmediata del terapeuta.",
        "Observación y análisis de interacciones en videos breves.",
        "Práctica de habilidades sociales en contexto de juego con pares reales o simulados.",
      ],
      actividadesHogar: [
        "Propiciar situaciones de juego con pares en un ambiente estructurado y con roles claros.",
        "Modelar interacciones sociales respetuosas durante las actividades familiares cotidianas.",
      ],
    },
  },

  // ─── Habla ───────────────────────────────────────────────────────────────────
  habla: {
    "Articulación": {
      marcoConceptual: "La articulación precisa de los fonemas garantiza la inteligibilidad del habla, condición necesaria para la comunicación eficaz y la participación plena en contextos sociales y escolares.",
      actividadesClinicas: [
        "Práctica del fonema objetivo en posición inicial, medial y final con imágenes de apoyo.",
        "Lectura en voz alta de listas de palabras y oraciones con el sonido objetivo en distintas posiciones.",
        "Actividad de generalización: usar el sonido en conversación espontánea sobre un tema de interés.",
        "Registro del porcentaje de producción correcta del fonema en contextos controlados y espontáneos.",
      ],
      actividadesHogar: [
        "Practicar el sonido trabajado en sesión mediante palabras sencillas durante el juego, sin exigir perfección.",
        "Leer en voz alta juntos textos cortos y señalar palabras que contengan el sonido objetivo.",
      ],
    },
    "Fonología": {
      marcoConceptual: "El sistema fonológico organiza los sonidos del habla; su maduración es esencial para la adquisición de la lectura y la escritura.",
      actividadesClinicas: [
        "Discriminación auditiva de pares mínimos: '¿Son iguales 'pato' y 'gato'?'",
        "Actividad de eliminación de procesos fonológicos: trabajar pares mínimos con el proceso objetivo.",
        "Juego de rimas: identificar y generar palabras que rimen con la palabra dada.",
        "Segmentación y síntesis fonémica: descomponer y reconstruir palabras fonema a fonema.",
      ],
      actividadesHogar: [
        "Jugar a identificar el sonido inicial de palabras: '¿Con qué sonido empieza 'pelota'?'",
        "Cantar canciones y rimas que enfaticen la rima y la repetición de sonidos.",
      ],
    },
    "Fluidez": {
      marcoConceptual: "Un habla fluida favorece la comunicación natural y la confianza del hablante; reducir las disfluencias mejora la participación oral en situaciones cotidianas y académicas.",
      actividadesClinicas: [
        "Práctica de técnicas de habla suave y arranque suave al inicio de la emisión.",
        "Monólogo lento con retroalimentación sobre disfluencias en un entorno sin presión.",
        "Actividad de habla en situaciones graduadas: desde lectura en voz alta hasta conversación espontánea.",
        "Desensibilización: hablar sobre las disfluencias para reducir la ansiedad anticipatoria.",
      ],
      actividadesHogar: [
        "Modelar un ritmo de habla tranquilo sin apresurarse, especialmente al iniciar conversaciones.",
        "Escuchar al niño sin interrumpir ni completar sus oraciones; mantener contacto visual relajado.",
      ],
    },
    "Prosodia y Ritmo": {
      marcoConceptual: "La prosodia —entonación, ritmo y acento— transmite intención y emoción en el discurso oral; su desarrollo mejora la comprensión y la expresividad comunicativa.",
      actividadesClinicas: [
        "Lectura expresiva de cuentos diferenciando personajes por su tono de voz.",
        "Actividad de marcación de acentos en palabras con palmadas o golpes sobre la mesa.",
        "Juego de imitación prosódica: el terapeuta produce una frase con entonación específica y el niño la replica.",
        "Análisis de entonación en preguntas vs. afirmaciones: identificar y producir el patrón correcto.",
      ],
      actividadesHogar: [
        "Leer cuentos con diferentes tonos de voz para cada personaje, invitando al niño a imitarlos.",
        "Practicar poemas breves o trabalenguas haciendo énfasis en el ritmo y la entonación.",
      ],
    },
    "_default": {
      marcoConceptual: "El desarrollo del habla impacta directamente en la inteligibilidad y la confianza comunicativa del niño en todos los contextos de su vida.",
      actividadesClinicas: [
        "Práctica articulatoria o fonológica con materiales de apoyo visual y auditivo.",
        "Actividades de habla en contextos funcionales y motivadores para el niño.",
        "Registro sistemático de porcentaje de producción correcta por sesión.",
      ],
      actividadesHogar: [
        "Hablar claramente y a ritmo moderado frente al niño, siendo un modelo articulatorio consistente.",
        "Evitar corregir el habla de forma directa; repetir la palabra o frase correctamente en el turno siguiente.",
      ],
    },
  },

  // ─── Pragmática ─────────────────────────────────────────────────────────────
  pragmática: {
    "Comunicación": {
      marcoConceptual: "Las funciones comunicativas —pedir, comentar, informar, protestar— son los pilares de la intención comunicativa y la base de toda interacción social significativa.",
      actividadesClinicas: [
        "Crear situaciones de comunicación que requieran petición: dejar el material fuera del alcance del niño.",
        "Juego de funciones comunicativas con marionetas: practicar pedir, comentar, rechazar y llamar la atención.",
        "Actividad de comunicación no verbal: transmitir mensajes usando solo gestos y expresión facial.",
        "Registrar el repertorio de funciones comunicativas del niño durante una sesión de juego libre.",
      ],
      actividadesHogar: [
        "Crear oportunidades en las que el niño necesite comunicar algo para obtener lo que quiere, esperando antes de ayudar.",
        "Responder siempre a cualquier intento comunicativo del niño, verbal o no verbal, validándolo y expandiéndolo.",
      ],
    },
    "Conversación": {
      marcoConceptual: "Mantener y gestionar una conversación requiere coordinar escucha, respuesta y mantenimiento del tema, habilidades que determinan el éxito en interacciones sociales y académicas.",
      actividadesClinicas: [
        "Conversación temática cronometrada: mantener el tema por al menos 5 turnos completos.",
        "Práctica de reparación conversacional: '¿Qué hago si no me entendieron?' con guión de estrategias.",
        "Actividad de cambio de tema apropiado: señalizar el cambio con marcadores lingüísticos.",
        "Análisis de grabación de conversación propia: identificar aciertos y áreas de mejora juntos.",
      ],
      actividadesHogar: [
        "Durante la cena, turnarse para hablar sobre algo del día, modelando el respeto por los turnos.",
        "Si el niño cambia de tema bruscamente, señalarlo de forma amable: 'Espera, todavía estábamos hablando de...'",
      ],
    },
    "Registro Social": {
      marcoConceptual: "Adaptar el lenguaje según el interlocutor y el contexto —formal o informal— es una habilidad pragmática avanzada que favorece la inclusión social y la competencia comunicativa.",
      actividadesClinicas: [
        "Role-play de la misma situación con distintos interlocutores: cómo pedir algo a un amigo vs. a un profesor.",
        "Análisis de registros lingüísticos en fragmentos de películas o textos escritos.",
        "Actividad de adaptación discursiva: explicar el mismo contenido a un niño pequeño y a un adulto.",
        "Identificar y practicar marcadores de cortesía lingüística en distintos contextos sociales.",
      ],
      actividadesHogar: [
        "Practicar cómo hablar diferente con un amigo, un adulto conocido y un desconocido usando situaciones reales.",
        "Señalar cuando alguien usa un registro adecuado o inadecuado en películas o series, comentándolo con el niño.",
      ],
    },
    "Lenguaje no Literal": {
      marcoConceptual: "Comprender el lenguaje figurado —metáforas, ironías, modismos— es esencial para la comprensión lectora avanzada y la comunicación en contextos sociales complejos.",
      actividadesClinicas: [
        "Identificar expresiones idiomáticas en textos breves y explicar su significado real.",
        "Actividad de comprensión de ironía: presentar situaciones donde el personaje dice lo contrario de lo que piensa.",
        "Crear metáforas simples a partir de comparaciones: '¿En qué se parece un libro a una ventana?'",
        "Juego de refranes: presentar la primera parte y pedir al niño que complete y explique el significado.",
      ],
      actividadesHogar: [
        "Explicar expresiones idiomáticas en contexto natural: 'Cuando digo está lloviendo a cántaros quiero decir que llueve muchísimo.'",
        "Al leer o ver TV, identificar juntos cuando alguien dice algo que no debe tomarse literalmente.",
      ],
    },
    "_default": {
      marcoConceptual: "Las habilidades pragmáticas permiten usar el lenguaje de forma efectiva y apropiada en cada contexto social, fundamentales para la integración del niño.",
      actividadesClinicas: [
        "Role-play de situaciones comunicativas con retroalimentación inmediata.",
        "Actividades de análisis de intenciones comunicativas en materiales visuales.",
        "Práctica de habilidades conversacionales en contexto semiestructurado.",
      ],
      actividadesHogar: [
        "Modelar interacciones sociales apropiadas en situaciones cotidianas reales.",
        "Propiciar juegos de rol donde el niño practique diferentes situaciones comunicativas.",
      ],
    },
  },

  // ─── Motricidad orofacial ────────────────────────────────────────────────────
  "motricidad orofacial": {
    "Tono Muscular": {
      marcoConceptual: "El tono muscular orofacial adecuado es la base biomecánica para la articulación, la masticación y la deglución; su trabajo contribuye a la función y a la estética facial.",
      actividadesClinicas: [
        "Ejercicios de estiramiento y contracción labial frente al espejo con retroalimentación visual.",
        "Actividades de tono lingual: presionar la lengua contra el paladar y mantener la posición por segundos.",
        "Masaje de estimulación de tono en músculos masetero y orbicular, según protocolo.",
        "Registro de simetría y tono muscular facial al inicio y al final de cada sesión.",
      ],
      actividadesHogar: [
        "Realizar los ejercicios de tono indicados por el terapeuta 5-10 minutos al día frente al espejo, haciendo de ello un juego.",
        "Incluir alimentos de diferentes texturas en la dieta según las indicaciones del profesional para estimular la musculatura.",
      ],
    },
    "Praxis": {
      marcoConceptual: "Las praxias orofaciales voluntarias coordinan la musculatura oral para producir movimientos precisos, mejorando la articulación y la conciencia del aparato fonoarticulador.",
      actividadesClinicas: [
        "Secuencias de praxias en series de 3-5 movimientos: labios, lengua, mejillas.",
        "Imitación de movimientos orofaciales con apoyo de espejo: el niño replica exactamente lo que ve.",
        "Actividades de diadococinesia oral: repetir /pa-ta-ka/ a diferentes velocidades.",
        "Juego de soplar objetos ligeros (molinillos, bolas de algodón) para trabajar coordinación fono-respiratoria.",
      ],
      actividadesHogar: [
        "Practicar los movimientos indicados frente al espejo de forma breve y lúdica, imitando al terapeuta.",
        "Usar soplar como actividad motivadora: velas, burbujas, molinillos, según la indicación clínica.",
      ],
    },
    "Deglución": {
      marcoConceptual: "Un patrón de deglución maduro garantiza la seguridad alimentaria y evita efectos negativos sobre la oclusión dental y la postura lingual en reposo.",
      actividadesClinicas: [
        "Observación y registro del patrón deglutorio con distintas texturas de alimento.",
        "Práctica de postura correcta de lengua y labios durante la deglución con retroalimentación táctil.",
        "Actividades de sellado labial en reposo: mantener labios juntos sin tensión por intervalos crecientes.",
        "Ejercicios de deglución con consistencias progresivas según el plan terapéutico.",
      ],
      actividadesHogar: [
        "Recordar al niño la postura correcta de lengua y labios durante las comidas según las instrucciones del terapeuta.",
        "Evitar reforzar conductas de deglución atípica y consultar al terapeuta ante dudas sobre texturas o alimentos.",
      ],
    },
    "Respiración": {
      marcoConceptual: "La respiración nasal correcta favorece la oxigenación, el desarrollo facial armónico y la coordinación fono-respiratoria necesaria para un habla fluida y bien sustentada.",
      actividadesClinicas: [
        "Ejercicios de respiración diafragmática con control visual de movimiento abdominal.",
        "Práctica de respiración nasal sostenida: inspirar por nariz, contar 4, exhalar por nariz.",
        "Coordinación fono-respiratoria: producir frases largas en un solo flujo de aire.",
        "Registro de capacidad respiratoria: s/z ratio para evaluar soporte respiratorio oral.",
      ],
      actividadesHogar: [
        "Recordar al niño mantener la boca cerrada durante el descanso y al caminar, de forma amable y sin presión.",
        "Practicar ejercicios de respiración nasal en juegos de soplido o relajación, según indicación del terapeuta.",
      ],
    },
    "Masticación y Hábitos": {
      marcoConceptual: "Una masticación eficiente y la eliminación de hábitos orales nocivos (succión, onicofagia) protegen el desarrollo dental, el tono muscular y el patrón articulatorio.",
      actividadesClinicas: [
        "Observación y registro de la eficacia masticatoria con distintos alimentos sólidos.",
        "Desensibilización y psicoeducación sobre el hábito nocivo: explicar causas y consecuencias al niño.",
        "Actividades de sustitución del hábito: proponer alternativas conductuales y sensoriales.",
        "Registro de frecuencia del hábito diario como línea base para monitorear el progreso.",
      ],
      actividadesHogar: [
        "Ofrecer alimentos que requieran masticación bilateral y diversidad de texturas según el plan terapéutico.",
        "Identificar y registrar los momentos del día en que aparece el hábito nocivo para trabajarlo junto al terapeuta.",
      ],
    },
    "_default": {
      marcoConceptual: "La motricidad orofacial eficiente es la base funcional del habla, la deglución y la respiración; su trabajo complementa directamente la intervención comunicativa.",
      actividadesClinicas: [
        "Ejercicios orofaciales específicos según el área de intervención priorizada.",
        "Registro de simetría, tono y rango de movimiento al inicio y al final de la sesión.",
        "Integración funcional de los ejercicios en actividades comunicativas.",
      ],
      actividadesHogar: [
        "Realizar los ejercicios indicados de forma breve y diaria, integrándolos en la rutina del baño o las comidas.",
        "Observar y reportar al terapeuta cualquier cambio en los patrones de habla, deglución o postura oral.",
      ],
    },
  },

  // ─── Estimulación temprana ────────────────────────────────────────────────────
  "estimulación temprana": {
    "Comunicación y Lenguaje": {
      marcoConceptual: "Las primeras palabras y la comprensión léxica temprana son hitos críticos que predicen el desarrollo lingüístico posterior y la competencia lectora escolar.",
      actividadesClinicas: [
        "Sesiones de juego comentado: el terapeuta narra en tiempo real lo que el niño hace usando lenguaje simple.",
        "Modelado de primeras palabras funcionales en contexto: 'más', 'no', 'ahí', 'mío'.",
        "Actividad de comprensión de vocabulario básico: señalar objetos nombrados en contexto de juego.",
        "Expansión de balbuceo y vocalizaciones hacia combinaciones consonante-vocal significativas.",
      ],
      actividadesHogar: [
        "Hablar continuamente al niño describiendo lo que hacen juntos, usando oraciones cortas y un tono cálido.",
        "Nombrar objetos, personas y acciones del entorno inmediato repetidamente en el contexto natural.",
      ],
    },
    "Atención e Imitación": {
      marcoConceptual: "La atención conjunta y la imitación son los mecanismos fundacionales del aprendizaje social y del desarrollo del lenguaje en los primeros años de vida.",
      actividadesClinicas: [
        "Actividades de atención conjunta con objetos de interés del niño: señalar y nombrar lo que mira.",
        "Juego de imitación en espejo: el terapeuta imita al niño primero, luego invierte el rol.",
        "Actividad de seguimiento de mirada: el terapeuta señala y el niño sigue la dirección con los ojos.",
        "Rutinas de turnos comunicativos con juguetes de causa-efecto que refuerzan la anticipación.",
      ],
      actividadesHogar: [
        "Seguir la mirada y el señalamiento del niño, nombrando lo que mira para crear momentos de atención compartida.",
        "Imitar los sonidos y gestos del niño para establecer turnos comunicativos y modelar la imitación.",
      ],
    },
    "Juego": {
      marcoConceptual: "El juego funcional y simbólico es el principal medio de aprendizaje infantil temprano: a través de él el niño desarrolla lenguaje, cognición y habilidades sociales.",
      actividadesClinicas: [
        "Juego de rutinas funcionales: alimentar a un muñeco, hablar por teléfono, cocinar.",
        "Expandir el juego simbólico del niño añadiendo un nuevo elemento o rol en cada sesión.",
        "Introducir secuencias de juego de dos pasos: desvestir al muñeco y bañarlo.",
        "Registrar el nivel de complejidad del juego espontáneo al inicio y final de sesión.",
      ],
      actividadesHogar: [
        "Dedicar al menos 20 minutos diarios a jugar siguiendo el interés del niño, sin dirigir ni evaluar.",
        "Ofrecer juguetes que promuevan la imaginación: muñecos, autos, elementos de cocina, construcciones simples.",
      ],
    },
    "Vínculo y Sensorial": {
      marcoConceptual: "Un vínculo de apego seguro y una adecuada integración sensorial son las bases del desarrollo emocional, comunicativo y cognitivo en la primera infancia.",
      actividadesClinicas: [
        "Actividades de exploración sensorial con distintas texturas, temperaturas y materiales.",
        "Juegos de contacto regulado: masajes suaves, juegos de persecución, cosquillas con límites claros.",
        "Rutinas predecibles de inicio y cierre de sesión para reforzar la seguridad y el vínculo.",
        "Actividades de integración propioceptiva: saltar, empujar, cargar peso según tolerancia del niño.",
      ],
      actividadesHogar: [
        "Crear rutinas predecibles de afecto —canciones, abrazos, lectura— que refuercen el vínculo y la seguridad.",
        "Explorar distintas texturas y sensaciones en el juego siguiendo el ritmo y las preferencias del niño.",
      ],
    },
    "_default": {
      marcoConceptual: "La estimulación temprana en los primeros años aprovecha la alta plasticidad neuronal para sentar las bases del desarrollo lingüístico, cognitivo y social.",
      actividadesClinicas: [
        "Sesiones de juego libre con materiales variados y comentario continuo del terapeuta.",
        "Actividades de estimulación multisensorial adaptadas al nivel de desarrollo.",
        "Registro de hitos del desarrollo comunicativo y cognitivo alcanzados en cada sesión.",
      ],
      actividadesHogar: [
        "Interactuar con el niño durante todas las rutinas del día: baño, comida, cambio de ropa.",
        "Ofrecer variedad de experiencias sensoriales, sociales y de juego en un entorno seguro y cálido.",
      ],
    },
  },

  // ─── Lectoescritura ──────────────────────────────────────────────────────────
  lectoescritura: {
    "Conciencia Fonológica": {
      marcoConceptual: "La conciencia fonológica —identificar, segmentar y manipular los sonidos del habla— es el predictor más sólido del aprendizaje lector y la prevención de la dislexia.",
      actividadesClinicas: [
        "Segmentación silábica con palmadas y conteo de sílabas en palabras de distinta longitud.",
        "Identificación y producción de rimas: '¿Con qué rima 'sol'?' → 'col', 'rol', 'gol'.",
        "Síntesis fonémica: 'Si digo /m/-/a/-/r/, ¿qué palabra es?'",
        "Manipulación fonémica: omitir, invertir o sustituir un fonema en una palabra dada.",
      ],
      actividadesHogar: [
        "Jugar a separar palabras en sílabas con palmadas durante las comidas o los trayectos en auto.",
        "Buscar palabras que rimen en canciones y cuentos, señalándolas y repitiéndolas con el niño.",
      ],
    },
    "Lectura": {
      marcoConceptual: "La lectura fluida y comprensiva abre el acceso al conocimiento en todas las áreas; su dificultad impacta globalmente el rendimiento académico y la autoestima.",
      actividadesClinicas: [
        "Lectura oral de textos de nivel instruccional con registro de fluidez y precisión (palabras por minuto).",
        "Actividad de comprensión lectora en tres niveles: literal, inferencial y crítico.",
        "Lectura repetida del mismo texto hasta alcanzar fluidez óptima: máximo 3 repeticiones por sesión.",
        "Estrategia de predicción: antes de leer, el niño predice el contenido a partir del título e imágenes.",
      ],
      actividadesHogar: [
        "Leer juntos en voz alta textos del nivel del niño, alternando quién lee cada frase o párrafo.",
        "Después de leer, hacer 1-2 preguntas sobre el texto: '¿Qué pasó primero?' o '¿Por qué crees que hizo eso?'",
      ],
    },
    "Escritura": {
      marcoConceptual: "La escritura integra habilidades fonológicas, ortográficas y expresivas; su desarrollo fortalece simultáneamente la lectura y el pensamiento organizado.",
      actividadesClinicas: [
        "Dictado de palabras y oraciones con los patrones ortográficos trabajados en sesión.",
        "Producción de texto breve con apoyo de mapa de ideas previo: planificación, escritura y revisión.",
        "Actividad de autocorrección: el niño releer su texto y detecta al menos un error con guía del terapeuta.",
        "Escritura colaborativa: terapeuta y niño construyen juntos una oración o párrafo por turnos.",
      ],
      actividadesHogar: [
        "Pedir al niño que escriba listas cotidianas (compras, tareas pendientes) o tarjetas breves para familiares.",
        "Revisar juntos una oración escrita buscando mayúsculas y puntos, sin marcar todos los errores a la vez.",
      ],
    },
    "Comprensión lectora": {
      marcoConceptual: "Comprender lo que se lee va más allá de decodificar: implica construir significado, relacionar ideas e inferir información implícita. Es el pilar del aprendizaje en todas las áreas curriculares.",
      actividadesClinicas: [
        "Lectura guiada de texto breve + preguntas escalonadas: literal → inferencial → valorativa.",
        "Actividad de identificación de idea principal: el niño subraya o enuncia la idea central con y sin apoyo del terapeuta.",
        "Juego de preguntas: terapeuta y niño se turnan para hacer preguntas sobre el texto leído.",
        "Completar un resumen de 2-3 oraciones luego de leer un párrafo, con apoyo decreciente.",
        "Actividad de discriminación: dado un párrafo, clasificar cada oración como 'información importante' o 'detalle secundario'.",
      ],
      actividadesHogar: [
        "Leer juntos un párrafo breve y hacer 2 preguntas: una literal ('¿Qué dice el texto?') y una inferencial ('¿Por qué crees que...?').",
        "Después de leer un cuento, pedir al niño que lo cuente con sus propias palabras focalizándose en la idea principal.",
      ],
    },
    "Producción escrita": {
      marcoConceptual: "Producir texto escrito integra planificación, organización de ideas, ortografía y revisión. Desarrollarla mejora simultáneamente la expresión oral, la comprensión lectora y el pensamiento organizado.",
      actividadesClinicas: [
        "Escritura de oraciones simples (SVO) a partir de imágenes, con foco en estructura y legibilidad.",
        "Actividad de planificación textual: antes de escribir, el niño completa un organizador (inicio / desarrollo / cierre) con ayuda.",
        "Producción de texto breve (3-4 oraciones) sobre una imagen o situación cotidiana; revisar juntos al final.",
        "Dictado selectivo de palabras de alta frecuencia con errores ortográficos frecuentes; trabajar cada error como micro-lección.",
        "Actividad de autocorrección: el niño relee su texto buscando un tipo de error a la vez (mayúsculas, puntos, espaciado).",
      ],
      actividadesHogar: [
        "Pedir al niño que escriba listas breves, mensajes o notas para familiares; reforzar el intento más que el resultado.",
        "Revisar juntos una oración buscando solo un tipo de error (solo puntos, o solo mayúsculas), sin tachar todo.",
      ],
    },
    "Matemática": {
      marcoConceptual: "El pensamiento matemático incluye el sentido numérico, la resolución de problemas y el razonamiento lógico. Fortalecer estas habilidades impacta el rendimiento escolar global y la autonomía cotidiana.",
      actividadesClinicas: [
        "Actividad de correspondencia número-cantidad con objetos concretos o dibujos; aumentar el rango progresivamente.",
        "Resolución de sumas y restas simples con apoyo manipulativo (fichas, regletas) y luego en forma simbólica.",
        "Problemas de enunciado oral de un paso: el niño identifica la operación requerida antes de resolverla.",
        "Actividad de patrones: completar secuencias ABAB y ABB con material concreto; luego con dígitos.",
        "Juego de comparación de cantidades: ordenar de menor a mayor y justificar verbalmente la decisión.",
      ],
      actividadesHogar: [
        "Usar situaciones cotidianas para practicar matemática: repartir cubiertos, contar escalones, calcular el cambio en la tienda.",
        "Practicar conteo regresivo y suma con objetos concretos (frutas, monedas) en momentos de rutina.",
      ],
    },
    "_default": {
      marcoConceptual: "Las habilidades de lectoescritura son el eje del aprendizaje escolar; su fortalecimiento tiene un efecto multiplicador en todas las áreas del currículo.",
      actividadesClinicas: [
        "Actividades de conciencia fonológica, decodificación y comprensión integradas en la sesión.",
        "Registro de velocidad lectora y precisión para monitorear el progreso.",
        "Actividades de escritura funcional con propósito comunicativo real.",
      ],
      actividadesHogar: [
        "Crear un hábito de lectura diaria de al menos 15 minutos en un ambiente tranquilo y sin presión.",
        "Celebrar cada avance en lectura y escritura reforzando el esfuerzo, no solo el resultado.",
      ],
    },
  },
};

// ─── Lookup API ───────────────────────────────────────────────────────────────

import { getGrupo } from "./goal-taxonomy";

/**
 * Returns pre-defined clinical content (marcoConceptual + actividadesClinicas + actividadesHogar)
 * for a given area + optional subarea.
 *
 * Lookup priority:
 *   1. area → grupo (resolved via taxonomy)
 *   2. area → "_default"
 *   3. null (area not found)
 */
export function getClinicalContent(
  area: string | null | undefined,
  subarea?: string | null,
): ClinicalContent | null {
  if (!area) return null;

  const normalizedArea = area.toLowerCase().trim();
  const areaContent = CONTENT[normalizedArea];
  if (!areaContent) return null;

  if (subarea) {
    const grupo = getGrupo(normalizedArea, subarea);
    if (grupo !== "Otras" && areaContent[grupo]) {
      return areaContent[grupo];
    }
  }

  return areaContent["_default"] ?? null;
}
