import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft, User, FileText, CalendarDays, Target,
  CheckCircle2, Circle, Stethoscope, Activity, Home,
  Eye, ClipboardList, Plus, ChevronDown, Pencil, X,
  TrendingUp, AlertTriangle, Sparkles,
} from "lucide-react";
import {
  useGetPatient,
  useListRegistrosClinicos,
  useListGoals,
  useListPatientProfessionals,
  useListProfessionals,
  useCreateRegistroClinico,
  useCreateGoal,
  useUpdateGoal,
  getListGoalsQueryKey,
  getListRegistrosClinicosQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
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

type RC = {
  id: number; patientId: number; patientName?: string | null;
  professionalId?: number | null; professionalName?: string | null;
  fecha: string; resumenSesion?: string | null;
  observaciones?: string | null; recomendacionesHogar?: string | null;
  createdAt: string;
};
type Goal = {
  id: number; patientId: number; codigo?: string | null; title: string;
  description?: string | null; category: string; franjaEtaria?: string | null;
  status: string; targetDate?: string | null; createdAt: string;
};

const CATEGORIAS = ["lenguaje", "comprensión", "léxico", "narrativo", "pragmática", "fonología", "cognitivo", "conductual", "otro"];

function semaforoMeta(s?: string | null) {
  if (!s) return { label: "Sin datos", dot: "bg-slate-300", badge: "bg-slate-100 text-slate-600" };
  if (s.includes("🟢")) return { label: "Buen progreso",       dot: "bg-emerald-400", badge: "bg-emerald-100 text-emerald-700" };
  if (s.includes("🟡")) return { label: "En progreso",         dot: "bg-yellow-400",  badge: "bg-yellow-100 text-yellow-700"  };
  if (s.includes("🔴")) return { label: "Requiere atención",   dot: "bg-red-400",     badge: "bg-red-100 text-red-700"        };
  return { label: s, dot: "bg-slate-300", badge: "bg-slate-100 text-slate-600" };
}

function goalStatusBadge(status: string) {
  if (status === "logrado")    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status === "suspendido") return "bg-red-100 text-red-700 border-red-200";
  return "bg-blue-100 text-blue-700 border-blue-200";
}

function GoalIcon({ status }: { status: string }) {
  if (status === "logrado")    return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
  if (status === "suspendido") return <X className="h-4 w-4 text-red-400 shrink-0" />;
  return <Circle className="h-4 w-4 text-primary shrink-0" />;
}

function formatFecha(f: string) {
  try { return format(new Date(f + "T00:00:00"), "d MMM yyyy", { locale: es }); }
  catch { return f; }
}

