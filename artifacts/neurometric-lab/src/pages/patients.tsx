import { useState } from "react";
import { useLocation } from "wouter";
import {
  Users, Search, UserCircle, ChevronRight, Calendar, User, Activity
} from "lucide-react";
import { useListPatients } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

function semaforoColor(semaforo?: string | null) {
  if (!semaforo) return { dot: "bg-slate-300", badge: "bg-slate-100 text-slate-600" };
  if (semaforo.includes("🟢")) return { dot: "bg-emerald-400", badge: "bg-emerald-100 text-emerald-700" };
  if (semaforo.includes("🟡")) return { dot: "bg-yellow-400", badge: "bg-yellow-100 text-yellow-700" };
  if (semaforo.includes("🔴")) return { dot: "bg-red-400", badge: "bg-red-100 text-red-700" };
  return { dot: "bg-slate-300", badge: "bg-slate-100 text-slate-600" };
}

function progressLabel(semaforo?: string | null) {
  if (!semaforo) return "Sin datos";
  if (semaforo.includes("🟢")) return "Buen progreso";
  if (semaforo.includes("🟡")) return "En progreso";
  if (semaforo.includes("🔴")) return "Requiere atención";
  return semaforo;
}

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [, navigate] = useLocation();
  const { data: patients, isLoading } = useListPatients();

  const filtered = (patients ?? []).filter(p => {
    const q = searchTerm.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) ||
      (p.diagnosis ?? "").toLowerCase().includes(q) ||
      (p.profesionalNombre ?? "").toLowerCase().includes(q) ||
      (p.franjaEtaria ?? "").includes(q);
  });

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">

        <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl border border-border/50 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                Pacientes
              </h1>
              <p className="text-slate-500 mt-1">
                {patients?.length ?? 0} paciente{patients?.length !== 1 ? "s" : ""} registrados
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar pacientes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-64 bg-slate-50 border-slate-200 focus-visible:ring-primary/20"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="overflow-hidden border-border/50 shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-20 w-full rounded-lg" />
                </CardContent>
              </Card>
            ))
          ) : filtered.length > 0 ? (
            filtered.map(patient => {
              const sc = semaforoColor(patient.semaforo);
              const pct = patient.promedioDesempeno != null
                ? `${Math.round(patient.promedioDesempeno * 100)}%`
                : null;
              return (
                <Card
                  key={patient.id}
                  className="overflow-hidden border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 group cursor-pointer"
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <CardContent className="p-0">
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-5">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl font-display ring-4 ring-white shadow-sm">
                            {patient.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-primary transition-colors">
                              {patient.name}
                            </h3>
                            {patient.age && (
                              <p className="text-sm text-slate-500">{patient.age} años</p>
                            )}
                          </div>
                        </div>
                        {patient.semaforo && (
                          <Badge variant="secondary" className={`${sc.badge} border-0 text-xs font-medium`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${sc.dot} mr-1.5 inline-block`} />
                            {progressLabel(patient.semaforo)}
                          </Badge>
                        )}
                      </div>

                      {/* Info grid */}
                      <div className="space-y-2.5 text-sm">
                        {patient.diagnosis && (
                          <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <Activity className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span className="text-slate-700 line-clamp-2">{patient.diagnosis}</span>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          {patient.profesionalNombre && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="truncate text-xs">{patient.profesionalNombre}</span>
                            </div>
                          )}
                          {patient.franjaEtaria && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="text-xs">Franja {patient.franjaEtaria}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Performance bar */}
                      {pct && (
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs text-slate-500 font-medium">Promedio desempeño</span>
                            <span className="text-xs font-bold text-slate-700">{pct}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: pct }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>{(patient as any).totalRegistros ?? 0} registros</span>
                      <span className="flex items-center gap-1 text-primary font-medium group-hover:gap-2 transition-all">
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
              <p className="text-slate-500 mt-1">Intenta ajustar la búsqueda.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
