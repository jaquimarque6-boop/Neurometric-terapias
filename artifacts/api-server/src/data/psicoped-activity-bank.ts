// ─── Banco de actividades psicopedagógicas estructuradas ─────────────────────
// Cada actividad tiene: área, objetivo, materiales, procedimiento paso a paso,
// variante simple y variante compleja.

export interface PsicopedActivity {
  nombre: string;
  area: string;
  objetivo: string;
  materiales: string;
  procedimiento: string;
  varianteSimple: string;
  varianteCompleja: string;
}

export const PSICOPED_ACTIVITIES: PsicopedActivity[] = [

  // ── Comprensión lectora ────────────────────────────────────────────────────
  {
    nombre: "Detectives del texto",
    area: "comprensión lectora",
    objetivo: "Identificar la idea principal en textos breves",
    materiales: "Texto breve (50-100 palabras) impreso o proyectado, marcadores o subrayadores de color",
    procedimiento:
      "1. Leer el texto en voz alta junto al estudiante. " +
      "2. Pedirle que subraye las palabras que se repiten o parecen importantes. " +
      "3. Preguntar: '¿De qué habla todo el texto?' y anotar la respuesta. " +
      "4. Comparar la respuesta con el texto subrayado. " +
      "5. Reformular si es necesario en una sola oración.",
    varianteSimple: "Presentar 3 opciones de idea principal para que el estudiante elija la correcta",
    varianteCompleja: "El estudiante justifica su elección citando evidencia del texto",
  },
  {
    nombre: "Preguntas del lector",
    area: "comprensión lectora",
    objetivo: "Responder preguntas literales luego de lectura guiada",
    materiales: "Cuento corto o párrafo expositivo, tarjetas con preguntas (¿quién?, ¿qué pasó?, ¿cuándo?, ¿dónde?)",
    procedimiento:
      "1. Leer el texto junto al estudiante (lectura compartida). " +
      "2. Mostrar las tarjetas de preguntas una por una. " +
      "3. El estudiante busca la respuesta en el texto (con el texto visible). " +
      "4. Registrar aciertos y señalar en el texto dónde está la respuesta. " +
      "5. Repetir con texto tapado en la siguiente sesión.",
    varianteSimple: "Responder con el texto visible y preguntas de 1 sola respuesta posible",
    varianteCompleja: "Responder sin ver el texto y justificar con sus propias palabras",
  },
  {
    nombre: "Leo y adivino",
    area: "comprensión lectora",
    objetivo: "Inferir información simple a partir de pistas del texto",
    materiales: "Texto con información implícita, hoja de registro",
    procedimiento:
      "1. Leer el texto parando en momentos clave. " +
      "2. Preguntar: '¿Por qué crees que hizo eso?' o '¿Qué sentirá el personaje?'. " +
      "3. Pedir que busquen la pista del texto que les hace pensar eso. " +
      "4. Anotar la inferencia y la pista textual juntas. " +
      "5. Comparar con otros estudiantes o sesiones previas.",
    varianteSimple: "Inferencias sobre emociones de personajes con imágenes de apoyo",
    varianteCompleja: "Inferencias sobre causas y consecuencias en texto expositivo",
  },
  {
    nombre: "El mapa del cuento",
    area: "comprensión lectora",
    objetivo: "Reconocer personajes y secuencia narrativa en cuentos cortos",
    materiales: "Cuento corto (1 página), plantilla de mapa narrativo (quién, dónde, problema, solución)",
    procedimiento:
      "1. Leer el cuento en voz alta. " +
      "2. Completar juntos la plantilla: personajes, lugar, problema, solución. " +
      "3. Ordenar 3-4 viñetas que representan los momentos del cuento. " +
      "4. Narrar el cuento con sus propias palabras usando el mapa. " +
      "5. Evaluar si el resumen es completo.",
    varianteSimple: "Usar viñetas ya secuenciadas y solo nombrar personajes y lugar",
    varianteCompleja: "Elaborar el mapa de un texto leído de forma autónoma y narrar sin apoyo",
  },
  {
    nombre: "¿Qué sirve y qué no?",
    area: "comprensión lectora",
    objetivo: "Diferenciar información relevante de irrelevante en un párrafo breve",
    materiales: "Párrafo con información central y detalles prescindibles, tarjetas de clasificación (importante / no importante)",
    procedimiento:
      "1. Leer el párrafo y enunciar una pregunta guía ('¿Qué quiere explicarnos este texto?'). " +
      "2. Subrayar en verde las ideas que responden la pregunta. " +
      "3. Subrayar en rojo las ideas que no responden la pregunta. " +
      "4. Justificar cada elección. " +
      "5. Reescribir solo las ideas verdes como resumen.",
    varianteSimple: "Párrafo de 3 oraciones con 1 oración claramente irrelevante",
    varianteCompleja: "Texto de 2 párrafos donde la relevancia depende del propósito lector",
  },

  // ── Producción escrita ─────────────────────────────────────────────────────
  {
    nombre: "Armo la oración",
    area: "producción escrita",
    objetivo: "Escribir oraciones con estructura sujeto-verbo-objeto",
    materiales: "Tarjetas con palabras sueltas (sustantivos, verbos, objetos), mesa de trabajo",
    procedimiento:
      "1. Presentar las tarjetas en desorden sobre la mesa. " +
      "2. Pedir que construyan una oración con sentido. " +
      "3. Leer la oración en voz alta para verificar que tiene sentido. " +
      "4. Copiar la oración en el cuaderno. " +
      "5. Crear una segunda oración cambiando una tarjeta.",
    varianteSimple: "3 tarjetas (sujeto-verbo-objeto simple), con imagen de apoyo",
    varianteCompleja: "5 tarjetas incluyendo adjetivo y complemento de lugar",
  },
  {
    nombre: "Mi historia en 3 partes",
    area: "producción escrita",
    objetivo: "Organizar ideas en secuencia lógica (inicio-desarrollo-cierre)",
    materiales: "3 tarjetas de colores (inicio=verde, desarrollo=amarillo, cierre=rojo), imagen disparadora",
    procedimiento:
      "1. Mostrar la imagen y generar ideas juntos oralmente. " +
      "2. Escribir UNA oración en cada tarjeta de color. " +
      "3. Leer las 3 tarjetas en orden: ¿tiene sentido la historia? " +
      "4. Copiar el texto completo en el cuaderno con marcas de inicio y fin. " +
      "5. Revisar: ¿qué pasó primero, en el medio y al final?",
    varianteSimple: "Completar tarjetas con inicio y cierre dados, solo producir el desarrollo",
    varianteCompleja: "Expandir cada tarjeta a 2-3 oraciones y agregar conectores (después, luego, finalmente)",
  },
  {
    nombre: "Corrijo al robot",
    area: "producción escrita",
    objetivo: "Reducir errores ortográficos frecuentes en palabras cotidianas",
    materiales: "Texto breve con 5 errores ortográficos marcados, lista de palabras correctas",
    procedimiento:
      "1. Leer el texto en voz alta (el profesional lo lee con los errores). " +
      "2. Pedir al estudiante que detecte qué 'suena raro' o 'está mal'. " +
      "3. Subrayar cada error encontrado. " +
      "4. Buscar la forma correcta en la lista de palabras. " +
      "5. Reescribir el texto corregido.",
    varianteSimple: "Errores con pista visual (la letra correcta está resaltada en la lista)",
    varianteCompleja: "El estudiante escribe el texto corregido sin lista de palabras de apoyo",
  },
  {
    nombre: "Copio con atención",
    area: "producción escrita",
    objetivo: "Copiar texto breve manteniendo legibilidad",
    materiales: "Texto modelo de 3-4 oraciones impreso, cuaderno, lápiz",
    procedimiento:
      "1. Observar el texto modelo completo por 30 segundos. " +
      "2. Copiar oración por oración (no palabra por palabra). " +
      "3. Al terminar cada oración, verificar mirando el modelo. " +
      "4. Al final, comparar el texto copiado con el original: ¿es legible?, ¿hay errores? " +
      "5. Registrar cuántas palabras necesitó releer.",
    varianteSimple: "Copiar 1 oración sola, con modelo siempre visible",
    varianteCompleja: "Copiar el texto cubriendo el modelo tras leer cada oración",
  },
  {
    nombre: "La imagen habla",
    area: "producción escrita",
    objetivo: "Producir un texto breve (3-4 oraciones) a partir de una imagen",
    materiales: "Imagen clara (escena cotidiana o ilustración de cuento), hoja de borrador",
    procedimiento:
      "1. Observar la imagen en silencio por 1 minuto. " +
      "2. Responder oralmente: ¿quién aparece?, ¿qué está pasando?, ¿dónde? " +
      "3. Dictar internamente (o al profesional) una oración para cada respuesta. " +
      "4. Escribir las 3 oraciones en borrador. " +
      "5. Revisar: ¿cada oración empieza con mayúscula y termina con punto?",
    varianteSimple: "El profesional escribe las oraciones dictadas por el estudiante",
    varianteCompleja: "El estudiante escribe 4-5 oraciones con al menos un conector",
  },

  // ── Atención ──────────────────────────────────────────────────────────────
  {
    nombre: "Encuentra el error",
    area: "atención",
    objetivo: "Atención selectiva: detectar diferencias o errores en estímulos visuales",
    materiales: "Hoja con 10 estímulos visuales (letras, números, figuras), algunos con error intencional",
    procedimiento:
      "1. Presentar la hoja y explicar: 'Hay X elementos con un error, buscalos'. " +
      "2. El estudiante revisa y marca los errores con lápiz. " +
      "3. Registrar tiempo empleado y cantidad de aciertos/omisiones. " +
      "4. Revisar juntos los errores encontrados y perdidos. " +
      "5. Registrar el desempeño para comparar entre sesiones.",
    varianteSimple: "5 estímulos, errores obvios (letra dada vuelta), sin límite de tiempo",
    varianteCompleja: "20 estímulos con distractores, errores sutiles, tiempo limitado (2 min)",
  },
  {
    nombre: "El reloj de la tarea",
    area: "atención",
    objetivo: "Mantener atención sostenida durante tarea estructurada por tiempo acotado",
    materiales: "Timer visible, tarea con inicio y fin claros (ejercicio del cuaderno), hoja de registro",
    procedimiento:
      "1. Mostrar el timer y explicar: 'Trabajamos 10 minutos sin parar'. " +
      "2. Iniciar el timer al mismo tiempo que la tarea. " +
      "3. El profesional observa sin intervenir, registrando interrupciones voluntarias. " +
      "4. Al sonar el timer, marcar cuánto completó el estudiante. " +
      "5. Reflexionar: '¿Cuántas veces te distraíste? ¿Qué te distrajo?'",
    varianteSimple: "5 minutos con tarea de alta preferencia del estudiante",
    varianteCompleja: "15 minutos con tarea de dificultad media en contexto con leve ruido",
  },
  {
    nombre: "Sigo el código",
    area: "atención",
    objetivo: "Seguir consignas de 2 pasos sin ayuda",
    materiales: "Tarjetas con consignas escritas en 2 pasos ('Primero X, después Y'), materiales de cada consigna",
    procedimiento:
      "1. Leer la consigna en voz alta UNA sola vez. " +
      "2. Pedir al estudiante que repita los 2 pasos antes de ejecutarlos. " +
      "3. Ejecutar la tarea sin volver a leer la tarjeta. " +
      "4. Evaluar si realizó ambos pasos en el orden correcto. " +
      "5. Si falló, repetir con apoyo visual (imagen de cada paso).",
    varianteSimple: "Consignas con apoyo visual (imagen de cada paso) y pasos muy distintos entre sí",
    varianteCompleja: "Consignas de 3 pasos sin apoyo visual, con intervalo de 30 segundos antes de ejecutar",
  },
  {
    nombre: "Termino lo que empiezo",
    area: "atención",
    objetivo: "Completar una tarea de inicio a fin sin abandonarla",
    materiales: "Tarea corta estructurada con inicio y fin visibles (puzzle, hoja de ejercicios con 5 ítems), hoja de autorregistro",
    procedimiento:
      "1. Mostrar la tarea completa y decir: 'Cuando termines todo, avisame'. " +
      "2. El estudiante trabaja de forma independiente. " +
      "3. El profesional registra si pide ayuda, se levanta o abandona. " +
      "4. Al terminar, el estudiante marca una estrella en su hoja de autorregistro. " +
      "5. Reflexionar: '¿Qué te ayudó a terminar? ¿Qué dificultó?'",
    varianteSimple: "3 ítems, tarea de alta preferencia, profesional cerca",
    varianteCompleja: "8 ítems, tarea de dificultad media, profesional en otro lado de la sala",
  },
  {
    nombre: "Luz verde, luz roja",
    area: "atención",
    objetivo: "Responder a señales de inicio y cierre de actividad",
    materiales: "Tarjeta verde (inicio) y roja (cierre), tarea simple",
    procedimiento:
      "1. Explicar el código: tarjeta verde = empezá, tarjeta roja = pará. " +
      "2. Presentar la tarea, sin que el estudiante empiece. " +
      "3. Mostrar la tarjeta verde: el estudiante comienza. " +
      "4. Mostrar la tarjeta roja en distintos momentos: el estudiante debe parar inmediatamente. " +
      "5. Registrar la latencia de respuesta (cuánto tarda en parar o empezar).",
    varianteSimple: "Señales cada 2 minutos, tarea de preferencia alta",
    varianteCompleja: "Señales impredecibles (30 seg a 3 min), tarea de dificultad media, sin explicación previa",
  },

  // ── Funciones ejecutivas ──────────────────────────────────────────────────
  {
    nombre: "Planifico y hago",
    area: "funciones ejecutivas",
    objetivo: "Planificar los pasos para resolver una tarea antes de ejecutarla",
    materiales: "Tarea estructurada (armar algo, resolver un problema de 3 pasos), tiras de papel para escribir los pasos",
    procedimiento:
      "1. Mostrar la tarea sin explicar cómo hacerla. " +
      "2. Pedir al estudiante que anote en tiras los pasos que haría ANTES de empezar. " +
      "3. Ordenar las tiras en secuencia lógica. " +
      "4. Ejecutar la tarea siguiendo el plan escrito. " +
      "5. Evaluar: ¿el plan fue útil? ¿cambiarían algo?",
    varianteSimple: "3 tiras ya escritas para ordenar (no crear), tarea de 2 pasos",
    varianteCompleja: "El estudiante planifica una tarea escolar real (ej: cómo estudiar para un examen)",
  },
  {
    nombre: "Todo listo antes de empezar",
    area: "funciones ejecutivas",
    objetivo: "Organizar los materiales necesarios antes de iniciar una actividad",
    materiales: "Lista de materiales necesarios para una tarea (dibujo o texto), los materiales reales, mesa despejada",
    procedimiento:
      "1. Mostrar la lista de materiales necesarios para la tarea. " +
      "2. El estudiante busca y coloca cada material sobre la mesa. " +
      "3. Verificar juntos si está todo lo necesario. " +
      "4. Recién entonces comenzar la tarea. " +
      "5. Reflexionar: '¿Encontraste todo? ¿Qué pasaría si faltara algo?'",
    varianteSimple: "3 materiales, todos visibles en el entorno, lista con imágenes",
    varianteCompleja: "5 materiales que deben buscarse en distintos lugares, lista solo en texto",
  },
  {
    nombre: "Paro y pienso",
    area: "funciones ejecutivas",
    objetivo: "Inhibir respuestas impulsivas ante estímulos distractores",
    materiales: "Tarea con estímulos distractor intercalados (ej: señal de STOP), hoja de registro",
    procedimiento:
      "1. Explicar la regla: 'Si ves la señal STOP, no respondás esa'. " +
      "2. Presentar una serie de ítems (palabras, números, figuras) a responder. " +
      "3. Intercalar señales STOP en las que NO debe responder. " +
      "4. Registrar errores de inhibición (respondió cuando no debía). " +
      "5. Reflexionar sobre la estrategia ('¿qué te ayudó a frenar?').",
    varianteSimple: "Señales STOP evidentes (muy distintas del resto), ritmo lento",
    varianteCompleja: "Señales STOP similares a los ítems normales, ritmo más rápido",
  },
  {
    nombre: "Reviso antes de entregar",
    area: "funciones ejecutivas",
    objetivo: "Revisar la propia producción antes de darla por terminada",
    materiales: "Lista de verificación (checklist) con criterios de revisión, producción escrita del estudiante",
    procedimiento:
      "1. El estudiante termina su tarea de escritura. " +
      "2. Presentar el checklist: ¿tiene punto final?, ¿mayúsculas al inicio?, ¿se entiende? " +
      "3. El estudiante revisa su texto ítem por ítem. " +
      "4. Hace correcciones en lápiz de otro color. " +
      "5. Firma el checklist cuando está conforme.",
    varianteSimple: "Checklist de 2 criterios, con ejemplo de cómo se ve cada uno",
    varianteCompleja: "Checklist de 5 criterios para revisar tanto contenido como forma",
  },
  {
    nombre: "Pruebo otro camino",
    area: "funciones ejecutivas",
    objetivo: "Cambiar de estrategia cuando la primera no funciona",
    materiales: "Problema o rompecabezas con más de una forma de resolverse, hoja de registro de estrategias",
    procedimiento:
      "1. Presentar el problema y pedir que lo resuelvan. " +
      "2. Si se bloquean, preguntar: '¿Esa estrategia está funcionando?'. " +
      "3. Invitar a pensar en otra forma de hacerlo y anotarla. " +
      "4. Intentar la nueva estrategia. " +
      "5. Comparar ambas estrategias: '¿Cuál funcionó mejor y por qué?'",
    varianteSimple: "El profesional sugiere la estrategia alternativa, el estudiante la ejecuta",
    varianteCompleja: "El estudiante genera 2 estrategias alternativas de forma autónoma antes de elegir",
  },

  // ── Memoria ───────────────────────────────────────────────────────────────
  {
    nombre: "Memoria visual",
    area: "memoria",
    objetivo: "Retener y evocar información visual presentada brevemente",
    materiales: "6-10 tarjetas con imágenes de objetos cotidianos, bandeja o mesa",
    procedimiento:
      "1. Presentar las tarjetas en la mesa por 30 segundos. " +
      "2. Cubrir las tarjetas. " +
      "3. Pedir que nombren todo lo que recuerdan. " +
      "4. Destapar y verificar juntos. " +
      "5. Registrar cantidad recordada y estrategia usada ('¿Cómo lo hiciste para recordar?').",
    varianteSimple: "4 tarjetas, 1 minuto de exposición, sin límite de tiempo para evocar",
    varianteCompleja: "10 tarjetas, 20 segundos de exposición, evocar en orden (primero visto, último visto)",
  },
  {
    nombre: "El camino de la historia",
    area: "memoria",
    objetivo: "Evocar información trabajada en la sesión anterior",
    materiales: "Hoja de registro de sesión anterior (resumen breve), preguntas guía",
    procedimiento:
      "1. Al inicio de la sesión, preguntar: '¿Qué trabajamos la última vez?'. " +
      "2. El estudiante intenta evocar sin apoyo. " +
      "3. Anotar lo que recuerda correctamente. " +
      "4. Completar lo que faltó con preguntas cerradas ('¿Trabajamos lectura o escritura?'). " +
      "5. Conectar con la tarea de hoy: '¿Cómo se relaciona con lo que hicimos?'",
    varianteSimple: "Mostrar una imagen clave de la sesión anterior como pista",
    varianteCompleja: "Evocar con detalle: qué hicieron, qué les costó, qué lograron",
  },
  {
    nombre: "Sigo las instrucciones",
    area: "memoria",
    objetivo: "Retener consignas simples sin apoyo visual",
    materiales: "Lista de consignas preparadas (de 1 a 3 pasos), materiales de la actividad",
    procedimiento:
      "1. Dar la consigna verbalmente (sin mostrar nada escrito). " +
      "2. Pedir que el estudiante repita la consigna con sus palabras antes de ejecutar. " +
      "3. El estudiante ejecuta la tarea. " +
      "4. Registrar si necesitó que se repita o pedir aclaración. " +
      "5. Reflexionar sobre qué estrategia usó para recordar.",
    varianteSimple: "Consigna de 1 paso, acción inmediata, repetición permitida 1 vez",
    varianteCompleja: "Consigna de 3 pasos, espera de 1 minuto antes de ejecutar, sin repetición",
  },
  {
    nombre: "Par o no par",
    area: "memoria",
    objetivo: "Asociar imágenes y palabras mediante memoria de pares",
    materiales: "8 tarjetas con imagen y 8 tarjetas con la palabra correspondiente, boca abajo en la mesa",
    procedimiento:
      "1. Barajar y disponer las 16 tarjetas boca abajo. " +
      "2. Por turnos, dar vuelta 2 tarjetas buscando el par imagen-palabra. " +
      "3. Si hay par, retirarlas; si no, volver a tapar. " +
      "4. Al final, contar pares encontrados y registrar. " +
      "5. Reflexionar: '¿Cómo recordabas dónde estaba cada tarjeta?'",
    varianteSimple: "6 pares con imágenes muy distintas entre sí, mayor tiempo entre turnos",
    varianteCompleja: "12 pares con palabras similares (categoría semántica), turnos rápidos",
  },
  {
    nombre: "¿Qué dijo hace un momento?",
    area: "memoria",
    objetivo: "Recordar instrucciones luego de un intervalo breve",
    materiales: "Consigna verbal o escrita, actividad distractor (30-60 segundos), hoja de registro",
    procedimiento:
      "1. Dar la instrucción con claridad ('Escuchá bien porque en un rato te voy a preguntar'). " +
      "2. Realizar una actividad distractor de 30-60 segundos (contar hasta 20, canción breve). " +
      "3. Preguntar: '¿Qué te pedí antes?'. " +
      "4. El estudiante evoca la instrucción. " +
      "5. Ejecutar la tarea recordada y verificar si era correcta.",
    varianteSimple: "Intervalo de 10 segundos, instrucción de 1 paso",
    varianteCompleja: "Intervalo de 3 minutos con actividad distractor compleja, instrucción de 2 pasos",
  },

  // ── Matemática ────────────────────────────────────────────────────────────
  {
    nombre: "Sumas con fichas",
    area: "matemática",
    objetivo: "Resolver sumas simples con apoyo visual concreto",
    materiales: "Fichas o monedas de colores, tarjetas con sumas escritas (hasta 10), hoja de registro",
    procedimiento:
      "1. Presentar la suma escrita (ej: 3 + 4). " +
      "2. El estudiante coloca fichas para cada número. " +
      "3. Contar todas las fichas juntas para obtener el resultado. " +
      "4. Escribir el resultado en la tarjeta. " +
      "5. Repetir con 5 sumas distintas, registrando aciertos.",
    varianteSimple: "Sumas hasta 5, fichas de un solo color, resultado escrito por el profesional",
    varianteCompleja: "Sumas hasta 20, fichas de dos colores (una por sumando), el estudiante anota el resultado",
  },
  {
    nombre: "¿Cuántos hay?",
    area: "matemática",
    objetivo: "Comprender la relación número-cantidad hasta 20",
    materiales: "Objetos concretos (fichas, cubos, frijoles), tarjetas con números del 1 al 20",
    procedimiento:
      "1. Mostrar una tarjeta con un número. " +
      "2. El estudiante coloca la cantidad de objetos que corresponde. " +
      "3. El profesional cuenta en voz alta con el estudiante para verificar. " +
      "4. Invertir: el profesional pone objetos y el estudiante elige la tarjeta. " +
      "5. Registrar errores de más de 2 unidades.",
    varianteSimple: "Números del 1 al 10, objetos grandes y fáciles de contar",
    varianteCompleja: "Números del 1 al 20, contar objetos pequeños en grupos de 5",
  },
  {
    nombre: "¿Qué viene después?",
    area: "matemática",
    objetivo: "Identificar y continuar patrones simples",
    materiales: "Tiras con patrones de colores, formas o números (ABAB, AABB, ABC), piezas sueltas para completar",
    procedimiento:
      "1. Mostrar la tira con el patrón incompleto. " +
      "2. Preguntar: '¿Ves cómo se repite? ¿Qué vendría después?'. " +
      "3. El estudiante coloca la pieza correcta para continuar. " +
      "4. Extender el patrón 3 elementos más. " +
      "5. El estudiante crea su propio patrón para que el profesional lo continúe.",
    varianteSimple: "Patrón ABAB con dos colores, piezas muy distintas entre sí",
    varianteCompleja: "Patrón numérico (2, 4, 6, ...) o AABB con 3 elementos distintos",
  },
  {
    nombre: "El problema del día",
    area: "matemática",
    objetivo: "Resolver problemas matemáticos básicos con guía paso a paso",
    materiales: "Problema escrito con imagen de apoyo, tiras de pasos (¿qué sé?, ¿qué me piden?, ¿cómo lo resuelvo?), lápiz",
    procedimiento:
      "1. Leer el problema juntos en voz alta. " +
      "2. Responder la tira '¿qué sé?': anotar los datos del problema. " +
      "3. Responder '¿qué me piden?': anotar la pregunta del problema. " +
      "4. Elegir la operación o estrategia y resolver. " +
      "5. Verificar la respuesta con una segunda lectura del problema.",
    varianteSimple: "Problema de 1 operación con datos numéricos pequeños y apoyo de dibujo",
    varianteCompleja: "Problema de 2 pasos con datos numéricos medianos, sin imagen",
  },
  {
    nombre: "Organizo los datos",
    area: "matemática",
    objetivo: "Organizar información numérica en tabla o gráfico simple",
    materiales: "Conjunto de datos simples (ej: cantidad de frutas por color), tabla en blanco, lápiz de color",
    procedimiento:
      "1. Presentar los datos en desorden (tarjetas o lista). " +
      "2. El estudiante clasifica los datos en la tabla (una categoría por columna). " +
      "3. Contar y anotar los totales. " +
      "4. Colorear un gráfico de barras con los totales. " +
      "5. Leer juntos el gráfico: '¿Cuál tiene más? ¿Cuál tiene menos?'",
    varianteSimple: "2 categorías, 5 datos totales, tabla ya estructurada",
    varianteCompleja: "4 categorías, 20 datos, el estudiante diseña la tabla y el gráfico",
  },

  // ── Estrategias de aprendizaje ────────────────────────────────────────────
  {
    nombre: "El mapa de lo que sé",
    area: "estrategias de aprendizaje",
    objetivo: "Organizar conocimientos previos y nuevos mediante mapa conceptual",
    materiales: "Hoja en blanco o plantilla de mapa conceptual, marcadores de 2 colores, texto o tema trabajado",
    procedimiento:
      "1. Escribir el tema en el centro del mapa. " +
      "2. Anotar todo lo que ya sabe (en azul) en ramas alrededor. " +
      "3. Leer o trabajar el contenido nuevo de la sesión. " +
      "4. Agregar las ideas nuevas (en verde) al mapa. " +
      "5. Conectar ideas con flechas y palabras de enlace.",
    varianteSimple: "Mapa de 3 nodos con preguntas guía escritas, el estudiante completa espacios",
    varianteCompleja: "El estudiante construye el mapa desde cero y lo explica en voz alta",
  },
  {
    nombre: "El resumen paso a paso",
    area: "estrategias de aprendizaje",
    objetivo: "Seleccionar información clave y resumirla con sus propias palabras",
    materiales: "Texto de 1-2 párrafos, hoja de resumen con estructura (tema / ideas principales / conclusión)",
    procedimiento:
      "1. Leer el texto. " +
      "2. Subrayar con lápiz las ideas que parecen más importantes. " +
      "3. Tapar el texto y escribir las ideas subrayadas con sus propias palabras. " +
      "4. Comparar el resumen con el texto: ¿falta algo importante? " +
      "5. Completar o corregir el resumen.",
    varianteSimple: "El profesional subraya el texto; el estudiante solo reescribe en sus palabras",
    varianteCompleja: "El estudiante resume sin subrayar, luego verifica contra el texto",
  },
  {
    nombre: "Me preparo para estudiar",
    area: "estrategias de aprendizaje",
    objetivo: "Planificar el tiempo y los pasos para estudiar un tema",
    materiales: "Agenda o planilla de estudio semanal, tema a estudiar, lista de materiales",
    procedimiento:
      "1. Identificar el tema y la fecha del examen o entrega. " +
      "2. Hacer una lista de lo que hay que estudiar o preparar. " +
      "3. Distribuir las tareas en los días disponibles (cuánto por día). " +
      "4. Definir el entorno de estudio: ¿dónde?, ¿a qué hora?, ¿con qué materiales? " +
      "5. Comprometerse verbalmente con el plan y anotarlo.",
    varianteSimple: "El profesional guía cada paso del plan; el estudiante elige y confirma",
    varianteCompleja: "El estudiante elabora el plan de forma autónoma para dos materias distintas",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getActivitiesByArea(area: string): PsicopedActivity[] {
  const normalized = area.toLowerCase().trim();
  return PSICOPED_ACTIVITIES.filter(a => a.area === normalized);
}

export function getTopActivitiesByArea(area: string, n = 3): PsicopedActivity[] {
  return getActivitiesByArea(area).slice(0, n);
}

export function formatActivitiesForPrompt(activities: PsicopedActivity[]): string {
  if (activities.length === 0) return "";
  return activities.map(a =>
    `ACTIVIDAD: ${a.nombre}\n` +
    `Área: ${a.area}\n` +
    `Objetivo: ${a.objetivo}\n` +
    `Materiales: ${a.materiales}\n` +
    `Procedimiento: ${a.procedimiento}\n` +
    `Variante simple: ${a.varianteSimple}\n` +
    `Variante compleja: ${a.varianteCompleja}`
  ).join("\n\n");
}

export const PSICOPED_AREAS = [
  "comprensión lectora",
  "producción escrita",
  "atención",
  "funciones ejecutivas",
  "memoria",
  "matemática",
  "estrategias de aprendizaje",
] as const;
