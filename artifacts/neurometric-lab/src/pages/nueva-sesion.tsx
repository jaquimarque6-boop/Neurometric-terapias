import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ClipboardList, Search, ChevronDown, CheckSquare, Square, User,
} from "lucide-react";
import { useListPatients, getListGoalsQueryKey, getListRegistrosClinicosQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PERFORMANCE_MAP } from "@/components/registro-clinico-form";

const BRAND_BLUE = "#0E3A6D";
const BRAND_TEAL = "#20C7C7";

type RowState = {
  checked: boolean;
  intentos: string;
  correctas: string;
  estado: string;
  notas: string;
};

const ESTADO_OPTIONS = [
  { value: "logrado",     label: "✅ Logrado"    },
  { value: "en progreso", label: "🔵 En progreso" },
  { value: "con ayuda",   label: "🟡 Con ayuda"   },
  { value: "no logrado",  label: "🔴 No logrado"  },
];

const ESTADO_STYLE: Record<string, string> = {
  "logrado":     "bg-emerald-50 border-emerald-300 text-emerald-800",
  "en progreso": "bg-blue-50 border-blue-300 text-blue-800",
  "con ayuda":   "bg-amber-50 border-amber-300 text-amber-800",
  "no logrado":  "bg-red-50 border-red-300 text-red-800",
};

