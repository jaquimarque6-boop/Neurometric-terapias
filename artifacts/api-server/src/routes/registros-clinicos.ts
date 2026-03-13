import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { registrosClinicosTable, patientsTable, professionalsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

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
  const patientId = req.query.patientId ? parseInt(req.query.patientId as string) : null;
  let records = await db.select().from(registrosClinicosTable).orderBy(registrosClinicosTable.fecha);
  if (patientId) records = records.filter(r => r.patientId === patientId);
  const enriched = await Promise.all(records.map(enrich));
  res.json(enriched);
});

router.post("/registros-clinicos", async (req, res) => {
  const { patientId, professionalId, fecha, resumenSesion, observaciones, recomendacionesHogar } = req.body;
  if (!patientId || !fecha) return res.status(400).json({ error: "patientId and fecha are required" });

  let patientName: string | null = null;
  let professionalName: string | null = null;

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, parseInt(patientId)));
  patientName = patient?.name ?? null;

  if (professionalId) {
    const [prof] = await db.select().from(professionalsTable).where(eq(professionalsTable.id, parseInt(professionalId)));
    professionalName = prof?.name ?? null;
  }

  const [record] = await db.insert(registrosClinicosTable).values({
    patientId: parseInt(patientId),
    patientName,
    professionalId: professionalId ? parseInt(professionalId) : null,
    professionalName,
    fecha,
    resumenSesion: resumenSesion ?? null,
    observaciones: observaciones ?? null,
    recomendacionesHogar: recomendacionesHogar ?? null,
  }).returning();

  res.status(201).json({ ...record, createdAt: record.createdAt.toISOString() });
});

router.get("/registros-clinicos/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [record] = await db.select().from(registrosClinicosTable).where(eq(registrosClinicosTable.id, id));
  if (!record) return res.status(404).json({ error: "Not found" });
  res.json(await enrich(record));
});

router.patch("/registros-clinicos/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { professionalId, fecha, resumenSesion, observaciones, recomendacionesHogar } = req.body;

  const updates: Record<string, any> = {};
  if (fecha !== undefined) updates.fecha = fecha;
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
  res.json(await enrich(record));
});

router.delete("/registros-clinicos/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(registrosClinicosTable).where(eq(registrosClinicosTable.id, id));
  res.status(204).send();
});

export default router;
