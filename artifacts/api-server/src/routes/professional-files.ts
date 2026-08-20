import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { db } from "@workspace/db";
import { professionalFilesTable } from "@workspace/db/schema";
import { and, desc, eq } from "drizzle-orm";
import {
  createSignedDownloadUrl,
  createSignedUploadUrl,
  deleteStorageObject,
  objectExists,
  storageConfigured,
} from "../lib/supabaseStorage";

const router: IRouter = Router();
const MAX_SIZE = 25 * 1024 * 1024;

function getSessionUser(req: any): { id: number } | null {
  if (!req.session?.userId) return null;
  return { id: req.session.userId };
}

function sanitizeName(name: string): string {
  return (
    name
      .normalize("NFKD")
      .replace(/[^\w.\- ]+/g, "_")
      .replace(/\s+/g, "_")
      .slice(0, 120) || "material"
  );
}

router.get("/professional-files", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });

    const rows = await db
      .select()
      .from(professionalFilesTable)
      .where(eq(professionalFilesTable.uploadedBy, sess.id))
      .orderBy(desc(professionalFilesTable.createdAt));

    return res.json(rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })));
  } catch (err) {
    console.error("[GET /professional-files]", err);
    return res.status(500).json({ error: "No se pudieron cargar tus materiales" });
  }
});

router.post("/professional-files/upload-url", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });
    if (!storageConfigured()) return res.status(503).json({ error: "Almacenamiento no configurado" });

    const { name, mimeType, size } = req.body ?? {};
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Nombre de archivo requerido" });
    }
    if (mimeType !== "application/pdf" || !name.toLowerCase().endsWith(".pdf")) {
      return res.status(400).json({ error: "Solo se permiten archivos PDF" });
    }
    if (typeof size !== "number" || size <= 0 || size > MAX_SIZE) {
      return res.status(400).json({ error: "El PDF supera el tamaño máximo de 25 MB" });
    }

    const storagePath = `professionals/${sess.id}/${randomUUID()}-${sanitizeName(name)}`;
    const { uploadUrl } = await createSignedUploadUrl(storagePath);
    return res.json({ uploadUrl, storagePath });
  } catch (err) {
    console.error("[POST /professional-files/upload-url]", err);
    return res.status(500).json({ error: "No se pudo preparar la subida" });
  }
});

router.post("/professional-files", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });

    const { originalName, mimeType, size, storagePath } = req.body ?? {};
    if (typeof originalName !== "string" || !originalName.trim()) {
      return res.status(400).json({ error: "Nombre de archivo requerido" });
    }
    if (mimeType !== "application/pdf" || !originalName.toLowerCase().endsWith(".pdf")) {
      return res.status(400).json({ error: "Solo se permiten archivos PDF" });
    }
    if (typeof size !== "number" || size <= 0 || size > MAX_SIZE) {
      return res.status(400).json({ error: "Tamaño inválido" });
    }
    if (
      typeof storagePath !== "string" ||
      !storagePath.startsWith(`professionals/${sess.id}/`)
    ) {
      return res.status(400).json({ error: "Ruta de almacenamiento inválida" });
    }
    if (storageConfigured() && !(await objectExists(storagePath))) {
      return res.status(400).json({ error: "El PDF no se subió correctamente" });
    }

    const [row] = await db
      .insert(professionalFilesTable)
      .values({
        uploadedBy: sess.id,
        originalName: originalName.slice(0, 255),
        mimeType,
        sizeBytes: Math.round(size),
        storagePath,
      })
      .returning();

    return res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
  } catch (err) {
    console.error("[POST /professional-files]", err);
    return res.status(500).json({ error: "No se pudo guardar el material" });
  }
});

router.get("/professional-files/:id/download", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });
    if (!storageConfigured()) return res.status(503).json({ error: "Almacenamiento no configurado" });

    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Material inválido" });

    const [file] = await db
      .select()
      .from(professionalFilesTable)
      .where(and(eq(professionalFilesTable.id, id), eq(professionalFilesTable.uploadedBy, sess.id)));
    if (!file) return res.status(404).json({ error: "Material no encontrado" });

    const downloadName = req.query.download === "1" ? file.originalName : undefined;
    const url = await createSignedDownloadUrl(file.storagePath, 300, downloadName);
    return res.json({ url });
  } catch (err) {
    console.error("[GET /professional-files/:id/download]", err);
    return res.status(500).json({ error: "No se pudo generar el enlace del PDF" });
  }
});

router.delete("/professional-files/:id", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });
    if (!storageConfigured()) return res.status(503).json({ error: "Almacenamiento no configurado" });

    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Material inválido" });

    const [file] = await db
      .select()
      .from(professionalFilesTable)
      .where(and(eq(professionalFilesTable.id, id), eq(professionalFilesTable.uploadedBy, sess.id)));
    if (!file) return res.status(404).json({ error: "Material no encontrado" });

    await deleteStorageObject(file.storagePath);
    await db.delete(professionalFilesTable).where(eq(professionalFilesTable.id, id));
    return res.json({ success: true });
  } catch (err) {
    console.error("[DELETE /professional-files/:id]", err);
    return res.status(500).json({ error: "No se pudo eliminar el material" });
  }
});

export default router;