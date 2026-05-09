import { useState, useEffect } from "react";
import {
  Sparkles, Target, BarChart3, RefreshCw, CheckSquare, Square,
  Clock, Layers, BookOpen, AlertTriangle, CheckCircle2,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListGoalsQueryKey } from "@workspace/api-client-react";
import { API_BASE } from "@/lib/api";

type SuggestedGoal = {
  title: string;
  description?: string;
  indicadorLogro?: string;
  intentosSugeridos?: number;
  sesionesEstimadas?: number;
  nivelDificultad?: "inicial" | "intermedio" | "avanzado";
  areaClinica?: string;
  category?: string;
  notas?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  patientId: number;
  patientName: string;
};

const NIVEL_STYLE: Record<string, string> = {
  inicial:     "bg-emerald-100 text-emerald-700 border-emerald-200",
  intermedio:  "bg-amber-100 text-amber-700 border-amber-200",
  avanzado:    "bg-orange-100 text-orange-700 border-orange-200",
};

const DISCIPLINE_LABEL: Record<string, string> = {
  "fonoaudiología":     "Fonoaudiología",
  "psicopedagogía":     "Psicopedagogía",
  "terapia_ocupacional": "Terapia Ocupacional",
  "general":            "General",
};

export function AIObjetivosDialog({ open, onClose, patientId, patientName }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedGoal[]>([]);
  const [discipline, setDiscipline] = useState<string>("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSuggestions([]);
      setSelected(new Set());
      setAddedIds(new Set());
      setError(null);
      generate();
    }
  }, [open]);

  const generate = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    setSelected(new Set());
    setAddedIds(new Set());
    try {
      const resp = await fetch(`${API_BASE}/api/ai/objetivos-suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ patientId }),
      });
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        throw new Error((e as any).error ?? "Error al generar objetivos");
      }
      const data = await resp.json();
      setSuggestions(data.objetivos ?? []);
      setDiscipline(data.discipline ?? "");
      // Pre-select all by default
      setSelected(new Set((data.objetivos ?? []).map((_: any, i: number) => i)));
    } catch (e: any) {
      setError(e.message ?? "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const handleAddSelected = async () => {
    const toAdd = suggestions.filter((_, i) => selected.has(i) && !addedIds.has(i));
    if (toAdd.length === 0) return;

    setIsSaving(true);
    const today = new Date().toISOString().split("T")[0];
    let addedCount = 0;
    const newAdded = new Set(addedIds);

    for (const [idx, g] of toAdd.entries()) {
      const originalIdx = suggestions.indexOf(g);
      try {
        const resp = await fetch(`${API_BASE}/api/goals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            patientId,
            title: g.title,
            description: g.description ?? null,
            category: g.category ?? g.areaClinica ?? "general",
            areaClinica: g.areaClinica ?? g.category ?? "general",
            nivelDificultad: g.nivelDificultad ?? null,
            notas: [
              g.indicadorLogro ? `Indicador de logro: ${g.indicadorLogro}` : null,
              g.intentosSugeridos ? `Intentos sugeridos: ${g.intentosSugeridos}` : null,
              g.sesionesEstimadas ? `Sesiones estimadas: ${g.sesionesEstimadas}` : null,
              g.notas ? `Estrategias: ${g.notas}` : null,
            ].filter(Boolean).join("\n") || null,
            status: "activo",
            fechaAsignacion: today,
          }),
        });
        if (resp.ok) {
          addedCount++;
          newAdded.add(originalIdx);
        }
      } catch {
        // continue with next
      }
    }

    setAddedIds(newAdded);
    setIsSaving(false);

    if (addedCount > 0) {
      queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
      toast({
        title: `${addedCount} objetivo${addedCount !== 1 ? "s" : ""} agregado${addedCount !== 1 ? "s" : ""}`,
        description: `Agregado${addedCount !== 1 ? "s" : ""} al plan terapéutico de ${patientName.split(" ")[0]}.`,
      });
    }
  };

  const allAdded = suggestions.length > 0 && selected.size > 0 &&
    [...selected].every(i => addedIds.has(i));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg font-display">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            Objetivos sugeridos por IA
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-0.5">
            {isLoading
              ? `Analizando historial clínico de ${patientName.split(" ")[0]}…`
              : discipline
              ? `Generado para ${DISCIPLINE_LABEL[discipline] ?? discipline} · ${patientName.split(" ")[0]}`
              : `Seleccioná los objetivos que deseas agregar al plan de ${patientName.split(" ")[0]}.`
            }
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative h-12 w-12">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
              </div>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                Analizando sesiones, objetivos actuales y perfil clínico para generar sugerencias personalizadas…
              </p>
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <AlertTriangle className="h-10 w-10 text-amber-500" />
              <p className="font-medium text-foreground">{error}</p>
              <Button variant="outline" size="sm" onClick={generate} className="gap-2 mt-1">
                <RefreshCw className="h-3.5 w-3.5" /> Reintentar
              </Button>
            </div>
          )}

          {/* Results */}
          {!isLoading && !error && suggestions.length > 0 && (
            <div className="space-y-3">
              {/* Select all / count */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
                <button
                  onClick={() => {
                    if (selected.size === suggestions.filter((_, i) => !addedIds.has(i)).length) {
                      setSelected(new Set());
                    } else {
                      setSelected(new Set(suggestions.map((_, i) => i).filter(i => !addedIds.has(i))));
                    }
                  }}
                  className="flex items-center gap-1.5 hover:text-primary transition-colors font-medium"
                >
                  {selected.size === suggestions.filter((_, i) => !addedIds.has(i)).length
                    ? <CheckSquare className="h-3.5 w-3.5" />
                    : <Square className="h-3.5 w-3.5" />
                  }
                  {selected.size === suggestions.filter((_, i) => !addedIds.has(i)).length
                    ? "Deseleccionar todos"
                    : "Seleccionar todos"
                  }
                </button>
                <span>{selected.size} de {suggestions.filter((_, i) => !addedIds.has(i)).length} seleccionados</span>
              </div>

              {suggestions.map((g, i) => {
                const isSelected = selected.has(i);
                const isAdded = addedIds.has(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => !isAdded && toggleSelect(i)}
                    disabled={isAdded}
                    className={`w-full text-left rounded-xl border p-4 transition-all ${
                      isAdded
                        ? "border-emerald-200 bg-emerald-50/60 opacity-80 cursor-default"
                        : isSelected
                        ? "border-primary/40 bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-border/80 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox / Added indicator */}
                      <div className="shrink-0 mt-0.5">
                        {isAdded
                          ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          : isSelected
                          ? <CheckSquare className="h-5 w-5 text-primary" />
                          : <Square className="h-5 w-5 text-muted-foreground/40" />
                        }
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Title + badges */}
                        <div className="flex flex-wrap items-start gap-2">
                          <p className="text-sm font-semibold text-foreground leading-snug flex-1 min-w-0">
                            {g.title}
                          </p>
                          {isAdded && (
                            <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 text-[10px] shrink-0">
                              Agregado
                            </Badge>
                          )}
                        </div>

                        {/* Description */}
                        {g.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed">{g.description}</p>
                        )}

                        {/* Metadata grid */}
                        <div className="flex flex-wrap gap-3 pt-0.5">
                          {g.areaClinica && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Layers className="h-3 w-3" />
                              <span className="capitalize">{g.areaClinica}</span>
                            </span>
                          )}
                          {g.nivelDificultad && (
                            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium ${NIVEL_STYLE[g.nivelDificultad] ?? "bg-muted text-muted-foreground"}`}>
                              <BarChart3 className="h-2.5 w-2.5" />
                              {g.nivelDificultad}
                            </span>
                          )}
                          {g.intentosSugeridos != null && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <RefreshCw className="h-3 w-3" />
                              {g.intentosSugeridos} intentos/sesión
                            </span>
                          )}
                          {g.sesionesEstimadas != null && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              ~{g.sesionesEstimadas} sesiones
                            </span>
                          )}
                        </div>

                        {/* Indicator */}
                        {g.indicadorLogro && (
                          <div className="flex items-start gap-1.5 bg-muted/60 rounded-lg px-3 py-2 mt-1">
                            <Target className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                            <p className="text-[11px] text-foreground/80 leading-snug">
                              <span className="font-semibold text-muted-foreground">Indicador: </span>
                              {g.indicadorLogro}
                            </p>
                          </div>
                        )}

                        {/* Notes / strategies */}
                        {g.notas && (
                          <div className="flex items-start gap-1.5 mt-1">
                            <BookOpen className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-[11px] text-muted-foreground leading-snug">{g.notas}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && !error && suggestions.length > 0 && (
          <div className="px-6 py-4 border-t border-border/50 shrink-0 flex items-center justify-between gap-3 bg-muted/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={generate}
              disabled={isSaving}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Regenerar
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
                {allAdded ? "Cerrar" : "Cancelar"}
              </Button>
              {!allAdded && (
                <Button
                  size="sm"
                  onClick={handleAddSelected}
                  disabled={isSaving || selected.size === 0 || [...selected].every(i => addedIds.has(i))}
                  className="gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Agregando…
                    </>
                  ) : (
                    <>
                      <Target className="h-3.5 w-3.5" />
                      Agregar {selected.size > 0 ? `${[...selected].filter(i => !addedIds.has(i)).length} ` : ""}al plan
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
