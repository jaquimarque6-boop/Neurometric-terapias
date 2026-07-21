import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import {
  ArrowLeft, Zap, User, CalendarDays, Mic, MicOff, Sparkles,
  Save, CheckCircle2, ChevronDown, ChevronUp, AlertCircle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { API_BASE } from "@/lib/api";
import { ACTIVIDADES_URL } from "@/lib/actividades";
import { LastSessionSummary } from "@/components/last-session-summary";
import { getProfesion } from "@/utils/profession-map";
import { parseDiagnoses, serializeDiagnoses } from "@/utils/diagnosis-map";
import { formatEdad } from "@/utils/edad";
import { DiagnosisPicker } from "@/components/diagnosis-picker";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

// ── Clinical chip groups ────────────────────────────────────────────────────
const CHIP_GROUPS = [
  {
    key: "estado",
    label: "Estado general",
    chips: ["regulado", "cansado", "irritable", "baja energía", "hiperactivo", "malestar físico", "buena disposición"],
  },
  {
    key: "atencion",
    label: "Atención",
    chips: ["sostenida", "fluctuante", "dispersa", "requiere apoyos"],
  },
  {
    key: "sensorial",
    label: "Sensorial",
    chips: ["búsqueda sensorial", "evitación", "sensibilidad auditiva", "sensibilidad táctil", "necesidad de movimiento"],
  },
  {
    key: "participacion",
    label: "Participación",
    chips: ["buena", "parcial", "rechazo inicial", "se adaptó progresivamente"],
  },
] as const;

type ChipKey = typeof CHIP_GROUPS[number]["key"];
type ChipState = Record<ChipKey, string[]>;

const emptyChips = (): ChipState =>
  Object.fromEntries(CHIP_GROUPS.map(g => [g.key, []])) as unknown as ChipState;

// ── Web Speech API detection ────────────────────────────────────────────────
const SpeechRecognitionAPI =
  (typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) || null;

// ── Helpers ─────────────────────────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function serializeChipsToObservaciones(chips: ChipState, observacion: string): string {
  const lines = CHIP_GROUPS
    .map(g => {
      const sel = chips[g.key];
      if (!sel.length) return null;
      return `${g.label}: ${sel.join(", ")}`;
    })
    .filter(Boolean) as string[];

  const parts: string[] = [];
  if (lines.length > 0) parts.push(lines.join("\n"));
  if (observacion.trim()) parts.push(observacion.trim());
  return parts.join("\n\n");
}

