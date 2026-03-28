import { useState } from "react";
import { useLocation } from "wouter";
import {
  Users, Search, UserCircle, ChevronRight, User,
  ArrowLeft, Plus, Target, Zap, TrendingUp,
  CheckCircle2, BookOpen,
} from "lucide-react";
import { useListPatients } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { NuevoPacienteModal } from "@/components/nuevo-paciente-modal";

const BRAND_BLUE = "#0E3A6D";
const BRAND_TEAL = "#20C7C7";

// ─── Clinical status config ───────────────────────────────────────────────────

type ClinicalStatus = "Buen progreso" | "En progreso" | "Estancado" | "Requiere ajuste";

const STATUS_CONFIG: Record<ClinicalStatus, {
  dot: string;
  bg: string;
  text: string;
  ring: string;
  barColor: string;
}> = {
  "Buen progreso":   { dot: "bg-emerald-400", bg: "bg-emerald-50",  text: "text-emerald-700", ring: "ring-emerald-200", barColor: "#10b981" },
  "En progreso":     { dot: "bg-blue-400",    bg: "bg-blue-50",     text: "text-blue-700",    ring: "ring-blue-200",    barColor: BRAND_TEAL },
  "Estancado":       { dot: "bg-amber-400",   bg: "bg-amber-50",    text: "text-amber-700",   ring: "ring-amber-200",   barColor: "#f59e0b" },
  "Requiere ajuste": { dot: "bg-red-400",     bg: "bg-red-50",      text: "text-red-700",     ring: "ring-red-200",     barColor: "#ef4444" },
};

