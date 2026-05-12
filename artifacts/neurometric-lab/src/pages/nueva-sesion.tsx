import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ClipboardList, Search, ChevronDown, CheckSquare, Square, User,
  Plus, X, BookOpen, Sparkles, Brain, Home, TrendingUp, Info, ChevronRight,
  Mic, MicOff, Check, BookmarkPlus, Stethoscope, ChevronUp, Volume2, Lightbulb,
  RefreshCw, CheckCircle2,
} from "lucide-react";
import { getProfesion, getDiagnosesByProfesion, getBancoAreas } from "@/utils/profession-map";
import { useAuth } from "@/contexts/auth-context";
import { EvalSugerida } from "@/components/eval-sugerida";
import { useListPatients, getListGoalsQueryKey, getListRegistrosClinicosQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { CustomGoalDialog } from "@/components/custom-goal-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import { getClinicalContent } from "@/config/goal-clinical-content";
import { AREA_SUBAREAS } from "@/utils/goal-code-generator";
import { API_BASE } from "@/lib/api";

const BRAND_BLUE = "#E07A5F";
const BRAND_TEAL = "#81B29A";

// Phoneme acquisition order — TSH clinical reference
const PHONEME_GROUPS: { phonemes: string[] }[] = [
  { phonemes: ["/m/", "/p/", "/b/"] },
  { phonemes: ["/t/", "/d/", "/n/"] },
  { phonemes: ["/k/", "/g/"] },
  { phonemes: ["/f/"] },
  { phonemes: ["/s/"] },
  { phonemes: ["/ch/"] },
  { phonemes: ["/l/"] },
  { phonemes: ["/r/"] },
  { phonemes: ["/rr/"] },
];

// Phoneme → clinical goal suggestions (static templates)
const PHONEME_GOAL_TEMPLATES: Record<string, string[]> = {
  "/m/": [
    "Producir fonemas bilabiales en sílabas directas (/m/, /p/, /b/)",
    "Discriminar /p/ vs /b/ en pares mínimos",
    "Usar bilabiales en palabras simples de forma espontánea",
  ],
  "/p/": [
    "Producir fonemas bilabiales en sílabas directas (/m/, /p/, /b/)",
    "Discriminar /p/ vs /b/ en pares mínimos",
    "Usar bilabiales en palabras simples de forma espontánea",
  ],
  "/b/": [
    "Producir fonemas bilabiales en sílabas directas (/m/, /p/, /b/)",
    "Discriminar /p/ vs /b/ en pares mínimos",
    "Usar bilabiales en palabras simples de forma espontánea",
  ],
  "/t/": [
    "Producir fonemas alveolares en sílabas directas (/t/, /d/, /n/)",
    "Generalizar alveolares a palabras bisílabas",
    "Discriminación auditiva de alveolares en contexto",
  ],
  "/d/": [
    "Producir fonemas alveolares en sílabas directas (/t/, /d/, /n/)",
    "Generalizar alveolares a palabras bisílabas",
    "Discriminación auditiva de alveolares en contexto",
  ],
  "/n/": [
    "Producir fonemas alveolares en sílabas directas (/t/, /d/, /n/)",
    "Generalizar alveolares a palabras bisílabas",
    "Discriminación auditiva de alveolares en contexto",
  ],
  "/k/": [
    "Producir velares en sílabas directas (/k/, /g/)",
    "Evitar fronting de velares (sustitución por alveolares)",
    "Usar velares en palabras en posición inicial y final",
  ],
  "/g/": [
    "Producir velares en sílabas directas (/k/, /g/)",
    "Evitar fronting de velares (sustitución por alveolares)",
    "Usar velares en palabras en posición inicial y final",
  ],
  "/f/": [
    "Producir /f/ en posición inicial de sílaba",
    "Generalizar /f/ a frases simples",
    "Discriminación auditiva /f/ vs /p/",
  ],
  "/s/": [
    "Producir /s/ sin interdentalización en sílabas directas",
    "Generalizar /s/ correcta a palabras",
    "Usar /s/ en frases de 3 o más palabras",
  ],
  "/ch/": [
    "Producir la africada /ch/ en sílabas directas",
    "Generalizar /ch/ en palabras de uso frecuente",
  ],
  "/l/": [
    "Producción correcta de /l/ en sílabas directas",
    "Generalizar /l/ a palabras y frases",
  ],
  "/r/": [
    "Producir vibrante simple /r/ en sílabas directas",
    "Usar /r/ simple en palabras en posición intervocálica",
  ],
  "/rr/": [
    "Producir vibrante múltiple /rr/ de forma aislada",
    "Producir /rr/ en sílabas directas",
    "Generalizar /rr/ a palabras en posición inicial",
  ],
};

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
  { value: "nuevo",         label: "Nuevo"         },
  { value: "en proceso",    label: "En proceso"    },
  { value: "consolidando",  label: "Consolidando"  },
  { value: "generalizando", label: "Generalizando" },
];

const ESTADO_STYLE: Record<string, string> = {
  "nuevo":         "bg-stone-50 border-stone-300 text-stone-600",
  "en proceso":    "bg-amber-50 border-amber-300 text-amber-800",
  "consolidando":  "bg-green-50 border-green-300 text-green-800",
  "generalizando": "bg-emerald-50 border-emerald-300 text-emerald-800",
};

