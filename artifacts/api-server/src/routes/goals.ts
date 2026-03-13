import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { goalsTable, patientsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

async function enrich(g: typeof goalsTable.$inferSelect) {
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, g.patientId));
  return { ...g, patientName: patient?.name ?? "", createdAt: g.createdAt.toISOString() };
}

router.get("/goals", async (req, res) => {
  const patientId = req.query.patientId ? parseInt(req.query.patientId as string) : null;
  let goals = await db.select().from(goalsTable).orderBy(goalsTable.createdAt);
  if (patientId) goals = goals.filter(g => g.patientId === patientId);
  const enriched = await Promise.all(goals.map(enrich));
  res.json(enriched);
});

router.post("/goals", async (req, res) => {
  const { patientId, codigo, title, description, category, franjaEtaria, status, targetDate } = req.body;
  if (!patientId || !title || !category) return res.status(400).json({ error: "patientId, title and category are required" });
  const [goal] = await db.insert(goalsTable).values({
    patientId: parseInt(patientId),
    codigo: codigo ?? null,
    title,
    description: description ?? null,
    category,
    franjaEtaria: franjaEtaria ?? null,
    status: status ?? "activo",
    targetDate: targetDate ?? null,
  }).returning();
  res.status(201).json(await enrich(goal));
});

router.patch("/goals/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { codigo, title, description, category, franjaEtaria, status, targetDate } = req.body;
  const updates: Record<string, any> = {};
  if (codigo !== undefined) updates.codigo = codigo;
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (category !== undefined) updates.category = category;
  if (franjaEtaria !== undefined) updates.franjaEtaria = franjaEtaria;
  if (status !== undefined) updates.status = status;
  if (targetDate !== undefined) updates.targetDate = targetDate;
  const [goal] = await db.update(goalsTable).set(updates).where(eq(goalsTable.id, id)).returning();
  if (!goal) return res.status(404).json({ error: "Goal not found" });
  res.json(await enrich(goal));
});

router.delete("/goals/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(goalsTable).where(eq(goalsTable.id, id));
  res.status(204).send();
});

export default router;
