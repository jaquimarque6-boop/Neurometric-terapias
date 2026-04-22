import { useState } from "react";
import { ChevronDown, ChevronUp, Brain } from "lucide-react";
import { DIAGNOSIS_AREAS } from "@/utils/diagnosis-map";

// ─── Guidance data per clinical area ─────────────────────────────────────────

interface AreaGuide {
  queEvaluar: string[];
  comoEvaluarlo: string[];
}

const AREA_GUIDANCE: Record<string, AreaGuide> = {
  "lenguaje": {
    queEvaluar: [
      "Comprensión oral",
      "Expresión verbal",
      "Vocabulario receptivo y expresivo",
      "Morfosintaxis",
    ],
    comoEvaluarlo: [
      "Denominación de imágenes",
      "Seguimiento de consignas",
      "Relato de lámina o cuento",
      "Completar frases",
    ],
  },
  "habla": {
    queEvaluar: [
      "Inventario fonético",
      "Procesos fonológicos",
      "Inteligibilidad",
      "Fluidez del habla",
    ],
    comoEvaluarlo: [
      "Repetición de palabras y pseudopalabras",
      "Denominación espontánea",
      "Habla conversacional",
      "Lectura en voz alta (si aplica)",
    ],
  },
  "pragmática": {
    queEvaluar: [
      "Contacto visual y atención conjunta",
      "Intención comunicativa",
      "Turnos en conversación",
      "Comprensión de situaciones sociales",
    ],
    comoEvaluarlo: [
      "Juego guiado y espontáneo",
      "Interacción con pares u observador",
      "Relato de situaciones cotidianas",
      "Tareas de perspectiva social",
    ],
  },
  "cognición": {
    queEvaluar: [
      "Atención sostenida y selectiva",
      "Memoria de trabajo",
      "Funciones ejecutivas básicas",
      "Velocidad de procesamiento",
    ],
    comoEvaluarlo: [
      "Tareas estructuradas con instrucción",
      "Actividades de secuenciación",
      "Juegos con reglas simples",
      "Observación conductual en sesión",
    ],
  },
  "lectoescritura": {
    queEvaluar: [
      "Conciencia fonológica",
      "Decodificación lectora",
      "Comprensión lectora",
      "Escritura y ortografía",
    ],
    comoEvaluarlo: [
      "Lectura de palabras y pseudopalabras",
      "Dictado y copia",
      "Preguntas sobre texto leído",
      "Segmentación silábica y fonémica",
    ],
  },
  "motricidad oral": {
    queEvaluar: [
      "Tono y movilidad orofacial",
      "Función deglutoria",
      "Praxias orales",
      "Postura y respiración",
    ],
    comoEvaluarlo: [
      "Observación de masticación y deglución",
      "Praxias linguales y labiales",
      "Protocolo miofuncional",
      "Evaluación postural en reposo",
    ],
  },
  "motricidad orofacial": {
    queEvaluar: [
      "Tono y movilidad orofacial",
      "Función deglutoria",
      "Praxias orales",
      "Postura y respiración",
    ],
    comoEvaluarlo: [
      "Observación de masticación y deglución",
      "Praxias linguales y labiales",
      "Protocolo miofuncional",
      "Evaluación postural en reposo",
    ],
  },
  "voz": {
    queEvaluar: [
      "Calidad vocal (soplo, aspereza, tensión)",
      "Tono e intensidad habitual",
      "Resonancia",
      "Hábitos de higiene vocal",
    ],
    comoEvaluarlo: [
      "Escucha y descripción de muestra vocal",
      "Tiempo máximo de fonación (TMF)",
      "Grabación de lectura espontánea",
      "Cuestionario de uso y abuso vocal",
    ],
  },
  "estimulación temprana": {
    queEvaluar: [
      "Hitos del desarrollo comunicativo",
      "Juego simbólico y funcional",
      "Comprensión preverbal",
      "Intención comunicativa temprana",
    ],
    comoEvaluarlo: [
      "Observación de juego libre",
      "Interacción con cuidador principal",
      "Respuesta a nombre y consignas simples",
      "Señalización y uso de gestos",
    ],
  },
};

