import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { recordUserActivityEvent } from "../lib/usage-audit-db";
import { db } from "@workspace/db";
import { registrosClinicosTable, patientsTable, professionalsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { canAccessPatient } from "./access-policy";
import {
  clinicalRecordPhotoPath,
  normalizeNewMaterials,
  publicMaterials,
  reconcileMaterialsUpdate,
  readStoredMaterials,
  storagePathsForRecord,
} from "../lib/clinical-record-materials";
import {
  createSignedDownloadUrl,
  createSignedUploadUrl,
  deleteStorageObject,
  objectExists,
  storageConfigured,
} from "../lib/supabaseStorage";

const router: IRouter = Router();

function getSessionUser(req: any): {
  id: number;
  role: string;
  professionalId: number | null;
  userName: string;
} | null {
  if (!req.session?.userId) return null;
  return {
    id: req.session.userId,
    role: req.session.userRole ?? "professional",
    professionalId: req.session.professionalId ?? null,
    userName: req.session.userName ?? "",
  };
}

async function enrich(r: typeof registrosClinicosTable.$inferSelect) {
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, r.patientId));
  let professionalName = r.professionalName;
  if (r.professionalId && !professionalName) {
    const [prof] = await db.select().from(professionalsTable).where(eq(professionalsTable.id, r.professionalId));
    professionalName = prof?.name ?? null;
  }
  const { materialesActividades, ...record } = r;
  return {
    ...record,
    materialesActividades: materialesActividades
      ? publicMaterials(materialesActividades)
      : null,
    patientName: patient?.name ?? r.patientName ?? null,
    professionalName,
    createdAt: r.createdAt.toISOString(),
  };
}

async function resolveAccessibleRecord(
  id: number,
  sess: { id: number; role: string },
  res: any,
): Promise<typeof registrosClinicosTable.$inferSelect | null> {
  const [record] = await db
    .select()
    .from(registrosClinicosTable)
    .where(eq(registrosClinicosTable.id, id));
  if (!record) {
    res.status(404).json({ error: "Not found" });
    return null;
  }
  if (sess.role !== "admin" && record.userId !== sess.id) {
    res.status(403).json({ error: "Sin acceso a este registro" });
    return null;
  }
  return record;
}

const MAX_PHOTO_SIZE = 25 * 1024 * 1024;
const ALLOWED_PHOTO_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/heic",
]);
const SAFE_MATERIAL_ID = /^[a-zA-Z0-9_-]{1,64}$/;

router.get("/registros-clinicos", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const patientId = req.query.patientId ? parseInt(req.query.patientId as string) : null;

  let records = await db.select().from(registrosClinicosTable).orderBy(registrosClinicosTable.fecha);

  // Role-based isolation: non-admin users see only their own records (by userId)
  if (sess.role !== "admin") {
    records = records.filter(r => r.userId === sess.id);
  }

  if (patientId) records = records.filter(r => r.patientId === patientId);
  const enriched = await Promise.all(records.map(enrich));
  return res.json(enriched);
});

router.post("/registros-clinicos", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const { patientId, fecha, diagnostico, resumenSesion, observaciones, recomendacionesHogar } = req.body;

  if (!patientId || !fecha) return res.status(400).json({ error: "patientId and fecha are required" });

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, parseInt(patientId)));
  if (!patient) return res.status(404).json({ error: "Paciente no encontrado" });
  if (!canAccessPatient(patient, sess)) {
    return res.status(403).json({ error: "Sin acceso a este paciente" });
  }
  const patientName = patient.name;

  // Resolve professionalId and name: use the session user's linked professionalId if available,
  // otherwise fall back to their name so the record always shows who created it.
  let professionalId: number | null = sess.professionalId ?? null;
  let professionalName: string | null = null;

  if (professionalId) {
    const [prof] = await db.select().from(professionalsTable).where(eq(professionalsTable.id, professionalId));
    professionalName = prof?.name ?? sess.userName;
  } else {
    // No linked professional profile — use the logged-in user's name for display
    professionalName = sess.userName || null;
  }

  const [record] = await db.insert(registrosClinicosTable).values({
    patientId: parseInt(patientId),
    patientName,
    professionalId,
    professionalName,
    userId: sess.id,
    fecha,
    diagnostico: diagnostico ?? null,
    resumenSesion: resumenSesion ?? null,
    observaciones: observaciones ?? null,
    recomendacionesHogar: recomendacionesHogar ?? null,
    materialesActividades: normalizeNewMaterials(req.body?.materialesActividades),
  }).returning();

  recordUserActivityEvent(sess.id, "clinical_record_saved");
  return res.status(201).json({
    ...record,
    materialesActividades: record.materialesActividades
      ? publicMaterials(record.materialesActividades)
      : null,
    createdAt: record.createdAt.toISOString(),
  });
});

router.get("/registros-clinicos/:id", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const id = parseInt(req.params.id);
  const record = await resolveAccessibleRecord(id, sess, res);
  if (!record) return;

  return res.json(await enrich(record));
});

