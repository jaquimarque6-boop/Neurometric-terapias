import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ClipboardList, Search, ChevronDown, CheckSquare, Square, User,
  Plus, X, BookOpen, Sparkles, Brain, Home, TrendingUp, Info, ChevronRight,
  Mic, MicOff, Check,
} from "lucide-react";
import { useListPatients, getListGoalsQueryKey, getListRegistrosClinicosQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PERFORMANCE_MAP } from "@/components/registro-clinico-form";
import { getClinicalContent } from "@/config/goal-clinical-content";
import { AREA_SUBAREAS } from "@/utils/goal-code-generator";

const BRAND_BLUE = "#96402c";
const BRAND_TEAL = "#1a6360";

const ACTIVIDADES_POR_AREA: Record<string, string[]> = {
  lenguaje:      ["Evocación", "Completar frase", "Asociación imagen-palabra"],
  comprensión:   ["Selección múltiple", "Señalamiento", "Secuencias"],
  fonología:     ["Pares mínimos", "Discriminación auditiva", "Elegir la correcta"],
  cognición:     ["Secuencias", "Clasificación", "Resolver consignas"],
  comunicación:  ["Turnos", "Intención comunicativa", "Juego guiado"],
  habla:         ["Repetición", "Discriminación", "Denominación con apoyo"],
};

const FRANJAS_EDAD = [
  { value: "0-2",   label: "0–2 años"   },
  { value: "3-5",   label: "3–5 años"   },
  { value: "6-8",   label: "6–8 años"   },
  { value: "9-12",  label: "9–12 años"  },
  { value: "13-16", label: "13–16 años" },
  { value: "17-20", label: "17–20 años" },
];

// ── Age helpers ───────────────────────────────────────────────────────────────
function calcularEdadAnios(fechaNacimiento?: string | null, age?: number | string | null): number | null {
  if (fechaNacimiento) {
    const birth = new Date(fechaNacimiento);
    if (!isNaN(birth.getTime())) {
      const today = new Date();
      let years = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) years--;
      return Math.max(0, years);
    }
  }
  if (age != null) {
    const n = typeof age === "string" ? parseInt(age, 10) : age;
    if (!isNaN(n)) return n;
  }
  return null;
}

function edadAFranja(edad: number): string {
  if (edad <= 2)  return "0-2";
  if (edad <= 5)  return "3-5";
  if (edad <= 8)  return "6-8";
  if (edad <= 12) return "9-12";
  if (edad <= 16) return "13-16";
  return "17-20";
}

// ── Clinical blocks with per-franja content ───────────────────────────────────
type BloqueSesion = {
  area: string;
  label: string;
  bg: string; border: string; text: string;
  habilidadesPorFranja: Record<string, string[]>;
  actividadesClinicasPorFranja?: Record<string, string[]>;
  paraLaFamiliaPorFranja?: Record<string, string[]>;
  focoSugeridoPorFranja: Record<string, string>;
};

