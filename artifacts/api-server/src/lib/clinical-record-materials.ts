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

export type ReconciledMaterialsUpdate = {
  materials: RegistroClinicoMaterial[] | null;
  storagePathsToDelete: string[];
};

export function reconcileMaterialsUpdate(
  currentValue: unknown,
  value: unknown,
  recordId: number,
): ReconciledMaterialsUpdate | null {
  if (value !== null && !Array.isArray(value)) return null;

  const currentMaterials = readStoredMaterials(currentValue);
  const currentById = new Map(currentMaterials.map(material => [material.id, material]));
  const nextMaterials: RegistroClinicoMaterial[] = [];
  const nextIds = new Set<string>();
  const storagePathsToDelete: string[] = [];

  const addRemovedPhotos = (materialId: string, photos: RegistroClinicoMaterial["fotos"]) => {
    for (const photo of photos) {
      const expectedPath = clinicalRecordPhotoPath(recordId, materialId, photo.id);
      if (photo.storagePath !== expectedPath) return false;
      storagePathsToDelete.push(photo.storagePath);
    }
    return true;
  };

  for (const item of (value ?? []) as unknown[]) {
    if (!item || typeof item !== "object") return null;
    const candidate = item as Record<string, unknown>;
    const id = typeof candidate.id === "string" ? candidate.id : "";
    const nombre = typeof candidate.nombre === "string" ? candidate.nombre.trim() : "";
    const rawPhotoIds = candidate.fotosIds;

    if (!SAFE_ID.test(id) || nextIds.has(id) || !nombre || nombre.length > 250) return null;
    if (!Array.isArray(rawPhotoIds) || rawPhotoIds.some(photoId =>
      typeof photoId !== "string" || !SAFE_ID.test(photoId)
    )) return null;

    const photoIds = rawPhotoIds as string[];
    const retainedIds = new Set(photoIds);
    if (retainedIds.size !== photoIds.length) return null;

    const current = currentById.get(id);
    const currentPhotos = current?.fotos ?? [];
    const currentPhotoIds = new Set(currentPhotos.map(photo => photo.id));
    if (photoIds.some(photoId => !currentPhotoIds.has(photoId))) return null;

    const removedPhotos = currentPhotos.filter(photo => !retainedIds.has(photo.id));
    if (!addRemovedPhotos(id, removedPhotos)) return null;

    nextIds.add(id);
    nextMaterials.push({
      id,
      nombre,
      fotos: currentPhotos.filter(photo => retainedIds.has(photo.id)),
    });
  }

  for (const current of currentMaterials) {
    if (nextIds.has(current.id)) continue;
    if (!addRemovedPhotos(current.id, current.fotos)) return null;
  }

  return {
    materials: nextMaterials.length ? nextMaterials : null,
    storagePathsToDelete: [...new Set(storagePathsToDelete)],
  };
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
