import { useState } from "react";
import { ChevronDown, ChevronUp, Brain, CheckCircle2, Lightbulb, ClipboardCheck, Eye } from "lucide-react";
import { DIAGNOSIS_AREAS, getDiagnosisLabel } from "@/utils/diagnosis-map";

interface AreaGuide {
  queEvaluar: string[];
  comoEvaluarlo: string[];
  indicadoresClinicos: string[];
  ejemploPractico: string;
}

const AREA_GUIDANCE: Record<string, AreaGuide> = {
  "lenguaje": {
    queEvaluar: [
      "Comprensión oral",
      "Expresión verbal",
      "Vocabulario receptivo y expresivo",
      "Morfosintaxis y estructura oracional",
    ],
    comoEvaluarlo: [
      "Denominación de imágenes",
      "Seguimiento de consignas de 1 a 3 pasos",
      "Relato de lámina o cuento con apoyo",
      "Completar frases y analogías verbales",
    ],
    indicadoresClinicos: [
      "Vocabulario activo menor al esperado para la edad",
      "Frases más cortas o simples que las del grupo de referencia",
      "Omisión de morfemas gramaticales (artículos, plurales, verbos)",
      "Dificultad para narrar secuencias con coherencia y cohesión",
    ],
    ejemploPractico: "Presentar una lámina de escena cotidiana y pedir al paciente que describa lo que ocurre. Observar longitud media del enunciado, variedad léxica, uso de conectores y estructura narrativa. Comparar con normas según edad.",
  },
  "habla": {
    queEvaluar: [
      "Inventario fonético",
      "Procesos fonológicos presentes",
      "Inteligibilidad del habla",
      "Fluidez y velocidad del habla",
    ],
    comoEvaluarlo: [
      "Repetición de palabras y pseudopalabras",
      "Denominación espontánea con láminas",
      "Muestra de habla conversacional",
      "Lectura en voz alta (si aplica por edad)",
    ],
    indicadoresClinicos: [
      "Sustituciones articulatorias en fonemas de adquisición tardía (/r/, /rr/, /s/, /l/)",
      "Omisiones o distorsiones en posición final o en grupos consonánticos",
      "Inteligibilidad inferior al 75% para interlocutores no familiares",
      "Procesos fonológicos no esperados para la franja etaria del paciente",
    ],
    ejemploPractico: "Aplicar una prueba de denominación de 30 ítems con variación de posición fonémica (inicial, media, final) y de complejidad silábica. Transcribir fonéticamente las respuestas y comparar con el inventario fonético esperado para la edad.",
  },
  "pragmática": {
    queEvaluar: [
      "Contacto visual y atención conjunta",
      "Intención comunicativa (pedir, comentar, saludar)",
      "Gestión de turnos conversacionales",
      "Comprensión de situaciones sociales",
    ],
    comoEvaluarlo: [
      "Juego guiado y espontáneo",
      "Interacción con el terapeuta u observador",
      "Relato de situaciones cotidianas",
      "Tareas de perspectiva social (ToM básica)",
    ],
    indicadoresClinicos: [
      "Contacto visual pobre, evitativo o excesivo durante la interacción",
      "Dificultad para iniciar, mantener o cerrar conversaciones",
      "Turnos comunicativos muy breves o ausentes",
      "Comentarios no relacionados al tema en curso",
    ],
    ejemploPractico: "Proponer juego libre sin guía del terapeuta durante 10 minutos. Registrar si el paciente inicia la interacción, cuántos turnos sostiene, si repara la comunicación cuando no es entendido, y si adapta el mensaje según el contexto.",
  },
  "cognición": {
    queEvaluar: [
      "Atención sostenida y selectiva",
      "Memoria de trabajo",
      "Control inhibitorio y planificación",
      "Velocidad de procesamiento",
    ],
    comoEvaluarlo: [
      "Tareas estructuradas con instrucción verbal",
      "Actividades de secuenciación de pasos",
      "Juegos con reglas simples y cambio de regla",
      "Observación conductual sistemática en sesión",
    ],
    indicadoresClinicos: [
      "Tiempo de atención sostenida < 5 min en tarea estructurada (esperado 3-5 años)",
      "Dificultad para retener y ejecutar instrucciones de 2-3 pasos",
      "Alta distracción ante estímulos irrelevantes del entorno",
      "Respuestas impulsivas sin período de reflexión previo",
    ],
    ejemploPractico: "Tarea de secuenciación de 3 pasos (colocar ficha, esperar señal, nombrar color). Registrar tiempo de atención sostenida, número de errores por impulsividad, y respuesta a la corrección verbal del terapeuta.",
  },
  "lectoescritura": {
    queEvaluar: [
      "Conciencia fonológica",
      "Decodificación lectora",
      "Comprensión lectora",
      "Escritura y ortografía",
    ],
    comoEvaluarlo: [
      "Lectura de palabras reales y pseudopalabras",
      "Dictado de sílabas, palabras y oraciones",
      "Preguntas literales e inferenciales sobre texto leído",
      "Segmentación silábica y fonémica con palmadas",
    ],
    indicadoresClinicos: [
      "Confusión sistemática de grafemas similares (b/d, p/q, m/n)",
      "Lectura silábica o subsilábica más allá del nivel esperado para el curso",
      "Errores ortográficos frecuentes no atribuibles a nivel de escolaridad",
      "Dificultad marcada en segmentación fonémica (aislar, omitir, invertir fonemas)",
    ],
    ejemploPractico: "Lectura en voz alta de un texto breve apropiado al nivel escolar del paciente. Registrar velocidad lectora (palabras por minuto), tipo y frecuencia de errores de decodificación, intentos de autocorrección y comprensión básica del texto.",
  },
  "motricidad oral": {
    queEvaluar: [
      "Tono y movilidad de estructuras orofaciales",
      "Función y patrón deglutorio",
      "Praxias orales imitativas",
      "Postura y patrón respiratorio habitual",
    ],
    comoEvaluarlo: [
      "Observación de masticación y deglución de agua y sólido",
      "Praxias linguales, labiales y mandibulares ante modelo",
      "Protocolo de evaluación miofuncional estandarizado",
      "Evaluación postural en reposo y durante la fonación",
    ],
    indicadoresClinicos: [
      "Hipotonía o hipertonía muscular evidente en cara, labios o lengua",
      "Deglución con proyección lingual anterior o lateral (deglución atípica)",
      "Dificultad para imitar praxias simples con espejo",
      "Babeo residual post-deglución o en reposo",
    ],
    ejemploPractico: "Protocolo de praxias orofaciales imitativas (5 movimientos de labios, 5 de lengua, 3 de mejillas). Registrar rango de movimiento, simetría, velocidad y precisión de cada praxia. Contrastar con desempeño esperado para la edad.",
  },
  "motricidad orofacial": {
    queEvaluar: [
      "Tono y movilidad de estructuras orofaciales",
      "Función y patrón deglutorio",
      "Praxias orales imitativas",
      "Postura y patrón respiratorio habitual",
    ],
    comoEvaluarlo: [
      "Observación de masticación y deglución de agua y sólido",
      "Praxias linguales, labiales y mandibulares ante modelo",
      "Protocolo de evaluación miofuncional estandarizado",
      "Evaluación postural en reposo y durante la fonación",
    ],
    indicadoresClinicos: [
      "Hipotonía o hipertonía muscular evidente en cara, labios o lengua",
      "Deglución con proyección lingual anterior o lateral (deglución atípica)",
      "Dificultad para imitar praxias simples con espejo",
      "Babeo residual post-deglución o en reposo",
    ],
    ejemploPractico: "Protocolo de praxias orofaciales imitativas (5 movimientos de labios, 5 de lengua, 3 de mejillas). Registrar rango de movimiento, simetría, velocidad y precisión de cada praxia. Contrastar con desempeño esperado para la edad.",
  },
  "voz": {
    queEvaluar: [
      "Calidad vocal (soplosidad, aspereza, tensión)",
      "Tono e intensidad habitual",
      "Resonancia y proyección vocal",
      "Hábitos de higiene y uso vocal",
    ],
    comoEvaluarlo: [
      "Escucha y descripción perceptual de muestra vocal grabada",
      "Tiempo Máximo de Fonación (TMF) de vocal /a/ sostenida",
      "Lectura expresiva de texto estándar",
      "Cuestionario de uso y abuso vocal",
    ],
    indicadoresClinicos: [
      "Calidad vocal perceptualmente áspera, soplada o tensa al inicio de sesión",
      "TMF menor a 8 segundos en adultos o menor al percentil 10 para la edad",
      "Quiebres vocales frecuentes durante el habla espontánea",
      "Intensidad habitual inadecuada al contexto (voz muy baja o muy alta)",
    ],
    ejemploPractico: "Solicitar sostenimiento máximo de vocal /a/ en tres intentos, registrar el mejor tiempo. Grabar 1 minuto de lectura en voz alta y evaluar perceptualmente calidad, intensidad y quiebres. Comparar TMF con valores normativos para edad y sexo.",
  },
  "estimulación temprana": {
    queEvaluar: [
      "Hitos del desarrollo comunicativo y lingüístico",
      "Juego simbólico y funcional",
      "Comprensión preverbal y gestos comunicativos",
      "Intención comunicativa temprana",
    ],
    comoEvaluarlo: [
      "Observación de juego libre con cuidador y con terapeuta",
      "Interacción con el cuidador principal en situación semi-estructurada",
      "Respuesta al nombre y seguimiento de consignas simples",
      "Registro de gestos, señalización y uso comunicativo del llanto y vocalización",
    ],
    indicadoresClinicos: [
      "Ausencia de balbuceo canónico (ma-ma, pa-pa) más allá de los 9 meses",
      "No señala con dedo índice a los 12 meses para mostrar o pedir",
      "Vocabulario activo inferior a 5 palabras funcionales a los 18 meses",
      "No sigue consignas simples sin apoyo gestual más allá de los 12 meses",
    ],
    ejemploPractico: "Sesión de juego de turnos vocal cara a cara: el terapeuta produce un sonido simple, espera y refuerza cualquier respuesta vocal del bebé. Observar si el paciente mantiene la interacción, imita vocalizaciones y varía sus producciones vocales de forma intencional.",
  },
  "funciones ejecutivas": {
    queEvaluar: [
      "Control inhibitorio (frenar respuestas impulsivas)",
      "Planificación y organización de tareas",
      "Flexibilidad cognitiva ante cambios de regla",
      "Memoria de trabajo verbal y visoespacial",
    ],
    comoEvaluarlo: [
      "Tareas de go/no-go o stop-signal (inhibición)",
      "Juegos con reglas que cambian (Día/Noche, DCCS)",
      "Secuenciación de una tarea de 3-4 pasos sin guía",
      "Repetición de dígitos directo e inverso",
    ],
    indicadoresClinicos: [
      "Impulsividad marcada: responde antes de terminar la instrucción",
      "Dificultad para cambiar de tarea o tolerar cambios de regla",
      "No puede planificar una tarea simple de inicio a fin",
      "Olvida las instrucciones de la tarea luego de comenzar",
    ],
    ejemploPractico: "Tarea de cartas con reglas cambiantes (ej. clasificar por color → por forma): el terapeuta cambia la regla sin avisar y observa con cuántos errores el paciente logra adaptarse. Registrar número de errores perseverativos y tiempo de ajuste.",
  },
  "disgrafía": {
    queEvaluar: [
      "Grafomotricidad: presión, postura y prensión del lápiz",
      "Legibilidad de letra y tamaño de grafemas",
      "Velocidad de escritura vs. pares de la misma edad",
      "Ortografía natural y acentual",
    ],
    comoEvaluarlo: [
      "Copia de un texto breve y dictado de palabras",
      "Muestra de escritura espontánea de 3-5 oraciones",
      "Observación directa de postura y prensión del lápiz",
      "Conteo de palabras por minuto en texto copiado",
    ],
    indicadoresClinicos: [
      "Letra ilegible o muy irregular en tamaño y dirección",
      "Presión excesiva o insuficiente sobre el papel",
      "Velocidad de escritura < percentil 10 para su edad y curso",
      "Confusión frecuente de letras similares en la escritura (b/d, p/q)",
    ],
    ejemploPractico: "Pedir al paciente que copie un párrafo de 3-4 oraciones durante 3 minutos. Fotografiar el resultado. Evaluar legibilidad (1-5), tamaño de letra, espaciado entre palabras, inclinación y número de tachones. Comparar con la muestra de escritura espontánea.",
  },
  "matemáticas": {
    queEvaluar: [
      "Sentido numérico y concepto de cantidad",
      "Operaciones básicas (suma, resta, multiplicación, división)",
      "Resolución de problemas matemáticos",
      "Comprensión de valor posicional y sistema decimal",
    ],
    comoEvaluarlo: [
      "Conteo oral y escritura de números dictados",
      "Cálculo mental y escrito de operaciones básicas",
      "Resolución de problemas de uno y dos pasos con enunciado oral",
      "Tareas de comparación y ordenamiento de cantidades",
    ],
    indicadoresClinicos: [
      "Conteo con errores o sin correspondencia uno a uno más allá de los 5 años",
      "No automatiza tablas de multiplicar al finalizar 3º básico",
      "Inversión o escritura en espejo de dígitos (5 y 2, 6 y 9)",
      "Gran dificultad en problemas de enunciado aunque conozca la operación",
    ],
    ejemploPractico: "Serie de 10 operaciones básicas mixtas (+, -, ×) apropiadas al nivel escolar, presentadas en papel. Registrar número de errores, tipo de error (procedimiento vs. resultado), tiempo empleado y uso de dedos o conteo externo. Comparar con rendimiento esperado para el curso.",
  },
  "comprensión lectora": {
    queEvaluar: [
      "Comprensión literal (información explícita en el texto)",
      "Comprensión inferencial (información implícita)",
      "Vocabulario contextual y comprensión de palabras en texto",
      "Comprensión global: idea principal y estructura del texto",
    ],
    comoEvaluarlo: [
      "Lectura de un texto breve adaptado al nivel + preguntas",
      "Identificar la idea principal con y sin apoyo del terapeuta",
      "Señalar en el texto la respuesta a preguntas literales",
      "Preguntas orales sobre lo leído antes y después de la lectura",
    ],
    indicadoresClinicos: [
      "Decodifica correctamente pero no comprende lo que leyó",
      "Solo responde preguntas literales; falla en inferenciales",
      "No puede identificar la idea principal de un párrafo",
      "Vocabulario insuficiente para el nivel escolar cursado",
    ],
    ejemploPractico: "Texto narrativo de nivel escolar: el paciente lo lee en voz alta o en silencio. Luego responder 5 preguntas: 2 literales, 2 inferenciales y 1 de comprensión global. Registrar número de aciertos por tipo de pregunta. Observar si relees o si pide aclaraciones.",
  },
};

