import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  FolderLock,
  Loader2,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { API_BASE } from "@/lib/api";

type ProfessionalFile = {
  id: number;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return typeof data?.error === "string" ? data.error : fallback;
  } catch {
    return fallback;
  }
}

export default function MisMateriales() {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<ProfessionalFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/professional-files`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error(await getErrorMessage(response, "No se pudieron cargar tus materiales."));
      setFiles(await response.json());
    } catch (error) {
      toast({
        title: "No se pudieron cargar tus materiales",
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadFiles();
  }, []);

  const visibleFiles = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("es");
    if (!normalized) return files;
    return files.filter((file) => file.originalName.toLocaleLowerCase("es").includes(normalized));
  }, [files, search]);

  const requestDownloadUrl = async (id: number, download = false) => {
    const query = download ? "?download=1" : "";
    const response = await fetch(`${API_BASE}/api/professional-files/${id}/download${query}`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error(await getErrorMessage(response, "No se pudo abrir el PDF."));
    const data = await response.json();
    return data.url as string;
  };

  const handleOpen = async (file: ProfessionalFile) => {
    try {
      const url = await requestDownloadUrl(file.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast({
        title: "No se pudo abrir el PDF",
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (file: ProfessionalFile) => {
    try {
      const url = await requestDownloadUrl(file.id, true);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.originalName;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast({
        title: "No se pudo descargar el PDF",
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      toast({
        title: "Archivo no válido",
        description: "Solo puedes subir archivos PDF.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const urlResponse = await fetch(`${API_BASE}/api/professional-files/upload-url`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          mimeType: file.type,
          size: file.size,
        }),
      });
      if (!urlResponse.ok) {
        throw new Error(await getErrorMessage(urlResponse, "No se pudo preparar la subida."));
      }

      const { uploadUrl, storagePath } = await urlResponse.json();
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      });
      if (!uploadResponse.ok) throw new Error("No se pudo subir el PDF al almacenamiento.");

      const metadataResponse = await fetch(`${API_BASE}/api/professional-files`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          storagePath,
        }),
      });
      if (!metadataResponse.ok) {
        throw new Error(await getErrorMessage(metadataResponse, "No se pudo guardar el material."));
      }

      const savedFile = await metadataResponse.json();
      setFiles((current) => [savedFile, ...current]);
      toast({ title: "PDF subido correctamente" });
    } catch (error) {
      toast({
        title: "No se pudo subir el PDF",
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (file: ProfessionalFile) => {
    if (!window.confirm(`¿Eliminar "${file.originalName}"?`)) return;
    setDeletingId(file.id);
    try {
      const response = await fetch(`${API_BASE}/api/professional-files/${file.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error(await getErrorMessage(response, "No se pudo eliminar el material."));
      setFiles((current) => current.filter((item) => item.id !== file.id));
      toast({ title: "Material eliminado" });
    } catch (error) {
      toast({
        title: "No se pudo eliminar el material",
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto w-full space-y-6 animate-in fade-in duration-400">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderLock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display text-foreground">Mis materiales</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Tu biblioteca privada de documentos PDF.
                </p>
              </div>
            </div>
          </div>
          <div>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={handleUpload}
            />
            <Button onClick={() => inputRef.current?.click()} disabled={isUploading} className="gap-2">
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isUploading ? "Subiendo…" : "Subir PDF"}
            </Button>
          </div>
        </div>

        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Archivos guardados
                <span className="text-xs font-normal text-muted-foreground">({files.length})</span>
              </CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nombre…"
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Cargando materiales…
              </div>
            ) : visibleFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                  <FileText className="h-6 w-6 text-muted-foreground/60" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {search ? "No encontramos materiales con ese nombre" : "Todavía no tienes materiales guardados"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {search ? "Prueba con otro término de búsqueda." : "Sube tu primer PDF para tenerlo siempre a mano."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {visibleFiles.map((file) => (
                  <div key={file.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/20 transition-colors">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-rose-50 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-rose-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground" title={file.originalName}>
                          {file.originalName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(file.createdAt)} · {formatSize(file.sizeBytes)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:shrink-0">
                      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => void handleOpen(file)}>
                        <ExternalLink className="h-3.5 w-3.5" />
                        Abrir
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => void handleDownload(file)}>
                        <Download className="h-3.5 w-3.5" />
                        Descargar
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        title="Eliminar"
                        disabled={deletingId === file.id}
                        onClick={() => void handleDelete(file)}
                      >
                        {deletingId === file.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground/70">
          Tus materiales son privados y solo están disponibles para tu cuenta.
        </p>
      </div>
    </AppLayout>
  );
}