const NEXT_ACTION_ICON: Record<string, typeof Zap> = {
  "Aumentar dificultad":       TrendingUp,
  "Continuar objetivo actual": CheckCircle2,
  "Revisar estrategia":        Zap,
  "Agregar nuevo objetivo":    BookOpen,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [, navigate] = useLocation();
  const { data: patients, isLoading } = useListPatients();

  const filtered = (patients ?? []).filter(p => {
    const q = searchTerm.toLowerCase();
    return !q ||
      p.name.toLowerCase().includes(q) ||
      (p.diagnosis ?? "").toLowerCase().includes(q) ||
      (p.profesionalNombre ?? "").toLowerCase().includes(q) ||
      (p.franjaEtaria ?? "").includes(q);
  });

  const handleBack = () => {
    if (window.history.length > 1) window.history.back();
    else navigate("/");
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">

        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors w-fit group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Volver
        </button>

        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-border/50 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold flex items-center gap-2" style={{ color: BRAND_BLUE }}>
                <Users className="h-6 w-6" style={{ color: BRAND_TEAL }} />
                Pacientes
              </h1>
              <p className="text-slate-500 mt-1">
                {patients?.length ?? 0} paciente{patients?.length !== 1 ? "s" : ""} registrados
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar pacientes..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-56 bg-slate-50 border-slate-200 focus-visible:ring-primary/20"
                />
              </div>

              <button
                onClick={() => setShowNewPatient(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm text-white shadow-sm transition-all duration-200 hover:opacity-90 active:scale-[0.97] whitespace-nowrap"
                style={{ background: BRAND_TEAL }}
              >
                <Plus className="h-4 w-4" />
                Nuevo paciente
              </button>
            </div>
          </div>
        </div>

        {/* Patient grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="overflow-hidden border-border/50 shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-3.5 w-20" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-14 w-full rounded-xl" />
                  <Skeleton className="h-8 w-full rounded-lg" />
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </CardContent>
              </Card>
            ))
          ) : filtered.length > 0 ? (
            filtered.map(patient => {
              const cs = (patient as any).clinicalStatus as ClinicalStatus | undefined;
              const focus = (patient as any).currentFocus as { title: string; area: string } | null | undefined;
              const nextAction = (patient as any).nextAction as string | undefined;
              const activeCount = (patient as any).activeGoalsCount as number | undefined;
              const achievedCount = (patient as any).achievedGoalsCount as number | undefined;
              const pct = patient.promedioDesempeno != null
                ? Math.round((patient.promedioDesempeno as number) * 100)
                : null;

              const sc = cs ? STATUS_CONFIG[cs] : null;
              const NextIcon = nextAction ? (NEXT_ACTION_ICON[nextAction] ?? Zap) : null;

              return (
                <Card
                  key={patient.id}
                  className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer"
                  onMouseEnter={e => (e.currentTarget.style.borderColor = BRAND_TEAL + "55")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "")}
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <CardContent className="p-0">
                    <div className="p-5 space-y-4">

                      {/* Row 1: Avatar + name + status badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-11 w-11 shrink-0 rounded-full flex items-center justify-center font-bold text-lg font-display ring-2 ring-white shadow-sm text-white"
                            style={{ background: BRAND_TEAL }}
                          >
                            {patient.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-base leading-tight" style={{ color: BRAND_BLUE }}>
                              {patient.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              {patient.age && (
                                <span className="text-xs text-slate-500">{patient.age} años</span>
                              )}
                              {patient.profesionalNombre && (
                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                  <User className="h-3 w-3" />
                                  {patient.profesionalNombre}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {cs && sc && (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${sc.bg} ${sc.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                            {cs}
                          </span>
                        )}
                      </div>

                      {/* Row 2: Current focus */}
                      {focus ? (
                        <div className="flex items-start gap-2.5 bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <Target className="h-4 w-4 shrink-0 mt-0.5" style={{ color: BRAND_TEAL }} />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide leading-none mb-1">
                              Enfoque actual
                            </p>
                            <p className="text-sm text-slate-700 leading-snug font-medium line-clamp-2">
                              {focus.area && (
                                <span className="font-semibold" style={{ color: BRAND_BLUE }}>
                                  {focus.area}
                                  {" – "}
                                </span>
                              )}
                              {focus.title}
                            </p>
                          </div>
                        </div>
                      ) : patient.diagnosis ? (
                        <div className="flex items-start gap-2.5 bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <BookOpen className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
                          <p className="text-sm text-slate-600 line-clamp-2">{patient.diagnosis}</p>
                        </div>
                      ) : null}

                      {/* Row 3: Progress bar + goals summary */}
                      {pct !== null && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-slate-500">Desempeño promedio</span>
                            <div className="flex items-center gap-2">
                              {(activeCount !== undefined || achievedCount !== undefined) && (
                                <span className="text-xs text-slate-400">
                                  {activeCount ?? 0} activos · {achievedCount ?? 0} logrados
                                </span>
                              )}
                              <span
                                className="text-xs font-bold"
                                style={{ color: sc?.barColor ?? BRAND_TEAL }}
                              >
                                {pct}%
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${pct}%`,
                                background: sc?.barColor ?? BRAND_TEAL,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Row 4: Next action chip */}
                      {nextAction && NextIcon && (
                        <div
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border"
                          style={{
                            background: "#f0fdf4",
                            color: BRAND_BLUE,
                            borderColor: "#bbf7d0",
                          }}
                        >
                          <NextIcon className="h-3.5 w-3.5 shrink-0" style={{ color: BRAND_TEAL }} />
                          {nextAction}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>{(patient as any).totalRegistros ?? 0} registros</span>
                      <span
                        className="flex items-center gap-1 font-medium group-hover:gap-2 transition-all"
                        style={{ color: BRAND_TEAL }}
                      >
                        Ver perfil <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <UserCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900">Sin resultados</h3>
              <p className="text-slate-500 mt-1">Intenta ajustar la búsqueda o agrega un nuevo paciente.</p>
              <button
                onClick={() => setShowNewPatient(true)}
                className="mt-4 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                style={{ background: BRAND_TEAL }}
              >
                <Plus className="h-4 w-4 inline mr-1.5" />
                Nuevo paciente
              </button>
            </div>
          )}
        </div>
      </div>

      <NuevoPacienteModal open={showNewPatient} onClose={() => setShowNewPatient(false)} />
    </AppLayout>
  );
}