const BLOQUES_SESION: BloqueSesion[] = [
  {
    area: "comprensión",
    label: "Comprensión",
    bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700",
    habilidadesPorFranja: {
      "0-2":   ["Responde a su nombre", "Señala objetos al pedírselo", "Entiende 'no' y 'dame'", "Comprende rutinas cotidianas con apoyo gestual"],
      "3-5":   ["Comprende consignas de un paso", "Responde ¿qué? y ¿dónde?", "Identifica conceptos básicos (arriba/abajo, grande/pequeño)", "Sigue dos instrucciones en secuencia"],
      "6-8":   ["Comprende instrucciones complejas de tres pasos", "Responde ¿por qué? y ¿cómo?", "Comprende narraciones cortas e identifica personajes", "Usa inferencias básicas para completar información"],
      "9-12":  ["Comprende lenguaje figurado simple (metáforas frecuentes)", "Infiere información no explícita en textos", "Identifica la idea principal de un párrafo", "Evalúa si una respuesta es coherente con el contexto"],
      "13-16": ["Analiza argumentos y detecta contradicciones", "Comprende sarcasmo e ironía en contexto", "Integra información de múltiples fuentes orales", "Monitorea su propia comprensión durante la lectura"],
      "17-20": ["Comprensión crítica de textos académicos y técnicos", "Integra y sintetiza información de fuentes múltiples", "Resuelve ambigüedades lingüísticas con autonomía", "Metacognición lectora: detecta y repara fallos de comprensión"],
    },
    focoSugeridoPorFranja: {
      "0-2":   "Estimular comprensión de gestos, rutinas y palabras cotidianas",
      "3-5":   "Trabajar comprensión de consignas simples y preguntas básicas",
      "6-8":   "Desarrollar comprensión inferencial y seguimiento de instrucciones complejas",
      "9-12":  "Trabajar comprensión de textos y lenguaje figurado básico",
      "13-16": "Trabajar comprensión crítica y análisis del discurso",
      "17-20": "Trabajar comprensión académica y metacognición lectora",
    },
  },
  {
    area: "lenguaje",
    label: "Lenguaje",
    bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700",
    habilidadesPorFranja: {
      "0-2":   ["Balbucea y vocaliza con intención comunicativa", "Usa 1–3 palabras funcionales", "Combina gestos y vocalizaciones para comunicar", "Imita sonidos y palabras del entorno cercano"],
      "3-5":   ["Usa frases de 2 a 4 palabras", "Nombra objetos y personas del entorno", "Pide usando palabras en lugar de gestos", "Narra con apoyo visual o adulto que medía"],
      "6-8":   ["Usa oraciones completas con sujeto y predicado", "Emplea conectores básicos: y, pero, porque, entonces", "Narra experiencias recientes en secuencia", "Describe objetos con al menos dos atributos"],
      "9-12":  ["Usa vocabulario variado y preciso", "Narra con estructura: inicio, desarrollo, desenlace", "Construye oraciones subordinadas", "Reformula espontáneamente cuando no es entendido"],
      "13-16": ["Usa lenguaje abstracto y conceptual", "Argumenta y presenta contra-argumentos", "Adapta registro según el contexto (formal/informal)", "Comprende y usa doble sentido o ironía básica"],
      "17-20": ["Discurso formal y académico estructurado", "Planifica y ejecuta exposiciones orales complejas", "Usa recursos retóricos con propósito comunicativo", "Metalenguaje explícito: reflexiona sobre el propio uso del lenguaje"],
    },
    focoSugeridoPorFranja: {
      "0-2":   "Estimular intención comunicativa e inicio del lenguaje verbal",
      "3-5":   "Expandir vocabulario y estructura de frases de 2 a 4 palabras",
      "6-8":   "Trabajar narración, conectores y vocabulario variado",
      "9-12":  "Desarrollar discurso coherente y vocabulario académico",
      "13-16": "Trabajar lenguaje abstracto y habilidades argumentativas",
      "17-20": "Desarrollar competencia comunicativa formal y académica",
    },
  },
  {
    area: "atención",
    label: "Atención",
    bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700",
    habilidadesPorFranja: {
      "0-2":   ["Mantiene contacto visual breve con el adulto", "Responde al nombre de forma consistente", "Explora un objeto por 1–2 minutos", "Sigue la mirada del adulto hacia un objeto señalado"],
      "3-5":   ["Mantiene atención en tarea preferida por 5 minutos", "Cambia el foco atencional con guía del adulto", "Sigue una secuencia de 2 pasos", "Vuelve a la tarea tras una breve distracción"],
      "6-8":   ["Mantiene atención en tarea estructurada por 10 minutos", "Ignora distractores simples del entorno", "Sigue 3 pasos sin recordatorio verbal", "Flexibilidad atencional básica entre tareas"],
      "9-12":  ["Autorregula la atención en tarea escolar", "Planifica pasos de una tarea con apoyo", "Sostiene atención durante 20 o más minutos", "Divide la atención entre escuchar y tomar nota"],
      "13-16": ["Gestiona distractores internos y externos sin apoyo", "Autorregula la atención en contextos grupales complejos", "Planifica y ejecuta tareas multistep de forma autónoma", "Monitorea su propio rendimiento atencional"],
      "17-20": ["Atención dividida en tareas complejas y paralelas", "Planificación autónoma con gestión del tiempo", "Metacognición atencional: detecta y corrige fallos", "Manejo eficaz de carga cognitiva alta"],
    },
    focoSugeridoPorFranja: {
      "0-2":   "Estimular atención conjunta y respuesta a estímulos sociales",
      "3-5":   "Trabajar atención sostenida en tarea estructurada",
      "6-8":   "Desarrollar atención selectiva y flexibilidad atencional",
      "9-12":  "Trabajar autorregulación atencional y planificación",
      "13-16": "Desarrollar atención dividida y gestión de distractores",
      "17-20": "Trabajar metacognición atencional y carga cognitiva",
    },
  },
  {
    area: "fonología",
    label: "Fonología",
    bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700",
    habilidadesPorFranja: {
      "0-2":   ["Discrimina la voz humana del ruido ambiental", "Responde a cambios de entonación y melodía", "Produce vocales con consistencia", "Imita algunos sonidos consonánticos (/p/, /m/, /b/)"],
      "3-5":   ["Produce todas las vocales correctamente", "Discrimina pares mínimos simples (pato/gato)", "Simplifica grupos consonánticos de forma esperada", "Es inteligible para familiares cercanos en >75% de enunciados"],
      "6-8":   ["Articula correctamente en palabras aisladas", "Produce grupos consonánticos simples (br, pr, tr)", "Identifica y produce rimas con facilidad", "Segmenta palabras en sílabas con palmadas"],
      "9-12":  ["Conciencia fonémica avanzada: manipula fonemas", "Manejo correcto de fonemas complejos (/r/, /rr/)", "Aplica reglas ortográficas básicas al leer en voz alta", "Velocidad y ritmo de habla apropiados al contexto"],
      "13-16": ["Articulación correcta en habla espontánea y formal", "Discriminación auditiva fina de sonidos similares", "Procesamiento fonológico rápido y automático", "Conciencia de variantes y acentos dialectales"],
      "17-20": ["Articulación precisa en todos los registros y contextos", "Procesamiento fonológico automático sin esfuerzo consciente", "Manejo de acentos y prosodia según el contexto", "Autocorrección inmediata y eficiente ante errores"],
    },
    focoSugeridoPorFranja: {
      "0-2":   "Estimular discriminación auditiva y producciones vocálicas tempranas",
      "3-5":   "Trabajar conciencia fonológica y discriminación de sonidos",
      "6-8":   "Desarrollar conciencia fonémica y articulación en conversación",
      "9-12":  "Trabajar procesamiento fonológico avanzado y velocidad de habla",
      "13-16": "Trabajar articulación en habla espontánea y procesamiento auditivo",
      "17-20": "Consolidar articulación precisa y procesamiento fonológico automático",
    },
  },
  {
    area: "pragmática",
    label: "Pragmática",
    bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700",
    habilidadesPorFranja: {
      "0-2":   ["Contacto visual funcional durante interacción", "Señalamiento protoimperativo (pedir) y protodeclarativo (mostrar)", "Turno comunicativo básico: actúa, espera, responde", "Responde a gestos y expresiones faciales del adulto"],
      "3-5":   ["Inicia interacciones con pares y adultos conocidos", "Mantiene 2–3 turnos conversacionales", "Usa el lenguaje para diferentes funciones: pedir, saludar, comentar", "Atención conjunta funcional sobre objetos y eventos"],
      "6-8":   ["Mantiene turno conversacional de 4 o más intercambios", "Adapta el mensaje según el interlocutor (niño/adulto)", "Repara la comunicación cuando no es entendido", "Narra con estructura y coherencia"],
      "9-12":  ["Comprende reglas conversacionales (tomar/ceder turno)", "Usa lenguaje indirecto básico (pedidos suaves, cortesía)", "Adapta registro formal e informal según el contexto", "Comprende la intención comunicativa más allá de las palabras"],
      "13-16": ["Maneja conversaciones complejas y grupales", "Comprende y usa ironía y sarcasmo en contexto", "Gestiona conflictos verbalmente con asertividad", "Argumenta su punto de vista respetando el turno ajeno"],
      "17-20": ["Habilidades conversacionales avanzadas en contextos formales", "Discurso académico y laboral apropiado al contexto", "Manejo de pragmática social compleja (negociación, convicción)", "Conciencia de las reglas implícitas de cada contexto comunicativo"],
    },
    focoSugeridoPorFranja: {
      "0-2":   "Estimular contacto visual, turnos y señalamiento comunicativo",
      "3-5":   "Trabajar inicio de interacciones y atención conjunta",
      "6-8":   "Desarrollar turno conversacional y adaptación al interlocutor",
      "9-12":  "Trabajar reglas conversacionales y lenguaje indirecto",
      "13-16": "Desarrollar habilidades conversacionales complejas e ironía",
      "17-20": "Trabajar pragmática social y comunicación académica",
    },
  },
  {
    area: "fonemas",
    label: "Adquisición de fonemas",
    bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700",
    habilidadesPorFranja: {
      "0-2": [
        "Produce vocales con consistencia (a, e, o) en contextos de juego y rutina",
        "Imita sonidos simples del adulto: /p/, /m/, /b/ en silabeo canónico (ma-ma, pa-pa)",
        "Vocaliza con intención comunicativa diferenciada (llamado, protesta, placer)",
        "Produce cadenas de silabeo variado (ba-da, ma-ba) como precursor del habla",
        "Responde diferencialmente a cambios de tono, volumen e inflexión del adulto",
      ],
      "3-5": [
        "Produce con consistencia fonemas tempranos: /p/, /m/, /n/, /b/, /t/, /d/, /k/, /g/, /f/, /l/",
        "Muestra reducción progresiva de procesos fonológicos (simplificación silábica, sustituciones esperadas)",
        "Es inteligible para personas desconocidas en al menos el 75% de sus emisiones",
        "Estructura palabras bisilábicas y trisilábicas sin omisiones de sílabas",
        "Inicia la autocorrección espontánea de errores articulatorios propios",
        "Puede imitar palabras nuevas preservando su estructura silábica",
      ],
      "6-8": [
        "Articula fonemas tardíos con precisión: /r/ simple, /rr/ múltiple, /l/, /s/, /ch/, /ll/",
        "Ha superado los principales procesos fonológicos típicos de la infancia",
        "Generaliza fonemas trabajados a conversación espontánea sin apoyo del terapeuta",
        "Mantiene inteligibilidad plena en todos los contextos, incluso con personas desconocidas",
        "Muestra conciencia fonémica funcional: rima, segmenta y manipula sonidos en palabras",
        "Discrimina auditivamente fonemas similares (r/l, s/z, c/ch) en palabras y oraciones",
      ],
      "9-12": [
        "Articulación correcta y automática en todos los contextos comunicativos",
        "Habla fluente e inteligible sin esfuerzo articulatorio consciente",
        "Monitorea su propia producción y se autocorrige de forma espontánea",
        "Aplica correspondencia fonema-grafema con precisión en lectura y escritura",
        "Mantiene precisión articulatoria en habla rápida y bajo presión social",
        "Adapta velocidad y claridad del habla según el interlocutor y el contexto",
      ],
      "13-16": [
        "Articulación automática y precisa en habla espontánea y formal",
        "Ajusta volumen, velocidad y claridad articulatoria según el contexto social",
        "Manejo funcional de disfluencias si aplica (tartamudez, bloqueos, repeticiones)",
        "Proyección vocal y dicción clara en contextos formales (exposiciones, debate)",
        "Conciencia de la propia voz como herramienta de comunicación e identidad",
        "Identifica y corrige errores articulatorios propios sin necesidad de señalamiento externo",
      ],
      "17-20": [
        "Control articulatorio completo y automático en todos los registros comunicativos",
        "Habla funcional en ámbitos académicos, laborales y sociales sin limitaciones",
        "Autocorrección espontánea y eficiente sin supervisión externa",
        "Conciencia de la voz y su impacto en diferentes contextos comunicativos",
        "Capacidad de adaptar el habla a exigencias complejas: oratoria, presentaciones, debate",
        "Reconoce signos de fatiga vocal o articulatoria y aplica estrategias de autocuidado",
      ],
    },
    actividadesClinicasPorFranja: {
      "0-2": [
        "Imitación de vocalizaciones en turnos vocales cara a cara con el terapeuta",
        "Juego vocal: variación de intensidad, tono y duración de sonidos simples",
        "Estimulación táctil-auditiva de fonemas bilabiales (/p/, /m/, /b/) usando mano del niño en la boca del terapeuta",
        "Actividades de soplo dirigido: velas, plumas, molinetes como preparación oral",
        "Canciones de cuna y rimas con sílabas repetitivas (ma-ma, pa-pa, ba-ba)",
        "Rutinas de turnos: terapeuta produce, espera respuesta, refuerza cualquier vocalización",
      ],
      "3-5": [
        "Repetición de sílabas diana en contexto lúdico: dados de sílabas, juego de memoria fonética",
        "Pares mínimos simples con apoyo visual: tarjetas pato/dato, boca/loca, cama/gama",
        "Denominación de objetos con foco en el fonema objetivo en posición inicial, media y final",
        "Juegos de rima y canciones con el fonema trabajado en múltiples palabras",
        "Uso de espejo para retroalimentación visual del punto de articulación",
        "Praxias orofaciales preparatorias cuando hay dificultad motora oral asociada",
        "Escalera articulatoria: fonema → sílaba → palabra → frase → oración corta",
      ],
      "6-8": [
        "Práctica del fonema tardío en escalera: sílaba → palabra → frase → conversación dirigida",
        "Pares mínimos para contraste auditivo-articulatorio: caro/carro, polo/pollo, pelo/perro",
        "Discriminación auditiva con decisión perceptiva: ¿dije bien o mal?",
        "Lectura en voz alta con foco articulatorio en el fonema trabajado",
        "Trabalenguas graduados: de lento y controlado a velocidad natural",
        "Retroalimentación con grabación breve de voz y comparación con modelo",
        "Juegos de denominación rápida con palabras que contengan el fonema objetivo",
      ],
      "9-12": [
        "Práctica de fonemas en habla conectada: narraciones, descripciones, conversación libre",
        "Lectura en voz alta con automonitoreo articulatorio y grabación para revisión",
        "Trabalenguas con aumento progresivo de velocidad y registro de errores",
        "Role-play de situaciones escolares: exposición, debate, presentación ante grupo simulado",
        "Retroalimentación auditiva: escucha de grabaciones propias, comparación con modelo",
        "Actividades de fluidez articulatoria en habla narrativa continua (1-2 minutos)",
        "Juegos de velocidad articulatoria con monitoreo de precisión vs. velocidad",
      ],
      "13-16": [
        "Práctica articulatoria en contextos funcionales: exposiciones orales simuladas, lectura expresiva",
        "Monitoreo con grabación de video/audio y autoevaluación guiada por rúbrica",
        "Ejercicios de proyección vocal, respiración fonatoria y pausas expresivas intencionales",
        "Trabajo en prosodia: entonación, ritmo, énfasis y modulación del habla",
        "Simulacros de situaciones reales: entrevistas, presentaciones, discursos breves",
        "Técnicas de manejo de ansiedad comunicativa: respiración, preparación, ensayo mental",
        "Análisis crítico de registros propios: qué mejorar, qué ya está consolidado",
      ],
      "17-20": [
        "Práctica en contextos reales: exposiciones académicas, entrevistas simuladas, conversaciones formales",
        "Ejercicios de control vocal, dicción y claridad articulatoria en habla continua extendida",
        "Retroalimentación auditiva y automonitoreo: grabaciones propias, análisis comparativo",
        "Estrategias de comunicación eficaz en contextos laborales y sociales complejos",
        "Trabajo en voz y proyección: control de volumen, ritmo y pausas en presentaciones",
        "Identificación de patrones de fatiga vocal y aplicación de estrategias de higiene vocal",
        "Práctica de habla espontánea en grupos: reuniones, seminarios, discusión de casos",
      ],
    },
    paraLaFamiliaPorFranja: {
      "0-2": [
        "Imitar y expandir las vocalizaciones del niño como un juego de turnos vocal",
        "Hablar despacio, con contacto visual, sonrisa y cara expresiva",
        "Usar canciones y rimas con fonemas bilabiales repetidos: ma-ma, pa-pa, bu-bu",
        "Señalar y nombrar objetos del entorno con sílabas simples en la rutina diaria",
        "No exigir producción: celebrar cada intento vocal sin presión",
      ],
      "3-5": [
        "Modelar la pronunciación correcta en respuesta expansiva, sin corregir explícitamente",
        "Jugar con rimas y canciones que incluyan el fonema trabajado en sesión",
        "Reforzar positivamente todos los intentos articulatorios, no solo los perfectos",
        "Leer cuentos en voz alta con palabras que contengan el fonema objetivo",
        "Evitar pedir al niño que 'repita bien' o 'diga otra vez' frente a otros",
        "Preguntar al terapeuta qué fonema se está trabajando para reforzarlo en casa",
      ],
      "6-8": [
        "Practicar en casa las palabras trabajadas en sesión: 5 minutos diarios de repaso lúdico",
        "No completar las frases del niño antes de que termine de hablar",
        "Celebrar los logros articulatorios sin presionar por perfección inmediata",
        "Avisar al terapeuta si se nota evitación del habla o frustración al comunicar",
        "Usar juegos de palabras, rimas y trabalenguas en casa como práctica natural",
        "Evitar correcciones públicas frente a compañeros, familiares o en situaciones sociales",
      ],
      "9-12": [
        "Escuchar al hijo/a sin corregir constantemente ni interrumpir",
        "Motivar la práctica a través de exposiciones escolares, lecturas en voz alta o canto",
        "Apoyar la generalización usando en conversación natural las palabras trabajadas",
        "Crear situaciones cotidianas de práctica: contar el día, narrar una película, leer en familia",
        "Valorar el progreso aunque no sea perfecto: el proceso articulatorio lleva tiempo",
      ],
      "13-16": [
        "Crear espacios de conversación donde pueda practicar hablar con claridad y extensión",
        "Evitar completar sus frases o anticipar lo que va a decir",
        "Apoyar la confianza comunicativa en situaciones sociales, especialmente escolares",
        "Valorar el esfuerzo comunicativo más allá de la corrección articulatoria",
        "Evitar comentarios negativos sobre la voz, el habla o la forma de expresarse",
      ],
      "17-20": [
        "Escuchar activamente sin interrumpir ni completar sus ideas",
        "Brindar retroalimentación positiva en contextos cotidianos de comunicación",
        "Apoyar oportunidades reales de hablar en público, grupos de estudio o trabajo",
        "Respetar su autonomía comunicativa: no corregir, acompañar",
        "Reconocer y celebrar los avances en claridad y confianza del habla",
      ],
    },
    focoSugeridoPorFranja: {
      "0-2":   "Estimular vocalizaciones intencionales e imitación de fonemas bilabiales tempranos (/p/, /m/, /b/)",
      "3-5":   "Adquisición de fonemas del desarrollo temprano y reducción de procesos fonológicos esperados",
      "6-8":   "Consolidación de fonemas tardíos (/r/, /rr/, /l/) y generalización al habla espontánea",
      "9-12":  "Automatización articulatoria, monitoreo propio y trabajo en habla conectada y fluida",
      "13-16": "Articulación en contextos comunicativos funcionales: prosodia, proyección y confianza",
      "17-20": "Comunicación articulatoria eficaz en contextos adultos: control, dicción y autocuidado vocal",
    },
  },
];

