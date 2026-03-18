import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users, ClipboardList, Target, BarChart2,
  ChevronRight, UserPlus, BookOpen, Stethoscope, Search,
} from "lucide-react";
import {
  useListPatients, useListRegistrosClinicos, useListGoals,
  getListGoalsQueryKey, getListRegistrosClinicosQueryKey,
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/contexts/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { NuevoPacienteModal } from "@/components/nuevo-paciente-modal";
import { RegistroForm, PERFORMANCE_MAP } from "@/components/registro-clinico-form";

const BRAND_BLUE = "#0E3A6D";
const BRAND_TEAL = "#20C7C7";

// ─── Session modal: step 1 = patient picker, step 2 = real RegistroForm ────────
function SesionModal({ patients, open, onClose, onSaved }: {
  patients: any[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast }                   = useToast();
  const queryClient                 = useQueryClient();
  const [step, setStep]             = useState<1 | 2>(1);
  const [search, setSearch]         = useState("");
  const [patient, setPatient]       = useState<any>(null);
  const [isSaving, setIsSaving]     = useState(false);

  const { data: goalsRaw = [] } = useQuery({
    queryKey: ["session-goals", patient?.id],
    queryFn: async () => {
      const res = await fetch(`/api/goals?patientId=${patient.id}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!patient,
  });

  const workingGoals = (goalsRaw as any[]).filter(
    g => g.status === "activo" || g.status === "en progreso"
  );

  const handleClose = () => {
    setStep(1); setSearch(""); setPatient(null);
    onClose();
  };

  const handleSave = async (d: { registro: any; goalUpdates: Array<{ goalId: number; performance: string }> }) => {
    setIsSaving(true);
    try {
      const rcRes = await fetch("/api/registros-clinicos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d.registro),
      });
      if (!rcRes.ok) throw new Error();
      const rc = await rcRes.json();

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
              registroClinicoId: rc.id,
              nota: `Sesión ${rc.fecha}: ${map.label}`,
            }),
          });
        }));
      }

      queryClient.invalidateQueries({ queryKey: getListRegistrosClinicosQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
      const n = d.goalUpdates.length;
      toast({ title: n > 0 ? `Registro guardado · ${n} objetivo${n !== 1 ? "s" : ""} actualizado${n !== 1 ? "s" : ""}` : "Registro creado" });
      onSaved();
      handleClose();
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = patients.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2" style={{ color: BRAND_BLUE }}>
            <ClipboardList className="h-5 w-5" style={{ color: BRAND_TEAL }} />
            Nuevo registro clínico
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Selecciona el paciente para registrar la sesión de hoy."
              : `Sesión con ${patient?.name}`}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          /* ── PASO 1: selector de paciente ─────────────────────────── */
          <div className="space-y-3 py-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar paciente..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-slate-50"
                autoFocus
              />
            </div>

            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-8">Sin resultados</p>
              ) : filtered.map((p: any) => (
                <button
                  key={p.id}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors"
                  onClick={() => { setPatient(p); setStep(2); }}
                >
                  <div
                    className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ background: BRAND_TEAL }}
                  >
                    {p.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                    {p.age && <p className="text-xs text-slate-500">{p.age} años</p>}
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ── PASO 2: formulario real ──────────────────────────────── */
          <div>
            <button
              className="mb-3 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
              onClick={() => setStep(1)}
            >
              ← Cambiar paciente
            </button>
            <RegistroForm
              patientId={patient.id}
              workingGoals={workingGoals}
              onSave={handleSave}
              isSaving={isSaving}
              onClose={handleClose}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [, navigate]                               = useLocation();
  const { user }                                   = useAuth();
  const queryClient                                = useQueryClient();
  const [showSession, setShowSession]              = useState(false);
  const [showNewPatient, setShowNewPatient]         = useState(false);

  const { data: patients = [] }  = useListPatients();
  const { data: registros = [] } = useListRegistrosClinicos({});
  const { data: goals = [] }     = useListGoals({});

  const activeGoals = (goals as any[]).filter(g => g.status === "activo" || g.status === "en progreso");
  const recentRCs   = (registros as any[]).slice(-5).reverse();

  const stats = [
    { label: "Pacientes",        value: patients.length,     icon: Users,         tint: "bg-blue-50",  iconColor: "text-blue-600"  },
    { label: "Sesiones totales", value: registros.length,    icon: ClipboardList, tint: "bg-teal-50",  iconColor: "text-teal-600"  },
    { label: "Objetivos activos",value: activeGoals.length,  icon: Target,        tint: "bg-amber-50", iconColor: "text-amber-600" },
  ];

  const quickActions = [
    { label: "Ver pacientes",      icon: Users,         path: "/patients",     desc: "Listado completo"       },
    { label: "Registros clínicos", icon: ClipboardList, path: "/registros",    desc: "Sesiones y evolución"   },
    { label: "Banco de objetivos", icon: BookOpen,      path: "/goal-library", desc: "Biblioteca terapéutica" },
    { label: "Profesionales",      icon: Stethoscope,   path: "/professionals",desc: "Equipo clínico"         },
    { label: "Reportes",           icon: BarChart2,     path: "/reportes",     desc: "Estadísticas y avances" },
  ];

  const firstName = (user as any)?.name?.split(" ")[0] ?? "Profesional";

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">

        {/* Hero */}
        <div
          className="rounded-2xl p-6 sm:p-8 text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${BRAND_BLUE} 0%, #1a5296 60%, #0d4f8c 100%)` }}
        >
          <p className="text-blue-200 text-sm font-medium mb-1">Bienvenido/a de vuelta</p>
          <h1 className="text-2xl sm:text-3xl font-display font-bold mb-1">{firstName}</h1>
          <p className="text-blue-200 text-sm">Plataforma clínica Neurometric Lab</p>
        </div>

        {/* Primary CTAs */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowSession(true)}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base text-white shadow-md transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{ background: `linear-gradient(90deg, ${BRAND_TEAL} 0%, #18b3b3 100%)` }}
          >
            <ClipboardList className="h-5 w-5" />
            Nueva sesión
          </button>

          <button
            onClick={() => setShowNewPatient(true)}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base text-white shadow-md transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{ background: `linear-gradient(90deg, ${BRAND_BLUE} 0%, #1a5296 100%)` }}
          >
            <UserPlus className="h-5 w-5" />
            Nuevo paciente
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl ${s.tint} flex items-center justify-center shrink-0`}>
                <s.icon className={`h-6 w-6 ${s.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-slate-900">{s.value}</p>
                <p className="text-sm text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick actions — untouched */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-border/50 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Acceso rápido</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickActions.map(a => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.path)}
                  className="flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left group hover:shadow-md active:scale-[0.98]"
                  style={{ background: "#f8fafc", borderColor: "#e2e8f0", color: BRAND_BLUE }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "#f1f5f9";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = BRAND_TEAL;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2e8f0";
                  }}
                >
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${BRAND_TEAL}18` }}>
                    <a.icon className="h-5 w-5" style={{ color: BRAND_TEAL }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight" style={{ color: BRAND_BLUE }}>{a.label}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "#64748b" }}>{a.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 opacity-50" style={{ color: BRAND_BLUE }} />
                </button>
              ))}
            </div>
          </div>

          {/* Recent sessions */}
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Últimas sesiones</h2>
            {recentRCs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <ClipboardList className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">Sin registros aún</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {recentRCs.map((r: any) => (
                  <li
                    key={r.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-teal-200 hover:bg-teal-50/40 transition-colors cursor-pointer"
                    onClick={() => navigate(`/patients/${r.patientId}`)}
                  >
                    <div
                      className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white mt-0.5"
                      style={{ background: BRAND_TEAL }}
                    >
                      {(r.patientName ?? "?").charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{r.patientName ?? "Paciente"}</p>
                      <p className="text-xs text-slate-500">{r.fecha}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => navigate("/registros")}
              className="mt-4 w-full text-center text-xs font-medium transition-colors py-2 rounded-lg hover:bg-slate-50"
              style={{ color: BRAND_TEAL }}
            >
              Ver todos los registros →
            </button>
          </div>
        </div>

      </div>

      <SesionModal
        patients={patients as any[]}
        open={showSession}
        onClose={() => setShowSession(false)}
        onSaved={() => queryClient.invalidateQueries()}
      />

      <NuevoPacienteModal
        open={showNewPatient}
        onClose={() => setShowNewPatient(false)}
      />
    </AppLayout>
  );
}
