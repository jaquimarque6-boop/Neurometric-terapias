import { useRef, useState } from "react";
import { AlertTriangle, Camera, ImagePlus, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { API_BASE } from "@/lib/api";
import {
  ANAMNESIS_IMPORT_FIELDS,
  buildAnamnesisImportDraft,
  normalizeAnamnesisImportValues,
  type AnamnesisImportKey,
  type AnamnesisImportValues,
} from "@/lib/anamnesis-import";
import {
  transcribeManuscriptImage,
} from "@/lib/manuscript-image";
import { manuscriptImageValidationError } from "@/lib/manuscript-image-validation";

const MAX_PHOTOS = 10;
const MAX_ORGANIZE_TEXT_LENGTH = 40_000;

interface AnamnesisPhotoImportDialogProps {
  patientId: number;
  existing: AnamnesisImportValues;
  onSave: (values: AnamnesisImportValues) => Promise<void>;
}

function fileIdentity(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

async function organizeTranscription(text: string): Promise<AnamnesisImportValues> {
  const response = await fetch(`${API_BASE}/api/ai/manuscrito-organize`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, target: "anamnesis" }),
  });
  const result = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(typeof result.error === "string"
      ? result.error
      : "No se pudo organizar la transcripción.");
  }
  return normalizeAnamnesisImportValues(result);
}