const BLOQUES_PSICOPED: BloqueSesion[] = [
  {
    area: "lectura",
    label: "Lectura",
    bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700",
    habilidadesPorFranja: {
      "0-2":   ["Interés por libros y cuentos con imágenes", "Distingue imágenes de texto", "Escucha cuentos por 2-3 minutos", "Señala objetos en ilustraciones"],
      "3-5":   ["Reconoce su nombre escrito", "Identifica letras del abecedario", "Conciencia silábica: divide palabras en sílabas", "Asocia letra-sonido de vocales"],
      "6-8":   ["Decodifica palabras simples (CVCV)", "Lee oraciones cortas con comprensión", "Lectura en voz alta con ritmo y pausa", "Diferencia texto narrativo de imagen"],
      "9-12":  ["Lectura fluida de textos de nivel escolar", "Comprende texto narrativo con personajes y trama", "Realiza inferencias básicas", "Lectura silenciosa para estudio"],
      "13-16": ["Comprensión crítica de textos argumentativos", "Detecta idea principal y detalles de apoyo", "Lectura en contexto académico multi-asignatura", "Integra información de dos fuentes escritas"],
      "17-20": ["Lectura académica y técnica autónoma", "Síntesis y análisis crítico de textos", "Detección de sesgos y argumentos implícitos", "Metacognición lectora avanzada"],
    },
    actividadesClinicasPorFranja: {
      "0-2":   ["Lectura compartida de cuentos con imágenes grandes: nombrar y señalar juntos", "Juego de 'señala la letra': terapeuta muestra tarjetas con letras y el niño señala las que conoce", "Canciones con rimas sencillas para estimular la conciencia del sonido del lenguaje"],
      "3-5":   ["Juego de sílabas con palmadas: dividir palabras familiares golpeando la mesa", "Asociación letra-sonido con tarjetas de vocales y dibujos con imagen inicial", "Construcción del nombre propio con letras móviles o tarjetas recortadas"],
      "6-8":   ["Lectura en pareja: terapeuta lee una oración, paciente lee la siguiente en voz alta", "Fichas de palabras CVCV con imagen: el paciente lee y asocia al dibujo correspondiente", "Preguntas de comprensión literal sobre texto corto leído en sesión (¿quién?, ¿qué pasó?)"],
      "9-12":  ["Lectura silenciosa de texto breve seguida de resumen oral con apoyo del terapeuta", "Fichas de inferencia: el terapeuta lee una situación y el paciente completa lo implícito", "Identificación de idea principal en párrafos usando subrayado y círculo en palabras clave"],
      "13-16": ["Lectura de texto argumentativo con guía de preguntas: ¿cuál es la tesis?, ¿qué argumentos usa?", "Comparación de dos textos breves sobre el mismo tema: diferencias y puntos en común", "Práctica de velocidad lectora con cronómetro y verificación de comprensión posterior"],
      "17-20": ["Análisis de texto académico con identificación de estructura: introducción, desarrollo, conclusión", "Síntesis escrita de un texto leído en sesión: párrafo de tres oraciones con idea principal", "Ejercicio metacognitivo: el paciente evalúa su propia comprensión antes y después de releer"],
    },
    paraLaFamiliaPorFranja: {
      "0-2":   ["Leer en voz alta libros de imágenes cada noche antes de dormir, señalando los dibujos", "No forzar al niño a seguir la lectura: dejar que explore el libro con libertad"],
      "3-5":   ["Jugar a buscar letras del nombre del niño en carteles, envases y libros del hogar", "Contar sílabas de palabras cotidianas mientras caminan o comen (ma-no, za-pa-to)"],
      "6-8":   ["Leer juntos 10 minutos al día: el niño lee en voz alta y el adulto escucha sin corregir abruptamente", "Preguntar después de leer: '¿de qué trataba?' y escuchar sin completar la respuesta"],
      "9-12":  ["Apoyar la lectura de tareas escolares: leer junto una vez y luego dejar que lo haga solo", "Visitar la biblioteca o descargar libros de interés del niño para motivar la lectura voluntaria"],
      "13-16": ["Conversar sobre noticias o artículos que haya leído el adolescente, sin evaluar su opinión", "No interrumpir ni leer por ellos: respetar su ritmo y dejar que consulte el diccionario solo"],
      "17-20": ["Apoyar la búsqueda de materiales de lectura académica (libros, artículos) según sus intereses", "Mostrar interés genuino en lo que está leyendo: preguntar de qué trata, sin evaluar"],
    },
    focoSugeridoPorFranja: {
      "0-2":   "Estimular amor por la lectura y conciencia de texto impreso",
      "3-5":   "Trabajar conciencia fonológica y reconocimiento de letras",
      "6-8":   "Desarrollar decodificación y fluidez lectora básica",
      "9-12":  "Trabajar comprensión lectora y estrategias de lectura",
      "13-16": "Fortalecer comprensión crítica y lectura académica",
      "17-20": "Desarrollar lectura académica autónoma y metacognición",
    },
  },
  {
    area: "escritura",
    label: "Escritura",
    bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700",
    habilidadesPorFranja: {
      "0-2":   ["Garabateo intencional con lápiz o crayón", "Sostiene el lápiz con ayuda", "Imita trazos circulares y rectos", "Disfruta de actividades de dibujo libre"],
      "3-5":   ["Copia su nombre con modelo", "Traza líneas, curvas y círculos", "Diferencia entre dibujo y escritura", "Escribe algunas letras del propio nombre sin modelo"],
      "6-8":   ["Escribe palabras simples al dictado", "Usa mayúsculas al inicio de oración y nombres propios", "Ortografía natural: m antes de b/p", "Escribe frases de 3 a 5 palabras con sentido"],
      "9-12":  ["Redacta párrafos con idea principal y detalles", "Aplica tildes en palabras agudas y graves frecuentes", "Planifica texto con borrador y revisión", "Usa conectores para organizar ideas"],
      "13-16": ["Redacta textos argumentativos de 3+ párrafos", "Aplica ortografía acentual y puntual", "Adapta registro al destinatario del texto", "Revisa y reescribe con criterio propio"],
      "17-20": ["Escritura académica formal con citas y bibliografía", "Planifica y estructura textos extensos", "Revisión avanzada de coherencia y cohesión", "Producción autónoma de distintos géneros textuales"],
    },
    actividadesClinicasPorFranja: {
      "0-2":   ["Trazado libre con pintura de dedos o crayones gruesos sobre papel grande", "Imitación de trazos simples: el terapeuta dibuja una línea recta, el niño la reproduce", "Actividades de grafomotricidad: laberintos muy simples, rellenar formas grandes con color"],
      "3-5":   ["Copia del nombre propio con modelo a la vista: letra por letra con celebración", "Trazado de letras del nombre en arena, harina o pizarra borrosa para refuerzo táctil", "Diferenciación dibujo/escritura: el terapeuta escribe una palabra y dibuja el objeto, el niño identifica cuál es cuál"],
      "6-8":   ["Dictado de palabras simples con análisis posterior: ¿qué parte fue difícil?, ¿por qué?", "Escritura de frases cortas a partir de imágenes: el paciente elige la imagen y dicta su frase", "Lista de cotejo ortográfico: el paciente revisa su propio texto con una guía de reglas básicas"],
      "9-12":  ["Planificación de párrafo con organizador gráfico: lluvia de ideas → idea principal → detalles", "Revisión por pares simulada: el terapeuta hace de 'lector' y da retroalimentación sobre coherencia", "Dictado de oraciones con aplicación de reglas ortográficas trabajadas en sesión"],
      "13-16": ["Producción de texto argumentativo corto con estructura guiada: tesis → argumentos → conclusión", "Revisión propia con rúbrica simple: el paciente evalúa su texto en coherencia, ortografía y registro", "Reescritura: tomar un texto con errores intencionados y corregirlo con explicación de cada cambio"],
      "17-20": ["Escritura académica guiada: introducción de un trabajo con tesis y cita bibliográfica", "Revisión de coherencia y cohesión en texto propio usando lista de conectores y marcadores textuales", "Autoevaluación escrita: el paciente redacta un párrafo y luego anota qué cambiaría y por qué"],
    },
    paraLaFamiliaPorFranja: {
      "0-2":   ["Ofrecer crayones, pinturas y papel con regularidad sin exigir un resultado concreto", "Celebrar cualquier trazo intencional: 'mira lo que hiciste' sin decir 'qué es esto'"],
      "3-5":   ["Escribir juntos listas simples en casa: la lista del supermercado, los nombres de la familia", "No corregir la escritura del nombre delante de otras personas; hacerlo en privado y con amabilidad"],
      "6-8":   ["Dictar 3-5 palabras al niño en casa como práctica breve (5 min), sin hacerlo estresante", "Animar a escribir tarjetas o mensajes a familiares: refuerza el propósito real de la escritura"],
      "9-12":  ["Apoyar la planificación del texto escolar pero no escribirlo: hacer preguntas ('¿de qué va el párrafo?')", "Evitar corregir la ortografía del hijo en el borrador: esperar a que él revise primero"],
      "13-16": ["Mostrar interés en sus textos escolares: pedir que cuente de qué escribió, no leer el borrador sin permiso", "No reescribir sus textos: sugerir una idea y dejar que él la desarrolle con sus propias palabras"],
      "17-20": ["Apoyar el acceso a diccionarios, correctores y manuales de estilo según el nivel académico", "Respetar su voz escrita: no imponer el estilo propio al revisar un texto que el joven pidió compartir"],
    },
    focoSugeridoPorFranja: {
      "0-2":   "Estimular grafomotricidad y trazos básicos",
      "3-5":   "Trabajar trazos, copia y reconocimiento de letras del nombre",
      "6-8":   "Desarrollar escritura de palabras y frases simples",
      "9-12":  "Trabajar redacción, ortografía y organización de textos",
      "13-16": "Fortalecer escritura argumentativa y ortografía compleja",
      "17-20": "Desarrollar escritura académica y producción autónoma",
    },
  },
  {
    area: "cálculo",
    label: "Cálculo",
    bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700",
    habilidadesPorFranja: {
      "0-2":   ["Señala 'uno' y 'muchos'", "Compara objetos: más/menos", "Apila y ordena por tamaño", "Cuenta objetos hasta 3 con apoyo del adulto"],
      "3-5":   ["Cuenta hasta 10 con correspondencia uno a uno", "Compara cantidades sin contar (subitización)", "Reconoce dígitos del 1 al 5", "Ordena objetos por tamaño, peso o color"],
      "6-8":   ["Suma y resta hasta 20 con comprensión", "Comprende valor posicional unidades/decenas", "Resuelve problemas simples de una operación con enunciado", "Reconoce y nombra figuras geométricas básicas"],
      "9-12":  ["Multiplica y divide con dominio de tablas", "Opera con fracciones simples (½, ¼)", "Resuelve problemas matemáticos de dos pasos", "Comprende y calcula porcentajes básicos"],
      "13-16": ["Opera con números negativos y fracciones complejas", "Álgebra básica: ecuaciones de primer grado", "Geometría: área y perímetro de figuras planas", "Interpreta gráficas y datos estadísticos simples"],
      "17-20": ["Razonamiento matemático abstracto y algebraico", "Estadística descriptiva e inferencial básica", "Funciones lineales y representación gráfica", "Matemática aplicada a contextos reales y cotidianos"],
    },
    actividadesClinicasPorFranja: {
      "0-2":   ["Conteo de objetos concretos (bloques, botones): el terapeuta cuenta junto al niño tocando cada objeto", "Juego de 'más o menos': el terapeuta pone 2 y 4 objetos, el niño señala el grupo con más", "Ordenamiento de 3 objetos por tamaño con apoyo verbal: 'este es grande, este chico, ¿cuál es el del medio?'"],
      "3-5":   ["Conteo con correspondencia uno a uno usando fichas: el niño toca y cuenta hasta 10", "Juego de dados: tirar un dado y poner el mismo número de fichas en el tablero", "Reconocimiento de dígitos con tarjetas: el terapeuta muestra el número y el niño pone esa cantidad de objetos"],
      "6-8":   ["Resolución de problemas con enunciado oral simple: el terapeuta narra la situación, el paciente resuelve con material concreto", "Escalera numérica con suma y resta: el paciente avanza o retrocede fichas según las operaciones", "Valor posicional con cubos de decenas y unidades: armar un número dado con material concreto"],
      "9-12":  ["Resolución de problemas de dos pasos escritos: identificar los datos, la pregunta y el procedimiento", "Práctica de tablas de multiplicar con tarjetas de asociación veloz (tiempo por respuesta)", "Fracciones con material concreto: dividir figuras en partes iguales y nombrar la fracción correspondiente"],
      "13-16": ["Ecuaciones de primer grado con procedimiento guiado paso a paso y explicación en voz alta", "Análisis de gráficas estadísticas: el paciente describe lo que ve, extrae conclusiones y formula preguntas", "Resolución de problemas contextualizados (descuentos, porcentajes, escalas) con apoyo de calculadora cuando corresponde"],
      "17-20": ["Modelado matemático de situaciones reales: el paciente elige una situación y la representa con ecuaciones", "Trabajo en estadística descriptiva: calcular media, moda y rango de un conjunto de datos del interés del paciente", "Revisión de errores en ejercicios propios: identificar en qué paso falló y por qué, con autocorrección guiada"],
    },
    paraLaFamiliaPorFranja: {
      "0-2":   ["Contar objetos cotidianos en voz alta: escalones, manzanas, zapatos al ordenarlos", "Juego del 'cuántos hay': señalar objetos del entorno y contar juntos sin presión por la respuesta"],
      "3-5":   ["Jugar a la tiendita con monedas de juguete o billetes impresos para contar y dar vuelto", "Usar juegos de mesa con dados (Ludo, escalera) como práctica natural del conteo y los números"],
      "6-8":   ["Proponer cálculo mental cotidiano: '¿si compro 3 y me dan 1 de regalo, cuántos tengo?'", "No hacer las tareas matemáticas por el niño: leer el problema junto y dejar que él resuelva"],
      "9-12":  ["Apoyar el estudio de tablas con canciones o tarjetas flash, en sesiones de 5 minutos diarios", "Invitar al niño a calcular vueltos, propinas o descuentos en situaciones reales de compra"],
      "13-16": ["No desestimar las dificultades con el álgebra: 'te entiendo, es difícil' antes de buscar ayuda", "Apoyar el acceso a recursos visuales (tutoriales, calculadoras graficadoras) como herramientas válidas de aprendizaje"],
      "17-20": ["Mostrar la matemática en contextos reales: presupuestos, intereses bancarios, estadísticas de noticias", "Respetar el estilo de resolución del joven aunque sea diferente al propio: el resultado correcto puede lograrse por distintos caminos"],
    },
    focoSugeridoPorFranja: {
      "0-2":   "Estimular concepto de cantidad y pensamiento lógico básico",
      "3-5":   "Trabajar conteo, correspondencia y comparación de cantidades",
      "6-8":   "Desarrollar operaciones básicas y resolución de problemas simples",
      "9-12":  "Trabajar multiplicación, fracciones y problemas de múltiples pasos",
      "13-16": "Fortalecer álgebra básica, geometría y pensamiento proporcional",
      "17-20": "Desarrollar razonamiento matemático abstracto y estadístico",
    },
  },
  {
    area: "funciones-ejecutivas",
    label: "Funciones ejecutivas",
    bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700",
    habilidadesPorFranja: {
      "0-2":   ["Detiene acción ante señal del adulto", "Cambia de actividad con apoyo", "Espera turno en juego de roles simple", "Imita acciones del adulto en secuencia de 2 pasos"],
      "3-5":   ["Sigue reglas simples de juego de mesa", "Inhibe respuesta impulsiva con apoyo verbal", "Planifica 2 pasos para lograr una meta concreta", "Recuerda 2 instrucciones simples en secuencia"],
      "6-8":   ["Planifica una tarea de 3-4 pasos sin guía", "Recuerda instrucciones de 3 pasos sin apoyo visual", "Controla la impulsividad en tareas estructuradas", "Monitorea si completó cada paso de la tarea"],
      "9-12":  ["Organiza materiales y tiempo de estudio básico", "Monitorea y corrige la propia conducta", "Cambia de estrategia cuando la actual no funciona", "Planifica una tarea escolar con anticipación"],
      "13-16": ["Planifica proyectos de largo plazo con etapas", "Toma decisiones evaluando consecuencias posibles", "Flexibilidad cognitiva ante cambios de regla o contexto", "Autorregula emociones en contexto de exigencia académica"],
      "17-20": ["Gestión autónoma del tiempo y el estudio", "Estrategias metacognitivas para el aprendizaje", "Planificación y priorización de tareas complejas", "Autorregulación emocional y conductual en contextos exigentes"],
    },
    actividadesClinicasPorFranja: {
      "0-2":   ["Juego de stop y go con señal visual: el terapeuta levanta la mano y el niño detiene su acción", "Secuencia de 2 pasos con objetos: 'primero ponemos el bloque aquí, después el cubo allá'", "Espera de turno simple: juego de tirar la pelota alternando sin saltarse"],
      "3-5":   ["Juego de Simón dice con reglas de inhibición: obedecer solo si dice 'Simón dice'", "Planificación de una actividad de 2 pasos con tablero visual: el niño pega imágenes en el orden correcto", "Juego de memoria (parejas de cartas): trabaja memoria de trabajo e inhibición de respuesta impulsiva"],
      "6-8":   ["Planificación de tarea escolar en tarjetas: el paciente escribe cada paso en orden y los ejecuta", "Juego de categorización flexible: ordenar objetos primero por color, luego por forma (flexibilidad)", "Checklist de tareas de la sesión: el paciente marca cada paso completado y monitorea su progreso"],
      "9-12":  ["Diseño de horario semanal de estudio con el terapeuta: asignación de tiempos por materia y descansos", "Role-play de situación escolar inesperada: el terapeuta cambia las reglas de una tarea a mitad y el paciente se adapta", "Automonitoreo de conducta: el paciente evalúa en una escala 1-5 su nivel de impulsividad durante la sesión"],
      "13-16": ["Planificación de proyecto de mediano plazo en diagrama de Gantt simplificado (etapas y fechas)", "Análisis de decisiones: el paciente presenta una decisión real y el terapeuta guía el análisis de consecuencias", "Práctica de flexibilidad cognitiva: el terapeuta cambia reglas de un juego y el paciente reajusta su estrategia"],
      "17-20": ["Construcción de sistema personal de organización: agenda, app o tablero que el paciente diseña", "Ejercicio de priorización: lista de 10 tareas que el paciente ordena por urgencia e importancia con justificación", "Autoevaluación de gestión del tiempo de la semana anterior: qué funcionó, qué cambiaría y por qué"],
    },
    paraLaFamiliaPorFranja: {
      "0-2":   ["Anticipar los cambios de actividad con voz tranquila: 'en 2 minutos guardamos los juguetes'", "Establecer una rutina diaria predecible: el orden de las actividades ayuda a desarrollar la organización"],
      "3-5":   ["Usar un tablero de rutina visual en casa con imágenes de las actividades del día en orden", "Valorar el esfuerzo de esperar el turno o seguir una regla, aunque no lo logre perfectamente siempre"],
      "6-8":   ["Apoyar la elaboración de una lista de tareas escolares en papel o pizarrón visible", "Evitar hacer las cosas por el niño cuando se traba: acompañar con preguntas ('¿cuál sería el primer paso?')"],
      "9-12":  ["Instalar con el adolescente un sistema de horarios y recordatorios que él mismo elija (app, cuaderno, pizarrón)", "Dar retroalimentación sobre la organización sin juzgar: '¿cómo te fue con el plan de estudio esta semana?'"],
      "13-16": ["Respetar el sistema de organización del adolescente aunque sea diferente al propio: intervenir solo si hay consecuencias académicas reales", "Conversar sobre decisiones importantes sin tomar la decisión por ellos: '¿qué crees que pasaría si...?'"],
      "17-20": ["Confiar en la capacidad del joven para gestionar su tiempo: observar sin microgestionar", "Estar disponible para conversar sobre planificación de proyectos cuando el joven lo solicite"],
    },
    focoSugeridoPorFranja: {
      "0-2":   "Estimular inhibición básica y seguimiento de instrucciones simples",
      "3-5":   "Trabajar control del impulso, turnos y planificación de 2 pasos",
      "6-8":   "Desarrollar planificación, seguimiento de instrucciones y monitoreo",
      "9-12":  "Trabajar organización, autorregulación y flexibilidad cognitiva",
      "13-16": "Fortalecer planificación, toma de decisiones y metacognición",
      "17-20": "Desarrollar gestión autónoma del aprendizaje y la conducta",
    },
  },
  {
    area: "atención-psicoped",
    label: "Atención",
    bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700",
    habilidadesPorFranja: {
      "0-2":   ["Mantiene contacto visual breve con el adulto", "Sigue un objeto con la mirada", "Explora un objeto durante 1–2 minutos", "Responde al nombre de forma consistente"],
      "3-5":   ["Mantiene atención en tarea de interés por 5 min", "Vuelve a la tarea tras distracción breve", "Sigue una secuencia de 2 pasos", "Reduce distracciones con apoyo ambiental"],
      "6-8":   ["Mantiene atención en tarea escolar por 10-15 min", "Selecciona información relevante en texto corto", "Ignora distractores comunes con apoyo de rutinas", "Completa una tarea sencilla de inicio a fin"],
      "9-12":  ["Atención sostenida en tarea académica por 20-25 min", "Alterna entre dos tareas con transición fluida", "Detecta errores propios al revisar el trabajo", "Gestiona distractores con estrategias propias sencillas"],
      "13-16": ["Mantiene atención en clases largas (40-45 min)", "Filtra información irrelevante en entornos complejos", "Monitorea activamente la comprensión en tiempo real", "Distribuye la atención entre múltiples demandas académicas"],
      "17-20": ["Atención sostenida en estudio autónomo prolongado", "Gestión avanzada de distractores internos y externos", "Metacognición atencional: reconoce cuándo pierde el hilo", "Adapta el entorno de estudio para optimizar el foco"],
    },
    actividadesClinicasPorFranja: {
      "0-2":   ["Juego de seguimiento visual con objeto llamativo: mover un juguete lentamente y esperar que el niño lo siga con la mirada", "Llamada por nombre con contacto visual: el terapeuta llama al niño y espera que gire y mire antes de continuar", "Exploración dirigida: darle un objeto nuevo y observar cuánto tiempo lo manipula con interés"],
      "3-5":   ["Actividad de concentración con cronómetro visible: el niño realiza una tarea sencilla y ve el tiempo avanzar", "Juego de búsqueda visual: encontrar un objeto específico en una lámina con varios estímulos", "Retorno a la tarea: el terapeuta introduce una distracción suave y luego da la señal de volver ('¡a trabajar!')"],
      "6-8":   ["Tarea con cronómetro graduado: completar una actividad académica breve en un tiempo acordado, registrar avance", "Búsqueda de diferencias entre dos imágenes: atención selectiva con foco sostenido", "Entrenamiento de retorno a la tarea: el terapeuta distrae levemente y el paciente practica ignorar y seguir"],
      "9-12":  ["Tarea de atención alternada: el paciente cambia entre dos actividades distintas con señal del terapeuta", "Revisión de su propio trabajo con lista de errores a buscar: el paciente detecta y marca sin ayuda", "Técnica de Pomodoro adaptada: bloques de trabajo de 15 min con descanso de 3 min, registro de productividad"],
      "13-16": ["Lectura de texto complejo con pausas programadas y preguntas de comprensión intercaladas", "Práctica de toma de apuntes mientras el terapeuta habla: ejercita la atención dividida", "Registro de autoevaluación atencional: el paciente puntúa su nivel de foco durante la sesión cada 10 minutos"],
      "17-20": ["Trabajo en bloque de 25 min sobre tarea académica real con evaluación posterior de foco y productividad", "Diseño de entorno de estudio óptimo: el paciente identifica y elimina sus distractores personales", "Práctica de mindfulness atencional breve (5 min): respiración guiada con foco en el presente antes de la tarea"],
    },
    paraLaFamiliaPorFranja: {
      "0-2":   ["Minimizar estímulos visuales y sonoros durante momentos de juego para favorecer la exploración sostenida", "Celebrar cuando el niño mantiene el contacto visual o juega con algo por más tiempo que antes"],
      "3-5":   ["Preparar el espacio de trabajo del niño antes de pedir que haga una tarea: sin TV ni distractores", "Valorar el esfuerzo de volver a la tarea sin que lo hayan pedido: '¡volviste tú solo, muy bien!'"],
      "6-8":   ["Usar un temporizador visible (reloj de arena o cronómetro) para delimitar el tiempo de tarea", "Evitar interrumpir al niño mientras trabaja concentrado, aunque sea para ofrecerle algo positivo"],
      "9-12":  ["Acordar con el adolescente tiempos de trabajo y descanso: no imponer, negociar juntos", "No quitarle el celular de forma abrupta: acordar zonas o momentos sin pantallas con anticipación"],
      "13-16": ["Apoyar la creación de un espacio de estudio sin distractores que el adolescente diseñe y controle", "Evitar hablarle mientras estudia: respetar los bloqueos de tiempo que él mismo establezca"],
      "17-20": ["Confiar en que el joven conoce sus propios distractores y puede gestionarlos con apoyo", "Mostrar interés en sus estrategias de foco ('¿qué te funciona para concentrarte?') sin imponer las propias"],
    },
    focoSugeridoPorFranja: {
      "0-2":   "Estimular exploración sostenida y respuesta al nombre",
      "3-5":   "Trabajar atención sostenida y retorno a la tarea",
      "6-8":   "Desarrollar atención en tareas escolares y gestión de distractores",
      "9-12":  "Trabajar atención sostenida, alternada y monitoreo propio",
      "13-16": "Fortalecer atención focalizada y distribución de recursos atencionales",
      "17-20": "Desarrollar autogestión atencional y metacognición",
    },
  },
  {
    area: "memoria",
    label: "Memoria",
    bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700",
    habilidadesPorFranja: {
      "0-2":   ["Reconoce rostros y voces familiares", "Recuerda rutinas predecibles del día", "Imita gestos tras intervalo breve", "Responde a su nombre con consistencia"],
      "3-5":   ["Recuerda 2 elementos de una secuencia", "Evoca contenido de cuentos escuchados antes", "Empareja imagen con objeto recordado", "Retiene instrucciones de 2 pasos"],
      "6-8":   ["Recuerda instrucciones de 3 pasos sin apoyo visual", "Retiene vocabulario nuevo tras 2–3 exposiciones", "Asocia imágenes y palabras con apoyo gráfico", "Recuerda secuencias de 3–4 elementos"],
      "9-12":  ["Memoriza contenido escolar con estrategias básicas", "Usa repetición y asociación para retener información", "Recuerda pasos de procedimientos aprendidos", "Recupera información trabajada en sesiones previas"],
      "13-16": ["Aplica estrategias mnemónicas para contenido académico", "Relaciona nueva información con conocimiento previo", "Retiene vocabulario técnico con apoyo de mapas conceptuales", "Memoriza secuencias complejas con autorregulación"],
      "17-20": ["Gestiona autónomamente la retención de contenido extenso", "Usa organización, elaboración y visualización como estrategias", "Evalúa eficacia de sus estrategias de memoria", "Consolida aprendizajes a largo plazo con revisión espaciada"],
    },
    actividadesClinicasPorFranja: {
      "0-2":   ["Juego de 'dónde está': esconder un objeto bajo un paño y esperar que el niño lo busque (permanencia del objeto)", "Secuencia de 2 gestos: el terapeuta hace dos acciones y el niño las imita en orden", "Canciones con acciones repetidas: el terapeuta canta, el niño anticipa el gesto que viene"],
      "3-5":   ["Memoria de objetos: mostrar 3 objetos, cubrirlos, y pedir al niño que los nombre de memoria", "Cuento secuencial: narrar un cuento corto y preguntar '¿qué pasó primero?, ¿y después?'", "Instrucciones en cadena: dar 2 instrucciones seguidas y pedir que las ejecute en orden"],
      "6-8":   ["Instrucciones de 3 pasos sin apoyo visual: el paciente escucha, espera 10 segundos y las ejecuta", "Asociación imagen-palabra: tarjetas con imagen y palabra nueva; repaso diferido al final de la sesión", "Juego de memoria (parejas) con vocabulario temático: animales, comidas, objetos escolares"],
      "9-12":  ["Técnica de repetición espaciada: repasar un conjunto de datos a los 5, 15 y 30 minutos de la sesión", "Construcción de mnemónica: el paciente inventa una frase o acrónimo para recordar una lista de contenido escolar", "Recuperación activa: el terapeuta pide al paciente que recuerde lo trabajado en la sesión anterior sin claves"],
      "13-16": ["Mapa conceptual de memoria: el paciente organiza un tema académico en un esquema que construye de memoria", "Estrategia de elaboración: el paciente conecta contenido nuevo con algo que ya sabe y explica el vínculo", "Revisión espaciada de vocabulario técnico con tarjetas: el paciente evalúa cuántas puede recordar sin mirar"],
      "17-20": ["Diseño personal de sistema de revisión espaciada: el paciente crea su propio calendario de repasos", "Práctica de recuperación sin clave: el paciente cierra el libro y escribe todo lo que recuerda del tema", "Evaluación de eficacia: el paciente compara dos estrategias de memoria que usó en distintas semanas y analiza cuál funcionó mejor"],
    },
    paraLaFamiliaPorFranja: {
      "0-2":   ["Mantener rutinas predecibles: el orden conocido ayuda al niño a anticipar y recordar lo que viene", "Jugar a '¿dónde está el juguete?' escondiendo objetos bajo cojines y pañuelos"],
      "3-5":   ["Pedir al niño que recuerde 2 cosas que hizo hoy antes de dormir: práctica de memoria episódica", "Repasar juntos el cuento del día anterior antes de leer uno nuevo: '¿te acuerdas de qué pasó ayer?'"],
      "6-8":   ["Repasar brevemente con el niño lo que trabajó en sesión: '¿qué hiciste hoy con la psicopedagoga?'", "Ayudar con el repaso de materias, pero en forma de preguntas, no de respuestas: '¿y cuánto es 6 por 7?'"],
      "9-12":  ["Apoyar la implementación de tarjetas de estudio o flashcards en casa como herramienta de repaso", "Evitar dar la respuesta de inmediato cuando el adolescente no recuerda algo: esperar 10 segundos para que recupere"],
      "13-16": ["Mostrar interés en las estrategias de memoria que el adolescente está aprendiendo: '¿qué te está funcionando?'", "No resolver por él lo que no recuerda: una pausa y un 'piensa en voz alta' puede ser suficiente apoyo"],
      "17-20": ["Apoyar el acceso a herramientas digitales de repetición espaciada (Anki, Quizlet) si el joven las usa", "Respetar el sistema de repasos que el joven diseñó, aunque sea diferente al propio"],
    },
    focoSugeridoPorFranja: {
      "0-2":   "Estimular reconocimiento, imitación y memoria de corto plazo",
      "3-5":   "Trabajar retención de secuencias simples y evocación de contenido",
      "6-8":   "Desarrollar memoria de trabajo verbal y retención de instrucciones",
      "9-12":  "Trabajar estrategias básicas de memoria para el contexto escolar",
      "13-16": "Fortalecer estrategias mnemónicas y memoria a largo plazo",
      "17-20": "Desarrollar autorregulación de la memoria y revisión espaciada",
    },
  },
  {
    area: "estrategias-aprendizaje",
    label: "Estrategias de aprendizaje",
    bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700",
    habilidadesPorFranja: {
      "0-2":   ["Explora materiales con curiosidad", "Imita acciones del adulto para resolver problemas", "Intenta de nuevo tras fracaso con apoyo", "Usa objetos para descubrir y explorar"],
      "3-5":   ["Pide ayuda cuando no logra una tarea", "Intenta una segunda opción si la primera no funciona", "Sigue pasos de una actividad con modelo visual", "Verbaliza lo que quiere hacer antes de hacerlo"],
      "6-8":   ["Usa subrayado o dibujo para recordar información", "Anticipa pasos antes de iniciar una tarea", "Identifica qué parte de la tarea le resultó más difícil", "Repite en voz alta para retener información nueva"],
      "9-12":  ["Organiza información con esquemas, listas o mapas", "Divide tareas complejas en pasos manejables", "Selecciona estrategia de estudio según el tipo de contenido", "Evalúa si comprendió lo que leyó o escuchó"],
      "13-16": ["Planifica el estudio con agenda o cronograma", "Usa elaboración y relación conceptual como estrategia", "Monitorea la comprensión y ajusta el ritmo de lectura", "Adapta estrategias según el tipo de evaluación"],
      "17-20": ["Gestiona autónomamente el aprendizaje con portafolio o revisión", "Selecciona y evalúa estrategias de forma metacognitiva", "Diseña su propio sistema de organización y estudio", "Transfiere estrategias a contextos nuevos y exigentes"],
    },
    actividadesClinicasPorFranja: {
      "0-2":   ["Modelado de resolución con objeto: el terapeuta intenta abrir una caja, fracasa, lo intenta de otro modo, verbaliza el proceso", "Exploración libre con material nuevo: observar qué estrategias espontáneas usa el niño para interactuar con el objeto", "Refuerzo del intento: celebrar que volvió a intentarlo después de no lograrlo la primera vez"],
      "3-5":   ["Tarea de 2 pasos con modelo visual: el terapeuta muestra las imágenes del proceso y el niño las ejecuta", "Práctica de pedir ayuda: situación diseñada donde el niño necesita ayuda y practica pedirla con palabras", "Verbalización antes de actuar: '¿qué vas a hacer primero?' — el niño lo dice antes de empezar"],
      "6-8":   ["Subrayado en texto corto: el paciente marca con colores lo que cree más importante y explica por qué lo eligió", "Anticipación de pasos: antes de una actividad, el paciente enumera los pasos que va a seguir y luego los ejecuta", "Reflexión final: al terminar la tarea, el paciente responde '¿qué fue fácil?, ¿qué fue difícil?, ¿qué harías diferente?'"],
      "9-12":  ["Construcción de mapa conceptual sobre contenido escolar: el paciente organiza un tema con sus propias palabras", "División de tarea compleja en pasos: el paciente toma una tarea escolar real y la descompone con el terapeuta", "Selección de estrategia: el terapeuta presenta 3 formas de estudiar un tema y el paciente elige y justifica la suya"],
      "13-16": ["Diseño de plan de estudio para evaluación próxima: el paciente distribuye el contenido en días y tiempos", "Práctica de monitoreo de comprensión: leer un párrafo y luego cerrar el texto y explicar lo que entendió", "Evaluación de estrategia usada en la última semana: ¿funcionó?, ¿qué evidencia tiene de eso?"],
      "17-20": ["Construcción de portafolio de aprendizaje: el paciente selecciona trabajos que muestren su progreso y reflexiona sobre ellos", "Transferencia de estrategia: el paciente aplica una estrategia conocida a un contexto académico nuevo", "Diseño de su propio sistema de organización del estudio: agenda, esquemas, repasos — con evaluación de eficacia a la semana siguiente"],
    },
    paraLaFamiliaPorFranja: {
      "0-2":   ["Permitir que el niño explore objetos a su propio ritmo sin resolverle el problema de inmediato", "Celebrar cuando lo intenta de nuevo después de no lograr algo: 'muy bien que lo intentaste otra vez'"],
      "3-5":   ["Enseñar a pedir ayuda en casa: validar la solicitud antes de responderla ('¡bien que pediste ayuda!')", "Usar imágenes o dibujos en la pared para mostrar los pasos de las rutinas (levantarse, desayunar, salir)"],
      "6-8":   ["Apoyar el uso de subrayadores o stickers para marcar lo importante en los cuadernos", "Preguntar al terminar la tarea: '¿qué parte te costó más?, ¿qué harías diferente mañana?' — sin juzgar la respuesta"],
      "9-12":  ["Apoyar la construcción de un sistema de organización propio: agenda, tablero o app que el niño elija", "No ordenar su espacio de estudio por él: preguntar si necesita ayuda antes de intervenir"],
      "13-16": ["Mostrar interés en cómo estudia el adolescente sin imponer el método propio: '¿qué estrategia usaste esta vez?'", "Validar el esfuerzo de planificar, aunque el plan no se cumpla perfectamente: el proceso también cuenta"],
      "17-20": ["Confiar en que el joven puede gestionar su aprendizaje con autonomía, interviniendo solo cuando lo pide", "Conversar sobre el estudio desde la curiosidad: '¿qué aprendiste esta semana?' sin evaluarlo"],
    },
    focoSugeridoPorFranja: {
      "0-2":   "Estimular curiosidad, exploración y persistencia ante tareas",
      "3-5":   "Trabajar autoayuda, anticipación y resolución de problemas simples",
      "6-8":   "Desarrollar estrategias básicas: subrayado, repetición y anticipación",
      "9-12":  "Trabajar organización, planificación y evaluación del propio aprendizaje",
      "13-16": "Fortalecer metacognición y selección de estrategias según contexto",
      "17-20": "Desarrollar gestión autónoma del aprendizaje y transferencia estratégica",
    },
  },
];

