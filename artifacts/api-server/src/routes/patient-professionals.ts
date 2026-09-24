import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { patientProfessionalsTable, patientsTable, professionalsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

async function enrich(row: typeof patientProfessionalsTable.$inferSelect) {
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, row.patientId));
  const [prof] = await db.select().from(professionalsTable).where(eq(professionalsTable.id, row.professionalId));
  return {
    ...row,
    patientName: patient?.name ?? null,
    professionalName: prof?.name ?? null,
    professionalSpecialty: prof?.specialty ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

async function canAccessPatient(req: any, patientId: number): Promise<boolean> {
  if (req.session.userRole === "admin") return true;
  const [patient] = await db
    .select({ assignedProfessionalId: patientsTable.assignedProfessionalId })
    .from(patientsTable)
    .where(eq(patientsTable.id, patientId));
  return patient?.assignedProfessionalId === req.session.userId;
}

router.get("/patient-professionals", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });

  const patientId = req.query.patientId ? parseInt(req.query.patientId as string) : null;
  const professionalId = req.query.professionalId ? parseInt(req.query.professionalId as string) : null;
  if (patientId !== null && Number.isNaN(patientId)) {
    return res.status(400).json({ error: "patientId inválido" });
  }
  if (professionalId !== null && Number.isNaN(professionalId)) {
    return res.status(400).json({ error: "professionalId inválido" });
  }

  if (patientId !== null && !(await canAccessPatient(req, patientId))) {
    const [patient] = await db.select({ id: patientsTable.id }).from(patientsTable).where(eq(patientsTable.id, patientId));
    return res.status(patient ? 403 : 404).json({
      error: patient ? "Sin acceso a este paciente" : "Paciente no encontrado",
    });
  }

  let rows = await db.select().from(patientProfessionalsTable);
  if (patientId) rows = rows.filter(r => r.patientId === patientId);
  if (professionalId) rows = rows.filter(r => r.professionalId === professionalId);

  if (req.session.userRole !== "admin" && patientId === null) {
    const assignedPatients = await db
      .select({ id: patientsTable.id })
      .from(patientsTable)
      .where(eq(patientsTable.assignedProfessionalId, req.session.userId));
    const allowedPatientIds = new Set(assignedPatients.map((p) => p.id));
    rows = rows.filter((row) => allowedPatientIds.has(row.patientId));
  }

  const enriched = await Promise.all(rows.map(enrich));
  return res.json(enriched);
});

router.post("/patient-professionals", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });

  const { patientId, professionalId } = req.body;
  if (!patientId || !professionalId) return res.status(400).json({ error: "patientId and professionalId are required" });
  const parsedPatientId = parseInt(patientId);
  const parsedProfessionalId = parseInt(professionalId);
  if (Number.isNaN(parsedPatientId) || Number.isNaN(parsedProfessionalId)) {
    return res.status(400).json({ error: "patientId y professionalId deben ser válidos" });
  }
  if (!(await canAccessPatient(req, parsedPatientId))) {
    const [patient] = await db.select({ id: patientsTable.id }).from(patientsTable).where(eq(patientsTable.id, parsedPatientId));
    return res.status(patient ? 403 : 404).json({
      error: patient ? "Sin acceso a este paciente" : "Paciente no encontrado",
    });
  }

  const existing = await db.select().from(patientProfessionalsTable)
    .where(and(
      eq(patientProfessionalsTable.patientId, parsedPatientId),
      eq(patientProfessionalsTable.professionalId, parsedProfessionalId)
    ));
  if (existing.length) return res.status(409).json({ error: "Already assigned" });

  const [row] = await db.insert(patientProfessionalsTable).values({
    patientId: parsedPatientId,
    professionalId: parsedProfessionalId,
  }).returning();
  return res.status(201).json(await enrich(row));
});

router.delete("/patient-professionals/:id", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });

  const id = parseInt(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "ID inválido" });
  const [row] = await db.select().from(patientProfessionalsTable).where(eq(patientProfessionalsTable.id, id));
  if (!row) return res.status(404).json({ error: "Relación no encontrada" });
  if (!(await canAccessPatient(req, row.patientId))) {
    return res.status(403).json({ error: "Sin acceso a este paciente" });
  }
  await db.delete(patientProfessionalsTable).where(eq(patientProfessionalsTable.id, id));
  return res.status(204).send();
});

export default router;
