import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { goalsTable, patientsTable, goalProgressTable, actividadesTable, goalLibraryTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

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
  const { patientId, goalLibraryId, codigo, title, description, category, areaClinica, franjaEtaria, nivelDificultad, status, targetDate, fechaAsignacion, notas } = req.body;
  if (!patientId || !title || !category) return res.status(400).json({ error: "patientId, title and category are required" });
  const today = new Date().toISOString().split("T")[0];
  const [goal] = await db.insert(goalsTable).values({
    patientId: parseInt(patientId),
    goalLibraryId: goalLibraryId ? parseInt(goalLibraryId) : null,
    codigo: codigo ?? null,
    title,
    description: description ?? null,
    category,
    areaClinica: areaClinica ?? category,
    franjaEtaria: franjaEtaria ?? null,
    nivelDificultad: nivelDificultad ?? null,
    status: status ?? "activo",
    fechaAsignacion: fechaAsignacion ?? today,
    targetDate: targetDate ?? null,
    notas: notas ?? null,
  }).returning();
  res.status(201).json(await enrich(goal));
});

router.patch("/goals/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { codigo, title, description, category, areaClinica, franjaEtaria, nivelDificultad, status, targetDate, notas } = req.body;

  const [existing] = await db.select().from(goalsTable).where(eq(goalsTable.id, id));
  if (!existing) return res.status(404).json({ error: "Goal not found" });

  const updates: Record<string, any> = {};
  if (codigo !== undefined) updates.codigo = codigo;
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (category !== undefined) updates.category = category;
  if (areaClinica !== undefined) updates.areaClinica = areaClinica;
  if (franjaEtaria !== undefined) updates.franjaEtaria = franjaEtaria;
  if (nivelDificultad !== undefined) updates.nivelDificultad = nivelDificultad;
  if (status !== undefined) updates.status = status;
  if (targetDate !== undefined) updates.targetDate = targetDate;
  if (notas !== undefined) updates.notas = notas;

  const [goal] = await db.update(goalsTable).set(updates).where(eq(goalsTable.id, id)).returning();

  // Log status changes automatically
  if (status !== undefined && status !== existing.status) {
    await db.insert(goalProgressTable).values({
      goalId: id,
      nota: `Estado cambiado a "${status}"`,
      statusAnterior: existing.status,
      statusNuevo: status,
    });
  }

  res.json(await enrich(goal));
});

router.delete("/goals/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(goalProgressTable).where(eq(goalProgressTable.goalId, id));
  await db.delete(goalsTable).where(eq(goalsTable.id, id));
  res.status(204).send();
});

// ─── Progress history ─────────────────────────────────────────────────────────
router.get("/goals/:id/progress", async (req, res) => {
  const goalId = parseInt(req.params.id);
  const entries = await db.select().from(goalProgressTable)
    .where(eq(goalProgressTable.goalId, goalId))
    .orderBy(desc(goalProgressTable.createdAt));
  res.json(entries.map(e => ({ ...e, createdAt: e.createdAt.toISOString() })));
});

router.post("/goals/:id/progress", async (req, res) => {
  const goalId = parseInt(req.params.id);
  const { nota, statusNuevo, registroClinicoId } = req.body;

  const [existing] = await db.select().from(goalsTable).where(eq(goalsTable.id, goalId));
  if (!existing) return res.status(404).json({ error: "Goal not found" });

  const updates: Record<string, any> = {};
  if (statusNuevo && statusNuevo !== existing.status) updates.status = statusNuevo;
  if (nota) updates.notas = nota;

  let updated = existing;
  if (Object.keys(updates).length > 0) {
    const [g] = await db.update(goalsTable).set(updates).where(eq(goalsTable.id, goalId)).returning();
    updated = g;
  }

  const [entry] = await db.insert(goalProgressTable).values({
    goalId,
    nota: nota ?? null,
    statusAnterior: existing.status,
    statusNuevo: statusNuevo ?? existing.status,
    registroClinicoId: registroClinicoId ? parseInt(registroClinicoId) : null,
  }).returning();

  res.status(201).json({
    entry: { ...entry, createdAt: entry.createdAt.toISOString() },
    goal: await enrich(updated),
  });
});

// ─── Activities for a goal ────────────────────────────────────────────────────
router.get("/goals/:id/activities", async (req, res) => {
  const goalId = parseInt(req.params.id);
  const [goal] = await db.select().from(goalsTable).where(eq(goalsTable.id, goalId));
  if (!goal) return res.status(404).json({ error: "Goal not found" });

  let activities: any[] = [];
  let libraryEntry: any = null;

  if (goal.goalLibraryId) {
    activities = await db.select().from(actividadesTable)
      .where(eq(actividadesTable.goalLibraryId, goal.goalLibraryId))
      .orderBy(actividadesTable.tipo);

    const [entry] = await db.select().from(goalLibraryTable)
      .where(eq(goalLibraryTable.id, goal.goalLibraryId));
    if (entry) {
      libraryEntry = { ...entry, createdAt: entry.createdAt.toISOString() };
    }
  }

  res.json({
    activities: activities.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })),
    libraryEntry,
  });
});

export default router;
