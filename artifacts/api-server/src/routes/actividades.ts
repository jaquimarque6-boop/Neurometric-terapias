import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { actividadesTable, goalLibraryTable } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { canAccessLibraryGoal } from "./access-policy";

const router: IRouter = Router();

async function linkedGoalAccess(goalLibraryId: number | null, userId: number, isAdmin: boolean, write: boolean) {
  // Activities have no owner of their own. Unlinked activities are shared/admin-managed.
  if (goalLibraryId === null) return { exists: true, allowed: isAdmin || !write };
  const [goal] = await db.select().from(goalLibraryTable).where(eq(goalLibraryTable.id, goalLibraryId));
  if (!goal) return { exists: false, allowed: false };
  return {
    exists: true,
    allowed: canAccessLibraryGoal(goal, { id: userId, role: isAdmin ? "admin" : "professional" }, write),
  };
}

router.get("/actividades", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  const { franjaEtaria, area, tipo, goalLibraryId } = req.query;

  // Push all filters into SQL so we never load the full table when a filter
  // (e.g. goalLibraryId) is provided. Same equality semantics as before; the
  // tipo ordering is preserved.
  const conditions = [];
  if (franjaEtaria) conditions.push(eq(actividadesTable.franjaEtaria, franjaEtaria as string));
  if (area) conditions.push(eq(actividadesTable.area, area as string));
  if (tipo) conditions.push(eq(actividadesTable.tipo, tipo as string));
  if (goalLibraryId) conditions.push(eq(actividadesTable.goalLibraryId, parseInt(goalLibraryId as string)));

  const activities = await db
    .select()
    .from(actividadesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(actividadesTable.tipo);

  const linkedIds = [...new Set(activities.map(a => a.goalLibraryId).filter((id): id is number => id !== null))];
  const access = new Map(await Promise.all(linkedIds.map(async id =>
    [id, await linkedGoalAccess(id, req.session.userId!, req.session.userRole === "admin", false)] as const
  )));
  return res.json(activities
    .filter(a => a.goalLibraryId === null || access.get(a.goalLibraryId)?.allowed)
    .map(a => ({ ...a, createdAt: a.createdAt.toISOString() })));
});

router.post("/actividades", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  const { titulo, descripcion, tipo, area, subarea, franjaEtaria, recursos, goalLibraryId, objetivoNombre } = req.body;
  if (!titulo) return res.status(400).json({ error: "titulo is required" });
  const linkedId = goalLibraryId == null || goalLibraryId === "" ? null : Number(goalLibraryId);
  if (linkedId !== null && (!Number.isInteger(linkedId) || linkedId <= 0)) {
    return res.status(400).json({ error: "goalLibraryId inválido" });
  }
  const access = await linkedGoalAccess(linkedId, req.session.userId, req.session.userRole === "admin", true);
  if (!access.exists) return res.status(404).json({ error: "Library goal not found" });
  if (!access.allowed) return res.status(403).json({ error: "Sin acceso a este objetivo" });

  const [act] = await db.insert(actividadesTable).values({
    titulo,
    descripcion: descripcion ?? null,
    tipo: tipo ?? "clinica",
    area: area ?? null,
    subarea: subarea ?? null,
    franjaEtaria: franjaEtaria ?? null,
    recursos: recursos ?? null,
    goalLibraryId: linkedId,
    objetivoNombre: objetivoNombre ?? null,
  }).returning();

  return res.status(201).json({ ...act, createdAt: act.createdAt.toISOString() });
});

router.patch("/actividades/:id", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(actividadesTable).where(eq(actividadesTable.id, id));
  if (!existing) return res.status(404).json({ error: "Activity not found" });
  const currentAccess = await linkedGoalAccess(existing.goalLibraryId, req.session.userId, req.session.userRole === "admin", true);
  if (!currentAccess.allowed) return res.status(403).json({ error: "Sin acceso a esta actividad" });

  const { titulo, descripcion, tipo, area, subarea, franjaEtaria, recursos, objetivoNombre, goalLibraryId } = req.body;
  if (goalLibraryId !== undefined) {
    const targetId = goalLibraryId === null || goalLibraryId === "" ? null : Number(goalLibraryId);
    if (targetId !== null && (!Number.isInteger(targetId) || targetId <= 0)) {
      return res.status(400).json({ error: "goalLibraryId inválido" });
    }
    const targetAccess = await linkedGoalAccess(targetId, req.session.userId, req.session.userRole === "admin", true);
    if (!targetAccess.exists) return res.status(404).json({ error: "Library goal not found" });
    if (!targetAccess.allowed) return res.status(403).json({ error: "Sin acceso al objetivo de destino" });
  }
  const updates: Record<string, any> = {};
  if (goalLibraryId !== undefined) updates.goalLibraryId = goalLibraryId === null || goalLibraryId === "" ? null : Number(goalLibraryId);
  if (titulo !== undefined) updates.titulo = titulo;
  if (descripcion !== undefined) updates.descripcion = descripcion;
  if (tipo !== undefined) updates.tipo = tipo;
  if (area !== undefined) updates.area = area;
  if (subarea !== undefined) updates.subarea = subarea;
  if (franjaEtaria !== undefined) updates.franjaEtaria = franjaEtaria;
  if (recursos !== undefined) updates.recursos = recursos;
  if (objetivoNombre !== undefined) updates.objetivoNombre = objetivoNombre;

  const [updated] = await db.update(actividadesTable).set(updates).where(eq(actividadesTable.id, id)).returning();
  return res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

router.delete("/actividades/:id", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(actividadesTable).where(eq(actividadesTable.id, id));
  if (!existing) return res.status(404).json({ error: "Activity not found" });
  const access = await linkedGoalAccess(existing.goalLibraryId, req.session.userId, req.session.userRole === "admin", true);
  if (!access.allowed) return res.status(403).json({ error: "Sin acceso a esta actividad" });
  await db.delete(actividadesTable).where(eq(actividadesTable.id, id));
  return res.status(204).send();
});

export default router;
