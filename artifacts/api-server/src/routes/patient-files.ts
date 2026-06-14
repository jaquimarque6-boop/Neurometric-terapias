import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { db } from "@workspace/db";
import { patientFilesTable, patientsTable, usersTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  createSignedUploadUrl,
  createSignedDownloadUrl,
  deleteStorageObject,
  objectExists,
  storageConfigured,
} from "../lib/supabaseStorage";

const router: IRouter = Router();

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_MIME = new Set<string>([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/heic",
]);

function getSessionUser(req: any): { id: number; role: string } | null {
  if (!req.session?.userId) return null;
  return { id: req.session.userId, role: req.session.userRole ?? "professional" };
}

// Returns the patient if the session user may access it, otherwise writes the
// appropriate error response and returns null. Mirrors the existing patient
// access rule (admin sees all; professional only their assigned patients).
async function resolveAccessiblePatient(
  sess: { id: number; role: string },
  patientId: number,
  res: any,
): Promise<typeof patientsTable.$inferSelect | null> {
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId));
  if (!patient) {
    res.status(404).json({ error: "Paciente no encontrado" });
    return null;
  }
  if (sess.role !== "admin" && patient.assignedProfessionalId !== sess.id) {
    res.status(403).json({ error: "Sin acceso a este paciente" });
    return null;
  }
  return patient;
}

function sanitizeName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 120) || "archivo";
}

// ─── POST /patients/:patientId/files/upload-url ─────────────────────────────────
// Step 1: validate + return a short-lived signed upload URL (client uploads
// the bytes directly to Supabase Storage).
router.post("/patients/:patientId/files/upload-url", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });
    if (!storageConfigured()) return res.status(503).json({ error: "Almacenamiento no configurado" });

    const patientId = parseInt(req.params.patientId);
    if (Number.isNaN(patientId)) return res.status(400).json({ error: "Paciente inválido" });
    const patient = await resolveAccessiblePatient(sess, patientId, res);
    if (!patient) return;

    const { name, mimeType, size } = req.body ?? {};
    if (typeof name !== "string" || !name.trim()) return res.status(400).json({ error: "Nombre requerido" });
    if (typeof mimeType !== "string" || !ALLOWED_MIME.has(mimeType)) {
      return res.status(400).json({ error: "Tipo de archivo no permitido" });
    }
    if (typeof size !== "number" || size <= 0 || size > MAX_SIZE) {
      return res.status(400).json({ error: "El archivo supera el tamaño máximo de 25 MB" });
    }

    const storagePath = `patients/${patientId}/${randomUUID()}-${sanitizeName(name)}`;
    const { uploadUrl } = await createSignedUploadUrl(storagePath);
    return res.json({ uploadUrl, storagePath });
  } catch (err) {
    console.error("[POST /files/upload-url]", err);
    return res.status(500).json({ error: "No se pudo preparar la subida" });
  }
});

// ─── POST /patients/:patientId/files ────────────────────────────────────────────
// Step 2: persist metadata after the client finishes uploading to Storage.
router.post("/patients/:patientId/files", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });

    const patientId = parseInt(req.params.patientId);
    if (Number.isNaN(patientId)) return res.status(400).json({ error: "Paciente inválido" });
    const patient = await resolveAccessiblePatient(sess, patientId, res);
    if (!patient) return;

    const { originalName, mimeType, size, storagePath } = req.body ?? {};
    if (typeof originalName !== "string" || !originalName.trim()) {
      return res.status(400).json({ error: "Nombre requerido" });
    }
    if (typeof mimeType !== "string" || !ALLOWED_MIME.has(mimeType)) {
      return res.status(400).json({ error: "Tipo de archivo no permitido" });
    }
    if (typeof size !== "number" || size <= 0 || size > MAX_SIZE) {
      return res.status(400).json({ error: "Tamaño inválido" });
    }
    // Ensure the storage path belongs to this patient (prevents pointing a row
    // at an arbitrary object).
    if (typeof storagePath !== "string" || !storagePath.startsWith(`patients/${patientId}/`)) {
      return res.status(400).json({ error: "Ruta de almacenamiento inválida" });
    }

    // Confirm the object was actually uploaded before persisting metadata
    // (avoids phantom rows pointing at non-existent objects).
    if (storageConfigured() && !(await objectExists(storagePath))) {
      return res.status(400).json({ error: "El archivo no se subió correctamente" });
    }

    const [row] = await db
      .insert(patientFilesTable)
      .values({
        patientId,
        uploadedBy: sess.id,
        originalName: originalName.slice(0, 255),
        mimeType,
        sizeBytes: Math.round(size),
        storagePath,
      })
      .returning();

    return res.status(201).json({
      ...row,
      createdAt: row.createdAt.toISOString(),
      uploadedByName: null,
    });
  } catch (err) {
    console.error("[POST /files]", err);
    return res.status(500).json({ error: "No se pudo guardar el archivo" });
  }
});

