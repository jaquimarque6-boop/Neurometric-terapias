import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ClipboardList, Search, ChevronDown, CheckSquare, Square, User,
  Plus, X, BookOpen, Sparkles,
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

  // rows for patient's assigned goals (keyed by goal.id)
  const [rows, setRows]                       = useState<Record<number, RowState>>({});

  // ad-hoc goals added from banco (array of goal library items)
  const [adHocGoals, setAdHocGoals]           = useState<any[]>([]);
  // rows for ad-hoc goals (keyed by goalLibraryId)
  const [adHocRows, setAdHocRows]             = useState<Record<number, RowState>>({});

  // banco search state
  const [showBanco, setShowBanco]             = useState(false);
  const [bancoSearch, setBancoSearch]         = useState("");
  const bancoInputRef                         = useRef<HTMLInputElement>(null);

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

  // banco de objetivos search
  const { data: bancoRaw = [] } = useQuery({
    queryKey: ["banco-search", bancoSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ estado: "activo" });
      if (bancoSearch.trim()) params.append("q", bancoSearch.trim());
      const res = await fetch(`/api/goal-library?${params}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: showBanco,
  });

  const goals = (goalsRaw as any[]).filter(
    g => g.status === "activo" || g.status === "en progreso"
  );

  // Filter banco results: exclude already-assigned patient goals and already-added ad-hoc goals
  const assignedLibraryIds = new Set([
    ...(goalsRaw as any[]).map((g: any) => g.goalLibraryId).filter(Boolean),
    ...adHocGoals.map(g => g.id),
  ]);
  const bancoFiltered = (bancoRaw as any[]).filter(g => !assignedLibraryIds.has(g.id));

  const filteredPatients = (patients as any[]).filter(p =>
    !patientSearch || p.name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const selectPatient = (p: any) => {
    setPatient(p);
    setPatientSearch(p.name);
    setShowPatientList(false);
    setRows({});
    setAdHocGoals([]);
    setAdHocRows({});
  };

  // ── Row helpers — patient goals ──────────────────────────────────────────
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

  // ── Row helpers — ad-hoc goals ───────────────────────────────────────────
  const setAdHocRow = (libId: number, patch: Partial<RowState>) =>
    setAdHocRows(prev => ({ ...prev, [libId]: { ...(prev[libId] ?? { checked: true, intentos: "", correctas: "", estado: "en progreso", notas: "" }), ...patch } }));

  const addAdHocGoal = (libGoal: any) => {
    setAdHocGoals(prev => [...prev, libGoal]);
    setAdHocRows(prev => ({ ...prev, [libGoal.id]: { checked: true, intentos: "", correctas: "", estado: "en progreso", notas: "" } }));
    setBancoSearch("");
    setShowBanco(false);
  };

  const removeAdHocGoal = (libId: number) => {
    setAdHocGoals(prev => prev.filter(g => g.id !== libId));
    setAdHocRows(prev => { const n = { ...prev }; delete n[libId]; return n; });
  };

  const checkedGoals    = goals.filter(g => rows[g.id]?.checked);
  const checkedAdHoc    = adHocGoals.filter(g => adHocRows[g.id]?.checked !== false);
  const totalSelected   = checkedGoals.length + checkedAdHoc.length;
  const canSave         = !!patient && (totalSelected > 0 || resumen.trim().length > 0);

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      // 1. Create registro clínico
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
      if (!rcRes.ok) throw new Error("Error al crear el registro");
      const rc = await rcRes.json();

      // 2. Save progress for patient's assigned goals
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

      // 3. Save ad-hoc goals: assign first (if not already assigned), then progress
      if (checkedAdHoc.length > 0) {
        await Promise.all(checkedAdHoc.map(async (libGoal) => {
          const row = adHocRows[libGoal.id];
          const map = PERFORMANCE_MAP[row.estado] ?? PERFORMANCE_MAP["en progreso"];

          // Check if already assigned to patient
          const alreadyAssigned = (goalsRaw as any[]).find((g: any) => g.goalLibraryId === libGoal.id);
          let goalId: number;

          if (alreadyAssigned) {
            goalId = alreadyAssigned.id;
          } else {
            // Assign from banco
            const assignRes = await fetch("/api/goals", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                patientId: patient.id,
                goalLibraryId: libGoal.id,
                title: libGoal.nombreObjetivo,
                description: libGoal.definicionOperativa ?? null,
                category: libGoal.areaClinica ?? libGoal.area ?? "general",
                areaClinica: libGoal.areaClinica ?? libGoal.area ?? "general",
                nivelDificultad: libGoal.nivelDificultad ?? null,
                franjaEtaria: libGoal.franjaEtaria ?? null,
                codigo: libGoal.idObjetivo ?? null,
                status: "activo",
              }),
            });
            if (!assignRes.ok) throw new Error("Error al asignar objetivo del banco");
            const newGoal = await assignRes.json();
            goalId = newGoal.id;
          }

          // Save progress
          await fetch(`/api/goals/${goalId}/progress`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              statusNuevo: map.statusNuevo,
              progressPct: map.pct,
              registroClinicoId: rc.id,
              nota: row.notas || `Sesión ${fecha} (objetivo del día): ${map.label}`,
              intentos: row.intentos ? parseInt(row.intentos) : undefined,
              correctas: row.correctas ? parseInt(row.correctas) : undefined,
            }),
          });
        }));
      }

      queryClient.invalidateQueries({ queryKey: getListRegistrosClinicosQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
      const n = totalSelected;
      toast({ title: n > 0 ? `Sesión guardada · ${n} objetivo${n !== 1 ? "s" : ""} actualizado${n !== 1 ? "s" : ""}` : "Sesión guardada" });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Error al guardar la sesión", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Goal row component (shared for assigned + ad-hoc) ────────────────────
  function GoalRow({
    goalId,
    title,
    subtitle,
    row,
    onToggle,
    onSetRow,
    isAdHoc,
    onRemove,
  }: {
    goalId: number;
    title: string;
    subtitle: string;
    row: RowState;
    onToggle: () => void;
    onSetRow: (patch: Partial<RowState>) => void;
    isAdHoc?: boolean;
    onRemove?: () => void;
  }) {
    const estadoStyle = ESTADO_STYLE[row.estado] ?? "";
    return (
      <div className={`transition-colors ${row.checked ? "bg-slate-50/80" : ""}`}>
        {/* Header row */}
        <div
          className="flex items-start gap-3 px-6 py-3.5 cursor-pointer hover:bg-slate-50"
          onClick={onToggle}
        >
          <div className="mt-0.5 shrink-0" onClick={e => { e.stopPropagation(); onToggle(); }}>
            {row.checked
              ? <CheckSquare className="h-5 w-5" style={{ color: BRAND_TEAL }} />
              : <Square className="h-5 w-5 text-slate-300" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`text-sm font-medium ${row.checked ? "text-slate-900" : "text-slate-500"}`}>
                {title}
              </p>
              {isAdHoc && (
                <span
                  className="inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 font-medium shrink-0"
                  style={{ background: `${BRAND_TEAL}18`, color: BRAND_TEAL }}
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  Del banco
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAdHoc && onRemove && (
              <button
                className="text-slate-300 hover:text-slate-500 transition-colors"
                onClick={e => { e.stopPropagation(); onRemove(); }}
                title="Quitar objetivo del día"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <ChevronDown className={`h-4 w-4 text-slate-300 mt-0.5 transition-transform ${row.checked ? "rotate-180" : ""}`} />
          </div>
        </div>

        {/* Expanded inline fields */}
        {row.checked && (
          <div
            className="px-6 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Intentos</label>
              <Input type="number" min={0} placeholder="0"
                value={row.intentos}
                onChange={e => onSetRow({ intentos: e.target.value })}
                className="bg-white h-8 text-sm text-center" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Correctas</label>
              <Input type="number" min={0} placeholder="0"
                value={row.correctas}
                onChange={e => onSetRow({ correctas: e.target.value })}
                className="bg-white h-8 text-sm text-center" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-slate-500">Estado</label>
              <Select value={row.estado} onValueChange={v => onSetRow({ estado: v })}>
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
            <div className="space-y-1 col-span-2 sm:col-span-4">
              <label className="text-xs font-medium text-slate-500">
                Notas del objetivo <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <Input
                placeholder="Observaciones específicas de este objetivo…"
                value={row.notas}
                onChange={e => onSetRow({ notas: e.target.value })}
                className="bg-white text-sm" />
            </div>
          </div>
        )}
      </div>
    );
  }

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
            {/* Card header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">
                Objetivos trabajados
                {totalSelected > 0 && (
                  <span
                    className="ml-2 inline-flex items-center rounded-full text-xs px-2 py-0.5 font-medium"
                    style={{ background: `${BRAND_TEAL}20`, color: BRAND_TEAL }}
                  >
                    {totalSelected} seleccionado{totalSelected !== 1 ? "s" : ""}
                  </span>
                )}
              </h2>
              {!loadingGoals && (
                <span className="text-xs text-slate-400">{goals.length} activos</span>
              )}
            </div>

            {/* Patient's assigned goals */}
            {loadingGoals ? (
              <div className="px-6 py-10 text-center text-sm text-slate-400 animate-pulse">
                Cargando objetivos…
              </div>
            ) : goals.length === 0 && adHocGoals.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-slate-400">
                Este paciente no tiene objetivos activos.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {goals.map((goal: any) => (
                  <GoalRow
                    key={goal.id}
                    goalId={goal.id}
                    title={goal.title}
                    subtitle={`${goal.areaClinica ?? goal.category}${goal.nivelDificultad ? ` · ${goal.nivelDificultad}` : ""}`}
                    row={rows[goal.id] ?? { checked: false, intentos: "", correctas: "", estado: "en progreso", notas: "" }}
                    onToggle={() => toggleRow(goal.id)}
                    onSetRow={patch => setRow(goal.id, patch)}
                  />
                ))}

                {/* Ad-hoc goals */}
                {adHocGoals.map((libGoal: any) => (
                  <GoalRow
                    key={`adhoc-${libGoal.id}`}
                    goalId={libGoal.id}
                    title={libGoal.nombreObjetivo}
                    subtitle={`${libGoal.areaClinica ?? libGoal.area ?? ""}${libGoal.nivelDificultad ? ` · ${libGoal.nivelDificultad}` : ""}`}
                    row={adHocRows[libGoal.id] ?? { checked: true, intentos: "", correctas: "", estado: "en progreso", notas: "" }}
                    onToggle={() => setAdHocRow(libGoal.id, { checked: !(adHocRows[libGoal.id]?.checked ?? true) })}
                    onSetRow={patch => setAdHocRow(libGoal.id, patch)}
                    isAdHoc
                    onRemove={() => removeAdHocGoal(libGoal.id)}
                  />
                ))}
              </div>
            )}

            {/* ── "+ Agregar objetivo del día" ───────────────────────── */}
            <div className="border-t border-slate-100">
              {!showBanco ? (
                <button
                  className="w-full flex items-center gap-2 px-6 py-3.5 text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors group"
                  onClick={() => { setShowBanco(true); setTimeout(() => bancoInputRef.current?.focus(), 50); }}
                >
                  <Plus className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  Agregar objetivo del día
                  <BookOpen className="h-3.5 w-3.5 ml-auto text-slate-300 group-hover:text-slate-400" />
                </button>
              ) : (
                <div className="px-6 py-4 space-y-3">
                  {/* Search header */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" style={{ color: BRAND_TEAL }} />
                      Buscar en el banco de objetivos
                    </p>
                    <button
                      onClick={() => { setShowBanco(false); setBancoSearch(""); }}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Search input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <Input
                      ref={bancoInputRef}
                      placeholder="Ej: vocabulario expresivo, conciencia fonológica…"
                      value={bancoSearch}
                      onChange={e => setBancoSearch(e.target.value)}
                      className="pl-9 bg-slate-50 text-sm h-9"
                    />
                  </div>

                  {/* Results */}
                  <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                    {bancoFiltered.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-slate-400">
                        {bancoSearch.trim()
                          ? "Sin resultados. Prueba con otras palabras."
                          : "Escribe para buscar objetivos en el banco."}
                      </div>
                    ) : (
                      bancoFiltered.slice(0, 30).map((g: any) => (
                        <button
                          key={g.id}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors group"
                          onClick={() => addAdHocGoal(g)}
                        >
                          <Plus className="h-4 w-4 mt-0.5 text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 leading-snug">{g.nombreObjetivo}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {g.areaClinica ?? g.area}
                              {g.nivelDificultad ? ` · ${g.nivelDificultad}` : ""}
                              {g.franjaEtaria ? ` · ${g.franjaEtaria} años` : ""}
                            </p>
                          </div>
                          <span
                            className="text-xs font-mono shrink-0 mt-0.5 text-slate-300 group-hover:text-slate-500"
                          >
                            {g.idObjetivo}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
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
                : totalSelected > 0
                  ? `Guardar sesión · ${totalSelected} objetivo${totalSelected !== 1 ? "s" : ""}`
                  : "Guardar sesión"}
            </Button>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
