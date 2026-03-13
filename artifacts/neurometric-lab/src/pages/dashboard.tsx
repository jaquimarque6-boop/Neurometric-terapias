import {
  Users, Activity, Target, BookOpen, ArrowUpRight, Clock, BarChart2, CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import {
  useGetDashboardStats,
  useListSessions,
  useListPatients
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type Registro = {
  id: number;
  patientId: number;
  patientName?: string | null;
  sesionNumero?: number | null;
  objetivoNombre?: string | null;
  areaObjetivo?: string | null;
  fecha?: string | null;
  estado?: string | null;
  porcentaje?: string | null;
  createdAt: string;
};

function parsePercent(p?: string | null): number {
  if (!p) return 0;
  return parseFloat(p.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: sessions, isLoading: sessionsLoading } = useListSessions();
  const { data: patients, isLoading: patientsLoading } = useListPatients();

  const recentSessions = ((sessions ?? []) as Registro[]).slice(0, 5);
  const recentPatients = (patients ?? []).slice(0, 5);

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Panel Clínico</h1>
            <p className="text-slate-500 mt-1">Resumen de actividad de la plataforma Neurometric Lab.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-xl border shadow-sm">
            <Clock className="h-4 w-4 text-primary" />
            Actualizado: {format(new Date(), 'HH:mm')}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Pacientes"
            value={stats?.totalPatients}
            loading={statsLoading}
            icon={Users}
            trend={`${stats?.newPatientsThisMonth || 0} este mes`}
            color="primary"
          />
          <StatCard
            title="Registros de Sesión"
            value={stats?.activeSessions}
            loading={statsLoading}
            icon={Activity}
            trend={`${stats?.sessionsThisWeek || 0} esta semana`}
            color="accent"
          />
          <StatCard
            title="Objetivos en Banco"
            value={stats?.goalsAchieved}
            loading={statsLoading}
            icon={BookOpen}
            trend="Neurolengua"
            color="violet"
          />
          <StatCard
            title="Profesionales"
            value={stats?.totalProfessionals}
            loading={statsLoading}
            icon={Users}
            trend="Equipo clínico"
            color="emerald"
          />
        </div>

        {/* Content Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Sessions */}
          <Card className="border-border/50 shadow-lg shadow-slate-200/50 overflow-hidden">
            <CardHeader className="border-b bg-white/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Últimas sesiones registradas
                </CardTitle>
                <button className="text-sm text-primary font-medium hover:underline flex items-center">
                  Ver todas <ArrowUpRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {sessionsLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : recentSessions.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {recentSessions.map(session => {
                    const pct = parsePercent(session.porcentaje);
                    return (
                      <div key={session.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 group">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                            {session.patientName || `Paciente #${session.patientId}`}
                          </p>
                          <p className="text-sm text-slate-500 mt-0.5 truncate">
                            {session.objetivoNombre || "Objetivo no registrado"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          {session.porcentaje && (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-slate-600">{session.porcentaje}</span>
                            </div>
                          )}
                          {session.estado && (
                            <Badge variant="outline" className={`mt-1 text-xs ${
                              session.estado.includes("proceso") ? "bg-blue-50 text-blue-700 border-blue-200" :
                              session.estado.includes("logrado") || session.estado.includes("cumplido") ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              "bg-slate-50 text-slate-600"
                            }`}>
                              {session.estado}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">No hay registros de sesión aún.</div>
              )}
            </CardContent>
          </Card>

          {/* Recent Patients */}
          <Card className="border-border/50 shadow-lg shadow-slate-200/50 overflow-hidden">
            <CardHeader className="border-b bg-white/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Pacientes
                </CardTitle>
                <button className="text-sm text-primary font-medium hover:underline flex items-center">
                  Ver todos <ArrowUpRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {patientsLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : recentPatients.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {recentPatients.map(patient => {
                    const pct = patient.promedioDesempeno != null ? Math.round(patient.promedioDesempeno * 100) : null;
                    return (
                      <div key={patient.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-display">
                            {patient.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{patient.name}</p>
                            <p className="text-sm text-slate-500 mt-0.5">
                              {patient.age ? `${patient.age} años` : ""}
                              {patient.franjaEtaria ? ` · Franja ${patient.franjaEtaria}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {pct != null && (
                            <p className="text-sm font-bold text-slate-700">{pct}%</p>
                          )}
                          {patient.semaforo && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              {patient.semaforo.includes("🟢") ? "Buen progreso" :
                               patient.semaforo.includes("🟡") ? "En progreso" :
                               patient.semaforo.includes("🔴") ? "Requiere atención" : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">No hay pacientes registrados.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({
  title, value, loading, icon: Icon, trend, color
}: {
  title: string;
  value?: number;
  loading: boolean;
  icon: any;
  trend: string;
  color: 'primary' | 'accent' | 'emerald' | 'violet';
}) {
  const colorMap = {
    primary: "text-primary bg-primary/10 border-primary/20",
    accent:  "text-accent bg-accent/10 border-accent/20",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-200",
    violet:  "text-violet-600 bg-violet-50 border-violet-200",
  };

  return (
    <Card className="relative overflow-hidden border-border/50 shadow-md hover:shadow-lg transition-shadow group">
      <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="h-20 w-20" />
      </div>
      <CardContent className="p-5 relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-xl border ${colorMap[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
          <h3 className="font-medium text-slate-500 text-sm">{title}</h3>
        </div>
        {loading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <p className="text-4xl font-display font-bold text-slate-900">{value ?? 0}</p>
        )}
        <div className="mt-3 flex items-center text-xs font-medium text-slate-400 bg-slate-50 w-fit px-2 py-1 rounded-md border border-slate-100">
          <ArrowUpRight className="h-3 w-3 mr-1" /> {trend}
        </div>
      </CardContent>
    </Card>
  );
}