// ─── Keyword-based fallback for free-text diagnoses ──────────────────────────

const KEYWORD_AREA_MAP: Array<{ keywords: string[]; area: string }> = [
  { keywords: ["tel", "tdl", "retraso del lenguaje", "disfasia", "léxico", "lenguaje"], area: "lenguaje" },
  { keywords: ["fonológico", "dislalia", "tsh", "trastornos de los sonidos", "apraxia", "disartria", "tartamudez", "fluidez", "articulación", "habla"], area: "habla" },
  { keywords: ["tea", "autismo", "pragmática", "social"], area: "pragmática" },
  { keywords: ["tdah", "atención", "memoria", "ejecutivas", "cognitivo"], area: "cognición" },
  { keywords: ["dislexia", "lectura", "escritura", "lectoescritura", "disgrafía"], area: "lectoescritura" },
  { keywords: ["deglución", "orofacial", "praxis oral", "tono oral"], area: "motricidad oral" },
  { keywords: ["voz", "disfonía", "nódulos", "fonación"], area: "voz" },
  { keywords: ["retraso madurativo", "retraso del desarrollo", "estimulación temprana", "bebé"], area: "estimulación temprana" },
];

function resolveAreas(diagnosis: string): string[] {
  if (!diagnosis) return [];

  // Exact match from DIAGNOSIS_AREAS map first
  const mapped = DIAGNOSIS_AREAS[diagnosis];
  if (mapped && mapped.length > 0) return mapped;

  // Keyword fallback for free-text / partial matches
  const lower = diagnosis.toLowerCase();
  const found: string[] = [];
  for (const { keywords, area } of KEYWORD_AREA_MAP) {
    if (keywords.some(k => lower.includes(k)) && !found.includes(area)) {
      found.push(area);
    }
  }
  return found;
}

// ─── Component ────────────────────────────────────────────────────────────────

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
    <div className="mt-3 rounded-xl border border-sky-200/80 bg-sky-50/60 overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-sky-100/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-sky-600 shrink-0" />
          <span className="text-xs font-bold text-sky-800 tracking-wide uppercase">
            Evaluación sugerida
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-600 border border-sky-200 font-medium">
            {diagnosis}
          </span>
        </div>
        {open
          ? <ChevronUp className="h-3.5 w-3.5 text-sky-500 shrink-0" />
          : <ChevronDown className="h-3.5 w-3.5 text-sky-500 shrink-0" />}
      </button>

      {open && (
        <div className={`border-t border-sky-100 ${compact ? "px-4 py-3 space-y-4" : "px-4 py-3 space-y-5"}`}>
          {guides.map(({ area, guide }) => (
            <div key={area}>
              {guides.length > 1 && (
                <p className="text-[10px] font-bold text-sky-500 uppercase tracking-widest mb-2">
                  {area}
                </p>
              )}
              <div className={compact ? "space-y-3" : "grid grid-cols-1 sm:grid-cols-2 gap-3"}>
                {/* Qué evaluar */}
                <div>
                  <p className="text-xs font-semibold text-sky-700 mb-1.5">Qué evaluar</p>
                  <ul className="space-y-1">
                    {guide.queEvaluar.map(item => (
                      <li key={item} className="flex items-start gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                        <span className="text-xs text-sky-900/80 leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Cómo evaluarlo */}
                <div>
                  <p className="text-xs font-semibold text-sky-700 mb-1.5">Cómo evaluarlo</p>
                  <ul className="space-y-1">
                    {guide.comoEvaluarlo.map(item => (
                      <li key={item} className="flex items-start gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                        <span className="text-xs text-sky-900/80 leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
