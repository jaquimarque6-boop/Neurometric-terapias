import { useState } from "react";
import { useLocation } from "wouter";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import {
  Plus, ClipboardList, ChevronRight, BookOpen,
  Users, Target, CalendarDays, Clock, Sparkles,
  ArrowRight, Calendar,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/contexts/auth-context";
import { NuevoPacienteModal } from "@/components/nuevo-paciente-modal";

const BRAND_BLUE = "#0E3A6D";
const BRAND_TEAL = "#20C7C7";

const TIPO_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  sesion:     { dot: "bg-primary/70",  bg: "bg-primary/8",  text: "text-primary"      },
  evaluacion: { dot: "bg-rose-400",    bg: "bg-rose-50",    text: "text-rose-700"     },
  reunion:    { dot: "bg-amber-400",   bg: "bg-amber-50",   text: "text-amber-700"    },
  otro:       { dot: "bg-stone-300",   bg: "bg-stone-50",   text: "text-stone-600"    },
};
const TIPO_LABELS: Record<string, string> = {
  sesion: "Sesión", evaluacion: "Evaluación", reunion: "Reunión", otro: "Otro",
};

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [showNewPatient, setShowNewPatient] = useState(false);

  const today      = format(new Date(), "yyyy-MM-dd");
  const todayLabel = format(new Date(), "EEEE d 'de' MMMM", { locale: es });
  const weekStart  = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd    = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  const firstName = (user as any)?.name?.split(" ")[0] ?? "Profesional";

  const { data: patients = [] } = useQuery<any[]>({
    queryKey: ["listPatients"],
    queryFn: async () => {
      const res = await fetch("/api/patients");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: goals = [] } = useQuery<any[]>({
    queryKey: ["listGoals"],
    queryFn: async () => {
      const res = await fetch("/api/goals");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: citasHoy = [], isLoading: loadingCitas } = useQuery<any[]>({
    queryKey: ["citas", today, today],
    queryFn: async () => {
      const res = await fetch(`/api/citas?start=${today}&end=${today}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: citasSemana = [] } = useQuery<any[]>({
    queryKey: ["citas", weekStart, weekEnd],
    queryFn: async () => {
      const res = await fetch(`/api/citas?start=${weekStart}&end=${weekEnd}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const totalPatients  = (patients as any[]).length;
  const activeGoals    = (goals as any[]).filter(g => g.status === "activo" || g.status === "en progreso").length;
  const sessionsSemana = (citasSemana as any[]).filter(c => c.status !== "cancelada").length;
  const citasHoyActive = (citasHoy as any[]).filter(c => c.status !== "cancelada");

  const quickLinks = [
    { label: "Pacientes",          icon: Users,        path: "/patients",    color: BRAND_BLUE },
    { label: "Agenda",             icon: CalendarDays, path: "/agenda",      color: "#C4703A"  },
    { label: "Banco de Objetivos", icon: BookOpen,     path: "/goal-library",color: BRAND_TEAL },
  ];

  const stats = [
    { label: "Pacientes",          value: totalPatients,  icon: Users,        color: "text-primary",   bg: "bg-primary/8"   },
    { label: "Objetivos activos",  value: activeGoals,    icon: Target,       color: "text-amber-600", bg: "bg-amber-50"    },
    { label: "Citas esta semana",  value: sessionsSemana, icon: CalendarDays, color: "text-teal-600",  bg: "bg-teal-50"     },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-400 max-w-2xl mx-auto w-full">

        {/* ── Greeting ───────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground font-medium capitalize">{todayLabel}</p>
            <h1 className="text-2xl font-bold mt-0.5 font-display" style={{ color: BRAND_BLUE }}>
              Hola, {firstName}
            </h1>
          </div>
        </div>

        {/* ── Primary actions ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/nueva-sesion")}
            className="flex flex-col items-start gap-2 px-5 py-4 rounded-2xl font-semibold text-white shadow-md
                       transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
            style={{ background: `linear-gradient(135deg, ${BRAND_BLUE} 0%, #1a5ea0 100%)` }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">Nueva sesión</p>
              <p className="text-xs font-normal text-white/70 mt-0.5">Registrar atención</p>
            </div>
          </button>

          <button
            onClick={() => setShowNewPatient(true)}
            className="flex flex-col items-start gap-2 px-5 py-4 rounded-2xl font-semibold text-white shadow-md
                       transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
            style={{ background: `linear-gradient(135deg, ${BRAND_TEAL} 0%, #18b3b3 100%)` }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">Nuevo paciente</p>
              <p className="text-xs font-normal text-white/70 mt-0.5">Agregar al sistema</p>
            </div>
          </button>
        </div>

        {/* ── Hoy ─────────────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-muted-foreground" /> Agenda de hoy
            </h2>
            <button
              onClick={() => navigate("/agenda")}
              className="text-xs font-medium flex items-center gap-0.5 transition-colors hover:opacity-75"
              style={{ color: BRAND_TEAL }}
            >
              Ver agenda <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {loadingCitas ? (
            <div className="space-y-2">
              {[0, 1].map(i => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : citasHoyActive.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 rounded-2xl border border-dashed border-border bg-card text-center">
              <CalendarDays className="h-7 w-7 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Sin citas programadas para hoy</p>
              <button
                onClick={() => navigate("/agenda")}
                className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                Ir a la Agenda
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {citasHoyActive
                .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
                .map((cita: any) => {
                  const colors = TIPO_COLORS[cita.tipo] ?? TIPO_COLORS.otro;
                  return (
                    <div
                      key={cita.id}
                      className="flex items-center gap-3 bg-card rounded-xl border border-border/50 shadow-sm px-4 py-3 hover:shadow-md transition-shadow"
                    >
                      <div className={`flex items-center justify-center h-9 w-9 rounded-xl shrink-0 ${colors.bg}`}>
                        <Clock className={`h-4 w-4 ${colors.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{cita.titulo}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cita.horaInicio} – {cita.horaFin}
                          {cita.tipo && (
                            <span className="ml-2">{TIPO_LABELS[cita.tipo] ?? cita.tipo}</span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate("/nueva-sesion")}
                        className="shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90 active:scale-95"
                        style={{ background: BRAND_TEAL }}
                      >
                        <Sparkles className="h-3 w-3" />
                        Iniciar
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* ── Stats summary ────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3">Resumen</h2>
          <div className="grid grid-cols-3 gap-3">
            {stats.map(s => (
              <div key={s.label} className="bg-card rounded-xl border border-border/50 shadow-sm p-4 text-center">
                <div className={`inline-flex items-center justify-center h-8 w-8 rounded-xl mb-2 ${s.bg}`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <p className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick access ─────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3">Acceso rápido</h2>
          <div className="grid grid-cols-3 gap-3">
            {quickLinks.map(link => (
              <button
                key={link.label}
                onClick={() => navigate(link.path)}
                className="flex flex-col items-center gap-2 py-4 px-3 bg-card rounded-2xl border border-border/50 shadow-sm
                           text-center transition-all duration-200 hover:shadow-md hover:border-border active:scale-[0.97] group"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                  style={{ background: link.color + "18" }}
                >
                  <link.icon className="h-5 w-5" style={{ color: link.color }} />
                </div>
                <span className="text-xs font-semibold text-foreground leading-tight">{link.label}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
              </button>
            ))}
          </div>
        </div>

      </div>

      <NuevoPacienteModal
        open={showNewPatient}
        onClose={() => setShowNewPatient(false)}
      />
    </AppLayout>
  );
}