const ESTADO_BADGE: Record<string, { bg: string; label: string }> = {
  "nuevo":         { bg: "bg-stone-100 text-stone-600",   label: "Nuevo"         },
  "en proceso":    { bg: "bg-amber-100 text-amber-700",   label: "En proceso"    },
  "consolidando":  { bg: "bg-green-100 text-green-800",   label: "Consolidando"  },
  "generalizando": { bg: "bg-emerald-100 text-emerald-700", label: "Generalizando" },
};

const CLINICAL_SUGGESTION: Record<string, string> = {
  "nuevo":         "Primera vez que se trabaja este objetivo. Introduce la tarea de forma lúdica y observa la respuesta inicial del paciente.",
  "en proceso":    "Continuar y ajustar los apoyos según el desempeño observado en sesión. Mantén el nivel de exigencia alcanzable.",
  "consolidando":  "Reducir las ayudas progresivamente. Aumentar la exigencia en contextos controlados hasta lograr respuesta estable.",
  "generalizando": "Llevar el objetivo a nuevos contextos y situaciones. Valorar cierre o reformulación del objetivo.",
};

const CLINICAL_PERFORMANCE_MAP: Record<string, { label: string; statusNuevo: string; pct: number }> = {
  "nuevo":         { label: "Nuevo",         statusNuevo: "activo",      pct: 20 },
  "en proceso":    { label: "En proceso",    statusNuevo: "en progreso", pct: 50 },
  "consolidando":  { label: "Consolidando",  statusNuevo: "en progreso", pct: 75 },
  "generalizando": { label: "Generalizando", statusNuevo: "logrado",     pct: 95 },
};

