import { useState } from "react";
import { useLocation } from "wouter";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import {
  Plus, ClipboardList, ChevronRight, BookOpen,
  Users, Users2, Target, CalendarDays, Clock, Sparkles,
  ArrowRight, Calendar, TrendingUp,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/contexts/auth-context";
import { NuevoPacienteModal } from "@/components/nuevo-paciente-modal";

const TIPO_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  sesion:     { dot: "bg-primary/60",   bg: "bg-primary/10",   text: "text-primary"       },
  evaluacion: { dot: "bg-secondary/80", bg: "bg-secondary/30", text: "text-secondary-foreground" },
  reunion:    { dot: "bg-amber-300",    bg: "bg-amber-50",     text: "text-amber-700"     },
  otro:       { dot: "bg-muted-border", bg: "bg-muted",        text: "text-muted-foreground" },
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

  const isAdmin = user?.role === "admin";

  const quickLinks = [
    { label: "Pacientes",          subtitle: "Gestión de casos",    icon: Users,        path: "/patients",     iconBg: "bg-primary/10",  iconColor: "text-primary"  },
    { label: "Agenda",             subtitle: "Citas y horarios",    icon: CalendarDays, path: "/agenda",       iconBg: "bg-secondary/40", iconColor: "text-secondary-foreground" },
    { label: "Banco de Objetivos", subtitle: "Metas terapéuticas",  icon: BookOpen,     path: "/goal-library", iconBg: "bg-accent/15",   iconColor: "text-accent"   },
    ...(isAdmin ? [{ label: "Usuarios", subtitle: "Equipo clínico", icon: Users2, path: "/usuarios", iconBg: "bg-muted", iconColor: "text-muted-foreground" }] : []),
  ];

  const stats = [
    { label: "Pacientes",          value: totalPatients,  icon: Users,        iconBg: "bg-primary/10",   iconColor: "text-primary",  valueColor: "text-primary"  },
    { label: "Objetivos activos",  value: activeGoals,    icon: Target,       iconBg: "bg-accent/15",    iconColor: "text-accent",   valueColor: "text-accent"   },
    { label: "Citas esta semana",  value: sessionsSemana, icon: TrendingUp,   iconBg: "bg-secondary/30", iconColor: "text-secondary-foreground", valueColor: "text-foreground" },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col gap-7 animate-in fade-in duration-400 max-w-2xl mx-auto w-full">

        {/* ── Greeting ───────────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-medium text-muted-foreground capitalize tracking-wide">{todayLabel}</p>
          <h1 className="text-2xl font-semibold mt-1 font-display text-foreground">
            Hola, <span className="text-primary">{firstName}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Bienvenido a tu plataforma clínica</p>
        </div>

        {/* ── Primary actions ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/nueva-sesion")}
            className="flex flex-col items-start gap-3 px-5 py-5 rounded-2xl border border-primary/20
                       bg-primary/8 hover:bg-primary/14 transition-all duration-200 active:scale-[0.98] text-left group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 group-hover:bg-primary/22 transition-colors">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">Nueva sesión</p>
              <p className="text-xs text-muted-foreground mt-0.5 font-normal">Registrar atención</p>
            </div>
          </button>

          <button
            onClick={() => setShowNewPatient(true)}
            className="flex flex-col items-start gap-3 px-5 py-5 rounded-2xl border border-accent/25
                       bg-accent/8 hover:bg-accent/14 transition-all duration-200 active:scale-[0.98] text-left group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 group-hover:bg-accent/22 transition-colors">
              <Plus className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">Nuevo paciente</p>
              <p className="text-xs text-muted-foreground mt-0.5 font-normal">Agregar al sistema</p>
            </div>
          </button>
        </div>

        {/* ── Stats summary ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map(s => (
            <div key={s.label} className="bg-card rounded-2xl border border-card-border shadow-sm p-4 text-center">
              <div className={`inline-flex items-center justify-center h-9 w-9 rounded-xl mb-3 ${s.iconBg}`}>
                <s.icon className={`h-4 w-4 ${s.iconColor}`} />
              </div>
              <p className={`text-2xl font-bold font-display ${s.valueColor}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Agenda de hoy ─────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Agenda de hoy
            </h2>
            <button
              onClick={() => navigate("/agenda")}
              className="text-xs font-medium flex items-center gap-0.5 text-accent hover:text-accent/80 transition-colors"
            >
              Ver agenda <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {loadingCitas ? (
            <div className="space-y-2">
              {[0, 1].map(i => (
                <div key={i} className="h-16 bg-muted/60 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : citasHoyActive.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 rounded-2xl border border-dashed border-border bg-card text-center">
              <CalendarDays className="h-8 w-8 text-muted-foreground/25 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Sin citas para hoy</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Tu agenda está libre</p>
              <button
                onClick={() => navigate("/agenda")}
                className="mt-4 text-xs font-semibold px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/16 transition-colors"
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
                      className="flex items-center gap-3 bg-card rounded-2xl border border-card-border shadow-sm px-4 py-3.5 hover:shadow-md transition-all duration-200"
                    >
                      <div className={`flex items-center justify-center h-9 w-9 rounded-xl shrink-0 ${colors.bg}`}>
                        <Clock className={`h-4 w-4 ${colors.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{cita.titulo}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cita.horaInicio} – {cita.horaFin}
                          {cita.tipo && (
                            <span className="ml-2 text-muted-foreground/70">{TIPO_LABELS[cita.tipo] ?? cita.tipo}</span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate("/nueva-sesion")}
                        className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary transition-all hover:bg-primary/18 active:scale-95"
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

        {/* ── Quick access ─────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Acceso rápido</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickLinks.map(link => (
              <button
                key={link.label}
                onClick={() => navigate(link.path)}
                className="flex flex-col items-start gap-3 p-4 bg-card rounded-2xl border border-card-border shadow-sm
                           text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97] group"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${link.iconBg} transition-transform group-hover:scale-110`}>
                  <link.icon className={`h-4.5 w-4.5 ${link.iconColor}`} />
                </div>
                <div className="w-full">
                  <p className="text-xs font-semibold text-foreground leading-tight">{link.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{link.subtitle}</p>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors self-end" />
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