// ── Component ────────────────────────────────────────────────────────────────
export default function SesionRapida() {
  const [, navigate] = useLocation();
  const search       = useSearch();
  const { toast }    = useToast();
  const { user }     = useAuth();

  const preselectedId = new URLSearchParams(search).get("patientId")
    ? parseInt(new URLSearchParams(search).get("patientId")!)
    : null;

  // ── State ──────────────────────────────────────────────────────────────────
  const [patients, setPatients]             = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [selectedId, setSelectedId]         = useState<number | null>(preselectedId);
  const [fecha, setFecha]                   = useState(todayISO());
  const [chips, setChips]                   = useState<ChipState>(emptyChips());
  const [resumen, setResumen]               = useState("");
  const [observacion, setObservacion]       = useState("");
  const [showChips, setShowChips]           = useState(true);

  const [sessionDiagnoses, setSessionDiagnoses] = useState<string[]>([]);
  const [showDiagScopeModal, setShowDiagScopeModal] = useState(false);

  const [isSaving, setIsSaving]             = useState(false);
  const [saved, setSaved]                   = useState(false);

  const profesion = getProfesion(user?.specialty);

  const [isRecording, setIsRecording]       = useState(false);
  const recognitionRef                      = useRef<any>(null);

  // ── Load patients ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/patients`, { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => {
        const sorted = [...data].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "es"));
        setPatients(sorted);
        if (preselectedId && !selectedId) setSelectedId(preselectedId);
      })
      .catch(() => setPatients([]))
      .finally(() => setLoadingPatients(false));
  }, []);

  const selectedPatient = patients.find(p => p.id === selectedId) ?? null;

  // Precarga el diagnóstico de la ficha al seleccionar paciente.
  useEffect(() => {
    setSessionDiagnoses(parseDiagnoses(selectedPatient?.diagnosis));
  }, [selectedId, selectedPatient?.diagnosis]);

  // ── Chip toggle ────────────────────────────────────────────────────────────
  const toggleChip = useCallback((key: ChipKey, chip: string) => {
    setChips(prev => {
      const current = prev[key];
      const next = current.includes(chip)
        ? current.filter(c => c !== chip)
        : [...current, chip];
      return { ...prev, [key]: next };
    });
  }, []);

  const totalChipsSelected = Object.values(chips).reduce((n, arr) => n + arr.length, 0);

  // ── Voice recording (Web Speech API) ──────────────────────────────────────
  const startRecording = useCallback(() => {
    if (!SpeechRecognitionAPI) return;
    const rec = new SpeechRecognitionAPI();
    rec.lang = "es-CL";
    rec.continuous = true;
    rec.interimResults = false;

    rec.onresult = (event: any) => {
      const transcript = Array.from(event.results as SpeechRecognitionResultList)
        .slice(event.resultIndex)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join(" ");
      if (transcript.trim()) {
        setResumen(prev => prev ? `${prev.trimEnd()} ${transcript.trim()}` : transcript.trim());
      }
    };

    rec.onerror = () => {
      setIsRecording(false);
      toast({ title: "Error al acceder al micrófono", variant: "destructive" });
    };

    rec.onend = () => setIsRecording(false);

    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
  }, [toast]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  // ── AI organizer ───────────────────────────────────────────────────────────
  const [isOrganizando, setIsOrganizando]   = useState(false);
  const [aiSugerencias, setAiSugerencias]   = useState<any[]>([]);

  const handleOrganizarIA = async () => {
    if (!selectedId) {
      toast({ title: "Selecciona un paciente primero", variant: "destructive" });
      return;
    }
    setIsOrganizando(true);
    setAiSugerencias([]);
    try {
      const res = await fetch(`${API_BASE}/api/ai/objetivos-suggest`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: selectedId, mode: "sesion", notes: resumen }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Error al consultar la IA");
      }
      const data = await res.json();
      const objetivos = Array.isArray(data.objetivos) ? data.objetivos : [];
      if (objetivos.length === 0) {
        toast({ title: "La IA no generó sugerencias", description: "Agrega más notas o registros clínicos del paciente e intenta de nuevo." });
      } else {
        setAiSugerencias(objetivos);
      }
    } catch (e: any) {
      toast({ title: e.message ?? "Error al organizar con IA", variant: "destructive" });
    } finally {
      setIsOrganizando(false);
    }
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const diagnosticoSesion = serializeDiagnoses(sessionDiagnoses);
  const diagnosisChanged  = !!selectedPatient && diagnosticoSesion !== serializeDiagnoses(parseDiagnoses(selectedPatient.diagnosis));

  const handleSave = () => {
    if (!selectedId) {
      toast({ title: "Selecciona un paciente para continuar", variant: "destructive" });
      return;
    }
    if (!resumen.trim() && totalChipsSelected === 0) {
      toast({ title: "Agrega al menos una nota o selecciona fichas clínicas", variant: "destructive" });
      return;
    }
    if (diagnosisChanged) { setShowDiagScopeModal(true); return; }
    performSave(false);
  };

  const performSave = async (updateFicha: boolean) => {
    if (!selectedId) return;
    setShowDiagScopeModal(false);
    setIsSaving(true);
    try {
      const observaciones = serializeChipsToObservaciones(chips, observacion);

      const res = await fetch(`${API_BASE}/api/registros-clinicos`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedId,
          fecha,
          diagnostico: diagnosticoSesion || null,
          resumenSesion: resumen.trim() || null,
          observaciones: observaciones || null,
          recomendacionesHogar: null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Error al guardar");
      }

      if (updateFicha && diagnosisChanged) {
        const pRes = await fetch(`${API_BASE}/api/patients/${selectedId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ diagnosis: diagnosticoSesion }),
        });
        if (pRes.ok) {
          const updated = await pRes.json().catch(() => null);
          setPatients(prev => prev.map(p =>
            p.id === selectedId ? { ...p, diagnosis: updated?.diagnosis ?? diagnosticoSesion } : p
          ));
        }
      }

      setSaved(true);
      toast({ title: "Sesión registrada correctamente" });

      setTimeout(() => {
        if (selectedId) navigate(`/patients/${selectedId}`);
        else navigate("/");
      }, 1200);
    } catch (e: any) {
      toast({ title: e.message ?? "Error al guardar la sesión", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = !!selectedId && (resumen.trim().length > 0 || totalChipsSelected > 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="flex flex-col gap-5 max-w-lg mx-auto w-full animate-in fade-in duration-300">

        {/* Back */}
        <button
          onClick={() => selectedPatient ? navigate(`/patients/${selectedId}`) : navigate("/")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 border border-amber-200/60">
            <Zap className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-foreground">Sesión rápida</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Registro sin objetivos — rápido y directo</p>
          </div>
        </div>

        {/* ── 1. Patient selector ─────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-4 space-y-2">
          <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <User className="h-3.5 w-3.5 text-muted-foreground" /> Paciente
          </label>
          {loadingPatients ? (
            <div className="h-10 bg-muted/40 rounded-lg animate-pulse" />
          ) : (
            <select
              value={selectedId ?? ""}
              onChange={e => setSelectedId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full rounded-xl border border-input bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Seleccionar paciente —</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.diagnosis ? ` · ${p.diagnosis}` : ""}
                </option>
              ))}
            </select>
          )}
          {selectedPatient && formatEdad((selectedPatient as any).fechaNacimiento, selectedPatient.age) && (
            <p className="text-xs text-muted-foreground pl-1">
              {formatEdad((selectedPatient as any).fechaNacimiento, selectedPatient.age)}
            </p>
          )}
        </div>

        {/* ── Diagnóstico ─────────────────────────────────────────────────── */}
        {selectedPatient && (
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-4">
            <DiagnosisPicker
              value={sessionDiagnoses}
              onChange={setSessionDiagnoses}
              profesion={profesion}
            />
          </div>
        )}

        {/* ── Resumen de la sesión anterior ───────────────────────────────── */}
        {selectedPatient && (
          <LastSessionSummary patientId={selectedId} title="📝 Resumen de la sesión anterior" />
        )}

        {/* ── 2. Date ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-4 space-y-2">
          <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" /> Fecha de la sesión
          </label>
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="w-full rounded-xl border border-input bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* ── 3. Quick chips ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-semibold text-foreground"
            onClick={() => setShowChips(v => !v)}
          >
            <span className="flex items-center gap-2">
              Fichas clínicas rápidas
              {totalChipsSelected > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-bold leading-none">
                  {totalChipsSelected}
                </span>
              )}
            </span>
            {showChips ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          {showChips && (
            <div className="px-4 pb-4 space-y-4 border-t border-border/40 pt-3">
              {CHIP_GROUPS.map(group => (
                <div key={group.key}>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.chips.map(chip => {
                      const isSelected = chips[group.key].includes(chip);
                      return (
                        <button
                          key={chip}
                          onClick={() => toggleChip(group.key, chip)}
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 active:scale-95 ${
                            isSelected
                              ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                              : "bg-muted/40 border-border/60 text-foreground/70 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50"
                          }`}
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 4. Free text / voice note ───────────────────────────────────── */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">Notas de sesión</label>

            {/* Mic button */}
            {SpeechRecognitionAPI ? (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isRecording
                    ? "bg-rose-500 border-rose-500 text-white animate-pulse"
                    : "bg-muted/40 border-border/60 text-foreground/70 hover:border-primary/40 hover:text-primary"
                }`}
                title={isRecording ? "Detener grabación" : "Dictar notas por voz"}
              >
                {isRecording ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                {isRecording ? "Detener" : "Dictar"}
              </button>
            ) : (
              <span
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] text-muted-foreground border border-dashed border-border/40 cursor-default"
                title="Tu navegador no soporta dictado por voz. Usa Chrome o Edge."
              >
                <Mic className="h-3 w-3 opacity-40" /> Voz no disponible
              </span>
            )}
          </div>

          {isRecording && (
            <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2 border border-rose-100">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              Escuchando… habla con claridad en español
            </div>
          )}

          <Textarea
            value={resumen}
            onChange={e => setResumen(e.target.value)}
            placeholder="Describe brevemente cómo fue la sesión, qué se trabajó, cómo respondió el paciente…"
            className="min-h-[120px] resize-none bg-muted/20 text-sm rounded-xl border-border/60 focus-visible:ring-amber-400/30"
            rows={5}
          />
          <p className="text-[11px] text-muted-foreground text-right">{resumen.length > 0 ? `${resumen.length} caracteres` : "Campo libre"}</p>
        </div>

        {/* ── 5. Free observation ─────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-4 space-y-2">
          <label className="text-sm font-semibold text-foreground">Observación libre</label>
          <Textarea
            value={observacion}
            onChange={e => setObservacion(e.target.value)}
            placeholder="Observaciones adicionales: conducta, contexto familiar, aspectos a seguir…"
            className="min-h-[80px] resize-none bg-muted/20 text-sm rounded-xl border-border/60"
            rows={3}
          />
        </div>

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2.5 pb-6">

          {/* Banco de Actividades (nueva pestaña, no interrumpe la sesión) */}
          <Button
            asChild
            variant="outline"
            className="w-full gap-2 border-sky-200 text-sky-700 hover:bg-sky-50 hover:border-sky-300"
          >
            <a href={ACTIVIDADES_URL} target="_blank" rel="noopener noreferrer">
              🎮 Abrir Banco de Actividades
            </a>
          </Button>

          {/* AI Organizer */}
          <Button
            variant="outline"
            onClick={handleOrganizarIA}
            disabled={!selectedId || isOrganizando}
            className="w-full gap-2 border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300 disabled:opacity-40"
          >
            <Sparkles className={`h-4 w-4 ${isOrganizando ? "animate-spin" : ""}`} />
            {isOrganizando ? "Organizando…" : "Organizar con IA"}
          </Button>

          {/* AI suggestions panel */}
          {aiSugerencias.length > 0 && (
            <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500 shrink-0" />
                <p className="text-sm font-semibold text-violet-800">
                  Sugerencias para hoy ({aiSugerencias.length})
                </p>
                <button
                  onClick={() => setAiSugerencias([])}
                  className="ml-auto text-[11px] text-violet-400 hover:text-violet-600 transition-colors"
                >
                  Cerrar
                </button>
              </div>
              <div className="space-y-2.5">
                {aiSugerencias.map((obj: any, i: number) => (
                  <div
                    key={i}
                    className="rounded-xl bg-white border border-violet-100 p-3 space-y-1 shadow-sm"
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-[10px] font-bold bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full shrink-0 uppercase tracking-wide">
                        {obj.nivelDificultad ?? "—"}
                      </span>
                      <p className="text-sm font-semibold text-foreground leading-snug">{obj.title}</p>
                    </div>
                    {obj.areaClinica && (
                      <p className="text-[11px] text-muted-foreground pl-1">
                        Área: <span className="font-medium text-violet-700">{obj.areaClinica}</span>
                        {obj.category && obj.category !== obj.areaClinica ? ` · ${obj.category}` : ""}
                      </p>
                    )}
                    {obj.rationale && (
                      <p className="text-[12px] text-muted-foreground pl-1 italic leading-snug">{obj.rationale}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={isSaving || !canSave || saved}
            className={`w-full gap-2 text-white font-semibold transition-all ${
              saved
                ? "bg-emerald-500 border-emerald-500"
                : "bg-amber-500 hover:bg-amber-600 border-amber-500"
            }`}
          >
            {saved ? (
              <><CheckCircle2 className="h-4 w-4" /> Guardado</>
            ) : isSaving ? (
              "Guardando…"
            ) : (
              <><Save className="h-4 w-4" /> Guardar sesión</>
            )}
          </Button>

          {!canSave && !saved && (
            <p className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Selecciona un paciente y agrega al menos una nota o ficha clínica
            </p>
          )}
        </div>

      </div>

      <Dialog open={showDiagScopeModal} onOpenChange={setShowDiagScopeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Diagnóstico modificado</DialogTitle>
            <DialogDescription>
              Cambiaste el diagnóstico respecto a la ficha del paciente. ¿Cómo querés guardar este cambio?
            </DialogDescription>
          </DialogHeader>
          {sessionDiagnoses.length > 0 && (
            <div className="flex flex-wrap gap-1.5 py-1">
              {sessionDiagnoses.map(v => (
                <span
                  key={v}
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                  style={{ background: "#81B29A1f", color: "#3f6b56" }}
                >
                  {v}
                </span>
              ))}
            </div>
          )}
          <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
            <Button
              className="w-full text-white"
              style={{ background: "#81B29A" }}
              onClick={() => performSave(true)}
            >
              También actualizar ficha del paciente
            </Button>
            <Button variant="outline" className="w-full" onClick={() => performSave(false)}>
              Solo esta sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
