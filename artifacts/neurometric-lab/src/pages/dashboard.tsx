import { useState } from "react";
import { useLocation } from "wouter";
import {
  Plus, ClipboardList, ChevronRight,
  BookOpen, Stethoscope, BarChart2, Users,
  Target, TrendingUp, CheckCircle2,
} from "lucide-react";
import { useListPatients, useListRegistrosClinicos } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/contexts/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { NuevoPacienteModal } from "@/components/nuevo-paciente-modal";

const BRAND_BLUE = "#0E3A6D";
const BRAND_TEAL = "#20C7C7";

// ─── Patient card (same compact style as Patients panel) ──────────────────────

type DisplayStatus = "Buen progreso" | "En progreso" | "Requiere ajuste";

const STATUS: Record<DisplayStatus, { stripe: string; dot: string; label: string }> = {
  "Buen progreso":   { stripe: "#10b981", dot: "bg-emerald-400", label: "text-emerald-600" },
  "En progreso":     { stripe: BRAND_TEAL, dot: "bg-teal-400",   label: "text-teal-600"   },
  "Requiere ajuste": { stripe: "#f43f5e", dot: "bg-rose-400",    label: "text-rose-600"   },
};

function resolveStatus(raw: string | undefined): DisplayStatus {
  if (raw === "Buen progreso") return "Buen progreso";
  if (raw === "En progreso")   return "En progreso";
  return "Requiere ajuste";
}

function shortAction(raw: string | undefined): string | null {
  if (!raw) return null;
  if (raw.includes("Continuar"))  return "Continuar";
  if (raw.includes("Aumentar") || raw.includes("dificultad")) return "Subir nivel";
  if (raw.includes("Revisar"))    return "Revisar";
  if (raw.includes("Agregar") || raw.includes("nuevo")) return "Agregar";
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [, navigate]                       = useLocation();
  const { user }                           = useAuth();
  const [showNewPatient, setShowNewPatient] = useState(false);

  const { data: patients = [], isLoading: loadingPatients } = useListPatients();
  const { data: registros = [] }                            = useListRegistrosClinicos({});

  const firstName = (user as any)?.name?.split(" ")[0] ?? "Profesional";

  const navLinks = [
    { label: "Registros", icon: ClipboardList, path: "/registros"     },
    { label: "Banco",     icon: BookOpen,      path: "/goal-library"  },
    { label: "Equipo",    icon: Stethoscope,   path: "/professionals" },
    { label: "Reportes",  icon: BarChart2,     path: "/reportes"      },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col gap-5 animate-in fade-in duration-400">

        {/* ── Top bar: greeting + primary CTA ─────────────────────────── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">
              Neurometric Lab
            </p>
            <h1 className="text-xl font-bold mt-0.5" style={{ color: BRAND_BLUE }}>
              {firstName}
            </h1>
          </div>

          <button
            onClick={() => navigate("/nueva-sesion")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-md
                       transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
            style={{ background: `linear-gradient(90deg, ${BRAND_TEAL} 0%, #18b3b3 100%)` }}
          >
            <ClipboardList className="h-4 w-4" />
            Nueva sesión
          </button>
        </div>

        {/* ── Active patients ──────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold" style={{ color: BRAND_BLUE }}>
                Pacientes activos
              </h2>
              {!loadingPatients && (
                <span className="text-xs text-slate-400">({(patients as any[]).length})</span>
              )}
            </div>
            <button
              onClick={() => setShowNewPatient(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border
                         transition-all hover:bg-slate-50 active:scale-95"
              style={{ color: BRAND_BLUE, borderColor: "#e2e8f0" }}
            >
              <Plus className="h-3 w-3" />
              Nuevo paciente
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {loadingPatients ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3.5 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-40" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-1 flex-1 rounded-full" />
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-6 w-16 rounded-md" />
                  </div>
                </div>
              ))
            ) : (patients as any[]).length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Sin pacientes registrados.</p>
                <button
                  onClick={() => setShowNewPatient(true)}
                  className="mt-3 text-xs font-semibold px-4 py-2 rounded-lg text-white"
                  style={{ background: BRAND_TEAL }}
                >
                  Agregar primer paciente
                </button>
              </div>
            ) : (
              (patients as any[]).map(patient => {
                const displayStatus = resolveStatus(patient.clinicalStatus);
                const sc            = STATUS[displayStatus];
                const focus         = patient.currentFocus as { title: string; area: string } | null | undefined;
                const action        = shortAction(patient.nextAction);
                const pct           = patient.promedioDesempeno != null
                  ? Math.round((patient.promedioDesempeno as number) * 100)
                  : null;
                const focusLine     = focus
                  ? [focus.area, focus.title].filter(Boolean).join(" – ")
                  : (patient.diagnosis ?? null);

                return (
                  <div
                    key={patient.id}
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    className="bg-white rounded-xl border border-slate-100 shadow-sm cursor-pointer group
                               hover:shadow-md hover:border-slate-200 transition-all duration-200 overflow-hidden flex"
                    style={{ borderLeft: `3px solid ${sc.stripe}` }}
                  >
                    <div className="flex-1 p-4 min-w-0 flex flex-col gap-2.5">

                      {/* Row 1: Name · age · status */}
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-baseline gap-2 min-w-0">
                          <span className="font-semibold text-sm truncate leading-none" style={{ color: BRAND_BLUE }}>
                            {patient.name}
                          </span>
                          {patient.age && (
                            <span className="text-xs text-slate-400 shrink-0 leading-none">{patient.age}a</span>
                          )}
                        </div>
                        <span className={`flex items-center gap-1 text-xs font-medium shrink-0 ${sc.label}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot} shrink-0`} />
                          {displayStatus}
                        </span>
                      </div>

                      {/* Row 2: Focus line */}
                      {focusLine && (
                        <p className="text-xs text-slate-500 truncate leading-none">{focusLine}</p>
                      )}

                      {/* Row 3: Progress + action */}
                      <div className="flex items-center gap-2 mt-0.5">
                        {pct !== null ? (
                          <>
                            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, background: sc.stripe }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 shrink-0 tabular-nums">{pct}%</span>
                          </>
                        ) : (
                          <div className="flex-1" />
                        )}

                        {action ? (
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/patients/${patient.id}`); }}
                            className="shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold
                                       transition-all hover:opacity-80 active:scale-95"
                            style={{ color: BRAND_TEAL, background: BRAND_TEAL + "18" }}
                          >
                            {action}
                          </button>
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400 shrink-0 transition-colors" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {(patients as any[]).length > 0 && (
            <button
              onClick={() => navigate("/patients")}
              className="mt-3 flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
              style={{ color: BRAND_TEAL }}
            >
              Ver todos los pacientes <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* ── Quick nav ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {navLinks.map(link => (
            <button
              key={link.label}
              onClick={() => navigate(link.path)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border
                         bg-white transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95"
              style={{ color: BRAND_BLUE, borderColor: "#e2e8f0" }}
            >
              <link.icon className="h-3.5 w-3.5 text-slate-400" />
              {link.label}
            </button>
          ))}
        </div>

      </div>

      <NuevoPacienteModal open={showNewPatient} onClose={() => setShowNewPatient(false)} />
    </AppLayout>
  );
}