export default function NuevaSesion() {
  const [, navigate]               = useLocation();
  const { toast }                  = useToast();
  const queryClient                = useQueryClient();

  const today = new Date().toISOString().split("T")[0];

  const [patientSearch, setPatientSearch]     = useState("");
  const [showPatientList, setShowPatientList] = useState(false);
  const [patient, setPatient]                 = useState<any>(null);
  const [fecha, setFecha]                     = useState(today);
  const [rows, setRows]                       = useState<Record<number, RowState>>({});
  const [resumen, setResumen]                 = useState("");
  const [observaciones, setObservaciones]     = useState("");
  const [isSaving, setIsSaving]               = useState(false);

  const { data: patients = [] } = useListPatients();

  const { data: goalsRaw = [], isLoading: loadingGoals } = useQuery({
    queryKey: ["nueva-sesion-goals", patient?.id],
    queryFn: async () => {
      const res = await fetch(`/api/goals?patientId=${patient.id}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!patient,
  });

  const goals = (goalsRaw as any[]).filter(
    g => g.status === "activo" || g.status === "en progreso"
  );

  const filteredPatients = (patients as any[]).filter(p =>
    !patientSearch || p.name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const selectPatient = (p: any) => {
    setPatient(p);
    setPatientSearch(p.name);
    setShowPatientList(false);
    setRows({});
  };

  const setRow = (goalId: number, patch: Partial<RowState>) =>
    setRows(prev => ({ ...prev, [goalId]: { ...(prev[goalId] ?? { checked: false, intentos: "", correctas: "", estado: "en progreso", notas: "" }), ...patch } }));

  const toggleRow = (goalId: number) => {
    const cur = rows[goalId];
    if (!cur || !cur.checked) {
      setRow(goalId, { checked: true, intentos: cur?.intentos ?? "", correctas: cur?.correctas ?? "", estado: cur?.estado ?? "en progreso", notas: cur?.notas ?? "" });
    } else {
      setRow(goalId, { checked: false });
    }
  };

  const checkedGoals = goals.filter(g => rows[g.id]?.checked);
  const canSave = !!patient && (checkedGoals.length > 0 || resumen.trim().length > 0);

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      const rcRes = await fetch("/api/registros-clinicos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          fecha,
          resumenSesion: resumen || undefined,
          observaciones: observaciones || undefined,
        }),
      });
      if (!rcRes.ok) throw new Error();
      const rc = await rcRes.json();

      if (checkedGoals.length > 0) {
        await Promise.all(checkedGoals.map(goal => {
          const row = rows[goal.id];
          const map = PERFORMANCE_MAP[row.estado] ?? PERFORMANCE_MAP["en progreso"];
          return fetch(`/api/goals/${goal.id}/progress`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              statusNuevo: map.statusNuevo,
              progressPct: map.pct,
              registroClinicoId: rc.id,
              nota: row.notas || `Sesión ${fecha}: ${map.label}`,
              intentos: row.intentos ? parseInt(row.intentos) : undefined,
              correctas: row.correctas ? parseInt(row.correctas) : undefined,
            }),
          });
        }));
      }

      queryClient.invalidateQueries({ queryKey: getListRegistrosClinicosQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
      const n = checkedGoals.length;
      toast({ title: n > 0 ? `Sesión guardada · ${n} objetivo${n !== 1 ? "s" : ""} actualizado${n !== 1 ? "s" : ""}` : "Sesión guardada" });
      navigate("/");
    } catch {
      toast({ title: "Error al guardar la sesión", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Volver
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2" style={{ color: BRAND_BLUE }}>
            <ClipboardList className="h-6 w-6" style={{ color: BRAND_TEAL }} />
            Nuevo registro clínico
          </h1>
          <p className="text-slate-500 text-sm mt-1">Completa los datos de la sesión de hoy.</p>
        </div>

        {/* ── Card: paciente + fecha ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6 space-y-4">

          {/* Paciente */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <User className="h-4 w-4" style={{ color: BRAND_TEAL }} />
              Paciente <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Buscar paciente..."
                value={patientSearch}
                autoComplete="off"
                onChange={e => { setPatientSearch(e.target.value); setShowPatientList(true); setPatient(null); }}
                onFocus={() => setShowPatientList(true)}
                onBlur={() => setTimeout(() => setShowPatientList(false), 150)}
                className="pl-9 bg-slate-50"
              />
              {showPatientList && filteredPatients.length > 0 && (
                <div className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                  {filteredPatients.map((p: any) => (
                    <button
                      key={p.id}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left transition-colors"
                      onMouseDown={e => { e.preventDefault(); selectPatient(p); }}
                    >
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: BRAND_TEAL }}
                      >
                        {p.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-slate-800">{p.name}</span>
                      {p.age && <span className="text-xs text-slate-400 ml-1">{p.age} años</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {patient && (
              <p className="text-xs text-slate-500 pl-1">
                Paciente seleccionado: <strong className="text-slate-700">{patient.name}</strong>
              </p>
            )}
          </div>

          {/* Fecha */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Fecha de sesión</label>
            <Input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="bg-slate-50 max-w-xs"
            />
          </div>
        </div>

        {/* ── Card: objetivos ───────────────────────────────────────── */}
        {patient && (
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">
                Objetivos trabajados
                {checkedGoals.length > 0 && (
                  <span
                    className="ml-2 inline-flex items-center rounded-full text-xs px-2 py-0.5 font-medium"
                    style={{ background: `${BRAND_TEAL}20`, color: BRAND_TEAL }}
                  >
                    {checkedGoals.length} seleccionado{checkedGoals.length !== 1 ? "s" : ""}
                  </span>
                )}
              </h2>
              {!loadingGoals && (
                <span className="text-xs text-slate-400">{goals.length} activos</span>
              )}
            </div>

            {loadingGoals ? (
              <div className="px-6 py-10 text-center text-sm text-slate-400 animate-pulse">
                Cargando objetivos…
              </div>
            ) : goals.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-slate-400">
                Este paciente no tiene objetivos activos.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {goals.map((goal: any) => {
                  const row = rows[goal.id] ?? { checked: false, intentos: "", correctas: "", estado: "en progreso", notas: "" };
                  const estadoStyle = ESTADO_STYLE[row.estado] ?? "";
                  return (
                    <div key={goal.id} className={`transition-colors ${row.checked ? "bg-slate-50/80" : ""}`}>
                      {/* Goal header row */}
                      <div
                        className="flex items-start gap-3 px-6 py-3.5 cursor-pointer hover:bg-slate-50"
                        onClick={() => toggleRow(goal.id)}
                      >
                        <div className="mt-0.5 shrink-0 text-primary" onClick={e => { e.stopPropagation(); toggleRow(goal.id); }}>
                          {row.checked
                            ? <CheckSquare className="h-5 w-5" style={{ color: BRAND_TEAL }} />
                            : <Square className="h-5 w-5 text-slate-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${row.checked ? "text-slate-900" : "text-slate-500"}`}>
                            {goal.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {goal.areaClinica ?? goal.category}
                            {goal.nivelDificultad ? ` · ${goal.nivelDificultad}` : ""}
                          </p>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-slate-300 mt-0.5 transition-transform ${row.checked ? "rotate-180" : ""}`} />
                      </div>

                      {/* Expanded inline fields */}
                      {row.checked && (
                        <div
                          className="px-6 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-100"
                          onClick={e => e.stopPropagation()}
                        >
                          {/* Intentos */}
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Intentos</label>
                            <Input
                              type="number"
                              min={0}
                              placeholder="0"
                              value={row.intentos}
                              onChange={e => setRow(goal.id, { intentos: e.target.value })}
                              className="bg-white h-8 text-sm text-center"
                            />
                          </div>

                          {/* Correctas */}
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Correctas</label>
                            <Input
                              type="number"
                              min={0}
                              placeholder="0"
                              value={row.correctas}
                              onChange={e => setRow(goal.id, { correctas: e.target.value })}
                              className="bg-white h-8 text-sm text-center"
                            />
                          </div>

                          {/* Estado */}
                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-xs font-medium text-slate-500">Estado</label>
                            <Select value={row.estado} onValueChange={v => setRow(goal.id, { estado: v })}>
                              <SelectTrigger className={`h-8 text-xs border ${estadoStyle}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ESTADO_OPTIONS.map(o => (
                                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Notas del objetivo */}
                          <div className="space-y-1 col-span-2 sm:col-span-4">
                            <label className="text-xs font-medium text-slate-500">Notas del objetivo <span className="font-normal text-slate-400">(opcional)</span></label>
                            <Input
                              placeholder="Observaciones específicas de este objetivo…"
                              value={row.notas}
                              onChange={e => setRow(goal.id, { notas: e.target.value })}
                              className="bg-white text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Card: notas generales de sesión ───────────────────────── */}
        {patient && (
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-800">Notas de sesión <span className="text-slate-400 font-normal">(opcional)</span></h2>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Resumen</label>
              <Textarea
                placeholder="Describe lo trabajado en la sesión…"
                rows={2}
                value={resumen}
                onChange={e => setResumen(e.target.value)}
                className="bg-slate-50 resize-none text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Observaciones</label>
              <Textarea
                placeholder="Observaciones clínicas relevantes…"
                rows={2}
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                className="bg-slate-50 resize-none text-sm"
              />
            </div>
          </div>
        )}

        {/* ── Save bar ──────────────────────────────────────────────── */}
        {patient && (
          <div className="flex gap-3 pb-8">
            <Button variant="outline" className="w-32" onClick={() => navigate("/")}>
              Cancelar
            </Button>
            <Button
              className="flex-1 text-white font-semibold text-base h-12 rounded-xl shadow-md transition-all hover:opacity-90"
              style={{ background: canSave ? `linear-gradient(90deg, ${BRAND_TEAL} 0%, #18b3b3 100%)` : undefined }}
              disabled={!canSave || isSaving}
              onClick={handleSave}
            >
              {isSaving
                ? "Guardando…"
                : checkedGoals.length > 0
                  ? `Guardar sesión · ${checkedGoals.length} objetivo${checkedGoals.length !== 1 ? "s" : ""}`
                  : "Guardar sesión"}
            </Button>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