export function AnamnesisPhotoImportDialog({
  patientId,
  existing,
  onSave,
}: AnamnesisPhotoImportDialogProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [step, setStep] = useState<"select" | "review">("select");
  const [transcription, setTranscription] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [proposal, setProposal] = useState<AnamnesisImportValues | null>(null);
  const [draft, setDraft] = useState<AnamnesisImportValues | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setOpen(false);
    setFiles([]);
    setStep("select");
    setTranscription("");
    setWarnings([]);
    setProposal(null);
    setDraft(null);
    setError("");
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const addFiles = (selected: FileList | null) => {
    if (!selected?.length) return;
    const incoming = Array.from(selected);
    const rejected = incoming.filter(file => manuscriptImageValidationError(file) !== null);
    const valid = incoming.filter(file => manuscriptImageValidationError(file) === null);
    const unique = new Map([...files, ...valid].map(file => [fileIdentity(file), file]));
    const merged = [...unique.values()];
    setFiles(merged.slice(0, MAX_PHOTOS));
    if (valid.length) {
      setTranscription("");
      setWarnings([]);
      setProposal(null);
      setDraft(null);
    }
    setError(rejected.length
      ? "Se aceptan imágenes JPG, PNG o WebP de hasta 12 MB cada una."
      : merged.length > MAX_PHOTOS
        ? `Podés seleccionar hasta ${MAX_PHOTOS} fotos por importación.`
        : "");
  };

  const transcribeAndOrganize = async () => {
    if (!files.length || working) return;
    setWorking(true);
    setError("");
    setWarnings([]);
    try {
      const textParts: string[] = [];
      const collectedWarnings: string[] = [];

      for (const [index, file] of files.entries()) {
        try {
          const result = await transcribeManuscriptImage(patientId, file);
          if (result.transcription.trim()) {
            textParts.push(`Foto ${index + 1}\n${result.transcription.trim()}`);
          } else {
            collectedWarnings.push(`Foto ${index + 1}: no se obtuvo texto.`);
          }
          result.warnings.forEach(warning => {
            collectedWarnings.push(`Foto ${index + 1}: ${warning}`);
          });
          if (result.quality === "poor") {
            collectedWarnings.push(`Foto ${index + 1}: la calidad de lectura fue baja.`);
          }
        } catch (cause) {
          collectedWarnings.push(
            `Foto ${index + 1}: ${
              cause instanceof Error ? cause.message : "no se pudo transcribir."
            }`,
          );
        }
      }

      if (!textParts.length) {
        throw new Error("No se pudo transcribir ninguna foto. Revisá las imágenes e intentá nuevamente.");
      }

      const fullTranscription = textParts.join("\n\n").trim();
      if (fullTranscription.length > MAX_ORGANIZE_TEXT_LENGTH) {
        throw new Error("El texto de las fotos supera el límite de organización. Probá con menos imágenes.");
      }

      setTranscription(fullTranscription);
      setWarnings(collectedWarnings);
      const organized = await organizeTranscription(fullTranscription);
      setProposal(organized);
      setDraft(buildAnamnesisImportDraft(existing, organized));
      setStep("review");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo preparar la importación.");
    } finally {
      setWorking(false);
    }
  };

  const retryOrganization = async () => {
    if (!transcription.trim() || working) return;
    setWorking(true);
    setError("");
    try {
      const organized = await organizeTranscription(transcription);
      setProposal(organized);
      setDraft(buildAnamnesisImportDraft(existing, organized));
      setStep("review");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo organizar la transcripción.");
    } finally {
      setWorking(false);
    }
  };

  const updateDraft = (key: AnamnesisImportKey, value: string) => {
    setDraft(current => current ? { ...current, [key]: value } : current);
  };

  const saveImport = async () => {
    if (!draft || saving) return;
    setSaving(true);
    setError("");
    try {
      await onSave(draft);
      reset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la anamnesis.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        className="h-8 gap-1.5 border-violet-200 text-violet-700 hover:bg-violet-50 text-xs"
      >
        <Camera className="h-3.5 w-3.5" />
        Importar anamnesis desde foto
      </Button>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={event => {
          addFiles(event.currentTarget.files);
          event.currentTarget.value = "";
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={event => {
          addFiles(event.currentTarget.files);
          event.currentTarget.value = "";
        }}
      />

      <Dialog
        open={open}
        onOpenChange={nextOpen => {
          if (nextOpen) setOpen(true);
          else if (!working && !saving) reset();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-violet-600" />
              {step === "review" ? "Revisar importación" : "Importar anamnesis desde foto"}
            </DialogTitle>
            <DialogDescription>
              Las fotos se procesan temporalmente y no se guardan como archivos del paciente.
              La IA usa el consentimiento vigente de Neurometric.
            </DialogDescription>
          </DialogHeader>

          {step === "select" ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={working}
                  onClick={() => cameraInputRef.current?.click()}
                  className="min-h-24 flex-col gap-2 border-violet-200 bg-violet-50/50 text-violet-700 hover:bg-violet-100"
                >
                  <Camera className="h-6 w-6" />
                  Tomar una foto
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={working}
                  onClick={() => galleryInputRef.current?.click()}
                  className="min-h-24 flex-col gap-2"
                >
                  <ImagePlus className="h-6 w-6" />
                  Elegir una o varias fotos
                </Button>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{files.length} de {MAX_PHOTOS} fotos seleccionadas</p>
                  <ul className="space-y-1">
                    {files.map(file => (
                      <li key={fileIdentity(file)} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                        <span className="min-w-0 truncate">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        <button
                          type="button"
                          aria-label={`Quitar ${file.name}`}
                          disabled={working}
                          onClick={() => {
                            setFiles(current => current.filter(item => fileIdentity(item) !== fileIdentity(file)));
                            setTranscription("");
                            setWarnings([]);
                            setProposal(null);
                            setDraft(null);
                          }}
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {transcription && (
                <details className="rounded-xl border border-border p-3">
                  <summary className="cursor-pointer text-sm font-medium">Transcripción obtenida; todavía no se guardó</summary>
                  <Textarea
                    readOnly
                    value={transcription}
                    aria-label="Transcripción completa de las fotos"
                    rows={6}
                    className="mt-3 resize-y text-sm"
                  />
                </details>
              )}

              {working && (
                <p className="flex items-center gap-2 text-sm text-violet-700" role="status">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Transcribiendo fotos y organizando los campos…
                </p>
              )}
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button type="button" variant="ghost" onClick={reset} disabled={working}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => void (transcription ? retryOrganization() : transcribeAndOrganize())}
                  disabled={!files.length || working}
                  className="gap-2 bg-violet-600 text-white hover:bg-violet-700"
                >
                  {working && <Loader2 className="h-4 w-4 animate-spin" />}
                  {transcription ? "Reintentar organización" : "Transcribir y organizar"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Revisá la información antes de guardarla. La transcripción mediante IA puede contener errores u omisiones.</p>
              </div>

              {warnings.length > 0 && (
                <div className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm text-orange-900">
                  <p className="font-semibold">Avisos de lectura</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}
                  </ul>
                </div>
              )}

              <details className="rounded-xl border border-border p-3">
                <summary className="cursor-pointer text-sm font-medium">Ver transcripción de las fotos</summary>
                <Textarea
                  readOnly
                  value={transcription}
                  aria-label="Transcripción completa de las fotos"
                  rows={7}
                  className="mt-3 resize-y text-sm"
                />
              </details>

              <div className="space-y-4">
                {ANAMNESIS_IMPORT_FIELDS.map(({ key, label }) => {
                  const current = existing[key].trim();
                  const suggested = proposal?.[key].trim() ?? "";
                  return (
                    <section key={key} className="space-y-2 rounded-xl border border-border/70 p-3">
                      <h3 className="text-sm font-semibold">{label}</h3>
                      {(current || suggested) && (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {current && (
                            <div className="rounded-lg border bg-muted/30 px-3 py-2">
                              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Contenido actual</p>
                              <p className="whitespace-pre-wrap text-xs">{current}</p>
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
                        value={draft?.[key] ?? ""}
                        onChange={event => updateDraft(key, event.target.value)}
                        rows={key === "motivoConsulta" || key === "impresionClinica" ? 2 : 3}
                        aria-label={`Revisar ${label}`}
                        className="resize-y text-sm"
                      />
                    </section>
                  );
                })}
              </div>

              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => {
                    setError("");
                    setStep("select");
                    setTranscription("");
                    setWarnings([]);
                    setProposal(null);
                    setDraft(null);
                  }}
                >
                  Volver a las fotos
                </Button>
                <Button type="button" variant="ghost" disabled={saving} onClick={reset}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => void saveImport()}
                  disabled={!draft || saving}
                  className="gap-2 bg-violet-600 text-white hover:bg-violet-700"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Guardar en anamnesis
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}