type RowState = {
  checked: boolean;
  intentos: string;
  correctas: string;
  estado: string;
};

const ESTADO_OPTIONS = [
  { value: "logrado",     label: "✅ Logrado"    },
  { value: "en progreso", label: "🔵 En progreso" },
  { value: "con ayuda",   label: "🟡 Con ayuda"   },
  { value: "no logrado",  label: "🔴 No logrado"  },
];

const ESTADO_STYLE: Record<string, string> = {
  "logrado":     "bg-emerald-50 border-emerald-300 text-emerald-800",
  "en progreso": "bg-amber-50 border-amber-300 text-amber-800",
  "con ayuda":   "bg-amber-50 border-amber-300 text-amber-800",
  "no logrado":  "bg-red-50 border-red-300 text-red-800",
};

const ESTADO_BADGE: Record<string, string> = {
  "logrado":     "bg-emerald-100 text-emerald-700",
  "en progreso": "bg-amber-100 text-amber-700",
  "con ayuda":   "bg-amber-100 text-amber-700",
  "no logrado":  "bg-red-100 text-red-700",
};

function calcAutoEstado(intentos: string, correctas: string): string | null {
  const i = parseInt(intentos);
  const c = parseInt(correctas);
  if (isNaN(i) || isNaN(c) || i === 0) return null;
  const pct = Math.min(c, i) / i;
  if (pct >= 0.8) return "logrado";
  if (pct >= 0.6) return "en progreso";
  if (pct >= 0.4) return "con ayuda";
  return "no logrado";
}

function calcPct(intentos: string, correctas: string): number | null {
  const i = parseInt(intentos);
  const c = parseInt(correctas);
  if (isNaN(i) || isNaN(c) || i === 0) return null;
  return Math.round((Math.min(c, i) / i) * 100);
}

