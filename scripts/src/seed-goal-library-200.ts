import { db } from "@workspace/db";
import { goalLibraryTable } from "@workspace/db/schema";

type G = {
  idObjetivo: string;
  nombreObjetivo: string;
  modulo: string;
  area: string;
  areaClinica: string;
  subarea: string;
  franjaEtaria: string;
  franjaEtariaMin: number;
  franjaEtariaMax: number;
  nivelDificultad: "básico" | "intermedio" | "avanzado";
  estadoBanco: "activo";
  definicionOperativa: string;
};

const GOALS: G[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // LENGUAJE — LN  (60 objetivos)
  // Subareas: COM · EXP · NAR · VOC · GRM · PRG
  // ═══════════════════════════════════════════════════════════════════════

  // ── LN — Comprensión (COM) ─────────────────────────────────────────────
  { idObjetivo:"LN-2-4-COM-B-01", nombreObjetivo:"Comprender el nombre de partes del cuerpo",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Comprensión",
    franjaEtaria:"2-4", franjaEtariaMin:2, franjaEtariaMax:4, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente señalará correctamente al menos 10 partes del cuerpo (cabeza, ojos, nariz, boca, manos, pies, barriga, orejas, pelo, piernas) al escuchar su nombre, con un 80 % de aciertos." },

  { idObjetivo:"LN-2-4-COM-B-02", nombreObjetivo:"Identificar objetos del entorno familiar por su nombre",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Comprensión",
    franjaEtaria:"2-4", franjaEtariaMin:2, franjaEtariaMax:4, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente señalará o tomará el objeto nombrado por el terapeuta dentro de un set de 4 objetos del hogar, logrando el 80 % de aciertos en 20 ítems." },

  { idObjetivo:"LN-2-4-COM-B-03", nombreObjetivo:"Comprender conceptos de cantidad: uno y muchos",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Comprensión",
    franjaEtaria:"2-4", franjaEtariaMin:2, franjaEtariaMax:4, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente diferenciará entre 'uno' y 'muchos' al manipular objetos concretos, entregando la cantidad indicada con un 80 % de precisión." },

  { idObjetivo:"LN-4-6-COM-B-01", nombreObjetivo:"Comprender preguntas ¿quién?, ¿qué? y ¿dónde? en relatos escuchados",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Comprensión",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"Tras escuchar un relato breve de 5-7 oraciones, el paciente responderá correctamente preguntas de tipo ¿quién?, ¿qué hizo? y ¿dónde? en el 80 % de los casos." },

  { idObjetivo:"LN-4-6-COM-B-02", nombreObjetivo:"Comprender conceptos espaciales básicos: arriba, abajo, dentro, fuera",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Comprensión",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente colocará un objeto en la posición indicada verbalmente (arriba de la caja, dentro del aro) con un 80 % de aciertos en 20 consignas." },

  { idObjetivo:"LN-4-6-COM-B-03", nombreObjetivo:"Comprender conceptos temporales: antes, ahora y después",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Comprensión",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente ordenará y responderá sobre secuencias de 3 eventos cotidianos usando los conceptos antes, ahora y después con un 75 % de precisión." },

  { idObjetivo:"LN-4-6-COM-M-01", nombreObjetivo:"Comprender instrucciones con negación y condición simple",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Comprensión",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente ejecutará instrucciones que incluyan negación ('no toques el rojo') y condición simple ('si la ficha es azul, ponla aquí') con un 80 % de aciertos." },

  { idObjetivo:"LN-4-6-COM-M-02", nombreObjetivo:"Comprender oraciones en voz pasiva simple",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Comprensión",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente señalará la imagen correcta que corresponde a una oración en voz pasiva ('el perro es perseguido por el gato') en el 75 % de los ítems de un set de 20." },

  { idObjetivo:"LN-6-8-COM-M-01", nombreObjetivo:"Comprender textos narrativos respondiendo preguntas literales e inferenciales",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Comprensión",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"Tras escuchar un texto narrativo de nivel escolar, el paciente responderá 4 preguntas literales y 2 inferenciales con un 80 % de aciertos." },

  { idObjetivo:"LN-6-8-COM-M-02", nombreObjetivo:"Comprender doble sentido y ambigüedad léxica en oraciones",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Comprensión",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente explicará las dos interpretaciones posibles de palabras con doble sentido en contexto oracional con un 75 % de aciertos en 12 ítems." },

  { idObjetivo:"LN-6-8-COM-M-03", nombreObjetivo:"Comprender textos expositivos breves extrayendo idea principal",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Comprensión",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"Tras leer un texto expositivo de 100-150 palabras, el paciente identificará la idea principal y dos ideas secundarias con un 80 % de precisión." },

  { idObjetivo:"LN-6-8-COM-A-01", nombreObjetivo:"Realizar inferencias elaborativas en textos complejos",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Comprensión",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente generará inferencias elaborativas (predicciones, explicaciones) a partir de textos de ficción y no ficción con justificación coherente en el 75 % de los ítems." },

  { idObjetivo:"LN-6-8-COM-A-02", nombreObjetivo:"Comprender lenguaje figurado en contextos humorísticos",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Comprensión",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente explicará el significado de chistes y juegos de palabras identificando el elemento inesperado que genera el humor, con un 75 % de aciertos en 8 ítems." },

  { idObjetivo:"LN-8-10-COM-M-01", nombreObjetivo:"Comprender textos argumentativos identificando posición y argumentos",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Comprensión",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"Tras leer un texto argumentativo, el paciente identificará la posición del autor y al menos 2 argumentos que la sostienen, con un 80 % de precisión." },

  { idObjetivo:"LN-8-10-COM-M-02", nombreObjetivo:"Sintetizar información de múltiples fuentes orales en un resumen",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Comprensión",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente escuchará dos fuentes de información sobre el mismo tema y sintetizará los puntos clave en un resumen oral coherente de al menos 5 oraciones." },

  { idObjetivo:"LN-8-10-COM-A-01", nombreObjetivo:"Evaluar críticamente el contenido y la forma de un discurso escuchado",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Comprensión",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente identificará puntos fuertes y débiles de un discurso escuchado y expresará una evaluación justificada usando lenguaje valorativo apropiado." },

  // ── LN — Lenguaje Expresivo (EXP) ─────────────────────────────────────
  { idObjetivo:"LN-2-4-EXP-B-01", nombreObjetivo:"Producir holofrasas para expresar intenciones comunicativas",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Lenguaje expresivo",
    franjaEtaria:"2-4", franjaEtariaMin:2, franjaEtariaMax:4, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente producirá palabras aisladas con función de frase (agua para pedir, no para rechazar, papá para llamar) en contextos funcionales en el 75 % de las oportunidades comunicativas." },

  { idObjetivo:"LN-2-4-EXP-B-02", nombreObjetivo:"Producir combinaciones de dos palabras para pedir y comentar",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Lenguaje expresivo",
    franjaEtaria:"2-4", franjaEtariaMin:2, franjaEtariaMax:4, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente producirá al menos 10 combinaciones distintas de dos palabras de forma espontánea (más jugo, papá come, pelota aquí) durante sesiones de juego libre." },

  { idObjetivo:"LN-2-4-EXP-B-03", nombreObjetivo:"Denominar imágenes de objetos, animales y personas del entorno cercano",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Lenguaje expresivo",
    franjaEtaria:"2-4", franjaEtariaMin:2, franjaEtariaMax:4, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente nombrará correctamente al menos 20 imágenes de objetos, animales y personas del entorno cotidiano cuando se le presenten sin apoyo, con un 80 % de precisión." },

  { idObjetivo:"LN-4-6-EXP-B-01", nombreObjetivo:"Producir frases de 3-4 palabras describiendo imágenes",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Lenguaje expresivo",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente producirá frases de al menos 3 palabras (la niña come manzana) al describir imágenes de situaciones, en el 80 % de las oportunidades con modelos disponibles." },

  { idObjetivo:"LN-4-6-EXP-B-02", nombreObjetivo:"Responder preguntas simples con oraciones completas",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Lenguaje expresivo",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente responderá preguntas ¿qué?, ¿quién?, ¿dónde? con oraciones completas de al menos 3 palabras sin reducir a respuestas de una sola palabra, en el 75 % de los intentos." },

  { idObjetivo:"LN-4-6-EXP-M-01", nombreObjetivo:"Describir un evento cotidiano usando oraciones coordinadas",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Lenguaje expresivo",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente describirá un evento (cómo fue el recreo, qué hizo el fin de semana) usando al menos 3 oraciones coordinadas con 'y', 'pero' o 'entonces' de forma espontánea." },

  { idObjetivo:"LN-4-6-EXP-M-02", nombreObjetivo:"Formular preguntas para obtener información desconocida",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Lenguaje expresivo",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente formulará preguntas con ¿por qué?, ¿cómo? y ¿cuándo? de forma espontánea para obtener información que desconoce, al menos 3 preguntas distintas por sesión." },

  { idObjetivo:"LN-6-8-EXP-M-01", nombreObjetivo:"Describir procedimientos en secuencia lógica paso a paso",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Lenguaje expresivo",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente explicará cómo realizar una actividad conocida (preparar un sándwich, jugar a un juego) usando al menos 4 pasos ordenados con marcadores secuenciales (primero, luego, después, finalmente)." },

  { idObjetivo:"LN-6-8-EXP-M-02", nombreObjetivo:"Expresar opiniones y justificarlas con argumentos simples",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Lenguaje expresivo",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente expresará su opinión sobre un tema y la justificará con al menos 2 razones coherentes usando la estructura 'creo que... porque...' en el 75 % de las oportunidades." },

  { idObjetivo:"LN-6-8-EXP-A-01", nombreObjetivo:"Producir discurso oral estructurado sobre un tema de interés por 3 minutos",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Lenguaje expresivo",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente expondrá un tema de su elección durante 3 minutos con introducción, desarrollo de al menos 3 puntos y conclusión, usando vocabulario preciso y manteniendo la cohesión temática." },

  { idObjetivo:"LN-8-10-EXP-A-01", nombreObjetivo:"Presentar un argumento oral con evidencias y refutación",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Lenguaje expresivo",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente presentará un argumento oral con al menos 3 evidencias que lo sostengan y anticipará y refutará una posible objeción, usando conectores argumentativos apropiados." },

  // ── LN — Narrativo (NAR) ───────────────────────────────────────────────
  { idObjetivo:"LN-4-6-NAR-B-01", nombreObjetivo:"Secuenciar 3 imágenes de una historia y verbalizarlas en orden",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Narrativo",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente ordenará 3 imágenes de una secuencia narrativa y narrará lo que ocurre en cada una con al menos una oración por imagen y orden temporal correcto." },

  { idObjetivo:"LN-4-6-NAR-B-02", nombreObjetivo:"Retell de un cuento corto después de escucharlo",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Narrativo",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"Tras escuchar un cuento de 5-7 oraciones, el paciente lo relatará incluyendo al menos el personaje principal, la acción central y el desenlace, con apoyo de preguntas guía si es necesario." },

  { idObjetivo:"LN-4-6-NAR-M-01", nombreObjetivo:"Narrar cuentos con estructura completa: personaje, problema y resolución",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Narrativo",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente narrará una historia a partir de imágenes o de forma espontánea incluyendo al menos: presentación del personaje, descripción de un problema y su resolución, usando conectores temporales básicos." },

  { idObjetivo:"LN-6-8-NAR-M-01", nombreObjetivo:"Narrar experiencias con perspectiva emocional de los personajes",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Narrativo",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente narrará una experiencia personal o cuento incluyendo referencias a los estados internos (emociones, pensamientos, deseos) de al menos un personaje en el 75 % de las narrativas." },

  { idObjetivo:"LN-6-8-NAR-M-02", nombreObjetivo:"Producir narrativas con estructura completa de episodio múltiple",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Narrativo",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente narrará historias con al menos 2 episodios, cada uno con su propio inicio, problema y resolución, usando conectores causales y temporales para vincularlos." },

  { idObjetivo:"LN-6-8-NAR-A-01", nombreObjetivo:"Crear narraciones originales con tema, tono y audiencia definidos",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Narrativo",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente creará una historia original adecuando el tipo de narración (cuento, relato de aventuras, historia de miedo) al oyente, con vocabulario y tono coherentes con la temática." },

  { idObjetivo:"LN-6-8-NAR-A-02", nombreObjetivo:"Analizar la estructura narrativa de textos literarios escuchados",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Narrativo",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente identificará y comentará los elementos estructurales (inicio, conflicto, clímax, desenlace) y los recursos literarios (personificación, hipérbole) de cuentos escuchados." },

  { idObjetivo:"LN-8-10-NAR-A-01", nombreObjetivo:"Producir narraciones con voz narrativa consistente y recursos literarios",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Narrativo",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente producirá narraciones orales o escritas manteniendo una voz narrativa consistente e incorporando al menos 2 recursos literarios (comparación, metáfora, repetición) de forma intencional." },

  { idObjetivo:"LN-8-10-NAR-A-02", nombreObjetivo:"Recontar y transformar textos narrativos cambiando el punto de vista",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Narrativo",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente recontará un cuento conocido desde la perspectiva de un personaje secundario, ajustando la información disponible y las actitudes del narrador de forma coherente." },

  // ── LN — Vocabulario (VOC) ─────────────────────────────────────────────
  { idObjetivo:"LN-2-4-VOC-B-01", nombreObjetivo:"Adquirir vocabulario de palabras de acción (verbos de alta frecuencia)",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Vocabulario",
    franjaEtaria:"2-4", franjaEtariaMin:2, franjaEtariaMax:4, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente nombrará y ejecutará al menos 15 verbos de acción frecuentes (correr, saltar, comer, dormir, beber, jugar, cantar, bailar, lavar, dibujar, leer, empujar, tirar, abrir, cerrar) al ser mostrados." },

  { idObjetivo:"LN-2-4-VOC-B-02", nombreObjetivo:"Comprender y usar palabras de los campos semánticos básicos",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Vocabulario",
    franjaEtaria:"2-4", franjaEtariaMin:2, franjaEtariaMax:4, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente reconocerá y usará al menos 5 palabras de cada uno de 4 campos semánticos (alimentos, animales, ropa, juguetes) tanto para señalar como para nombrar." },

  { idObjetivo:"LN-4-6-VOC-B-01", nombreObjetivo:"Usar adjetivos descriptivos de tamaño, color y forma",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Vocabulario",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente usará adjetivos de tamaño (grande/pequeño), color (8 colores básicos) y forma (redondo, cuadrado, triangular) correctamente al describir objetos, con un 80 % de precisión." },

  { idObjetivo:"LN-4-6-VOC-B-02", nombreObjetivo:"Adquirir vocabulario de emociones básicas",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Vocabulario",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente nombrará y reconocerá en expresiones faciales al menos 6 emociones básicas (feliz, triste, enojado, asustado, sorprendido, disgustado) con un 80 % de aciertos." },

  { idObjetivo:"LN-4-6-VOC-M-01", nombreObjetivo:"Usar vocabulario relacional: comparativos y superlativos",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Vocabulario",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente usará comparativos (más grande que, más rápido que) y superlativos (el más alto, la más pequeña) correctamente al comparar objetos o imágenes, con un 75 % de precisión." },

  { idObjetivo:"LN-6-8-VOC-M-01", nombreObjetivo:"Usar vocabulario académico de ciencias naturales y sociales",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Vocabulario",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente comprenderá y usará al menos 20 palabras del vocabulario escolar de ciencias naturales y sociales (ecosistema, hábitat, territorio, recurso, etc.) en contextos académicos con un 80 % de precisión." },

  { idObjetivo:"LN-6-8-VOC-M-02", nombreObjetivo:"Inferir el significado de palabras desconocidas por contexto",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Vocabulario",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente inferirá el significado aproximado de palabras nuevas en textos orales y escritos usando pistas contextuales, con una paráfrasis ajustada en el 75 % de los ítems." },

  { idObjetivo:"LN-6-8-VOC-A-01", nombreObjetivo:"Usar vocabulario emocional y psicológico complejo",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Vocabulario",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente usará vocabulario para describir estados internos complejos (frustración, entusiasmo, nostalgia, empatía, ambivalencia) en contextos conversacionales apropiados con un 75 % de precisión." },

  { idObjetivo:"LN-8-10-VOC-A-01", nombreObjetivo:"Usar vocabulario figurado y recursos retóricos en discurso oral",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Vocabulario",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente incorporará al menos 2 recursos retóricos (metáfora, comparación, hipérbole) en su producción oral espontánea de forma intencional y apropiada al contexto." },

  // ── LN — Gramática (GRM) ──────────────────────────────────────────────
  { idObjetivo:"LN-2-4-GRM-B-01", nombreObjetivo:"Usar morfemas de número (singular/plural) en la producción oral",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Gramática",
    franjaEtaria:"2-4", franjaEtariaMin:2, franjaEtariaMax:4, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente usará la forma de plural (perros, casas, sillas) correctamente cuando sea apropiado en su producción espontánea, con un 75 % de precisión en una muestra de habla." },

  { idObjetivo:"LN-4-6-GRM-B-01", nombreObjetivo:"Usar correctamente el tiempo verbal presente en oraciones",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Gramática",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente producirá verbos en presente indicativo con concordancia de persona y número correcta (él come, nosotros jugamos) en el 80 % de las producciones espontáneas." },

  { idObjetivo:"LN-4-6-GRM-B-02", nombreObjetivo:"Usar preposiciones de lugar en descripciones espontáneas",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Gramática",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente usará correctamente preposiciones de lugar (en, sobre, debajo, detrás, delante, entre) en descripciones espontáneas de imágenes con un 80 % de precisión." },

  { idObjetivo:"LN-4-6-GRM-M-01", nombreObjetivo:"Conjugar verbos regulares en tiempo pasado con precisión",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Gramática",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente conjugará verbos regulares en pretérito perfecto simple (-é, -aste, -ó) con concordancia de persona y número en el 80 % de las producciones en tareas de narración." },

  { idObjetivo:"LN-6-8-GRM-M-01", nombreObjetivo:"Producir oraciones con pronombres personales y posesivos correctamente",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Gramática",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente usará pronombres personales (yo, tú, él, ella, nosotros) y posesivos (mi, tu, su, nuestro) correctamente con concordancia de género y número en el 80 % de las producciones." },

  { idObjetivo:"LN-6-8-GRM-M-02", nombreObjetivo:"Usar oraciones con cláusulas relativas para expandir el léxico",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Gramática",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente producirá oraciones con cláusulas relativas simples (el niño que corre, la caja que está rota) con concordancia correcta en el 75 % de sus producciones narrativas." },

  { idObjetivo:"LN-6-8-GRM-A-01", nombreObjetivo:"Usar marcadores discursivos para conectar enunciados en el discurso",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Gramática",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente usará al menos 6 tipos de marcadores discursivos distintos (causa, consecuencia, contraste, adición, tiempo, conclusión) de forma apropiada y variada en el discurso oral." },

  { idObjetivo:"LN-8-10-GRM-A-01", nombreObjetivo:"Usar construcciones sintácticas complejas: subjuntivo y condicional",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Gramática",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente usará el modo subjuntivo (es posible que venga) y el condicional (si tuviera tiempo, iría) en contextos comunicativos apropiados con un 75 % de precisión morfológica." },

  { idObjetivo:"LN-8-10-GRM-A-02", nombreObjetivo:"Autocorregir errores gramaticales en el habla con monitoreo activo",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Gramática",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente detectará y corregirá de forma espontánea al menos el 70 % de sus propios errores gramaticales en el habla sin señalización del terapeuta." },

  // ── LN — Pragmática lingüística (PRG) ─────────────────────────────────
  { idObjetivo:"LN-4-6-PRG-B-01", nombreObjetivo:"Usar fórmulas de cortesía situacional de forma apropiada",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Pragmática lingüística",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente usará fórmulas de cortesía (buenos días, por favor, gracias, perdón, hasta luego) de forma espontánea y contextualmente adecuada en el 80 % de las situaciones que las requieren." },

  { idObjetivo:"LN-4-6-PRG-B-02", nombreObjetivo:"Ajustar el volumen y el tono de voz al contexto comunicativo",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Pragmática lingüística",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente ajustará el volumen e intensidad de voz en situaciones de voz baja (biblioteca, dormitorio) y normal (patio, juego) cuando se le indique, con respuesta apropiada en el 80 % de los casos." },

  { idObjetivo:"LN-6-8-PRG-M-01", nombreObjetivo:"Usar lenguaje literal vs. figurado según el contexto comunicativo",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Pragmática lingüística",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente diferenciará situaciones que requieren lenguaje literal vs. figurado y seleccionará la forma apropiada en juegos de roles y situaciones comunicativas estructuradas con un 75 % de aciertos." },

  { idObjetivo:"LN-6-8-PRG-M-02", nombreObjetivo:"Usar implicaturas conversacionales en el intercambio comunicativo",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Pragmática lingüística",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente interpretará correctamente implicaturas conversacionales (cuando alguien dice 'hace mucho calor aquí' quiere que abran la ventana) en el 70 % de los escenarios presentados." },

  { idObjetivo:"LN-6-8-PRG-A-01", nombreObjetivo:"Reconocer y usar actos de habla indirectos en contextos sociales",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Pragmática lingüística",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente identificará la función comunicativa de actos de habla indirectos (peticiones disfrazadas, rechazos corteses) y los producirá apropiadamente en juegos de rol en el 75 % de los intentos." },

  { idObjetivo:"LN-8-10-PRG-A-01", nombreObjetivo:"Adaptar el discurso al registro formal para contextos académicos",
    modulo:"Lenguaje", area:"Lenguaje", areaClinica:"lenguaje", subarea:"Pragmática lingüística",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente producirá presentaciones orales en registro formal (vocabulario técnico, oraciones completas, sin muletillas) distinguible del registro informal en situaciones de juego de roles académicos." },

  // ═══════════════════════════════════════════════════════════════════════
  // COGNICIÓN — CG  (nuevas subareas: WME · INH · FLX · PSV) — 50 objetivos
  // ═══════════════════════════════════════════════════════════════════════

  // ── Memoria de trabajo (WME) ───────────────────────────────────────────
  { idObjetivo:"CG-2-4-WME-B-01", nombreObjetivo:"Recordar y ejecutar instrucciones de dos pasos con demora",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Memoria de trabajo",
    franjaEtaria:"2-4", franjaEtariaMin:2, franjaEtariaMax:4, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente recordará y ejecutará una instrucción de dos pasos (toma la pelota y ponla en la caja) después de una pausa de 5 segundos, con un 75 % de aciertos." },

  { idObjetivo:"CG-2-4-WME-B-02", nombreObjetivo:"Reproducir secuencias visoespaciales simples de 2-3 pasos",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Memoria de trabajo",
    franjaEtaria:"2-4", franjaEtariaMin:2, franjaEtariaMax:4, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente reproducirá una secuencia de 2-3 toques en bloques de colores después de observarla, con un 80 % de aciertos en 10 ensayos." },

  { idObjetivo:"CG-4-6-WME-B-01", nombreObjetivo:"Retener en mente 3 ítems mientras realiza una tarea secundaria",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Memoria de trabajo",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente recordará 3 palabras o imágenes presentadas al inicio de una actividad y las reportará correctamente al finalizar la tarea con un 80 % de aciertos." },

  { idObjetivo:"CG-4-6-WME-B-02", nombreObjetivo:"Repetir secuencias de colores en orden directo e inverso",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Memoria de trabajo",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente repetirá secuencias de 3-4 colores en orden directo (como se presentaron) e inverso (al revés), con un 80 % de aciertos en series de 3 y 75 % en series de 4." },

  { idObjetivo:"CG-4-6-WME-M-01", nombreObjetivo:"Mantener activa información mientras transforma o manipula datos",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Memoria de trabajo",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente realizará tareas de n-back simple (indicar si el estímulo actual coincide con el anterior) con un 75 % de aciertos en una serie de 20 ítems." },

  { idObjetivo:"CG-4-6-WME-M-02", nombreObjetivo:"Recordar y aplicar reglas de una tarea mientras la ejecuta",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Memoria de trabajo",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente mantendrá activas 2-3 reglas de clasificación (si es rojo va acá, si es grande va allá) mientras categoriza un set de estímulos, con menos del 20 % de errores." },

  { idObjetivo:"CG-6-8-WME-M-01", nombreObjetivo:"Realizar cálculo mental sencillo manteniendo números intermedios",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Memoria de trabajo",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente resolverá sumas y restas de dos pasos de forma mental (sin papel), reteniendo los resultados intermedios y produciendo el resultado final con un 80 % de precisión." },

  { idObjetivo:"CG-6-8-WME-M-02", nombreObjetivo:"Actualizar continuamente la información en tareas de monitoreo",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Memoria de trabajo",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente actualizará activamente información cambiante durante tareas de seguimiento (recordar la última palabra de una lista en expansión) con un 75 % de aciertos." },

  { idObjetivo:"CG-6-8-WME-A-01", nombreObjetivo:"Usar la memoria de trabajo para planificar una estrategia de juego",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Memoria de trabajo",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente mantendrá en mente el estado actual del juego y planificará al menos 2 movimientos futuros en juegos de estrategia simple (damas, tres en raya) sin referencia física al tablero." },

  { idObjetivo:"CG-8-10-WME-A-01", nombreObjetivo:"Retener y manipular secuencias de información compleja",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Memoria de trabajo",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente recordará y reorganizará listas de 6-7 ítems (ordenar palabras alfabéticamente en la mente, ordenar números de mayor a menor) con un 75 % de aciertos." },

  { idObjetivo:"CG-8-10-WME-A-02", nombreObjetivo:"Aplicar la memoria de trabajo en tareas de comprensión lectora compleja",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Memoria de trabajo",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente mantendrá información de párrafos anteriores activa mientras lee textos complejos, integrando información a lo largo del texto para responder preguntas de comprensión global." },

  // ── Control inhibitorio (INH) ──────────────────────────────────────────
  { idObjetivo:"CG-2-4-INH-B-01", nombreObjetivo:"Detener una acción en curso ante la señal 'para'",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Control inhibitorio",
    franjaEtaria:"2-4", franjaEtariaMin:2, franjaEtariaMax:4, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente detendrá su acción motora en curso (correr, aplaudir, hablar) inmediatamente al escuchar la señal 'para' del terapeuta, en el 80 % de los ensayos." },

  { idObjetivo:"CG-2-4-INH-B-02", nombreObjetivo:"Esperar su turno antes de tomar un objeto o iniciar una actividad",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Control inhibitorio",
    franjaEtaria:"2-4", franjaEtariaMin:2, franjaEtariaMax:4, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente esperará al menos 10 segundos antes de tomar su turno en actividades de espera, sin protestar ni intentar saltearse el turno, en el 75 % de los ensayos." },

  { idObjetivo:"CG-4-6-INH-B-01", nombreObjetivo:"Inhibir respuesta prepotente ante señales visuales cambiantes",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Control inhibitorio",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"En juegos de Simón dice, el paciente responderá solo cuando el terapeuta diga 'Simón dice', inhibiendo la acción cuando no se incluya la consigna, con menos del 20 % de errores." },

  { idObjetivo:"CG-4-6-INH-B-02", nombreObjetivo:"Controlar la impulsividad verbal: pensar antes de responder",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Control inhibitorio",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente esperará a que el terapeuta termine la pregunta antes de responder, evitando respuestas impulsivas incompletas, en el 80 % de las oportunidades de respuesta." },

  { idObjetivo:"CG-4-6-INH-M-01", nombreObjetivo:"Inhibir respuesta habitual en tareas de interferencia (tipo Stroop)",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Control inhibitorio",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"En tareas de interferencia visual-verbal (nombrar el color de la tinta ignorando el significado de la palabra), el paciente completará con menos del 25 % de errores en 30 ítems." },

  { idObjetivo:"CG-4-6-INH-M-02", nombreObjetivo:"Resistir la distracción de estímulos irrelevantes durante una tarea",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Control inhibitorio",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente completará tareas de 10 minutos en presencia de distractores auditivos y visuales moderados, manteniendo la precisión de ejecución por encima del 80 %." },

  { idObjetivo:"CG-6-8-INH-M-01", nombreObjetivo:"Inhibir respuestas verbales inapropiadas en situaciones sociales",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Control inhibitorio",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente aplicará la regla 'pausa y pienso' antes de hacer comentarios en situaciones sociales de role-play, evitando comentarios impulsivos inapropiados en el 75 % de los escenarios." },

  { idObjetivo:"CG-6-8-INH-M-02", nombreObjetivo:"Mantener el control inhibitorio bajo presión de tiempo",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Control inhibitorio",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente mantendrá un nivel de errores de inhibición por debajo del 20 % en tareas go/no-go con presión de tiempo (respuesta requerida en menos de 1 segundo)." },

  { idObjetivo:"CG-6-8-INH-A-01", nombreObjetivo:"Aplicar estrategias de autocontrol ante la frustración",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Control inhibitorio",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente aplicará al menos una estrategia de regulación (respiración, contar hasta 10, alejarse) antes de reaccionar impulsivamente ante tareas frustrantes, observable en el 75 % de las situaciones." },

  { idObjetivo:"CG-8-10-INH-A-01", nombreObjetivo:"Suprimir respuestas automáticas para adoptar estrategias deliberadas",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Control inhibitorio",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente abandonará la estrategia automática e implementará una estrategia deliberada más eficiente cuando la primera falle, haciendo el cambio en el 75 % de los intentos relevantes." },

  { idObjetivo:"CG-8-10-INH-A-02", nombreObjetivo:"Inhibir la interferencia de información irrelevante en razonamiento complejo",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Control inhibitorio",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente resolverá problemas con información irrelevante incluida (trampas), ignorando los datos no pertinentes y centrándose solo en la información relevante con un 80 % de precisión." },

  // ── Flexibilidad cognitiva (FLX) ───────────────────────────────────────
  { idObjetivo:"CG-4-6-FLX-B-01", nombreObjetivo:"Cambiar de criterio de clasificación ante una nueva consigna",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Flexibilidad cognitiva",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente cambiará el criterio de clasificación de tarjetas (de color a forma, de forma a tamaño) cuando el terapeuta lo indique, sin cometer errores de perseveración en el 75 % de los ensayos." },

  { idObjetivo:"CG-4-6-FLX-B-02", nombreObjetivo:"Adaptarse a cambios de regla en juegos estructurados",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Flexibilidad cognitiva",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente ajustará su comportamiento cuando las reglas de un juego cambien de forma inesperada, aplicando la nueva regla correctamente en el 80 % de los turnos siguientes al cambio." },

  { idObjetivo:"CG-4-6-FLX-M-01", nombreObjetivo:"Generar múltiples soluciones para un mismo problema",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Flexibilidad cognitiva",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente generará al menos 3 soluciones distintas para un problema cotidiano presentado por el terapeuta (¿qué harías si perdieras tu mochila?), con respuestas coherentes y variadas." },

  { idObjetivo:"CG-6-8-FLX-M-01", nombreObjetivo:"Adoptar perspectivas alternativas ante una situación conflictiva",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Flexibilidad cognitiva",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente identificará y verbalizará el punto de vista de al menos dos personas diferentes ante una situación social conflictiva presentada en viñetas, de forma coherente y sin rigidez." },

  { idObjetivo:"CG-6-8-FLX-M-02", nombreObjetivo:"Cambiar de estrategia cuando la primera no es efectiva",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Flexibilidad cognitiva",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"Al resolver problemas, el paciente abandonará una estrategia inefectiva y adoptará una alternativa distinta en el 75 % de los ensayos donde la primera estrategia produzca 2 errores consecutivos." },

  { idObjetivo:"CG-6-8-FLX-A-01", nombreObjetivo:"Integrar información contradictoria para alcanzar una conclusión flexible",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Flexibilidad cognitiva",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente resolverá tareas con información contradictoria o ambigua, elaborando una conclusión flexible y justificada que reconozca la ambigüedad, en el 75 % de los escenarios planteados." },

  { idObjetivo:"CG-8-10-FLX-A-01", nombreObjetivo:"Aplicar pensamiento divergente para generar ideas originales",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Flexibilidad cognitiva",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente generará al menos 8 usos distintos para un objeto cotidiano en 2 minutos (prueba de usos alternativos), con respuestas originales y categorías diversas." },

  { idObjetivo:"CG-8-10-FLX-A-02", nombreObjetivo:"Revisar y modificar el plan de acción ante feedback externo",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Flexibilidad cognitiva",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente modificará su plan de acción de forma efectiva tras recibir retroalimentación correctiva, ajustando al menos 2 aspectos de la estrategia en el 75 % de las sesiones de resolución de problemas." },

  // ── Resolución de problemas (PSV) ──────────────────────────────────────
  { idObjetivo:"CG-4-6-PSV-B-01", nombreObjetivo:"Identificar el problema en situaciones cotidianas simples",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Resolución de problemas",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente identificará correctamente cuál es el problema en situaciones cotidianas presentadas en imágenes o viñetas (el niño no puede abrir el frasco, la pelota está en el techo) en el 80 % de los casos." },

  { idObjetivo:"CG-4-6-PSV-B-02", nombreObjetivo:"Seleccionar la mejor solución entre opciones dadas",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Resolución de problemas",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente seleccionará la solución más apropiada entre 3 opciones presentadas para problemas cotidianos simples, justificando su elección con al menos una razón en el 80 % de los casos." },

  { idObjetivo:"CG-4-6-PSV-M-01", nombreObjetivo:"Planificar una secuencia de pasos para resolver un problema concreto",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Resolución de problemas",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente planificará y verbalizará una secuencia de al menos 3 pasos para resolver un problema concreto (completar un rompecabezas, construir una torre específica) antes de ejecutarla." },

  { idObjetivo:"CG-6-8-PSV-M-01", nombreObjetivo:"Aplicar el ciclo completo de resolución de problemas: identificar, planificar, ejecutar y evaluar",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Resolución de problemas",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente utilizará el ciclo completo (1-identificar el problema, 2-generar soluciones, 3-elegir y ejecutar, 4-evaluar el resultado) en al menos el 70 % de las situaciones problema presentadas." },

  { idObjetivo:"CG-6-8-PSV-M-02", nombreObjetivo:"Resolver problemas de razonamiento lógico deductivo",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Resolución de problemas",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente resolverá acertijos y problemas de razonamiento deductivo (tipo pistas para descubrir quién es) explicando su razonamiento paso a paso con un 75 % de aciertos." },

  { idObjetivo:"CG-6-8-PSV-A-01", nombreObjetivo:"Generar y evaluar múltiples soluciones en problemas abiertos",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Resolución de problemas",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente generará al menos 4 posibles soluciones para un problema abierto, evaluará pros y contras de cada una, y seleccionará la más adecuada justificando su decisión." },

  { idObjetivo:"CG-6-8-PSV-A-02", nombreObjetivo:"Resolver problemas con información parcial o ambigua",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Resolución de problemas",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente resolverá problemas presentados con información incompleta, identificando qué información falta, haciendo suposiciones razonables y llegando a una solución justificada." },

  { idObjetivo:"CG-8-10-PSV-A-01", nombreObjetivo:"Transferir estrategias de resolución a problemas de dominio nuevo",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Resolución de problemas",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente aplicará estrategias aprendidas en un tipo de problema (laberintos, rompecabezas) a un problema de dominio nuevo que requiera la misma estrategia, sin instrucción explícita." },

  { idObjetivo:"CG-8-10-PSV-A-02", nombreObjetivo:"Evaluar la efectividad de soluciones y aprender del error",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Resolución de problemas",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente evaluará el resultado de sus soluciones, identificará por qué fallaron las inefectivas y ajustará su estrategia en el intento siguiente en el 75 % de las situaciones de error." },

  // ── Atención — rango 8-10 (AT) ─────────────────────────────────────────
  { idObjetivo:"CG-8-10-AT-M-01", nombreObjetivo:"Mantener la atención en tareas académicas durante 20-25 minutos",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Atención sostenida",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente completará tareas académicas durante 20-25 minutos continuos con menos de 3 interrupciones por distracción observadas por el terapeuta, en 3 sesiones consecutivas." },

  { idObjetivo:"CG-8-10-AT-M-02", nombreObjetivo:"Distribuir y alternar la atención entre dos tareas académicas",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Atención alternante",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente alternará la atención entre dos tareas distintas (lectura y tomar notas) de forma fluida y sin perder el hilo de ninguna, con un desempeño mayor al 80 % en ambas tareas." },

  { idObjetivo:"CG-8-10-AT-A-01", nombreObjetivo:"Detectar y gestionar proactivamente los propios distractores",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Metacognición atencional",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente identificará sus propios patrones de distracción y aplicará al menos 2 estrategias de autogestión (eliminar distractor, técnica de tiempo, recordatorio de tarea) en situaciones académicas." },

  // ── Razonamiento — rango 8-10 (RAZ) ───────────────────────────────────
  { idObjetivo:"CG-8-10-RAZ-M-01", nombreObjetivo:"Identificar relaciones de analogía entre conceptos abstractos",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Razonamiento abstracto",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente completará analogías verbales de dificultad creciente (cuchillo es a cortar como pincel es a ___) con un 80 % de aciertos en un set de 20 ítems." },

  { idObjetivo:"CG-8-10-RAZ-M-02", nombreObjetivo:"Identificar la regla oculta en series numéricas y de figuras",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Razonamiento inductivo",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente identificará la regla que gobierna series numéricas y de figuras de complejidad media y completará el siguiente elemento con un 80 % de precisión en 15 ítems." },

  { idObjetivo:"CG-8-10-RAZ-A-01", nombreObjetivo:"Construir argumentos lógicos válidos con premisas y conclusión",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Razonamiento lógico",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente construirá argumentos de la forma 'si... entonces...' con premisas válidas y conclusión lógica, y detectará falacias en argumentos presentados por el terapeuta en el 75 % de los casos." },

  { idObjetivo:"CG-8-10-RAZ-A-02", nombreObjetivo:"Aplicar razonamiento hipotético-deductivo en situaciones complejas",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Razonamiento hipotético",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente formulará y evaluará hipótesis ante problemas abiertos, descartando hipótesis inválidas con evidencia y llegando a la hipótesis más probable de forma sistemática." },

  // ── Memoria — rango 8-10 (MEM) ────────────────────────────────────────
  { idObjetivo:"CG-8-10-MEM-A-01", nombreObjetivo:"Organizar información en categorías para mejorar la retención",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Memoria episódica",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente organizará espontáneamente la información a memorizar en categorías o esquemas antes del aprendizaje, logrando al menos un 20 % de mejora en retención respecto a la condición sin organización." },

  { idObjetivo:"CG-8-10-MEM-A-02", nombreObjetivo:"Usar técnicas mnemónicas avanzadas para material académico",
    modulo:"Cognición", area:"Cognición", areaClinica:"cognición", subarea:"Estrategias de memoria",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente aplicará al menos 2 técnicas mnemónicas (método loci, acrónimos, historias mnemónicas) para memorizar listas de 10-12 ítems con un 80 % de retención tras 10 minutos." },

  // ═══════════════════════════════════════════════════════════════════════
  // FUNCIONES EJECUTIVAS — EF  (50 objetivos)
  // Subareas: PLN · ORG · SRG · IMP
  // ═══════════════════════════════════════════════════════════════════════

  // ── Planificación (PLN) ────────────────────────────────────────────────
  { idObjetivo:"EF-3-5-PLN-B-01", nombreObjetivo:"Anticipar el material necesario para una actividad sencilla",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Planificación",
    franjaEtaria:"3-5", franjaEtariaMin:3, franjaEtariaMax:5, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente identificará y reunirá el material necesario antes de iniciar una actividad simple (colorear: traer lápices y papel), sin necesidad de que el terapeuta lo recuerde, en el 75 % de las sesiones." },

  { idObjetivo:"EF-3-5-PLN-B-02", nombreObjetivo:"Describir qué hará antes de empezar una tarea en juego de roles",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Planificación",
    franjaEtaria:"3-5", franjaEtariaMin:3, franjaEtariaMax:5, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"En situaciones de juego de roles (jugar a la cocina, construir con bloques), el paciente verbalizará qué hará primero con al menos 2 pasos antes de comenzar la actividad en el 75 % de los intentos." },

  { idObjetivo:"EF-3-5-PLN-B-03", nombreObjetivo:"Ordenar imágenes de pasos de una tarea cotidiana en secuencia correcta",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Planificación",
    franjaEtaria:"3-5", franjaEtariaMin:3, franjaEtariaMax:5, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente ordenará 4 imágenes que muestran los pasos de una tarea cotidiana (lavarse los dientes, preparar el desayuno) en la secuencia lógica correcta con un 80 % de aciertos." },

  { idObjetivo:"EF-5-7-PLN-B-01", nombreObjetivo:"Establecer un plan de 3 pasos para completar un proyecto simple",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Planificación",
    franjaEtaria:"5-7", franjaEtariaMin:5, franjaEtariaMax:7, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente establecerá y verbalizará un plan de al menos 3 pasos para completar una tarea asignada (hacer una tarjeta, construir un modelo), ejecutándolos en orden con mínima ayuda." },

  { idObjetivo:"EF-5-7-PLN-B-02", nombreObjetivo:"Identificar posibles obstáculos en un plan y proponer soluciones",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Planificación",
    franjaEtaria:"5-7", franjaEtariaMin:5, franjaEtariaMax:7, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"Dado un plan simple, el paciente identificará al menos un posible problema (¿qué pasa si no tenemos tijeras?) y propondrá una solución alternativa en el 75 % de los escenarios presentados." },

  { idObjetivo:"EF-5-7-PLN-M-01", nombreObjetivo:"Planificar una actividad de varios días con tareas asignadas",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Planificación",
    franjaEtaria:"5-7", franjaEtariaMin:5, franjaEtariaMax:7, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente planificará un proyecto de 3-4 días (preparar una presentación, hacer un álbum) distribuyendo las tareas en el tiempo con al menos 2 pasos por día, de forma coherente." },

  { idObjetivo:"EF-5-7-PLN-M-02", nombreObjetivo:"Usar soporte visual (lista, diagrama) para guiar la ejecución de un plan",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Planificación",
    franjaEtaria:"5-7", franjaEtariaMin:5, franjaEtariaMax:7, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente elaborará y usará una lista de tareas o diagrama de flujo para guiar la ejecución de un proyecto, marcando los pasos completados y ajustando el plan si es necesario." },

  { idObjetivo:"EF-7-10-PLN-M-01", nombreObjetivo:"Planificar el estudio semanal distribuyendo tareas por prioridad",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Planificación",
    franjaEtaria:"7-10", franjaEtariaMin:7, franjaEtariaMax:10, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente organizará sus tareas escolares de la semana en un horario, asignando tiempo según la urgencia e importancia de cada tarea, y lo cumplirá en al menos el 70 % de los días." },

  { idObjetivo:"EF-7-10-PLN-M-02", nombreObjetivo:"Anticipar consecuencias de sus decisiones en la planificación",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Planificación",
    franjaEtaria:"7-10", franjaEtariaMin:7, franjaEtariaMax:10, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente anticipará verbalmente las consecuencias a corto y mediano plazo de sus decisiones en situaciones de planificación hipotética con un 75 % de coherencia lógica." },

  { idObjetivo:"EF-7-10-PLN-A-01", nombreObjetivo:"Elaborar un plan de proyecto con recursos, tiempos y metas medibles",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Planificación",
    franjaEtaria:"7-10", franjaEtariaMin:7, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente elaborará un plan de proyecto escolar especificando recursos necesarios, pasos ordenados, tiempos estimados y criterios de éxito, completándolo en los tiempos planificados con un 70 % de cumplimiento." },

  { idObjetivo:"EF-7-10-PLN-A-02", nombreObjetivo:"Revisar y ajustar el plan en marcha ante imprevistos",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Planificación",
    franjaEtaria:"7-10", franjaEtariaMin:7, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"Ante un imprevisto introducido por el terapeuta durante la ejecución de un proyecto, el paciente revisará y ajustará su plan de forma flexible y coherente en el 75 % de los casos." },

  { idObjetivo:"EF-7-10-PLN-A-03", nombreObjetivo:"Planificar metas a largo plazo desglosándolas en pasos semanales",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Planificación",
    franjaEtaria:"7-10", franjaEtariaMin:7, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente identificará una meta a largo plazo personal o académica y la desglosará en sub-metas semanales realizables con criterios de verificación observables." },

  { idObjetivo:"EF-9-12-PLN-A-01", nombreObjetivo:"Diseñar un plan de estudio integral para un período de exámenes",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Planificación",
    franjaEtaria:"9-12", franjaEtariaMin:9, franjaEtariaMax:12, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente diseñará un plan de estudio para un período de evaluaciones, distribuyendo el tiempo de revisión por materia según dificultad e importancia, y lo cumplirá en al menos el 70 % de las sesiones planificadas." },

  { idObjetivo:"EF-9-12-PLN-A-02", nombreObjetivo:"Planificar y ejecutar un proyecto de investigación en etapas",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Planificación",
    franjaEtaria:"9-12", franjaEtariaMin:9, franjaEtariaMax:12, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente planificará un proyecto de investigación en 4 etapas (búsqueda de información, síntesis, elaboración, presentación) con fechas límite y entregará cada etapa en tiempo y forma." },

  // ── Organización (ORG) ─────────────────────────────────────────────────
  { idObjetivo:"EF-3-5-ORG-B-01", nombreObjetivo:"Ordenar el material de trabajo al terminar cada actividad",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Organización",
    franjaEtaria:"3-5", franjaEtariaMin:3, franjaEtariaMax:5, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente ordenará y devolverá el material al lugar correspondiente al finalizar cada actividad sin que el terapeuta lo recuerde, en el 80 % de las sesiones." },

  { idObjetivo:"EF-3-5-ORG-B-02", nombreObjetivo:"Seguir la secuencia de una rutina de hasta 4 pasos",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Organización",
    franjaEtaria:"3-5", franjaEtariaMin:3, franjaEtariaMax:5, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente seguirá la rutina de inicio de sesión (saludar, sacar material, elegir actividad, sentarse) de 4 pasos en el orden correcto con apoyo visual en el 80 % de las sesiones." },

  { idObjetivo:"EF-5-7-ORG-B-01", nombreObjetivo:"Clasificar y archivar material por categorías o temas",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Organización",
    franjaEtaria:"5-7", franjaEtariaMin:5, franjaEtariaMax:7, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente organizará materiales de trabajo (hojas de actividades, tarjetas) en carpetas o categorías correctas con un 80 % de precisión, usando etiquetas visuales como apoyo." },

  { idObjetivo:"EF-5-7-ORG-B-02", nombreObjetivo:"Preparar la mochila escolar según el horario del día siguiente",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Organización",
    franjaEtaria:"5-7", franjaEtariaMin:5, franjaEtariaMax:7, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente preparará su mochila según el horario del día siguiente de forma autónoma, con menos de 1 olvido por semana según reporte del familiar durante 3 semanas consecutivas." },

  { idObjetivo:"EF-5-7-ORG-M-01", nombreObjetivo:"Mantener organizado un espacio de trabajo durante una actividad extensa",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Organización",
    franjaEtaria:"5-7", franjaEtariaMin:5, franjaEtariaMax:7, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente mantendrá su espacio de trabajo organizado durante actividades de 20 minutos, guardando el material que no usa y manteniendo visible solo el relevante, en el 75 % de las sesiones." },

  { idObjetivo:"EF-5-7-ORG-M-02", nombreObjetivo:"Usar agendas o listas de verificación para tareas escolares",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Organización",
    franjaEtaria:"5-7", franjaEtariaMin:5, franjaEtariaMax:7, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente usará una agenda o lista de tareas diaria para registrar las actividades escolares y las irá marcando al completarlas, con al menos el 80 % de las tareas registradas correctamente." },

  { idObjetivo:"EF-7-10-ORG-M-01", nombreObjetivo:"Organizar la información de un texto en esquemas o mapas conceptuales",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Organización",
    franjaEtaria:"7-10", franjaEtariaMin:7, franjaEtariaMax:10, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente elaborará un mapa conceptual o esquema que organice la información clave de un texto leído, con categorías, subcategorías y relaciones correctas en el 75 % de los textos asignados." },

  { idObjetivo:"EF-7-10-ORG-M-02", nombreObjetivo:"Gestionar el tiempo en una sesión de trabajo autónomo",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Organización",
    franjaEtaria:"7-10", franjaEtariaMin:7, franjaEtariaMax:10, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente dividirá una sesión de trabajo de 30 minutos en bloques para diferentes tareas, monitoreará el tiempo con un reloj y respetará los tiempos asignados en el 75 % de los bloques." },

  { idObjetivo:"EF-7-10-ORG-A-01", nombreObjetivo:"Crear sistemas de organización personal para materiales y agenda",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Organización",
    franjaEtaria:"7-10", franjaEtariaMin:7, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente diseñará e implementará un sistema personal de organización (color por materia, secciones de agenda, carpetas digitales o físicas) y lo mantendrá actualizado durante 4 semanas consecutivas." },

  { idObjetivo:"EF-7-10-ORG-A-02", nombreObjetivo:"Priorizar tareas según urgencia e importancia de forma autónoma",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Organización",
    franjaEtaria:"7-10", franjaEtariaMin:7, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente clasificará sus tareas en una matriz urgente/importante de forma autónoma y comenzará siempre por las tareas urgentes e importantes, demostrando una selección adecuada en el 80 % de los días." },

  { idObjetivo:"EF-9-12-ORG-A-01", nombreObjetivo:"Gestionar autónomamente la agenda escolar y extracurricular",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Organización",
    franjaEtaria:"9-12", franjaEtariaMin:9, franjaEtariaMax:12, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente gestionará de forma autónoma su agenda semanal (escolar + actividades extracurriculares) registrando compromisos, anticipando conflictos y reorganizando sin supervisión del adulto." },

  { idObjetivo:"EF-9-12-ORG-A-02", nombreObjetivo:"Usar herramientas digitales para organizar proyectos académicos",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Organización",
    franjaEtaria:"9-12", franjaEtariaMin:9, franjaEtariaMax:12, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente usará herramientas digitales (calendario, lista de tareas, notas) para organizar proyectos académicos, actualizando el sistema regularmente y sin olvidos reportados en el 80 % de las semanas." },

  // ── Autorregulación (SRG) ──────────────────────────────────────────────
  { idObjetivo:"EF-3-5-SRG-B-01", nombreObjetivo:"Reconocer y nombrar sus propias emociones básicas",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Autorregulación",
    franjaEtaria:"3-5", franjaEtariaMin:3, franjaEtariaMax:5, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente identificará y nombrará su emoción predominante (feliz, triste, enojado, asustado) ante situaciones presentadas en imágenes o vividas en sesión con un 80 % de precisión." },

  { idObjetivo:"EF-3-5-SRG-B-02", nombreObjetivo:"Pedir ayuda al adulto cuando se siente frustrado",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Autorregulación",
    franjaEtaria:"3-5", franjaEtariaMin:3, franjaEtariaMax:5, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente usará palabras para solicitar ayuda (ayúdame, no puedo) en lugar de conductas disruptivas cuando se enfrente a tareas frustrantes, en el 75 % de las situaciones observadas." },

  { idObjetivo:"EF-5-7-SRG-B-01", nombreObjetivo:"Aplicar estrategias de calma ante el enojo o la frustración",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Autorregulación",
    franjaEtaria:"5-7", franjaEtariaMin:5, franjaEtariaMax:7, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente aplicará al menos una estrategia de calma (respiración, contar, alejarse) cuando detecte que su nivel de enojo sube, reduciendo la conducta disruptiva al 80 % en comparación con la línea base." },

  { idObjetivo:"EF-5-7-SRG-B-02", nombreObjetivo:"Tolerar la demora de gratificación en actividades de espera",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Autorregulación",
    franjaEtaria:"5-7", franjaEtariaMin:5, franjaEtariaMax:7, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente esperará hasta 5 minutos para recibir una recompensa preferida sin realizar conductas de protesta (queja intensa, llanto, abandono de tarea) en el 80 % de los ensayos." },

  { idObjetivo:"EF-5-7-SRG-M-01", nombreObjetivo:"Monitorear y ajustar el nivel de activación durante las tareas",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Autorregulación",
    franjaEtaria:"5-7", franjaEtariaMin:5, franjaEtariaMax:7, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente usará un termómetro de activación para autoevaluar su nivel de alerta e implementará estrategias de regulación (actividad física corta, respiración) para mantenerse en zona óptima de aprendizaje." },

  { idObjetivo:"EF-5-7-SRG-M-02", nombreObjetivo:"Expresar necesidades y emociones con palabras en situaciones difíciles",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Autorregulación",
    franjaEtaria:"5-7", franjaEtariaMin:5, franjaEtariaMax:7, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente expresará verbalmente cómo se siente y qué necesita en situaciones emocionalmente difíciles, sin recurrir a conductas disruptivas, en el 75 % de los episodios de malestar observados." },

  { idObjetivo:"EF-7-10-SRG-M-01", nombreObjetivo:"Aplicar el ciclo de autorregulación emocional: detectar, nombrar, regular",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Autorregulación",
    franjaEtaria:"7-10", franjaEtariaMin:7, franjaEtariaMax:10, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"Ante situaciones de alta carga emocional, el paciente detectará su emoción, la nombrará con precisión y aplicará al menos una estrategia de regulación aprendida antes de responder, en el 75 % de los episodios." },

  { idObjetivo:"EF-7-10-SRG-M-02", nombreObjetivo:"Usar el diálogo interno positivo para manejar el estrés",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Autorregulación",
    franjaEtaria:"7-10", franjaEtariaMin:7, franjaEtariaMax:10, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente sustituirá pensamientos negativos automáticos (no puedo, soy tonto) por afirmaciones de diálogo interno adaptativo (puedo intentarlo, me equivoco pero aprendo) en el 70 % de los episodios identificados." },

  { idObjetivo:"EF-7-10-SRG-A-01", nombreObjetivo:"Usar estrategias de regulación cognitiva ante la ansiedad por evaluación",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Autorregulación",
    franjaEtaria:"7-10", franjaEtariaMin:7, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente aplicará estrategias cognitivas (reestructuración de pensamientos catastróficos, técnica del peor/mejor/más probable caso) antes de situaciones de evaluación, reportando reducción de ansiedad." },

  { idObjetivo:"EF-7-10-SRG-A-02", nombreObjetivo:"Aplicar habilidades de autorregulación en contextos sociales de conflicto",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Autorregulación",
    franjaEtaria:"7-10", franjaEtariaMin:7, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"En situaciones de conflicto con pares o adultos, el paciente aplicará el protocolo PARA (Pausa, Analiza, Responde, Ajusta) de forma autónoma en el 70 % de los conflictos reportados." },

  { idObjetivo:"EF-9-12-SRG-A-01", nombreObjetivo:"Desarrollar un plan personal de gestión del estrés académico",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Autorregulación",
    franjaEtaria:"9-12", franjaEtariaMin:9, franjaEtariaMax:12, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente elaborará e implementará un plan personal de gestión del estrés con al menos 3 estrategias (ejercicio, pausas, técnicas de respiración) y reportará su efectividad semanalmente." },

  { idObjetivo:"EF-9-12-SRG-A-02", nombreObjetivo:"Generalizar la autorregulación emocional a contextos cotidianos sin apoyo clínico",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Autorregulación",
    franjaEtaria:"9-12", franjaEtariaMin:9, franjaEtariaMax:12, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El familiar y el paciente reportarán uso autónomo de estrategias de regulación en al menos 3 contextos distintos (colegio, hogar, actividades extracurriculares) sin señalización del adulto, durante 4 semanas." },

  // ── Control de impulsos (IMP) ─────────────────────────────────────────
  { idObjetivo:"EF-3-5-IMP-B-01", nombreObjetivo:"Respetar normas de turnos en actividades grupales de 2 participantes",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Control de impulsos",
    franjaEtaria:"3-5", franjaEtariaMin:3, franjaEtariaMax:5, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente esperará su turno y respetará el del compañero en juegos de 2 participantes, sin interrumpir o intentar saltearse el turno, en el 80 % de los intercambios de la sesión." },

  { idObjetivo:"EF-3-5-IMP-B-02", nombreObjetivo:"Terminar la actividad en curso antes de iniciar una nueva",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Control de impulsos",
    franjaEtaria:"3-5", franjaEtariaMin:3, franjaEtariaMax:5, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente completará la actividad asignada antes de pedir iniciar una nueva, evitando abandonarla a mitad, en el 80 % de las actividades de la sesión." },

  { idObjetivo:"EF-5-7-IMP-B-01", nombreObjetivo:"Pedir permiso antes de tomar objetos de otros",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Control de impulsos",
    franjaEtaria:"5-7", franjaEtariaMin:5, franjaEtariaMax:7, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente pedirá permiso verbalmente antes de tomar objetos pertenecientes a otros (compañeros, terapeuta) en el 85 % de las situaciones observadas, sin necesidad de recordatorio." },

  { idObjetivo:"EF-5-7-IMP-B-02", nombreObjetivo:"Levantar la mano antes de hablar en situaciones grupales",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Control de impulsos",
    franjaEtaria:"5-7", franjaEtariaMin:5, franjaEtariaMax:7, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente levantará la mano y esperará que se le dé la palabra antes de hablar en situaciones grupales o de conversación con el terapeuta, en el 80 % de las oportunidades." },

  { idObjetivo:"EF-5-7-IMP-M-01", nombreObjetivo:"Aplicar la pausa cognitiva antes de actuar ante provocaciones",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Control de impulsos",
    franjaEtaria:"5-7", franjaEtariaMin:5, franjaEtariaMax:7, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"En situaciones de provocación simuladas en role-play, el paciente aplicará la estrategia 'para y piensa' antes de responder, eligiendo una respuesta asertiva en lugar de agresiva en el 75 % de los escenarios." },

  { idObjetivo:"EF-5-7-IMP-M-02", nombreObjetivo:"Resistir la impulsividad en tareas de elección diferida",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Control de impulsos",
    franjaEtaria:"5-7", franjaEtariaMin:5, franjaEtariaMax:7, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente elegirá esperar 5 minutos para obtener 2 recompensas en lugar de tomar 1 recompensa inmediatamente, en el 70 % de los ensayos de tarea de gratificación diferida." },

  { idObjetivo:"EF-7-10-IMP-M-01", nombreObjetivo:"Regular la velocidad de respuesta académica para reducir errores por impulsividad",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Control de impulsos",
    franjaEtaria:"7-10", franjaEtariaMin:7, franjaEtariaMax:10, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente leerá el enunciado completo antes de responder y revisará su respuesta antes de entregarla, reduciendo los errores impulsivos en tareas académicas al menos un 30 % respecto a la línea base." },

  { idObjetivo:"EF-7-10-IMP-M-02", nombreObjetivo:"Controlar impulsos verbales en conversaciones emocionalmente intensas",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Control de impulsos",
    franjaEtaria:"7-10", franjaEtariaMin:7, franjaEtariaMax:10, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente evitará interrumpir, gritar o decir comentarios hirientes durante conversaciones de alta carga emocional en role-play, usando en cambio respuestas asertivas en el 75 % de los escenarios." },

  { idObjetivo:"EF-7-10-IMP-A-01", nombreObjetivo:"Generalizar el control de impulsos a contextos sociales sin supervisión",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Control de impulsos",
    franjaEtaria:"7-10", franjaEtariaMin:7, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El familiar reportará mejora sostenida en el control de impulsos del paciente en contextos sin supervisión del terapeuta (recreo, casa) con menos de 2 episodios de conducta impulsiva relevante por semana." },

  { idObjetivo:"EF-7-10-IMP-A-02", nombreObjetivo:"Usar la autoevaluación diferida para aprender de reacciones impulsivas",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Control de impulsos",
    franjaEtaria:"7-10", franjaEtariaMin:7, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"Tras un episodio de reacción impulsiva, el paciente completará un registro de autoevaluación identificando el disparador, la reacción y la alternativa posible, en el 80 % de los episodios reportados." },

  { idObjetivo:"EF-9-12-IMP-A-01", nombreObjetivo:"Tomar decisiones reflexivas evaluando consecuencias a largo plazo",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Control de impulsos",
    franjaEtaria:"9-12", franjaEtariaMin:9, franjaEtariaMax:12, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"Ante decisiones importantes simuladas (situaciones de presión de pares, dilemas éticos), el paciente considerará consecuencias a corto y largo plazo antes de decidir, tomando una decisión reflexiva en el 75 % de los casos." },

  { idObjetivo:"EF-9-12-IMP-A-02", nombreObjetivo:"Aplicar técnicas de control de impulsos en entornos de alta exigencia social",
    modulo:"Funciones Ejecutivas", area:"Funciones Ejecutivas", areaClinica:"funciones ejecutivas", subarea:"Control de impulsos",
    franjaEtaria:"9-12", franjaEtariaMin:9, franjaEtariaMax:12, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente aplicará estrategias de control de impulsos (pausa, respiración, salida de la situación) de forma autónoma en entornos de alta demanda social, con reporte de efectividad en el 70 % de los episodios." },

  // ═══════════════════════════════════════════════════════════════════════
  // COMUNICACIÓN SOCIAL — SC  (50 objetivos)
  // Subareas: TUR · CON · EMO · INF
  // ═══════════════════════════════════════════════════════════════════════

  // ── Turnos conversacionales (TUR) ─────────────────────────────────────
  { idObjetivo:"SC-2-4-TUR-B-01", nombreObjetivo:"Participar en juegos de turnos simples con el adulto",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Turnos conversacionales",
    franjaEtaria:"2-4", franjaEtariaMin:2, franjaEtariaMax:4, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente participará en juegos de turnos alternados (dar y tomar objetos, rodar una pelota) respetando la alternancia por al menos 5 intercambios consecutivos sin apropiarse del turno del adulto." },

  { idObjetivo:"SC-2-4-TUR-B-02", nombreObjetivo:"Esperar que el adulto termine de hablar antes de vocalizar",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Turnos conversacionales",
    franjaEtaria:"2-4", franjaEtariaMin:2, franjaEtariaMax:4, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente esperará que el adulto termine su enunciado antes de vocalizar o señalar, en el 75 % de los intercambios de protoconversación observados durante la sesión." },

  { idObjetivo:"SC-4-6-TUR-B-01", nombreObjetivo:"Tomar y ceder el turno usando señales no verbales apropiadas",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Turnos conversacionales",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente usará mirada, pausa y gesto de mano para tomar y ceder el turno conversacional de forma apropiada en el 80 % de los intercambios comunicativos observados en sesión." },

  { idObjetivo:"SC-4-6-TUR-B-02", nombreObjetivo:"Respetar los turnos en juegos de mesa grupales de 3-4 participantes",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Turnos conversacionales",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente esperará su turno en juegos de mesa de 3-4 participantes sin protestar, sin saltearse el turno y sin distraerse durante el turno de los demás, en el 80 % de las rondas jugadas." },

  { idObjetivo:"SC-4-6-TUR-M-01", nombreObjetivo:"Usar marcadores verbales para tomar el turno de forma apropiada",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Turnos conversacionales",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente usará marcadores verbales (yo quiero decir, a mí me parece, ¿puedo agregar algo?) para tomar el turno conversacional de forma no interrumpiente en el 75 % de los intercambios grupales." },

  { idObjetivo:"SC-4-6-TUR-M-02", nombreObjetivo:"Reconocer cuándo el interlocutor ha terminado su turno para tomar el propio",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Turnos conversacionales",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente identificará señales de fin de turno (descenso de tono, mirada al interlocutor, pausa) y tomará su turno solo después de detectarlas, en el 80 % de los intercambios conversacionales." },

  { idObjetivo:"SC-6-8-TUR-M-01", nombreObjetivo:"Mantener conversaciones balanceadas sin monopolizar el turno",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Turnos conversacionales",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"En conversaciones de 5 minutos, el paciente cederá el turno al menos 4 veces sin que el interlocutor deba pedírselo, evitando monopolizar por más de 3 turnos consecutivos." },

  { idObjetivo:"SC-6-8-TUR-M-02", nombreObjetivo:"Hacer preguntas para mantener el turno del interlocutor activo",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Turnos conversacionales",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente formulará al menos 2 preguntas relacionadas con lo que el interlocutor dijo durante una conversación de 5 minutos, manteniendo el flujo del intercambio." },

  { idObjetivo:"SC-6-8-TUR-A-01", nombreObjetivo:"Coordinar turnos en conversaciones grupales de 4-5 participantes",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Turnos conversacionales",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"En conversaciones grupales de 4-5 personas, el paciente tomará, cederá y manejará interrupciones de forma apropiada, contribuyendo de forma equilibrada y sin dominar ni retirarse, en el 75 % de los intercambios." },

  { idObjetivo:"SC-8-10-TUR-A-01", nombreObjetivo:"Gestionar el turno en debates y discusiones académicas",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Turnos conversacionales",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"En debates y discusiones académicas, el paciente gestionará el turno de forma estratégica (apoyo del punto anterior, contraargumento, síntesis) respetando el orden establecido en el 80 % de los intercambios." },

  // ── Habilidades conversacionales (CON) ────────────────────────────────
  { idObjetivo:"SC-4-6-CON-B-01", nombreObjetivo:"Iniciar conversaciones con saludos y preguntas de apertura",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Habilidades conversacionales",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente iniciará una conversación con el terapeuta o un par usando un saludo y al menos una pregunta de apertura apropiada al contexto (¿a qué jugamos?, ¿cómo te fue?) en el 80 % de las sesiones." },

  { idObjetivo:"SC-4-6-CON-B-02", nombreObjetivo:"Responder preguntas sobre sí mismo de forma apropiada y completa",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Habilidades conversacionales",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente responderá preguntas sobre su vida (nombre, edad, familia, gustos, colegio) con oraciones completas y apropiadas, sin limitarse a monosílabos, en el 80 % de los intercambios." },

  { idObjetivo:"SC-4-6-CON-M-01", nombreObjetivo:"Mantener un tópico conversacional relevante por al menos 4 turnos",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Habilidades conversacionales",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente mantendrá un tópico conversacional (elegido por el terapeuta o por él) por al menos 4 turnos sin desviarse hacia temas no relacionados, en el 75 % de los intercambios." },

  { idObjetivo:"SC-4-6-CON-M-02", nombreObjetivo:"Cerrar conversaciones de forma apropiada con despedidas explícitas",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Habilidades conversacionales",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente cerrará conversaciones y actividades con despedidas verbales apropiadas (hasta luego, nos vemos, fue divertido) de forma espontánea en el 80 % de las finalizaciones de sesión o actividad." },

  { idObjetivo:"SC-6-8-CON-M-01", nombreObjetivo:"Hacer preguntas relevantes para mostrar interés en el interlocutor",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Habilidades conversacionales",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente formulará al menos 3 preguntas relacionadas con el tema del interlocutor en una conversación de 5 minutos, demostrando interés genuino y conexión con lo dicho." },

  { idObjetivo:"SC-6-8-CON-M-02", nombreObjetivo:"Introducir cambios de tópico de forma suave y explícita",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Habilidades conversacionales",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente marcará los cambios de tópico conversacional con frases de transición (cambiando de tema, hablando de otra cosa) en el 80 % de las ocasiones en que cambie el tópico." },

  { idObjetivo:"SC-6-8-CON-A-01", nombreObjetivo:"Sostener conversaciones sobre temas abstractos o hipotéticos",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Habilidades conversacionales",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente participará en conversaciones sobre temas abstractos o hipotéticos (¿qué harías si pudieras volar?, temas de ciencia o ética simple) con contribuciones coherentes y elaboradas por al menos 6 turnos." },

  { idObjetivo:"SC-6-8-CON-A-02", nombreObjetivo:"Negociar y llegar a acuerdos en conversaciones de resolución de conflictos",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Habilidades conversacionales",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"En situaciones de conflicto simuladas, el paciente negociará usando habilidades de escucha activa, propuesta de compromisos y llegará a un acuerdo verbal con el interlocutor en el 70 % de los escenarios." },

  { idObjetivo:"SC-8-10-CON-A-01", nombreObjetivo:"Participar en conversaciones de profundidad epistémica",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Habilidades conversacionales",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente participará en conversaciones sobre temas complejos (dilemas éticos, temas científicos) aportando perspectivas razonadas, reconociendo la opinión del otro y construyendo sobre las ideas previas." },

  { idObjetivo:"SC-8-10-CON-A-02", nombreObjetivo:"Usar retroalimentación no verbal para sostener la conversación",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Habilidades conversacionales",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente usará señales de escucha activa (asentir, contacto visual, comentarios de seguimiento: ajá, entiendo, ¿en serio?) de forma consistente y natural en conversaciones de 5-10 minutos." },

  // ── Reconocimiento emocional (EMO) ─────────────────────────────────────
  { idObjetivo:"SC-2-4-EMO-B-01", nombreObjetivo:"Reconocer expresiones faciales de las 4 emociones básicas",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Reconocimiento emocional",
    franjaEtaria:"2-4", franjaEtariaMin:2, franjaEtariaMax:4, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente señalará o nombrará la expresión facial correcta (feliz, triste, enojado, asustado) en fotografías de caras con un 80 % de aciertos en 20 ítems." },

  { idObjetivo:"SC-2-4-EMO-B-02", nombreObjetivo:"Asociar situaciones cotidianas con emociones básicas",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Reconocimiento emocional",
    franjaEtaria:"2-4", franjaEtariaMin:2, franjaEtariaMax:4, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente asociará situaciones representadas en imágenes con la emoción apropiada (cumpleaños → feliz, caída → llanto) con un 80 % de aciertos en 15 ítems." },

  { idObjetivo:"SC-4-6-EMO-B-01", nombreObjetivo:"Nombrar la emoción que sentiría en situaciones hipotéticas",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Reconocimiento emocional",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente nombrará la emoción que él sentiría en situaciones hipotéticas (¿cómo te sentirías si perdieras tu juguete favorito?) con una respuesta emocionalmente coherente en el 80 % de los escenarios." },

  { idObjetivo:"SC-4-6-EMO-B-02", nombreObjetivo:"Reconocer señales corporales de las propias emociones",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Reconocimiento emocional",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente identificará al menos 2 señales corporales asociadas a cada una de 4 emociones básicas (corazón acelerado-miedo, músculos tensos-enojo) con un 75 % de precisión." },

  { idObjetivo:"SC-4-6-EMO-M-01", nombreObjetivo:"Reconocer emociones complejas: vergüenza, orgullo, celos, sorpresa",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Reconocimiento emocional",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente identificará y nombrará correctamente 4 emociones complejas (vergüenza, orgullo, celos, sorpresa) en expresiones faciales, situaciones y descripciones verbales con un 75 % de aciertos." },

  { idObjetivo:"SC-4-6-EMO-M-02", nombreObjetivo:"Inferir la emoción de un personaje a partir del contexto de una historia",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Reconocimiento emocional",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"Tras escuchar una historia breve, el paciente inferirá la emoción del personaje sin que se mencione explícitamente, justificando su respuesta con al menos una referencia al contexto, en el 75 % de las historias." },

  { idObjetivo:"SC-6-8-EMO-M-01", nombreObjetivo:"Reconocer emociones mixtas o ambivalentes en situaciones complejas",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Reconocimiento emocional",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente identificará situaciones que generan emociones ambivalentes (emoción y miedo ante algo nuevo) y las describirá con vocabulario emocional preciso en el 70 % de los escenarios presentados." },

  { idObjetivo:"SC-6-8-EMO-M-02", nombreObjetivo:"Mostrar empatía identificando y verbalizando la emoción del otro",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Reconocimiento emocional",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"En situaciones de role-play, el paciente identificará la emoción del interlocutor y expresará verbalmente empatía (comprendo que te sientas así, debe ser difícil) en el 75 % de las situaciones emocionales presentadas." },

  { idObjetivo:"SC-6-8-EMO-A-01", nombreObjetivo:"Diferenciar entre lo que uno siente y lo que el otro siente (descentración emocional)",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Reconocimiento emocional",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente distinguirá entre su propia emoción y la del interlocutor en situaciones de perspectiva emocional divergente, verbalizando ambas de forma correcta en el 75 % de los escenarios." },

  { idObjetivo:"SC-8-10-EMO-A-01", nombreObjetivo:"Reconocer el impacto de las propias acciones en las emociones ajenas",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Reconocimiento emocional",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente reflexionará sobre cómo sus palabras y acciones afectan las emociones de otros y ajustará su conducta en consecuencia, verbalizando al menos 2 conexiones causa-efecto por sesión." },

  { idObjetivo:"SC-8-10-EMO-A-02", nombreObjetivo:"Usar el vocabulario emocional para describir estados internos propios y ajenos",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Reconocimiento emocional",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente usará un vocabulario emocional preciso y matizado (decepción, gratitud, indignación, melancolía) para describir estados propios y ajenos en contextos clínicos y naturales." },

  // ── Inferencia social (INF) ────────────────────────────────────────────
  { idObjetivo:"SC-4-6-INF-B-01", nombreObjetivo:"Inferir intenciones simples de personajes en cuentos",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Inferencia social",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"El paciente inferirá la intención de un personaje en una historia simple (¿por qué crees que hizo eso?) con una explicación coherente con el contexto en el 75 % de los cuentos presentados." },

  { idObjetivo:"SC-4-6-INF-B-02", nombreObjetivo:"Comprender que los demás pueden tener creencias diferentes a las propias",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Inferencia social",
    franjaEtaria:"4-6", franjaEtariaMin:4, franjaEtariaMax:6, nivelDificultad:"básico", estadoBanco:"activo",
    definicionOperativa:"En tareas de falsa creencia de primer orden, el paciente predecirá correctamente lo que pensará un personaje que no tuvo acceso a nueva información, con un 75 % de aciertos." },

  { idObjetivo:"SC-6-8-INF-M-01", nombreObjetivo:"Inferir las intenciones ocultas de personajes en situaciones sociales complejas",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Inferencia social",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente identificará la intención real detrás de acciones o palabras de un personaje cuya motivación no se explicita en la historia, con una explicación coherente en el 75 % de los escenarios." },

  { idObjetivo:"SC-6-8-INF-M-02", nombreObjetivo:"Interpretar el comportamiento social usando claves contextuales múltiples",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Inferencia social",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"intermedio", estadoBanco:"activo",
    definicionOperativa:"El paciente integrará claves verbales, no verbales y contextuales para interpretar situaciones sociales ambiguas en viñetas, produciendo una interpretación coherente con el 75 % de los contextos." },

  { idObjetivo:"SC-6-8-INF-A-01", nombreObjetivo:"Resolver tareas de falsa creencia de segundo orden",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Inferencia social",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente resolverá tareas de falsa creencia de segundo orden (lo que A piensa que B piensa) con una predicción correcta y justificada en el 75 % de los escenarios presentados." },

  { idObjetivo:"SC-6-8-INF-A-02", nombreObjetivo:"Detectar faux pas sociales y explicar por qué incomodan",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Inferencia social",
    franjaEtaria:"6-8", franjaEtariaMin:6, franjaEtariaMax:8, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente identificará meteduras de pata sociales en historias (alguien dice algo inapropiado sin darse cuenta) y explicará por qué resultaron ofensivas para el receptor en el 75 % de los casos." },

  { idObjetivo:"SC-8-10-INF-A-01", nombreObjetivo:"Inferir la perspectiva y el estado mental de múltiples actores en un mismo escenario",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Inferencia social",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente describirá el estado mental y perspectiva de 3 o más personajes en un mismo escenario social complejo, diferenciando correctamente sus motivaciones y creencias en el 75 % de los casos." },

  { idObjetivo:"SC-8-10-INF-A-02", nombreObjetivo:"Usar la teoría de la mente para predecir y explicar conducta social",
    modulo:"Comunicación Social", area:"Comunicación Social", areaClinica:"comunicación social", subarea:"Inferencia social",
    franjaEtaria:"8-10", franjaEtariaMin:8, franjaEtariaMax:10, nivelDificultad:"avanzado", estadoBanco:"activo",
    definicionOperativa:"El paciente predecirá y explicará la conducta de personas en situaciones sociales nuevas usando razonamiento de teoría de la mente, con una predicción acertada y justificación coherente en el 75 % de los casos." },
];

// Fix the typo in the object (idObjetió should be idObjetivo)
const FIXED_GOALS = GOALS.map(g => {
  const obj = g as Record<string, unknown>;
  if (obj["idObjetió"]) {
    obj["idObjetivo"] = obj["idObjetió"];
    delete obj["idObjetió"];
  }
  return g;
});

async function main() {
  console.log("🌱 Seeding 200-goal clinical objective library...\n");

  const existing = await db.select({ idObjetivo: goalLibraryTable.idObjetivo }).from(goalLibraryTable);
  const existingCodes = new Set(existing.map(r => r.idObjetivo));

  const toInsert = FIXED_GOALS.filter(g => {
    const code = (g as Record<string, unknown>).idObjetivo as string;
    return code && !existingCodes.has(code);
  });
  const skipped = FIXED_GOALS.filter(g => {
    const code = (g as Record<string, unknown>).idObjetivo as string;
    return code && existingCodes.has(code);
  });

  if (skipped.length > 0) {
    console.log(`⚠️  Skipping ${skipped.length} already existing codes.`);
  }

  if (toInsert.length === 0) {
    console.log("✅ All goals already in DB. Nothing inserted.");
    return;
  }

  const CHUNK = 25;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK);
    await db.insert(goalLibraryTable).values(
      chunk.map(g => ({
        idObjetivo:          (g as Record<string, unknown>).idObjetivo as string,
        nombreObjetivo:      g.nombreObjetivo,
        modulo:              g.modulo,
        area:                g.area,
        areaClinica:         g.areaClinica,
        subarea:             g.subarea,
        franjaEtaria:        g.franjaEtaria,
        franjaEtariaMin:     g.franjaEtariaMin,
        franjaEtariaMax:     g.franjaEtariaMax,
        nivelDificultad:     g.nivelDificultad,
        estadoBanco:         g.estadoBanco,
        definicionOperativa: g.definicionOperativa,
      }))
    );
    inserted += chunk.length;
    process.stdout.write(`  ✅ ${inserted}/${toInsert.length}\r`);
  }

  // ── Summary ──────────────────────────────────────────────────────────
  const total = await db.select({ id: goalLibraryTable.id }).from(goalLibraryTable);
  const areas = await db.selectDistinct({ area: goalLibraryTable.area }).from(goalLibraryTable);
  const byArea = await db.selectDistinct({ area: goalLibraryTable.area, subarea: goalLibraryTable.subarea }).from(goalLibraryTable);

  console.log("\n\n══════════════════════════════════════════════════════");
  console.log("  SEED COMPLETE");
  console.log("══════════════════════════════════════════════════════");
  console.log(`📋 Table updated:      goal_library`);
  console.log(`➕ Goals inserted:     ${inserted}`);
  console.log(`📊 Total in DB now:    ${total.length}`);
  console.log(`🗂️  Clinical areas:    ${areas.map(a => a.area).sort().join(", ")}`);
  console.log("──────────────────────────────────────────────────────");

  const areaMap: Record<string, Set<string>> = {};
  for (const r of byArea) {
    if (!r.area) continue;
    if (!areaMap[r.area]) areaMap[r.area] = new Set();
    if (r.subarea) areaMap[r.area].add(r.subarea);
  }
  for (const [area, subs] of Object.entries(areaMap).sort()) {
    console.log(`  • ${area}: ${[...subs].sort().join(", ")}`);
  }
  console.log("══════════════════════════════════════════════════════\n");
}

main().catch(e => { console.error(e); process.exit(1); });
