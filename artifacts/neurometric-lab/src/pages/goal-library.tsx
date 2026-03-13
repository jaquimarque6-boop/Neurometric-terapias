import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  BookOpen, Search, Filter, ChevronDown, ChevronRight,
  Target, CheckCircle2, User, Sparkles, ClipboardList,
  AlertCircle, X, Check, Brain
} from "lucide-react";
import {
  useListGoalLibrary,
  useAssignGoalToPatient,
  useListPatients,
  getListGoalsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Colour maps ─────────────────────────────────────────────────────────────
const AREA_COLORS: Record<string, string> = {
  "Lenguaje Expresivo":             "bg-violet-100 text-violet-700",
  "Lenguaje Comprensivo-Expresivo": "bg-purple-100 text-purple-700",
  "Lenguaje Funcional":             "bg-blue-100 text-blue-700",
  "Lenguaje Narrativo":             "bg-sky-100 text-sky-700",
  "Léxico":                         "bg-teal-100 text-teal-700",
  "Comprensión":                    "bg-cyan-100 text-cyan-700",
  "Metalingüística":                "bg-indigo-100 text-indigo-700",
  "Semántica":                      "bg-emerald-100 text-emerald-700",
  "Pragmática":                     "bg-green-100 text-green-700",
  "Comunicación":                   "bg-lime-100 text-lime-700",
};

const MODULE_COLORS = {
  "Neurolengua": { bg: "bg-primary/5", text: "text-primary", border: "border-primary/20" },
  default:       { bg: "bg-slate-50",  text: "text-slate-600", border: "border-slate-200" },
};

function moduleColor(module: string) {
  return MODULE_COLORS[module as keyof typeof MODULE_COLORS] ?? MODULE_COLORS.default;
}

function areaColor(area: string) {
  return AREA_COLORS[area] ?? "bg-slate-100 text-slate-600";
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GoalLibrary() {
  const { data: library = [], isLoading } = useListGoalLibrary();
  const { data: patients = [] } = useListPatients();

  const [search, setSearch]           = useState("");
  const [areaFilter, setAreaFilter]   = useState("all");
  const [franjaFilter, setFranjaFilter] = useState("all");
  const [expandedId, setExpandedId]   = useState<number | null>(null);
  const [assignGoal, setAssignGoal]   = useState<(typeof library)[0] | null>(null);

  const areas   = useMemo(() => ["all", ...Array.from(new Set(library.map(g => g.area).filter(Boolean))).sort()], [library]);
  const franjas = useMemo(() => ["all", ...Array.from(new Set(library.map(g => g.franjaEtaria).filter(Boolean))).sort()], [library]);
  const modules = useMemo(() => Array.from(new Set(library.map(g => g.modulo))).sort(), [library]);

  const filtered = useMemo(() => library.filter(g => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (g.nombreObjetivo ?? "").toLowerCase().includes(q) ||
      (g.modulo ?? "").toLowerCase().includes(q) ||
      (g.area ?? "").toLowerCase().includes(q) ||
      (g.subarea ?? "").toLowerCase().includes(q) ||
      (g.idObjetivo ?? "").toLowerCase().includes(q);
    const matchArea  = areaFilter === "all"   || g.area === areaFilter;
    const matchFranja = franjaFilter === "all" || g.franjaEtaria === franjaFilter;
    return matchSearch && matchArea && matchFranja;
  }), [library, search, areaFilter, franjaFilter]);

  const grouped = useMemo(() => filtered.reduce((acc, g) => {
    const key = g.modulo ?? "Sin módulo";
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {} as Record<string, typeof library>), [filtered]);

  const activeFilters = (areaFilter !== "all" ? 1 : 0) + (franjaFilter !== "all" ? 1 : 0);

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">

        {/* Header */}
        <div className="bg-white border border-border/50 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                Banco de Objetivos
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                {library.length} objetivos clínicos · {modules.join(", ")}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nombre, área, módulo o ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-full sm:w-56 bg-slate-50 border-slate-200">
                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las áreas</SelectItem>
                {areas.filter(a => a !== "all").map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={franjaFilter} onValueChange={setFranjaFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Franja etaria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las franjas</SelectItem>
                {franjas.filter(f => f !== "all").map(f => (
                  <SelectItem key={f!} value={f!}>{f} años</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeFilters > 0 && (
              <Button
                variant="ghost" size="sm"
                onClick={() => { setAreaFilter("all"); setFranjaFilter("all"); }}
                className="text-slate-500 hover:text-slate-700 whitespace-nowrap"
              >
                Limpiar filtros
                <Badge className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center bg-slate-200 text-slate-600 hover:bg-slate-200 text-xs">{activeFilters}</Badge>
              </Button>
            )}
          </div>
        </div>

        {(search || activeFilters > 0) && (
          <p className="text-sm text-slate-500 -mt-2 px-1">
            Mostrando <span className="font-semibold text-slate-700">{filtered.length}</span> objetivos
            {search && <> para <span className="italic">"{search}"</span></>}
          </p>
        )}

        {/* Library */}
        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <BookOpen className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="font-medium text-slate-600">No se encontraron objetivos</p>
            <p className="text-slate-400 text-sm mt-1">Intenta ajustar los filtros de búsqueda.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([module, goals]) => {
              const mc = moduleColor(module);
              return (
                <div key={module} className="space-y-2">
                  <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${mc.bg} border ${mc.border}`}>
                    <Brain className={`h-4 w-4 ${mc.text}`} />
                    <h2 className={`font-semibold text-sm ${mc.text}`}>{module}</h2>
                    <Badge variant="outline" className={`ml-auto text-xs ${mc.text} ${mc.border} bg-white/50`}>
                      {goals.length} objetivo{goals.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  <div className="space-y-2 pl-2">
                    {goals.map(goal => {
                      const expanded = expandedId === goal.id;
                      const ac = areaColor(goal.area ?? "");
                      return (
                        <Card
                          key={goal.id}
                          className={`border-border/50 shadow-sm overflow-hidden transition-all duration-200 ${expanded ? "ring-1 ring-primary/20" : "hover:shadow-md"}`}
                        >
                          <div
                            className="w-full text-left cursor-pointer"
                            onClick={() => setExpandedId(expanded ? null : goal.id)}
                          >
                            <div className="p-4 flex items-start gap-4">
                              <div className={`shrink-0 text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg ${mc.bg} ${mc.text} border ${mc.border} mt-0.5 whitespace-nowrap`}>
                                {goal.idObjetivo}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-slate-900 leading-snug">{goal.nombreObjetivo}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                      <Badge variant="secondary" className={`text-xs border-0 ${ac}`}>
                                        {goal.area}
                                      </Badge>
                                      {goal.subarea && <span className="text-xs text-slate-400 font-medium">{goal.subarea}</span>}
                                      {goal.franjaEtaria && (
                                        <>
                                          <span className="text-xs text-slate-400">·</span>
                                          <span className="text-xs text-slate-400">{goal.franjaEtaria} años</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                      size="sm"
                                      onClick={e => { e.stopPropagation(); setAssignGoal(goal); }}
                                      className="h-8 text-xs bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/20"
                                    >
                                      <User className="h-3.5 w-3.5 mr-1.5" />
                                      Asignar
                                    </Button>
                                    {expanded
                                      ? <ChevronDown className="h-4 w-4 text-slate-400" />
                                      : <ChevronRight className="h-4 w-4 text-slate-400" />
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {expanded && (
                            <div className="border-t border-slate-100 bg-slate-50/60">
                              <div className="p-5 grid md:grid-cols-2 gap-5">
                                {goal.definicionOperativa && (
                                  <DetailSection
                                    icon={<ClipboardList className="h-4 w-4 text-primary" />}
                                    title="Definición Operativa"
                                    content={goal.definicionOperativa}
                                  />
                                )}
                                {goal.actividadesClinicas && (
                                  <DetailSection
                                    icon={<Sparkles className="h-4 w-4 text-amber-500" />}
                                    title="Actividades Clínicas"
                                    content={goal.actividadesClinicas}
                                  />
                                )}
                                {goal.actividadesFamilia && (
                                  <div className="md:col-span-2">
                                    <DetailSection
                                      icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                      title="Actividades para Familia"
                                      content={goal.actividadesFamilia}
                                    />
                                  </div>
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
                                {(goal.metaPorcentaje || goal.intentosSugeridos || goal.indicadorTipo) && (
                                  <div className="md:col-span-2 flex flex-wrap gap-3">
                                    {goal.metaPorcentaje && (
                                      <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs">
                                        <span className="text-slate-500">Meta: </span>
                                        <span className="font-semibold text-slate-700">{goal.metaPorcentaje}</span>
                                      </div>
                                    )}
                                    {goal.intentosSugeridos && (
                                      <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs">
                                        <span className="text-slate-500">Intentos sugeridos: </span>
                                        <span className="font-semibold text-slate-700">{goal.intentosSugeridos}</span>
                                      </div>
                                    )}
                                    {goal.indicadorTipo && (
                                      <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs">
                                        <span className="text-slate-500">Indicador: </span>
                                        <span className="font-semibold text-slate-700">{goal.indicadorTipo}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
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
        )}
      </div>

      {assignGoal && (
        <AssignGoalDialog
          goal={assignGoal}
          patients={patients}
          onClose={() => setAssignGoal(null)}
        />
      )}
    </AppLayout>
  );
}

function DetailSection({ icon, title, content }: { icon: React.ReactNode; title: string; content: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{title}</p>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{content}</p>
    </div>
  );
}

function AssignGoalDialog({
  goal,
  patients,
  onClose,
}: {
  goal: { id: number; idObjetivo: string; nombreObjetivo: string; modulo: string };
  patients: Array<{ id: number; name: string }>;
  onClose: () => void;
}) {
  const [patientId, setPatientId] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const assign = useAssignGoalToPatient();

  const mc = MODULE_COLORS["Neurolengua"];

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
          toast({ title: "Error", description: e.message, variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open onOpenChange={() => !assign.isPending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-display text-slate-900 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Asignar objetivo a paciente
          </DialogTitle>
          <DialogDescription>
            Este objetivo se agregará al plan de intervención del paciente.
          </DialogDescription>
        </DialogHeader>

        <div className={`rounded-xl border ${mc.border} ${mc.bg} p-4 space-y-1.5`}>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono font-bold ${mc.text}`}>{goal.idObjetivo}</span>
            <span className={`text-xs ${mc.text} opacity-60`}>·</span>
            <span className={`text-xs ${mc.text}`}>{goal.modulo}</span>
          </div>
          <p className={`font-semibold text-sm ${mc.text}`}>{goal.nombreObjetivo}</p>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="font-semibold text-slate-800">Objetivo asignado correctamente</p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Seleccionar paciente *</label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger className="bg-slate-50">
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
              <label className="text-sm font-medium text-slate-700">Fecha objetivo <span className="text-slate-400 font-normal">(opcional)</span></label>
              <input
                type="date"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm"
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>

            {!patientId && (
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Por favor selecciona un paciente para asignar el objetivo.
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
