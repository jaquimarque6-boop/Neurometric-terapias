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

router.get("/patient-professionals", async (req, res) => {
  const patientId = req.query.patientId ? parseInt(req.query.patientId as string) : null;
  const professionalId = req.query.professionalId ? parseInt(req.query.professionalId as string) : null;

  let rows = await db.select().from(patientProfessionalsTable);
  if (patientId) rows = rows.filter(r => r.patientId === patientId);
  if (professionalId) rows = rows.filter(r => r.professionalId === professionalId);

  const enriched = await Promise.all(rows.map(enrich));
  res.json(enriched);
});

router.post("/patient-professionals", async (req, res) => {
  const { patientId, professionalId } = req.body;
  if (!patientId || !professionalId) return res.status(400).json({ error: "patientId and professionalId are required" });

  const existing = await db.select().from(patientProfessionalsTable)
    .where(and(
      eq(patientProfessionalsTable.patientId, parseInt(patientId)),
      eq(patientProfessionalsTable.professionalId, parseInt(professionalId))
    ));
  if (existing.length) return res.status(409).json({ error: "Already assigned" });

  const [row] = await db.insert(patientProfessionalsTable).values({
    patientId: parseInt(patientId),
    professionalId: parseInt(professionalId),
  }).returning();
  res.status(201).json(await enrich(row));
});

router.delete("/patient-professionals/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(patientProfessionalsTable).where(eq(patientProfessionalsTable.id, id));
  res.status(204).send();
});

export default router;
