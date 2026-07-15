import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { gastosTable } from "@workspace/db/schema";
import { eq, and, SQL, like } from "drizzle-orm";

const router: IRouter = Router();

function getSessionUser(req: any): { id: number; role: string } | null {
  if (!req.session?.userId) return null;
  return {
    id: req.session.userId,
    role: req.session.userRole ?? "professional",
  };
}

function serializeGasto(g: typeof gastosTable.$inferSelect) {
  return {
    ...g,
    monto: String(g.monto),
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  };
}

function validGasto(fecha: unknown, monto: unknown): string | null {
  if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return "Fecha inválida (formato YYYY-MM-DD).";
  }
  const n = typeof monto === "number" ? monto : parseFloat(String(monto));
  if (!isFinite(n) || n <= 0) return "El monto debe ser un número mayor a 0.";
  return null;
}

// ─── GET /gastos?mes=YYYY-MM ─────────────────────────────────────────────────
router.get("/gastos", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });

    const { mes } = req.query as Record<string, string>;

    const conditions: SQL[] = [];
    if (sess.role !== "admin") conditions.push(eq(gastosTable.userId, sess.id));
    if (mes && /^\d{4}-\d{2}$/.test(mes)) conditions.push(like(gastosTable.fecha, `${mes}-%`));

    const rows = await db
      .select()
      .from(gastosTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(gastosTable.fecha);

    return res.json(rows.map(serializeGasto));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener gastos" });
  }
});

// ─── POST /gastos ────────────────────────────────────────────────────────────
router.post("/gastos", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });

    const { fecha, monto, observacion } = req.body;
    const err = validGasto(fecha, monto);
    if (err) return res.status(400).json({ error: err });

    const [inserted] = await db.insert(gastosTable).values({
      fecha,
      monto: String(parseFloat(String(monto))),
      observacion: typeof observacion === "string" && observacion.trim() ? observacion.trim() : null,
      userId: sess.id,
    }).returning();

    return res.status(201).json(serializeGasto(inserted));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al crear gasto" });
  }
});

// ─── PUT /gastos/:id ─────────────────────────────────────────────────────────
router.put("/gastos/:id", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });

    const id = parseInt(req.params.id);
    const [gasto] = await db.select().from(gastosTable).where(eq(gastosTable.id, id));
    if (!gasto) return res.status(404).json({ error: "Gasto no encontrado" });

    if (sess.role !== "admin" && gasto.userId !== sess.id) {
      return res.status(403).json({ error: "Sin acceso a este gasto" });
    }

    const body = req.body;
    const err = validGasto(body.fecha ?? gasto.fecha, body.monto ?? gasto.monto);
    if (err) return res.status(400).json({ error: err });

    const updates: Partial<typeof gastosTable.$inferInsert> = { updatedAt: new Date() };
    if (body.fecha !== undefined) updates.fecha = body.fecha;
    if (body.monto !== undefined) updates.monto = String(parseFloat(String(body.monto)));
    if (body.observacion !== undefined) {
      updates.observacion = typeof body.observacion === "string" && body.observacion.trim()
        ? body.observacion.trim()
        : null;
    }

    const [updated] = await db.update(gastosTable).set(updates).where(eq(gastosTable.id, id)).returning();
    return res.json(serializeGasto(updated));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al actualizar gasto" });
  }
});

// ─── DELETE /gastos/:id ──────────────────────────────────────────────────────
router.delete("/gastos/:id", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });

    const id = parseInt(req.params.id);
    const [gasto] = await db.select().from(gastosTable).where(eq(gastosTable.id, id));
    if (!gasto) return res.status(404).json({ error: "Gasto no encontrado" });

    if (sess.role !== "admin" && gasto.userId !== sess.id) {
      return res.status(403).json({ error: "Sin acceso a este gasto" });
    }

    await db.delete(gastosTable).where(eq(gastosTable.id, id));
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al eliminar gasto" });
  }
});

export default router;
