import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, User, FileText, CalendarDays, Target,
  CheckCircle2, Circle, Stethoscope, Activity, Home,
  Eye, ClipboardList, Plus, ChevronDown, X,
  TrendingUp, AlertTriangle, Sparkles, Lightbulb, Star,
  BookOpen, BarChart2, Archive, Clock, MessageSquare,
  ChevronRight, Send, History, LayoutDashboard, Library,
  Flag, BarChart3, Layers, Search as SearchIcon,
  CheckSquare, Square, Milestone, CalendarCheck2, ArrowRight,
  GitCommitVertical, Filter, Printer, Pencil, Mic, MicOff, Save,
} from "lucide-react";
import { GoalCodePreview } from "@/components/ui/goal-code-preview";
import { RegistroForm, PERFORMANCE_MAP, type Goal } from "@/components/registro-clinico-form";
import { AREA_SUBAREAS } from "@/utils/goal-code-generator";
import {
  useGetPatient,
  useListRegistrosClinicos,
  useListGoals,
  useListPatientProfessionals,
  useListProfessionals,
  useCreateRegistroClinico,
  useUpdateGoal,
  useUpdatePatient,
  useUpdateRegistroClinico,
  useAssignGoalToPatient,
  getListGoalsQueryKey,
  getListRegistrosClinicosQueryKey,
  getGetPatientQueryKey,
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { CustomGoalDialog } from "@/components/custom-goal-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { DIAGNOSES } from "@/utils/diagnosis-map";

// ─── Types ────────────────────────────────────────────────────────────────────
type RC = {
  id: number; patientId: number; patientName?: string | null;
  professionalId?: number | null; professionalName?: string | null;
  fecha: string; resumenSesion?: string | null;
  observaciones?: string | null; recomendacionesHogar?: string | null;
  createdAt: string;
};
type ProgressEntry = {
  id: number; goalId: number; nota?: string | null;
  statusAnterior?: string | null; statusNuevo?: string | null;
  progressPct?: number | null;
  registroClinicoId?: number | null; createdAt: string;
};
type TimelineEvent = {
  id: string; type: string; date: string; sortKey: string;
  title: string; description: string;
  badge?: string | null; meta?: string | null;
  progressPct?: number | null;
  extra?: {
    codigo?: string | null; nivel?: string | null;
    goalArea?: string | null;
    statusAnterior?: string | null; statusNuevo?: string | null;
  };
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CYCLE: Record<string, string> = {
  "activo":      "en progreso",
  "en progreso": "logrado",
  "logrado":     "archivado",
  "archivado":   "activo",
  // backward compat
  "suspendido":  "activo",
};

const STATUS_LABELS: Record<string, string> = {
  "activo":      "Activo",
  "en progreso": "En progreso",
  "logrado":     "Logrado",
  "archivado":   "Archivado",
  "suspendido":  "Archivado",
};


const STATUS_STYLE: Record<string, string> = {
  "activo":      "bg-primary/10 text-primary border-primary/20",
  "en progreso": "bg-amber-100 text-amber-700 border-amber-200",
  "logrado":     "bg-emerald-100 text-emerald-700 border-emerald-200",
  "archivado":   "bg-muted text-muted-foreground border-border",
  "suspendido":  "bg-muted text-muted-foreground border-border",
};

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIAS = [
  "lenguaje", "habla", "pragmática", "motricidad orofacial",
  "lectoescritura", "cognición", "estimulación temprana", "otro"
];

const AREA_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "lenguaje":              { bg: "bg-rose-100",    text: "text-rose-700",    border: "border-rose-200"    },
  "habla":                 { bg: "bg-amber-100",   text: "text-amber-700",   border: "border-amber-200"   },
  "pragmática":            { bg: "bg-teal-100",    text: "text-teal-700",    border: "border-teal-200"    },
  "motricidad orofacial":  { bg: "bg-orange-100",  text: "text-orange-700",  border: "border-orange-200"  },
  "lectoescritura":        { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  "cognición":             { bg: "bg-teal-100",    text: "text-teal-700",    border: "border-teal-200"    },
  "estimulación temprana": { bg: "bg-stone-200",   text: "text-stone-700",   border: "border-stone-300"   },
};

const NIVEL_COLORS: Record<string, string> = {
  "básico":     "bg-emerald-100 text-emerald-700 border-emerald-200",
  "intermedio": "bg-amber-100 text-amber-700 border-amber-200",
  "avanzado":   "bg-red-100 text-red-700 border-red-200",
};

function getAreaColor(area?: string | null) {
  return AREA_COLORS[(area ?? "").toLowerCase()] ?? { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function semaforoMeta(s?: string | null) {
  if (!s) return { label: "Sin datos", dot: "bg-muted-foreground/40", badge: "bg-muted text-muted-foreground" };
  if (s.includes("🟢")) return { label: "Buen progreso",     dot: "bg-emerald-400", badge: "bg-emerald-100 text-emerald-700" };
  if (s.includes("🟡")) return { label: "En progreso",       dot: "bg-yellow-400",  badge: "bg-yellow-100 text-yellow-700"  };
  if (s.includes("🔴")) return { label: "Requiere atención", dot: "bg-red-400",     badge: "bg-red-100 text-red-700"        };
  return { label: s, dot: "bg-muted-foreground/40", badge: "bg-muted text-muted-foreground" };
}

function GoalStatusIcon({ status }: { status: string }) {
  if (status === "logrado")     return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
  if (status === "archivado" || status === "suspendido") return <Archive className="h-4 w-4 text-muted-foreground shrink-0" />;
  if (status === "en progreso") return <Clock className="h-4 w-4 text-amber-500 shrink-0" />;
  return <Circle className="h-4 w-4 text-primary shrink-0" />;
}

function formatFecha(f: string) {
  try { return format(new Date(f + "T00:00:00"), "d MMM yyyy", { locale: es }); }
  catch { return f; }
}

function formatTs(ts: string) {
  try { return format(new Date(ts), "d MMM yyyy HH:mm", { locale: es }); }
  catch { return ts; }
}

// ─── InformeTab helpers ────────────────────────────────────────────────────────
type InformeData = {
  v: 4;
  resumen: string;
  conducta: string;
  areas: Record<string, string>;
  sugerencias: string;
};

function parseInformeData(raw: string | null | undefined): InformeData {
  const empty: InformeData = { v: 4, resumen: "", conducta: "", areas: {}, sugerencias: "" };
  if (!raw) return empty;
  try {
    const p = JSON.parse(raw);
    if (p?.v === 4) return p as InformeData;
    if (p?.v === 3) return { ...empty, resumen: p.observaciones ?? "", sugerencias: p.sugerencias ?? "" };
    if (p?.v === 2) return { ...empty, resumen: p.resumen ?? "", areas: p.areas ?? {}, sugerencias: p.sugerencias ?? "" };
    return empty;
  } catch {
    return { ...empty, resumen: raw };
  }
}

function gPct(status: string, progressPct?: number | null): number {
  if (progressPct != null) return progressPct;
  if (status === "logrado")     return 100;
  if (status === "en progreso") return 55;
  if (status === "activo")      return 20;
  return 0;
}

function generarResumenProceso(
  patient: { name: string; age?: number | null; diagnosis?: string | null },
  goals: Goal[], registros: RC[]
): string {
  const logrados  = goals.filter(g => g.status === "logrado");
  const enProceso = goals.filter(g => ["activo", "en progreso"].includes(g.status));
  const areas     = [...new Set(goals.filter(g => !["archivado", "suspendido"].includes(g.status))
    .map(g => g.areaClinica ?? g.category).filter(Boolean))];
  let txt = `${patient.name}`;
  if (patient.age) txt += `, de ${patient.age} años,`;
  txt += ` ha asistido a ${registros.length} sesión${registros.length !== 1 ? "es" : ""} de intervención terapéutica.`;
  if (areas.length > 0)
    txt += ` El trabajo clínico ha abordado las áreas de ${areas.join(", ")}.`;
  if (logrados.length > 0)
    txt += ` A la fecha se han alcanzado ${logrados.length} objetivo${logrados.length !== 1 ? "s" : ""} terapéutico${logrados.length !== 1 ? "s" : ""}, evidenciando progreso significativo en el proceso.`;
  if (enProceso.length > 0)
    txt += ` Actualmente se trabajan ${enProceso.length} objetivo${enProceso.length !== 1 ? "s" : ""} en proceso de adquisición y consolidación.`;
  if (patient.diagnosis)
    txt += `\n\nDiagnóstico de referencia: ${patient.diagnosis}.`;
  return txt;
}

function generarConductaSesiones(registros: RC[]): string {
  const recientes = [...registros]
    .sort((a, b) => new Date(b.fecha || b.createdAt).getTime() - new Date(a.fecha || a.createdAt).getTime())
    .slice(0, 3);
  let txt = "El/La paciente se muestra colaborador/a durante las actividades propuestas, respondiendo adecuadamente a las instrucciones y consignas del terapeuta. Se observa motivación frente a las tareas, con períodos de atención sostenida acordes a su etapa de desarrollo.";
  const conObs = recientes.find(r => r.observaciones);
  if (conObs?.observaciones) {
    const obs = conObs.observaciones;
    txt += `\n\nObservación reciente: "${obs.slice(0, 200)}${obs.length > 200 ? "…" : ""}"`;
  }
  return txt;
}

function generarNarrativaArea(area: string, areaGoals: Goal[], registros: RC[]): string {
  const nombre    = area.charAt(0).toUpperCase() + area.slice(1);
  const logrados  = areaGoals.filter(g => g.status === "logrado");
  const enProceso = areaGoals.filter(g => ["activo", "en progreso"].includes(g.status));
  const avgPct    = areaGoals.length > 0
    ? Math.round(areaGoals.reduce((s, g) => s + gPct(g.status, g.progressPct), 0) / areaGoals.length)
    : 0;
  let parts: string[] = [];
  if (logrados.length > 0 && enProceso.length > 0) {
    parts.push(
      `En el área de ${nombre} se han alcanzado los siguientes objetivos: ${logrados.map(g => `"${g.title}"`).join(", ")}. ` +
      `Actualmente se trabaja en: ${enProceso.map(g => `"${g.title}"`).join(", ")}.`
    );
  } else if (logrados.length > 0) {
    parts.push(`En el área de ${nombre} se han logrado todos los objetivos planteados: ${logrados.map(g => `"${g.title}"`).join(", ")}.`);
  } else if (enProceso.length > 0) {
    parts.push(`En el área de ${nombre} se trabaja actualmente en: ${enProceso.map(g => `"${g.title}"`).join(", ")}.`);
  }
  if (avgPct >= 80) {
    parts.push("Se observa desempeño consistente y generalización progresiva de habilidades al contexto cotidiano.");
  } else if (avgPct >= 50) {
    parts.push("Se observan avances progresivos; se requiere apoyo moderado para consolidar y generalizar las habilidades trabajadas.");
  } else {
    parts.push("El trabajo en esta área se encuentra en etapa inicial, requiriéndose apoyo sistemático y estrategias de moldeamiento progresivo.");
  }
  const nota = registros.find(r => r.resumenSesion?.toLowerCase().includes(area.toLowerCase()));
  if (nota?.resumenSesion) {
    const n = nota.resumenSesion;
    parts.push(`Nota de sesión: "${n.slice(0, 180)}${n.length > 180 ? "…" : ""}"`);
  }
  return parts.join(" ");
}

function generarSugerenciasFamilia(
  patient: { name: string; age?: number | null },
  goals: Goal[], registros: RC[]
): string {
  const nombre    = patient.name.split(" ")[0];
  const enProceso = goals.filter(g => ["activo", "en progreso"].includes(g.status));
  const ultRec    = [...registros].sort(
    (a, b) => new Date(b.fecha || b.createdAt).getTime() - new Date(a.fecha || a.createdAt).getTime()
  )[0];
  let txt = `Para apoyar el proceso de ${nombre} en casa, les compartimos las siguientes sugerencias:\n\n`;
  if (enProceso.length > 0) {
    txt += `• Reforzar en el día a día las habilidades trabajadas en sesión.\n`;
    txt += `• Celebrar los logros de ${nombre}, por pequeños que sean.\n`;
    txt += `• Mantener rutinas estables y predecibles en el hogar.\n`;
  }
  if (ultRec?.recomendacionesHogar)
    txt += `\nActividades sugeridas:\n${ultRec.recomendacionesHogar}`;
  txt += `\n\nAnte cualquier consulta, estamos disponibles para orientarles.`;
  return txt;
}

// ─── InformeTab sub-components ────────────────────────────────────────────────
function DocSection({
  title, onSuggest, children,
}: { title: string; onSuggest?: () => void; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </h3>
        {onSuggest && (
          <button
            type="button"
            onClick={onSuggest}
            className="flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors px-2 py-0.5 rounded hover:bg-primary/5"
          >
            <Sparkles className="h-2.5 w-2.5" /> Sugerir
          </button>
        )}
      </div>
      <div className="border-b border-border/40 mb-3" />
      {children}
    </div>
  );
}

function DocTextarea({
  value, onChange, placeholder, rows = 6,
}: { value: string; onChange: (v: string) => void; placeholder: string; rows?: number }) {
  return (
    <Textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="resize-none w-full text-sm leading-[1.85] bg-transparent border border-dashed border-border/40 rounded-lg px-4 py-3 text-foreground/90 focus:border-primary/30 focus:bg-muted/10 placeholder:text-muted-foreground/35 transition-all shadow-none"
    />
  );
}

// ─── InformeTab ───────────────────────────────────────────────────────────────
type InformeProps = {
  patient: { id: number; name: string; age?: number | null; diagnosis?: string | null; informeEvolucion?: string | null; informeFamilia?: string | null; fechaInicio?: string | null };
  goals: Goal[];
  registros: RC[];
  onSave: (fields: { informeEvolucion?: string; informeFamilia?: string }) => Promise<void>;
};

function InformeTab({ patient, goals, registros, onSave }: InformeProps) {
  const today = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es });
  const [view, setView]     = useState<"clinico" | "familia">("clinico");
  const [isSaving, setIsSaving] = useState(false);

  const initial = parseInformeData(patient.informeEvolucion);
  const [resumen,    setResumen]    = useState(initial.resumen);
  const [conducta,   setConducta]   = useState(initial.conducta);
  const [areaTexts,  setAreaTexts]  = useState<Record<string, string>>(initial.areas);
  const [sugerencias, setSugerencias] = useState(initial.sugerencias);
  const [textoFamilia, setTextoFamilia] = useState((patient as any).informeFamilia ?? "");

  useEffect(() => {
    const d = parseInformeData(patient.informeEvolucion);
    setResumen(d.resumen);
    setConducta(d.conducta);
    setAreaTexts(d.areas);
    setSugerencias(d.sugerencias);
    setTextoFamilia((patient as any).informeFamilia ?? "");
  }, [patient.informeEvolucion, (patient as any).informeFamilia]);

  const achievedGoals  = goals.filter(g => g.status === "logrado");
  const workingGoals   = goals.filter(g => ["activo", "en progreso"].includes(g.status));
  const totalSessions  = registros.length;

  const reportGoals = goals.filter(g => !["archivado", "suspendido"].includes(g.status));
  const areaGroups  = reportGoals.reduce<Record<string, Goal[]>>((acc, g) => {
    const a = g.areaClinica ?? g.category ?? "general";
    if (!acc[a]) acc[a] = [];
    acc[a].push(g);
    return acc;
  }, {});
  const areas = Object.keys(areaGroups).sort();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const informeEvolucion = JSON.stringify({ v: 4, resumen, conducta, areas: areaTexts, sugerencias });
      await onSave({ informeEvolucion, informeFamilia: textoFamilia });
    } finally { setIsSaving(false); }
  };

  const handlePrint = () => {
    const contentId = view === "familia" ? "informe-familia-content" : "informe-clinico-content";
    const content   = document.getElementById(contentId)?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>Informe — ${patient.name}</title><style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1c1412;padding:48px 56px;font-size:13px;line-height:1.85;max-width:820px;margin:0 auto}
  .doc-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:2px solid #ddd3c8;margin-bottom:32px}
  .doc-header-left h1{font-size:22px;font-weight:700;color:#1c1412;margin-bottom:6px}
  .doc-meta{font-size:11.5px;color:#78716c;display:flex;flex-wrap:wrap;gap:0 20px}
  .doc-header-right{text-align:right;font-size:11px;color:#78716c}
  .doc-header-right strong{display:block;font-size:12px;color:#374151;margin-bottom:2px}
  .doc-section{margin-bottom:28px}
  .doc-section-title{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#78716c;margin-bottom:6px}
  .doc-section-line{border:none;border-bottom:1px solid #e5e7eb;margin-bottom:12px}
  .doc-text{font-size:13px;color:#1c1412;line-height:1.85;white-space:pre-wrap;min-height:36px}
  .doc-area{margin-bottom:20px}
  .doc-area-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#374151;margin-bottom:6px}
  .doc-stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:8px}
  .doc-stat{background:#faf7f4;border:1px solid #e7e1d8;border-radius:10px;padding:12px;text-align:center}
  .doc-stat-emoji{font-size:20px;margin-bottom:4px}
  .doc-stat-val{font-size:20px;font-weight:700;color:#1c1412}
  .doc-stat-label{font-size:10px;color:#78716c;margin-top:2px}
  ul{padding:0;margin:0;list-style:none}
  li{display:flex;align-items:flex-start;gap:8px;padding:5px 0;font-size:12.5px;color:#1c1412;border-bottom:1px solid #f3ede6}
  li:last-child{border-bottom:none}
  .dot{width:7px;height:7px;border-radius:50%;margin-top:5px;flex-shrink:0;background:#10b981}
  .dot-amber{background:#f59e0b}
  .footer{margin-top:40px;padding-top:10px;border-top:1px solid #e7e1d8;font-size:10px;color:#92897e;display:flex;justify-content:space-between}
  button,svg{display:none!important}
  textarea{display:none!important}
  .doc-text-area-print{display:block}
  @media print{body{padding:24px 32px}}
</style></head><body>${content}<div class="footer"><span>Neurometric Lab · Informe de Evolución</span><span>${today}</span></div></body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 300);
  };

  return (
    <div className="space-y-5">

      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Informe de evolución</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Documento clínico narrativo · editable · exportable como PDF</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border/60 overflow-hidden text-xs font-medium">
            <button onClick={() => setView("clinico")}
              className={`px-3 py-1.5 transition-colors ${view === "clinico" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"}`}>
              Clínico
            </button>
            <button onClick={() => setView("familia")}
              className={`px-3 py-1.5 transition-colors ${view === "familia" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted/50"}`}>
              Para familias
            </button>
          </div>
          <Button size="sm" variant="outline" onClick={handlePrint} className="h-8 gap-1.5 text-xs">
            <Printer className="h-3.5 w-3.5" /> Exportar PDF
          </Button>
        </div>
      </div>

      {/* ── INFORME CLÍNICO ──────────────────────────────────────────────────── */}
      {view === "clinico" && (
        <div className="space-y-4">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="px-8 py-8 space-y-8" id="informe-clinico-content">

              {/* ── Encabezado del documento ─────────────────────────── */}
              <div className="doc-header flex justify-between items-start pb-6 border-b-2 border-border">
                <div>
                  <h1 className="text-2xl font-bold font-display text-foreground">{patient.name}</h1>
                  <div className="doc-meta flex flex-wrap gap-x-5 gap-y-0.5 mt-2 text-xs text-muted-foreground">
                    {patient.age && <span>Edad: <strong className="text-foreground/80">{patient.age} años</strong></span>}
                    {(patient as any).diagnosis && <span>Diagnóstico: <strong className="text-foreground/80">{(patient as any).diagnosis}</strong></span>}
                    {patient.fechaInicio && <span>Inicio: <strong className="text-foreground/80">{formatFecha(patient.fechaInicio)}</strong></span>}
                    <span>Sesiones: <strong className="text-foreground/80">{totalSessions}</strong></span>
                  </div>
                </div>
                <div className="doc-header-right text-right text-xs text-muted-foreground">
                  <strong className="block text-sm text-foreground/80 mb-0.5">Informe de evolución</strong>
                  <span>{today}</span>
                </div>
              </div>

              {/* ── ¿Cómo va el proceso? ─────────────────────────────── */}
              <div className="doc-section">
                <DocSection
                  title="¿Cómo va el proceso?"
                  onSuggest={() => setResumen(generarResumenProceso(patient, goals, registros))}
                >
                  <div className="doc-text-area-print doc-text hidden">{resumen || "Sin contenido."}</div>
                  <DocTextarea
                    value={resumen}
                    onChange={setResumen}
                    placeholder={`Describe de forma general el estado actual del proceso terapéutico de ${patient.name.split(" ")[0]}: cuántas sesiones lleva, qué áreas se han abordado, avances generales…`}
                    rows={5}
                  />
                </DocSection>
              </div>

              {/* ── Conducta en sesiones ─────────────────────────────── */}
              <div className="doc-section">
                <DocSection
                  title="Conducta en sesiones"
                  onSuggest={() => setConducta(generarConductaSesiones(registros))}
                >
                  <div className="doc-text-area-print doc-text hidden">{conducta || "Sin contenido."}</div>
                  <DocTextarea
                    value={conducta}
                    onChange={setConducta}
                    placeholder="Describe la actitud, disposición, nivel de atención y conducta del/la paciente durante las sesiones de intervención…"
                    rows={4}
                  />
                </DocSection>
              </div>

              {/* ── Desarrollo por área ──────────────────────────────── */}
              <div className="doc-section">
                <DocSection title="Desarrollo por área">
                  {areas.length > 0 ? (
                    <div className="space-y-6">
                      {areas.map(area => (
                        <div key={area} className="doc-area">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="doc-area-title text-[11px] font-bold uppercase tracking-[0.07em] text-foreground/75">
                              {area.charAt(0).toUpperCase() + area.slice(1)}
                            </h4>
                            <button
                              type="button"
                              onClick={() => setAreaTexts(prev => ({ ...prev, [area]: generarNarrativaArea(area, areaGroups[area], registros) }))}
                              className="flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors px-2 py-0.5 rounded hover:bg-primary/5"
                            >
                              <Sparkles className="h-2.5 w-2.5" /> Sugerir
                            </button>
                          </div>
                          <div className="doc-text-area-print doc-text hidden">{areaTexts[area] || "Sin contenido."}</div>
                          <DocTextarea
                            value={areaTexts[area] ?? ""}
                            onChange={v => setAreaTexts(prev => ({ ...prev, [area]: v }))}
                            placeholder={`Describe el desempeño y evolución clínica en el área de ${area.charAt(0).toUpperCase() + area.slice(1)}…`}
                            rows={4}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic py-3">
                      No hay áreas registradas aún. Agrega objetivos terapéuticos para habilitar esta sección.
                    </p>
                  )}
                </DocSection>
              </div>

              {/* ── Sugerencias para la familia ──────────────────────── */}
              <div className="doc-section">
                <DocSection
                  title="Sugerencias para la familia"
                  onSuggest={() => setSugerencias(generarSugerenciasFamilia(patient, goals, registros))}
                >
                  <div className="doc-text-area-print doc-text hidden">{sugerencias || "Sin contenido."}</div>
                  <DocTextarea
                    value={sugerencias}
                    onChange={setSugerencias}
                    placeholder="Escribe recomendaciones y sugerencias para la familia en lenguaje claro y accesible…"
                    rows={4}
                  />
                </DocSection>
              </div>

            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? "Guardando…" : "Guardar informe"}
            </Button>
          </div>
        </div>
      )}

      {/* ── PARA FAMILIAS ────────────────────────────────────────────────────── */}
      {view === "familia" && (
        <div className="space-y-4">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="px-8 py-8 space-y-8" id="informe-familia-content">

              {/* Header */}
              <div className="doc-header flex justify-between items-start pb-5 border-b border-border">
                <div>
                  <h1 className="text-2xl font-bold font-display text-primary">{patient.name}</h1>
                  <p className="doc-meta text-xs text-muted-foreground mt-1">Informe para la familia · {today}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="doc-section">
                <DocSection title="¿Cómo va el proceso?">
                  <div className="doc-stat-grid grid grid-cols-3 gap-3">
                    {[
                      { emoji: "📅", val: totalSessions, label: totalSessions === 1 ? "sesión realizada" : "sesiones realizadas" },
                      { emoji: "✅", val: achievedGoals.length, label: achievedGoals.length === 1 ? "objetivo alcanzado" : "objetivos alcanzados" },
                      { emoji: "🎯", val: workingGoals.length, label: workingGoals.length === 1 ? "objetivo en progreso" : "objetivos en progreso" },
                    ].map(s => (
                      <div key={s.label} className="doc-stat bg-muted/50 border border-border rounded-xl p-3 text-center">
                        <p className="doc-stat-emoji text-2xl mb-1">{s.emoji}</p>
                        <p className="doc-stat-val text-2xl font-bold font-display text-foreground">{s.val}</p>
                        <p className="doc-stat-label text-[10px] text-muted-foreground mt-0.5 leading-snug">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </DocSection>
              </div>

              {/* Lo que logró */}
              {achievedGoals.length > 0 && (
                <div className="doc-section">
                  <DocSection title="Lo que logró ✨">
                    <ul className="space-y-2">
                      {achievedGoals.map(g => (
                        <li key={g.id} className="flex items-start gap-2.5 py-1 border-b border-border/30 last:border-0">
                          <span className="dot mt-1.5 h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
                          <span className="text-sm text-foreground">{g.title}</span>
                        </li>
                      ))}
                    </ul>
                  </DocSection>
                </div>
              )}

              {/* En lo que estamos trabajando */}
              {workingGoals.length > 0 && (
                <div className="doc-section">
                  <DocSection title="En lo que estamos trabajando">
                    <ul className="space-y-2">
                      {workingGoals.map(g => (
                        <li key={g.id} className="flex items-start gap-2.5 py-1 border-b border-border/30 last:border-0">
                          <span className="dot dot-amber mt-1.5 h-2 w-2 rounded-full bg-amber-400 flex-shrink-0" />
                          <span className="text-sm text-foreground">{g.title}</span>
                        </li>
                      ))}
                    </ul>
                  </DocSection>
                </div>
              )}

              {/* Mensaje y sugerencias */}
              <div className="doc-section">
                <DocSection
                  title="Mensaje y sugerencias para la familia"
                  onSuggest={() => setTextoFamilia(generarSugerenciasFamilia(patient, goals, registros))}
                >
                  <div className="doc-text-area-print doc-text hidden">{textoFamilia || "Sin mensaje registrado."}</div>
                  <DocTextarea
                    value={textoFamilia}
                    onChange={setTextoFamilia}
                    placeholder="Escribe aquí un mensaje y sugerencias para la familia en lenguaje cercano y amigable…"
                    rows={7}
                  />
                </DocSection>
              </div>

            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
              <Save className="h-4 w-4" />
              {isSaving ? "Guardando…" : "Guardar para familias"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PatientProfile() {
  const params = useParams<{ id: string }>();
  const patientId = parseInt(params.id || "0");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patient, isLoading: loadingPatient } = useGetPatient(patientId);
  const { data: allRegistros = [] } = useListRegistrosClinicos({ patientId });
  const { data: allGoals = [] }     = useListGoals({ patientId });
  const { data: assignments = [] }  = useListPatientProfessionals({ patientId });
  const { data: professionals = [] } = useListProfessionals();

  const updateGoal = useUpdateGoal();
  const assignGoalFromLibrary = useAssignGoalToPatient();

  const [expanded, setExpanded] = useState<number | null>(null);
  const [showRegForm, setShowRegForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [progressGoal, setProgressGoal] = useState<Goal | null>(null);
  const [showBankDialog, setShowBankDialog] = useState(false);
  const [isSavingRC, setIsSavingRC] = useState(false);

  // Edit patient
  const [showEditPatient, setShowEditPatient] = useState(false);
  const [epName, setEpName]           = useState("");
  const [epAge, setEpAge]             = useState("");
  const [epDiagnosis, setEpDiagnosis] = useState("");
  const [epProf, setEpProf]           = useState("");
  const [epObs, setEpObs]             = useState("");
  const [isSavingPatient, setIsSavingPatient] = useState(false);

  // Edit registro
  const [editingRegistro, setEditingRegistro]     = useState<RC | null>(null);
  const [erFecha, setErFecha]                     = useState("");
  const [erResumen, setErResumen]                 = useState("");
  const [erObs, setErObs]                         = useState("");
  const [erHogar, setErHogar]                     = useState("");
  const [isSavingRegistro, setIsSavingRegistro]   = useState(false);

  // Voice recording for edit registro dialog
  const [isRecordingEr, setIsRecordingEr]   = useState(false);
  const recognitionErRef                    = useRef<any>(null);
  const hasSpeechSupport = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startRecordingEr = () => {
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
      if (transcript) setErObs(prev => prev ? `${prev} ${transcript}` : transcript);
    };
    rec.onerror = () => setIsRecordingEr(false);
    rec.onend   = () => setIsRecordingEr(false);
    recognitionErRef.current = rec;
    rec.start();
    setIsRecordingEr(true);
  };

  const stopRecordingEr = () => {
    recognitionErRef.current?.stop();
    setIsRecordingEr(false);
  };

  // Pre-fill edit patient form when dialog opens
  useEffect(() => {
    if (showEditPatient && patient) {
      setEpName(patient.name ?? "");
      setEpAge(patient.age != null ? String(patient.age) : "");
      setEpDiagnosis((patient as any).diagnosis ?? "");
      setEpProf((patient as any).profesionalNombre ?? "");
      setEpObs((patient as any).observaciones ?? "");
    }
  }, [showEditPatient, patient]);

  // Pre-fill edit registro form when editing a registro
  useEffect(() => {
    if (editingRegistro) {
      setErFecha(editingRegistro.fecha ?? "");
      setErResumen(editingRegistro.resumenSesion ?? "");
      setErObs(editingRegistro.observaciones ?? "");
      setErHogar(editingRegistro.recomendacionesHogar ?? "");
    }
  }, [editingRegistro]);

  const handleSavePatient = async () => {
    if (!epName.trim()) return;
    setIsSavingPatient(true);
    try {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: epName.trim(),
          age: epAge ? parseInt(epAge) : null,
          diagnosis: epDiagnosis || null,
          profesionalNombre: epProf || null,
          observaciones: epObs || null,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      queryClient.invalidateQueries({ queryKey: getGetPatientQueryKey(patientId) });
      queryClient.invalidateQueries({ queryKey: ["listPatients"] });
      toast({ title: "Paciente actualizado" });
      setShowEditPatient(false);
    } catch (err: any) {
      toast({ title: "Error al guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSavingPatient(false);
    }
  };

  // ── Anamnesis state ──────────────────────────────────────────────────────
  const [anMotivo, setAnMotivo]           = useState("");
  const [anAntecedentes, setAnAntecedentes] = useState("");
  const [anFamilia, setAnFamilia]         = useState("");
  const [anEscolaridad, setAnEscolaridad] = useState("");
  const [anObs, setAnObs]                 = useState("");
  const [isSavingAn, setIsSavingAn]       = useState(false);
  const [anDirty, setAnDirty]             = useState(false);

  useEffect(() => {
    if (patient) {
      setAnMotivo((patient as any).motivoConsulta ?? "");
      setAnAntecedentes((patient as any).antecedentes ?? "");
      setAnFamilia((patient as any).historiaFamiliar ?? "");
      setAnEscolaridad((patient as any).escolaridad ?? "");
      setAnObs((patient as any).observaciones ?? "");
      setAnDirty(false);
    }
  }, [patient?.id]);

  const handleSaveAnamnesis = async () => {
    setIsSavingAn(true);
    try {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          motivoConsulta: anMotivo || null,
          antecedentes: anAntecedentes || null,
          historiaFamiliar: anFamilia || null,
          escolaridad: anEscolaridad || null,
          observaciones: anObs || null,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      queryClient.invalidateQueries({ queryKey: getGetPatientQueryKey(patientId) });
      toast({ title: "Anamnesis guardada" });
      setAnDirty(false);
    } catch (err: any) {
      toast({ title: "Error al guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSavingAn(false);
    }
  };

  const handleSaveInforme = async (fields: { informeEvolucion?: string; informeFamilia?: string }) => {
    const res = await fetch(`/api/patients/${patientId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    queryClient.invalidateQueries({ queryKey: getGetPatientQueryKey(patientId) });
    toast({ title: "Informe guardado" });
  };

  const registros = allRegistros as RC[];
  const goals     = allGoals as Goal[];
  const profs     = assignments as Array<{ id: number; professionalId: number; professionalName?: string | null; professionalSpecialty?: string | null }>;

  const sm  = semaforoMeta((patient as any)?.semaforo);
  const pct = (patient as any)?.promedioDesempeno != null ? Math.round((patient as any).promedioDesempeno * 100) : null;

  const activeGoals     = goals.filter(g => g.status === "activo");
  const inProgressGoals = goals.filter(g => g.status === "en progreso");
  const achievedGoals   = goals.filter(g => g.status === "logrado");
  const archivedGoals   = goals.filter(g => g.status === "archivado" || g.status === "suspendido");

  const handleSaveRegistro = async (d: { registro: any; goalUpdates: Array<{ goalId: number; performance: string }> }) => {
    setIsSavingRC(true);
    try {
      const rcRes = await fetch("/api/registros-clinicos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d.registro),
      });
      if (!rcRes.ok) throw new Error("Error al crear registro");
      const createdRC = await rcRes.json();

      if (d.goalUpdates.length > 0) {
        await Promise.all(d.goalUpdates.map(({ goalId, performance }) => {
          const map = PERFORMANCE_MAP[performance];
          if (!map) return Promise.resolve();
          return fetch(`/api/goals/${goalId}/progress`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              statusNuevo: map.statusNuevo,
              progressPct: map.pct,
              registroClinicoId: createdRC.id,
              nota: `Sesión ${createdRC.fecha}: ${map.label}`,
            }),
          });
        }));
      }

      queryClient.invalidateQueries({ queryKey: getListRegistrosClinicosQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
      setShowRegForm(false);
      const n = d.goalUpdates.length;
      toast({ title: n > 0 ? `Registro guardado · ${n} objetivo${n !== 1 ? "s" : ""} actualizado${n !== 1 ? "s" : ""}` : "Registro creado" });
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setIsSavingRC(false);
    }
  };

  const handleSaveEditRegistro = async () => {
    if (!editingRegistro) return;
    setIsSavingRegistro(true);
    stopRecordingEr();
    try {
      const res = await fetch(`/api/registros-clinicos/${editingRegistro.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: erFecha,
          resumenSesion: erResumen || null,
          observaciones: erObs || null,
          recomendacionesHogar: erHogar || null,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      queryClient.invalidateQueries({ queryKey: getListRegistrosClinicosQueryKey() });
      toast({ title: "Registro actualizado" });
      setEditingRegistro(null);
    } catch (err: any) {
      toast({ title: "Error al guardar el registro", description: err.message, variant: "destructive" });
    } finally {
      setIsSavingRegistro(false);
    }
  };

  const invalidateGoals = () => queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
  const invalidateRC    = () => queryClient.invalidateQueries({ queryKey: getListRegistrosClinicosQueryKey() });

  const cycleGoalStatus = (goal: Goal) => {
    const next = STATUS_CYCLE[goal.status] ?? "activo";
    updateGoal.mutate({ id: goal.id, data: { status: next } as any }, { onSuccess: invalidateGoals });
  };

  if (loadingPatient) return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-5 w-72 rounded-full" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </AppLayout>
  );

  if (!patient) return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <User className="h-16 w-16 text-muted-foreground/40 mb-4" />
        <h2 className="text-xl font-bold text-foreground/80">Paciente no encontrado</h2>
        <Button variant="outline" className="mt-6" onClick={() => navigate("/patients")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver a pacientes
        </Button>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
        {/* Back */}
        <button onClick={() => window.history.length > 1 ? window.history.back() : navigate("/patients")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors w-fit group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Volver
        </button>

        {/* Patient header */}
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="h-20 w-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold font-display ring-4 ring-white shadow-md shrink-0">
                {patient.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-2xl font-display font-bold text-foreground">{patient.name}</h1>
                  {(patient as any).semaforo && (
                    <Badge variant="outline" className={`${sm.badge} border-0 text-xs`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${sm.dot} mr-1.5 inline-block`} />
                      {sm.label}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-foreground/70 mt-2">
                  {patient.age && <span className="flex items-center gap-1.5"><User className="h-4 w-4 text-muted-foreground" />{patient.age} años</span>}
                  {(patient as any).franjaEtaria && <span className="flex items-center gap-1.5"><Activity className="h-4 w-4 text-muted-foreground" />Franja {(patient as any).franjaEtaria}</span>}
                  {(patient as any).profesionalNombre && <span className="flex items-center gap-1.5"><Stethoscope className="h-4 w-4 text-muted-foreground" />{(patient as any).profesionalNombre}</span>}
                </div>
                {pct != null && (
                  <div className="mt-4 max-w-xs">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Promedio desempeño</span>
                      <span className="font-semibold text-foreground/80">{pct}%</span>
                    </div>
                    <div className="h-2 bg-white/70 rounded-full overflow-hidden border border-white">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowEditPatient(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm border border-border bg-muted/60 text-foreground/80 shadow-sm transition-all duration-200 hover:bg-muted hover:border-border active:scale-[0.97]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => navigate(`/nueva-sesion?patientId=${patientId}`)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-md transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
                  style={{ background: "linear-gradient(135deg, var(--color-accent) 0%, color-mix(in srgb, var(--color-accent) 75%, black) 100%)" }}
                >
                  <Plus className="h-4 w-4" />
                  Nueva sesión
                </button>
              </div>
            </div>
            {patient.diagnosis && (
              <div className="mt-5 flex items-start gap-3 bg-white/60 backdrop-blur-sm border border-primary/10 rounded-xl p-4">
                <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-0.5">Diagnóstico</p>
                  <p className="text-foreground text-sm">{patient.diagnosis}</p>
                </div>
              </div>
            )}
            {(patient as any).observaciones && (
              <div className="mt-2 flex items-start gap-3 bg-amber-50/70 border border-amber-100 rounded-xl p-4">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide mb-0.5">Observaciones</p>
                  <p className="text-amber-900 text-sm">{(patient as any).observaciones}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Stats — compact strip */}
        <div className="flex items-center gap-3 flex-wrap px-1">
          <span className="flex items-center gap-1.5 text-sm text-foreground/70">
            <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold text-foreground">{registros.length}</span>
            <span className="text-muted-foreground">registros</span>
          </span>
          <span className="text-muted-foreground/20 select-none">·</span>
          <span className="flex items-center gap-1.5 text-sm text-foreground/70">
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold text-foreground">{activeGoals.length + inProgressGoals.length}</span>
            <span className="text-muted-foreground">activos</span>
          </span>
          <span className="text-muted-foreground/20 select-none">·</span>
          <span className="flex items-center gap-1.5 text-sm text-foreground/70">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold text-foreground">{achievedGoals.length}</span>
            <span className="text-muted-foreground">logrados</span>
          </span>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="anamnesis">
          <TabsList className="bg-card border border-border/50 p-1 rounded-xl shadow-sm flex-wrap h-auto gap-1">
            <TabsTrigger value="anamnesis" className="rounded-lg text-sm flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" /> Anamnesis
            </TabsTrigger>
            <TabsTrigger value="registros" className="rounded-lg text-sm">Registros ({registros.length})</TabsTrigger>
            <TabsTrigger value="objetivos" className="rounded-lg text-sm flex items-center gap-1.5">
              <LayoutDashboard className="h-3.5 w-3.5" /> Plan Terapéutico
              {goals.length > 0 && (
                <span className="ml-0.5 bg-primary/10 text-primary text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {goals.filter(g => g.status !== "archivado").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sugerencias" className="rounded-lg text-sm flex items-center gap-1">
              <Lightbulb className="h-3.5 w-3.5" /> Sugerencias
            </TabsTrigger>
            <TabsTrigger value="informe" className="rounded-lg text-sm flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> Informe
            </TabsTrigger>
          </TabsList>

          {/* ── Anamnesis ───────────────────────────────────────────────── */}
          <TabsContent value="anamnesis" className="mt-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" /> Anamnesis
                  </CardTitle>
                  {anDirty && (
                    <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" /> Cambios sin guardar
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                {/* Motivo de consulta */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/70 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" /> Motivo de consulta
                  </label>
                  <Textarea
                    value={anMotivo}
                    onChange={e => { setAnMotivo(e.target.value); setAnDirty(true); }}
                    placeholder="¿Por qué consulta? Describe el motivo principal de consulta y las preocupaciones del paciente o familia…"
                    rows={3}
                    className="resize-none text-sm bg-muted/50"
                  />
                </div>

                {/* Antecedentes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/70 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-muted-foreground" /> Antecedentes relevantes
                  </label>
                  <Textarea
                    value={anAntecedentes}
                    onChange={e => { setAnAntecedentes(e.target.value); setAnDirty(true); }}
                    placeholder="Antecedentes médicos, psicológicos, del desarrollo, intervenciones anteriores…"
                    rows={3}
                    className="resize-none text-sm bg-muted/50"
                  />
                </div>

                {/* Historia familiar */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/70 flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5 text-muted-foreground" /> Historia familiar
                  </label>
                  <Textarea
                    value={anFamilia}
                    onChange={e => { setAnFamilia(e.target.value); setAnDirty(true); }}
                    placeholder="Composición familiar, dinámica del hogar, factores familiares relevantes…"
                    rows={3}
                    className="resize-none text-sm bg-muted/50"
                  />
                </div>

                {/* Escolaridad */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/70 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground" /> Escolaridad
                  </label>
                  <Textarea
                    value={anEscolaridad}
                    onChange={e => { setAnEscolaridad(e.target.value); setAnDirty(true); }}
                    placeholder="Nivel educativo, establecimiento, rendimiento escolar, adaptación, apoyos pedagógicos…"
                    rows={2}
                    className="resize-none text-sm bg-muted/50"
                  />
                </div>

                {/* Observaciones generales */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/70 flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" /> Observaciones generales
                  </label>
                  <Textarea
                    value={anObs}
                    onChange={e => { setAnObs(e.target.value); setAnDirty(true); }}
                    placeholder="Otras observaciones clínicas relevantes, aspectos conductuales, contextuales…"
                    rows={3}
                    className="resize-none text-sm bg-muted/50"
                  />
                </div>

                {/* Save */}
                <div className="flex justify-end pt-2 border-t border-border/50">
                  <Button
                    onClick={handleSaveAnamnesis}
                    disabled={isSavingAn}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingAn ? "Guardando…" : "Guardar anamnesis"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Registros ───────────────────────────────────────────────── */}
          <TabsContent value="registros" className="mt-6">
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Registros clínicos</CardTitle>
                  <Button size="sm" onClick={() => navigate(`/nueva-sesion?patientId=${patientId}`)} className="bg-primary hover:bg-primary/90 text-white h-8 text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Nueva sesión
                  </Button>
                </div>
              </CardHeader>
              <div className="divide-y divide-border/40">
                {registros.length > 0 ? (
                  [...registros].sort((a, b) => b.fecha.localeCompare(a.fecha)).map(r => {
                    const isExpanded = expanded === r.id;
                    // Build a short session title: date + first line of resumen
                    const shortTitle = r.resumenSesion
                      ? r.resumenSesion.split(/[\n.]/)[0].slice(0, 60).trim()
                      : null;
                    return (
                      <div key={r.id} className="p-4">
                        {/* Row: date + title + actions */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                              <ClipboardList className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-foreground text-sm">
                                  {formatFecha(r.fecha)}
                                </p>
                                {shortTitle && (
                                  <>
                                    <span className="text-muted-foreground/40">–</span>
                                    <p className="text-sm text-foreground/70 truncate">{shortTitle}</p>
                                  </>
                                )}
                              </div>
                              {r.professionalName && (
                                <p className="text-xs text-muted-foreground mt-0.5">{r.professionalName}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setEditingRegistro(r)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary border border-border hover:border-primary/40 rounded-lg transition-all hover:bg-primary/5"
                            >
                              <Pencil className="h-3 w-3" /> Editar
                            </button>
                            <button
                              onClick={() => setExpanded(isExpanded ? null : r.id)}
                              className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                            >
                              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </button>
                          </div>
                        </div>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="mt-3 ml-11 space-y-2.5">
                            {r.resumenSesion && (
                              <p className="text-sm text-foreground/80 leading-relaxed">{r.resumenSesion}</p>
                            )}
                            <div className="grid sm:grid-cols-2 gap-2">
                              {r.observaciones && (
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                                  <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                                    <Eye className="h-3.5 w-3.5" /> Observaciones
                                  </p>
                                  <p className="text-sm text-amber-900">{r.observaciones}</p>
                                </div>
                              )}
                              {r.recomendacionesHogar && (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                                  <p className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                                    <Home className="h-3.5 w-3.5" /> Para el hogar
                                  </p>
                                  <p className="text-sm text-emerald-900">{r.recomendacionesHogar}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-muted-foreground text-sm">Sin registros clínicos para este paciente.</div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* ── Plan Terapéutico ─────────────────────────────────────── */}
          <TabsContent value="objetivos" className="mt-6 space-y-5">

            {/* Plan overview card */}
            <PlanOverviewCard
              activeGoals={activeGoals}
              inProgressGoals={inProgressGoals}
              achievedGoals={achievedGoals}
              archivedGoals={archivedGoals}
            />

            {/* Action bar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Objetivos del plan
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBankDialog(true)}
                  className="h-9 text-sm border-primary/30 text-primary hover:bg-primary/5"
                >
                  <Library className="h-4 w-4 mr-1.5" /> Desde el banco
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowGoalForm(true)}
                  className="h-9 text-sm bg-primary hover:bg-primary/90 text-white"
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Nuevo objetivo
                </Button>
              </div>
            </div>

            {/* Active goals */}
            {activeGoals.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary inline-block" /> Activos ({activeGoals.length})
                </h3>
                {activeGoals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} onCycle={cycleGoalStatus} onProgress={setProgressGoal} />
                ))}
              </div>
            )}

            {/* In progress goals */}
            {inProgressGoals.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" /> En progreso ({inProgressGoals.length})
                </h3>
                {inProgressGoals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} onCycle={cycleGoalStatus} onProgress={setProgressGoal} />
                ))}
              </div>
            )}

            {/* Achieved goals */}
            {achievedGoals.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> Logrados ({achievedGoals.length})
                </h3>
                {achievedGoals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} onCycle={cycleGoalStatus} onProgress={setProgressGoal} muted />
                ))}
              </div>
            )}

            {/* Archived goals */}
            {archivedGoals.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/25 inline-block" /> Archivados ({archivedGoals.length})
                </h3>
                {archivedGoals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} onCycle={cycleGoalStatus} onProgress={setProgressGoal} muted />
                ))}
              </div>
            )}

            {goals.length === 0 && (
              <div className="py-16 text-center bg-card rounded-2xl border border-dashed border-border">
                <Target className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Sin objetivos definidos</p>
                <p className="text-muted-foreground text-sm mt-1">Agrega objetivos desde el banco clínico o crea uno personalizado.</p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => setShowBankDialog(true)}>
                    <Library className="h-3.5 w-3.5 mr-1.5" /> Desde el banco
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowGoalForm(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Objetivo personalizado
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Sugerencias ─────────────────────────────────────────────── */}
          <TabsContent value="sugerencias" className="mt-6">
            <SuggestionsTab
              patientId={patientId}
              patientName={patient.name}
              onAssigned={invalidateGoals}
            />
          </TabsContent>

          {/* ── Informe ──────────────────────────────────────────────────── */}
          <TabsContent value="informe" className="mt-6">
            <InformeTab
              patient={patient as any}
              goals={goals}
              registros={registros}
              onSave={handleSaveInforme}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Edit Patient Dialog ───────────────────────────────────────────── */}
      {showEditPatient && (
        <Dialog open onOpenChange={(o) => { if (!o && !isSavingPatient) setShowEditPatient(false); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-xl flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" /> Editar paciente
              </DialogTitle>
              <DialogDescription>Actualiza los datos de {patient?.name}.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/70">Nombre <span className="text-red-400">*</span></label>
                <Input value={epName} onChange={e => setEpName(e.target.value)} placeholder="Nombre completo" className="bg-muted/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/70">Edad</label>
                  <Input value={epAge} onChange={e => setEpAge(e.target.value)} placeholder="Ej. 8" type="number" min={0} max={120} className="bg-muted/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/70">Profesional a cargo</label>
                  <Input value={epProf} onChange={e => setEpProf(e.target.value)} placeholder="Nombre del profesional" className="bg-muted/50" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/70">Diagnóstico</label>
                <Select value={epDiagnosis || "__none"} onValueChange={v => setEpDiagnosis(v === "__none" ? "" : v)}>
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Seleccionar diagnóstico…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Sin diagnóstico registrado</SelectItem>
                    {DIAGNOSES.map(d => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/70">Notas generales</label>
                <Textarea value={epObs} onChange={e => setEpObs(e.target.value)} placeholder="Observaciones generales del paciente…" rows={3} className="bg-muted/50 resize-none text-sm" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowEditPatient(false)} disabled={isSavingPatient}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSavePatient} disabled={!epName.trim() || isSavingPatient}>
                <Save className="h-4 w-4 mr-1.5" /> {isSavingPatient ? "Guardando…" : "Guardar cambios"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Edit Registro Dialog ──────────────────────────────────────────── */}
      {editingRegistro && (
        <Dialog open onOpenChange={(o) => { if (!o && !isSavingRegistro) { stopRecordingEr(); setEditingRegistro(null); } }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display text-xl flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" /> Editar registro clínico
              </DialogTitle>
              <DialogDescription>Sesión del {formatFecha(editingRegistro.fecha)}.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/70">Fecha</label>
                <Input type="date" value={erFecha} onChange={e => setErFecha(e.target.value)} className="bg-muted/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/70">Resumen de sesión</label>
                <Textarea value={erResumen} onChange={e => setErResumen(e.target.value)} placeholder="¿Qué se trabajó en la sesión?" rows={3} className="bg-muted/50 resize-none text-sm" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground/70">Observaciones clínicas</label>
                  {hasSpeechSupport && (
                    <button
                      type="button"
                      onClick={isRecordingEr ? stopRecordingEr : startRecordingEr}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg border transition-all ${
                        isRecordingEr
                          ? "bg-red-50 border-red-200 text-red-600 animate-pulse"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {isRecordingEr
                        ? <><MicOff className="h-3.5 w-3.5" /> Detener</>
                        : <><Mic className="h-3.5 w-3.5" /> Grabar</>}
                    </button>
                  )}
                </div>
                <Textarea
                  value={erObs}
                  onChange={e => setErObs(e.target.value)}
                  placeholder={isRecordingEr ? "Escuchando… habla ahora" : "Observaciones clínicas relevantes…"}
                  rows={3}
                  className={`resize-none text-sm transition-colors ${isRecordingEr ? "bg-red-50/40 border-red-200" : "bg-muted/50"}`}
                />
                {isRecordingEr && (
                  <p className="text-xs text-red-500 flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-ping" />
                    Grabando… el texto se insertará automáticamente
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/70">Recomendaciones para el hogar</label>
                <Textarea value={erHogar} onChange={e => setErHogar(e.target.value)} placeholder="Actividades sugeridas para casa…" rows={2} className="bg-muted/50 resize-none text-sm" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { stopRecordingEr(); setEditingRegistro(null); }} disabled={isSavingRegistro}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSaveEditRegistro} disabled={!erFecha || isSavingRegistro}>
                <Save className="h-4 w-4 mr-1.5" /> {isSavingRegistro ? "Guardando…" : "Guardar cambios"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create clinical record dialog */}
      {showRegForm && (
        <Dialog open onOpenChange={() => !isSavingRC && setShowRegForm(false)}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="font-display text-xl flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" /> Nuevo registro clínico
              </DialogTitle>
              <DialogDescription>Sesión clínica para <strong>{patient.name}</strong>. Marca los objetivos trabajados hoy.</DialogDescription>
            </DialogHeader>
            <RegistroForm
              patientId={patientId}
              workingGoals={[...activeGoals, ...inProgressGoals]}
              onSave={handleSaveRegistro}
              isSaving={isSavingRC}
              onClose={() => setShowRegForm(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Create custom goal dialog */}
      {showGoalForm && (
        <CustomGoalDialog
          onClose={() => setShowGoalForm(false)}
          onCreated={(libraryGoal) => {
            assignGoalFromLibrary.mutate(
              { id: libraryGoal.id, data: { patientId } },
              {
                onSuccess: () => {
                  invalidateGoals();
                  setShowGoalForm(false);
                  toast({ title: "Objetivo creado y asignado al plan terapéutico" });
                },
                onError: () => {
                  invalidateGoals();
                  setShowGoalForm(false);
                  toast({ title: "Objetivo creado", description: "Puedes asignarlo desde el banco de objetivos." });
                },
              }
            );
          }}
        />
      )}

      {/* Progress tracking dialog */}
      {progressGoal && (
        <GoalProgressDialog
          goal={progressGoal}
          registros={registros}
          onClose={() => setProgressGoal(null)}
          onUpdated={() => { invalidateGoals(); setProgressGoal(null); }}
        />
      )}

      {/* Add from bank dialog */}
      {showBankDialog && (
        <AddFromBankDialog
          patientId={patientId}
          existingGoalLibraryIds={goals.map(g => g.goalLibraryId).filter(Boolean) as number[]}
          onClose={() => setShowBankDialog(false)}
          onAssigned={() => {
            invalidateGoals();
            setShowBankDialog(false);
          }}
        />
      )}
    </AppLayout>
  );
}

// ─── Goal Progress Bar ────────────────────────────────────────────────────────
function goalProgressPct(status: string): number {
  if (status === "logrado")     return 100;
  if (status === "en progreso") return 55;
  if (status === "activo")      return 15;
  return 0;
}
function goalProgressColor(status: string): string {
  if (status === "logrado")     return "bg-emerald-500";
  if (status === "en progreso") return "bg-amber-400";
  return "bg-primary";
}

// ─── Goal Card ────────────────────────────────────────────────────────────────
function GoalCard({ goal, onCycle, onProgress, muted = false }: {
  goal: Goal; onCycle: (g: Goal) => void; onProgress: (g: Goal) => void; muted?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const ac = getAreaColor(goal.areaClinica ?? goal.category);
  const isStruck = goal.status === "archivado" || goal.status === "suspendido";
  const pct = goal.progressPct != null ? goal.progressPct : goalProgressPct(goal.status);
  const barColor = goalProgressColor(goal.status);

  const { data: actData } = useQuery<{ activities: any[]; libraryEntry: any | null }>({
    queryKey: ["goal-activities", goal.id],
    queryFn: async () => {
      const res = await fetch(`/api/goals/${goal.id}/activities`);
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    enabled: expanded,
  });

  const clinicActs = (actData?.activities ?? []).filter((a: any) => a.tipo === "clinica");
  const familyActs  = (actData?.activities ?? []).filter((a: any) => a.tipo !== "clinica");
  const lib = actData?.libraryEntry;

  const daysRemaining = goal.targetDate
    ? Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <Card className={`border-border/50 shadow-sm transition-all ${muted ? "opacity-75" : ""}`}>
      <CardContent className="p-0">
        {/* Progress bar at top */}
        {goal.status !== "archivado" && goal.status !== "suspendido" && (
          <div className="h-1 w-full bg-muted rounded-t-xl overflow-hidden">
            <div className={`h-full ${barColor} transition-all duration-500 rounded-t-xl`} style={{ width: `${pct}%` }} />
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Status cycle button */}
            <button
              onClick={() => onCycle(goal)}
              className="shrink-0 mt-0.5 hover:scale-110 transition-transform"
              title={`Pasar a: ${STATUS_LABELS[STATUS_CYCLE[goal.status] ?? "activo"]}`}
            >
              <GoalStatusIcon status={goal.status} />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {goal.codigo && (
                  <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {goal.codigo}
                  </span>
                )}
                <p className={`font-semibold text-foreground leading-snug ${isStruck ? "line-through text-muted-foreground" : ""}`}>
                  {goal.title}
                </p>
              </div>

              {!expanded && goal.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{goal.description}</p>
              )}

              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge variant="outline" className={`text-xs border ${STATUS_STYLE[goal.status] ?? ""}`}>
                  {STATUS_LABELS[goal.status] ?? goal.status}
                </Badge>
                {(goal.areaClinica || goal.category) && (
                  <Badge variant="secondary" className={`text-xs border-0 ${ac.bg} ${ac.text}`}>
                    {goal.areaClinica ?? goal.category}
                  </Badge>
                )}
                {goal.nivelDificultad && (
                  <Badge variant="outline" className={`text-xs border ${NIVEL_COLORS[goal.nivelDificultad] ?? ""}`}>
                    {goal.nivelDificultad}
                  </Badge>
                )}
                {goal.franjaEtaria && <span className="text-xs text-muted-foreground self-center">{goal.franjaEtaria} años</span>}
              </div>

              {/* Progress indicator */}
              {goal.status !== "archivado" && goal.status !== "suspendido" && (
                <div className="flex items-center gap-1.5 mt-2.5">
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{pct}%</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => onProgress(goal)}
                title="Registrar seguimiento"
                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
              >
                <History className="h-4 w-4" />
              </button>
              <button
                onClick={() => setExpanded(e => !e)}
                title={expanded ? "Colapsar detalle" : "Ver actividades y detalle"}
                className="p-1.5 text-muted-foreground hover:text-foreground/80 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Expandable detail panel ────────────────────────────────────── */}
        {expanded && (
          <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-4">

            {/* Dates row */}
            {(goal.fechaAsignacion || goal.targetDate) && (
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                {goal.fechaAsignacion && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" /> Asignado: {formatFecha(goal.fechaAsignacion)}
                  </span>
                )}
                {goal.targetDate && daysRemaining !== null && (
                  <span className={`flex items-center gap-1 font-medium ${daysRemaining < 0 ? "text-red-500" : daysRemaining <= 14 ? "text-amber-600" : "text-muted-foreground"}`}>
                    <Flag className="h-3 w-3" />
                    Meta: {formatFecha(goal.targetDate)}
                    {daysRemaining >= 0
                      ? ` · ${daysRemaining} día${daysRemaining !== 1 ? "s" : ""} restante${daysRemaining !== 1 ? "s" : ""}`
                      : ` · Vencido hace ${Math.abs(daysRemaining)} día${Math.abs(daysRemaining) !== 1 ? "s" : ""}`}
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            {goal.description && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Descripción</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{goal.description}</p>
              </div>
            )}

            {/* Loading skeleton */}
            {!actData && (
              <div className="space-y-2 animate-pulse">
                <div className="h-3 w-32 bg-muted rounded" />
                <div className="h-9 bg-muted rounded-lg" />
                <div className="h-9 bg-muted rounded-lg" />
              </div>
            )}

            {/* Library: definición operativa */}
            {lib?.definicionOperativa && (
              <div className={`${ac.bg} border ${ac.border} rounded-xl p-3`}>
                <p className={`text-xs font-semibold ${ac.text} uppercase tracking-wide mb-1`}>Definición operativa</p>
                <p className="text-xs text-foreground/80 leading-relaxed">{lib.definicionOperativa}</p>
              </div>
            )}

            {/* Library: meta tiles */}
            {(lib?.metaPorcentaje || lib?.indicadorTipo || lib?.intentosSugeridos) && (
              <div className="grid grid-cols-3 gap-2">
                {lib?.metaPorcentaje && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 text-center">
                    <p className="text-base font-bold text-emerald-700">{lib.metaPorcentaje}</p>
                    <p className="text-xs text-emerald-600">Meta</p>
                  </div>
                )}
                {lib?.indicadorTipo && (
                  <div className="bg-teal-50 border border-teal-100 rounded-xl p-2.5 text-center">
                    <p className="text-xs font-bold text-teal-700 capitalize">{lib.indicadorTipo}</p>
                    <p className="text-xs text-teal-600">Indicador</p>
                  </div>
                )}
                {lib?.intentosSugeridos && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-2.5 text-center">
                    <p className="text-xs font-bold text-amber-700">{lib.intentosSugeridos}</p>
                    <p className="text-xs text-amber-600">Intentos</p>
                  </div>
                )}
              </div>
            )}

            {/* Clinical activities */}
            {clinicActs.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Stethoscope className="h-3.5 w-3.5 text-primary" /> Actividades clínicas
                </p>
                <div className="space-y-1.5">
                  {clinicActs.map((a: any) => (
                    <div key={a.id} className="flex items-start gap-2 text-sm text-foreground/80 bg-primary/[0.04] border border-primary/10 rounded-lg px-3 py-2 leading-snug">
                      <Activity className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{a.titulo}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Family/home activities */}
            {familyActs.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Home className="h-3.5 w-3.5 text-emerald-600" /> Para el hogar / familia
                </p>
                <div className="space-y-1.5">
                  {familyActs.map((a: any) => (
                    <div key={a.id} className="flex items-start gap-2 text-sm text-foreground/80 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 leading-snug">
                      <Home className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{a.titulo}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fallback: library text when no structured activities */}
            {actData && clinicActs.length === 0 && lib?.actividadesClinicas && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Stethoscope className="h-3.5 w-3.5 text-primary" /> Actividades clínicas
                </p>
                <div className="bg-primary/[0.04] border border-primary/10 rounded-xl p-3">
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{lib.actividadesClinicas}</p>
                </div>
              </div>
            )}
            {actData && familyActs.length === 0 && lib?.actividadesFamilia && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Home className="h-3.5 w-3.5 text-emerald-600" /> Para el hogar / familia
                </p>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{lib.actividadesFamilia}</p>
                </div>
              </div>
            )}

            {/* No activities anywhere */}
            {actData && clinicActs.length === 0 && familyActs.length === 0 && !lib?.actividadesClinicas && !lib?.actividadesFamilia && !lib?.definicionOperativa && !goal.description && (
              <p className="text-xs text-muted-foreground text-center py-1">Sin actividades vinculadas al banco</p>
            )}

            {/* Notas del profesional */}
            {goal.notas && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Nota del profesional
                </p>
                <p className="text-xs text-amber-900 leading-relaxed">{goal.notas}</p>
              </div>
            )}

            {/* Clinical recommendation */}
            {lib?.recomendacionClinica && (
              <div className="bg-muted/50 border border-border rounded-xl p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Recomendación clínica
                </p>
                <p className="text-xs text-foreground/80 leading-relaxed">{lib.recomendacionClinica}</p>
              </div>
            )}

            {/* Quick action */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onProgress(goal)}
              className="w-full h-8 text-xs border-primary/30 text-primary hover:bg-primary/5"
            >
              <History className="h-3.5 w-3.5 mr-1.5" /> Registrar seguimiento de esta sesión
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Goal Progress Dialog ─────────────────────────────────────────────────────
function GoalProgressDialog({ goal, registros, onClose, onUpdated }: {
  goal: Goal; registros: RC[]; onClose: () => void; onUpdated: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [nota, setNota] = useState("");
  const [newStatus, setNewStatus] = useState(goal.status);
  const [sessionId, setSessionId] = useState<string>("none");
  const [checkedActs, setCheckedActs] = useState<Set<number>>(new Set());
  const statusDerived = goalProgressPct(goal.status);
  const [customPct, setCustomPct] = useState<number>(
    goal.progressPct != null ? goal.progressPct : statusDerived
  );

  const { data: historyRaw = [], isLoading: loadingHistory, refetch } = useQuery<ProgressEntry[]>({
    queryKey: ["goal-progress", goal.id],
    queryFn: async () => {
      const res = await fetch(`/api/goals/${goal.id}/progress`);
      if (!res.ok) throw new Error("Error cargando historial");
      return res.json();
    },
  });
  const history = historyRaw as ProgressEntry[];

  const { data: actData } = useQuery<{ activities: any[]; libraryEntry: any | null }>({
    queryKey: ["goal-activities", goal.id],
    queryFn: async () => {
      const res = await fetch(`/api/goals/${goal.id}/activities`);
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });
  const allActivities = actData?.activities ?? [];

  const toggleAct = (id: number) => {
    setCheckedActs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const buildFinalNota = () => {
    const parts: string[] = [];
    if (nota.trim()) parts.push(nota.trim());
    if (checkedActs.size > 0) {
      const titles = allActivities.filter(a => checkedActs.has(a.id)).map(a => `• ${a.titulo}`);
      parts.push(`Actividades realizadas en sesión:\n${titles.join("\n")}`);
    }
    return parts.join("\n\n");
  };

  const originalPct = goal.progressPct != null ? goal.progressPct : statusDerived;
  const pctChanged = customPct !== originalPct;

  const addProgress = useMutation({
    mutationFn: async () => {
      const finalNota = buildFinalNota();
      const res = await fetch(`/api/goals/${goal.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nota: finalNota || undefined,
          statusNuevo: newStatus !== goal.status ? newStatus : undefined,
          progressPct: customPct,
          registroClinicoId: sessionId !== "none" ? parseInt(sessionId) : undefined,
        }),
      });
      if (!res.ok) throw new Error("Error guardando seguimiento");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Seguimiento guardado", description: "El progreso fue registrado correctamente." });
      queryClient.invalidateQueries({ queryKey: ["goal-progress", goal.id] });
      queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey({ patientId: goal.patientId }) });
      queryClient.invalidateQueries({ queryKey: ["patient-timeline"] });
      setNota("");
      setCheckedActs(new Set());
      refetch();
      onUpdated();
    },
    onError: () => toast({ title: "Error al guardar", variant: "destructive" }),
  });

  const ac = getAreaColor(goal.areaClinica ?? goal.category);
  const barColor = goalProgressColor(newStatus);
  const canSave = nota.trim() || checkedActs.size > 0 || newStatus !== goal.status || pctChanged;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> Seguimiento del objetivo
          </DialogTitle>
          <DialogDescription>
            Registra el progreso, actividades realizadas y cambio de estado.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Goal info header */}
          <div className={`rounded-xl border ${ac.border} ${ac.bg} p-4`}>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {goal.codigo && <span className={`text-xs font-mono font-bold ${ac.text}`}>{goal.codigo}</span>}
              <Badge variant="outline" className={`text-xs border ${STATUS_STYLE[goal.status] ?? ""}`}>
                {STATUS_LABELS[goal.status] ?? goal.status}
              </Badge>
              {goal.nivelDificultad && (
                <Badge variant="outline" className={`text-xs border ${NIVEL_COLORS[goal.nivelDificultad] ?? ""}`}>
                  {goal.nivelDificultad}
                </Badge>
              )}
            </div>
            <p className={`font-semibold text-sm ${ac.text}`}>{goal.title}</p>
            {goal.description && <p className={`text-xs ${ac.text} opacity-70 mt-1 line-clamp-2`}>{goal.description}</p>}
          </div>

          {/* ── Activities checklist (structured) ───────────────────────── */}
          {allActivities.length > 0 && (
            <div className="border border-border rounded-xl p-4 bg-muted/30 space-y-3">
              <p className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Actividades de esta sesión
                {checkedActs.size > 0 && (
                  <span className="ml-auto text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {checkedActs.size} marcada{checkedActs.size !== 1 ? "s" : ""}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">Marca las actividades realizadas — se incluirán en la nota automáticamente.</p>

              {/* Clinical activities */}
              {allActivities.filter(a => a.tipo === "clinica").length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5 text-primary" /> Clínicas
                  </p>
                  {allActivities.filter(a => a.tipo === "clinica").map((a: any) => (
                    <button
                      key={a.id}
                      onClick={() => toggleAct(a.id)}
                      className={`w-full flex items-start gap-2.5 text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                        checkedActs.has(a.id)
                          ? "bg-primary/10 border-primary/30 text-primary font-medium"
                          : "bg-muted/50 border-border text-foreground/80 hover:border-primary/30 hover:bg-primary/[0.04]"
                      }`}
                    >
                      {checkedActs.has(a.id)
                        ? <CheckSquare className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                        : <Square className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/40" />
                      }
                      <span className="leading-snug">{a.titulo}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Family activities */}
              {allActivities.filter(a => a.tipo !== "clinica").length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5 text-emerald-600" /> Para el hogar
                  </p>
                  {allActivities.filter(a => a.tipo !== "clinica").map((a: any) => (
                    <button
                      key={a.id}
                      onClick={() => toggleAct(a.id)}
                      className={`w-full flex items-start gap-2.5 text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                        checkedActs.has(a.id)
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-medium"
                          : "bg-muted/50 border-border text-foreground/80 hover:border-emerald-200 hover:bg-emerald-50/50"
                      }`}
                    >
                      {checkedActs.has(a.id)
                        ? <CheckSquare className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                        : <Square className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/40" />
                      }
                      <span className="leading-snug">{a.titulo}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Text activities from library (when no structured ones) ─── */}
          {actData && allActivities.length === 0 && (actData.libraryEntry?.actividadesClinicas || actData.libraryEntry?.actividadesFamilia) && (
            <div className="border border-border rounded-xl p-4 bg-muted/30 space-y-3">
              <p className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Actividades sugeridas
              </p>
              <p className="text-xs text-muted-foreground">Referencia del banco clínico para este objetivo.</p>
              {actData.libraryEntry?.actividadesClinicas && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5 text-primary" /> Clínicas
                  </p>
                  <div className="bg-primary/[0.04] border border-primary/10 rounded-lg p-3">
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{actData.libraryEntry.actividadesClinicas}</p>
                  </div>
                </div>
              )}
              {actData.libraryEntry?.actividadesFamilia && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5 text-emerald-600" /> Para el hogar
                  </p>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{actData.libraryEntry.actividadesFamilia}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Progress note form ───────────────────────────────────────── */}
          <div className="space-y-3 border border-border rounded-xl p-4 bg-white">
            <p className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" /> Nota de progreso
            </p>
            <Textarea
              value={nota}
              onChange={e => setNota(e.target.value)}
              placeholder="Describe el progreso observado, logros, dificultades..."
              rows={3}
              className="bg-muted/50 resize-none text-sm"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Sesión asociada</label>
                <Select value={sessionId} onValueChange={setSessionId}>
                  <SelectTrigger className="bg-muted/50 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin sesión</SelectItem>
                    {registros.map(r => (
                      <SelectItem key={r.id} value={r.id.toString()}>
                        {formatFecha(r.fecha)}{r.professionalName ? ` — ${r.professionalName}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Estado del objetivo</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="bg-muted/50 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="en progreso">En progreso</SelectItem>
                    <SelectItem value="logrado">Logrado ✓</SelectItem>
                    <SelectItem value="archivado">Archivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Progress slider */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 shrink-0">
                  <BarChart3 className="h-3.5 w-3.5 text-primary" /> Progreso del objetivo
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0} max={100} step={5}
                    value={customPct}
                    aria-label="Porcentaje de progreso"
                    onChange={e => {
                      const v = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                      setCustomPct(v);
                      if (v === 100 && newStatus !== "logrado") setNewStatus("logrado");
                      else if (v === 0 && newStatus === "logrado") setNewStatus("activo");
                      else if (v > 0 && v < 100 && newStatus === "activo") setNewStatus("en progreso");
                    }}
                    className={`w-16 text-center text-sm font-bold tabular-nums border rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary/30 ${
                      customPct >= 100 ? "text-emerald-600 border-emerald-300 bg-emerald-50" :
                      customPct >= 60  ? "text-amber-600 border-amber-300 bg-amber-50"   :
                      "text-primary border-primary/30 bg-primary/5"
                    }`}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <input
                type="range"
                min={0} max={100} step={5}
                value={customPct}
                aria-label="Barra de progreso deslizable"
                onChange={e => {
                  const v = Number(e.target.value);
                  setCustomPct(v);
                  if (v === 100 && newStatus !== "logrado") setNewStatus("logrado");
                  else if (v === 0 && newStatus === "logrado") setNewStatus("activo");
                  else if (v > 0 && v < 100 && newStatus === "activo") setNewStatus("en progreso");
                }}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${
                    customPct >= 100 ? "#10b981" : customPct >= 60 ? "#f59e0b" : "#0ea5e9"
                  } ${customPct}%, #e2e8f0 ${customPct}%)`,
                }}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground select-none px-0.5">
                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} rounded-full transition-all duration-300`}
                  style={{ width: `${customPct}%` }}
                />
              </div>
              {customPct === 100 && (
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> El objetivo se marcará como logrado
                </p>
              )}
            </div>

            <Button
              onClick={() => addProgress.mutate()}
              disabled={!canSave || addProgress.isPending}
              className="w-full bg-primary hover:bg-primary/90 h-9"
            >
              {addProgress.isPending ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : (
                <><Send className="h-4 w-4 mr-1.5" /> Guardar seguimiento</>
              )}
            </Button>
          </div>

          {/* ── History timeline ─────────────────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" /> Historial de seguimiento
            </p>
            {loadingHistory ? (
              <div className="space-y-2">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                Sin notas de seguimiento aún.
              </div>
            ) : (
              <div className="space-y-2">
                {history.map(entry => (
                  <div key={entry.id} className="bg-white border border-border rounded-xl p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs text-muted-foreground">{formatTs(entry.createdAt)}</span>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
                        {entry.progressPct != null && (
                          <span className="text-xs font-bold tabular-nums text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                            {entry.progressPct}%
                          </span>
                        )}
                        {entry.statusAnterior !== entry.statusNuevo && (
                          <>
                            <Badge variant="outline" className={`text-xs border ${STATUS_STYLE[entry.statusAnterior ?? "activo"] ?? ""}`}>
                              {STATUS_LABELS[entry.statusAnterior ?? "activo"] ?? entry.statusAnterior}
                            </Badge>
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            <Badge variant="outline" className={`text-xs border ${STATUS_STYLE[entry.statusNuevo ?? "activo"] ?? ""}`}>
                              {STATUS_LABELS[entry.statusNuevo ?? "activo"] ?? entry.statusNuevo}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                    {entry.progressPct != null && (
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${goalProgressColor(entry.statusNuevo ?? "activo")}`}
                          style={{ width: `${entry.progressPct}%` }}
                        />
                      </div>
                    )}
                    {entry.nota && <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{entry.nota}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Suggestions Tab ──────────────────────────────────────────────────────────
function SuggestionsTab({ patientId, patientName, onAssigned }: {
  patientId: number; patientName: string; onAssigned: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const assign = useAssignGoalToPatient();
  const [assigning, setAssigning] = useState<number | null>(null);

  const { data: suggestions = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["patient-suggested-goals", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}/suggested-goals`);
      if (!res.ok) throw new Error("Error cargando sugerencias");
      return res.json();
    },
  });

  const handleAssign = (goal: any) => {
    setAssigning(goal.id);
    assign.mutate(
      { id: goal.id, data: { patientId } },
      {
        onSuccess: () => {
          onAssigned();
          queryClient.invalidateQueries({ queryKey: ["patient-suggested-goals", patientId] });
          toast({ title: "Objetivo asignado", description: `"${goal.nombreObjetivo}" fue agregado al plan de intervención.` });
          setAssigning(null);
        },
        onError: (e: any) => { toast({ title: "Error al asignar", description: e.message, variant: "destructive" }); setAssigning(null); },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/15 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Sugerencias inteligentes</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Objetivos seleccionados automáticamente según la edad, diagnóstico y área clínica de <strong>{patientName}</strong>. Los objetivos ya asignados no aparecen aquí.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : suggestions.length === 0 ? (
        <div className="py-16 text-center bg-card rounded-2xl border border-dashed border-border">
          <Star className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="font-medium text-foreground/70">No hay sugerencias disponibles</p>
          <p className="text-muted-foreground text-sm mt-1">Es posible que todos los objetivos relevantes ya estén asignados, o que falte información de diagnóstico/edad.</p>
          <Button size="sm" variant="outline" className="mt-4" onClick={() => refetch()}>Actualizar sugerencias</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((goal: any) => {
            const ac = getAreaColor(goal.areaClinica ?? goal.area);
            const isAssigning = assigning === goal.id;
            return (
              <Card key={goal.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`shrink-0 text-xs font-mono font-bold px-2 py-1 rounded-lg ${ac.bg} ${ac.text} border ${ac.border} whitespace-nowrap mt-0.5`}>
                      {goal.idObjetivo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground leading-snug">{goal.nombreObjetivo}</p>
                      {goal.definicionOperativa && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{goal.definicionOperativa}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge variant="secondary" className={`text-xs border-0 ${ac.bg} ${ac.text}`}>
                          {goal.areaClinica ?? goal.area}
                        </Badge>
                        {goal.subarea && <span className="text-xs text-muted-foreground self-center">{goal.subarea}</span>}
                        {goal.nivelDificultad && (
                          <Badge variant="outline" className={`text-xs border ${NIVEL_COLORS[goal.nivelDificultad] ?? ""}`}>
                            {goal.nivelDificultad}
                          </Badge>
                        )}
                        {goal.franjaEtaria && <span className="text-xs text-muted-foreground self-center">{goal.franjaEtaria} años</span>}
                      </div>
                      {goal.habilidadesRelacionadas && (
                        <p className="text-xs text-muted-foreground mt-1.5 italic">Habilidades: {goal.habilidadesRelacionadas}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAssign(goal)}
                      disabled={isAssigning || assign.isPending}
                      className="shrink-0 h-8 text-xs bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/20"
                    >
                      {isAssigning ? (
                        <span className="flex items-center gap-1"><span className="h-3 w-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />Asignando</span>
                      ) : (
                        <><Plus className="h-3.5 w-3.5 mr-1" />Asignar</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          <p className="text-xs text-muted-foreground text-center pt-1">Mostrando los {suggestions.length} objetivos más relevantes para este paciente.</p>
        </div>
      )}
    </div>
  );
}

// ─── Forms ────────────────────────────────────────────────────────────────────
function GoalFormInline({ patientId, onSave, isSaving, onClose }: {
  patientId: number; onSave: (d: any) => void; isSaving: boolean; onClose: () => void;
}) {
  const [form, setForm] = useState({
    codigo: "",
    title: "",
    description: "",
    areaClinica: "lenguaje",
    subarea: "",
    nivelDificultad: "básico",
    franjaEtariaMin: "" as string,
    franjaEtariaMax: "" as string,
    targetDate: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const handleAreaChange = (v: string) => setForm(f => ({ ...f, areaClinica: v, subarea: "" }));

  const subareaOptions = AREA_SUBAREAS[form.areaClinica] ?? [];

  const codeParams = {
    areaClinica: form.areaClinica,
    franjaEtariaMin: form.franjaEtariaMin !== "" ? parseInt(form.franjaEtariaMin) : null,
    franjaEtariaMax: form.franjaEtariaMax !== "" ? parseInt(form.franjaEtariaMax) : null,
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

  return (
    <div className="space-y-4 py-2">
      {/* Code generator — shown first so user sees it while filling in fields */}
      <GoalCodePreview
        params={codeParams}
        value={form.codigo}
        onChange={v => set("codigo", v)}
        onGenerate={handleGenerate}
      />

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground/80">Título del objetivo *</label>
        <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Ampliar vocabulario sustantivo en contexto funcional..." className="bg-muted/50" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground/80">Descripción / Definición operativa</label>
        <Textarea rows={2} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe el comportamiento observable esperado..." className="bg-muted/50 resize-none" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/80">Área clínica</label>
          <Select value={form.areaClinica} onValueChange={handleAreaChange}>
            <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIAS.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
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

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/80">Nivel</label>
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
          <label className="text-sm font-medium text-foreground/80">Edad mín.</label>
          <Input type="number" min={0} max={18} value={form.franjaEtariaMin} onChange={e => set("franjaEtariaMin", e.target.value)} placeholder="2" className="bg-muted/50" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/80">Edad máx.</label>
          <Input type="number" min={0} max={18} value={form.franjaEtariaMax} onChange={e => set("franjaEtariaMax", e.target.value)} placeholder="5" className="bg-muted/50" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground/80">Fecha objetivo</label>
        <Input type="date" value={form.targetDate} onChange={e => set("targetDate", e.target.value)} className="bg-muted/50" />
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
        <Button className="flex-1 bg-primary hover:bg-primary/90" disabled={!form.title || isSaving}
          onClick={() => {
            const franjaMin = form.franjaEtariaMin !== "" ? parseInt(form.franjaEtariaMin) : undefined;
            const franjaMax = form.franjaEtariaMax !== "" ? parseInt(form.franjaEtariaMax) : undefined;
            onSave({
              patientId,
              codigo: form.codigo || undefined,
              title: form.title,
              description: form.description || undefined,
              category: form.areaClinica,
              areaClinica: form.areaClinica,
              subarea: form.subarea || undefined,
              nivelDificultad: form.nivelDificultad,
              franjaEtaria: (franjaMin != null && franjaMax != null) ? `${franjaMin}-${franjaMax}` : undefined,
              status: "activo",
              targetDate: form.targetDate || undefined,
            });
          }}>
          {isSaving ? "Guardando..." : "Crear objetivo"}
        </Button>
      </div>
    </div>
  );
}

// ─── Plan Overview Card ────────────────────────────────────────────────────────
function PlanOverviewCard({ activeGoals, inProgressGoals, achievedGoals, archivedGoals }: {
  activeGoals: Goal[]; inProgressGoals: Goal[]; achievedGoals: Goal[]; archivedGoals: Goal[];
}) {
  const allGoals = [...activeGoals, ...inProgressGoals, ...achievedGoals, ...archivedGoals];
  const planGoals = [...activeGoals, ...inProgressGoals, ...achievedGoals]; // non-archived
  const total = planGoals.length;
  const logradoCount = achievedGoals.length;
  const completionPct = total > 0 ? Math.round((logradoCount / total) * 100) : 0;

  // Group by area
  const areaBreakdown = planGoals.reduce((acc: Record<string, { total: number; logrado: number }>, g) => {
    const key = g.areaClinica ?? g.category ?? "otro";
    if (!acc[key]) acc[key] = { total: 0, logrado: 0 };
    acc[key].total++;
    if (g.status === "logrado") acc[key].logrado++;
    return acc;
  }, {});
  const areas = Object.entries(areaBreakdown).sort((a, b) => b[1].total - a[1].total);

  if (allGoals.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-primary/5 via-white to-emerald-50/50 border border-primary/10 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start gap-4">

        {/* Circular-style progress */}
        <div className="shrink-0 flex flex-col items-center">
          <div className="relative h-20 w-20">
            <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted/60" />
              <circle
                cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeDasharray={`${completionPct} ${100 - completionPct}`}
                strokeLinecap="round"
                className="text-emerald-500 transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-display font-bold text-foreground leading-none">{completionPct}%</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground mt-1 text-center leading-tight">completado</span>
        </div>

        {/* Stats */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-primary" /> Resumen del plan terapéutico
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center bg-white/80 rounded-xl p-2.5 border border-white shadow-sm">
              <p className="text-2xl font-display font-bold text-primary">{activeGoals.length + inProgressGoals.length}</p>
              <p className="text-xs text-muted-foreground leading-tight">En trabajo</p>
            </div>
            <div className="text-center bg-white/80 rounded-xl p-2.5 border border-white shadow-sm">
              <p className="text-2xl font-display font-bold text-emerald-600">{logradoCount}</p>
              <p className="text-xs text-muted-foreground leading-tight">Logrados</p>
            </div>
            <div className="text-center bg-white/80 rounded-xl p-2.5 border border-white shadow-sm">
              <p className="text-2xl font-display font-bold text-foreground/80">{total}</p>
              <p className="text-xs text-muted-foreground leading-tight">Total plan</p>
            </div>
          </div>

          {/* Area breakdown */}
          {areas.length > 0 && (
            <div className="space-y-1.5">
              {areas.slice(0, 4).map(([area, data]) => {
                const ac = getAreaColor(area);
                const pct = data.total > 0 ? Math.round((data.logrado / data.total) * 100) : 0;
                return (
                  <div key={area} className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${ac.text} w-28 truncate capitalize`}>{area}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${ac.bg.replace("bg-", "bg-").replace("100", "500")} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-14 text-right">{data.logrado}/{data.total}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Add From Bank Dialog ─────────────────────────────────────────────────────
function AddFromBankDialog({ patientId, existingGoalLibraryIds, onClose, onAssigned }: {
  patientId: number; existingGoalLibraryIds: number[];
  onClose: () => void; onAssigned: () => void;
}) {
  const { toast } = useToast();
  const assign = useAssignGoalToPatient();
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [nivelFilter, setNivelFilter] = useState("all");
  const [assigning, setAssigning] = useState<number | null>(null);

  const { data: libraryRaw = [], isLoading } = useQuery<any[]>({
    queryKey: ["goal-library-bank"],
    queryFn: async () => {
      const res = await fetch("/api/goal-library?estado=activo");
      if (!res.ok) throw new Error("Error cargando banco");
      return res.json();
    },
  });

  const library = libraryRaw as any[];

  const available = library.filter(g => !existingGoalLibraryIds.includes(g.id));

  const filtered = available.filter(g => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (g.nombreObjetivo ?? "").toLowerCase().includes(q) ||
      (g.idObjetivo ?? "").toLowerCase().includes(q) ||
      (g.areaClinica ?? "").toLowerCase().includes(q) ||
      (g.subarea ?? "").toLowerCase().includes(q);
    const matchArea  = areaFilter === "all"  || g.areaClinica === areaFilter;
    const matchNivel = nivelFilter === "all" || g.nivelDificultad === nivelFilter;
    return matchSearch && matchArea && matchNivel;
  });

  const areas = ["all", ...Array.from(new Set(library.map(g => g.areaClinica).filter(Boolean))).sort() as string[]];

  const handleAssign = (goal: any) => {
    setAssigning(goal.id);
    assign.mutate(
      { id: goal.id, data: { patientId } },
      {
        onSuccess: () => {
          toast({
            title: "Objetivo asignado al plan",
            description: `"${goal.nombreObjetivo}" fue agregado al plan terapéutico.`,
          });
          setAssigning(null);
          onAssigned();
        },
        onError: (e: any) => {
          toast({ title: "Error al asignar", description: e.message, variant: "destructive" });
          setAssigning(null);
        },
      }
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Library className="h-5 w-5 text-primary" /> Agregar desde el banco
          </DialogTitle>
          <DialogDescription>
            Selecciona objetivos del banco clínico para agregar al plan terapéutico de este paciente.
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar objetivos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm bg-muted/50"
            />
          </div>
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="w-36 h-8 text-sm bg-muted/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las áreas</SelectItem>
              {areas.filter(a => a !== "all").map(a => (
                <SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={nivelFilter} onValueChange={setNivelFilter}>
            <SelectTrigger className="w-32 h-8 text-sm bg-muted/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los niveles</SelectItem>
              <SelectItem value="básico">Básico</SelectItem>
              <SelectItem value="intermedio">Intermedio</SelectItem>
              <SelectItem value="avanzado">Avanzado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Counter */}
        <p className="text-xs text-muted-foreground">
          {filtered.length} objetivo{filtered.length !== 1 ? "s" : ""} disponible{filtered.length !== 1 ? "s" : ""}
          {existingGoalLibraryIds.length > 0 && ` · ${existingGoalLibraryIds.length} ya asignado${existingGoalLibraryIds.length !== 1 ? "s" : ""}`}
        </p>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0 max-h-[50vh] pr-1">
          {isLoading ? (
            <div className="space-y-2">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">
              {search || areaFilter !== "all" || nivelFilter !== "all"
                ? "Sin resultados para esta búsqueda."
                : "Todos los objetivos del banco ya están en el plan."}
            </div>
          ) : (
            filtered.map((goal: any) => {
              const ac = getAreaColor(goal.areaClinica);
              const isAssigning = assigning === goal.id;
              return (
                <div key={goal.id} className="flex items-start gap-3 p-3 bg-white border border-border rounded-xl hover:border-primary/30 hover:bg-primary/2 transition-colors">
                  <div className={`shrink-0 text-xs font-mono font-bold px-2 py-1 rounded-lg ${ac.bg} ${ac.text} border ${ac.border} whitespace-nowrap mt-0.5`}>
                    {goal.idObjetivo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm leading-snug">{goal.nombreObjetivo}</p>
                    {goal.definicionOperativa && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{goal.definicionOperativa}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {goal.areaClinica && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${ac.bg} ${ac.text}`}>
                          {goal.areaClinica}
                        </span>
                      )}
                      {goal.subarea && <span className="text-xs text-muted-foreground">{goal.subarea}</span>}
                      {goal.nivelDificultad && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-md border ${NIVEL_COLORS[goal.nivelDificultad] ?? ""}`}>
                          {goal.nivelDificultad}
                        </span>
                      )}
                      {goal.franjaEtaria && <span className="text-xs text-muted-foreground">{goal.franjaEtaria} años</span>}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAssign(goal)}
                    disabled={isAssigning || assign.isPending}
                    className="shrink-0 h-7 text-xs bg-primary hover:bg-primary/90 text-white"
                  >
                    {isAssigning
                      ? <span className="h-3 w-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      : <><Plus className="h-3 w-3 mr-1" /> Agregar</>
                    }
                  </Button>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-2 border-t">
          <Button variant="outline" className="w-full" onClick={onClose}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Clinical Timeline ─────────────────────────────────────────────────────────

const EVENT_CFG: Record<string, {
  dot: string; border: string; bg: string; text: string;
  Icon: React.ElementType; label: string;
}> = {
  sesion: {
    dot: "bg-teal-500", border: "border-teal-200", bg: "bg-teal-50/60", text: "text-teal-700",
    Icon: CalendarCheck2, label: "Sesión realizada",
  },
  objetivo_asignado: {
    dot: "bg-primary", border: "border-primary/25", bg: "bg-primary/5", text: "text-primary",
    Icon: Target, label: "Objetivo asignado",
  },
  objetivo_logrado: {
    dot: "bg-emerald-500", border: "border-emerald-200", bg: "bg-emerald-50/60", text: "text-emerald-700",
    Icon: CheckCircle2, label: "Objetivo logrado",
  },
  estado_actualizado: {
    dot: "bg-amber-400", border: "border-amber-200", bg: "bg-amber-50/60", text: "text-amber-700",
    Icon: TrendingUp, label: "Estado actualizado",
  },
  nota_progreso: {
    dot: "bg-muted-foreground/50", border: "border-border", bg: "bg-muted/50", text: "text-foreground/70",
    Icon: MessageSquare, label: "Nota de progreso",
  },
};

const FILTER_OPTS = [
  { value: "all",               label: "Todo" },
  { value: "sesion",            label: "Sesiones" },
  { value: "objetivo_asignado", label: "Objetivos" },
  { value: "objetivo_logrado",  label: "Logros" },
  { value: "estado_actualizado",label: "Estados" },
  { value: "nota_progreso",     label: "Notas" },
];

function fmtEventDate(raw: string) {
  try {
    const d = raw.includes("T") ? new Date(raw) : new Date(raw + "T00:00:00");
    return format(d, "d MMM yyyy", { locale: es });
  } catch { return raw; }
}

function fmtMonthYear(raw: string) {
  try {
    const d = raw.includes("T") ? new Date(raw) : new Date(raw + "T00:00:00");
    return format(d, "MMMM yyyy", { locale: es });
  } catch { return raw; }
}

function tlBadgeStyle(badge: string) {
  const b = badge.toLowerCase();
  if (b === "logrado") return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  if (b === "activo") return "bg-primary/10 text-primary border border-primary/20";
  if (b === "en progreso") return "bg-amber-100 text-amber-700 border border-amber-200";
  if (b === "archivado" || b === "suspendido") return "bg-muted text-muted-foreground border border-border";
  const c = getAreaColor(badge);
  return `${c.bg} ${c.text} border ${c.border}`;
}

function TimelineCard({ event }: { event: TimelineEvent }) {
  const cfg = EVENT_CFG[event.type] ?? EVENT_CFG.nota_progreso;
  const hasTrans = event.extra?.statusAnterior && event.extra?.statusNuevo
    && event.extra.statusAnterior !== event.extra.statusNuevo;

  return (
    <div className="relative flex gap-0 pb-7 group">
      {/* Dot + connector */}
      <div className="relative flex flex-col items-center mr-4">
        <div className={`z-10 mt-0.5 h-5 w-5 rounded-full ${cfg.dot} ring-2 ring-white shadow-sm flex items-center justify-center shrink-0`}>
          <cfg.Icon className="h-2.5 w-2.5 text-white" />
        </div>
        <div className="flex-1 w-0.5 bg-muted mt-1 group-last:hidden" />
      </div>

      {/* Card */}
      <div className={`flex-1 rounded-xl border ${cfg.border} ${cfg.bg} p-3.5 shadow-sm mb-0.5`}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className={`text-xs font-bold ${cfg.text} flex items-center gap-1`}>
            <cfg.Icon className="h-3.5 w-3.5" />
            {event.title}
          </span>
          <time className="text-xs text-muted-foreground shrink-0 tabular-nums">{fmtEventDate(event.date ?? event.sortKey)}</time>
        </div>

        <p className="text-sm text-foreground font-medium leading-snug">{event.description}</p>

        {event.badge && (
          <span className={`inline-block mt-1.5 text-xs px-1.5 py-0.5 rounded-md font-medium ${tlBadgeStyle(event.badge)}`}>
            {event.badge}
          </span>
        )}

        {hasTrans && (
          <div className="flex items-center gap-1.5 mt-2 text-xs flex-wrap">
            <span className={`px-1.5 py-0.5 rounded-md border ${STATUS_STYLE[event.extra!.statusAnterior!] ?? "bg-muted text-muted-foreground border-border"}`}>
              {STATUS_LABELS[event.extra!.statusAnterior!] ?? event.extra!.statusAnterior}
            </span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className={`px-1.5 py-0.5 rounded-md border ${STATUS_STYLE[event.extra!.statusNuevo!] ?? "bg-muted text-muted-foreground border-border"}`}>
              {STATUS_LABELS[event.extra!.statusNuevo!] ?? event.extra!.statusNuevo}
            </span>
          </div>
        )}

        {/* Progress bar from recorded pct */}
        {event.progressPct != null && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progreso registrado</span>
              <span className={`font-bold tabular-nums ${
                event.progressPct >= 100 ? "text-emerald-600" :
                event.progressPct >= 60  ? "text-amber-600"   : "text-primary"
              }`}>{event.progressPct}%</span>
            </div>
            <div className="h-1.5 bg-muted/70 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  event.progressPct >= 100 ? "bg-emerald-500" :
                  event.progressPct >= 60  ? "bg-amber-400"   : "bg-primary"
                }`}
                style={{ width: `${event.progressPct}%` }}
              />
            </div>
          </div>
        )}

        {event.meta && (
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed border-t border-border/70 pt-2 whitespace-pre-wrap line-clamp-4">
            {event.meta}
          </p>
        )}
      </div>
    </div>
  );
}

function ClinicalTimeline({ patientId }: { patientId: number }) {
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: events = [], isLoading, isError } = useQuery<TimelineEvent[]>({
    queryKey: ["patient-timeline", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}/timeline`);
      if (!res.ok) throw new Error("Error al cargar timeline");
      return res.json();
    },
  });

  const filtered = activeFilter === "all"
    ? events
    : events.filter(e => e.type === activeFilter);

  const groups: { label: string; events: TimelineEvent[] }[] = [];
  for (const ev of filtered) {
    const label = fmtMonthYear(ev.date ?? ev.sortKey);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.events.push(ev);
    else groups.push({ label, events: [ev] });
  }

  if (isLoading) return (
    <div className="space-y-4 pt-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-4 animate-pulse">
          <div className="h-5 w-5 rounded-full bg-muted mt-0.5 shrink-0" />
          <div className="flex-1 h-16 bg-muted rounded-xl" />
        </div>
      ))}
    </div>
  );

  if (isError) return (
    <div className="text-center py-12 text-muted-foreground text-sm">
      Error al cargar la línea de tiempo.
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {FILTER_OPTS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setActiveFilter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              activeFilter === opt.value
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-muted/60 text-foreground/75 border-border hover:border-primary/40 hover:text-primary hover:bg-muted"
            }`}
          >
            {opt.label}
          </button>
        ))}
        {filtered.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length} evento{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <GitCommitVertical className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm font-medium">Sin eventos registrados</p>
          <p className="text-muted-foreground text-xs mt-1">
            {activeFilter === "all"
              ? "Los eventos aparecerán aquí al registrar sesiones, objetivos o notas."
              : "No hay eventos de este tipo. Prueba otro filtro."}
          </p>
        </div>
      )}

      {/* Grouped timeline */}
      {groups.map(group => (
        <div key={group.label}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest capitalize">
              {group.label}
            </span>
            <div className="flex-1 h-px bg-muted" />
            <span className="text-xs text-muted-foreground tabular-nums">{group.events.length}</span>
          </div>
          <div>
            {group.events.map(ev => (
              <TimelineCard key={ev.id} event={ev} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
