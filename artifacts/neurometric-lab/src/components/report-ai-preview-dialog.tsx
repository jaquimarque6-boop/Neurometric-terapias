import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ReportEditorDraft } from "@/lib/report-editor-workflow";

type Props = {
  open: boolean;
  current: ReportEditorDraft;
  proposed: ReportEditorDraft | null;
  onCancel: () => void;
  onAccept: () => void;
};

function normalizeAreaName(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("es-AR");
}

export function ReportAiPreviewDialog({ open, current, proposed, onCancel, onAccept }: Props) {
  const result = proposed ?? current;
  const areaNames = [...new Set([...Object.keys(current.areas), ...Object.keys(result.areas)])]
    .filter(name => !current.removedAreas.some(removed =>
      normalizeAreaName(removed) === normalizeAreaName(name),
    ))
    .sort((a, b) => a.localeCompare(b, "es-AR"));
  const sections = [
    { title: "Resumen", before: current.resumen, after: result.resumen },
    { title: "Conducta y observaciones", before: current.conducta, after: result.conducta },
    ...areaNames.map(name => ({
      title: name,
      before: current.areas[name] ?? "",
      after: result.areas[name] ?? "",
    })),
    { title: "Sugerencias para la familia", before: current.sugerencias, after: result.sugerencias },
  ].filter(section => section.before.trim() || section.after.trim());
  const hasChanges = sections.some(section => section.before !== section.after);

  return (
    <Dialog open={open} onOpenChange={nextOpen => { if (!nextOpen) onCancel(); }}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Revisar propuesta de IA
          </DialogTitle>
          <DialogDescription>
            El texto profesional se conserva literalmente; la IA solo agrega información clínica nueva respaldada por los datos. Cancelar no cambia el borrador. Aplicar tampoco guarda: podrás revisar y guardar desde el informe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {sections.map(section => (
            <section key={section.title} className="rounded-lg border border-border/70 p-3">
              <h3 className="mb-2 text-sm font-semibold">{section.title}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="min-w-0">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Texto actual</p>
                  <p className="min-h-10 whitespace-pre-wrap break-words rounded-md bg-muted/40 p-2 text-sm">
                    {section.before || "Sin contenido"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-xs font-medium text-primary">Después de aplicar</p>
                  <p className="min-h-10 whitespace-pre-wrap break-words rounded-md bg-primary/5 p-2 text-sm">
                    {section.after || "Sin contenido"}
                  </p>
                </div>
              </div>
              {section.before === section.after && (
                <p className="mt-2 text-xs text-muted-foreground">Se conserva sin cambios.</p>
              )}
            </section>
          ))}
          {sections.length === 0 && (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No hay texto actual ni aportes nuevos para mostrar. El borrador permanecerá sin cambios.
            </p>
          )}
          {sections.length > 0 && !hasChanges && (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              La IA no encontró aportes nuevos para agregar. El borrador permanecerá sin cambios.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t pt-3">
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="button" size="sm" onClick={onAccept} disabled={!hasChanges} className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Aplicar propuesta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
