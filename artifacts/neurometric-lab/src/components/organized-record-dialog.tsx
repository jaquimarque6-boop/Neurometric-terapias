import { useEffect, useState } from "react";
import { AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface OrganizedRecordFields {
  diagnostico: string;
  resumenSesion: string;
  observaciones: string;
  recomendacionesHogar: string;
}

interface OrganizedRecordDialogProps {
  open: boolean;
  proposal: OrganizedRecordFields | null;
  existing: OrganizedRecordFields;
  fieldKeys?: Array<keyof OrganizedRecordFields>;
  onOpenChange: (open: boolean) => void;
  onApply: (fields: OrganizedRecordFields) => void;
}

const FIELD_CONFIG: Array<{ key: keyof OrganizedRecordFields; label: string }> = [
  { key: "diagnostico", label: "Diagnóstico" },
  { key: "resumenSesion", label: "Resumen de sesión" },
  { key: "observaciones", label: "Observaciones" },
  { key: "recomendacionesHogar", label: "Recomendaciones para el hogar" },
];

function normalize(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function mergeText(existing: string, suggested: string): string {
  const current = normalize(existing);
  const proposal = normalize(suggested);
  if (!current) return proposal;
  if (!proposal || current === proposal) return current;
  return `${current}\n\n${proposal}`;
}

function mergeDiagnosis(existing: string, suggested: string): string {
  const values = `${normalize(existing)}, ${normalize(suggested)}`
    .split(/[,\n;]/)
    .map(value => value.trim())
    .filter(Boolean);
  return [...new Set(values)].join(", ");
}

export function OrganizedRecordDialog({
  open,
  proposal,
  existing,
  fieldKeys = ["diagnostico", "resumenSesion", "observaciones", "recomendacionesHogar"],
  onOpenChange,
  onApply,
}: OrganizedRecordDialogProps) {
  const [draft, setDraft] = useState<OrganizedRecordFields>(existing);
  const hasExistingContent = Object.values(existing).some(value => normalize(value).length > 0);

  useEffect(() => {
    if (open && proposal) {
      setDraft({
        diagnostico: mergeDiagnosis(existing.diagnostico, proposal.diagnostico),
        resumenSesion: mergeText(existing.resumenSesion, proposal.resumenSesion),
        observaciones: mergeText(existing.observaciones, proposal.observaciones),
        recomendacionesHogar: mergeText(existing.recomendacionesHogar, proposal.recomendacionesHogar),
      });
    }
  }, [open, proposal, existing]);

  const update = (key: keyof OrganizedRecordFields, value: string) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            Propuesta organizada
          </DialogTitle>
          <DialogDescription>
            Propuesta generada a partir de tus anotaciones. Revisala antes de guardar.
          </DialogDescription>
        </DialogHeader>

        {hasExistingContent && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Ya había contenido escrito. La propuesta no lo reemplazó silenciosamente: compará la propuesta con el contenido actual y editá cada campo antes de aplicarla.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {FIELD_CONFIG.filter(({ key }) => fieldKeys.includes(key)).map(({ key, label }) => {
            const current = normalize(existing[key]);
            const suggested = normalize(proposal?.[key]);
            const isEmpty = !current && !suggested;
            return (
              <div key={key} className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">{label}</label>
                {(current || suggested) && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {current && (
                      <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Contenido actual</p>
                        <p className="whitespace-pre-wrap text-xs text-foreground/80">{current}</p>
                      </div>
                    )}
                    {suggested && (
                      <div className="rounded-lg border border-violet-200 bg-violet-50/60 px-3 py-2">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-violet-700">Propuesta IA</p>
                        <p className="whitespace-pre-wrap text-xs text-violet-950">{suggested}</p>
                      </div>
                    )}
                  </div>
                )}
                <Textarea
                  value={draft[key]}
                  onChange={event => update(key, event.target.value)}
                  placeholder={isEmpty ? "Sin información explícita en las anotaciones." : ""}
                  rows={key === "diagnostico" ? 2 : 3}
                  className="resize-y text-sm"
                />
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" className="gap-2 bg-violet-600 text-white hover:bg-violet-700" onClick={() => onApply(draft)}>
            Aplicar al formulario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}