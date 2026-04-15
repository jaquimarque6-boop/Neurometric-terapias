import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { registrosTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/sessions", async (_req, res) => {
  const registros = await db.select().from(registrosTable).orderBy(registrosTable.fecha);
  res.json(registros.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.get("/registros", async (_req, res) => {
  const registros = await db.select().from(registrosTable).orderBy(registrosTable.fecha);
  res.json(registros.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.get("/registros/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [registro] = await db.select().from(registrosTable).where(eq(registrosTable.id, id));
  if (!registro) return res.status(404).json({ error: "Registro not found" });
  return res.json({ ...registro, createdAt: registro.createdAt.toISOString() });
});

export default router;
