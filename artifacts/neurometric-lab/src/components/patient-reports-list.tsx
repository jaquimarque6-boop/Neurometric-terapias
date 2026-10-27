import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

type ListReport = {
  id: number;
  reportType: "evolution" | "family";
  title: string;
  authorName: string | null;
  createdAt: string;
};

export function PatientReportsList({ reports, selectedId, loading, onOpen, onNew, onDelete }: {
  reports: ListReport[];
  selectedId: number | null;
  loading: boolean;
  onOpen: (id: number) => void;
  onNew: () => void;
  onDelete: (id: number) => Promise<boolean>;
}) {
  const [reportToDelete, setReportToDelete] = useState<ListReport | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!reportToDelete || deleting) return;
    setDeleting(true);
    try {
      if (await onDelete(reportToDelete.id)) setReportToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Informes guardados</CardTitle>
          <Button size="sm" variant="outline" onClick={onNew}>Nuevo informe</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading && <p className="text-xs text-muted-foreground">Cargando informes…</p>}
          {!loading && reports.length === 0 && <p className="text-xs text-muted-foreground">Todavía no hay informes guardados como documentos.</p>}
          {reports.map(report => (
            <div key={report.id} className="flex items-stretch gap-2">
              <button type="button" onClick={() => onOpen(report.id)}
                className={`min-w-0 flex-1 text-left rounded-lg border px-3 py-2 hover:bg-muted/50 ${selectedId === report.id ? "border-primary" : "border-border/50"}`}>
                <span className="block text-sm font-medium">{report.title} · {report.reportType === "family" ? "Familia" : "Evolución"}</span>
                <span className="text-xs text-muted-foreground">{new Date(report.createdAt).toLocaleDateString("es-AR")} · {report.authorName ?? "Autor no disponible"} · Abrir, editar e imprimir</span>
              </button>
              <Button type="button" variant="ghost" size="icon"
                aria-label={`Eliminar informe ${report.title}`}
                onClick={() => setReportToDelete(report)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
      <AlertDialog open={!!reportToDelete} onOpenChange={open => {
        if (!open && !deleting) setReportToDelete(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este informe guardado?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará de forma permanente “{reportToDelete?.title}”. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button type="button" variant="destructive" disabled={deleting} onClick={() => void confirmDelete()}>
              {deleting ? "Eliminando…" : "Eliminar informe"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}