// ─── GET /patients/:patientId/files ─────────────────────────────────────────────
router.get("/patients/:patientId/files", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });

    const patientId = parseInt(req.params.patientId);
    if (Number.isNaN(patientId)) return res.status(400).json({ error: "Paciente inválido" });
    const patient = await resolveAccessiblePatient(sess, patientId, res);
    if (!patient) return;

    const rows = await db
      .select({
        id: patientFilesTable.id,
        patientId: patientFilesTable.patientId,
        uploadedBy: patientFilesTable.uploadedBy,
        originalName: patientFilesTable.originalName,
        mimeType: patientFilesTable.mimeType,
        sizeBytes: patientFilesTable.sizeBytes,
        storagePath: patientFilesTable.storagePath,
        createdAt: patientFilesTable.createdAt,
        uploadedByName: usersTable.name,
      })
      .from(patientFilesTable)
      .leftJoin(usersTable, eq(usersTable.id, patientFilesTable.uploadedBy))
      .where(eq(patientFilesTable.patientId, patientId))
      .orderBy(desc(patientFilesTable.createdAt));

    return res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (err) {
    console.error("[GET /files]", err);
    return res.status(500).json({ error: "No se pudieron cargar los archivos" });
  }
});

// ─── GET /patients/:patientId/files/:fileId/download ────────────────────────────
router.get("/patients/:patientId/files/:fileId/download", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });
    if (!storageConfigured()) return res.status(503).json({ error: "Almacenamiento no configurado" });

    const patientId = parseInt(req.params.patientId);
    const fileId = parseInt(req.params.fileId);
    if (Number.isNaN(patientId) || Number.isNaN(fileId)) {
      return res.status(400).json({ error: "Parámetros inválidos" });
    }
    const patient = await resolveAccessiblePatient(sess, patientId, res);
    if (!patient) return;

    const [file] = await db
      .select()
      .from(patientFilesTable)
      .where(and(eq(patientFilesTable.id, fileId), eq(patientFilesTable.patientId, patientId)));
    if (!file) return res.status(404).json({ error: "Archivo no encontrado" });

    const url = await createSignedDownloadUrl(file.storagePath, 300, file.originalName);
    return res.json({ url });
  } catch (err) {
    console.error("[GET /files/:id/download]", err);
    return res.status(500).json({ error: "No se pudo generar el enlace de descarga" });
  }
});

// ─── DELETE /patients/:patientId/files/:fileId ──────────────────────────────────
// Any professional with access to the patient (or an admin) may delete.
router.delete("/patients/:patientId/files/:fileId", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });

    const patientId = parseInt(req.params.patientId);
    const fileId = parseInt(req.params.fileId);
    if (Number.isNaN(patientId) || Number.isNaN(fileId)) {
      return res.status(400).json({ error: "Parámetros inválidos" });
    }
    const patient = await resolveAccessiblePatient(sess, patientId, res);
    if (!patient) return;

    // Require storage to be reachable so we never delete the DB row while
    // leaving an orphaned object behind.
    if (!storageConfigured()) return res.status(503).json({ error: "Almacenamiento no configurado" });

    const [file] = await db
      .select()
      .from(patientFilesTable)
      .where(and(eq(patientFilesTable.id, fileId), eq(patientFilesTable.patientId, patientId)));
    if (!file) return res.status(404).json({ error: "Archivo no encontrado" });

    // Delete the storage object first; only remove the DB row if that succeeds
    // (deleteStorageObject throws on any non-404 error, which aborts before the
    // row delete), so we never leave an orphaned (inaccessible) object behind.
    await deleteStorageObject(file.storagePath);
    await db.delete(patientFilesTable).where(eq(patientFilesTable.id, fileId));

    return res.json({ success: true });
  } catch (err) {
    console.error("[DELETE /files/:id]", err);
    return res.status(500).json({ error: "No se pudo eliminar el archivo" });
  }
});

export default router;