const KEYWORD_AREA_MAP: Array<{ keywords: string[]; area: string }> = [
  { keywords: ["tel", "tdl", "retraso del lenguaje", "disfasia", "léxico", "lenguaje"], area: "lenguaje" },
  { keywords: ["fonológico", "dislalia", "tsh", "trastornos de los sonidos", "apraxia", "disartria", "tartamudez", "fluidez", "articulación", "habla"], area: "habla" },
  { keywords: ["tea", "autismo", "pragmática", "social"], area: "pragmática" },
  { keywords: ["tdah", "atención", "memoria", "cognitivo"], area: "cognición" },
  { keywords: ["funciones ejecutivas", "ejecutivas", "planificación", "inhibición", "dificultades atencionales"], area: "funciones ejecutivas" },
  { keywords: ["dislexia", "dificultades de aprendizaje", "lectura", "lectoescritura"], area: "lectoescritura" },
  { keywords: ["disgrafía", "escritura"], area: "disgrafía" },
  { keywords: ["discalculia", "matemática", "cálculo", "número"], area: "matemáticas" },
  { keywords: ["comprensión lectora"], area: "comprensión lectora" },
  { keywords: ["deglución", "orofacial", "praxis oral", "tono oral"], area: "motricidad oral" },
  { keywords: ["voz", "disfonía", "nódulos", "fonación"], area: "voz" },
  { keywords: ["retraso madurativo", "retraso del desarrollo", "estimulación temprana", "bebé"], area: "estimulación temprana" },
];

