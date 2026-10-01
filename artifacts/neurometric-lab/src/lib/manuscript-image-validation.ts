const INPUT_MAX_BYTES = 12 * 1024 * 1024;
const MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function manuscriptImageValidationError(file: Pick<File, "type" | "size">): string | null {
  if (!MIME_TYPES.has(file.type)) return "Elegí una imagen JPG, PNG o WebP.";
  if (!file.size) return "El archivo está vacío.";
  if (file.size > INPUT_MAX_BYTES) return "La imagen supera el máximo de 12 MB.";
  return null;
}