import { useState } from "react";
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
  ChevronRight, Send, History,
} from "lucide-react";
import { GoalCodePreview } from "@/components/ui/goal-code-preview";
import { AREA_SUBAREAS } from "@/utils/goal-code-generator";
import {
  useGetPatient,
  useListRegistrosClinicos,
  useListGoals,
  useListPatientProfessionals,
  useListProfessionals,
  useCreateRegistroClinico,
  useCreateGoal,
  useUpdateGoal,
  useAssignGoalToPatient,
  getListGoalsQueryKey,
  getListRegistrosClinicosQueryKey,
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
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

// ─── Types ────────────────────────────────────────────────────────────────────
type RC = {
  id: number; patientId: number; patientName?: string | null;
  professionalId?: number | null; professionalName?: string | null;
  fecha: string; resumenSesion?: string | null;
  observaciones?: string | null; recomendacionesHogar?: string | null;
  createdAt: string;
};
type Goal = {
  id: number; patientId: number; goalLibraryId?: number | null;
  codigo?: string | null; title: string; description?: string | null;
  category: string; areaClinica?: string | null; franjaEtaria?: string | null;
  nivelDificultad?: string | null; status: string;
  fechaAsignacion?: string | null; targetDate?: string | null;
  notas?: string | null; createdAt: string;
};
type ProgressEntry = {
  id: number; goalId: number; nota?: string | null;
  statusAnterior?: string | null; statusNuevo?: string | null;
  registroClinicoId?: number | null; createdAt: string;
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
  "archivado":   "bg-slate-100 text-slate-500 border-slate-200",
  "suspendido":  "bg-slate-100 text-slate-500 border-slate-200",
};

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIAS = [
  "lenguaje", "habla", "pragmática", "motricidad orofacial",
  "lectoescritura", "cognición", "estimulación temprana", "otro"
];

const AREA_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "lenguaje":              { bg: "bg-violet-100",  text: "text-violet-700",  border: "border-violet-200"  },
  "habla":                 { bg: "bg-sky-100",     text: "text-sky-700",     border: "border-sky-200"     },
  "pragmática":            { bg: "bg-teal-100",    text: "text-teal-700",    border: "border-teal-200"    },
  "motricidad orofacial":  { bg: "bg-orange-100",  text: "text-orange-700",  border: "border-orange-200"  },
  "lectoescritura":        { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  "cognición":             { bg: "bg-blue-100",    text: "text-blue-700",    border: "border-blue-200"    },
  "estimulación temprana": { bg: "bg-rose-100",    text: "text-rose-700",    border: "border-rose-200"    },
};

const NIVEL_COLORS: Record<string, string> = {
  "básico":     "bg-emerald-100 text-emerald-700 border-emerald-200",
  "intermedio": "bg-amber-100 text-amber-700 border-amber-200",
  "avanzado":   "bg-red-100 text-red-700 border-red-200",
};

function getAreaColor(area?: string | null) {
  return AREA_COLORS[(area ?? "").toLowerCase()] ?? { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function semaforoMeta(s?: string | null) {
  if (!s) return { label: "Sin datos", dot: "bg-slate-300", badge: "bg-slate-100 text-slate-600" };
  if (s.includes("🟢")) return { label: "Buen progreso",     dot: "bg-emerald-400", badge: "bg-emerald-100 text-emerald-700" };
  if (s.includes("🟡")) return { label: "En progreso",       dot: "bg-yellow-400",  badge: "bg-yellow-100 text-yellow-700"  };
  if (s.includes("🔴")) return { label: "Requiere atención", dot: "bg-red-400",     badge: "bg-red-100 text-red-700"        };
  return { label: s, dot: "bg-slate-300", badge: "bg-slate-100 text-slate-600" };
}

function GoalStatusIcon({ status }: { status: string }) {
  if (status === "logrado")     return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
  if (status === "archivado" || status === "suspendido") return <Archive className="h-4 w-4 text-slate-400 shrink-0" />;
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

  const [expanded, setExpanded] = useState<number | null>(null);
  const [showRegForm, setShowRegForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [progressGoal, setProgressGoal] = useState<Goal | null>(null);

  const createRC   = useCreateRegistroClinico();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();

  const registros = allRegistros as RC[];
  const goals     = allGoals as Goal[];
  const profs     = assignments as Array<{ id: number; professionalId: number; professionalName?: string | null; professionalSpecialty?: string | null }>;

  const sm  = semaforoMeta((patient as any)?.semaforo);
  const pct = (patient as any)?.promedioDesempeno != null ? Math.round((patient as any).promedioDesempeno * 100) : null;

  const activeGoals     = goals.filter(g => g.status === "activo");
  const inProgressGoals = goals.filter(g => g.status === "en progreso");
  const achievedGoals   = goals.filter(g => g.status === "logrado");
  const archivedGoals   = goals.filter(g => g.status === "archivado" || g.status === "suspendido");

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
        <div className="grid grid-cols-4 gap-4">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </AppLayout>
  );

  if (!patient) return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <User className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Paciente no encontrado</h2>
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
        <button onClick={() => navigate("/patients")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors w-fit group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Volver a pacientes
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
                  <h1 className="text-2xl font-display font-bold text-slate-900">{patient.name}</h1>
                  {(patient as any).semaforo && (
                    <Badge variant="outline" className={`${sm.badge} border-0 text-xs`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${sm.dot} mr-1.5 inline-block`} />
                      {sm.label}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600 mt-2">
                  {patient.age && <span className="flex items-center gap-1.5"><User className="h-4 w-4 text-slate-400" />{patient.age} años</span>}
                  {(patient as any).franjaEtaria && <span className="flex items-center gap-1.5"><Activity className="h-4 w-4 text-slate-400" />Franja {(patient as any).franjaEtaria}</span>}
                  {(patient as any).profesionalNombre && <span className="flex items-center gap-1.5"><Stethoscope className="h-4 w-4 text-slate-400" />{(patient as any).profesionalNombre}</span>}
                </div>
                {pct != null && (
                  <div className="mt-4 max-w-xs">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Promedio desempeño</span>
                      <span className="font-semibold text-slate-700">{pct}%</span>
                    </div>
                    <div className="h-2 bg-white/70 rounded-full overflow-hidden border border-white">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
            {patient.diagnosis && (
              <div className="mt-5 flex items-start gap-3 bg-white/60 backdrop-blur-sm border border-primary/10 rounded-xl p-4">
                <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-0.5">Diagnóstico</p>
                  <p className="text-slate-800 text-sm">{patient.diagnosis}</p>
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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Registros clínicos", value: registros.length,     icon: ClipboardList, color: "text-sky-600 bg-sky-50"       },
            { label: "Activos + En progreso", value: activeGoals.length + inProgressGoals.length, icon: Target, color: "text-amber-600 bg-amber-50" },
            { label: "Logros",             value: achievedGoals.length, icon: TrendingUp,    color: "text-emerald-600 bg-emerald-50"},
            { label: "Profesionales",      value: profs.length,         icon: Stethoscope,   color: "text-primary bg-primary/10"   },
          ].map(s => (
            <Card key={s.label} className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <div className={`inline-flex p-2 rounded-lg ${s.color} mb-2`}><s.icon className="h-4 w-4" /></div>
                <p className="text-2xl font-display font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="ficha">
          <TabsList className="bg-white border border-border/50 p-1 rounded-xl shadow-sm flex-wrap h-auto gap-1">
            <TabsTrigger value="ficha" className="rounded-lg text-sm">Ficha</TabsTrigger>
            <TabsTrigger value="registros" className="rounded-lg text-sm">Registros ({registros.length})</TabsTrigger>
            <TabsTrigger value="objetivos" className="rounded-lg text-sm">
              Objetivos ({activeGoals.length + inProgressGoals.length})
              {achievedGoals.length > 0 && <span className="ml-1 text-emerald-600">+{achievedGoals.length} logrados</span>}
            </TabsTrigger>
            <TabsTrigger value="sugerencias" className="rounded-lg text-sm flex items-center gap-1">
              <Lightbulb className="h-3.5 w-3.5" /> Sugerencias
            </TabsTrigger>
          </TabsList>

          {/* ── Ficha ───────────────────────────────────────────────────── */}
          <TabsContent value="ficha" className="mt-6 space-y-4">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary" /> Profesionales asignados
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {profs.length > 0 ? (
                  <div className="divide-y divide-border/40">
                    {profs.map(pp => (
                      <div key={pp.id} className="px-5 py-4 flex items-center gap-4">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold font-display shrink-0">
                          {(pp.professionalName ?? "P").charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{pp.professionalName}</p>
                          {pp.professionalSpecialty && <p className="text-xs text-slate-500">{pp.professionalSpecialty}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-sm">Sin profesionales asignados.</div>
                )}
              </CardContent>
            </Card>

            {/* Quick objectives view */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" /> Objetivos activos
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setShowGoalForm(true)} className="h-8 text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Nuevo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {[...activeGoals, ...inProgressGoals].slice(0, 4).length > 0 ? (
                  <div className="divide-y divide-border/40">
                    {[...activeGoals, ...inProgressGoals].slice(0, 4).map(g => {
                      const ac = getAreaColor(g.areaClinica ?? g.category);
                      return (
                        <div key={g.id} className="px-5 py-3.5 flex items-start gap-3">
                          <GoalStatusIcon status={g.status} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {g.codigo && <span className="text-xs font-mono text-primary font-bold">{g.codigo}</span>}
                              <p className="text-sm font-medium text-slate-800 leading-snug">{g.title}</p>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              <Badge variant="outline" className={`text-xs border ${STATUS_STYLE[g.status] ?? ""}`}>
                                {STATUS_LABELS[g.status] ?? g.status}
                              </Badge>
                              <Badge variant="secondary" className={`text-xs border-0 ${ac.bg} ${ac.text}`}>
                                {g.areaClinica ?? g.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-sm">Sin objetivos activos.</div>
                )}
              </CardContent>
            </Card>

            {/* Recent registros */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" /> Registros recientes
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setShowRegForm(true)} className="h-8 text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Nuevo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {registros.slice(0, 3).length > 0 ? (
                  <div className="divide-y divide-border/40">
                    {registros.slice(0, 3).map(r => (
                      <div key={r.id} className="px-5 py-3.5">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-medium text-slate-800">{formatFecha(r.fecha)}</span>
                          {r.professionalName && <span className="text-xs text-slate-400">{r.professionalName}</span>}
                        </div>
                        {r.resumenSesion && <p className="text-xs text-slate-600 line-clamp-2">{r.resumenSesion}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-sm">Sin registros clínicos aún.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Registros ───────────────────────────────────────────────── */}
          <TabsContent value="registros" className="mt-6">
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Registros clínicos</CardTitle>
                  <Button size="sm" onClick={() => setShowRegForm(true)} className="bg-primary hover:bg-primary/90 text-white h-8 text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Nuevo registro
                  </Button>
                </div>
              </CardHeader>
              <div className="divide-y divide-border/40">
                {registros.length > 0 ? (
                  registros.sort((a, b) => b.fecha.localeCompare(a.fecha)).map(r => (
                    <div key={r.id} className="p-5">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                            <ClipboardList className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{formatFecha(r.fecha)}</p>
                            {r.professionalName && <p className="text-xs text-slate-500">{r.professionalName}</p>}
                          </div>
                        </div>
                        <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="p-1.5 text-slate-400 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors">
                          <ChevronDown className={`h-4 w-4 transition-transform ${expanded === r.id ? "rotate-180" : ""}`} />
                        </button>
                      </div>
                      {r.resumenSesion && <p className={`text-sm text-slate-700 leading-relaxed ${expanded === r.id ? "" : "line-clamp-2"}`}>{r.resumenSesion}</p>}
                      {expanded === r.id && (
                        <div className="mt-4 grid sm:grid-cols-2 gap-3">
                          {r.observaciones && (
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                              <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> Observaciones</p>
                              <p className="text-sm text-amber-900">{r.observaciones}</p>
                            </div>
                          )}
                          {r.recomendacionesHogar && (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                              <p className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1"><Home className="h-3.5 w-3.5" /> Para el hogar</p>
                              <p className="text-sm text-emerald-900">{r.recomendacionesHogar}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400 text-sm">Sin registros clínicos para este paciente.</div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* ── Objetivos ───────────────────────────────────────────────── */}
          <TabsContent value="objetivos" className="mt-6 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 text-sm text-slate-500 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Circle className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold text-primary">{activeGoals.length}</span> activos
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <span className="font-semibold text-amber-600">{inProgressGoals.length}</span> en progreso
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="font-semibold text-emerald-600">{achievedGoals.length}</span> logrados
                </span>
                <span className="flex items-center gap-1.5">
                  <Archive className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-400">{archivedGoals.length}</span> archivados
                </span>
              </div>
              <Button onClick={() => setShowGoalForm(true)} className="bg-primary hover:bg-primary/90 text-white h-9 text-sm">
                <Plus className="h-4 w-4 mr-1.5" /> Nuevo objetivo
              </Button>
            </div>

            {/* Active goals */}
            {activeGoals.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <Circle className="h-3.5 w-3.5 text-primary" /> Objetivos activos
                </h3>
                {activeGoals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} onCycle={cycleGoalStatus} onProgress={setProgressGoal} />
                ))}
              </div>
            )}

            {/* In progress goals */}
            {inProgressGoals.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-amber-700 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-amber-500" /> En progreso
                </h3>
                {inProgressGoals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} onCycle={cycleGoalStatus} onProgress={setProgressGoal} />
                ))}
              </div>
            )}

            {/* Achieved goals */}
            {achievedGoals.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Objetivos logrados
                </h3>
                {achievedGoals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} onCycle={cycleGoalStatus} onProgress={setProgressGoal} muted />
                ))}
              </div>
            )}

            {/* Archived goals */}
            {archivedGoals.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                  <Archive className="h-3.5 w-3.5 text-slate-400" /> Objetivos archivados
                </h3>
                {archivedGoals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} onCycle={cycleGoalStatus} onProgress={setProgressGoal} muted />
                ))}
              </div>
            )}

            {goals.length === 0 && (
              <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <Target className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Sin objetivos definidos</p>
                <p className="text-slate-400 text-sm mt-1">Crea un objetivo manualmente o usa las sugerencias inteligentes.</p>
                <Button size="sm" variant="outline" className="mt-4" onClick={() => setShowGoalForm(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Agregar objetivo
                </Button>
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
        </Tabs>
      </div>

      {/* Create clinical record dialog */}
      {showRegForm && (
        <Dialog open onOpenChange={() => setShowRegForm(false)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display text-xl flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" /> Nuevo registro clínico
              </DialogTitle>
              <DialogDescription>Registra una sesión clínica para {patient.name}.</DialogDescription>
            </DialogHeader>
            <RegistroForm
              patientId={patientId}
              professionals={professionals as any[]}
              onSave={(data) => createRC.mutate({ data }, {
                onSuccess: () => { invalidateRC(); setShowRegForm(false); toast({ title: "Registro creado" }); },
                onError: () => toast({ title: "Error", variant: "destructive" }),
              })}
              isSaving={createRC.isPending}
              onClose={() => setShowRegForm(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Create goal dialog */}
      {showGoalForm && (
        <Dialog open onOpenChange={() => setShowGoalForm(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-xl flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" /> Nuevo objetivo
              </DialogTitle>
              <DialogDescription>Define un objetivo terapéutico para {patient.name}.</DialogDescription>
            </DialogHeader>
            <GoalFormInline
              patientId={patientId}
              onSave={(data) => createGoal.mutate({ data }, {
                onSuccess: () => { invalidateGoals(); setShowGoalForm(false); toast({ title: "Objetivo creado" }); },
                onError: () => toast({ title: "Error", variant: "destructive" }),
              })}
              isSaving={createGoal.isPending}
              onClose={() => setShowGoalForm(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Progress tracking dialog */}
      {progressGoal && (
        <GoalProgressDialog
          goal={progressGoal}
          onClose={() => setProgressGoal(null)}
          onUpdated={() => { invalidateGoals(); setProgressGoal(null); }}
        />
      )}
    </AppLayout>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────
function GoalCard({ goal, onCycle, onProgress, muted = false }: {
  goal: Goal; onCycle: (g: Goal) => void; onProgress: (g: Goal) => void; muted?: boolean;
}) {
  const ac = getAreaColor(goal.areaClinica ?? goal.category);
  const isStruck = goal.status === "logrado" || goal.status === "archivado" || goal.status === "suspendido";
  return (
    <Card className={`border-border/50 shadow-sm ${muted ? "opacity-70" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
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
              <p className={`font-semibold text-slate-900 leading-snug ${isStruck ? "line-through text-slate-400" : ""}`}>
                {goal.title}
              </p>
            </div>
            {goal.description && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{goal.description}</p>
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
              {goal.franjaEtaria && (
                <span className="text-xs text-slate-400 self-center">{goal.franjaEtaria} años</span>
              )}
              {goal.fechaAsignacion && (
                <span className="text-xs text-slate-400 self-center">Asignado: {formatFecha(goal.fechaAsignacion)}</span>
              )}
            </div>
          </div>
          <button
            onClick={() => onProgress(goal)}
            title="Ver seguimiento"
            className="shrink-0 p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
          >
            <History className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Goal Progress Dialog ─────────────────────────────────────────────────────
function GoalProgressDialog({ goal, onClose, onUpdated }: {
  goal: Goal; onClose: () => void; onUpdated: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [nota, setNota] = useState("");
  const [newStatus, setNewStatus] = useState(goal.status);

  const { data: historyRaw = [], isLoading: loadingHistory, refetch } = useQuery<ProgressEntry[]>({
    queryKey: ["goal-progress", goal.id],
    queryFn: async () => {
      const res = await fetch(`/api/goals/${goal.id}/progress`);
      if (!res.ok) throw new Error("Error cargando historial");
      return res.json();
    },
  });
  const history = historyRaw as ProgressEntry[];

  const addProgress = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/goals/${goal.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nota: nota.trim() || undefined,
          statusNuevo: newStatus !== goal.status ? newStatus : undefined,
        }),
      });
      if (!res.ok) throw new Error("Error guardando seguimiento");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Seguimiento guardado" });
      queryClient.invalidateQueries({ queryKey: ["goal-progress", goal.id] });
      queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
      setNota("");
      refetch();
      onUpdated();
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const ac = getAreaColor(goal.areaClinica ?? goal.category);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> Seguimiento del objetivo
          </DialogTitle>
          <DialogDescription>
            Registra notas de progreso y cambios de estado para este objetivo.
          </DialogDescription>
        </DialogHeader>

        {/* Goal info */}
        <div className={`rounded-xl border ${ac.border} ${ac.bg} p-4 space-y-2`}>
          <div className="flex items-center gap-2 flex-wrap">
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
          {goal.fechaAsignacion && (
            <p className={`text-xs ${ac.text} opacity-70`}>Asignado el {formatFecha(goal.fechaAsignacion)}</p>
          )}
        </div>

        {/* New note form */}
        <div className="space-y-3 border border-slate-200 rounded-xl p-4 bg-slate-50/60">
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> Nueva nota de progreso
          </p>
          <Textarea
            value={nota}
            onChange={e => setNota(e.target.value)}
            placeholder="Describe el progreso observado, logros, dificultades..."
            rows={3}
            className="bg-white resize-none text-sm"
          />
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Cambiar estado a:</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="bg-white h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="en progreso">En progreso</SelectItem>
                  <SelectItem value="logrado">Logrado</SelectItem>
                  <SelectItem value="archivado">Archivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => addProgress.mutate()}
              disabled={(!nota.trim() && newStatus === goal.status) || addProgress.isPending}
              className="bg-primary hover:bg-primary/90 self-end h-9"
            >
              {addProgress.isPending ? (
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />Guardando</span>
              ) : (
                <><Send className="h-4 w-4 mr-1.5" /> Guardar</>
              )}
            </Button>
          </div>
        </div>

        {/* History */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <History className="h-4 w-4 text-slate-400" /> Historial de seguimiento
          </p>
          {loadingHistory ? (
            <div className="space-y-2">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
              Sin notas de seguimiento aún.
            </div>
          ) : (
            <div className="space-y-2">
              {history.map(entry => (
                <div key={entry.id} className="bg-white border border-slate-200 rounded-xl p-3.5">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <span className="text-xs text-slate-400">{formatTs(entry.createdAt)}</span>
                    {entry.statusAnterior !== entry.statusNuevo && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="outline" className={`text-xs border ${STATUS_STYLE[entry.statusAnterior ?? "activo"] ?? ""}`}>
                          {STATUS_LABELS[entry.statusAnterior ?? "activo"] ?? entry.statusAnterior}
                        </Badge>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <Badge variant="outline" className={`text-xs border ${STATUS_STYLE[entry.statusNuevo ?? "activo"] ?? ""}`}>
                          {STATUS_LABELS[entry.statusNuevo ?? "activo"] ?? entry.statusNuevo}
                        </Badge>
                      </div>
                    )}
                  </div>
                  {entry.nota && <p className="text-sm text-slate-700 leading-relaxed">{entry.nota}</p>}
                </div>
              ))}
            </div>
          )}
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
            <h3 className="font-semibold text-slate-900">Sugerencias inteligentes</h3>
            <p className="text-sm text-slate-500 mt-1">
              Objetivos seleccionados automáticamente según la edad, diagnóstico y área clínica de <strong>{patientName}</strong>. Los objetivos ya asignados no aparecen aquí.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : suggestions.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <Star className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="font-medium text-slate-600">No hay sugerencias disponibles</p>
          <p className="text-slate-400 text-sm mt-1">Es posible que todos los objetivos relevantes ya estén asignados, o que falte información de diagnóstico/edad.</p>
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
                      <p className="font-semibold text-slate-900 leading-snug">{goal.nombreObjetivo}</p>
                      {goal.definicionOperativa && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{goal.definicionOperativa}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge variant="secondary" className={`text-xs border-0 ${ac.bg} ${ac.text}`}>
                          {goal.areaClinica ?? goal.area}
                        </Badge>
                        {goal.subarea && <span className="text-xs text-slate-400 self-center">{goal.subarea}</span>}
                        {goal.nivelDificultad && (
                          <Badge variant="outline" className={`text-xs border ${NIVEL_COLORS[goal.nivelDificultad] ?? ""}`}>
                            {goal.nivelDificultad}
                          </Badge>
                        )}
                        {goal.franjaEtaria && <span className="text-xs text-slate-400 self-center">{goal.franjaEtaria} años</span>}
                      </div>
                      {goal.habilidadesRelacionadas && (
                        <p className="text-xs text-slate-400 mt-1.5 italic">Habilidades: {goal.habilidadesRelacionadas}</p>
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
          <p className="text-xs text-slate-400 text-center pt-1">Mostrando los {suggestions.length} objetivos más relevantes para este paciente.</p>
        </div>
      )}
    </div>
  );
}

// ─── Forms ────────────────────────────────────────────────────────────────────
function RegistroForm({ patientId, professionals, onSave, isSaving, onClose }: {
  patientId: number; professionals: Array<{ id: number; name: string; specialty: string }>;
  onSave: (d: any) => void; isSaving: boolean; onClose: () => void;
}) {
  const [form, setForm] = useState({
    professionalId: "", fecha: new Date().toISOString().split("T")[0],
    resumenSesion: "", observaciones: "", recomendacionesHogar: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Profesional</label>
          <Select value={form.professionalId} onValueChange={v => set("professionalId", v)}>
            <SelectTrigger className="bg-slate-50"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
            <SelectContent>{professionals.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Fecha *</label>
          <Input type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} className="bg-slate-50" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Resumen de sesión</label>
        <Textarea rows={3} value={form.resumenSesion} onChange={e => set("resumenSesion", e.target.value)} placeholder="Describe lo trabajado..." className="bg-slate-50 resize-none" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Observaciones</label>
        <Textarea rows={2} value={form.observaciones} onChange={e => set("observaciones", e.target.value)} placeholder="Observaciones clínicas..." className="bg-slate-50 resize-none" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Recomendaciones para el hogar</label>
        <Textarea rows={2} value={form.recomendacionesHogar} onChange={e => set("recomendacionesHogar", e.target.value)} placeholder="Actividades para la familia..." className="bg-slate-50 resize-none" />
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
        <Button className="flex-1 bg-primary hover:bg-primary/90" disabled={!form.fecha || isSaving}
          onClick={() => onSave({
            patientId, professionalId: form.professionalId ? parseInt(form.professionalId) : undefined,
            fecha: form.fecha, resumenSesion: form.resumenSesion || undefined,
            observaciones: form.observaciones || undefined, recomendacionesHogar: form.recomendacionesHogar || undefined,
          })}>
          {isSaving ? "Guardando..." : "Guardar registro"}
        </Button>
      </div>
    </div>
  );
}

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
        <label className="text-sm font-medium text-slate-700">Título del objetivo *</label>
        <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Ampliar vocabulario sustantivo en contexto funcional..." className="bg-slate-50" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Descripción / Definición operativa</label>
        <Textarea rows={2} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe el comportamiento observable esperado..." className="bg-slate-50 resize-none" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Área clínica</label>
          <Select value={form.areaClinica} onValueChange={handleAreaChange}>
            <SelectTrigger className="bg-slate-50"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIAS.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Subárea</label>
          <Select value={form.subarea} onValueChange={v => set("subarea", v)} disabled={subareaOptions.length === 0}>
            <SelectTrigger className="bg-slate-50"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
            <SelectContent>
              {subareaOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Nivel</label>
          <Select value={form.nivelDificultad} onValueChange={v => set("nivelDificultad", v)}>
            <SelectTrigger className="bg-slate-50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="básico">Básico</SelectItem>
              <SelectItem value="intermedio">Intermedio</SelectItem>
              <SelectItem value="avanzado">Avanzado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Edad mín.</label>
          <Input type="number" min={0} max={18} value={form.franjaEtariaMin} onChange={e => set("franjaEtariaMin", e.target.value)} placeholder="2" className="bg-slate-50" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Edad máx.</label>
          <Input type="number" min={0} max={18} value={form.franjaEtariaMax} onChange={e => set("franjaEtariaMax", e.target.value)} placeholder="5" className="bg-slate-50" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Fecha objetivo</label>
        <Input type="date" value={form.targetDate} onChange={e => set("targetDate", e.target.value)} className="bg-slate-50" />
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
