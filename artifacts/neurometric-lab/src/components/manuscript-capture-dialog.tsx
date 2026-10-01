import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, ImagePlus, Loader2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import {
  transcribeManuscriptImage,
  type ManuscriptImageQuality,
} from "@/lib/manuscript-image";
import { manuscriptImageValidationError } from "@/lib/manuscript-image-validation";

type Quality = ManuscriptImageQuality;

interface ManuscriptCaptureDialogProps {
  patientId: number | null;
  onUseTranscription: (text: string) => void;
  onOrganizeTranscription?: (text: string) => Promise<void>;
  useLabel?: string;
  triggerClassName?: string;
}

export function ManuscriptCaptureDialog({
  patientId,
  onUseTranscription,
  onOrganizeTranscription,
  useLabel = "Usar transcripción",
  triggerClassName,
}: ManuscriptCaptureDialogProps) {
  const { toast } = useToast();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [quality, setQuality] = useState<Quality | null>(null);
  const [resultReady, setResultReady] = useState(false);
  const [error, setError] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const resetDraft = () => {
    setFile(null);
    setTranscription("");
    setWarnings([]);
    setQuality(null);
    setResultReady(false);
    setError("");
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const close = () => {
    if (isTranscribing || isOrganizing) return;
    setOpen(false);
    resetDraft();
  };

  const handleFile = (selected?: File) => {
    if (!selected) return;
    setError("");
    setResultReady(false);
    setTranscription("");
    setWarnings([]);
    setQuality(null);

    const validationError = manuscriptImageValidationError(selected);
    if (validationError) {
      setFile(null);
      setError(validationError);
      return;
    }
    setFile(selected);
  };

  const handleTranscribe = async () => {
    if (!patientId || !file) return;
    setIsTranscribing(true);
    setError("");
    try {
      const result = await transcribeManuscriptImage(patientId, file);
      setTranscription(result.transcription);
      setWarnings(result.warnings);
      setQuality(result.quality);
      setResultReady(true);
    } catch (cause: any) {
      setError(cause?.message ?? "No se pudo transcribir la imagen.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleUse = () => {
    const reviewedText = transcription.trim();
    if (!reviewedText) {
      setError("Revisá la transcripción antes de usarla.");
      return;
    }
    onUseTranscription(reviewedText);
    close();
  };

  const handleOrganize = async () => {
    const reviewedText = transcription.trim();
    if (!reviewedText || !onOrganizeTranscription) {
      setError("Revisá la transcripción antes de organizarla.");
      return;
    }
    setIsOrganizing(true);
    setError("");
    try {
      await onOrganizeTranscription(reviewedText);
      close();
    } catch (cause: any) {
      setError(cause?.message ?? "No se pudo organizar la transcripción.");
    } finally {
      setIsOrganizing(false);
    }
  };

  const openCapture = () => {
    if (!patientId) {
      toast({ title: "Seleccioná un paciente primero", variant: "destructive" });
      return;
    }
    resetDraft();
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={openCapture}
        className={triggerClassName ?? "w-full flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50/60 px-3 py-2.5 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-100"}
      >
        <Camera className="h-4 w-4" />
        Fotografiar anotaciones
      </button>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={event => {
          handleFile(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={event => {
          handleFile(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
      />

      <Dialog open={open} onOpenChange={nextOpen => {
        if (nextOpen) setOpen(true);
        else close();
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-violet-600" />
              Fotografiar anotaciones
            </DialogTitle>
            <DialogDescription>
              La imagen se procesa temporalmente para obtener una transcripción. No se guarda como archivo del paciente.
            </DialogDescription>
          </DialogHeader>

          {!file && (
            <div className="grid gap-3 py-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50/60 p-4 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-100"
              >
                <Camera className="h-7 w-7" />
                Tomar foto
                <span className="text-[11px] font-normal text-violet-600/80">Prioriza la cámara trasera</span>
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-muted/30 p-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <ImagePlus className="h-7 w-7 text-muted-foreground" />
                Elegir desde galería
                <span className="text-[11px] font-normal text-muted-foreground">También funciona en computadora</span>
              </button>
            </div>
          )}

          {file && previewUrl && (
            <div className="space-y-3">
              <div className={`overflow-hidden rounded-xl border bg-muted/20 ${resultReady ? "max-h-40" : "max-h-72"}`}>
                <img
                  src={previewUrl}
                  alt="Vista previa de las anotaciones"
                  className="mx-auto max-h-72 w-full object-contain"
                />
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {file && !resultReady && (
            <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
              <Button
                type="button"
                onClick={handleTranscribe}
                disabled={isTranscribing}
                className="w-full gap-2 bg-violet-600 text-white hover:bg-violet-700"
              >
                {isTranscribing
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Transcribiendo…</>
                  : "Usar esta foto"}
              </Button>
              <Button type="button" variant="outline" disabled={isTranscribing} onClick={resetDraft} className="w-full">
                Repetir / cambiar foto
              </Button>
              <Button type="button" variant="ghost" disabled={isTranscribing} onClick={close} className="w-full">
                Cancelar
              </Button>
            </DialogFooter>
          )}

          {resultReady && (
            <div className="space-y-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                <p className="font-semibold">Texto detectado</p>
                <p className="mt-1">
                  Revisá la transcripción antes de continuar. Algunas partes de la escritura pueden no haber sido interpretadas correctamente.
                </p>
              </div>

              {warnings.length > 0 && (
                <div className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-xs text-orange-800">
                  <p className="flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Advertencias de lectura
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">
                    {warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}
                  </ul>
                </div>
              )}

              {quality === "poor" && (
                <p className="text-xs font-medium text-red-600">
                  La calidad parece baja. Podés repetir la foto antes de usar esta transcripción.
                </p>
              )}

              <Textarea
                value={transcription}
                onChange={event => setTranscription(event.target.value)}
                rows={9}
                className="min-h-[180px] resize-y text-sm leading-relaxed"
                aria-label="Texto detectado editable"
              />

              <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
                <Button type="button" onClick={handleUse} disabled={!transcription.trim() || isOrganizing} className="w-full bg-violet-600 text-white hover:bg-violet-700">
                  {useLabel}
                </Button>
                {onOrganizeTranscription && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleOrganize}
                    disabled={!transcription.trim() || isOrganizing}
                    className="w-full gap-2 border-violet-200 text-violet-700 hover:bg-violet-50"
                  >
                    {isOrganizing
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Organizando…</>
                      : "✨ Organizar como registro"}
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={resetDraft} disabled={isOrganizing} className="w-full">
                  Volver a tomar / elegir foto
                </Button>
                <Button type="button" variant="ghost" onClick={close} disabled={isOrganizing} className="w-full">
                  Cancelar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}