function inferClinicalEstado(progressPct?: number | null): string {
  if (!progressPct || progressPct <= 0) return "nuevo";
  if (progressPct < 60) return "en proceso";
  if (progressPct < 85) return "consolidando";
  return "generalizando";
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
  const { user }                   = useAuth();
  const profesion                  = useMemo(() => getProfesion(user?.specialty), [user]);
  const diagnosisOptions           = useMemo(() => getDiagnosesByProfesion(profesion), [profesion]);
  const bloquesActivos             = useMemo(() => profesion === "psicopedagogia" ? BLOQUES_PSICOPED : BLOQUES_SESION, [profesion]);
  const bancoAreaOptions           = useMemo(() => getBancoAreas(profesion), [profesion]);

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

  const [sessionDiagnosis, setSessionDiagnosis]   = useState("");
  const [diagSuggestions, setDiagSuggestions]     = useState<any[]>([]);
  const [loadingDiagSug, setLoadingDiagSug]       = useState(false);
  const [showDiagSug, setShowDiagSug]             = useState(true);

  // ── TSH phoneme guide ──────────────────────────────────────────────────────
  const [selectedPhoneme, setSelectedPhoneme]     = useState<string | null>(null);
  const [phonemeAddingIdx, setPhonemeAddingIdx]   = useState<string | null>(null);

  const [showBanco, setShowBanco]             = useState(false);
  const [showCustomGoal, setShowCustomGoal]   = useState(false);
  const [bancoArea, setBancoArea]             = useState("");
  const [bancoSubarea, setBancoSubarea]       = useState("");
  const [bancoSearch, setBancoSearch]         = useState("");
  const [bancoSelected, setBancoSelected]     = useState<Set<number>>(new Set());

  const [showAllGoals, setShowAllGoals]       = useState(false);
  const [dismissedGoalIds, setDismissedGoalIds] = useState<Set<number>>(new Set());

  // ── AI session suggestions ─────────────────────────────────────────────
  const [showAISesion, setShowAISesion]       = useState(false);
  const [loadingAISesion, setLoadingAISesion] = useState(false);
  const [aiSesionList, setAiSesionList]       = useState<Array<{ title: string; areaClinica: string; category: string; nivelDificultad?: string; rationale?: string }>>([]);
  const [aiSesionEdits, setAiSesionEdits]     = useState<Record<number, string>>({});
  const [addingAiIdx, setAddingAiIdx]         = useState<Set<number>>(new Set());
  const [addedAiIdx, setAddedAiIdx]           = useState<Set<number>>(new Set());

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
      const res = await fetch(`${API_BASE}/api/goals?patientId=${patient.id}`, { credentials: "include" });
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
      const res = await fetch(`${API_BASE}/api/goal-library?${params}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: showBanco && !!bancoArea,
  });

  const { data: lastSessionRecord } = useQuery({
    queryKey: ["last-session-record", patient?.id],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/api/registros-clinicos?patientId=${patient!.id}`,
        { credentials: "include" }
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return null;
      return data[data.length - 1] as { fecha?: string; resumenSesion?: string | null };
    },
    enabled: !!patient,
  });

  const goals = (goalsRaw as any[]).filter(
    g => g.status === "activo" || g.status === "en progreso"
  );

  const assignedLibraryIds = new Set([
    ...(goalsRaw as any[]).map((g: any) => g.goalLibraryId).filter(Boolean),
    ...adHocGoals.map(g => g.id),
  ]);
  const bancoFiltered = (bancoRaw as any[]).filter(g => !assignedLibraryIds.has(g.id));

  // Filter diag suggestions to exclude already-added or already-assigned goals
  const visibleDiagSuggestions = diagSuggestions.filter((g: any) =>
    !adHocGoals.some(a => a.id === g.id) &&
    !(goalsRaw as any[]).some(ag => ag.goalLibraryId === g.id)
  );

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

    return [...goals]
      .filter(g => !dismissedGoalIds.has(g.id))
      .sort((a, b) => score(b) - score(a))
      .slice(0, 3);
  }, [goals, patient, dismissedGoalIds]);

  const lastWorkedGoal = useMemo(
    () => goals.find(g => g.status === "en progreso") ?? goals[0] ?? null,
    [goals],
  );

  // Remaining goals not in suggestions and not dismissed
  const otherGoals = useMemo(
    () => goals.filter(g => !suggestedGoals.some(s => s.id === g.id) && !dismissedGoalIds.has(g.id)),
    [goals, suggestedGoals, dismissedGoalIds],
  );

  // Auto-check suggested goals once goals load for this patient
  useEffect(() => {
    if (!patient || loadingGoals || goals.length === 0) return;
    if (hasAutoChecked.current === patient.id) return;
    hasAutoChecked.current = patient.id;

    const initial: Record<number, RowState> = {};
    suggestedGoals.forEach(g => {
      initial[g.id] = { checked: true, intentos: "", correctas: "", estado: inferClinicalEstado(g.progressPct) };
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
    setDismissedGoalIds(new Set());
    setSessionDiagnosis(p.diagnosis ?? "");
    setDiagSuggestions([]);
    setShowAISesion(false);
    setAiSesionList([]);
    setAiSesionEdits({});
    setAddingAiIdx(new Set());
    setAddedAiIdx(new Set());
  };

  // Auto-select patient from URL param once patients list is available
  useEffect(() => {
    if (!preselectedId || patient || (patients as any[]).length === 0) return;
    const found = (patients as any[]).find((p: any) => p.id === preselectedId);
    if (found) selectPatient(found);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedId, patients]);

  // ── Fetch diagnosis-based goal suggestions from the library ──────────────────
  useEffect(() => {
    if (!patient || !sessionDiagnosis) { setDiagSuggestions([]); return; }
    let cancelled = false;
    setLoadingDiagSug(true);
    const params = new URLSearchParams({ diagnosis: sessionDiagnosis, limit: "12" });
    fetch(`${API_BASE}/api/patients/${patient.id}/suggested-goals?${params}`)
      .then(r => r.json())
      .then(data => { if (!cancelled) setDiagSuggestions(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setDiagSuggestions([]); })
      .finally(() => { if (!cancelled) setLoadingDiagSug(false); });
    return () => { cancelled = true; };
  }, [patient?.id, sessionDiagnosis]);

  // ── Clear phoneme selection when diagnosis changes ─────────────────────────
  useEffect(() => {
    setSelectedPhoneme(null);
    setPhonemeAddingIdx(null);
  }, [sessionDiagnosis]);

  // ── Fetch clinical detail (libraryEntry + activities) for a goal ───────────
  const fetchDetail = async (goalId: number) => {
    if (detailCache[goalId]) return;
    try {
      const res = await fetch(`${API_BASE}/api/goals/${goalId}/activities`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setDetailCache(prev => ({ ...prev, [goalId]: data }));
      }
    } catch {}
  };

  // ── Add a phoneme template goal to the session (creates in library, then adds) ─
  const addPhonemeGoal = async (title: string, key: string) => {
    if (phonemeAddingIdx === key) return;
    if (adHocGoals.some((g: any) => g.nombreObjetivo === title)) return;
    setPhonemeAddingIdx(key);
    try {
      const res = await fetch(`${API_BASE}/api/goal-library`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreObjetivo: title,
          area: "habla",
          areaClinica: "habla",
          subarea: "articulación",
          nivelDificultad: "básico",
          estadoBanco: "sesion",
          isCustom: false,
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setAdHocGoals(prev => {
        if (prev.find((a: any) => a.id === created.id)) return prev;
        return [...prev, created];
      });
      setAdHocRows(prev => ({
        ...prev,
        [created.id]: { checked: true, intentos: "", correctas: "", estado: "nuevo" },
      }));
    } catch {
      // silently ignore — user sees no change
    } finally {
      setPhonemeAddingIdx(null);
    }
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
  const defaultRow = (status = "en proceso"): RowState => ({ checked: false, intentos: "", correctas: "", estado: status });

  const setRow = (goalId: number, patch: Partial<RowState>) =>
    setRows(prev => ({ ...prev, [goalId]: { ...(prev[goalId] ?? defaultRow()), ...patch } }));

  const toggleRow = (goalId: number) => {
    const cur = rows[goalId];
    setRow(goalId, { checked: !cur?.checked });
  };

  const setAdHocRow = (libId: number, patch: Partial<RowState>) =>
    setAdHocRows(prev => ({ ...prev, [libId]: { ...(prev[libId] ?? { checked: true, intentos: "", correctas: "", estado: "nuevo" }), ...patch } }));

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
    let duplicates = 0;
    setAdHocGoals(prev => {
      const existing = new Set(prev.map((g: any) => g.id));
      const newOnes = toAdd.filter((g: any) => !existing.has(g.id));
      duplicates = toAdd.length - newOnes.length;
      return [...prev, ...newOnes];
    });
    setAdHocRows(prev => {
      const next = { ...prev };
      toAdd.forEach((g: any) => {
        if (!next[g.id]) {
          next[g.id] = { checked: true, intentos: "", correctas: "", estado: "nuevo" };
        }
      });
      return next;
    });
    setBancoSelected(new Set());
    if (duplicates > 0) {
      toast({
        title: duplicates === 1 ? "Este objetivo ya está agregado" : `${duplicates} objetivos ya estaban agregados`,
        description: "Los objetivos nuevos fueron añadidos a la sesión.",
      });
    }
  };

  const removeAdHocGoal = (libId: number) => {
    setAdHocGoals(prev => prev.filter(g => g.id !== libId));
    setAdHocRows(prev => { const n = { ...prev }; delete n[libId]; return n; });
  };

  // ── AI session suggestion helpers ──────────────────────────────────────────
  const fetchAISesionSuggestions = async () => {
    if (!patient) return;
    setShowAISesion(true);
    setLoadingAISesion(true);
    setAiSesionList([]);
    setAiSesionEdits({});
    setAddingAiIdx(new Set());
    setAddedAiIdx(new Set());
    try {
      const resp = await fetch(`${API_BASE}/api/ai/objetivos-suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ patientId: patient.id, mode: "sesion" }),
      });
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        throw new Error((e as any).error ?? "Error al generar sugerencias");
      }
      const data = await resp.json();
      setAiSesionList(data.objetivos ?? []);
    } catch (err: any) {
      toast({ title: "Error al generar sugerencias", description: err.message, variant: "destructive" });
      setShowAISesion(false);
    } finally {
      setLoadingAISesion(false);
    }
  };

  const addAISuggestion = async (idx: number) => {
    const sug = aiSesionList[idx];
    if (!sug || addingAiIdx.has(idx) || addedAiIdx.has(idx)) return;
    const title = (aiSesionEdits[idx] ?? sug.title).trim();
    if (!title) return;

    setAddingAiIdx(prev => new Set([...prev, idx]));
    try {
      const res = await fetch(`${API_BASE}/api/goal-library`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreObjetivo: title,
          area: sug.areaClinica ?? sug.category ?? "general",
          areaClinica: sug.areaClinica ?? sug.category ?? "general",
          nivelDificultad: sug.nivelDificultad ?? "básico",
          estadoBanco: "sesion",
          isCustom: true,
        }),
      });
      if (!res.ok) throw new Error("Error al crear objetivo");
      const created = await res.json();
      setAdHocGoals(prev => {
        if (prev.find(g => g.id === created.id)) return prev;
        return [...prev, created];
      });
      setAdHocRows(prev => ({
        ...prev,
        [created.id]: { checked: true, intentos: "", correctas: "", estado: "nuevo" },
      }));
      setAddedAiIdx(prev => new Set([...prev, idx]));
    } catch {
      toast({ title: "Error al agregar el objetivo", variant: "destructive" });
    } finally {
      setAddingAiIdx(prev => { const n = new Set(prev); n.delete(idx); return n; });
    }
  };

  const dismissAISuggestion = (idx: number) => {
    setAiSesionList(prev => prev.filter((_, i) => i !== idx));
    setAiSesionEdits(prev => { const n = { ...prev }; delete n[idx]; return n; });
    setAddedAiIdx(prev => { const n = new Set(prev); n.delete(idx); return n; });
  };

  // ── Report suggestion builder ──────────────────────────────────────────────
  const buildResumenSugerido = (): string => {
    const nombre = patient?.name?.split(" ")[0] ?? "el/la paciente";
    const edad = patient?.age ? `${patient.age} años` : null;
    const diag = (sessionDiagnosis ?? "").trim();

    type DiagCtx = { area: string; focus: string; progress: string; recomendacion: string };
    const DIAG_CTX: Array<{ match: string[]; ctx: DiagCtx }> = [
      {
        match: ["tdah", "deficit de atención", "déficit de atención", "hiperactividad"],
        ctx: {
          area: "trastorno por déficit de atención e hiperactividad (TDAH)",
          focus: "regulación atencional, planificación y autorregulación conductual",
          progress: "El paciente presentó capacidad de sostenimiento atencional adecuada a las actividades propuestas, con respuesta positiva a las estrategias de estructuración utilizadas.",
          recomendacion: "Se recomienda mantener rutinas predecibles en el entorno familiar y escolar, usando apoyos visuales para las consignas y pausas activas cuando sea necesario.",
        },
      },
      {
        match: ["tel", "trastorno específico del lenguaje", "trastorno del lenguaje", "lenguaje"],
        ctx: {
          area: "trastorno específico del lenguaje (TEL)",
          focus: "comprensión verbal, expresión lingüística y organización del discurso",
          progress: "El paciente presentó participación activa en las tareas de comunicación, con respuestas ajustadas al nivel de estimulación lingüística propuesto.",
          recomendacion: "Se recomienda estimular la comunicación verbal en contextos cotidianos, ampliar el vocabulario mediante lecturas compartidas y reforzar los logros alcanzados durante la semana.",
        },
      },
      {
        match: ["tea", "espectro autista", "autismo"],
        ctx: {
          area: "trastorno del espectro autista (TEA)",
          focus: "comunicación funcional, interacción social y habilidades pragmáticas",
          progress: "El paciente presentó estrategias de comunicación funcional activas durante la sesión, con avances en la intencionalidad comunicativa dentro del encuadre terapéutico.",
          recomendacion: "Se recomienda generalizar los aprendizajes a nuevos contextos y fortalecer las rutinas de interacción social en el entorno familiar.",
        },
      },
      {
        match: ["fonológico", "fonología", "trastorno fonológico"],
        ctx: {
          area: "trastorno fonológico",
          focus: "producción articulatoria, discriminación auditiva y conciencia fonológica",
          progress: "El paciente presentó un desempeño adecuado en las tareas de producción. Se evidencia trabajo activo en la precisión articulatoria y la discriminación de fonemas en contexto.",
          recomendacion: "Se recomienda práctica diaria de los sonidos trabajados en entornos naturales, sin presión correctiva explícita y reforzando los intentos positivos.",
        },
      },
      {
        match: ["dislexia"],
        ctx: {
          area: "dislexia",
          focus: "conciencia fonológica, decodificación lectora y fluidez",
          progress: "Se evidencian avances en el procesamiento fonológico y lector, con respuesta positiva a las actividades de decodificación propuestas en sesión.",
          recomendacion: "Se recomienda lectura diaria en voz alta de textos adaptados al nivel del paciente y uso de apoyos visuales para la comprensión lectora.",
        },
      },
      {
        match: ["habla", "trastorno del habla", "dislalia", "tsh", "trastornos de los sonidos"],
        ctx: {
          area: "trastorno de los sonidos del habla (TSH)",
          focus: "producción del habla, articulación y sonidos del habla",
          progress: "El paciente presentó trabajo articulatorio con retroalimentación auditiva y visual. Se evidencian avances en la producción de los fonemas trabajados durante la sesión.",
          recomendacion: "Se recomienda práctica breve y motivadora en casa de los sonidos trabajados, sin corrección directa y celebrando todos los intentos positivos.",
        },
      },
      {
        match: ["discalculia", "matemática", "cálculo"],
        ctx: {
          area: "dificultades en el área del cálculo",
          focus: "procesamiento numérico, operaciones y razonamiento matemático",
          progress: "Se trabajaron habilidades numéricas con apoyo de material concreto. El paciente presentó respuesta favorable a las actividades propuestas.",
          recomendacion: "Se recomienda reforzar los conceptos trabajados mediante juegos numéricos breves en el entorno familiar.",
        },
      },
    ];

    const diagLower = diag.toLowerCase();
    const matchedCtx = DIAG_CTX.find(d => d.match.some(m => diagLower.includes(m)))?.ctx ?? {
      area: diag || "intervención terapéutica",
      focus: "los objetivos terapéuticos seleccionados",
      progress: "Se registró participación adecuada al contexto de la sesión y respuesta favorable a las actividades planteadas.",
      recomendacion: "Se recomienda reforzar los aprendizajes de la sesión en el entorno cotidiano del paciente.",
    };

    const ESTADO_LABEL: Record<string, string> = {
      nuevo:         "en abordaje inicial",
      "en proceso":  "en proceso de adquisición",
      consolidando:  "en etapa de consolidación",
      generalizando: "en etapa de generalización",
      logrado:       "con logro de la conducta esperada",
      "no logrado":  "con dificultades en la ejecución",
    };

    const checkedGoalsNow = goals.filter(g => rows[g.id]?.checked);
    const checkedAdHocNow = adHocGoals.filter(g => adHocRows[g.id]?.checked !== false);
    const allChecked = [
      ...checkedGoalsNow.map(g => ({ title: g.title, estado: rows[g.id]?.estado ?? "en proceso" })),
      ...checkedAdHocNow.map(g => ({ title: g.nombreObjetivo ?? g.title, estado: adHocRows[g.id]?.estado ?? "en proceso" })),
    ];

    // Block 1 — opening context
    const infoPartes = [nombre, ...(edad ? [edad] : [])].join(", ");
    const line1 = `Se realizó sesión con ${infoPartes}, en el contexto de ${matchedCtx.area}.`;

    // Block 2 — therapeutic focus
    const focoStr = focoTerapeutico.trim().replace(/\.$/, "").toLowerCase();
    const line2 = focoStr
      ? `El trabajo estuvo orientado a ${focoStr}.`
      : `El foco de la sesión se centró en ${matchedCtx.focus}.`;

    // Block 3 — clinical observations (from observaciones field — IMPORTANT)
    const obsStr = observaciones.trim();
    const line3obs = obsStr
      ? `Durante la sesión se observó: ${obsStr.charAt(0).toLowerCase()}${obsStr.slice(1)}${obsStr.endsWith(".") ? "" : "."}`
      : "";

    // Block 4 — goals worked
    let line4 = "";
    if (allChecked.length === 1) {
      const g = allChecked[0];
      line4 = `Se trabajó el objetivo "${g.title}" (${ESTADO_LABEL[g.estado] ?? g.estado}).`;
    } else if (allChecked.length >= 2) {
      const displayGoals = allChecked.slice(0, 3);
      const titles = displayGoals.map(g => `"${g.title}"`).join(", ");
      const suffix = allChecked.length > 3 ? `, entre otros ${allChecked.length - 3}` : "";
      const allEstados = allChecked.map(g => g.estado);
      const dominant = ["consolidando", "generalizando", "en proceso", "nuevo", "no logrado"].find(e =>
        allEstados.filter(v => v === e).length > 0
      ) ?? "en proceso";
      line4 = `Se trabajaron ${allChecked.length} objetivos: ${titles}${suffix}. Desempeño predominante: ${ESTADO_LABEL[dominant] ?? dominant}.`;
    }

    // Block 5 — evolution / progress
    const avanzados = allChecked.filter(g => g.estado === "consolidando" || g.estado === "generalizando");
    const line5 = avanzados.length > 0
      ? `Se evidencian avances en: ${avanzados.map(g => `"${g.title}"`).join(", ")}.`
      : matchedCtx.progress;

    // Block 6 — recommendations
    const allEstados2 = allChecked.map(g => g.estado);
    const mostlyAdvanced = allEstados2.filter(e => e === "consolidando" || e === "generalizando").length > allEstados2.length / 2;
    const recomLine = mostlyAdvanced
      ? "Se recomienda avanzar hacia la generalización de los logros en contextos naturales y cotidianos."
      : matchedCtx.recomendacion;
    const line6 = allChecked.length > 0 ? recomLine : "";

    return [line1, line2, line3obs, line4, line5, line6].filter(Boolean).join(" ");
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
      const rcRes = await fetch(`${API_BASE}/api/registros-clinicos`, {
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
          const row = rows[goal.id] ?? defaultRow();
          const map = CLINICAL_PERFORMANCE_MAP[row.estado ?? "en proceso"] ?? CLINICAL_PERFORMANCE_MAP["en proceso"];
          return fetch(`${API_BASE}/api/goals/${goal.id}/progress`, {
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
          const row = adHocRows[libGoal.id] ?? { checked: true, intentos: "", correctas: "", estado: "en proceso" };
          const map = CLINICAL_PERFORMANCE_MAP[row.estado ?? "en proceso"] ?? CLINICAL_PERFORMANCE_MAP["en proceso"];

          const alreadyAssigned = (goalsRaw as any[]).find((g: any) => g.goalLibraryId === libGoal.id);
          let goalId: number;

          if (alreadyAssigned) {
            goalId = alreadyAssigned.id;
          } else {
            const assignRes = await fetch(`${API_BASE}/api/goals`, {
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

          await fetch(`${API_BASE}/api/goals/${goalId}/progress`, {
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
      queryClient.invalidateQueries({ queryKey: getListRegistrosClinicosQueryKey({ patientId: patient.id }) });
      queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
      const n = totalSelected;
      toast({ title: n > 0 ? `Sesión guardada · ${n} objetivo${n !== 1 ? "s" : ""} actualizado${n !== 1 ? "s" : ""}` : "Sesión guardada" });
      navigate(`/patients/${patient.id}`);
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
    isSessionGoal,
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
    isSessionGoal?: boolean;
    onRemove?: () => void;
    libraryData?: any;
    goalIdForDetail?: number;
    goalMeta?: GoalMeta;
  }) {
    const [savedToBank, setSavedToBank] = useState(false);
    const [savingToBank, setSavingToBank] = useState(false);

    const handleSaveToBank = async (e: React.MouseEvent) => {
      e.stopPropagation();
      setSavingToBank(true);
      try {
        const res = await fetch(`${API_BASE}/api/goal-library/${goalId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estadoBanco: "activo" }),
        });
        if (!res.ok) throw new Error("Error al guardar");
        setSavedToBank(true);
      } catch {
        // silently ignore — toast would need useToast here
      } finally {
        setSavingToBank(false);
      }
    };
    const estadoStyle = ESTADO_STYLE[row.estado] ?? "";
    const estadoBadge = ESTADO_BADGE[row.estado];
    const clinicalTip = CLINICAL_SUGGESTION[row.estado];
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
              {row.checked && estadoBadge && (
                <span className={`inline-flex items-center text-[10px] rounded-full px-2 py-0.5 font-semibold shrink-0 ${estadoBadge.bg}`}>
                  {estadoBadge.label}
                </span>
              )}
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
            {isAdHoc && isSessionGoal && !savedToBank && (
              <button
                title="Guardar en banco"
                disabled={savingToBank}
                className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-violet-300 text-violet-500 hover:bg-violet-50 transition-colors disabled:opacity-50 shrink-0"
                onClick={handleSaveToBank}
              >
                <BookmarkPlus className="h-3 w-3" />
                {savingToBank ? "…" : "Guardar en banco"}
              </button>
            )}
            {isAdHoc && isSessionGoal && savedToBank && (
              <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-500 border border-violet-200 shrink-0">
                <BookmarkPlus className="h-3 w-3" /> En banco
              </span>
            )}
            {onRemove && (
              <button className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                title="Quitar de esta sesión"
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

            {/* Estado clínico + sugerencia */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground shrink-0">Estado clínico</label>
                <div className="flex flex-wrap gap-1.5">
                  {ESTADO_OPTIONS.map(o => {
                    const badge = ESTADO_BADGE[o.value];
                    const isActive = row.estado === o.value;
                    return (
                      <button
                        key={o.value}
                        onClick={() => onSetRow({ estado: o.value })}
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                          isActive
                            ? `${badge?.bg} border-current ring-1 ring-current/30`
                            : "bg-muted/60 text-muted-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div
                className="flex items-start gap-2 rounded-lg px-3 py-2 border"
                style={{ background: "#FEF6EE", borderColor: "#F3D9C0" }}
              >
                <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "#C4703A" }} />
                <p className="text-xs leading-snug" style={{ color: "#7C3D12" }}>
                  <span className="font-semibold" style={{ color: "#92400E" }}>Sugerencia clínica · </span>
                  {clinicalTip ?? "Registra el desempeño y actualiza el estado clínico del objetivo."}
                </p>
              </div>
            </div>

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
                  <div className="flex gap-2.5 px-3.5 py-3 bg-card border-b border-border/50">
                    <ClipboardList className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground/70 mb-0.5">Definición operativa</p>
                      <p className="text-muted-foreground leading-relaxed">{entry.definicionOperativa}</p>
                    </div>
                  </div>
                )}

                {/* Marco conceptual — static content */}
                {(clinicalContent?.marcoConceptual || entry?.marcoConceptual) && (
                  <div className="flex gap-2.5 px-3.5 py-3 bg-amber-50/60 border-b border-amber-100/60">
                    <Brain className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-amber-800 mb-1">Marco conceptual</p>
                      <p className="text-amber-900/80 leading-relaxed">
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
                    <div className="flex gap-2.5 px-3.5 py-3 bg-amber-50/40 border-b border-amber-100/60">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-amber-800 mb-1">Actividades clínicas</p>
                        <ul className="space-y-1.5">
                          {items.map((act: string, i: number) => (
                            <li key={i} className="flex gap-1.5 text-amber-900/80">
                              <span className="text-amber-500 shrink-0 mt-0.5">·</span>
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
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 space-y-4">
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
          {patient && (
            <div className="space-y-1.5 border-t border-border/40 pt-3">
              <label className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
                <Stethoscope className="h-4 w-4" style={{ color: BRAND_TEAL }} />
                Diagnóstico
              </label>
              <div className="flex flex-wrap gap-2">
                {diagnosisOptions.map(d => {
                  const active = sessionDiagnosis === d.value;
                  return (
                    <button
                      key={d.value}
                      onClick={() => setSessionDiagnosis(active ? "" : d.value)}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                        active
                          ? "text-white border-transparent shadow-sm"
                          : "bg-muted/50 border-border/70 text-foreground/70 hover:bg-muted hover:border-border hover:text-foreground/85"
                      }`}
                      style={active ? { background: BRAND_TEAL, borderColor: BRAND_TEAL } : {}}
                    >
                      {d.value}
                    </button>
                  );
                })}
              </div>
              {sessionDiagnosis && (
                <p className="text-xs text-muted-foreground pl-0.5">
                  {diagnosisOptions.find(d => d.value === sessionDiagnosis)?.label ?? sessionDiagnosis}
                </p>
              )}
              {sessionDiagnosis && (
                <EvalSugerida diagnosis={sessionDiagnosis} compact />
              )}
            </div>
          )}
        </div>

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
              {bloquesActivos.map(bloque => {
                const isOpen = selectedBloque === bloque.area;
                return (
                  <button
                    key={bloque.area}
                    onClick={() => setSelectedBloque(isOpen ? null : bloque.area)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      isOpen
                        ? `${bloque.bg} ${bloque.border} ${bloque.text} ring-2 ring-offset-1 ring-current`
                        : "bg-muted/60 border-border text-foreground/75 hover:bg-muted hover:border-border/80"
                    }`}
                  >
                    {bloque.label}
                  </button>
                );
              })}
            </div>

            {/* Expanded block panel */}
            {selectedBloque && (() => {
              const bloque = bloquesActivos.find(b => b.area === selectedBloque);
              if (!bloque) return null;
              const edadLabel     = FRANJAS_EDAD.find(f => f.value === selectedEdad)?.label ?? selectedEdad;
              const habs          = bloque.habilidadesPorFranja[selectedEdad] ?? [];
              const acts          = bloque.actividadesClinicasPorFranja?.[selectedEdad];
              const familia       = bloque.paraLaFamiliaPorFranja?.[selectedEdad];
              const focoSugerido  = bloque.focoSugeridoPorFranja[selectedEdad] ?? "";
              return (
                <div className={`mx-4 mb-4 rounded-xl border ${bloque.border} overflow-hidden`} style={{ background: "white" }}>
                  <div className={`px-4 py-2.5 border-b ${bloque.border} ${bloque.bg}`}>
                    <p className={`text-[11px] font-bold uppercase tracking-wide ${bloque.text}`}>
                      {bloque.label} · {edadLabel}
                    </p>
                  </div>
                  {habs.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-muted-foreground">Sin contenido clínico para esta franja etaria.</p>
                      <p className="text-xs text-muted-foreground/40 mt-1">Selecciona otra franja o consulta al supervisor clínico.</p>
                    </div>
                  ) : (
                    <>
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
                      <div className="px-4 py-3 border-t border-border/50">
                        <button
                          onClick={() => { setFocoTerapeutico(focoSugerido); setSelectedBloque(null); }}
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

        {/* ── Compact session summary strip ────────────────────────────── */}
        {patient && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border/50 bg-muted/30 text-xs text-muted-foreground flex-wrap">
            <span className="font-semibold text-foreground/80">{patient.name}</span>
            {patient.age && <span>{patient.age} años</span>}
            <span className="text-border/70">·</span>
            <span>{fecha}</span>
            {sessionDiagnosis && (
              <>
                <span className="text-border/70">·</span>
                <span
                  className="font-semibold px-2 py-0.5 rounded-full text-white text-[10px]"
                  style={{ background: BRAND_TEAL }}
                >
                  {sessionDiagnosis}
                </span>
              </>
            )}
            {totalSelected > 0 && (
              <>
                <span className="text-border/70">·</span>
                <span className="font-semibold" style={{ color: BRAND_TEAL }}>
                  {totalSelected} objetivo{totalSelected !== 1 ? "s" : ""} en sesión
                </span>
              </>
            )}
          </div>
        )}

        {/* ── Guía de adquisición de fonemas (TSH) ─────────────────────── */}
        {patient && (sessionDiagnosis === "TSH" || sessionDiagnosis === "Dislalia") && (
          <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: `${BRAND_TEAL}35`, background: `linear-gradient(135deg, ${BRAND_TEAL}08 0%, #faf7f5 100%)` }}>
            {/* Header */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b" style={{ borderColor: `${BRAND_TEAL}20` }}>
              <Volume2 className="h-4 w-4 shrink-0" style={{ color: BRAND_TEAL }} />
              <h2 className="text-sm font-bold text-foreground">Guía de adquisición de fonemas</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border" style={{ background: `${BRAND_TEAL}15`, color: BRAND_TEAL, borderColor: `${BRAND_TEAL}30` }}>
                TSH
              </span>
              {selectedPhoneme && (
                <button
                  onClick={() => setSelectedPhoneme(null)}
                  className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                  Limpiar
                </button>
              )}
            </div>

            {/* Phoneme chips */}
            <div className="px-5 pt-3.5 pb-4">
              <p className="text-[10px] text-muted-foreground mb-3 uppercase tracking-wide font-semibold">
                Orden típico de adquisición — toca un fonema para ver objetivos
              </p>
              <div className="flex flex-wrap gap-2 items-center">
                {PHONEME_GROUPS.map((group, groupIdx) => (
                  <div key={groupIdx} className="flex items-center gap-1.5">
                    {groupIdx > 0 && (
                      <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                    )}
                    {group.phonemes.map(ph => {
                      const isActive = selectedPhoneme === ph;
                      return (
                        <button
                          key={ph}
                          onClick={() => setSelectedPhoneme(isActive ? null : ph)}
                          className={`text-sm font-bold px-3 py-1.5 rounded-full border transition-all select-none ${
                            isActive
                              ? "text-white shadow-sm scale-105"
                              : "text-foreground/75 hover:text-foreground hover:scale-105"
                          }`}
                          style={
                            isActive
                              ? { background: BRAND_BLUE, borderColor: BRAND_BLUE }
                              : { background: "white", borderColor: `${BRAND_TEAL}45` }
                          }
                        >
                          {ph}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Phoneme-specific goal suggestions (static templates) */}
            {selectedPhoneme && (PHONEME_GOAL_TEMPLATES[selectedPhoneme] ?? []).length > 0 && (
              <div className="border-t" style={{ borderColor: `${BRAND_TEAL}20` }}>
                {/* Sub-header */}
                <div className="flex items-center gap-2 px-5 py-2.5" style={{ background: `${BRAND_TEAL}10` }}>
                  <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: BRAND_TEAL }} />
                  <span className="text-xs font-semibold text-foreground/80">
                    Objetivos sugeridos — {selectedPhoneme}
                  </span>
                  <span className="ml-auto text-[10px] text-muted-foreground">habla · articulación</span>
                </div>

                <div className="divide-y" style={{ borderColor: `${BRAND_TEAL}12` }}>
                  {(PHONEME_GOAL_TEMPLATES[selectedPhoneme] ?? []).map((title, idx) => {
                    const key = `${selectedPhoneme}-${idx}`;
                    const alreadyAdded = adHocGoals.some((g: any) => g.nombreObjetivo === title);
                    const isAdding = phonemeAddingIdx === key;
                    return (
                      <div key={idx} className="flex items-center gap-3 px-5 py-3 hover:bg-white/40 transition-colors">
                        <p className="flex-1 text-xs font-medium text-foreground leading-snug">{title}</p>
                        {alreadyAdded ? (
                          <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-secondary">
                            <Check className="h-3 w-3" /> Agregado
                          </span>
                        ) : (
                          <button
                            disabled={isAdding}
                            onClick={() => addPhonemeGoal(title, key)}
                            className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all"
                            style={{ borderColor: `${BRAND_TEAL}50`, color: isAdding ? BRAND_TEAL : BRAND_TEAL, opacity: isAdding ? 0.6 : 1 }}
                          >
                            {isAdding ? "…" : "+ Agregar"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Objetivos sugeridos por diagnóstico ───────────────────────── */}
        {patient && sessionDiagnosis && (
          <div className="rounded-2xl border border-violet-200 shadow-sm overflow-hidden bg-violet-50/40">
            <button
              className="w-full flex items-center justify-between gap-2 px-5 py-3.5"
              onClick={() => setShowDiagSug(v => !v)}
            >
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-violet-500" />
                <h2 className="text-sm font-bold text-violet-900">Objetivos sugeridos por diagnóstico</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 border border-violet-200">
                  {sessionDiagnosis}
                </span>
              </div>
              {showDiagSug
                ? <ChevronUp className="h-4 w-4 text-violet-400 shrink-0" />
                : <ChevronDown className="h-4 w-4 text-violet-400 shrink-0" />}
            </button>

            {showDiagSug && (
              <div className="border-t border-violet-100 divide-y divide-violet-100">
                {loadingDiagSug ? (
                  <div className="px-5 py-6 text-center text-sm text-muted-foreground">Buscando objetivos…</div>
                ) : visibleDiagSuggestions.length === 0 ? (
                  <div className="px-5 py-6 text-center text-sm text-muted-foreground">
                    {diagSuggestions.length === 0
                      ? "Sin sugerencias para este diagnóstico y franja etaria."
                      : "Todos los objetivos sugeridos ya están agregados a la sesión."}
                  </div>
                ) : (
                  visibleDiagSuggestions.map((g: any) => (
                    <div key={g.id} className="flex items-start gap-3 px-5 py-3 hover:bg-violet-50/60 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground leading-snug">{g.nombreObjetivo}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {g.areaClinica ?? g.area}
                          {g.nivelDificultad && ` · ${g.nivelDificultad}`}
                          {g.franjaEtaria && ` · ${g.franjaEtaria} años`}
                        </p>
                      </div>
                      <button
                        className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-violet-300 text-violet-600 hover:bg-violet-100 transition-colors mt-0.5"
                        onClick={() => {
                          setAdHocGoals(prev => {
                            if (prev.find(a => a.id === g.id)) return prev;
                            return [...prev, g];
                          });
                          setAdHocRows(prev => {
                            if (prev[g.id]) return prev;
                            return { ...prev, [g.id]: { checked: true, intentos: "", correctas: "", estado: "nuevo" } };
                          });
                        }}
                      >
                        + Agregar
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Guía de la sesión ─────────────────────────────────────────── */}
        {patient && !loadingGoals && goals.length > 0 && (
          <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: `${BRAND_TEAL}40`, background: `linear-gradient(135deg, ${BRAND_TEAL}10 0%, #faf7f5 100%)` }}>
            {/* Header */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b" style={{ borderColor: `${BRAND_TEAL}20` }}>
              <Sparkles className="h-4 w-4" style={{ color: BRAND_TEAL }} />
              <h2 className="text-sm font-bold text-foreground">Guía de la sesión</h2>
            </div>

            <div className="divide-y" style={{ borderColor: `${BRAND_TEAL}15` }}>
              {/* Last session summary */}
              {(lastWorkedGoal || lastSessionRecord?.resumenSesion) && (
                <div className="px-5 py-3.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Sesión anterior</p>
                  {lastSessionRecord?.resumenSesion && (
                    <p className="text-[12px] text-muted-foreground italic leading-relaxed mb-2 line-clamp-3">
                      {lastSessionRecord.resumenSesion}
                    </p>
                  )}
                  {lastWorkedGoal && (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground/80 truncate">{lastWorkedGoal.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {(() => {
                            const ce = inferClinicalEstado(lastWorkedGoal.progressPct);
                            const b = ESTADO_BADGE[ce];
                            return (
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${b?.bg ?? "bg-muted text-muted-foreground"}`}>
                                {b?.label ?? ce}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Suggested objectives */}
              <div className="px-5 py-3.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">
                  Trabajo en sesión 
                </p>
                <div className="space-y-2">
                  {suggestedGoals.map(goal => {
                    const row = rows[goal.id] ?? defaultRow(inferClinicalEstado(goal.progressPct));
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
                        {(() => {
                          const ce = inferClinicalEstado(goal.progressPct);
                          const b = ESTADO_BADGE[ce];
                          return (
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${b?.bg ?? "bg-muted text-muted-foreground"}`}>
                              {b?.label ?? ce}
                            </span>
                          );
                        })()}
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
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 space-y-2">
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
        {/* ── Card: objetivos ───────────────────────────────────────────── */}
        {patient && (
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground shrink-0">
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
              <button
                onClick={loadingAISesion ? undefined : fetchAISesionSuggestions}
                disabled={loadingAISesion}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all shrink-0"
                style={{
                  color: BRAND_BLUE,
                  borderColor: `${BRAND_BLUE}40`,
                  background: showAISesion ? `${BRAND_BLUE}08` : "transparent",
                }}
              >
                {loadingAISesion
                  ? <span className="h-3 w-3 rounded-full border-2 border-current/30 border-t-current animate-spin" />
                  : <Sparkles className="h-3.5 w-3.5" />
                }
                {loadingAISesion ? "Analizando…" : "Sugerir objetivos para esta sesión"}
              </button>
            </div>

            {/* ── AI session suggestion panel ─────────────────────────── */}
            {showAISesion && (
              <div className="border-b border-border/50">
                {loadingAISesion ? (
                  <div className="px-5 py-6 flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin shrink-0" />
                    Analizando historial clínico, objetivos y sesiones recientes…
                  </div>
                ) : aiSesionList.length === 0 ? (
                  <div className="px-5 py-5 text-center text-sm text-muted-foreground">
                    No se pudieron generar sugerencias para esta sesión.
                    <button onClick={fetchAISesionSuggestions} className="ml-2 underline hover:no-underline">
                      Reintentar
                    </button>
                  </div>
                ) : (
                  <div className="px-5 pt-3 pb-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: BRAND_BLUE }}>
                        <Sparkles className="h-3 w-3 inline mr-1" />
                        Sugerencias IA para hoy
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={fetchAISesionSuggestions}
                          className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground/70 transition-colors"
                        >
                          <RefreshCw className="h-2.5 w-2.5" /> Regenerar
                        </button>
                        <button
                          onClick={() => setShowAISesion(false)}
                          className="text-muted-foreground hover:text-foreground/70 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {aiSesionList.map((sug, idx) => {
                      const isAdded   = addedAiIdx.has(idx);
                      const isAdding  = addingAiIdx.has(idx);
                      const editVal   = aiSesionEdits[idx] ?? sug.title;
                      return (
                        <div
                          key={idx}
                          className={`rounded-xl border px-3.5 py-3 transition-all ${
                            isAdded
                              ? "border-emerald-200 bg-emerald-50/60"
                              : "border-border/60 bg-muted/30"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0 space-y-1.5">
                              {/* Editable title */}
                              <input
                                type="text"
                                value={editVal}
                                disabled={isAdded}
                                onChange={e => setAiSesionEdits(prev => ({ ...prev, [idx]: e.target.value }))}
                                className="w-full text-sm font-medium bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground disabled:opacity-70 focus:ring-0 p-0"
                              />
                              {/* Badges + rationale */}
                              <div className="flex flex-wrap items-center gap-2">
                                {sug.areaClinica && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/8 text-primary/80 capitalize">
                                    {sug.areaClinica}
                                  </span>
                                )}
                                {sug.nivelDificultad && (
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize ${
                                    sug.nivelDificultad === "avanzado"
                                      ? "bg-orange-100 text-orange-700"
                                      : sug.nivelDificultad === "intermedio"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-emerald-100 text-emerald-700"
                                  }`}>
                                    {sug.nivelDificultad}
                                  </span>
                                )}
                                {sug.rationale && (
                                  <span className="text-[10px] text-muted-foreground italic leading-tight">
                                    {sug.rationale}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                              {isAdded ? (
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Agregado
                                </span>
                              ) : (
                                <button
                                  onClick={() => addAISuggestion(idx)}
                                  disabled={isAdding || !editVal.trim()}
                                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg text-white transition-all disabled:opacity-50"
                                  style={{ background: isAdding ? `${BRAND_TEAL}80` : BRAND_TEAL }}
                                >
                                  {isAdding
                                    ? <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                    : <Plus className="h-3 w-3" />
                                  }
                                  {isAdding ? "" : "Agregar"}
                                </button>
                              )}
                              {!isAdded && (
                                <button
                                  onClick={() => dismissAISuggestion(idx)}
                                  className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                                  title="Descartar sugerencia"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

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
                    row={rows[goal.id] ?? defaultRow(inferClinicalEstado(goal.progressPct))}
                    onToggle={() => toggleRow(goal.id)}
                    onSetRow={patch => setRow(goal.id, patch)}
                    isSuggested
                    onRemove={() => {
                      setDismissedGoalIds(prev => new Set([...prev, goal.id]));
                      setRows(prev => { const n = { ...prev }; delete n[goal.id]; return n; });
                    }}
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
                    row={adHocRows[libGoal.id] ?? { checked: true, intentos: "", correctas: "", estado: "nuevo" }}
                    onToggle={() => setAdHocRow(libGoal.id, { checked: !(adHocRows[libGoal.id]?.checked ?? true) })}
                    onSetRow={patch => setAdHocRow(libGoal.id, patch)}
                    isAdHoc
                    isSessionGoal={libGoal.estadoBanco === "sesion"}
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
                        onRemove={() => {
                          setDismissedGoalIds(prev => new Set([...prev, goal.id]));
                          setRows(prev => { const n = { ...prev }; delete n[goal.id]; return n; });
                        }}
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
                <div className="divide-y divide-border/30">
                  <button
                    className="w-full flex items-center gap-2 px-5 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors group"
                    onClick={() => setShowBanco(true)}
                  >
                    <Plus className="h-4 w-4 text-muted-foreground group-hover:text-foreground/70 transition-colors" />
                    Agregar del banco
                    <BookOpen className="h-3.5 w-3.5 ml-auto text-muted-foreground/40 group-hover:text-muted-foreground" />
                  </button>
                  {patient && (
                    <button
                      className="w-full flex items-center gap-2 px-5 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors group"
                      onClick={() => setShowCustomGoal(true)}
                    >
                      <Sparkles className="h-4 w-4 text-violet-400 group-hover:text-violet-500 transition-colors" />
                      Nuevo objetivo personalizado
                    </button>
                  )}
                </div>
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
                          {bancoAreaOptions.map(a => (
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
                      value={focoTerapeutico}
                      onChange={e => setFocoTerapeutico(e.target.value)}
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
                                  ? "bg-amber-50 hover:bg-amber-50"
                                  : "hover:bg-muted/50"
                              }`}
                              onClick={() => { if (!alreadyAdded) toggleBancoGoal(g.id); }}
                            >
                              {/* Checkbox indicator */}
                              <div className={`mt-0.5 h-4 w-4 rounded shrink-0 flex items-center justify-center border transition-colors ${
                                alreadyAdded
                                  ? "bg-emerald-400 border-emerald-400"
                                  : isSelected
                                  ? "border-amber-500 bg-amber-500"
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
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Notas de sesión <span className="text-muted-foreground font-normal">(opcional)</span></h2>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-medium text-muted-foreground">Resumen</label>
                <button
                  type="button"
                  onClick={() => setResumen(buildResumenSugerido())}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg border transition-all bg-muted/50 hover:bg-muted hover:text-foreground/80"
                  style={{ color: BRAND_TEAL, borderColor: `${BRAND_TEAL}40` }}
                  title="Genera un texto sugerido basado en el diagnóstico, objetivos y foco terapéutico de la sesión"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Generar sugerencia
                </button>
              </div>
              <Textarea
                placeholder="Describe lo trabajado en la sesión… o usa 'Generar sugerencia' para un punto de partida."
                rows={4}
                value={resumen}
                onChange={e => setResumen(e.target.value)}
                className="bg-muted/50 resize-none text-sm leading-relaxed"
              />
              {resumen.trim().length > 0 && (
                <p className="text-[10px] text-muted-foreground/60 pl-0.5">
                  Texto editable — modifícalo libremente antes de guardar.
                </p>
              )}
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
              style={{ background: canSave ? `linear-gradient(90deg, #E07A5F 0%, #c85a44 100%)` : undefined }}
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

      {showCustomGoal && (
        <CustomGoalDialog
          onClose={() => setShowCustomGoal(false)}
          onCreated={(libraryGoal) => {
            setAdHocGoals(prev => {
              if (prev.find(g => g.id === libraryGoal.id)) return prev;
              return [...prev, libraryGoal];
            });
            setAdHocRows(prev => {
              if (prev[libraryGoal.id]) return prev;
              return { ...prev, [libraryGoal.id]: { checked: true, intentos: "", correctas: "", estado: "en proceso" } };
            });
            setShowCustomGoal(false);
          }}
        />
      )}
    </AppLayout>
  );
}