router.get("/registros-clinicos/:id/materiales", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });
    const id = parseInt(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ error: "ID inválido" });

    const record = await resolveAccessibleRecord(id, sess, res);
    if (!record) return;

    const materials = readStoredMaterials(record.materialesActividades);
    const photos = materials.flatMap(material => material.fotos.filter(photo =>
      photo.uploaded &&
      photo.storagePath === clinicalRecordPhotoPath(record.id, material.id, photo.id)
    ));
    if (photos.length && !storageConfigured()) {
      return res.status(503).json({ error: "Almacenamiento no configurado" });
    }

    const result = await Promise.all(materials.map(async material => ({
      id: material.id,
      nombre: material.nombre,
      fotos: await Promise.all(material.fotos
        .filter(photo =>
          photo.uploaded &&
          photo.storagePath === clinicalRecordPhotoPath(record.id, material.id, photo.id)
        )
        .map(async photo => ({
          id: photo.id,
          originalName: photo.originalName,
          mimeType: photo.mimeType,
          sizeBytes: photo.sizeBytes,
          url: await createSignedDownloadUrl(photo.storagePath, 300, photo.originalName),
        }))),
    })));
    return res.json(result);
  } catch (err) {
    console.error("[GET /registros-clinicos/:id/materiales]", err);
    return res.status(500).json({ error: "No se pudieron cargar los materiales de la sesión" });
  }
});

router.post("/registros-clinicos/:id/materiales/:materialId/fotos/upload-url", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });
    const id = parseInt(req.params.id);
    const materialId = req.params.materialId;
    if (!Number.isSafeInteger(id) || id <= 0 || !SAFE_MATERIAL_ID.test(materialId)) {
      return res.status(400).json({ error: "Parámetros inválidos" });
    }
    const record = await resolveAccessibleRecord(id, sess, res);
    if (!record) return;
    if (!storageConfigured()) return res.status(503).json({ error: "Almacenamiento no configurado" });

    const material = readStoredMaterials(record.materialesActividades).find(item => item.id === materialId);
    if (!material) return res.status(404).json({ error: "Material no encontrado en este registro" });

    const { name, mimeType, size } = req.body ?? {};
    if (typeof name !== "string" || !name.trim()) return res.status(400).json({ error: "Nombre requerido" });
    if (typeof mimeType !== "string" || !ALLOWED_PHOTO_MIME.has(mimeType)) {
      return res.status(400).json({ error: "Tipo de imagen no permitido" });
    }
    if (typeof size !== "number" || !Number.isFinite(size) || size <= 0 || size > MAX_PHOTO_SIZE) {
      return res.status(400).json({ error: "La imagen debe pesar como máximo 25 MB" });
    }

    const photoId = randomUUID();
    const storagePath = clinicalRecordPhotoPath(record.id, materialId, photoId);
    const { uploadUrl } = await createSignedUploadUrl(storagePath);
    material.fotos.push({
      id: photoId,
      originalName: name.trim().slice(0, 255),
      mimeType,
      sizeBytes: Math.round(size),
      storagePath,
      uploaded: false,
    });

    const [updated] = await db.update(registrosClinicosTable)
      .set({ materialesActividades: readStoredMaterials(record.materialesActividades).map(item =>
        item.id === materialId ? material : item
      ) })
      .where(eq(registrosClinicosTable.id, record.id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });

    return res.json({ uploadUrl, photoId });
  } catch (err) {
    console.error("[POST /registros-clinicos/:id/materiales/:materialId/fotos/upload-url]", err);
    return res.status(500).json({ error: "No se pudo preparar la subida de la imagen" });
  }
});

router.post("/registros-clinicos/:id/materiales/:materialId/fotos/:photoId/complete", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });
    const id = parseInt(req.params.id);
    const { materialId, photoId } = req.params;
    if (!Number.isSafeInteger(id) || id <= 0 || !SAFE_MATERIAL_ID.test(materialId) || !SAFE_MATERIAL_ID.test(photoId)) {
      return res.status(400).json({ error: "Parámetros inválidos" });
    }
    const record = await resolveAccessibleRecord(id, sess, res);
    if (!record) return;
    if (!storageConfigured()) return res.status(503).json({ error: "Almacenamiento no configurado" });

    const materials = readStoredMaterials(record.materialesActividades);
    const material = materials.find(item => item.id === materialId);
    const photo = material?.fotos.find(item => item.id === photoId);
    if (!material || !photo) return res.status(404).json({ error: "Imagen no encontrada en este registro" });
    if (photo.storagePath !== clinicalRecordPhotoPath(record.id, materialId, photoId)) {
      return res.status(400).json({ error: "Ruta de imagen inválida" });
    }
    if (!(await objectExists(photo.storagePath))) {
      return res.status(400).json({ error: "La imagen todavía no está disponible en Storage" });
    }

    photo.uploaded = true;
    const [updated] = await db.update(registrosClinicosTable)
      .set({ materialesActividades: materials })
      .where(eq(registrosClinicosTable.id, record.id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json({ success: true });
  } catch (err) {
    console.error("[POST /registros-clinicos/:id/materiales/:materialId/fotos/:photoId/complete]", err);
    return res.status(500).json({ error: "No se pudo asociar la imagen al registro" });
  }
});

