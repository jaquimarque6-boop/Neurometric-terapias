import { useLocation } from "wouter";
import {
  Users, ClipboardList, Target, BarChart2,
  ChevronRight, UserPlus, BookOpen, Stethoscope,
} from "lucide-react";
import { useListPatients, useListRegistrosClinicos, useListGoals } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/contexts/auth-context";

const BRAND_BLUE = "#0E3A6D";
const BRAND_TEAL = "#20C7C7";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { data: patients = [] } = useListPatients();
  const { data: registros = [] } = useListRegistrosClinicos({});
  const { data: goals = [] } = useListGoals({});

  const activeGoals  = (goals as any[]).filter(g => g.status === "activo" || g.status === "en progreso");
  const recentRCs    = (registros as any[]).slice(-5).reverse();

  const stats = [
    { label: "Pacientes",       value: patients.length,     icon: Users,         tint: "bg-blue-50",    iconColor: "text-blue-600"   },
    { label: "Sesiones totales",value: registros.length,    icon: ClipboardList, tint: "bg-teal-50",    iconColor: "text-teal-600"   },
    { label: "Objetivos activos",value: activeGoals.length, icon: Target,        tint: "bg-amber-50",   iconColor: "text-amber-600"  },
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

        {/* Primary CTA */}
        <button
          onClick={() => navigate("/patients")}
          className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl font-bold text-base text-white shadow-md transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          style={{ background: `linear-gradient(90deg, ${BRAND_TEAL} 0%, #18b3b3 100%)` }}
        >
          <UserPlus className="h-5 w-5" />
          + Nuevo paciente
        </button>

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
          {/* Quick actions */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-border/50 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Acceso rápido</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickActions.map(a => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.path)}
                  className="flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left group hover:shadow-md active:scale-[0.98]"
                  style={a.cta
                    ? { background: BRAND_TEAL, borderColor: BRAND_TEAL, color: "#fff" }
                    : { background: "#f8fafc", borderColor: "#e2e8f0", color: BRAND_BLUE }
                  }
                  onMouseEnter={e => {
                    if (a.cta) {
                      (e.currentTarget as HTMLButtonElement).style.background = "#18b3b3";
                    } else {
                      (e.currentTarget as HTMLButtonElement).style.background = "#f1f5f9";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = BRAND_TEAL;
                    }
                  }}
                  onMouseLeave={e => {
                    if (a.cta) {
                      (e.currentTarget as HTMLButtonElement).style.background = BRAND_TEAL;
                    } else {
                      (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2e8f0";
                    }
                  }}
                >
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                    style={a.cta ? { background: "rgba(255,255,255,0.2)" } : { background: `${BRAND_TEAL}18` }}
                  >
                    <a.icon className="h-5 w-5" style={a.cta ? { color: "#fff" } : { color: BRAND_TEAL }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight" style={{ color: a.cta ? "#fff" : BRAND_BLUE }}>{a.label}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: a.cta ? "rgba(255,255,255,0.8)" : "#64748b" }}>{a.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 opacity-50" style={{ color: a.cta ? "#fff" : BRAND_BLUE }} />
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
    </AppLayout>
  );
}
