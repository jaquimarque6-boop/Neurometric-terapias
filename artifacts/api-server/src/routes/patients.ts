import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { patientsTable, registrosTable } from "@workspace/db/schema";
import { eq, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/patients", async (_req, res) => {
  const patients = await db.select().from(patientsTable).orderBy(patientsTable.name);
  const withCounts = await Promise.all(patients.map(async p => {
    const [{ value }] = await db.select({ value: count() }).from(registrosTable).where(eq(registrosTable.patientId, p.id));
    return { ...p, totalRegistros: Number(value), createdAt: p.createdAt.toISOString() };
  }));
  res.json(withCounts);
});

router.post("/patients", async (req, res) => {
  const body = req.body;
  const [patient] = await db.insert(patientsTable).values({
    name: body.name,
    age: body.age ?? null,
    diagnosis: body.diagnosis ?? null,
    profesionalNombre: body.profesionalNombre ?? null,
    franjaEtaria: body.franjaEtaria ?? null,
    fechaInicio: body.fechaInicio ?? null,
  }).returning();
  res.status(201).json({ ...patient, totalRegistros: 0, createdAt: patient.createdAt.toISOString() });
});

router.get("/patients/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
  if (!patient) return res.status(404).json({ error: "Patient not found" });
  const [{ value }] = await db.select({ value: count() }).from(registrosTable).where(eq(registrosTable.patientId, id));
  res.json({ ...patient, totalRegistros: Number(value), createdAt: patient.createdAt.toISOString() });
});

router.put("/patients/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
  if (!existing) return res.status(404).json({ error: "Patient not found" });
  const body = req.body;
  const [updated] = await db.update(patientsTable).set({
    name: body.name ?? existing.name,
    age: body.age ?? existing.age,
    diagnosis: body.diagnosis ?? existing.diagnosis,
    profesionalNombre: body.profesionalNombre ?? existing.profesionalNombre,
    franjaEtaria: body.franjaEtaria ?? existing.franjaEtaria,
    fechaInicio: body.fechaInicio ?? existing.fechaInicio,
  }).where(eq(patientsTable.id, id)).returning();
  const [{ value }] = await db.select({ value: count() }).from(registrosTable).where(eq(registrosTable.patientId, id));
  res.json({ ...updated, totalRegistros: Number(value), createdAt: updated.createdAt.toISOString() });
});

export default router;