router.delete("/registros-clinicos/:id/materiales/:materialId/fotos/:photoId", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });
    const id = parseInt(req.params.id);
    const { materialId, photoId } = req.params;
    if (!Number.isSafeInteger(id) || id <= 0 || !SAFE_MATERIAL_ID.test(materialId) || !SAFE_MATERIAL_ID.test(photoId)) {
      return res.status(400).json({ error: "Parámetros inválidos" });
    }
    const record = await resolveAccessibleRecord(id, sess, res);
    if (!record) return;

    const materials = readStoredMaterials(record.materialesActividades);
    const material = materials.find(item => item.id === materialId);
    if (!material) return res.status(404).json({ error: "Material no encontrado en este registro" });
    const storagePath = clinicalRecordPhotoPath(record.id, materialId, photoId);
    if (!storageConfigured()) return res.status(503).json({ error: "Almacenamiento no configurado" });
    await deleteStorageObject(storagePath);

    material.fotos = material.fotos.filter(photo => photo.id !== photoId);
    const [updated] = await db.update(registrosClinicosTable)
      .set({ materialesActividades: materials })
      .where(eq(registrosClinicosTable.id, record.id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json({ success: true });
  } catch (err) {
    console.error("[DELETE /registros-clinicos/:id/materiales/:materialId/fotos/:photoId]", err);
    return res.status(500).json({ error: "No se pudo eliminar la imagen" });
  }
});

router.patch("/registros-clinicos/:id", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const id = parseInt(req.params.id);
  const existing = await resolveAccessibleRecord(id, sess, res);
  if (!existing) return;

  const { professionalId, fecha, diagnostico, resumenSesion, observaciones, recomendacionesHogar } = req.body;

  const updates: Record<string, any> = {};
  if (fecha !== undefined) updates.fecha = fecha;
  if (diagnostico !== undefined) updates.diagnostico = diagnostico;
  if (resumenSesion !== undefined) updates.resumenSesion = resumenSesion;
  if (observaciones !== undefined) updates.observaciones = observaciones;
  if (recomendacionesHogar !== undefined) updates.recomendacionesHogar = recomendacionesHogar;
  if (req.body?.materialesActividades !== undefined) {
    const reconciliation = reconcileMaterialsUpdate(
      existing.materialesActividades,
      req.body.materialesActividades,
      id,
    );
    if (!reconciliation) {
      return res.status(400).json({ error: "Materiales o fotos inválidos" });
    }
    if (reconciliation.storagePathsToDelete.length) {
      if (!storageConfigured()) return res.status(503).json({ error: "Almacenamiento no configurado" });
      try {
        await Promise.all(reconciliation.storagePathsToDelete.map(deleteStorageObject));
      } catch (err) {
        console.error("[PATCH /registros-clinicos/:id] No se pudieron eliminar fotos", err);
        return res.status(500).json({ error: "No se pudieron eliminar las fotos del registro" });
      }
    }
    updates.materialesActividades = reconciliation.materials;
  }
  if (professionalId !== undefined) {
    updates.professionalId = professionalId;
    if (professionalId) {
      const [prof] = await db.select().from(professionalsTable).where(eq(professionalsTable.id, parseInt(professionalId)));
      updates.professionalName = prof?.name ?? null;
    }
  }

  const [record] = await db.update(registrosClinicosTable).set(updates).where(eq(registrosClinicosTable.id, id)).returning();
  if (!record) return res.status(404).json({ error: "Not found" });
  const response = await enrich(record);
  recordUserActivityEvent(sess.id, "clinical_record_saved");
  return res.json(response);
});

router.delete("/registros-clinicos/:id", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const id = parseInt(req.params.id);
  const existing = await resolveAccessibleRecord(id, sess, res);
  if (!existing) return;

  const storagePaths = storagePathsForRecord(existing.materialesActividades, existing.id);
  if (storagePaths.length) {
    if (!storageConfigured()) return res.status(503).json({ error: "No se puede eliminar el registro porque Storage no está disponible" });
    try {
      await Promise.all(storagePaths.map(path => deleteStorageObject(path)));
    } catch (err) {
      console.error(`[DELETE /registros-clinicos/${id}] No se pudieron eliminar todas las imágenes`, err);
      return res.status(500).json({ error: "No se pudo eliminar el registro y sus imágenes" });
    }
  }

  await db.delete(registrosClinicosTable).where(eq(registrosClinicosTable.id, id));
  return res.status(204).send();
});

export default router;
