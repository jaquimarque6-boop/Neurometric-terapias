import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import {
  BookOpen, Search, Filter, ChevronDown, ChevronRight, ChevronLeft,
  Target, CheckCircle2, User, Sparkles, ClipboardList,
  AlertCircle, X, Check, Archive, Plus, Star, Lightbulb,
  BarChart2, Link2, SortAsc, Wand2, Stethoscope, Home,
  Trash2, Pencil, Loader2,
} from "lucide-react";
import {
  useListGoalLibrary,
  useAssignGoalToPatient,
  useListPatients,
  getListGoalsQueryKey,
  getListGoalLibraryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { GoalCodePreview } from "@/components/ui/goal-code-preview";
import { AREA_SUBAREAS } from "@/utils/goal-code-generator";
import { getGrupo, getGrupos, getSubareas } from "@/config/goal-taxonomy";

// ─── Constants ────────────────────────────────────────────────────────────────
const AREAS_CLINICAS = [
  "lenguaje",
  "habla",
  "pragmática",
  "motricidad orofacial",
  "lectoescritura",
  "cognición",
  "estimulación temprana",
];

const AREA_LABELS: Record<string, string> = {
  "lenguaje":              "Lenguaje",
  "habla":                 "Habla",
  "pragmática":            "Pragmática",
  "motricidad orofacial":  "Motricidad Orofacial",
  "lectoescritura":        "Lectoescritura",
  "cognición":             "Cognición",
  "estimulación temprana": "Estimulación Temprana",
};

const AREA_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "lenguaje":              { bg: "bg-rose-100",    text: "text-rose-700",    border: "border-rose-200"    },
  "habla":                 { bg: "bg-amber-100",   text: "text-amber-700",   border: "border-amber-200"   },
  "pragmática":            { bg: "bg-violet-100",  text: "text-violet-700",  border: "border-violet-200"  },
  "motricidad orofacial":  { bg: "bg-orange-100",  text: "text-orange-700",  border: "border-orange-200"  },
  "lectoescritura":        { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  "cognición":             { bg: "bg-yellow-100",  text: "text-yellow-800",  border: "border-yellow-200"  },
  "estimulación temprana": { bg: "bg-stone-200",   text: "text-stone-700",   border: "border-stone-300"   },
};

const NIVEL_COLORS: Record<string, string> = {
  "básico":      "bg-emerald-100 text-emerald-700 border-emerald-200",
  "intermedio":  "bg-amber-100 text-amber-700 border-amber-200",
  "avanzado":    "bg-red-100 text-red-700 border-red-200",
};

function getAreaColor(areaClinica?: string | null, area?: string | null) {
  const key = (areaClinica ?? area ?? "").toLowerCase();
  return AREA_COLORS[key] ?? { bg: "bg-muted", text: "text-foreground/70", border: "border-border" };
}

// ─── Bloques Clínicos ─────────────────────────────────────────────────────────
type BloqueClinico = {
  id: string;
  area: string;
  edad: string;
  patologia?: string;
  habilidades: string[];
  guia: string;
  actividades: string[];
};

const BLOQUES_CLINICOS: BloqueClinico[] = [
  {
    id: "comp-2-4",
    area: "comprensión",
    edad: "3–5",
    habilidades: [
      "Responde a su nombre",
      "Señala objetos al pedírselo",
      "Entiende 'dame' y 'no'",
      "Identifica partes del cuerpo",
      "Sigue instrucciones de un paso",
    ],
    guia: "Trabaja con rutinas conocidas y objetos cotidianos. Usa gestos naturales para apoyar la comprensión. Prioriza la consistencia en el ambiente.",
    actividades: ["Señalamiento", "Rutinas con objetos", "Juego simbólico simple"],
  },
  {
    id: "comp-4-6",
    area: "comprensión",
    edad: "3–5",
    habilidades: [
      "Comprende consignas de dos pasos",
      "Responde preguntas simples (¿qué? ¿dónde?)",
      "Identifica relaciones básicas (arriba/abajo)",
      "Sigue rutinas verbales sin apoyo visual",
      "Entiende conceptos de cantidad básica",
    ],
    guia: "Introduce apoyo pictográfico para aumentar comprensión. Usa narración de cuentos breves. Asegura que el input sea claro y a nivel del niño.",
    actividades: ["Selección múltiple", "Secuencias de 3 pasos", "Preguntas sobre cuento"],
  },
  {
    id: "comp-6-8",
    area: "comprensión",
    edad: "6–8",
    habilidades: [
      "Comprende narraciones cortas",
      "Responde preguntas ¿por qué? y ¿cómo?",
      "Entiende instrucciones complejas",
      "Identifica idea principal de un texto",
      "Usa inferencias básicas",
    ],
    guia: "Trabaja comprensión inferencial y monitoreo de comprensión. Usa textos adaptados al nivel lector. Introduce estrategias de anticipación.",
    actividades: ["Inferencias simples", "Mapa de historia", "Preguntas abiertas"],
  },
  {
    id: "leng-2-4",
    area: "lenguaje",
    edad: "3–5",
    habilidades: [
      "Usa palabras sueltas para comunicar",
      "Combina 2 palabras (mamá agua)",
      "Nombra objetos y personas cercanas",
      "Usa gestos comunicativos",
      "Imita palabras nuevas",
    ],
    guia: "Modelo de lenguaje natural sin presión de repetición. Amplía los enunciados del niño. Usa expansión y extensión como estrategias.",
    actividades: ["Expansión de enunciados", "Denominación con apoyo", "Juego con imágenes"],
  },
  {
    id: "leng-4-6",
    area: "lenguaje",
    edad: "3–5",
    habilidades: [
      "Forma oraciones de 4–5 palabras",
      "Narra experiencias recientes",
      "Usa plurales y artículos",
      "Hace preguntas para obtener info",
      "Describe objetos con 2 atributos",
    ],
    guia: "Trabaja morfosintaxis en contexto comunicativo real. Usa narración de láminas y cuentos. Evita corrección directa; usa recast.",
    actividades: ["Completar frases", "Narrar láminas", "Asociación imagen-palabra"],
  },
  {
    id: "leng-6-9",
    area: "lenguaje",
    edad: "6–8",
    habilidades: [
      "Usa oraciones complejas (coordinadas/subordinadas)",
      "Narra secuencias con conectores",
      "Describe imágenes con detalle",
      "Usa vocabulario variado y preciso",
      "Reformula cuando no se entiende",
    ],
    guia: "Enfócate en cohesión y coherencia del discurso. Introduce metalenguaje básico. Usa textos narrativos con estructura completa.",
    actividades: ["Evocación narrativa", "Mapas semánticos", "Completar textos"],
  },
  {
    id: "fono-3-5",
    area: "fonología",
    edad: "3–5",
    habilidades: [
      "Produce todas las vocales correctamente",
      "Simplifica grupos consonánticos",
      "Omite sílabas débiles en algunas palabras",
      "Es inteligible para familiares",
      "Comienza a corregir espontáneamente",
    ],
    guia: "Trabaja consciencia fonológica antes que articulación aislada. Prioriza pares mínimos y juego con rimas. No fuerce articulación sin conciencia.",
    actividades: ["Pares mínimos", "Rimas", "Discriminación auditiva"],
  },
  {
    id: "fono-5-7",
    area: "fonología",
    edad: "6–8",
    habilidades: [
      "Articula correctamente en palabras aisladas",
      "Reduce procesos fonológicos atípicos",
      "Produce grupos consonánticos simples",
      "Es inteligible para extraños",
      "Aplica autocorrección frecuente",
    ],
    guia: "Avanza hacia producción en frases y conversación espontánea. Trabaja transferencia de lo clínico al habla natural. Involucra a la familia.",
    actividades: ["Elegir la correcta", "Repetición en frases", "Dictado de imágenes"],
  },
  {
    id: "prag-3-5",
    area: "pragmática",
    edad: "3–5",
    habilidades: [
      "Inicia interacciones con pares",
      "Responde preguntas de adultos",
      "Mantiene contacto visual durante intercambio",
      "Usa el lenguaje para diferentes funciones",
      "Comparte atención sobre objetos/eventos",
    ],
    guia: "Trabaja en contexto de juego simbólico y rutinas sociales. Usa modelado de actos de habla. Incorpora turnos comunicativos naturales.",
    actividades: ["Turnos", "Juego guiado", "Intención comunicativa"],
  },
  {
    id: "cog-4-6",
    area: "cognición",
    edad: "3–5",
    habilidades: [
      "Secuencia 3 eventos narrativos",
      "Clasifica objetos por categoría",
      "Resuelve problemas simples con apoyo",
      "Comprende causa-efecto básico",
      "Mantiene atención en tarea por 10 min",
    ],
    guia: "Usa mediación verbal explícita. Trabaja estrategias de planificación paso a paso. Incorpora tareas concretas antes de abstracción.",
    actividades: ["Secuencias", "Clasificación", "Resolver consignas"],
  },
];

const BLOQUES_POR_AREA = BLOQUES_CLINICOS.reduce((acc, b) => {
  if (!acc[b.area]) acc[b.area] = [];
  acc[b.area].push(b);
  return acc;
}, {} as Record<string, BloqueClinico[]>);

const BLOQUE_AREA_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  comprensión: { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",  dot: "bg-amber-400"   },
  lenguaje:    { bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200",   dot: "bg-rose-400"    },
  fonología:   { bg: "bg-amber-50",   text: "text-amber-800",   border: "border-amber-200",  dot: "bg-amber-500"   },
  pragmática:  { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200",dot: "bg-emerald-400" },
  cognición:   { bg: "bg-stone-100",  text: "text-stone-700",   border: "border-stone-200",  dot: "bg-stone-400"   },
};

const NIVEL_ORDER: Record<string, number> = { "básico": 0, "basico": 0, "intermedio": 1, "avanzado": 2 };

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GoalLibrary() {
  const { data: library = [], isLoading } = useListGoalLibrary();
  const { data: patients = [] } = useListPatients();

  const [search, setSearch]               = useState("");
  const [areaFilter, setAreaFilter]       = useState("all");
  const [subareaFilter, setSubareaFilter] = useState("all");
  const [nivelFilter, setNivelFilter]     = useState("all");
  const [franjaFilter, setFranjaFilter]   = useState("all");
  const [estadoFilter, setEstadoFilter]   = useState("activo");
  const [sortBy, setSortBy]               = useState<"area" | "codigo">("area");
  const [expandedId, setExpandedId]       = useState<number | null>(null);
  const [assignGoal, setAssignGoal]       = useState<any | null>(null);
  const [showNewGoal, setShowNewGoal]     = useState(false);
  const [viewMode, setViewMode]           = useState<"objetivos" | "bloques">("objetivos");
  const [expandedBloque, setExpandedBloque] = useState<string | null>(null);

  // ── Drill-down navigation state ────────────────────────────────────────────
  const [drillGrupo, setDrillGrupo]       = useState<string | null>(null);
  const [drillSubarea, setDrillSubarea]   = useState<string | null>(null);

  const queryClient = useQueryClient();
  const lib = library as any[];

  const subareas = useMemo(() => {
    const src = areaFilter !== "all" ? lib.filter((g: any) => (g.areaClinica ?? g.area) === areaFilter) : lib;
    return ["all", ...Array.from(new Set(src.map((g: any) => g.subarea).filter(Boolean))).sort() as string[]];
  }, [lib, areaFilter]);

  const filtered = useMemo(() => lib.filter((g: any) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (g.nombreObjetivo ?? "").toLowerCase().includes(q) ||
      (g.idObjetivo ?? "").toLowerCase().includes(q) ||
      (g.area ?? "").toLowerCase().includes(q) ||
      (g.areaClinica ?? "").toLowerCase().includes(q) ||
      (g.subarea ?? "").toLowerCase().includes(q) ||
      (g.habilidadesRelacionadas ?? "").toLowerCase().includes(q) ||
      (g.definicionOperativa ?? "").toLowerCase().includes(q);
    const matchArea    = areaFilter === "all"    || (g.areaClinica ?? g.area) === areaFilter;
    const matchSubarea = subareaFilter === "all" || (g.subarea ?? "") === subareaFilter;
    const matchNivel   = nivelFilter === "all"   || g.nivelDificultad === nivelFilter;
    const matchFranja  = franjaFilter === "all"  || g.franjaEtaria === franjaFilter;
    const matchEstado  = estadoFilter === "all"  || (g.estadoBanco ?? "activo") === estadoFilter;
    return matchSearch && matchArea && matchSubarea && matchNivel && matchFranja && matchEstado;
  }), [lib, search, areaFilter, subareaFilter, nivelFilter, franjaFilter, estadoFilter]);

  // Sort and group
  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sortBy === "codigo") {
      copy.sort((a: any, b: any) => (a.idObjetivo ?? "").localeCompare(b.idObjetivo ?? ""));
    } else {
      copy.sort((a: any, b: any) => {
        const franjaA = a.franjaEtariaMin ?? 999;
        const franjaB = b.franjaEtariaMin ?? 999;
        if (franjaA !== franjaB) return franjaA - franjaB;
        const areaA = (a.areaClinica ?? a.area ?? "").toLowerCase();
        const areaB = (b.areaClinica ?? b.area ?? "").toLowerCase();
        if (areaA !== areaB) return areaA.localeCompare(areaB);
        const nivelA = NIVEL_ORDER[a.nivelDificultad?.toLowerCase() ?? ""] ?? 0;
        const nivelB = NIVEL_ORDER[b.nivelDificultad?.toLowerCase() ?? ""] ?? 0;
        if (nivelA !== nivelB) return nivelA - nivelB;
        return (a.idObjetivo ?? "").localeCompare(b.idObjetivo ?? "");
      });
    }
    return copy;
  }, [filtered, sortBy]);

  // Group by areaClinica (preserves sort order within groups)
  const grouped = useMemo(() => sorted.reduce((acc: Record<string, any[]>, g: any) => {
    const key = g.areaClinica ?? g.area ?? "Otra área";
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {}), [sorted]);

  const activeFilters = [areaFilter !== "all", subareaFilter !== "all", nivelFilter !== "all", franjaFilter !== "all", estadoFilter !== "activo"].filter(Boolean).length;

  // Search mode: show flat results when search or non-default filters are active
  const isSearchMode = !!(search.trim() || subareaFilter !== "all" || nivelFilter !== "all" || franjaFilter !== "all" || estadoFilter !== "activo");

  // ── Browse-mode derived data ───────────────────────────────────────────────
  // Goals for current area (used to count by grupo/subarea)
  const areaGoals = useMemo(
    () => areaFilter === "all" ? [] : lib.filter((g: any) => (g.areaClinica ?? g.area) === areaFilter && (g.estadoBanco ?? "activo") === "activo"),
    [lib, areaFilter],
  );

  // Grupo cards for selected area
  const grupoCards = useMemo(() => {
    if (areaFilter === "all") return [];
    const grupos = getGrupos(areaFilter);
    const otrasGoals = areaGoals.filter((g: any) => getGrupo(areaFilter, g.subarea) === "Otras");
    const cards = grupos
      .map(g => ({
        name: g,
        count: areaGoals.filter((gl: any) => getGrupo(areaFilter, gl.subarea) === g).length,
        subareas: getSubareas(areaFilter, g).filter(s =>
          areaGoals.some((gl: any) => gl.subarea === s)
        ),
      }))
      .filter(c => c.count > 0);
    if (otrasGoals.length > 0) cards.push({ name: "Otras", count: otrasGoals.length, subareas: [] });
    return cards;
  }, [areaGoals, areaFilter]);

  // Subarea cards for selected grupo
  const subareaCards = useMemo(() => {
    if (!drillGrupo) return [];
    const subs = drillGrupo === "Otras"
      ? [...new Set(areaGoals.filter((g: any) => getGrupo(areaFilter, g.subarea) === "Otras").map((g: any) => g.subarea ?? "(sin subárea)"))]
      : getSubareas(areaFilter, drillGrupo).filter(s => areaGoals.some((g: any) => g.subarea === s));
    return subs.map(s => ({
      name: s,
      count: areaGoals.filter((g: any) => (g.subarea ?? "(sin subárea)") === s).length,
    })).filter(c => c.count > 0);
  }, [areaGoals, areaFilter, drillGrupo]);

  // Goals at drill-down leaf level
  const drillGoals = useMemo(() => {
    if (!drillSubarea) return [];
    return areaGoals.filter((g: any) => (g.subarea ?? "(sin subárea)") === drillSubarea);
  }, [areaGoals, drillSubarea]);

  // Stats
  const stats = useMemo(() => {
    const total = lib.length;
    const porArea = AREAS_CLINICAS.map(a => ({
      area: a,
      count: lib.filter((g: any) => (g.areaClinica ?? g.area) === a).length,
    })).filter(s => s.count > 0);
    return { total, porArea };
  }, [lib]);

  const clearFilters = () => {
    setAreaFilter("all");
    setSubareaFilter("all");
    setNivelFilter("all");
    setFranjaFilter("all");
    setEstadoFilter("activo");
    setSearch("");
    setDrillGrupo(null);
    setDrillSubarea(null);
  };

  const selectArea = (area: string) => {
    setAreaFilter(area);
    setDrillGrupo(null);
    setDrillSubarea(null);
    setSubareaFilter("all");
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">

        {/* Header */}
        <div className="bg-card border border-border/50 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
            <div>
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Volver al menú principal
              </button>
              <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                Banco de Objetivos Terapéuticos
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {stats.total} objetivos clínicos en {stats.porArea.length} áreas
              </p>
            </div>
            <Button
              onClick={() => setShowNewGoal(true)}
              className="bg-primary hover:bg-primary/90 text-white shrink-0 gap-1.5"
            >
              <Plus className="h-4 w-4" /> Nuevo objetivo
            </Button>
          </div>

          {/* View mode toggle */}
          <div className="flex gap-1 p-1 rounded-xl bg-muted mb-5 w-fit">
            <button
              onClick={() => setViewMode("objetivos")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-[0.97] ${
                viewMode === "objetivos"
                  ? "bg-card text-foreground shadow-sm font-semibold"
                  : "text-foreground/60 hover:bg-muted/70 hover:text-foreground/85"
              }`}
            >
              Objetivos
            </button>
            <button
              onClick={() => setViewMode("bloques")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-[0.97] ${
                viewMode === "bloques"
                  ? "bg-card text-foreground shadow-sm font-semibold"
                  : "text-foreground/60 hover:bg-muted/70 hover:text-foreground/85"
              }`}
            >
              Vista clínica
            </button>
          </div>

          {/* Area summary chips — only in objetivos mode */}
          {viewMode === "objetivos" && <div className="flex flex-wrap gap-2 mb-5">
            {stats.porArea.map(s => {
              const ac = getAreaColor(s.area);
              const isActive = areaFilter === s.area;
              return (
                <button
                  key={s.area}
                  onClick={() => isActive ? clearFilters() : selectArea(s.area)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    isActive ? `${ac.bg} ${ac.text} ${ac.border} ring-2 ring-offset-1 ${ac.border}` : `${ac.bg} ${ac.text} ${ac.border} opacity-70 hover:opacity-100`
                  }`}
                >
                  {AREA_LABELS[s.area] ?? s.area}
                  <span className={`font-bold ${ac.text}`}>{s.count}</span>
                </button>
              );
            })}
          </div>}

          {/* Search + filters — only in objetivos mode */}
          {viewMode === "objetivos" && <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, área, código o descripción..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-muted/50"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground/70">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {subareas.length > 2 && (
              <Select value={subareaFilter} onValueChange={setSubareaFilter}>
                <SelectTrigger className="w-full sm:w-44 bg-muted/50">
                  <SelectValue placeholder="Subárea" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las subáreas</SelectItem>
                  {subareas.filter(s => s !== "all").map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={nivelFilter} onValueChange={setNivelFilter}>
              <SelectTrigger className="w-full sm:w-44 bg-muted/50">
                <BarChart2 className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Dificultad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los niveles</SelectItem>
                <SelectItem value="básico">Básico</SelectItem>
                <SelectItem value="intermedio">Intermedio</SelectItem>
                <SelectItem value="avanzado">Avanzado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={franjaFilter} onValueChange={setFranjaFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-muted/50">
                <SelectValue placeholder="Franja etaria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las franjas</SelectItem>
                {["0-2","3-5","6-8","9-12","13-16","17-20"].map(f => (
                  <SelectItem key={f} value={f}>{f} años</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="archivado">Archivados</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setSortBy(s => s === "area" ? "codigo" : "area")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all active:scale-[0.97] ${
                  sortBy === "codigo"
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-muted/60 text-foreground/70 border-border hover:bg-muted hover:text-foreground/85"
                }`}
                title="Ordenar por código"
              >
                <SortAsc className="h-3.5 w-3.5" />
                Por {sortBy === "codigo" ? "código" : "área"}
              </button>

              {activeFilters > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground/80 whitespace-nowrap">
                  Limpiar
                  <Badge className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center bg-muted text-foreground/70 hover:bg-muted text-xs">{activeFilters}</Badge>
                </Button>
              )}
            </div>
          </div>}
        </div>

        {/* ── Breadcrumb — only in objetivos mode ──────────────────── */}
        {viewMode === "objetivos" && (areaFilter !== "all") && (
          <div className="flex items-center gap-1 text-sm flex-wrap bg-card border border-border/50 rounded-xl px-4 py-2.5 shadow-sm">
            <button
              onClick={clearFilters}
              className="text-primary/70 hover:text-primary transition-colors font-medium"
            >
              Banco
            </button>
            <span className="text-muted-foreground/40 mx-0.5">/</span>
            <button
              onClick={() => { setDrillGrupo(null); setDrillSubarea(null); setSubareaFilter("all"); }}
              className={`font-medium transition-colors ${!drillGrupo ? "text-foreground" : "text-primary/70 hover:text-primary"}`}
            >
              {AREA_LABELS[areaFilter] ?? areaFilter}
            </button>
            {drillGrupo && (
              <>
                <span className="text-muted-foreground/40 mx-0.5">/</span>
                <button
                  onClick={() => { setDrillSubarea(null); setSubareaFilter("all"); }}
                  className={`font-medium transition-colors ${!drillSubarea ? "text-foreground" : "text-primary/70 hover:text-primary"}`}
                >
                  {drillGrupo}
                </button>
              </>
            )}
            {drillSubarea && (
              <>
                <span className="text-muted-foreground/40 mx-0.5">/</span>
                <span className="font-semibold text-foreground">{drillSubarea}</span>
              </>
            )}
          </div>
        )}

        {/* ── Vista Clínica (bloques) ───────────────────────────────── */}
        {viewMode === "bloques" && (
          <div className="space-y-8">
            {Object.entries(BLOQUES_POR_AREA).map(([area, bloques]) => {
              const ac = BLOQUE_AREA_COLORS[area] ?? { bg: "bg-muted/50", text: "text-foreground/80", border: "border-border", dot: "bg-muted-foreground/50" };
              return (
                <div key={area}>
                  {/* Area header */}
                  <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl mb-3 border ${ac.bg} ${ac.border}`}>
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${ac.dot}`} />
                    <h2 className={`text-sm font-bold capitalize ${ac.text}`}>{area}</h2>
                    <span className={`ml-auto text-xs font-medium ${ac.text} opacity-60`}>{bloques.length} bloque{bloques.length !== 1 ? "s" : ""}</span>
                  </div>

                  {/* Bloque cards */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {bloques.map(bloque => {
                      const isOpen = expandedBloque === bloque.id;
                      return (
                        <div
                          key={bloque.id}
                          className={`bg-card rounded-2xl border shadow-sm overflow-hidden transition-all ${isOpen ? `ring-2 ring-offset-1 ${ac.border}` : "hover:shadow-md"}`}
                        >
                          {/* Card header — clickable */}
                          <button
                            className="w-full text-left px-5 py-4"
                            onClick={() => setExpandedBloque(isOpen ? null : bloque.id)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mb-2 ${ac.bg} ${ac.text} border ${ac.border}`}>
                                  {bloque.edad} años
                                </span>
                                <p className="text-sm font-semibold text-foreground capitalize leading-snug">{area}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{bloque.habilidades.length} habilidades esperadas</p>
                              </div>
                              <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground/40 mt-1 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                            </div>
                          </button>

                          {/* Expanded panel */}
                          {isOpen && (
                            <div className="border-t border-border/50 text-xs">

                              {/* Habilidades */}
                              <div className="px-5 py-4 space-y-2">
                                <p className="font-semibold text-foreground/70 mb-2 flex items-center gap-1.5">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                  Habilidades esperadas
                                </p>
                                <ul className="space-y-1.5">
                                  {bloque.habilidades.map((h, i) => (
                                    <li key={i} className="flex gap-2 text-foreground/70">
                                      <span className="shrink-0 text-muted-foreground/40 mt-0.5">·</span>
                                      <span className="leading-snug">{h}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Guía clínica */}
                              <div className="px-5 py-4 bg-amber-50/50 border-t border-amber-100/60 space-y-1.5">
                                <p className="font-semibold text-amber-800 flex items-center gap-1.5">
                                  <Lightbulb className="h-3.5 w-3.5" />
                                  Guía clínica
                                </p>
                                <p className="text-amber-900/75 leading-relaxed">{bloque.guia}</p>
                              </div>

                              {/* Actividades sugeridas */}
                              <div className="px-5 py-4 bg-amber-50/40 border-t border-amber-100/60 space-y-2">
                                <p className="font-semibold text-amber-800 flex items-center gap-1.5">
                                  <Sparkles className="h-3.5 w-3.5" />
                                  Actividades sugeridas
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {bloque.actividades.map(act => (
                                    <span
                                      key={act}
                                      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-card border border-amber-200 text-amber-800"
                                    >
                                      {act}
                                    </span>
                                  ))}
                                </div>
                              </div>

                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Result count (search mode) — only in objetivos mode ───── */}
        {viewMode === "objetivos" && isSearchMode && (
          <p className="text-sm text-muted-foreground -mt-2 px-1">
            Mostrando <span className="font-semibold text-foreground/80">{filtered.length}</span> objetivo{filtered.length !== 1 ? "s" : ""}
            {search && <> para <span className="italic">"{search}"</span></>}
          </p>
        )}

        {/* ── Main display ──────────────────────────────────────────── */}
        {viewMode === "objetivos" && (isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>

        ) : isSearchMode ? (
          /* ── Search/filter mode: flat grouped results ── */
          Object.keys(grouped).length === 0 ? (
            <div className="py-20 text-center bg-card rounded-2xl border border-dashed border-border">
              <BookOpen className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="font-medium text-foreground/70">No se encontraron objetivos</p>
              <p className="text-muted-foreground text-sm mt-1">Intenta ajustar los filtros de búsqueda.</p>
            </div>
          ) : (
          <div className="space-y-6">
            {AREAS_CLINICAS.filter(a => grouped[a]).map(areaKey => {
              const goals = grouped[areaKey];
              const ac = getAreaColor(areaKey);
              return (
                <div key={areaKey} className="space-y-2">
                  <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${ac.bg} border ${ac.border}`}>
                    <span className={`text-sm font-bold ${ac.text}`}>{AREA_LABELS[areaKey] ?? areaKey}</span>
                    <Badge variant="outline" className={`ml-auto text-xs ${ac.text} ${ac.border} bg-white/60`}>
                      {goals.length} objetivo{goals.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  <div className="space-y-2 pl-2">
                    {goals.map((goal: any) => {
                      const expanded = expandedId === goal.id;
                      const archived = (goal.estadoBanco ?? "activo") === "archivado";
                      return (
                        <Card
                          key={goal.id}
                          className={`border-border/50 shadow-sm overflow-hidden transition-all duration-200 ${
                            expanded ? "ring-1 ring-primary/20" : "hover:shadow-md"
                          } ${archived ? "opacity-60" : ""}`}
                        >
                          <div
                            className="w-full text-left cursor-pointer"
                            onClick={() => setExpandedId(expanded ? null : goal.id)}
                          >
                            <div className="p-4 flex items-start gap-4">
                              <div className={`shrink-0 text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg ${ac.bg} ${ac.text} border ${ac.border} mt-0.5 whitespace-nowrap`}>
                                {goal.idObjetivo}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="font-semibold text-foreground leading-snug">{goal.nombreObjetivo}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                      {goal.subarea && (
                                        <span className="text-xs text-muted-foreground font-medium">{goal.subarea}</span>
                                      )}
                                      {goal.franjaEtaria && (
                                        <>
                                          <span className="text-xs text-muted-foreground/40">·</span>
                                          <span className="text-xs text-muted-foreground">{goal.franjaEtaria} años</span>
                                        </>
                                      )}
                                      {goal.nivelDificultad && (
                                        <Badge variant="outline" className={`text-xs border ${NIVEL_COLORS[goal.nivelDificultad] ?? "bg-muted text-muted-foreground"}`}>
                                          {goal.nivelDificultad.charAt(0).toUpperCase() + goal.nivelDificultad.slice(1)}
                                        </Badge>
                                      )}
                                      {goal.isCustom && (
                                        <Badge variant="outline" className="text-xs bg-violet-50 text-violet-700 border-violet-200">
                                          <Sparkles className="h-3 w-3 mr-1" /> Personalizado
                                        </Badge>
                                      )}
                                      {archived && (
                                        <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border">
                                          <Archive className="h-3 w-3 mr-1" /> Archivado
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {!archived && (
                                      <Button
                                        size="sm"
                                        onClick={e => { e.stopPropagation(); setAssignGoal(goal); }}
                                        className="h-8 text-xs bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/20"
                                      >
                                        <User className="h-3.5 w-3.5 mr-1.5" />
                                        Asignar
                                      </Button>
                                    )}
                                    {expanded
                                      ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                      : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {expanded && (
                            <div className="border-t border-border/50 bg-muted/40">
                              <div className="p-5 space-y-5">

                                {/* ── Definición operativa ────────────────── */}
                                {goal.definicionOperativa && (
                                  <DetailSection
                                    icon={<ClipboardList className="h-4 w-4 text-primary" />}
                                    title="Definición Operativa"
                                    content={goal.definicionOperativa}
                                  />
                                )}

                                {/* ── Indicador de logro + Intentos + Meta ── */}
                                {(goal.indicadorTipo || goal.intentosSugeridos || goal.metaPorcentaje) && (
                                  <div className="flex flex-wrap gap-2">
                                    {goal.indicadorTipo && (
                                      <div className="bg-card border border-rose-200 rounded-lg px-3 py-2 text-xs flex items-center gap-1.5">
                                        <Target className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                                        <span className="text-muted-foreground">Indicador de logro:</span>
                                        <span className="font-semibold text-foreground/80">{goal.indicadorTipo}</span>
                                      </div>
                                    )}
                                    {goal.intentosSugeridos && (
                                      <div className="bg-card border border-amber-200 rounded-lg px-3 py-2 text-xs flex items-center gap-1.5">
                                        <BarChart2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                        <span className="text-muted-foreground">Intentos sugeridos:</span>
                                        <span className="font-semibold text-foreground/80">{goal.intentosSugeridos}</span>
                                      </div>
                                    )}
                                    {goal.metaPorcentaje && (
                                      <div className="bg-card border border-emerald-200 rounded-lg px-3 py-2 text-xs flex items-center gap-1.5">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                        <span className="text-muted-foreground">Meta:</span>
                                        <span className="font-semibold text-foreground/80">{goal.metaPorcentaje}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* ── Progresión de niveles ───────────────── */}
                                {(goal.nivel1Descripcion || goal.nivel2Descripcion || goal.nivel3Descripcion) && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-3">
                                      <SortAsc className="h-4 w-4 text-muted-foreground" />
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Progresión de niveles</p>
                                    </div>
                                    <div className="grid md:grid-cols-3 gap-3">
                                      {goal.nivel1Descripcion && (
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Nivel 1 · Básico</p>
                                          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{goal.nivel1Descripcion}</p>
                                        </div>
                                      )}
                                      {goal.nivel2Descripcion && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">Nivel 2 · Intermedio</p>
                                          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{goal.nivel2Descripcion}</p>
                                        </div>
                                      )}
                                      {goal.nivel3Descripcion && (
                                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                                          <p className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-2">Nivel 3 · Generalización</p>
                                          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{goal.nivel3Descripcion}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* ── Marco conceptual ────────────────────── */}
                                {goal.marcoConceptual && (
                                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <BookOpen className="h-4 w-4 text-amber-700" />
                                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-widest">Marco Conceptual</p>
                                    </div>
                                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{goal.marcoConceptual}</p>
                                  </div>
                                )}

                                {/* ── Actividades + prerrequisitos ────────── */}
                                <div className="grid md:grid-cols-2 gap-4">
                                  {goal.actividadesClinicas && (
                                    <DetailSection
                                      icon={<Stethoscope className="h-4 w-4 text-amber-500" />}
                                      title="Actividades Clínicas"
                                      content={goal.actividadesClinicas}
                                    />
                                  )}
                                  {goal.actividadesFamilia && (
                                    <DetailSection
                                      icon={<Home className="h-4 w-4 text-emerald-500" />}
                                      title="Actividades para el Hogar"
                                      content={goal.actividadesFamilia}
                                    />
                                  )}
                                  {goal.habilidadesRelacionadas && (
                                    <DetailSection
                                      icon={<Link2 className="h-4 w-4 text-rose-500" />}
                                      title="Habilidades Relacionadas"
                                      content={goal.habilidadesRelacionadas}
                                    />
                                  )}
                                  {goal.prerequisitos && (
                                    <DetailSection
                                      icon={<ChevronRight className="h-4 w-4 text-amber-600" />}
                                      title="Prerrequisitos"
                                      content={goal.prerequisitos}
                                    />
                                  )}
                                  {goal.recomendacionClinica && (
                                    <div className="md:col-span-2">
                                      <DetailSection
                                        icon={<Target className="h-4 w-4 text-rose-500" />}
                                        title="Recomendación Clínica"
                                        content={goal.recomendacionClinica}
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* ── Panel de actividades adicionales ────── */}
                                <GoalActivitiesPanel
                                  goalLibraryId={goal.id}
                                  goalArea={goal.area}
                                  goalNombre={goal.nombreObjetivo}
                                />
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          )

        ) : (areaFilter === "all") ? (
          /* ── Browse Level 0: Area selector cards ── */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.porArea.map(s => {
              const ac = getAreaColor(s.area);
              return (
                <button
                  key={s.area}
                  onClick={() => selectArea(s.area)}
                  className={`text-left p-4 rounded-xl border-2 transition-all hover:shadow-md group ${ac.bg} ${ac.border}`}
                >
                  <p className={`font-bold text-sm leading-tight mb-1 ${ac.text}`}>
                    {AREA_LABELS[s.area] ?? s.area}
                  </p>
                  <p className={`text-xs font-medium opacity-70 ${ac.text}`}>
                    {s.count} objetivo{s.count !== 1 ? "s" : ""}
                  </p>
                  <div className="flex justify-end mt-3">
                    <ChevronRight className={`h-4 w-4 ${ac.text} opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all`} />
                  </div>
                </button>
              );
            })}
          </div>

        ) : (!drillGrupo) ? (
          /* ── Browse Level 1: Grupo cards for selected area ── */
          grupoCards.length === 0 ? (
            <div className="py-16 text-center bg-card rounded-2xl border border-dashed border-border">
              <BookOpen className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No hay objetivos en esta área</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {grupoCards.map(g => {
                const ac = getAreaColor(areaFilter);
                return (
                  <button
                    key={g.name}
                    onClick={() => setDrillGrupo(g.name)}
                    className={`text-left px-5 py-4 rounded-xl border-2 transition-all hover:shadow-md active:scale-[0.98] group bg-card ${ac.border}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-base leading-snug ${ac.text}`}>{g.name}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {g.count} objetivo{g.count !== 1 ? "s" : ""} · {g.subareas.length > 0 ? g.subareas.length : "?"} subcategoría{g.subareas.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className={`shrink-0 w-9 h-9 rounded-full ${ac.bg} flex items-center justify-center`}>
                        <ChevronRight className={`h-4 w-4 ${ac.text} group-hover:translate-x-0.5 transition-transform`} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )

        ) : (
          /* ── Browse Level 2: Subcategoría cards for selected grupo ── */
          subareaCards.length === 0 ? (
            <div className="py-16 text-center bg-card rounded-2xl border border-dashed border-border">
              <BookOpen className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No hay objetivos en este grupo</p>
            </div>
          ) : (
            <div className="space-y-2">
              {subareaCards.map(sc => {
                const ac = getAreaColor(areaFilter);
                return (
                  <button
                    key={sc.name}
                    onClick={() => { setDrillSubarea(sc.name); setSubareaFilter(sc.name); }}
                    className={`w-full flex items-center justify-between gap-4 px-5 py-4 rounded-xl border-2 bg-card transition-all hover:shadow-md active:scale-[0.99] group ${ac.border}`}
                  >
                    <span className={`font-semibold text-base ${ac.text}`}>{sc.name}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${ac.bg} ${ac.text}`}>
                        {sc.count}
                      </span>
                      <ChevronRight className={`h-5 w-5 ${ac.text} opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all`} />
                    </div>
                  </button>
                );
              })}
            </div>
          )
        ))}
      </div>

      {assignGoal && (
        <AssignGoalDialog
          goal={assignGoal}
          patients={patients as any[]}
          onClose={() => setAssignGoal(null)}
        />
      )}

      {showNewGoal && (
        <NewLibraryGoalDialog
          onClose={() => setShowNewGoal(false)}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: getListGoalLibraryQueryKey() });
            setShowNewGoal(false);
          }}
        />
      )}
    </AppLayout>
  );
}

function DetailSection({ icon, title, content }: { icon: React.ReactNode; title: string; content: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">{title}</p>
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{content}</p>
    </div>
  );
}

// ─── Goal Activities Panel ─────────────────────────────────────────────────────

type Actividad = {
  id: number;
  titulo: string;
  descripcion: string | null;
  tipo: string;
  area: string | null;
  recursos: string | null;
  goalLibraryId: number | null;
  createdAt: string;
};

type ActForm = { titulo: string; descripcion: string; recursos: string };
const emptyForm = (): ActForm => ({ titulo: "", descripcion: "", recursos: "" });

function GoalActivitiesPanel({
  goalLibraryId,
  goalArea,
  goalNombre,
}: {
  goalLibraryId: number;
  goalArea: string;
  goalNombre: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addingType, setAddingType] = useState<"clinica" | "familia" | null>(null);
  const [addForm, setAddForm] = useState<ActForm>(emptyForm());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ActForm>(emptyForm());

  const qKey = ["goal-activities", goalLibraryId];

  const { data: activities = [], isLoading } = useQuery<Actividad[]>({
    queryKey: qKey,
    queryFn: async () => {
      const res = await fetch(`/api/actividades?goalLibraryId=${goalLibraryId}`);
      if (!res.ok) throw new Error("Error al cargar actividades");
      return res.json();
    },
  });

  const clinicActs = activities.filter(a => a.tipo === "clinica");
  const familyActs  = activities.filter(a => a.tipo === "familia");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qKey });

  const createMut = useMutation({
    mutationFn: async (tipo: "clinica" | "familia") => {
      const res = await fetch("/api/actividades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: addForm.titulo.trim(),
          descripcion: addForm.descripcion.trim() || null,
          recursos: addForm.recursos.trim() || null,
          tipo,
          area: goalArea,
          goalLibraryId,
          objetivoNombre: goalNombre,
        }),
      });
      if (!res.ok) throw new Error("Error al crear actividad");
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setAddingType(null);
      setAddForm(emptyForm());
      toast({ title: "Actividad agregada" });
    },
    onError: () => toast({ title: "Error al agregar actividad", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/actividades/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: editForm.titulo.trim(),
          descripcion: editForm.descripcion.trim() || null,
          recursos: editForm.recursos.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setEditingId(null);
      toast({ title: "Actividad actualizada" });
    },
    onError: () => toast({ title: "Error al actualizar", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/actividades/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Actividad eliminada" });
    },
    onError: () => toast({ title: "Error al eliminar", variant: "destructive" }),
  });

  const startEdit = (act: Actividad) => {
    setEditingId(act.id);
    setEditForm({ titulo: act.titulo, descripcion: act.descripcion ?? "", recursos: act.recursos ?? "" });
    setAddingType(null);
  };

  const startAdd = (tipo: "clinica" | "familia") => {
    setAddingType(tipo);
    setAddForm(emptyForm());
    setEditingId(null);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-5">
      <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wide flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-500" />
        Actividades terapéuticas
      </p>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {/* ─── Clínicas ─────────────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Stethoscope className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">Sesión clínica</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 px-2 text-xs text-primary hover:bg-primary/10"
                onClick={() => addingType === "clinica" ? setAddingType(null) : startAdd("clinica")}
              >
                <Plus className="h-3 w-3 mr-1" />
                Agregar
              </Button>
            </div>

            {clinicActs.length === 0 && addingType !== "clinica" && (
              <p className="text-xs text-muted-foreground italic py-2 pl-1">Sin actividades clínicas aún.</p>
            )}

            {clinicActs.map(act => (
              <ActivityItem
                key={act.id}
                act={act}
                editing={editingId === act.id}
                editForm={editForm}
                setEditForm={setEditForm}
                onEdit={() => startEdit(act)}
                onSave={() => updateMut.mutate(act.id)}
                onCancel={() => setEditingId(null)}
                onDelete={() => deleteMut.mutate(act.id)}
                saving={updateMut.isPending}
                deleting={deleteMut.isPending}
              />
            ))}

            {addingType === "clinica" && (
              <ActivityAddForm
                form={addForm}
                setForm={setAddForm}
                onSave={() => createMut.mutate("clinica")}
                onCancel={() => setAddingType(null)}
                saving={createMut.isPending}
              />
            )}
          </div>

          {/* ─── Familia ──────────────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Home className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Práctica en casa</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 px-2 text-xs text-emerald-700 hover:bg-emerald-50"
                onClick={() => addingType === "familia" ? setAddingType(null) : startAdd("familia")}
              >
                <Plus className="h-3 w-3 mr-1" />
                Agregar
              </Button>
            </div>

            {familyActs.length === 0 && addingType !== "familia" && (
              <p className="text-xs text-muted-foreground italic py-2 pl-1">Sin actividades para el hogar aún.</p>
            )}

            {familyActs.map(act => (
              <ActivityItem
                key={act.id}
                act={act}
                editing={editingId === act.id}
                editForm={editForm}
                setEditForm={setEditForm}
                onEdit={() => startEdit(act)}
                onSave={() => updateMut.mutate(act.id)}
                onCancel={() => setEditingId(null)}
                onDelete={() => deleteMut.mutate(act.id)}
                saving={updateMut.isPending}
                deleting={deleteMut.isPending}
              />
            ))}

            {addingType === "familia" && (
              <ActivityAddForm
                form={addForm}
                setForm={setAddForm}
                onSave={() => createMut.mutate("familia")}
                onCancel={() => setAddingType(null)}
                saving={createMut.isPending}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityItem({
  act, editing, editForm, setEditForm, onEdit, onSave, onCancel, onDelete, saving, deleting,
}: {
  act: Actividad;
  editing: boolean;
  editForm: ActForm;
  setEditForm: (f: ActForm) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  saving: boolean;
  deleting: boolean;
}) {
  if (editing) {
    return (
      <ActivityAddForm
        form={editForm}
        setForm={setEditForm}
        onSave={onSave}
        onCancel={onCancel}
        saving={saving}
        isEdit
      />
    );
  }
  return (
    <div className="group flex items-start gap-2 bg-muted/50 border border-border/50 rounded-lg px-3 py-2.5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug">{act.titulo}</p>
        {act.descripcion && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{act.descripcion}</p>
        )}
        {act.recursos && (
          <p className="text-xs text-muted-foreground mt-0.5 italic">Recursos: {act.recursos}</p>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
        <button
          onClick={onEdit}
          className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          title="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="p-1 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition-colors"
          title="Eliminar"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

function ActivityAddForm({
  form, setForm, onSave, onCancel, saving, isEdit = false,
}: {
  form: ActForm;
  setForm: (f: ActForm) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isEdit?: boolean;
}) {
  const canSave = form.titulo.trim().length > 0;
  return (
    <div className="bg-card border border-primary/30 rounded-lg p-3 space-y-2 shadow-sm">
      <Input
        value={form.titulo}
        onChange={e => setForm({ ...form, titulo: e.target.value })}
        placeholder="Título de la actividad"
        className="h-8 text-sm border-border focus-visible:ring-primary/30"
        autoFocus
      />
      <Textarea
        value={form.descripcion}
        onChange={e => setForm({ ...form, descripcion: e.target.value })}
        placeholder="Descripción (opcional)"
        rows={2}
        className="text-sm resize-none border-border focus-visible:ring-primary/30"
      />
      <Input
        value={form.recursos}
        onChange={e => setForm({ ...form, recursos: e.target.value })}
        placeholder="Recursos necesarios (opcional)"
        className="h-8 text-sm border-border focus-visible:ring-primary/30"
      />
      <div className="flex gap-2 justify-end pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel} className="h-7 text-xs">
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={onSave}
          disabled={!canSave || saving}
          className="h-7 text-xs bg-primary hover:bg-primary/90 text-white"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
          {isEdit ? "Guardar cambios" : "Agregar"}
        </Button>
      </div>
    </div>
  );
}

function AssignGoalDialog({
  goal,
  patients,
  onClose,
}: {
  goal: any;
  patients: any[];
  onClose: () => void;
}) {
  const [patientId, setPatientId] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const assign = useAssignGoalToPatient();

  const ac = getAreaColor(goal.areaClinica, goal.area);

  const handleAssign = () => {
    if (!patientId) return;
    assign.mutate(
      {
        id: goal.id,
        data: {
          patientId: parseInt(patientId),
          targetDate: targetDate ? new Date(targetDate).toISOString() : undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
          setSuccess(true);
          toast({
            title: "Objetivo asignado",
            description: `"${goal.nombreObjetivo}" agregado al plan de intervención.`,
          });
          setTimeout(onClose, 1400);
        },
        onError: (e: any) => {
          toast({ title: "Error al asignar", description: e.message, variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open onOpenChange={() => !assign.isPending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-display text-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Asignar objetivo a paciente
          </DialogTitle>
          <DialogDescription>
            Este objetivo se agregará al plan de intervención del paciente.
          </DialogDescription>
        </DialogHeader>

        <div className={`rounded-xl border ${ac.border} ${ac.bg} p-4 space-y-2`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-mono font-bold ${ac.text}`}>{goal.idObjetivo}</span>
            {goal.nivelDificultad && (
              <Badge variant="outline" className={`text-xs border ${NIVEL_COLORS[goal.nivelDificultad] ?? ""}`}>
                {goal.nivelDificultad}
              </Badge>
            )}
            {goal.franjaEtaria && (
              <span className={`text-xs ${ac.text} opacity-70`}>{goal.franjaEtaria} años</span>
            )}
          </div>
          <p className={`font-semibold text-sm ${ac.text}`}>{goal.nombreObjetivo}</p>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="font-semibold text-foreground">Objetivo asignado correctamente</p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Seleccionar paciente *</label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger className="bg-muted/50">
                  <SelectValue placeholder="Elegir un paciente..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.length ? (
                    patients.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        <span className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                            {p.name.charAt(0)}
                          </span>
                          {p.name}
                          {p.franjaEtaria && <span className="text-xs text-muted-foreground ml-1">· {p.franjaEtaria}</span>}
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="_none" disabled>No hay pacientes registrados</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Fecha objetivo <span className="text-muted-foreground font-normal">(opcional)</span></label>
              <input
                type="date"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm"
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>

            {!patientId && (
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Selecciona un paciente para continuar.
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={!patientId || assign.isPending}
                onClick={handleAssign}
              >
                {assign.isPending ? "Asignando..." : "Asignar objetivo"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── New Library Goal Dialog ───────────────────────────────────────────────────
function NewLibraryGoalDialog({ onClose, onCreated }: {
  onClose: () => void; onCreated: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    codigo: "",
    nombreObjetivo: "",
    definicionOperativa: "",
    indicadorTipo: "",
    intentosSugeridos: "",
    metaPorcentaje: "",
    marcoConceptual: "",
    nivel1Descripcion: "",
    nivel2Descripcion: "",
    nivel3Descripcion: "",
    areaClinica: "lenguaje",
    subarea: "",
    nivelDificultad: "básico",
    franjaEtariaMin: "" as string,
    franjaEtariaMax: "" as string,
    actividadesClinicas: "",
    actividadesFamilia: "",
    habilidadesRelacionadas: "",
    prerequisitos: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const handleAreaChange = (v: string) => setForm(f => ({ ...f, areaClinica: v, subarea: "", codigo: "" }));

  useEffect(() => {
    fetch("/api/goal-codes/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ areaClinica: "lenguaje", nivelDificultad: "básico" }),
    }).then(r => r.json()).then(d => { if (d.code) set("codigo", d.code); }).catch(() => {});
  }, []);

  const subareaOptions = AREA_SUBAREAS[form.areaClinica] ?? [];
  const franjaMin = form.franjaEtariaMin !== "" ? parseInt(form.franjaEtariaMin) : null;
  const franjaMax = form.franjaEtariaMax !== "" ? parseInt(form.franjaEtariaMax) : null;

  const codeParams = {
    areaClinica: form.areaClinica,
    franjaEtariaMin: franjaMin,
    franjaEtariaMax: franjaMax,
    subarea: form.subarea || undefined,
    nivelDificultad: form.nivelDificultad,
  };

  const handleGenerate = async () => {
    const res = await fetch("/api/goal-codes/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(codeParams),
    });
    const data = await res.json();
    return data.code as string;
  };

  const handleSave = async () => {
    if (!form.nombreObjetivo.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/goal-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idObjetivo: form.codigo || undefined,
          nombreObjetivo: form.nombreObjetivo,
          modulo: "Neurolengua",
          area: form.areaClinica,
          areaClinica: form.areaClinica,
          subarea: form.subarea || null,
          franjaEtaria: (franjaMin != null && franjaMax != null) ? `${franjaMin}-${franjaMax}` : null,
          franjaEtariaMin: franjaMin,
          franjaEtariaMax: franjaMax,
          nivelDificultad: form.nivelDificultad,
          definicionOperativa: form.definicionOperativa || null,
          indicadorTipo: form.indicadorTipo || null,
          intentosSugeridos: form.intentosSugeridos || null,
          metaPorcentaje: form.metaPorcentaje || null,
          marcoConceptual: form.marcoConceptual || null,
          nivel1Descripcion: form.nivel1Descripcion || null,
          nivel2Descripcion: form.nivel2Descripcion || null,
          nivel3Descripcion: form.nivel3Descripcion || null,
          actividadesClinicas: form.actividadesClinicas || null,
          actividadesFamilia: form.actividadesFamilia || null,
          habilidadesRelacionadas: form.habilidadesRelacionadas || null,
          prerequisitos: form.prerequisitos || null,
          estadoBanco: "activo",
          isCustom: true,
        }),
      });
      if (!res.ok) throw new Error("Error al crear objetivo");
      toast({ title: "Objetivo creado en el banco", description: `"${form.nombreObjetivo}" fue agregado con el código ${form.codigo || "(sin código)"}` });
      onCreated();
    } catch (e: any) {
      toast({ title: "Error al crear objetivo", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" /> Nuevo objetivo en el banco
          </DialogTitle>
          <DialogDescription>
            Crea un nuevo objetivo terapéutico en el banco. El código se genera automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Code generator */}
          <GoalCodePreview
            params={codeParams}
            value={form.codigo}
            onChange={v => set("codigo", v)}
            onGenerate={handleGenerate}
          />

          {/* Nombre */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Nombre del objetivo *</label>
            <Input
              value={form.nombreObjetivo}
              onChange={e => set("nombreObjetivo", e.target.value)}
              placeholder="Ampliar vocabulario expresivo en contexto funcional"
              className="bg-muted/50"
            />
          </div>

          {/* Definición operativa */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Definición operativa</label>
            <Textarea
              rows={3}
              value={form.definicionOperativa}
              onChange={e => set("definicionOperativa", e.target.value)}
              placeholder="Describe el comportamiento observable y medible esperado..."
              className="bg-muted/50 resize-none"
            />
          </div>

          {/* Indicador de logro + Intentos + Meta */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Indicador de logro</label>
              <Input value={form.indicadorTipo} onChange={e => set("indicadorTipo", e.target.value)}
                placeholder="Ej: Denominación espontánea" className="bg-muted/50 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Intentos sugeridos</label>
              <Input value={form.intentosSugeridos} onChange={e => set("intentosSugeridos", e.target.value)}
                placeholder="Ej: 10 por sesión" className="bg-muted/50 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Meta (%)</label>
              <Input value={form.metaPorcentaje} onChange={e => set("metaPorcentaje", e.target.value)}
                placeholder="Ej: 80% en 4/5 intentos" className="bg-muted/50 text-sm" />
            </div>
          </div>

          {/* Marco conceptual */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-amber-600" />
              Marco conceptual
            </label>
            <Textarea
              rows={3}
              value={form.marcoConceptual}
              onChange={e => set("marcoConceptual", e.target.value)}
              placeholder="Fundamento teórico del objetivo (enfoque clínico, modelo de intervención...)"
              className="bg-muted/50 resize-none text-sm"
            />
          </div>

          {/* Progresión de niveles */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground/80 flex items-center gap-1.5">
              <SortAsc className="h-4 w-4 text-muted-foreground" />
              Progresión de niveles
            </label>
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5">Nivel 1 · Básico</span>
                </div>
                <Textarea rows={2} value={form.nivel1Descripcion}
                  onChange={e => set("nivel1Descripcion", e.target.value)}
                  placeholder="Cómo se trabaja este objetivo en nivel inicial..."
                  className="bg-muted/50 resize-none text-sm" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5">Nivel 2 · Intermedio</span>
                </div>
                <Textarea rows={2} value={form.nivel2Descripcion}
                  onChange={e => set("nivel2Descripcion", e.target.value)}
                  placeholder="Cómo se trabaja este objetivo en nivel intermedio..."
                  className="bg-muted/50 resize-none text-sm" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-2 py-0.5">Nivel 3 · Generalización</span>
                </div>
                <Textarea rows={2} value={form.nivel3Descripcion}
                  onChange={e => set("nivel3Descripcion", e.target.value)}
                  placeholder="Cómo se generaliza en contextos cotidianos..."
                  className="bg-muted/50 resize-none text-sm" />
              </div>
            </div>
          </div>

          {/* Area + Subarea */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Área clínica</label>
              <Select value={form.areaClinica} onValueChange={handleAreaChange}>
                <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(AREA_SUBAREAS).map(a => (
                    <SelectItem key={a} value={a} className="capitalize">{a.charAt(0).toUpperCase() + a.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Subárea</label>
              <Select value={form.subarea} onValueChange={v => set("subarea", v)} disabled={subareaOptions.length === 0}>
                <SelectTrigger className="bg-muted/50"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {subareaOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Nivel + Franja */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Nivel de dificultad</label>
              <Select value={form.nivelDificultad} onValueChange={v => set("nivelDificultad", v)}>
                <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="básico">Básico</SelectItem>
                  <SelectItem value="intermedio">Intermedio</SelectItem>
                  <SelectItem value="avanzado">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Edad mínima</label>
              <Input type="number" min={0} max={18} value={form.franjaEtariaMin}
                onChange={e => set("franjaEtariaMin", e.target.value)} placeholder="2" className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Edad máxima</label>
              <Input type="number" min={0} max={18} value={form.franjaEtariaMax}
                onChange={e => set("franjaEtariaMax", e.target.value)} placeholder="5" className="bg-muted/50" />
            </div>
          </div>

          {/* Habilidades + Prerrequisitos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Habilidades relacionadas</label>
              <Textarea rows={2} value={form.habilidadesRelacionadas}
                onChange={e => set("habilidadesRelacionadas", e.target.value)}
                placeholder="Ej: Memoria semántica, atención conjunta..." className="bg-muted/50 resize-none text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Prerrequisitos</label>
              <Textarea rows={2} value={form.prerequisitos}
                onChange={e => set("prerequisitos", e.target.value)}
                placeholder="Ej: Vocabulario de 50+ palabras..." className="bg-muted/50 resize-none text-sm" />
            </div>
          </div>

          {/* Actividades clínicas */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Actividades clínicas</label>
            <Textarea rows={2} value={form.actividadesClinicas}
              onChange={e => set("actividadesClinicas", e.target.value)}
              placeholder="Actividades para trabajar en sesión..." className="bg-muted/50 resize-none text-sm" />
          </div>

          {/* Actividades familia */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Actividades para el hogar</label>
            <Textarea rows={2} value={form.actividadesFamilia}
              onChange={e => set("actividadesFamilia", e.target.value)}
              placeholder="Actividades para la familia en casa..." className="bg-muted/50 resize-none text-sm" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={!form.nombreObjetivo.trim() || saving}
              onClick={handleSave}
            >
              {saving ? "Guardando..." : "Crear en el banco"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
