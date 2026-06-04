import { useState } from "react";
import { Download, ShieldCheck } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { API_BASE } from "@/lib/api";

export default function Respaldo() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  if (!user) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`${API_BASE}/api/export/my-data`, {
        credentials: "include",
      });
      if (res.status === 204) {
        toast({ title: "Todavía no tenés datos cargados para exportar." });
        return;
      }
      if (!res.ok) throw new Error();

      const blob = await res.blob();
      if (!blob || blob.size === 0) throw new Error();
      const today = new Date().toISOString().slice(0, 10);
      const filename = `neurometric-respaldo-mis-datos-${today}.xlsx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Respaldo generado correctamente." });
    } catch {
      toast({
        title: "No fue posible generar el respaldo. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto w-full space-y-6 animate-in fade-in duration-400">

        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Respaldo de datos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Descargá una copia de tus pacientes y sesiones para conservar un respaldo de tu información.
          </p>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Download className="h-4 w-4 text-primary" /> Descargar respaldo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Se descarga un archivo Excel (.xlsx) con una hoja por sección: pacientes (incluye
              anamnesis, diagnóstico, informes y observaciones), registros clínicos / sesiones
              (fecha, resumen, observaciones, recomendaciones) y objetivos terapéuticos. Se abre
              correctamente en Excel y Google Sheets.
            </p>

            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full gap-2 h-11"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Generando…" : "Descargar mis datos"}
            </Button>

            <div className="flex items-start gap-2 rounded-lg bg-muted/40 border border-border/60 p-3">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Solo se exportan los datos asociados a tu cuenta. No se modifica ni elimina nada.
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}
