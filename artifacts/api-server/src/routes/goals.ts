import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { goalsTable, patientsTable, goalProgressTable, actividadesTable, goalLibraryTable } from "@workspace/db/schema";
import { eq, desc, inArray } from "drizzle-orm";

const router: IRouter = Router();

function getSessionUser(req: any): { id: number; role: string } | null {
  if (!req.session?.userId) return null;
  return {
    id: req.session.userId,
    role: req.session.userRole ?? "professional",
  };
}

async function enrich(g: typeof goalsTable.$inferSelect) {
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, g.patientId));
  return { ...g, patientName: patient?.name ?? "", createdAt: g.createdAt.toISOString() };
}

// Resolve the list of patientIds a user may access
async function accessiblePatientIds(sess: { id: number; role: string }): Promise<number[] | null> {
  if (sess.role === "admin") return null; // null = unrestricted
  const patients = await db
    .select({ id: patientsTable.id })
    .from(patientsTable)
    .where(eq(patientsTable.assignedProfessionalId, sess.id));
  return patients.map(p => p.id);
}

router.get("/goals", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const patientIdParam = req.query.patientId ? parseInt(req.query.patientId as string) : null;
  const allowed = await accessiblePatientIds(sess);

  let goals = await db.select().from(goalsTable).orderBy(goalsTable.createdAt);

  // Scope to professional's own patients
  if (allowed !== null) {
    goals = goals.filter(g => allowed.includes(g.patientId));
  }

  // Further narrow by specific patient if requested
  if (patientIdParam) {
    // Check access: professional must own this patient
    if (allowed !== null && !allowed.includes(patientIdParam)) {
      return res.status(403).json({ error: "Sin acceso a este paciente" });
    }
    goals = goals.filter(g => g.patientId === patientIdParam);
  }

  const enriched = await Promise.all(goals.map(enrich));
  res.json(enriched);
});

router.post("/goals", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const { patientId, goalLibraryId, codigo, title, description, category, areaClinica, franjaEtaria, nivelDificultad, status, targetDate, fechaAsignacion, notas } = req.body;
  if (!patientId || !title || !category) return res.status(400).json({ error: "patientId, title and category are required" });

  // Access check
  const allowed = await accessiblePatientIds(sess);
  if (allowed !== null && !allowed.includes(parseInt(patientId))) {
    return res.status(403).json({ error: "Sin acceso a este paciente" });
  }

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
  return res.status(201).json(await enrich(goal));
});

router.patch("/goals/:id", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const id = parseInt(req.params.id);
  const { codigo, title, description, category, areaClinica, franjaEtaria, nivelDificultad, status, targetDate, notas, progressPct } = req.body;

  const [existing] = await db.select().from(goalsTable).where(eq(goalsTable.id, id));
  if (!existing) return res.status(404).json({ error: "Goal not found" });

  // Access check
  const allowed = await accessiblePatientIds(sess);
  if (allowed !== null && !allowed.includes(existing.patientId)) {
    return res.status(403).json({ error: "Sin acceso a este objetivo" });
  }

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
  if (progressPct !== undefined) updates.progressPct = progressPct;

  const [goal] = await db.update(goalsTable).set(updates).where(eq(goalsTable.id, id)).returning();

  if (status !== undefined && status !== existing.status) {
    await db.insert(goalProgressTable).values({
      goalId: id,
      nota: `Estado cambiado a "${status}"`,
      statusAnterior: existing.status,
      statusNuevo: status,
      progressPct: progressPct ?? null,
    });
  }

  return res.json(await enrich(goal));
});

router.delete("/goals/:id", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(goalsTable).where(eq(goalsTable.id, id));
  if (!existing) return res.status(404).json({ error: "Goal not found" });

  // Access check
  const allowed = await accessiblePatientIds(sess);
  if (allowed !== null && !allowed.includes(existing.patientId)) {
    return res.status(403).json({ error: "Sin acceso a este objetivo" });
  }

  await db.delete(goalProgressTable).where(eq(goalProgressTable.goalId, id));
  await db.delete(goalsTable).where(eq(goalsTable.id, id));
  res.status(204).send();
});

// ─── Progress history ──────────────────────────────────────────────────────────
router.get("/goals/:id/progress", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const goalId = parseInt(req.params.id);

  const [goal] = await db.select().from(goalsTable).where(eq(goalsTable.id, goalId));
  if (!goal) return res.status(404).json({ error: "Goal not found" });

  const allowed = await accessiblePatientIds(sess);
  if (allowed !== null && !allowed.includes(goal.patientId)) {
    return res.status(403).json({ error: "Sin acceso a este objetivo" });
  }

  const entries = await db.select().from(goalProgressTable)
    .where(eq(goalProgressTable.goalId, goalId))
    .orderBy(desc(goalProgressTable.createdAt));
  res.json(entries.map(e => ({ ...e, createdAt: e.createdAt.toISOString() })));
});

router.post("/goals/:id/progress", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const goalId = parseInt(req.params.id);
  const { nota, statusNuevo, registroClinicoId, progressPct, intentos, correctas } = req.body;

  const [existing] = await db.select().from(goalsTable).where(eq(goalsTable.id, goalId));
  if (!existing) return res.status(404).json({ error: "Goal not found" });

  const allowed = await accessiblePatientIds(sess);
  if (allowed !== null && !allowed.includes(existing.patientId)) {
    return res.status(403).json({ error: "Sin acceso a este objetivo" });
  }

  const updates: Record<string, any> = {};
  if (statusNuevo && statusNuevo !== existing.status) updates.status = statusNuevo;
  if (nota) updates.notas = nota;
  if (progressPct !== undefined && progressPct !== null) updates.progressPct = progressPct;

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
    progressPct: progressPct !== undefined ? progressPct : null,
    intentos: intentos !== undefined ? parseInt(intentos) : null,
    correctas: correctas !== undefined ? parseInt(correctas) : null,
    registroClinicoId: registroClinicoId ? parseInt(registroClinicoId) : null,
  }).returning();

  return res.status(201).json({
    entry: { ...entry, createdAt: entry.createdAt.toISOString() },
    goal: await enrich(updated),
  });
});

// ─── Activities for a goal ─────────────────────────────────────────────────────
router.get("/goals/:id/activities", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const goalId = parseInt(req.params.id);
  const [goal] = await db.select().from(goalsTable).where(eq(goalsTable.id, goalId));
  if (!goal) return res.status(404).json({ error: "Goal not found" });

  const allowed = await accessiblePatientIds(sess);
  if (allowed !== null && !allowed.includes(goal.patientId)) {
    return res.status(403).json({ error: "Sin acceso a este objetivo" });
  }

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

  return res.json({
    activities: activities.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })),
    libraryEntry,
  });
});

export default router;
