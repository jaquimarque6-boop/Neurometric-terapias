import { API_BASE } from "./api";
import { manuscriptImageValidationError } from "./manuscript-image-validation";

const OUTPUT_MAX_BYTES = 8 * 1024 * 1024;

export type ManuscriptImageQuality = "good" | "fair" | "poor";

export interface ManuscriptTranscription {
  transcription: string;
  warnings: string[];
  quality: ManuscriptImageQuality;
}

function bytesFromBase64(base64: string): number {
  const padding = base64.match(/=*$/)?.[0].length ?? 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

async function compressImage(file: File): Promise<{
  dataUrl: string;
  mimeType: "image/jpeg";
  sizeBytes: number;
}> {
  const validationError = manuscriptImageValidationError(file);
  if (validationError) throw new Error(validationError);

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("No se pudo leer la imagen."));
      element.src = sourceUrl;
    });

    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error("La imagen no tiene dimensiones válidas.");
    }

    const maxDimension = 2400;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo preparar la imagen.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.9, 0.82, 0.74, 0.66]) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      const base64 = dataUrl.split(",")[1] ?? "";
      const sizeBytes = bytesFromBase64(base64);
      if (sizeBytes > 0 && sizeBytes <= OUTPUT_MAX_BYTES) {
        return { dataUrl, mimeType: "image/jpeg", sizeBytes };
      }
    }
    throw new Error("La imagen sigue siendo demasiado grande después de comprimirla.");
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export async function transcribeManuscriptImage(
  patientId: number,
  file: File,
): Promise<ManuscriptTranscription> {
  if (!Number.isInteger(patientId) || patientId <= 0) {
    throw new Error("No se pudo identificar al paciente.");
  }

  const compressed = await compressImage(file);
  const response = await fetch(`${API_BASE}/api/ai/manuscrito-transcribe`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patientId,
      imageData: compressed.dataUrl,
      mimeType: compressed.mimeType,
      sizeBytes: compressed.sizeBytes,
    }),
  });
  const data = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "No se pudo transcribir la imagen.");
  }

  return {
    transcription: typeof data.transcription === "string" ? data.transcription : "",
    warnings: Array.isArray(data.warnings)
      ? data.warnings.filter((warning): warning is string => typeof warning === "string")
      : [],
    quality: data.quality === "good" || data.quality === "fair" || data.quality === "poor"
      ? data.quality
      : "fair",
  };
}