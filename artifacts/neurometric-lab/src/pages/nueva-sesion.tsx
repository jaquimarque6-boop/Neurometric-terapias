import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ClipboardList, Search, ChevronDown, CheckSquare, Square, User,
  Plus, X, BookOpen, Sparkles, Brain, Home, TrendingUp, Info, ChevronRight,
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

const ESTADO_BADGE: Record<string, string> = {
  "logrado":     "bg-emerald-100 text-emerald-700",
  "en progreso": "bg-blue-100 text-blue-700",
  "con ayuda":   "bg-amber-100 text-amber-700",
  "no logrado":  "bg-red-100 text-red-700",
};

function calcAutoEstado(intentos: string, correctas: string): string | null {
  const i = parseInt(intentos);
  const c = parseInt(correctas);
  if (isNaN(i) || isNaN(c) || i === 0) return null;
  const pct = Math.min(c, i) / i;
  if (pct >= 0.8) return "logrado";
  if (pct >= 0.6) return "en progreso";
  if (pct >= 0.4) return "con ayuda";
  return "no logrado";
}

function calcPct(intentos: string, correctas: string): number | null {
  const i = parseInt(intentos);
  const c = parseInt(correctas);
  if (isNaN(i) || isNaN(c) || i === 0) return null;
  return Math.round((Math.min(c, i) / i) * 100);
}

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

  const [adHocGoals, setAdHocGoals]           = useState<any[]>([]);
  const [adHocRows, setAdHocRows]             = useState<Record<number, RowState>>({});

  const [showBanco, setShowBanco]             = useState(false);
  const [bancoSearch, setBancoSearch]         = useState("");
  const bancoInputRef                         = useRef<HTMLInputElement>(null);

  const [showAllGoals, setShowAllGoals]       = useState(false);
  const [resumen, setResumen]                 = useState("");
  const [observaciones, setObservaciones]     = useState("");
  const [isSaving, setIsSaving]               = useState(false);

  // Clinical detail cache: goal.id → { libraryEntry, activities }
  const [detailCache, setDetailCache]         = useState<Record<number, any>>({});
  // Which goals have their clinical detail panel open
  const [detailOpenFor, setDetailOpenFor]     = useState<Set<string>>(new Set());

  // Track auto-check to avoid resetting after manual changes
  const hasAutoChecked = useRef<number | null>(null);

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

  const assignedLibraryIds = new Set([
    ...(goalsRaw as any[]).map((g: any) => g.goalLibraryId).filter(Boolean),
    ...adHocGoals.map(g => g.id),
  ]);
  const bancoFiltered = (bancoRaw as any[]).filter(g => !assignedLibraryIds.has(g.id));

  const filteredPatients = (patients as any[]).filter(p =>
    !patientSearch || p.name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  // ── Suggested goals (priority: en progreso → age match → activos) ──────────
  const suggestedGoals = useMemo(() => {
    if (goals.length === 0) return [];
    const patientAge = patient?.age ? parseInt(patient.age) : null;

    const score = (g: any) => {
      let s = 0;
      if (g.status === "en progreso") s += 10;
      if (patientAge && g.franjaEtaria) {
        const [min, max] = g.franjaEtaria.split("-").map(Number);
        if (patientAge >= min && patientAge <= max) s += 5;
      }
      if (g.progressPct !== null && g.progressPct !== undefined) s += 1;
      return s;
    };

    return [...goals].sort((a, b) => score(b) - score(a)).slice(0, 3);
  }, [goals, patient]);

  const lastWorkedGoal = useMemo(
    () => goals.find(g => g.status === "en progreso") ?? goals[0] ?? null,
    [goals],
  );

  // Remaining goals not in suggestions
  const otherGoals = useMemo(
    () => goals.filter(g => !suggestedGoals.some(s => s.id === g.id)),
    [goals, suggestedGoals],
  );

  // Auto-check suggested goals once goals load for this patient
  useEffect(() => {
    if (!patient || loadingGoals || goals.length === 0) return;
    if (hasAutoChecked.current === patient.id) return;
    hasAutoChecked.current = patient.id;

    const initial: Record<number, RowState> = {};
    suggestedGoals.forEach(g => {
      initial[g.id] = { checked: true, intentos: "", correctas: "", estado: g.status === "en progreso" ? "en progreso" : "en progreso" };
    });
    setRows(initial);
  }, [patient, loadingGoals, suggestedGoals]);

  const selectPatient = (p: any) => {
    setPatient(p);
    setPatientSearch(p.name);
    setShowPatientList(false);
    setRows({});
    setAdHocGoals([]);
    setAdHocRows({});
    setDetailCache({});
    setDetailOpenFor(new Set());
    hasAutoChecked.current = null;
  };

  // ── Fetch clinical detail (libraryEntry + activities) for a goal ───────────
  const fetchDetail = async (goalId: number) => {
    if (detailCache[goalId]) return;
    try {
      const res = await fetch(`/api/goals/${goalId}/activities`);
      if (res.ok) {
        const data = await res.json();
        setDetailCache(prev => ({ ...prev, [goalId]: data }));
      }
    } catch {}
  };

  const toggleDetailFor = (key: string, goalId?: number) => {
    setDetailOpenFor(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        if (goalId) fetchDetail(goalId);
      }
      return next;
    });
  };

  // ── Row helpers ───────────────────────────────────────────────────────────
  const defaultRow = (status = "en progreso"): RowState => ({ checked: false, intentos: "", correctas: "", estado: status });

  const setRow = (goalId: number, patch: Partial<RowState>) =>
    setRows(prev => ({ ...prev, [goalId]: { ...(prev[goalId] ?? defaultRow()), ...patch } }));

  const toggleRow = (goalId: number) => {
    const cur = rows[goalId];
    setRow(goalId, { checked: !cur?.checked });
  };

  const setAdHocRow = (libId: number, patch: Partial<RowState>) =>
    setAdHocRows(prev => ({ ...prev, [libId]: { ...(prev[libId] ?? { checked: true, intentos: "", correctas: "", estado: "en progreso" }), ...patch } }));

  const addAdHocGoal = (libGoal: any) => {
    setAdHocGoals(prev => [...prev, libGoal]);
    setAdHocRows(prev => ({ ...prev, [libGoal.id]: { checked: true, intentos: "", correctas: "", estado: "en progreso" } }));
    setBancoSearch("");
    setShowBanco(false);
  };

  const removeAdHocGoal = (libId: number) => {
    setAdHocGoals(prev => prev.filter(g => g.id !== libId));
    setAdHocRows(prev => { const n = { ...prev }; delete n[libId]; return n; });
  };

  const checkedGoals  = goals.filter(g => rows[g.id]?.checked);
  const checkedAdHoc  = adHocGoals.filter(g => adHocRows[g.id]?.checked !== false);
  const totalSelected = checkedGoals.length + checkedAdHoc.length;
  const canSave       = !!patient && (totalSelected > 0 || resumen.trim().length > 0);

  // ── Save ──────────────────────────────────────────────────────────────────
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
      if (!rcRes.ok) throw new Error("Error al crear el registro");
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
              nota: `Sesión ${fecha}: ${map.label}`,
              intentos: row.intentos ? parseInt(row.intentos) : undefined,
              correctas: row.correctas ? parseInt(row.correctas) : undefined,
            }),
          });
        }));
      }

      if (checkedAdHoc.length > 0) {
        await Promise.all(checkedAdHoc.map(async (libGoal) => {
          const row = adHocRows[libGoal.id];
          const map = PERFORMANCE_MAP[row.estado] ?? PERFORMANCE_MAP["en progreso"];

          const alreadyAssigned = (goalsRaw as any[]).find((g: any) => g.goalLibraryId === libGoal.id);
          let goalId: number;

          if (alreadyAssigned) {
            goalId = alreadyAssigned.id;
          } else {
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

          await fetch(`/api/goals/${goalId}/progress`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              statusNuevo: map.statusNuevo,
              progressPct: map.pct,
              registroClinicoId: rc.id,
              nota: `Sesión ${fecha} (objetivo del día): ${map.label}`,
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

  // ── GoalRow component ─────────────────────────────────────────────────────
  function GoalRow({
    goalId,
    title,
    subtitle,
    row,
    onToggle,
    onSetRow,
    isAdHoc,
    isSuggested,
    onRemove,
    libraryData,   // for ad-hoc: the libGoal object; for assigned: detailCache[goalId]?.libraryEntry
    goalIdForDetail,
  }: {
    goalId: number;
    title: string;
    subtitle: string;
    row: RowState;
    onToggle: () => void;
    onSetRow: (patch: Partial<RowState>) => void;
    isAdHoc?: boolean;
    isSuggested?: boolean;
    onRemove?: () => void;
    libraryData?: any;
    goalIdForDetail?: number;
  }) {
    const estadoStyle = ESTADO_STYLE[row.estado] ?? "";
    const pct = calcPct(row.intentos, row.correctas);
    const autoEstado = calcAutoEstado(row.intentos, row.correctas);
    const detailKey = isAdHoc ? `adhoc-${goalId}` : `${goalId}`;
    const showDetail = detailOpenFor.has(detailKey);

    // For assigned goals: libraryEntry from cache; for ad-hoc: the libGoal itself
    const entry = isAdHoc ? libraryData : (detailCache[goalIdForDetail ?? goalId]?.libraryEntry ?? null);
    const canShowDetail = !!(entry?.marcoConceptual || entry?.definicionOperativa || entry?.actividadesClinicas || entry?.actividadesFamilia);

    return (
      <div className={`transition-colors ${row.checked ? "bg-slate-50/60" : ""}`}>
        {/* Header row */}
        <div
          className="flex items-start gap-3 px-5 py-3.5 cursor-pointer hover:bg-slate-50/80"
          onClick={onToggle}
        >
          <div className="mt-0.5 shrink-0" onClick={e => { e.stopPropagation(); onToggle(); }}>
            {row.checked
              ? <CheckSquare className="h-5 w-5" style={{ color: BRAND_TEAL }} />
              : <Square className="h-5 w-5 text-slate-300" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-sm font-medium leading-snug ${row.checked ? "text-slate-900" : "text-slate-500"}`}>
                {title}
              </p>
              {isSuggested && (
                <span className="inline-flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5 font-semibold shrink-0"
                  style={{ background: `${BRAND_TEAL}18`, color: BRAND_TEAL }}>
                  <Sparkles className="h-2.5 w-2.5" /> Sugerido
                </span>
              )}
              {isAdHoc && (
                <span className="inline-flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5 font-semibold shrink-0"
                  style={{ background: `${BRAND_TEAL}18`, color: BRAND_TEAL }}>
                  <BookOpen className="h-2.5 w-2.5" /> Del banco
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAdHoc && onRemove && (
              <button className="text-slate-300 hover:text-slate-500 transition-colors"
                onClick={e => { e.stopPropagation(); onRemove(); }}>
                <X className="h-4 w-4" />
              </button>
            )}
            <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform ${row.checked ? "rotate-180" : ""}`} />
          </div>
        </div>

        {/* Expanded: performance inputs + clinical detail */}
        {row.checked && (
          <div className="px-5 pb-4 border-t border-slate-100 space-y-3" onClick={e => e.stopPropagation()}>

            {/* Performance grid: Intentos · Correctas · Estado */}
            <div className="grid grid-cols-3 gap-2 pt-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Intentos</label>
                <Input type="number" min={0} placeholder="0"
                  value={row.intentos}
                  onChange={e => onSetRow({ intentos: e.target.value })}
                  className="bg-white h-9 text-sm text-center" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Correctas</label>
                <Input type="number" min={0} placeholder="0"
                  value={row.correctas}
                  onChange={e => onSetRow({ correctas: e.target.value })}
                  className="bg-white h-9 text-sm text-center" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium text-slate-500">Estado</label>
                  {autoEstado && autoEstado !== row.estado && (
                    <button
                      onClick={() => onSetRow({ estado: autoEstado })}
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full transition-all hover:opacity-80"
                      style={{ background: `${BRAND_TEAL}15`, color: BRAND_TEAL }}
                      title="Aplicar estado sugerido"
                    >
                      → {autoEstado}
                    </button>
                  )}
                </div>
                <Select value={row.estado} onValueChange={v => onSetRow({ estado: v })}>
                  <SelectTrigger className={`h-9 text-xs border ${estadoStyle}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADO_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Performance bar */}
            {pct !== null && (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all ${pct >= 80 ? "bg-emerald-400" : pct >= 60 ? "bg-blue-400" : pct >= 40 ? "bg-amber-400" : "bg-red-400"}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-500 w-9 text-right">{pct}%</span>
              </div>
            )}

            {/* Clinical detail toggle */}
            {(isAdHoc ? canShowDetail : (entry !== null || goalIdForDetail)) && (
              <button
                className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-primary transition-colors"
                onClick={() => toggleDetailFor(detailKey, goalIdForDetail ?? goalId)}
              >
                <Info className="h-3.5 w-3.5" />
                {showDetail ? "Ocultar descripción clínica" : "Ver descripción clínica"}
                <ChevronRight className={`h-3 w-3 transition-transform ${showDetail ? "rotate-90" : ""}`} />
              </button>
            )}

            {/* Clinical detail panel */}
            {showDetail && entry && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 text-xs">
                {entry.marcoConceptual && (
                  <div className="flex gap-2">
                    <Brain className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-600 mb-0.5">Marco conceptual</p>
                      <p className="text-slate-500 leading-relaxed line-clamp-3">{entry.marcoConceptual}</p>
                    </div>
                  </div>
                )}
                {entry.actividadesClinicas && (
                  <div className="flex gap-2">
                    <ClipboardList className="h-3.5 w-3.5 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-600 mb-0.5">Actividades clínicas</p>
                      <ul className="text-slate-500 leading-relaxed space-y-0.5">
                        {entry.actividadesClinicas
                          .split(/[·•\n]+/)
                          .map((s: string) => s.trim())
                          .filter(Boolean)
                          .slice(0, 3)
                          .map((act: string, i: number) => (
                            <li key={i} className="flex gap-1.5">
                              <span className="text-teal-400 shrink-0">·</span>
                              <span>{act}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                )}
                {entry.actividadesFamilia && (
                  <div className="flex gap-2">
                    <Home className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-600 mb-0.5">Para la familia</p>
                      <p className="text-slate-500 leading-relaxed line-clamp-2">{entry.actividadesFamilia}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto flex flex-col gap-5 animate-in fade-in duration-300">

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

        {/* ── Card: paciente + fecha ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Paciente */}
            <div className="space-y-1.5 flex-1">
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
                  <strong className="text-slate-700">{patient.name}</strong>
                  {patient.age && ` · ${patient.age} años`}
                  {patient.diagnosis && ` · ${patient.diagnosis}`}
                </p>
              )}
            </div>

            {/* Fecha */}
            <div className="space-y-1.5 sm:w-44">
              <label className="text-sm font-semibold text-slate-700">Fecha</label>
              <Input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* ── Guía de la sesión ─────────────────────────────────────────── */}
        {patient && !loadingGoals && goals.length > 0 && (
          <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: `${BRAND_TEAL}30`, background: `linear-gradient(135deg, ${BRAND_TEAL}06 0%, #f0f9ff 100%)` }}>
            {/* Header */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b" style={{ borderColor: `${BRAND_TEAL}20` }}>
              <Sparkles className="h-4 w-4" style={{ color: BRAND_TEAL }} />
              <h2 className="text-sm font-bold text-slate-800">Guía de la sesión</h2>
            </div>

            <div className="divide-y" style={{ borderColor: `${BRAND_TEAL}15` }}>
              {/* Last session summary */}
              {lastWorkedGoal && (
                <div className="px-5 py-3.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Sesión anterior</p>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{lastWorkedGoal.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ESTADO_BADGE[lastWorkedGoal.status] ?? "bg-slate-100 text-slate-500"}`}>
                          {lastWorkedGoal.status}
                        </span>
                        {lastWorkedGoal.progressPct != null && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {lastWorkedGoal.progressPct}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Suggested objectives */}
              <div className="px-5 py-3.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                  Objetivos sugeridos para hoy
                </p>
                <div className="space-y-2">
                  {suggestedGoals.map(goal => {
                    const row = rows[goal.id] ?? defaultRow(goal.status);
                    return (
                      <button
                        key={goal.id}
                        className="w-full flex items-center gap-3 text-left rounded-xl px-3.5 py-2.5 transition-all hover:shadow-sm"
                        style={{
                          background: row.checked ? `${BRAND_TEAL}12` : "white",
                          border: `1.5px solid ${row.checked ? BRAND_TEAL + "40" : "#e2e8f0"}`,
                        }}
                        onClick={() => toggleRow(goal.id)}
                      >
                        <div className="shrink-0">
                          {row.checked
                            ? <CheckSquare className="h-4.5 w-4.5" style={{ color: BRAND_TEAL }} />
                            : <Square className="h-4.5 w-4.5 text-slate-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium leading-snug ${row.checked ? "text-slate-900" : "text-slate-500"}`}>
                            {goal.title}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {goal.areaClinica ?? goal.category}
                          </p>
                        </div>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${ESTADO_BADGE[goal.status] ?? "bg-slate-100 text-slate-500"}`}>
                          {goal.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Card: objetivos ───────────────────────────────────────────── */}
        {patient && (
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
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
            </div>

            {loadingGoals ? (
              <div className="px-5 py-10 text-center text-sm text-slate-400 animate-pulse">
                Cargando objetivos…
              </div>
            ) : goals.length === 0 && adHocGoals.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-400">
                Este paciente no tiene objetivos activos.
                <br /><span className="text-slate-300 text-xs mt-1 block">Usa "+ Agregar objetivo" para añadir uno del banco.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {/* Suggested goals (first) */}
                {suggestedGoals.map((goal: any) => (
                  <GoalRow
                    key={goal.id}
                    goalId={goal.id}
                    title={goal.title}
                    subtitle={`${goal.areaClinica ?? goal.category}${goal.nivelDificultad ? ` · ${goal.nivelDificultad}` : ""}${goal.franjaEtaria ? ` · ${goal.franjaEtaria} años` : ""}`}
                    row={rows[goal.id] ?? defaultRow(goal.status)}
                    onToggle={() => toggleRow(goal.id)}
                    onSetRow={patch => setRow(goal.id, patch)}
                    isSuggested
                    goalIdForDetail={goal.id}
                  />
                ))}

                {/* Ad-hoc goals from banco */}
                {adHocGoals.map((libGoal: any) => (
                  <GoalRow
                    key={`adhoc-${libGoal.id}`}
                    goalId={libGoal.id}
                    title={libGoal.nombreObjetivo}
                    subtitle={`${libGoal.areaClinica ?? libGoal.area ?? ""}${libGoal.nivelDificultad ? ` · ${libGoal.nivelDificultad}` : ""}${libGoal.franjaEtaria ? ` · ${libGoal.franjaEtaria} años` : ""}`}
                    row={adHocRows[libGoal.id] ?? { checked: true, intentos: "", correctas: "", estado: "en progreso" }}
                    onToggle={() => setAdHocRow(libGoal.id, { checked: !(adHocRows[libGoal.id]?.checked ?? true) })}
                    onSetRow={patch => setAdHocRow(libGoal.id, patch)}
                    isAdHoc
                    onRemove={() => removeAdHocGoal(libGoal.id)}
                    libraryData={libGoal}
                  />
                ))}

                {/* Other (non-suggested) goals — collapsed by default */}
                {otherGoals.length > 0 && (
                  <>
                    <button
                      className="w-full flex items-center gap-2 px-5 py-3 text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                      onClick={() => setShowAllGoals(v => !v)}
                    >
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAllGoals ? "rotate-180" : ""}`} />
                      {showAllGoals ? "Ocultar" : `${otherGoals.length} objetivo${otherGoals.length !== 1 ? "s" : ""} adicional${otherGoals.length !== 1 ? "es" : ""}`}
                    </button>
                    {showAllGoals && otherGoals.map((goal: any) => (
                      <GoalRow
                        key={goal.id}
                        goalId={goal.id}
                        title={goal.title}
                        subtitle={`${goal.areaClinica ?? goal.category}${goal.nivelDificultad ? ` · ${goal.nivelDificultad}` : ""}${goal.franjaEtaria ? ` · ${goal.franjaEtaria} años` : ""}`}
                        row={rows[goal.id] ?? defaultRow(goal.status)}
                        onToggle={() => toggleRow(goal.id)}
                        onSetRow={patch => setRow(goal.id, patch)}
                        goalIdForDetail={goal.id}
                      />
                    ))}
                  </>
                )}
              </div>
            )}

            {/* "+ Agregar objetivo del día" */}
            <div className="border-t border-slate-100">
              {!showBanco ? (
                <button
                  className="w-full flex items-center gap-2 px-5 py-3.5 text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors group"
                  onClick={() => { setShowBanco(true); setTimeout(() => bancoInputRef.current?.focus(), 50); }}
                >
                  <Plus className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  Agregar objetivo del banco
                  <BookOpen className="h-3.5 w-3.5 ml-auto text-slate-300 group-hover:text-slate-400" />
                </button>
              ) : (
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" style={{ color: BRAND_TEAL }} />
                      Buscar en el banco de objetivos
                    </p>
                    <button onClick={() => { setShowBanco(false); setBancoSearch(""); }}
                      className="text-slate-400 hover:text-slate-600 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
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
                  <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                    {bancoFiltered.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-slate-400">
                        {bancoSearch.trim() ? "Sin resultados. Prueba con otras palabras." : "Escribe para buscar objetivos en el banco."}
                      </div>
                    ) : (
                      bancoFiltered.slice(0, 30).map((g: any) => (
                        <button key={g.id}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors group"
                          onClick={() => addAdHocGoal(g)}>
                          <Plus className="h-4 w-4 mt-0.5 text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 leading-snug">{g.nombreObjetivo}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {g.areaClinica ?? g.area}
                              {g.nivelDificultad ? ` · ${g.nivelDificultad}` : ""}
                              {g.franjaEtaria ? ` · ${g.franjaEtaria} años` : ""}
                            </p>
                          </div>
                          <span className="text-xs font-mono shrink-0 mt-0.5 text-slate-300 group-hover:text-slate-500">
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

        {/* ── Card: notas generales ─────────────────────────────────────── */}
        {patient && (
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-3">
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

        {/* ── Save bar ──────────────────────────────────────────────────── */}
        {patient && (
          <div className="flex gap-3 pb-8">
            <Button variant="outline" className="w-28" onClick={() => navigate("/")}>
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
