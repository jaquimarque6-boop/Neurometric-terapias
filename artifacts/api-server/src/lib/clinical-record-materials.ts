import type {
  RegistroClinicoMaterial,
  RegistroClinicoMaterialPhoto,
} from "@workspace/db/schema";

const SAFE_ID = /^[a-zA-Z0-9_-]{1,64}$/;

export type PublicRegistroClinicoMaterial = {
  id: string;
  nombre: string;
  fotos: Array<Pick<RegistroClinicoMaterialPhoto, "id" | "originalName" | "mimeType" | "sizeBytes">>;
};

export function normalizeNewMaterials(value: unknown): RegistroClinicoMaterial[] | null {
  if (!Array.isArray(value)) return null;
  const materials = value.flatMap((item): RegistroClinicoMaterial[] => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Record<string, unknown>;
    const id = typeof candidate.id === "string" ? candidate.id : "";
    const nombre = typeof candidate.nombre === "string" ? candidate.nombre.trim().slice(0, 250) : "";
    if (!SAFE_ID.test(id) || !nombre) return [];
    return [{ id, nombre, fotos: [] }];
  });
  return materials.length ? materials : null;
}

export function readStoredMaterials(value: unknown): RegistroClinicoMaterial[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): RegistroClinicoMaterial[] => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Record<string, unknown>;
    const id = typeof candidate.id === "string" ? candidate.id : "";
    const nombre = typeof candidate.nombre === "string" ? candidate.nombre : "";
    if (!SAFE_ID.test(id) || !nombre) return [];

    const fotos = Array.isArray(candidate.fotos)
      ? candidate.fotos.flatMap((photo): RegistroClinicoMaterialPhoto[] => {
          if (!photo || typeof photo !== "object") return [];
          const p = photo as Record<string, unknown>;
          if (
            typeof p.id !== "string" ||
            !SAFE_ID.test(p.id) ||
            typeof p.originalName !== "string" ||
            typeof p.mimeType !== "string" ||
            typeof p.sizeBytes !== "number" ||
            !Number.isFinite(p.sizeBytes) ||
            typeof p.storagePath !== "string"
          ) return [];
          return [{
            id: p.id,
            originalName: p.originalName,
            mimeType: p.mimeType,
            sizeBytes: p.sizeBytes,
            storagePath: p.storagePath,
            uploaded: p.uploaded === true,
          }];
        })
      : [];

    return [{ id, nombre, fotos }];
  });
}

export function publicMaterials(value: unknown): PublicRegistroClinicoMaterial[] {
  return readStoredMaterials(value).map(material => ({
    id: material.id,
    nombre: material.nombre,
    fotos: material.fotos
      .filter(photo => photo.uploaded)
      .map(({ id, originalName, mimeType, sizeBytes }) => ({ id, originalName, mimeType, sizeBytes })),
  }));
}

export function storagePathsForRecord(value: unknown, recordId: number): string[] {
  const prefix = `clinical-records/${recordId}/`;
  return readStoredMaterials(value)
    .flatMap(material => material.fotos)
    .map(photo => photo.storagePath)
    .filter(path => path.startsWith(prefix));
}

export function clinicalRecordPhotoPath(recordId: number, materialId: string, photoId: string): string {
  return `clinical-records/${recordId}/${materialId}/${photoId}`;
}
