import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { actividadesTable } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/actividades", async (req, res) => {
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

  res.json(activities.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })));
});

router.post("/actividades", async (req, res) => {
  const { titulo, descripcion, tipo, area, subarea, franjaEtaria, recursos, goalLibraryId, objetivoNombre } = req.body;
  if (!titulo) return res.status(400).json({ error: "titulo is required" });

  const [act] = await db.insert(actividadesTable).values({
    titulo,
    descripcion: descripcion ?? null,
    tipo: tipo ?? "clinica",
    area: area ?? null,
    subarea: subarea ?? null,
    franjaEtaria: franjaEtaria ?? null,
    recursos: recursos ?? null,
    goalLibraryId: goalLibraryId ? parseInt(goalLibraryId) : null,
    objetivoNombre: objetivoNombre ?? null,
  }).returning();

  return res.status(201).json({ ...act, createdAt: act.createdAt.toISOString() });
});

router.patch("/actividades/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(actividadesTable).where(eq(actividadesTable.id, id));
  if (!existing) return res.status(404).json({ error: "Activity not found" });

  const { titulo, descripcion, tipo, area, subarea, franjaEtaria, recursos, objetivoNombre } = req.body;
  const updates: Record<string, any> = {};
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
  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(actividadesTable).where(eq(actividadesTable.id, id));
  if (!existing) return res.status(404).json({ error: "Activity not found" });
  await db.delete(actividadesTable).where(eq(actividadesTable.id, id));
  return res.status(204).send();
});

export default router;
