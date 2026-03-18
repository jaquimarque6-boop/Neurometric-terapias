import { useState } from "react";
import { Target, ChevronDown, CheckSquare, Square } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export type Goal = {
  id: number; patientId: number; goalLibraryId?: number | null;
  codigo?: string | null; title: string; description?: string | null;
  category: string; areaClinica?: string | null; franjaEtaria?: string | null;
  nivelDificultad?: string | null; status: string;
  progressPct?: number | null;
  fechaAsignacion?: string | null; targetDate?: string | null;
  notas?: string | null; createdAt: string;
};

export const PERFORMANCE_MAP: Record<string, { label: string; statusNuevo: string; pct: number }> = {
  "logrado":     { label: "Logrado",    statusNuevo: "logrado",     pct: 100 },
  "en progreso": { label: "En progreso",statusNuevo: "en progreso", pct: 65  },
  "con ayuda":   { label: "Con ayuda",  statusNuevo: "en progreso", pct: 40  },
  "no logrado":  { label: "No logrado", statusNuevo: "activo",      pct: 15  },
};

export function RegistroForm({
  patientId,
  workingGoals,
  onSave,
  isSaving,
  onClose,
}: {
  patientId: number;
  workingGoals: Goal[];
  onSave: (d: { registro: any; goalUpdates: Array<{ goalId: number; performance: string }> }) => void;
  isSaving: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split("T")[0],
    resumenSesion: "", observaciones: "", recomendacionesHogar: "",
  });
  const [selectedGoals, setSelectedGoals] = useState<Record<number, string>>({});
  const [showNotes, setShowNotes] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const toggleGoal = (goalId: number) => {
    setSelectedGoals(prev => {
      if (prev[goalId] !== undefined) {
        const next = { ...prev }; delete next[goalId]; return next;
      }
      return { ...prev, [goalId]: "en progreso" };
    });
  };

  const setPerformance = (goalId: number, perf: string) =>
    setSelectedGoals(prev => ({ ...prev, [goalId]: perf }));

  const goalUpdates = Object.entries(selectedGoals).map(([id, performance]) => ({
    goalId: parseInt(id), performance,
  }));

  const canSave = form.fecha && (goalUpdates.length > 0 || form.resumenSesion.trim());

  const perfBadgeColor: Record<string, string> = {
    "logrado":     "bg-emerald-50 text-emerald-700 border-emerald-200",
    "en progreso": "bg-blue-50 text-blue-700 border-blue-200",
    "con ayuda":   "bg-amber-50 text-amber-700 border-amber-200",
    "no logrado":  "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="space-y-5 py-2">
      {/* Date */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Fecha de sesión</label>
        <Input type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} className="bg-slate-50" />
      </div>

      {/* Objectives */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <Target className="h-4 w-4 text-primary" />
            Objetivos trabajados hoy
            {goalUpdates.length > 0 && (
              <span className="ml-1 inline-flex items-center rounded-full bg-primary/10 text-primary border border-primary/20 text-xs px-2 py-0.5 font-medium">
                {goalUpdates.length} seleccionados
              </span>
            )}
          </label>
          <span className="text-xs text-slate-400">{workingGoals.length} activos</span>
        </div>

        {workingGoals.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-400">
            No hay objetivos activos asignados a este paciente.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-64 overflow-y-auto shadow-sm">
            {workingGoals.map(goal => {
              const checked = selectedGoals[goal.id] !== undefined;
              const perf = selectedGoals[goal.id];
              return (
                <div
                  key={goal.id}
                  className={`flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer ${checked ? "bg-primary/5" : "hover:bg-slate-50"}`}
                  onClick={() => toggleGoal(goal.id)}
                >
                  <div className="flex-shrink-0 text-primary" onClick={e => { e.stopPropagation(); toggleGoal(goal.id); }}>
                    {checked
                      ? <CheckSquare className="h-5 w-5" />
                      : <Square className="h-5 w-5 text-slate-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${checked ? "text-slate-900" : "text-slate-500"}`}>
                      {goal.title}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {goal.areaClinica ?? goal.category}{goal.nivelDificultad ? ` · ${goal.nivelDificultad}` : ""}
                      {goal.status === "en progreso" && <span className="ml-1 text-blue-400">· En progreso</span>}
                    </p>
                  </div>
                  {checked && (
                    <div onClick={e => e.stopPropagation()}>
                      <Select value={perf} onValueChange={v => setPerformance(goal.id, v)}>
                        <SelectTrigger className={`w-36 h-7 text-xs border ${perfBadgeColor[perf] ?? ""}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="logrado">✅ Logrado</SelectItem>
                          <SelectItem value="en progreso">🔵 En progreso</SelectItem>
                          <SelectItem value="con ayuda">🟡 Con ayuda</SelectItem>
                          <SelectItem value="no logrado">🔴 No logrado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Optional notes — collapsible */}
      <div>
        <button
          type="button"
          onClick={() => setShowNotes(n => !n)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${showNotes ? "rotate-180" : ""}`} />
          Notas adicionales
          <span className="text-xs text-slate-400">(opcional)</span>
        </button>

        {showNotes && (
          <div className="space-y-3 pt-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Resumen de sesión</label>
              <Textarea rows={2} value={form.resumenSesion} onChange={e => set("resumenSesion", e.target.value)}
                placeholder="Describe lo trabajado en sesión..." className="bg-slate-50 resize-none text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Observaciones clínicas</label>
              <Textarea rows={2} value={form.observaciones} onChange={e => set("observaciones", e.target.value)}
                placeholder="Observaciones relevantes..." className="bg-slate-50 resize-none text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Recomendaciones para el hogar</label>
              <Textarea rows={2} value={form.recomendacionesHogar} onChange={e => set("recomendacionesHogar", e.target.value)}
                placeholder="Actividades para la familia..." className="bg-slate-50 resize-none text-sm" />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-1 border-t border-slate-100">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
        <Button
          className="flex-1 bg-primary hover:bg-primary/90"
          disabled={!canSave || isSaving}
          onClick={() => onSave({
            registro: {
              patientId,
              fecha: form.fecha,
              resumenSesion: form.resumenSesion || undefined,
              observaciones: form.observaciones || undefined,
              recomendacionesHogar: form.recomendacionesHogar || undefined,
            },
            goalUpdates,
          })}
        >
          {isSaving
            ? "Guardando..."
            : goalUpdates.length > 0
              ? `Guardar · ${goalUpdates.length} objetivo${goalUpdates.length !== 1 ? "s" : ""}`
              : "Guardar registro"}
        </Button>
      </div>
    </div>
  );
}
