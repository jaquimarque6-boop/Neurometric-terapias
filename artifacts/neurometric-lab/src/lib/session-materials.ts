import type { SessionMaterialDraft } from "../components/session-materials-field";

export type SessionMaterialPayload = {
  id: string;
  nombre: string;
};

export function toSessionMaterialPayload(materials: SessionMaterialDraft[]): SessionMaterialPayload[] {
  return materials
    .map(({ id, nombre }) => ({ id, nombre: nombre.trim() }))
    .filter(material => material.nombre.length > 0);
}

async function readError(response: Response, fallback: string): Promise<Error> {
  const body = await response.json().catch(() => ({}));
  return new Error(body?.error ?? fallback);
}

export async function uploadSessionMaterialPhotos(
  recordId: number,
  materials: SessionMaterialDraft[],
  apiBase: string,
): Promise<string[]> {
  const failedPhotos: string[] = [];

  for (const material of materials) {
    if (!material.nombre.trim()) {
      failedPhotos.push(...material.fotos.map(file => file.name));
      continue;
    }
    for (const file of material.fotos) {
      let photoId: string | null = null;
      try {
        const uploadUrlResponse = await fetch(
          `${apiBase}/api/registros-clinicos/${recordId}/materiales/${encodeURIComponent(material.id)}/fotos/upload-url`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: file.name,
              mimeType: file.type || "application/octet-stream",
              size: file.size,
            }),
          },
        );
        if (!uploadUrlResponse.ok) throw await readError(uploadUrlResponse, "No se pudo preparar la foto");
        const upload = await uploadUrlResponse.json();
        photoId = typeof upload.photoId === "string" ? upload.photoId : null;
        if (!photoId || typeof upload.uploadUrl !== "string") throw new Error("Respuesta de carga inválida");

        const putResponse = await fetch(upload.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!putResponse.ok) throw new Error("Falló la carga de la foto");

        const completeResponse = await fetch(
          `${apiBase}/api/registros-clinicos/${recordId}/materiales/${encodeURIComponent(material.id)}/fotos/${encodeURIComponent(photoId)}/complete`,
          { method: "POST", credentials: "include" },
        );
        if (!completeResponse.ok) throw await readError(completeResponse, "No se pudo asociar la foto");
      } catch {
        if (photoId) {
          await fetch(
            `${apiBase}/api/registros-clinicos/${recordId}/materiales/${encodeURIComponent(material.id)}/fotos/${encodeURIComponent(photoId)}`,
            { method: "DELETE", credentials: "include" },
          ).catch(() => undefined);
        }
        failedPhotos.push(file.name);
      }
    }
  }

  return failedPhotos;
}

export async function saveClinicalRecordWithMaterials(
  record: Record<string, unknown>,
  materials: SessionMaterialDraft[],
  apiBase: string,
): Promise<{ record: any; failedPhotos: string[] }> {
  const response = await fetch(`${apiBase}/api/registros-clinicos`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...record,
      materialesActividades: toSessionMaterialPayload(materials),
    }),
  });
  if (!response.ok) throw await readError(response, "Error al guardar la sesión");
  const savedRecord = await response.json();
  const failedPhotos = await uploadSessionMaterialPhotos(savedRecord.id, materials, apiBase);
  return { record: savedRecord, failedPhotos };
}
