import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ListReport = {
  id: number;
  reportType: "evolution" | "family";
  title: string;
  authorName: string | null;
  createdAt: string;
};

export function PatientReportsList({ reports, selectedId, loading, onOpen, onNew }: {
  reports: ListReport[];
  selectedId: number | null;
  loading: boolean;
  onOpen: (id: number) => void;
  onNew: () => void;
}) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Informes guardados</CardTitle>
        <Button size="sm" variant="outline" onClick={onNew}>Nuevo informe</Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && <p className="text-xs text-muted-foreground">Cargando informes…</p>}
        {!loading && reports.length === 0 && <p className="text-xs text-muted-foreground">Todavía no hay informes guardados como documentos.</p>}
        {reports.map(report => (
          <button type="button" key={report.id} onClick={() => onOpen(report.id)}
            className={`w-full text-left rounded-lg border px-3 py-2 hover:bg-muted/50 ${selectedId === report.id ? "border-primary" : "border-border/50"}`}>
            <span className="block text-sm font-medium">{report.title} · {report.reportType === "family" ? "Familia" : "Evolución"}</span>
            <span className="text-xs text-muted-foreground">{new Date(report.createdAt).toLocaleDateString("es-AR")} · {report.authorName ?? "Autor no disponible"} · Abrir, editar e imprimir</span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}