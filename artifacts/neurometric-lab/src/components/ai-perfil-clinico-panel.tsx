import { useState } from "react";
import {
  Brain, BarChart3, Target, Sparkles, RefreshCw,
  ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type AreaAfectada = {
  area: string;
  descripcion: string;
};

type PerfilResult = {
  perfilClinico: string;
  areasAfectadas: AreaAfectada[];
  focoIntervencion: string;
};

type Props = {
  patientId: number;
  onApplyToImpresion?: (text: string) => void;
};

export function AIPerfilClinicoPanel({ patientId, onApplyToImpresion }: Props) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PerfilResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const [editingPerfil, setEditingPerfil] = useState(false);
  const [editedPerfil, setEditedPerfil]   = useState("");
  const [editingFoco, setEditingFoco]     = useState(false);
  const [editedFoco, setEditedFoco]       = useState("");
  const [applied, setApplied]             = useState(false);

  async function generate() {
    setIsLoading(true);
    setError(null);
    setApplied(false);
    setEditingPerfil(false);
    setEditingFoco(false);
    try {
      const res = await fetch("/api/ai/perfil-clinico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      setResult(data);
      setEditedPerfil(data.perfilClinico ?? "");
      setEditedFoco(data.focoIntervencion ?? "");
      setIsExpanded(true);
    } catch (e: any) {
      setError(e.message);
      toast({ title: "Error al generar el perfil", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  function handleApply() {
    const text = editingPerfil ? editedPerfil : (result?.perfilClinico ?? "");
    if (onApplyToImpresion && text.trim()) {
      onApplyToImpresion(text.trim());
      setApplied(true);
      toast({ title: "Perfil aplicado", description: "El texto se copió al campo Impresión clínica inicial." });
    }
  }

  if (!result && !isLoading && !error) {
    return (
      <div className="border border-dashed border-primary/30 rounded-xl p-4 bg-primary/[0.015] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Perfil clínico con IA</p>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">
              Genera una descripción funcional basada en la anamnesis, objetivos y sesiones del paciente — sin etiquetas diagnósticas.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={generate}
          className="bg-primary hover:bg-primary/90 text-white gap-1.5 shrink-0"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Generar perfil clínico
        </Button>
      </div>
    );
  }

  return (
    <div className="border border-primary/20 rounded-xl overflow-hidden shadow-sm bg-card">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-b border-primary/10">
        <div className="flex items-center gap-2 flex-wrap">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground">Perfil clínico — IA</span>
          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 hidden sm:inline-flex">
            Borrador editable
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={generate}
            disabled={isLoading}
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-primary px-2"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Regenerar</span>
          </Button>
          {result && (
            <button
              onClick={() => setIsExpanded(v => !v)}
              className="p-1 text-muted-foreground hover:text-primary rounded transition-colors"
              aria-label={isExpanded ? "Colapsar" : "Expandir"}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="px-4 py-8 flex flex-col items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm">Analizando datos clínicos del paciente…</span>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && !isLoading && (
        <div className="px-4 py-4 flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Result ──────────────────────────────────────────────────────── */}
      {result && !isLoading && isExpanded && (
        <div className="divide-y divide-border/40">

          {/* 🧠 Perfil clínico */}
          <div className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Brain className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <span className="text-sm font-semibold text-foreground">Perfil clínico</span>
              </div>
              <button
                onClick={() => {
                  if (!editingPerfil) setEditedPerfil(result.perfilClinico);
                  setEditingPerfil(v => !v);
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Pencil className="h-3 w-3" />
                {editingPerfil ? "Confirmar" : "Editar"}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Descripción funcional de las dificultades — sin etiquetas diagnósticas
            </p>
            {editingPerfil ? (
              <Textarea
                value={editedPerfil}
                onChange={e => setEditedPerfil(e.target.value)}
                rows={4}
                className="resize-none text-sm bg-background/70 border-border/50"
              />
            ) : (
              <p className="text-sm text-foreground/85 leading-relaxed">
                {result.perfilClinico}
              </p>
            )}
          </div>

          {/* 📊 Áreas afectadas */}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-sky-100 flex items-center justify-center">
                <BarChart3 className="h-3.5 w-3.5 text-sky-600" />
              </div>
              <span className="text-sm font-semibold text-foreground">Áreas afectadas</span>
            </div>
            <p className="text-[11px] text-muted-foreground -mt-1">
              Áreas cognitivas y funcionales con evidencia en los datos del paciente
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(result.areasAfectadas ?? []).map((area, i) => (
                <div key={i} className="rounded-lg border border-border/50 bg-muted/30 p-3">
                  <p className="text-xs font-semibold text-foreground mb-1">{area.area}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{area.descripcion}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 🎯 Foco de intervención */}
          <div className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Target className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <span className="text-sm font-semibold text-foreground">Foco de intervención</span>
              </div>
              <button
                onClick={() => {
                  if (!editingFoco) setEditedFoco(result.focoIntervencion);
                  setEditingFoco(v => !v);
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Pencil className="h-3 w-3" />
                {editingFoco ? "Confirmar" : "Editar"}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Qué priorizar en la intervención terapéutica
            </p>
            {editingFoco ? (
              <Textarea
                value={editedFoco}
                onChange={e => setEditedFoco(e.target.value)}
                rows={3}
                className="resize-none text-sm bg-background/70 border-border/50"
              />
            ) : (
              <p className="text-sm text-foreground/85 leading-relaxed">
                {result.focoIntervencion}
              </p>
            )}
          </div>

          {/* ── Footer actions ────────────────────────────────────────── */}
          <div className="px-4 py-3 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">
              ⚠️ Revisá el contenido antes de aplicarlo. El terapeuta es responsable clínico del resultado.
            </p>
            {onApplyToImpresion && (
              <Button
                size="sm"
                onClick={handleApply}
                disabled={applied}
                className={
                  applied
                    ? "bg-emerald-600 hover:bg-emerald-600/90 text-white gap-1.5 shrink-0"
                    : "bg-primary hover:bg-primary/90 text-white gap-1.5 shrink-0"
                }
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {applied ? "Aplicado" : "Aplicar a impresión clínica"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
