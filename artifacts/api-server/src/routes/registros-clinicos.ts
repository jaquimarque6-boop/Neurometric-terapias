import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { registrosClinicosTable, patientsTable, professionalsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

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
  return {
    ...r,
    patientName: patient?.name ?? r.patientName ?? null,
    professionalName,
    createdAt: r.createdAt.toISOString(),
  };
}

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
  const patientName = patient?.name ?? null;

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
  }).returning();

  return res.status(201).json({ ...record, createdAt: record.createdAt.toISOString() });
});

router.get("/registros-clinicos/:id", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const id = parseInt(req.params.id);
  const [record] = await db.select().from(registrosClinicosTable).where(eq(registrosClinicosTable.id, id));
  if (!record) return res.status(404).json({ error: "Not found" });

  // Access check: non-admin can only access their own records
  if (sess.role !== "admin" && record.userId !== sess.id) {
    return res.status(403).json({ error: "Sin acceso a este registro" });
  }

  return res.json(await enrich(record));
});

router.patch("/registros-clinicos/:id", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(registrosClinicosTable).where(eq(registrosClinicosTable.id, id));
  if (!existing) return res.status(404).json({ error: "Not found" });

  // Access check: non-admin can only edit their own records
  if (sess.role !== "admin" && existing.userId !== sess.id) {
    return res.status(403).json({ error: "Sin acceso a este registro" });
  }

  const { professionalId, fecha, diagnostico, resumenSesion, observaciones, recomendacionesHogar } = req.body;

  const updates: Record<string, any> = {};
  if (fecha !== undefined) updates.fecha = fecha;
  if (diagnostico !== undefined) updates.diagnostico = diagnostico;
  if (resumenSesion !== undefined) updates.resumenSesion = resumenSesion;
  if (observaciones !== undefined) updates.observaciones = observaciones;
  if (recomendacionesHogar !== undefined) updates.recomendacionesHogar = recomendacionesHogar;
  if (professionalId !== undefined) {
    updates.professionalId = professionalId;
    if (professionalId) {
      const [prof] = await db.select().from(professionalsTable).where(eq(professionalsTable.id, parseInt(professionalId)));
      updates.professionalName = prof?.name ?? null;
    }
  }

  const [record] = await db.update(registrosClinicosTable).set(updates).where(eq(registrosClinicosTable.id, id)).returning();
  if (!record) return res.status(404).json({ error: "Not found" });
  return res.json(await enrich(record));
});

router.delete("/registros-clinicos/:id", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(registrosClinicosTable).where(eq(registrosClinicosTable.id, id));
  if (!existing) return res.status(404).json({ error: "Not found" });

  // Access check: non-admin can only delete their own records
  if (sess.role !== "admin" && existing.userId !== sess.id) {
    return res.status(403).json({ error: "Sin acceso a este registro" });
  }

  await db.delete(registrosClinicosTable).where(eq(registrosClinicosTable.id, id));
  return res.status(204).send();
});

export default router;
