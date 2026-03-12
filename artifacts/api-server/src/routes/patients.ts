import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { patientsTable } from "@workspace/db/schema";
import { CreatePatientBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/patients", async (_req, res) => {
  const patients = await db.select().from(patientsTable).orderBy(patientsTable.createdAt);
  res.json(patients.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  })));
});

router.post("/patients", async (req, res) => {
  const body = CreatePatientBody.parse(req.body);
  const [patient] = await db.insert(patientsTable).values(body).returning();
  res.status(201).json({ ...patient, createdAt: patient.createdAt.toISOString() });
});

router.get("/patients/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
  if (!patient) return res.status(404).json({ error: "Patient not found" });
  res.json({ ...patient, createdAt: patient.createdAt.toISOString() });
});

export default router;
