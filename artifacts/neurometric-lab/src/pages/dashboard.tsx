import { useState } from "react";
import { useLocation } from "wouter";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import {
  Plus, ClipboardList, ChevronRight, BookOpen,
  Users, Users2, Target, CalendarDays, Clock, Sparkles,
  Calendar, TrendingUp, Zap, Puzzle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/contexts/auth-context";
import { NuevoPacienteModal } from "@/components/nuevo-paciente-modal";
import { API_BASE } from "@/lib/api";

const TIPO_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  sesion:     { dot: "bg-primary/50",   bg: "bg-primary/8",    text: "text-primary"             },
  evaluacion: { dot: "bg-secondary/70", bg: "bg-secondary/20", text: "text-secondary-foreground" },
  reunion:    { dot: "bg-amber-300",    bg: "bg-amber-50/80",  text: "text-amber-700"            },
  otro:       { dot: "bg-border",       bg: "bg-muted/60",     text: "text-muted-foreground"     },
};
const TIPO_LABELS: Record<string, string> = {
  sesion: "Sesión", evaluacion: "Evaluación", reunion: "Reunión", otro: "Otro",
};

const QUICK_LINKS = (isAdmin: boolean) => [
  {
    label:    "Pacientes",
    subtitle: "Gestión de casos",
    icon:     Users,
    path:     "/patients",
    color:    "bg-rose-50 border-rose-200/70 hover:bg-rose-100/70 hover:border-rose-300/70",
    iconBg:   "bg-rose-100 border-rose-200/60",
    iconColor:"text-rose-500",
  },
  {
    label:    "Agenda",
    subtitle: "Citas y horarios",
    icon:     CalendarDays,
    path:     "/agenda",
    color:    "bg-amber-50 border-amber-200/70 hover:bg-amber-100/70 hover:border-amber-300/70",
    iconBg:   "bg-amber-100 border-amber-200/60",
    iconColor:"text-amber-600",
  },
  {
    label:    "Banco de Objetivos",
    subtitle: "Metas terapéuticas",
    icon:     BookOpen,
    path:     "/goal-library",
    color:    "bg-emerald-50 border-emerald-200/70 hover:bg-emerald-100/70 hover:border-emerald-300/70",
    iconBg:   "bg-emerald-100 border-emerald-200/60",
    iconColor:"text-emerald-600",
  },
  {
    label:    "Actividades",
    subtitle: "Actividades interactivas",
    icon:     Puzzle,
    path:     "/actividades",
    color:    "bg-violet-50 border-violet-200/70 hover:bg-violet-100/70 hover:border-violet-300/70",
    iconBg:   "bg-violet-100 border-violet-200/60",
    iconColor:"text-violet-600",
  },
  ...(isAdmin ? [{
    label:    "Usuarios",
    subtitle: "Equipo clínico",
    icon:     Users2,
    path:     "/usuarios",
    color:    "bg-sky-50 border-sky-200/70 hover:bg-sky-100/70 hover:border-sky-300/70",
    iconBg:   "bg-sky-100 border-sky-200/60",
    iconColor:"text-sky-600",
  }] : []),
];

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
      const res = await fetch(`${API_BASE}/api/patients`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: goals = [] } = useQuery<any[]>({
    queryKey: ["listGoals"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/goals`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: citasHoy = [], isLoading: loadingCitas } = useQuery<any[]>({
    queryKey: ["citas", today, today],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/citas?start=${today}&end=${today}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: citasSemana = [] } = useQuery<any[]>({
    queryKey: ["citas", weekStart, weekEnd],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/citas?start=${weekStart}&end=${weekEnd}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const totalPatients  = (patients as any[]).length;
  const activeGoals    = (goals as any[]).filter(g => g.status === "activo" || g.status === "en progreso").length;
  const sessionsSemana = (citasSemana as any[]).filter(c => c.status !== "cancelada").length;
  const citasHoyActive = (citasHoy as any[]).filter(c => c.status !== "cancelada");

  const isAdmin    = user?.role === "admin";
  const quickLinks = QUICK_LINKS(isAdmin);

  const stats = [
    { label: "Pacientes",         value: totalPatients,  icon: Users      },
    { label: "Objetivos activos", value: activeGoals,    icon: Target     },
    { label: "Citas esta semana", value: sessionsSemana, icon: TrendingUp },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col gap-5 animate-in fade-in duration-400 max-w-2xl mx-auto w-full">

        {/* ── Greeting ──────────────────────────────────────────────────── */}
        <div className="pt-1">
          <p className="text-xs font-medium text-muted-foreground capitalize tracking-wide">{todayLabel}</p>
          <h1 className="text-[1.6rem] font-semibold mt-0.5 font-display text-foreground leading-tight">
            Hola, <span className="text-primary">{firstName}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Bienvenido a tu plataforma clínica</p>
        </div>

        {/* ── PRIMARY: Sesión rápida ─────────────────────────────────────── */}
        <button
          onClick={() => navigate("/sesion-rapida")}
          className="w-full flex items-center gap-4 px-5 py-5 rounded-2xl
                     border border-border/70 bg-card shadow-sm
                     hover:shadow-md hover:border-border
                     transition-all duration-200 active:scale-[0.99] text-left group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl
                          bg-primary/8 border border-primary/12 shrink-0
                          group-hover:bg-primary/12 transition-colors">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[1.05rem] font-bold text-foreground leading-snug">⚡ Sesión rápida</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full
                               bg-primary/8 text-primary border border-primary/15 leading-none">
                Uso diario
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-snug">
              Registrá observaciones breves en menos de 1 minuto, sin seleccionar objetivos.
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-muted-foreground/60 shrink-0 transition-colors" />
        </button>

        {/* ── SECONDARY + TERTIARY actions ──────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2.5">

          <button
            onClick={() => navigate("/nueva-sesion")}
            className="flex flex-col items-start gap-2.5 px-4 py-4 rounded-2xl
                       border border-border/50 bg-muted/25
                       hover:bg-muted/45 hover:border-border/70
                       transition-all duration-200 active:scale-[0.98] text-left group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-card border border-border/60
                            group-hover:border-border transition-colors">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground/90 leading-tight">🎯 Sesión completa</p>
              <p className="text-xs text-muted-foreground mt-0.5">Objetivos, evolución y planificación</p>
            </div>
          </button>

          <button
            onClick={() => setShowNewPatient(true)}
            className="flex flex-col items-start gap-2.5 px-4 py-4 rounded-2xl
                       border border-border/35 bg-transparent
                       hover:bg-muted/20 hover:border-border/55
                       transition-all duration-200 active:scale-[0.98] text-left group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/50 border border-border/40
                            group-hover:bg-muted/70 transition-colors">
              <Plus className="h-4 w-4 text-muted-foreground/70" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground/75 leading-tight">Nuevo paciente</p>
              <p className="text-xs text-muted-foreground mt-0.5">Agregar al sistema</p>
            </div>
          </button>
        </div>

        {/* ── Acceso rápido ─────────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Acceso rápido</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map(link => (
              <button
                key={link.label}
                onClick={() => navigate(link.path)}
                className={`flex flex-col items-start gap-3 p-4 rounded-2xl border
                            transition-all duration-200 active:scale-[0.97] text-left
                            shadow-sm hover:shadow-md ${link.color}`}
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${link.iconBg}`}>
                  <link.icon className={`h-5 w-5 ${link.iconColor}`} />
                </div>
                <div className="w-full">
                  <p className="text-sm font-bold text-foreground leading-tight">{link.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{link.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2.5">
          {stats.map(s => (
            <div key={s.label} className="bg-card rounded-2xl border border-border/50 shadow-sm px-3 py-4 text-center">
              <p className="text-2xl font-bold font-display text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Agenda de hoy ─────────────────────────────────────────────── */}
        <div className="pb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              Agenda de hoy
            </h2>
            <button
              onClick={() => navigate("/agenda")}
              className="text-xs font-medium flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver agenda <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {loadingCitas ? (
            <div className="space-y-2">
              {[0, 1].map(i => (
                <div key={i} className="h-16 bg-muted/40 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : citasHoyActive.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-9 rounded-2xl border border-dashed border-border/60 bg-card/60 text-center">
              <CalendarDays className="h-7 w-7 text-muted-foreground/20 mb-2.5" />
              <p className="text-sm text-muted-foreground font-medium">Sin citas para hoy</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">Tu agenda está libre</p>
              <button
                onClick={() => navigate("/agenda")}
                className="mt-4 text-xs font-semibold px-4 py-2 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
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
                      className="flex items-center gap-3 bg-card rounded-2xl border border-border/50 shadow-sm px-4 py-3.5
                                 hover:border-border hover:shadow-md transition-all duration-200"
                    >
                      <div className={`flex items-center justify-center h-9 w-9 rounded-xl shrink-0 ${colors.bg}`}>
                        <Clock className={`h-4 w-4 ${colors.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{cita.titulo}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cita.horaInicio} – {cita.horaFin}
                          {cita.tipo && (
                            <span className="ml-2 text-muted-foreground/60">{TIPO_LABELS[cita.tipo] ?? cita.tipo}</span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate("/sesion-rapida")}
                        className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5
                                   rounded-lg border border-border/50 text-muted-foreground
                                   hover:border-border hover:text-foreground transition-all active:scale-95"
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

      </div>

      <NuevoPacienteModal
        open={showNewPatient}
        onClose={() => setShowNewPatient(false)}
      />
    </AppLayout>
  );
}