export default function NuevaSesion() {
  const [, navigate]               = useLocation();
  const search                     = useSearch();
  const { toast }                  = useToast();
  const queryClient                = useQueryClient();

  // Pre-selected patient from URL query: /nueva-sesion?patientId=5
  const preselectedId = useMemo(() => {
    const v = new URLSearchParams(search).get("patientId");
    return v ? parseInt(v, 10) : null;
  }, [search]);

  const today = new Date().toISOString().split("T")[0];

  const [patientSearch, setPatientSearch]     = useState("");
  const [showPatientList, setShowPatientList] = useState(false);
  const [patient, setPatient]                 = useState<any>(null);
  const [fecha, setFecha]                     = useState(today);

  const [rows, setRows]                       = useState<Record<number, RowState>>({});

  const [adHocGoals, setAdHocGoals]           = useState<any[]>([]);
  const [adHocRows, setAdHocRows]             = useState<Record<number, RowState>>({});

  const [showBanco, setShowBanco]             = useState(false);
  const [bancoArea, setBancoArea]             = useState("");
  const [bancoSubarea, setBancoSubarea]       = useState("");
  const [bancoSearch, setBancoSearch]         = useState("");
  const [bancoSelected, setBancoSelected]     = useState<Set<number>>(new Set());

  const [showAllGoals, setShowAllGoals]       = useState(false);
  const [resumen, setResumen]                 = useState("");
  const [observaciones, setObservaciones]     = useState("");
  const [focoTerapeutico, setFocoTerapeutico] = useState("");
  const [isSaving, setIsSaving]               = useState(false);
  const [selectedBloque, setSelectedBloque]   = useState<string | null>(null);
  const [selectedEdad, setSelectedEdad]       = useState("3-5");

  // ── Derive patient age franja ──────────────────────────────────────────────
  const edadPaciente = useMemo(() => {
    if (!patient) return null;
    return calcularEdadAnios(patient.fechaNacimiento, patient.age);
  }, [patient]);

  const franjaPaciente = useMemo(() => {
    if (edadPaciente == null) return null;
    return edadAFranja(edadPaciente);
  }, [edadPaciente]);

  useEffect(() => {
    if (franjaPaciente) {
      setSelectedEdad(franjaPaciente);
      setSelectedBloque(null);
    }
  }, [franjaPaciente]);

  // ── Voice recording ───────────────────────────────────────────────────────
  const [isRecording, setIsRecording]         = useState(false);
  const recognitionRef                        = useRef<any>(null);
  const hasSpeechSupport = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startRecording = () => {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "es-CL";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results as SpeechRecognitionResultList)
        .slice(e.resultIndex)
        .map((r: any) => (r as SpeechRecognitionResult)[0].transcript)
        .join(" ")
        .trim();
      if (transcript) {
        setObservaciones(prev => prev ? `${prev} ${transcript}` : transcript);
      }
    };
    rec.onerror = () => { setIsRecording(false); };
    rec.onend   = () => { setIsRecording(false); };
    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  // Clinical detail cache: goal.id → { libraryEntry, activities }
  const [detailCache, setDetailCache]         = useState<Record<number, any>>({});
  // Which goals have their clinical detail panel open
  const [detailOpenFor, setDetailOpenFor]     = useState<Set<string>>(new Set());

  // Track auto-check to avoid resetting after manual changes
  const hasAutoChecked = useRef<number | null>(null);

  const { data: patients = [] } = useListPatients();

  const { data: goalsRaw = [], isLoading: loadingGoals } = useQuery({
    queryKey: ["nueva-sesion-goals", patient?.id],
    queryFn: async () => {
      const res = await fetch(`/api/goals?patientId=${patient.id}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!patient,
  });

  const { data: bancoRaw = [], isLoading: loadingBanco } = useQuery({
    queryKey: ["banco-filter", bancoArea, bancoSubarea, bancoSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ estado: "activo" });
      if (bancoArea) params.append("area", bancoArea);
      if (bancoSubarea) params.append("subarea", bancoSubarea);
      if (bancoSearch.trim()) params.append("q", bancoSearch.trim());
      const res = await fetch(`/api/goal-library?${params}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: showBanco && !!bancoArea,
  });

  const goals = (goalsRaw as any[]).filter(
    g => g.status === "activo" || g.status === "en progreso"
  );

  const assignedLibraryIds = new Set([
    ...(goalsRaw as any[]).map((g: any) => g.goalLibraryId).filter(Boolean),
    ...adHocGoals.map(g => g.id),
  ]);
  const bancoFiltered = (bancoRaw as any[]).filter(g => !assignedLibraryIds.has(g.id));

  const filteredPatients = (patients as any[]).filter(p =>
    !patientSearch || p.name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  // ── Suggested goals (priority: en progreso → age match → activos) ──────────
  const suggestedGoals = useMemo(() => {
    if (goals.length === 0) return [];
    const patientAge = patient?.age ? parseInt(patient.age) : null;

    const score = (g: any) => {
      let s = 0;
      if (g.status === "en progreso") s += 10;
      if (patientAge && g.franjaEtaria) {
        const [min, max] = g.franjaEtaria.split("-").map(Number);
        if (patientAge >= min && patientAge <= max) s += 5;
      }
      if (g.progressPct !== null && g.progressPct !== undefined) s += 1;
      return s;
    };

    return [...goals].sort((a, b) => score(b) - score(a)).slice(0, 3);
  }, [goals, patient]);

  const lastWorkedGoal = useMemo(
    () => goals.find(g => g.status === "en progreso") ?? goals[0] ?? null,
    [goals],
  );

  // Remaining goals not in suggestions
  const otherGoals = useMemo(
    () => goals.filter(g => !suggestedGoals.some(s => s.id === g.id)),
    [goals, suggestedGoals],
  );

  // Auto-check suggested goals once goals load for this patient
  useEffect(() => {
    if (!patient || loadingGoals || goals.length === 0) return;
    if (hasAutoChecked.current === patient.id) return;
    hasAutoChecked.current = patient.id;

    const initial: Record<number, RowState> = {};
    suggestedGoals.forEach(g => {
      initial[g.id] = { checked: true, intentos: "", correctas: "", estado: g.status === "en progreso" ? "en progreso" : "en progreso" };
    });
    setRows(initial);
  }, [patient, loadingGoals, suggestedGoals]);

  const selectPatient = (p: any) => {
    setPatient(p);
    setPatientSearch(p.name);
    setShowPatientList(false);
    setRows({});
    setAdHocGoals([]);
    setAdHocRows({});
    setDetailCache({});
    setDetailOpenFor(new Set());
    hasAutoChecked.current = null;
  };

  // Auto-select patient from URL param once patients list is available
  useEffect(() => {
    if (!preselectedId || patient || (patients as any[]).length === 0) return;
    const found = (patients as any[]).find((p: any) => p.id === preselectedId);
    if (found) selectPatient(found);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedId, patients]);

  // ── Fetch clinical detail (libraryEntry + activities) for a goal ───────────
  const fetchDetail = async (goalId: number) => {
    if (detailCache[goalId]) return;
    try {
      const res = await fetch(`/api/goals/${goalId}/activities`);
      if (res.ok) {
        const data = await res.json();
        setDetailCache(prev => ({ ...prev, [goalId]: data }));
      }
    } catch {}
  };

  type GoalMeta = { title?: string; area?: string; subarea?: string; franjaEtaria?: string; definicionOperativa?: string };

  const toggleDetailFor = (key: string, goalId?: number) => {
    setDetailOpenFor(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        if (goalId) fetchDetail(goalId);
      }
      return next;
    });
  };

  // ── Row helpers ───────────────────────────────────────────────────────────
  const defaultRow = (status = "en progreso"): RowState => ({ checked: false, intentos: "", correctas: "", estado: status });

  const setRow = (goalId: number, patch: Partial<RowState>) =>
    setRows(prev => ({ ...prev, [goalId]: { ...(prev[goalId] ?? defaultRow()), ...patch } }));

  const toggleRow = (goalId: number) => {
    const cur = rows[goalId];
    setRow(goalId, { checked: !cur?.checked });
  };

  const setAdHocRow = (libId: number, patch: Partial<RowState>) =>
    setAdHocRows(prev => ({ ...prev, [libId]: { ...(prev[libId] ?? { checked: true, intentos: "", correctas: "", estado: "en progreso" }), ...patch } }));

  const toggleBancoGoal = (id: number) => {
    setBancoSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllBanco = () => {
    setBancoSelected(new Set(bancoFiltered.map((g: any) => g.id)));
  };

  const clearBancoSelection = () => setBancoSelected(new Set());

  const addSelectedGoals = () => {
    const toAdd = bancoFiltered.filter((g: any) => bancoSelected.has(g.id));
    if (toAdd.length === 0) return;
    setAdHocGoals(prev => {
      const existing = new Set(prev.map((g: any) => g.id));
      return [...prev, ...toAdd.filter((g: any) => !existing.has(g.id))];
    });
    setAdHocRows(prev => {
      const next = { ...prev };
      toAdd.forEach((g: any) => {
        next[g.id] = { checked: true, intentos: "", correctas: "", estado: "en progreso" };
      });
      return next;
    });
    setBancoSelected(new Set());
  };

  const removeAdHocGoal = (libId: number) => {
    setAdHocGoals(prev => prev.filter(g => g.id !== libId));
    setAdHocRows(prev => { const n = { ...prev }; delete n[libId]; return n; });
  };

  const checkedGoals  = goals.filter(g => rows[g.id]?.checked);
  const checkedAdHoc  = adHocGoals.filter(g => adHocRows[g.id]?.checked !== false);
  const totalSelected = checkedGoals.length + checkedAdHoc.length;
  const canSave       = !!patient && (totalSelected > 0 || resumen.trim().length > 0);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      const rcRes = await fetch("/api/registros-clinicos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          fecha,
          resumenSesion: resumen || undefined,
          observaciones: observaciones || undefined,
        }),
      });
      if (!rcRes.ok) throw new Error("Error al crear el registro");
      const rc = await rcRes.json();

      if (checkedGoals.length > 0) {
        await Promise.all(checkedGoals.map(goal => {
          const row = rows[goal.id];
          const map = PERFORMANCE_MAP[row.estado] ?? PERFORMANCE_MAP["en progreso"];
          return fetch(`/api/goals/${goal.id}/progress`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              statusNuevo: map.statusNuevo,
              progressPct: map.pct,
              registroClinicoId: rc.id,
              nota: `Sesión ${fecha}: ${map.label}`,
              intentos: row.intentos ? parseInt(row.intentos) : undefined,
              correctas: row.correctas ? parseInt(row.correctas) : undefined,
            }),
          });
        }));
      }

      if (checkedAdHoc.length > 0) {
        await Promise.all(checkedAdHoc.map(async (libGoal) => {
          const row = adHocRows[libGoal.id];
          const map = PERFORMANCE_MAP[row.estado] ?? PERFORMANCE_MAP["en progreso"];

          const alreadyAssigned = (goalsRaw as any[]).find((g: any) => g.goalLibraryId === libGoal.id);
          let goalId: number;

          if (alreadyAssigned) {
            goalId = alreadyAssigned.id;
          } else {
            const assignRes = await fetch("/api/goals", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                patientId: patient.id,
                goalLibraryId: libGoal.id,
                title: libGoal.nombreObjetivo,
                description: libGoal.definicionOperativa ?? null,
                category: libGoal.areaClinica ?? libGoal.area ?? "general",
                areaClinica: libGoal.areaClinica ?? libGoal.area ?? "general",
                nivelDificultad: libGoal.nivelDificultad ?? null,
                franjaEtaria: libGoal.franjaEtaria ?? null,
                codigo: libGoal.idObjetivo ?? null,
                status: "activo",
              }),
            });
            if (!assignRes.ok) throw new Error("Error al asignar objetivo del banco");
            const newGoal = await assignRes.json();
            goalId = newGoal.id;
          }

          await fetch(`/api/goals/${goalId}/progress`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              statusNuevo: map.statusNuevo,
              progressPct: map.pct,
              registroClinicoId: rc.id,
              nota: `Sesión ${fecha} (objetivo del día): ${map.label}`,
              intentos: row.intentos ? parseInt(row.intentos) : undefined,
              correctas: row.correctas ? parseInt(row.correctas) : undefined,
            }),
          });
        }));
      }

      queryClient.invalidateQueries({ queryKey: getListRegistrosClinicosQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
      const n = totalSelected;
      toast({ title: n > 0 ? `Sesión guardada · ${n} objetivo${n !== 1 ? "s" : ""} actualizado${n !== 1 ? "s" : ""}` : "Sesión guardada" });
      if (window.history.length > 1) window.history.back();
      else navigate(preselectedId ? `/patients/${preselectedId}` : "/");
    } catch (err: any) {
      toast({ title: "Error al guardar la sesión", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // ── GoalRow component ─────────────────────────────────────────────────────
  function GoalRow({
    goalId,
    title,
    subtitle,
    row,
    onToggle,
    onSetRow,
    isAdHoc,
    isSuggested,
    onRemove,
    libraryData,
    goalIdForDetail,
    goalMeta,
  }: {
    goalId: number;
    title: string;
    subtitle: string;
    row: RowState;
    onToggle: () => void;
    onSetRow: (patch: Partial<RowState>) => void;
    isAdHoc?: boolean;
    isSuggested?: boolean;
    onRemove?: () => void;
    libraryData?: any;
    goalIdForDetail?: number;
    goalMeta?: GoalMeta;
  }) {
    const estadoStyle = ESTADO_STYLE[row.estado] ?? "";
    const pct = calcPct(row.intentos, row.correctas);
    const autoEstado = calcAutoEstado(row.intentos, row.correctas);
    const detailKey = isAdHoc ? `adhoc-${goalId}` : `${goalId}`;
    const showDetail = detailOpenFor.has(detailKey);
    const clinicalContent = getClinicalContent(goalMeta?.area, goalMeta?.subarea);

    // For assigned goals: libraryEntry from cache; for ad-hoc: the libGoal itself
    const entry = isAdHoc ? libraryData : (detailCache[goalIdForDetail ?? goalId]?.libraryEntry ?? null);
    // Structured activities from DB (for assigned goals only)
    const dbActivities: any[] = isAdHoc
      ? []
      : (detailCache[goalIdForDetail ?? goalId]?.activities ?? []);

    return (
      <div className={`transition-colors ${row.checked ? "bg-muted/40" : ""}`}>
        {/* Header row */}
        <div
          className="flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-muted/40/80"
          onClick={onToggle}
        >
          <div className="mt-0.5 shrink-0" onClick={e => { e.stopPropagation(); onToggle(); }}>
            {row.checked
              ? <CheckSquare className="h-5 w-5" style={{ color: BRAND_TEAL }} />
              : <Square className="h-5 w-5 text-muted-foreground/40" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-xs font-medium leading-snug ${row.checked ? "text-foreground" : "text-muted-foreground"}`}>
                {title}
              </p>
              {isSuggested && (
                <span className="inline-flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5 font-semibold shrink-0"
                  style={{ background: `${BRAND_TEAL}18`, color: BRAND_TEAL }}>
                  <Sparkles className="h-2.5 w-2.5" /> Sugerido
                </span>
              )}
              {isAdHoc && (
                <span className="inline-flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5 font-semibold shrink-0"
                  style={{ background: `${BRAND_TEAL}18`, color: BRAND_TEAL }}>
                  <BookOpen className="h-2.5 w-2.5" /> Del banco
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAdHoc && onRemove && (
              <button className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                onClick={e => { e.stopPropagation(); onRemove(); }}>
                <X className="h-4 w-4" />
              </button>
            )}
            <ChevronDown className={`h-4 w-4 text-muted-foreground/40 transition-transform ${row.checked ? "rotate-180" : ""}`} />
          </div>
        </div>

        {/* Expanded: performance inputs + clinical detail */}
        {row.checked && (
          <div className="px-5 pb-4 border-t border-border/50 space-y-3" onClick={e => e.stopPropagation()}>

            {/* Performance grid: Intentos · Correctas · Estado */}
            {false && (
              <div className="grid grid-cols-3 gap-2 pt-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Intentos</label>
                <Input type="number" min={0} placeholder="0"
                  value={row.intentos}
                  onChange={e => onSetRow({ intentos: e.target.value })}
                  className="bg-white h-9 text-sm text-center" />
              </div>
                
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Correctas</label>
                <Input type="number" min={0} placeholder="0"
                  value={row.correctas}
                  onChange={e => onSetRow({ correctas: e.target.value })}
                  className="bg-white h-9 text-sm text-center" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Estado</label>
                  {autoEstado && autoEstado !== row.estado && (
                    <button
                      onClick={() => onSetRow({ estado: autoEstado })}
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full transition-all hover:opacity-80"
                      style={{ background: `${BRAND_TEAL}15`, color: BRAND_TEAL }}
                      title="Aplicar estado sugerido"
                    >
                      → {autoEstado}
                    </button>
                  )}
                </div>
                <Select value={row.estado} onValueChange={v => onSetRow({ estado: v })}>
                  <SelectTrigger className={`h-9 text-xs border ${estadoStyle}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADO_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            )}

            {/* Performance bar */}
            {pct !== null && (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all ${pct >= 80 ? "bg-emerald-400" : pct >= 60 ? "bg-teal-400" : pct >= 40 ? "bg-amber-400" : "bg-red-400"}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-muted-foreground w-9 text-right">{pct}%</span>
              </div>
            )}

            {/* Clinical detail toggle — always available when row is checked */}
            <button
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
              onClick={() => toggleDetailFor(detailKey, goalIdForDetail ?? goalId)}
            >
              <Info className="h-3.5 w-3.5" />
              {showDetail ? "Ocultar guía clínica" : "Ver guía clínica"}
              <ChevronRight className={`h-3 w-3 transition-transform ${showDetail ? "rotate-90" : ""}`} />
            </button>

            {/* Clinical detail panel */}
            {showDetail && (
              <div className="border border-border rounded-xl overflow-hidden text-xs">

                {/* Definición operativa */}
                {(entry?.definicionOperativa) && (
                  <div className="flex gap-2.5 px-3.5 py-3 bg-white border-b border-border/50">
                    <ClipboardList className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground/70 mb-0.5">Definición operativa</p>
                      <p className="text-muted-foreground leading-relaxed">{entry.definicionOperativa}</p>
                    </div>
                  </div>
                )}

                {/* Marco conceptual — static content */}
                {(clinicalContent?.marcoConceptual || entry?.marcoConceptual) && (
                  <div className="flex gap-2.5 px-3.5 py-3 bg-teal-50/60 border-b border-teal-100/60">
                    <Brain className="h-3.5 w-3.5 text-teal-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-teal-700 mb-1">Marco conceptual</p>
                      <p className="text-teal-800/80 leading-relaxed">
                        {clinicalContent?.marcoConceptual ?? entry?.marcoConceptual}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actividades clínicas — static + DB */}
                {(() => {
                  const staticItems = clinicalContent?.actividadesClinicas ?? [];
                  const dbItems = dbActivities
                    .filter((a: any) => a.tipo !== "familia" && (a.descripcion || a.actividad))
                    .map((a: any) => a.descripcion || a.actividad);
                  const textualItems = entry?.actividadesClinicas
                    ? entry.actividadesClinicas.split(/[·•\n]+/).map((s: string) => s.trim()).filter(Boolean)
                    : [];
                  // Static content is primary; DB items fill gaps; dedupe by text
                  const seen = new Set(staticItems.map((s: string) => s.toLowerCase()));
                  const extra = [...dbItems, ...textualItems].filter(
                    (s: string) => !seen.has(s.toLowerCase())
                  );
                  const items = [...staticItems, ...extra].slice(0, 4);
                  if (items.length === 0) return null;
                  return (
                    <div className="flex gap-2.5 px-3.5 py-3 bg-teal-50/40 border-b border-teal-100/60">
                      <Sparkles className="h-3.5 w-3.5 text-teal-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-teal-700 mb-1">Actividades clínicas</p>
                        <ul className="space-y-1.5">
                          {items.map((act: string, i: number) => (
                            <li key={i} className="flex gap-1.5 text-teal-800/80">
                              <span className="text-teal-400 shrink-0 mt-0.5">·</span>
                              <span className="leading-snug">{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })()}

                {/* Actividades para el hogar — static content */}
                {(() => {
                  const staticItems = clinicalContent?.actividadesHogar ?? [];
                  const fallbackText = entry?.actividadesFamilia as string | undefined;
                  if (staticItems.length === 0 && !fallbackText) return null;
                  return (
                    <div className="flex gap-2.5 px-3.5 py-3 bg-amber-50/60 border-b border-amber-100/60">
                      <Home className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-amber-700 mb-1">Actividades para el hogar</p>
                        {staticItems.length > 0 ? (
                          <ul className="space-y-1.5">
                            {staticItems.map((sug, i) => (
                              <li key={i} className="flex gap-1.5 text-amber-800/80">
                                <span className="text-amber-400 shrink-0 mt-0.5">·</span>
                                <span className="leading-snug">{sug}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground leading-relaxed">{fallbackText}</p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Actividades sugeridas */}
                <div className="flex gap-2.5 px-3.5 py-3 bg-muted/40">
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground/70 mb-2">Actividades sugeridas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        ACTIVIDADES_POR_AREA[(goalMeta?.area ?? goalMeta?.subarea ?? "").toLowerCase()] ??
                        ["Actividad guiada", "Selección", "Asociación"]
                      ).map(chip => (
                        <span
                          key={chip}
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-white border border-border text-foreground/70 select-none"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto flex flex-col gap-5 animate-in fade-in duration-300">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.length > 1 ? window.history.back() : navigate(preselectedId ? `/patients/${preselectedId}` : "/")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Volver
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2" style={{ color: BRAND_BLUE }}>
            <ClipboardList className="h-6 w-6" style={{ color: BRAND_TEAL }} />
            Nuevo registro clínico
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Completa los datos de la sesión de hoy.</p>
        </div>

        {/* ── Card: paciente + fecha ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Paciente */}
            <div className="space-y-1.5 flex-1">
              <label className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
                <User className="h-4 w-4" style={{ color: BRAND_TEAL }} />
                Paciente <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Buscar paciente..."
                  value={patientSearch}
                  autoComplete="off"
                  onChange={e => { setPatientSearch(e.target.value); setShowPatientList(true); setPatient(null); }}
                  onFocus={() => setShowPatientList(true)}
                  onBlur={() => setTimeout(() => setShowPatientList(false), 150)}
                  className="pl-9 bg-muted/50"
                />
                {showPatientList && filteredPatients.length > 0 && (
                  <div className="absolute z-20 top-full mt-1 w-full bg-white border border-border rounded-xl shadow-lg max-h-52 overflow-y-auto">
                    {filteredPatients.map((p: any) => (
                      <button
                        key={p.id}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 text-left transition-colors"
                        onMouseDown={e => { e.preventDefault(); selectPatient(p); }}
                      >
                        <div
                          className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: BRAND_TEAL }}
                        >
                          {p.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-foreground">{p.name}</span>
                        {p.age && <span className="text-xs text-muted-foreground ml-1">{p.age} años</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {patient && (
                <p className="text-xs text-muted-foreground pl-1">
                  <strong className="text-foreground/80">{patient.name}</strong>
                  {patient.age && ` · ${patient.age} años`}
                  {patient.diagnosis && ` · ${patient.diagnosis}`}
                </p>
              )}
            </div>

            {/* Fecha */}
            <div className="space-y-1.5 sm:w-44">
              <label className="text-sm font-semibold text-foreground/80">Fecha</label>
              <Input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="bg-muted/50"
              />
            </div>
          </div>
        </div>

        {/* ── Guía de la sesión ─────────────────────────────────────────── */}
        {patient && !loadingGoals && goals.length > 0 && (
          <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: `${BRAND_TEAL}30`, background: `linear-gradient(135deg, ${BRAND_TEAL}06 0%, #f0f9ff 100%)` }}>
            {/* Header */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b" style={{ borderColor: `${BRAND_TEAL}20` }}>
              <Sparkles className="h-4 w-4" style={{ color: BRAND_TEAL }} />
              <h2 className="text-sm font-bold text-foreground">Guía de la sesión</h2>
            </div>

            <div className="divide-y" style={{ borderColor: `${BRAND_TEAL}15` }}>
              {/* Last session summary */}
              {lastWorkedGoal && (
                <div className="px-5 py-3.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Sesión anterior</p>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground/80 truncate">{lastWorkedGoal.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ESTADO_BADGE[lastWorkedGoal.status] ?? "bg-muted text-muted-foreground"}`}>
                          {lastWorkedGoal.status}
                        </span>
                        {lastWorkedGoal.progressPct != null && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {lastWorkedGoal.progressPct}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Suggested objectives */}
              <div className="px-5 py-3.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">
                  Trabajo en sesión 
                </p>
                <div className="space-y-2">
                  {suggestedGoals.map(goal => {
                    const row = rows[goal.id] ?? defaultRow(goal.status);
                    return (
                      <button
                        key={goal.id}
                        className="w-full flex items-center gap-3 text-left rounded-xl px-3.5 py-2.5 transition-all hover:shadow-sm"
                        style={{
                          background: row.checked ? `${BRAND_TEAL}12` : "white",
                          border: `1.5px solid ${row.checked ? BRAND_TEAL + "40" : "#e2e8f0"}`,
                        }}
                        onClick={() => toggleRow(goal.id)}
                      >
                        <div className="shrink-0">
                          {row.checked
                            ? <CheckSquare className="h-4.5 w-4.5" style={{ color: BRAND_TEAL }} />
                            : <Square className="h-4.5 w-4.5 text-muted-foreground/40" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium leading-snug ${row.checked ? "text-foreground" : "text-muted-foreground"}`}>
                            {goal.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {goal.areaClinica ?? goal.category}
                          </p>
                        </div>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${ESTADO_BADGE[goal.status] ?? "bg-muted text-muted-foreground"}`}>
                          {goal.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Foco terapéutico ─────────────────────────────────────────── */}
        {patient && (
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Foco terapéutico</label>
            <Textarea
              placeholder="Ej: trabajar comprensión de consignas y conectores temporales…"
              rows={2}
              value={focoTerapeutico}
              onChange={e => setFocoTerapeutico(e.target.value)}
              className="bg-muted/50 resize-none text-sm"
            />
          </div>
        )}

        {/* ── Guía por edad y área ─────────────────────────────────────── */}
        {patient && (
          <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: "#E8D5C4", background: "#FEFAF6" }}>
            {/* Header — warm autumn */}
            <div className="px-5 py-3.5 border-b flex items-center gap-2" style={{ borderColor: "#E8D5C4", background: "#FDF3E9" }}>
              <Brain className="h-4 w-4" style={{ color: "#C4703A" }} />
              <h2 className="text-sm font-semibold" style={{ color: "#7C3D12" }}>Guía por edad y área</h2>
            </div>

            {/* Age range pills */}
            <div className="px-4 pt-3 pb-1 flex flex-wrap gap-1.5 items-center">
              {franjaPaciente && edadPaciente != null && (
                <span className="text-[11px] font-medium mr-1" style={{ color: "#92400E" }}>
                  {edadPaciente}a →
                </span>
              )}
              {FRANJAS_EDAD.map(f => {
                const isPaciente = f.value === franjaPaciente;
                const isSelected = f.value === selectedEdad;
                return (
                  <button
                    key={f.value}
                    onClick={() => { setSelectedEdad(f.value); setSelectedBloque(null); }}
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all"
                    style={isSelected
                      ? { background: "#C4703A", borderColor: "#C4703A", color: "white" }
                      : isPaciente
                        ? { background: "#FEF3E2", borderColor: "#C4703A", color: "#92400E" }
                        : { background: "white", borderColor: "#E8D5C4", color: "#92400E" }}
                  >
                    {f.label}{isPaciente && !isSelected ? " ·" : ""}
                  </button>
                );
              })}
            </div>

            {/* Area chips */}
            <div className="px-4 pt-2 pb-3 flex flex-wrap gap-2">
              {BLOQUES_SESION.map(bloque => {
                const isOpen = selectedBloque === bloque.area;
                return (
                  <button
                    key={bloque.area}
                    onClick={() => setSelectedBloque(isOpen ? null : bloque.area)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      isOpen
                        ? `${bloque.bg} ${bloque.border} ${bloque.text} ring-2 ring-offset-1 ring-current`
                        : "bg-white border-border text-foreground/70 hover:border-border"
                    }`}
                  >
                    {bloque.label}
                  </button>
                );
              })}
            </div>

            {/* Expanded block panel */}
            {selectedBloque && (() => {
              const bloque = BLOQUES_SESION.find(b => b.area === selectedBloque);
              if (!bloque) return null;
              const edadLabel     = FRANJAS_EDAD.find(f => f.value === selectedEdad)?.label ?? selectedEdad;
              const habs          = bloque.habilidadesPorFranja[selectedEdad] ?? [];
              const acts          = bloque.actividadesClinicasPorFranja?.[selectedEdad];
              const familia       = bloque.paraLaFamiliaPorFranja?.[selectedEdad];
              const focoSugerido  = bloque.focoSugeridoPorFranja[selectedEdad] ?? "";
              return (
                <div className={`mx-4 mb-4 rounded-xl border ${bloque.border} overflow-hidden`} style={{ background: "white" }}>
                  {/* Block title */}
                  <div className={`px-4 py-2.5 border-b ${bloque.border} ${bloque.bg}`}>
                    <p className={`text-[11px] font-bold uppercase tracking-wide ${bloque.text}`}>
                      {bloque.label} · {edadLabel}
                    </p>
                  </div>

                  {/* Empty state — no content for this franja */}
                  {habs.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-muted-foreground">Sin contenido clínico para esta franja etaria.</p>
                      <p className="text-xs text-muted-foreground/40 mt-1">Selecciona otra franja o consulta al supervisor clínico.</p>
                    </div>
                  ) : (
                    <>
                      {/* Habilidades esperadas */}
                      <div className="px-4 py-3">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Habilidades esperadas</p>
                        <ul className="space-y-1.5">
                          {habs.map((h, i) => (
                            <li key={i} className="flex gap-2 text-sm text-foreground/80">
                              <span className={`shrink-0 font-bold mt-0.5 ${bloque.text}`}>·</span>
                              <span className="leading-snug">{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Actividades clínicas — only if present for this franja */}
                      {acts && acts.length > 0 && (
                        <div className="px-4 py-3 border-t border-border/50">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Actividades clínicas</p>
                          <ul className="space-y-1.5">
                            {acts.map((a, i) => (
                              <li key={i} className="flex gap-2 text-sm text-foreground/80">
                                <span className="shrink-0 text-orange-400 font-bold mt-0.5">›</span>
                                <span className="leading-snug">{a}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Para la familia — only if present for this franja */}
                      {familia && familia.length > 0 && (
                        <div className="px-4 py-3 border-t" style={{ borderColor: "#F3D9C0", background: "#FEF6EE" }}>
                          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#92400E" }}>
                            Para la familia
                          </p>
                          <ul className="space-y-1.5">
                            {familia.map((a, i) => (
                              <li key={i} className="flex gap-2 text-sm" style={{ color: "#7C3D12" }}>
                                <span className="shrink-0 font-bold mt-0.5" style={{ color: "#C4703A" }}>·</span>
                                <span className="leading-snug">{a}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Usar en sesión button */}
                      <div className="px-4 py-3 border-t border-border/50">
                        <button
                          onClick={() => {
                            setFocoTerapeutico(focoSugerido);
                            setSelectedBloque(null);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-[0.99]"
                          style={{ background: "#C4703A" }}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Usar en sesión
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Card: objetivos ───────────────────────────────────────────── */}
        {patient && (
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Trabajo en sesión
                {totalSelected > 0 && (
                  <span
                    className="ml-2 inline-flex items-center rounded-full text-xs px-2 py-0.5 font-medium"
                    style={{ background: `${BRAND_TEAL}20`, color: BRAND_TEAL }}
                  >
                    {totalSelected} {totalSelected === 1 ? "propuesta" : "propuestas"}
                  </span>
                )}
              </h2>
            </div>

            {loadingGoals ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground animate-pulse">
                Cargando objetivos…
              </div>
            ) : goals.length === 0 && adHocGoals.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                Este paciente no tiene objetivos activos.
                <br /><span className="text-muted-foreground/40 text-xs mt-1 block">Usa "+ Agregar objetivo" para añadir uno del banco.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {/* Suggested goals (first) */}
                {suggestedGoals.map((goal: any) => (
                  <GoalRow
                    key={goal.id}
                    goalId={goal.id}
                    title={goal.title}
                    subtitle={`${goal.areaClinica ?? goal.category}${goal.nivelDificultad ? ` · ${goal.nivelDificultad}` : ""}${goal.franjaEtaria ? ` · ${goal.franjaEtaria} años` : ""}`}
                    row={rows[goal.id] ?? defaultRow(goal.status)}
                    onToggle={() => toggleRow(goal.id)}
                    onSetRow={patch => setRow(goal.id, patch)}
                    isSuggested
                    goalIdForDetail={goal.id}
                    goalMeta={{ title: goal.title, area: goal.areaClinica ?? goal.category, franjaEtaria: goal.franjaEtaria, definicionOperativa: goal.description }}
                  />
                ))}

                {/* Ad-hoc goals from banco */}
                {adHocGoals.map((libGoal: any) => (
                  <GoalRow
                    key={`adhoc-${libGoal.id}`}
                    goalId={libGoal.id}
                    title={libGoal.nombreObjetivo}
                    subtitle={`${libGoal.areaClinica ?? libGoal.area ?? ""}${libGoal.nivelDificultad ? ` · ${libGoal.nivelDificultad}` : ""}${libGoal.franjaEtaria ? ` · ${libGoal.franjaEtaria} años` : ""}`}
                    row={adHocRows[libGoal.id] ?? { checked: true, intentos: "", correctas: "", estado: "en progreso" }}
                    onToggle={() => setAdHocRow(libGoal.id, { checked: !(adHocRows[libGoal.id]?.checked ?? true) })}
                    onSetRow={patch => setAdHocRow(libGoal.id, patch)}
                    isAdHoc
                    onRemove={() => removeAdHocGoal(libGoal.id)}
                    libraryData={libGoal}
                    goalMeta={{ title: libGoal.nombreObjetivo, area: libGoal.areaClinica ?? libGoal.area, subarea: libGoal.subarea, franjaEtaria: libGoal.franjaEtaria, definicionOperativa: libGoal.definicionOperativa }}
                  />
                ))}

                {/* Other (non-suggested) goals — collapsed by default */}
                {otherGoals.length > 0 && (
                  <>
                    <button
                      className="w-full flex items-center gap-2 px-5 py-3 text-xs font-medium text-muted-foreground hover:text-foreground/70 hover:bg-muted/50 transition-colors"
                      onClick={() => setShowAllGoals(v => !v)}
                    >
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAllGoals ? "rotate-180" : ""}`} />
                      {showAllGoals ? "Ocultar" : `${otherGoals.length} objetivo${otherGoals.length !== 1 ? "s" : ""} adicional${otherGoals.length !== 1 ? "es" : ""}`}
                    </button>
                    {showAllGoals && otherGoals.map((goal: any) => (
                      <GoalRow
                        key={goal.id}
                        goalId={goal.id}
                        title={goal.title}
                        subtitle={`${goal.areaClinica ?? goal.category}${goal.nivelDificultad ? ` · ${goal.nivelDificultad}` : ""}${goal.franjaEtaria ? ` · ${goal.franjaEtaria} años` : ""}`}
                        row={rows[goal.id] ?? defaultRow(goal.status)}
                        onToggle={() => toggleRow(goal.id)}
                        onSetRow={patch => setRow(goal.id, patch)}
                        goalIdForDetail={goal.id}
                        goalMeta={{ title: goal.title, area: goal.areaClinica ?? goal.category, franjaEtaria: goal.franjaEtaria, definicionOperativa: goal.description }}
                      />
                    ))}
                  </>
                )}
              </div>
            )}

            {/* ── Banco de objetivos ───────────────────────────────────── */}
            <div className="border-t border-border/50">
              {!showBanco ? (
                <button
                  className="w-full flex items-center gap-2 px-5 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors group"
                  onClick={() => setShowBanco(true)}
                >
                  <Plus className="h-4 w-4 text-muted-foreground group-hover:text-foreground/70 transition-colors" />
                  Agregar del banco
                  <BookOpen className="h-3.5 w-3.5 ml-auto text-muted-foreground/40 group-hover:text-muted-foreground" />
                </button>
              ) : (
                <div className="px-5 py-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" style={{ color: BRAND_TEAL }} />
                      Banco de objetivos
                    </p>
                    <button
                      onClick={() => { setShowBanco(false); setBancoArea(""); setBancoSubarea(""); setBancoSearch(""); setBancoSelected(new Set()); }}
                      className="text-muted-foreground hover:text-foreground/70 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Area + Subarea selectors */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Área clínica</label>
                      <Select
                        value={bancoArea}
                        onValueChange={(v) => { setBancoArea(v); setBancoSubarea(""); setBancoSelected(new Set()); }}
                      >
                        <SelectTrigger className="h-8 text-xs bg-muted/50">
                          <SelectValue placeholder="Seleccionar área" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(AREA_SUBAREAS).map(a => (
                            <SelectItem key={a} value={a} className="text-xs capitalize">{a.charAt(0).toUpperCase() + a.slice(1)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Subárea</label>
                      
                      <Select
                        value={bancoSubarea || "__all__"}
                        onValueChange={(v) => { setBancoSubarea(v === "__all__" ? "" : v); setBancoSelected(new Set()); }}
                        disabled={!bancoArea}
                      >
                        <SelectTrigger className="h-8 text-xs bg-muted/50">
                          <SelectValue placeholder={bancoArea ? "Todas" : "Primero elige área"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__" className="text-xs">Todas las subáreas</SelectItem>
                          {(AREA_SUBAREAS[bancoArea] ?? []).map((s: string) => (
                            <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1 mt-3">
                    <label className="block text-xs font-medium text-muted-foreground">
                      Foco terapéutico
                    </label>
                    <Textarea
                      placeholder="Ej: trabajar comprensión de consignas y conectores"
                      className="text-sm min-h-[80px]"
                    />
                  </div>
                  {/* Optional text search */}
                  {bancoArea && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                      <Input
                        placeholder="Filtrar por texto (opcional)…"
                        value={bancoSearch}
                        onChange={e => { setBancoSearch(e.target.value); setBancoSelected(new Set()); }}
                        className="pl-8 h-8 text-xs bg-muted/50"
                      />
                    </div>
                  )}

                  {/* Goal checklist */}
                  {!bancoArea ? (
                    <div className="rounded-xl border border-border/50 bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
                      Selecciona un área para ver los objetivos disponibles
                    </div>
                  ) : loadingBanco ? (
                    <div className="rounded-xl border border-border/50 bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
                      Cargando objetivos…
                    </div>
                  ) : bancoFiltered.length === 0 ? (
                    <div className="rounded-xl border border-border/50 bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
                      Sin objetivos disponibles para esta selección.
                    </div>
                  ) : (
                    <>
                      {/* Select-all row */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{bancoFiltered.length} objetivos disponibles</span>
                        <div className="flex gap-3">
                          {bancoSelected.size > 0 && (
                            <button onClick={clearBancoSelection} className="text-xs text-muted-foreground hover:text-foreground/70 underline underline-offset-2">
                              Limpiar
                            </button>
                          )}
                          <button
                            onClick={bancoSelected.size === bancoFiltered.length ? clearBancoSelection : selectAllBanco}
                            className="text-xs font-medium hover:underline underline-offset-2"
                            style={{ color: BRAND_TEAL }}
                          >
                            {bancoSelected.size === bancoFiltered.length ? "Deseleccionar todos" : "Seleccionar todos"}
                          </button>
                        </div>
                      </div>

                      {/* Scrollable checklist */}
                      <div className="max-h-64 overflow-y-auto rounded-xl border border-border divide-y divide-slate-100">
                        {bancoFiltered.map((g: any) => {
                          const alreadyAdded = adHocGoals.some((a: any) => a.id === g.id);
                          const isSelected = bancoSelected.has(g.id);
                          return (
                            <button
                              key={g.id}
                              className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                                alreadyAdded
                                  ? "bg-emerald-50 cursor-default"
                                  : isSelected
                                  ? "bg-teal-50 hover:bg-teal-50"
                                  : "hover:bg-muted/50"
                              }`}
                              onClick={() => { if (!alreadyAdded) toggleBancoGoal(g.id); }}
                            >
                              {/* Checkbox indicator */}
                              <div className={`mt-0.5 h-4 w-4 rounded shrink-0 flex items-center justify-center border transition-colors ${
                                alreadyAdded
                                  ? "bg-emerald-400 border-emerald-400"
                                  : isSelected
                                  ? "border-teal-500 bg-teal-500"
                                  : "border-border"
                              }`}>
                                {(alreadyAdded || isSelected) && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium leading-snug ${alreadyAdded ? "text-emerald-700" : "text-foreground"}`}>
                                  {g.nombreObjetivo}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {g.nivelDificultad ? `${g.nivelDificultad} · ` : ""}
                                  {g.franjaEtaria ? `${g.franjaEtaria} años · ` : ""}
                                  {alreadyAdded ? "ya agregado" : g.idObjetivo}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Add button */}
                      {bancoSelected.size > 0 && (
                        <button
                          onClick={addSelectedGoals}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                          style={{ background: BRAND_TEAL }}
                        >
                          <Plus className="h-4 w-4" />
                          Agregar {bancoSelected.size} objetivo{bancoSelected.size !== 1 ? "s" : ""} a la sesión
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Card: notas generales ─────────────────────────────────────── */}
        {patient && (
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Notas de sesión <span className="text-muted-foreground font-normal">(opcional)</span></h2>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Resumen</label>
              <Textarea
                placeholder="Describe lo trabajado en la sesión…"
                rows={2}
                value={resumen}
                onChange={e => setResumen(e.target.value)}
                className="bg-muted/50 resize-none text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Observaciones</label>
                {hasSpeechSupport && (
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg border transition-all ${
                      isRecording
                        ? "bg-red-50 border-red-200 text-red-600 animate-pulse"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground/80"
                    }`}
                  >
                    {isRecording
                      ? <><MicOff className="h-3.5 w-3.5" /> Detener</>
                      : <><Mic className="h-3.5 w-3.5" /> Grabar</>}
                  </button>
                )}
              </div>
              <Textarea
                placeholder={isRecording ? "Escuchando… habla ahora" : "Observaciones clínicas relevantes…"}
                rows={3}
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                className={`resize-none text-sm transition-colors ${isRecording ? "bg-red-50/40 border-red-200 focus-visible:ring-red-300" : "bg-muted/50"}`}
              />
              {isRecording && (
                <p className="text-xs text-red-500 flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-ping" />
                  Grabando… el texto se insertará automáticamente
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Save bar ──────────────────────────────────────────────────── */}
        {patient && (
          <div className="flex gap-3 pb-8">
            <Button variant="outline" className="w-28" onClick={() => window.history.length > 1 ? window.history.back() : navigate(preselectedId ? `/patients/${preselectedId}` : "/")}>
              Cancelar
            </Button>
            <Button
              className="flex-1 text-white font-semibold text-base h-12 rounded-xl shadow-md transition-all hover:opacity-90"
              style={{ background: canSave ? `linear-gradient(90deg, ${BRAND_TEAL} 0%, #0f4e4c 100%)` : undefined }}
              disabled={!canSave || isSaving}
              onClick={handleSave}
            >
              {isSaving
                ? "Guardando…"
                : totalSelected > 0
                  ? `Guardar sesión · ${totalSelected} objetivo${totalSelected !== 1 ? "s" : ""}`
                  : "Guardar sesión"}
            </Button>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
