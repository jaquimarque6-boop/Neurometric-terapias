import { useState } from "react";
import { useLocation } from "wouter";
import {
  CalendarDays, Search, Target, BarChart2, User, CheckCircle2, Clock
} from "lucide-react";
import { useListSessions } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  intentos?: number | null;
  intentosSugeridos?: number | null;
  correctas?: number | null;
  porcentaje?: string | null;
  cumpleMeta?: string | null;
  createdAt: string;
};

function parsePercent(p?: string | null): number {
  if (!p) return 0;
  return parseFloat(p.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0;
}

function estadoStyle(estado?: string | null) {
  if (!estado) return "bg-slate-100 text-slate-500";
  if (estado.toLowerCase().includes("cumplido") || estado.toLowerCase().includes("logrado"))
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (estado.toLowerCase().includes("proceso"))
    return "bg-blue-100 text-blue-700 border-blue-200";
  return "bg-slate-100 text-slate-600";
}

const PATIENT_COLORS = ["bg-violet-100 text-violet-700", "bg-sky-100 text-sky-700", "bg-rose-100 text-rose-700", "bg-amber-100 text-amber-700"];

export default function Sessions() {
  const { data: sessions, isLoading } = useListSessions();
  const [search, setSearch] = useState("");
  const [patientFilter, setPatientFilter] = useState("all");

  const allSessions = (sessions ?? []) as Registro[];
  const uniquePatients = Array.from(new Set(allSessions.map(s => s.patientName ?? `#${s.patientId}`)));
  const patientColorMap = Object.fromEntries(uniquePatients.map((n, i) => [n, PATIENT_COLORS[i % PATIENT_COLORS.length]]));

  const filtered = allSessions.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (s.patientName ?? "").toLowerCase().includes(q) ||
      (s.objetivoNombre ?? "").toLowerCase().includes(q) ||
      (s.areaObjetivo ?? "").toLowerCase().includes(q);
    const pName = s.patientName ?? `#${s.patientId}`;
    const matchPatient = patientFilter === "all" || pName === patientFilter;
    return matchSearch && matchPatient;
  });

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">

        {/* Header */}
        <div className="bg-white border border-border/50 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="h-6 w-6 text-primary" />
                Registros de Sesiones
              </h1>
              <p className="text-slate-500 mt-1">
                {allSessions.length} registro{allSessions.length !== 1 ? "s" : ""} de intervención clínica
              </p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 w-48"
                />
              </div>
            </div>
          </div>

          {/* Patient filters */}
          {uniquePatients.length > 0 && (
            <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-slate-100 overflow-x-auto">
              <button
                onClick={() => setPatientFilter("all")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  patientFilter === "all" ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                Todos
              </button>
              {uniquePatients.map(p => (
                <button
                  key={p}
                  onClick={() => setPatientFilter(p)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    patientFilter === p ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white border border-border/50 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Sesión</th>
                  <th className="px-6 py-4">Paciente</th>
                  <th className="px-6 py-4">Objetivo</th>
                  <th className="px-6 py-4">Área</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Intentos</th>
                  <th className="px-6 py-4">% Correctas</th>
                  <th className="px-6 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array(8).fill(0).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-slate-100 rounded w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length > 0 ? (
                  filtered.map(reg => {
                    const pct = parsePercent(reg.porcentaje);
                    const pName = reg.patientName ?? `Pac. #${reg.patientId}`;
                    const pColor = patientColorMap[pName] ?? PATIENT_COLORS[0];
                    return (
                      <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold font-display">
                            {reg.sesionNumero ?? "–"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pColor}`}>
                              {pName.charAt(0)}
                            </span>
                            <span className="font-medium text-slate-900">{pName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-[200px]">
                          <div className="flex items-start gap-1.5">
                            <Target className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                            <span className="text-slate-700 leading-snug line-clamp-2">
                              {reg.objetivoNombre || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                            {reg.areaObjetivo || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                          {reg.fecha ? (
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              {reg.fecha.split(" ").slice(0, 4).join(" ")}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {reg.intentos != null ? (
                            <span className="text-slate-700">
                              <span className="font-semibold text-primary">{reg.correctas ?? 0}</span>
                              <span className="text-slate-400">/{reg.intentos}</span>
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-6 py-4">
                          {reg.porcentaje ? (
                            <div className="flex items-center gap-2 min-w-[90px]">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-slate-700 shrink-0">
                                {reg.porcentaje}
                              </span>
                            </div>
                          ) : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={`text-xs ${estadoStyle(reg.estado)}`}>
                            {reg.estado || "—"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-14 text-center text-slate-500">
                      No se encontraron registros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