function resolveAreas(diagnosis: string): string[] {
  if (!diagnosis) return [];
  const mapped = DIAGNOSIS_AREAS[diagnosis];
  if (mapped && mapped.length > 0) return mapped;
  const lower = diagnosis.toLowerCase();
  const found: string[] = [];
  for (const { keywords, area } of KEYWORD_AREA_MAP) {
    if (keywords.some(k => lower.includes(k)) && !found.includes(area)) {
      found.push(area);
    }
  }
  return found;
}

function AreaPanel({ area, guide, compact }: { area: string; guide: AreaGuide; compact: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-amber-200/70 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-amber-50/80 hover:bg-amber-100/60 transition-colors"
      >
        <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">{area}</span>
        {open
          ? <ChevronUp className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          : <ChevronDown className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
      </button>

      {open && (
        <div className={`border-t border-amber-100 ${compact ? "space-y-3 p-3" : "space-y-4 p-4"}`}>
          {/* Qué evaluar + Cómo evaluarlo */}
          <div className={compact ? "space-y-3" : "grid grid-cols-1 sm:grid-cols-2 gap-3"}>
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <ClipboardCheck className="h-3 w-3 text-amber-600 shrink-0" />
                <p className="text-xs font-semibold text-amber-800">Qué evaluar</p>
              </div>
              <ul className="space-y-1">
                {guide.queEvaluar.map(item => (
                  <li key={item} className="flex items-start gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span className="text-xs text-amber-900/80 leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Eye className="h-3 w-3 text-amber-600 shrink-0" />
                <p className="text-xs font-semibold text-amber-800">Cómo evaluarlo</p>
              </div>
              <ul className="space-y-1">
                {guide.comoEvaluarlo.map(item => (
                  <li key={item} className="flex items-start gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span className="text-xs text-amber-900/80 leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Indicadores clínicos */}
          <div className="rounded-lg bg-amber-50 border border-amber-200/60 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <CheckCircle2 className="h-3 w-3 text-amber-700 shrink-0" />
              <p className="text-xs font-semibold text-amber-800">Indicadores clínicos</p>
            </div>
            <ul className="space-y-1">
              {guide.indicadoresClinicos.map(item => (
                <li key={item} className="flex items-start gap-1.5">
                  <span className="shrink-0 text-amber-500 font-bold mt-0.5 text-xs">›</span>
                  <span className="text-xs text-amber-900/80 leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Ejemplo práctico */}
          <div className="rounded-lg bg-white border border-amber-200/50 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Lightbulb className="h-3 w-3 text-amber-600 shrink-0" />
              <p className="text-xs font-semibold text-amber-800">Aplicación en sesión</p>
            </div>
            <p className="text-xs text-amber-900/75 leading-relaxed">{guide.ejemploPractico}</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface EvalSugeridaProps {
  diagnosis: string;
  defaultOpen?: boolean;
  compact?: boolean;
}

export function EvalSugerida({ diagnosis, defaultOpen = false, compact = false }: EvalSugeridaProps) {
  const [open, setOpen] = useState(defaultOpen);

  const areas = resolveAreas(diagnosis);
  if (areas.length === 0) return null;

  const guides = areas
    .map(a => ({ area: a, guide: AREA_GUIDANCE[a] }))
    .filter(({ guide }) => !!guide);

  if (guides.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/60 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-amber-100/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-amber-700 shrink-0" />
          <span className="text-xs font-bold text-amber-900 tracking-wide uppercase">
            Orientación clínica sugerida
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 font-medium">
            {getDiagnosisLabel(diagnosis)}
          </span>
        </div>
        {open
          ? <ChevronUp className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          : <ChevronDown className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
      </button>

      {open && (
        <div className={`border-t border-amber-100 ${compact ? "p-3 space-y-2" : "p-4 space-y-3"}`}>
          <p className="text-[10px] text-amber-700/70 uppercase tracking-widest font-semibold">
            Toca un área para ver la guía clínica completa
          </p>
          {guides.map(({ area, guide }) => (
            <AreaPanel key={area} area={area} guide={guide} compact={compact} />
          ))}
        </div>
      )}
    </div>
  );
}