export default function PatientProfile() {
  const params = useParams<{ id: string }>();
  const patientId = parseInt(params.id || "0");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patient, isLoading: loadingPatient } = useGetPatient(patientId);
  const { data: allRegistros = [] } = useListRegistrosClinicos({ patientId });
  const { data: allGoals = [] }   = useListGoals({ patientId });
  const { data: assignments = [] } = useListPatientProfessionals({ patientId });
  const { data: professionals = [] } = useListProfessionals();

  const [expanded, setExpanded] = useState<number | null>(null);
  const [showRegForm, setShowRegForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);

  const createRC   = useCreateRegistroClinico();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();

  const registros = allRegistros as RC[];
  const goals     = allGoals as Goal[];
  const profs     = assignments as Array<{ id: number; professionalId: number; professionalName?: string | null; professionalSpecialty?: string | null }>;

  const sm = semaforoMeta(patient?.semaforo);
  const pct = patient?.promedioDesempeno != null ? Math.round(patient.promedioDesempeno * 100) : null;
  const activeGoals = goals.filter(g => g.status === "activo").length;
  const achievedGoals = goals.filter(g => g.status === "logrado").length;

  const invalidateGoals = () => queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
  const invalidateRC    = () => queryClient.invalidateQueries({ queryKey: getListRegistrosClinicosQueryKey() });

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
                  {patient.semaforo && (
                    <Badge variant="outline" className={`${sm.badge} border-0 text-xs`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${sm.dot} mr-1.5 inline-block`} />
                      {sm.label}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600 mt-2">
                  {patient.age && <span className="flex items-center gap-1.5"><User className="h-4 w-4 text-slate-400" />{patient.age} años</span>}
                  {patient.fechaNacimiento && <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-slate-400" />{patient.fechaNacimiento}</span>}
                  {patient.franjaEtaria && <span className="flex items-center gap-1.5"><Activity className="h-4 w-4 text-slate-400" />Franja {patient.franjaEtaria}</span>}
                  {patient.profesionalNombre && <span className="flex items-center gap-1.5"><Stethoscope className="h-4 w-4 text-slate-400" />{patient.profesionalNombre}</span>}
                </div>

                {/* Performance bar */}
                {pct != null && (
                  <div className="mt-4 max-w-xs">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Promedio desempeño</span>
                      <span className="font-semibold text-slate-700">{pct}%</span>
                    </div>
                    <div className="h-2 bg-white/70 rounded-full overflow-hidden border border-white">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Diagnosis */}
            {patient.diagnosis && (
              <div className="mt-5 flex items-start gap-3 bg-white/60 backdrop-blur-sm border border-primary/10 rounded-xl p-4">
                <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-0.5">Diagnóstico</p>
                  <p className="text-slate-800 text-sm">{patient.diagnosis}</p>
                </div>
              </div>
            )}
            {patient.observaciones && (
              <div className="mt-2 flex items-start gap-3 bg-amber-50/70 border border-amber-100 rounded-xl p-4">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide mb-0.5">Observaciones</p>
                  <p className="text-amber-900 text-sm">{patient.observaciones}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Registros clínicos", value: registros.length, icon: ClipboardList, color: "text-sky-600 bg-sky-50" },
            { label: "Objetivos activos",  value: activeGoals,      icon: Target,        color: "text-amber-600 bg-amber-50" },
            { label: "Logros",             value: achievedGoals,    icon: TrendingUp,    color: "text-emerald-600 bg-emerald-50" },
            { label: "Profesionales",      value: profs.length,     icon: Stethoscope,   color: "text-primary bg-primary/10" },
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
          <TabsList className="bg-white border border-border/50 p-1 rounded-xl shadow-sm">
            <TabsTrigger value="ficha" className="rounded-lg text-sm">Ficha</TabsTrigger>
            <TabsTrigger value="registros" className="rounded-lg text-sm">Registros ({registros.length})</TabsTrigger>
            <TabsTrigger value="objetivos" className="rounded-lg text-sm">Objetivos ({goals.length})</TabsTrigger>
          </TabsList>

          {/* ── Ficha ───────────────────────────────────────────────────── */}
          <TabsContent value="ficha" className="mt-6 space-y-4">
            {/* Profesionales asignados */}
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

            {/* Recent goals */}
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
                {goals.filter(g => g.status === "activo").slice(0, 4).length > 0 ? (
                  <div className="divide-y divide-border/40">
                    {goals.filter(g => g.status === "activo").slice(0, 4).map(g => (
                      <div key={g.id} className="px-5 py-3.5 flex items-start gap-3">
                        <GoalIcon status={g.status} />
                        <div>
                          <div className="flex items-center gap-2">
                            {g.codigo && <span className="text-xs font-mono text-primary font-bold">{g.codigo}</span>}
                            <p className="text-sm font-medium text-slate-800">{g.title}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs mt-1 bg-slate-100 text-slate-600 hover:bg-slate-100 capitalize">{g.category}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-sm">Sin objetivos activos.</div>
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
          <TabsContent value="objetivos" className="mt-6 space-y-3">
            <div className="flex justify-end">
              <Button onClick={() => setShowGoalForm(true)} className="bg-primary hover:bg-primary/90 text-white h-9 text-sm">
                <Plus className="h-4 w-4 mr-1.5" /> Nuevo objetivo
              </Button>
            </div>
            {goals.length > 0 ? goals.map(goal => (
              <Card key={goal.id} className={`border-border/50 shadow-sm ${goal.status === "logrado" ? "opacity-70" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <button onClick={() => updateGoal.mutate({ id: goal.id, data: { status: goal.status === "activo" ? "logrado" : "activo" } as any }, { onSuccess: invalidateGoals })} className="shrink-0 mt-0.5 hover:scale-110 transition-transform">
                      <GoalIcon status={goal.status} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {goal.codigo && <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{goal.codigo}</span>}
                        <p className={`font-semibold text-slate-900 ${goal.status === "logrado" ? "line-through text-slate-400" : ""}`}>{goal.title}</p>
                      </div>
                      {goal.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{goal.description}</p>}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className={`text-xs ${goalStatusBadge(goal.status)}`}>
                          {goal.status === "logrado" ? "Logrado" : goal.status === "suspendido" ? "Suspendido" : "Activo"}
                        </Badge>
                        <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-100 capitalize">{goal.category}</Badge>
                        {goal.franjaEtaria && <span className="text-xs text-slate-400">{goal.franjaEtaria} años</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <Target className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500">Sin objetivos definidos para este paciente.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create clinical record dialog */}
      {showRegForm && (
        <Dialog open onOpenChange={() => setShowRegForm(false)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display text-xl flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Nuevo registro clínico</DialogTitle>
              <DialogDescription>Registra una sesión clínica para {patient.name}.</DialogDescription>
            </DialogHeader>
            <RegistroForm
              patientId={patientId}
              professionals={professionals}
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
              <DialogTitle className="font-display text-xl flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Nuevo objetivo</DialogTitle>
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
    </AppLayout>
  );
}

function RegistroForm({ patientId, professionals, onSave, isSaving, onClose }: {
  patientId: number; professionals: Array<{ id: number; name: string; specialty: string }>;
  onSave: (d: any) => void; isSaving: boolean; onClose: () => void;
}) {
  const [form, setForm] = useState({ professionalId: "", fecha: new Date().toISOString().split("T")[0], resumenSesion: "", observaciones: "", recomendacionesHogar: "" });
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
          onClick={() => onSave({ patientId, professionalId: form.professionalId ? parseInt(form.professionalId) : undefined, fecha: form.fecha, resumenSesion: form.resumenSesion || undefined, observaciones: form.observaciones || undefined, recomendacionesHogar: form.recomendacionesHogar || undefined })}>
          {isSaving ? "Guardando..." : "Guardar registro"}
        </Button>
      </div>
    </div>
  );
}

function GoalFormInline({ patientId, onSave, isSaving, onClose }: {
  patientId: number; onSave: (d: any) => void; isSaving: boolean; onClose: () => void;
}) {
  const [form, setForm] = useState({ codigo: "", title: "", description: "", category: "lenguaje", franjaEtaria: "", status: "activo", targetDate: "" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Código</label>
          <Input value={form.codigo} onChange={e => set("codigo", e.target.value)} placeholder="NL-001" className="bg-slate-50 font-mono" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Franja etaria</label>
          <Input value={form.franjaEtaria} onChange={e => set("franjaEtaria", e.target.value)} placeholder="3-5" className="bg-slate-50" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Título *</label>
        <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Ampliar vocabulario sustantivo..." className="bg-slate-50" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Descripción</label>
        <Textarea rows={2} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Definición operativa..." className="bg-slate-50 resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Categoría</label>
          <Select value={form.category} onValueChange={v => set("category", v)}>
            <SelectTrigger className="bg-slate-50"><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Fecha objetivo</label>
          <Input type="date" value={form.targetDate} onChange={e => set("targetDate", e.target.value)} className="bg-slate-50" />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
        <Button className="flex-1 bg-primary hover:bg-primary/90" disabled={!form.title || isSaving}
          onClick={() => onSave({ patientId, codigo: form.codigo || undefined, title: form.title, description: form.description || undefined, category: form.category, franjaEtaria: form.franjaEtaria || undefined, status: form.status, targetDate: form.targetDate || undefined })}>
          {isSaving ? "Guardando..." : "Crear objetivo"}
        </Button>
      </div>
    </div>
  );
}
