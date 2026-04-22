import { BarChart3, TrendingUp, Users, Target, ClipboardList, Sparkles } from "lucide-react";
import {
  useGetDashboardStats, useListGoals, useListRegistrosClinicos,
  useListPatients,
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

type Goal = { status: string; category: string; patientName?: string };
type RC   = { patientName?: string | null; professionalName?: string | null };

export default function Reportes() {
  const { data: stats } = useGetDashboardStats();
  const { data: goals = [] }      = useListGoals();
  const { data: registros = [] }  = useListRegistrosClinicos();
  const { data: patients = [] }   = useListPatients();

  const allGoals = goals as Goal[];
  const allReg   = registros as RC[];

  // Goals by status
  const goalStatusData = [
    { name: "Activos",     value: allGoals.filter(g => g.status === "activo").length,     color: "hsl(24,54%,50%)" },
    { name: "Logrados",    value: allGoals.filter(g => g.status === "logrado").length,    color: "#10b981" },
    { name: "En progreso", value: allGoals.filter(g => g.status === "en progreso").length, color: "#f59e0b" },
    { name: "Suspendidos", value: allGoals.filter(g => g.status === "suspendido").length, color: "#ef4444" },
  ].filter(d => d.value > 0);

  // Goals by category
  const catMap: Record<string, number> = {};
  for (const g of allGoals) catMap[g.category] = (catMap[g.category] ?? 0) + 1;
  const categoryData = Object.entries(catMap).map(([cat, count]) => ({ cat: cat.charAt(0).toUpperCase() + cat.slice(1), count })).sort((a, b) => b.count - a.count);

  // Records by patient
  const recPatMap: Record<string, number> = {};
  for (const r of allReg) {
    const k = r.patientName ?? "Sin nombre";
    recPatMap[k] = (recPatMap[k] ?? 0) + 1;
  }
  const recByPatient = Object.entries(recPatMap).map(([name, count]) => ({ name, count }));

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">

        {/* Header */}
        <div className="bg-card border border-border/50 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                Reportes
              </h1>
              <p className="text-muted-foreground mt-1">Resumen estadístico de la plataforma clínica.</p>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Pacientes", value: patients.length, icon: Users, color: "text-primary bg-primary/10" },
            { label: "Registros clínicos", value: allReg.length, icon: ClipboardList, color: "text-amber-700 bg-amber-50" },
            { label: "Objetivos activos", value: allGoals.filter(g => g.status === "activo").length, icon: Target, color: "text-amber-600 bg-amber-100" },
            { label: "Logros", value: allGoals.filter(g => g.status === "logrado").length, icon: TrendingUp, color: "text-emerald-600 bg-emerald-100" },
          ].map(s => (
            <Card key={s.label} className="border-border/50 shadow-sm">
              <CardContent className="p-5">
                <div className={`inline-flex p-2.5 rounded-xl ${s.color} mb-3`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <p className="text-3xl font-display font-bold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Goals by status */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Objetivos por estado
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {goalStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={goalStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                      {goalStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">Sin datos de objetivos.</div>
              )}
            </CardContent>
          </Card>

          {/* Goals by category */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" /> Objetivos por categoría
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 18% 92%)" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="cat" type="category" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(24,54%,50%)" radius={[0, 4, 4, 0]} name="Objetivos" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">Sin datos.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts row 2 */}
        <div className="grid md:grid-cols-1 gap-6">
          {/* Records by patient */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-amber-600" /> Sesiones por paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {recByPatient.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={recByPatient}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 18% 92%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(176,44%,38%)" radius={[4, 4, 0, 0]} name="Sesiones" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">Sin datos de sesiones.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Patient progress table */}
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Progreso por paciente
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b">
                <tr>
                  <th className="px-6 py-3 font-medium">Paciente</th>
                  <th className="px-6 py-3 font-medium">Profesional tratante</th>
                  <th className="px-6 py-3 font-medium text-center">Obj. activos</th>
                  <th className="px-6 py-3 font-medium text-center">Logrados</th>
                  <th className="px-6 py-3 font-medium text-center">Registros</th>
                  <th className="px-6 py-3 font-medium">Desempeño</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {patients.map(p => {
                  const pGoals = allGoals.filter(g => g.patientName === p.name || (g as any).patientId === p.id);
                  const pReg = allReg.filter(r => r.patientName === p.name);
                  const pct = p.promedioDesempeno != null ? Math.round(p.promedioDesempeno * 100) : null;
                  const profesional = (p as any).profesionalNombre ?? null;
                  return (
                    <tr key={p.id} className="hover:bg-muted/40/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold font-display">{p.name.charAt(0)}</div>
                          <span className="font-medium text-foreground">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground/80">
                        {profesional ?? <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-amber-700">{pGoals.filter(g => g.status === "activo").length}</td>
                      <td className="px-6 py-4 text-center font-semibold text-emerald-600">{pGoals.filter(g => g.status === "logrado").length}</td>
                      <td className="px-6 py-4 text-center">{pReg.length}</td>
                      <td className="px-6 py-4">
                        {pct != null ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 max-w-[100px] h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-foreground/80">{pct}%</span>
                          </div>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
