import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { actividadesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/actividades", async (req, res) => {
  let activities = await db.select().from(actividadesTable).orderBy(actividadesTable.tipo);

  const { franjaEtaria, area, tipo, goalLibraryId } = req.query;
  if (franjaEtaria) activities = activities.filter(a => a.franjaEtaria === franjaEtaria);
  if (area) activities = activities.filter(a => a.area === area);
  if (tipo) activities = activities.filter(a => a.tipo === tipo);
  if (goalLibraryId) activities = activities.filter(a => a.goalLibraryId === parseInt(goalLibraryId as string));

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

  res.status(201).json({ ...act, createdAt: act.createdAt.toISOString() });
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
  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

router.delete("/actividades/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(actividadesTable).where(eq(actividadesTable.id, id));
  if (!existing) return res.status(404).json({ error: "Activity not found" });
  await db.delete(actividadesTable).where(eq(actividadesTable.id, id));
  res.status(204).send();
});

export default router;
