import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { pagosTable } from "@workspace/db/schema";
import { patientsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

function getSessionUser(req: any): { id: number; role: string } | null {
  if (!req.session?.userId) return null;
  return {
    id: req.session.userId,
    role: req.session.userRole ?? "professional",
  };
}

function serializePago(p: typeof pagosTable.$inferSelect) {
  return {
    ...p,
    monto: String(p.monto),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

// ─── GET /pagos ───────────────────────────────────────────────────────────────
router.get("/pagos", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });

    const { mes, estado, tipo, patientId } = req.query as Record<string, string>;

    let rows = await db.select().from(pagosTable).orderBy(pagosTable.fecha);

    if (sess.role !== "admin") {
      rows = rows.filter(p => p.userId === sess.id);
    }

    if (mes) rows = rows.filter(p => p.mes === mes);
    if (estado) rows = rows.filter(p => p.estado === estado);
    if (tipo) rows = rows.filter(p => p.tipo === tipo);
    if (patientId) rows = rows.filter(p => p.patientId === parseInt(patientId));

    const patients = await db.select({ id: patientsTable.id, name: patientsTable.name }).from(patientsTable);
    const patientMap = new Map(patients.map(p => [p.id, p.name]));

    return res.json(rows.map(p => ({ ...serializePago(p), patientName: patientMap.get(p.patientId) ?? "—" })));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener pagos" });
  }
});

// ─── POST /pagos ──────────────────────────────────────────────────────────────
router.post("/pagos", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });

    const { patientId, monto, mes, tipo = "particular", nombreObraSocial, fecha, estado = "pendiente", notas } = req.body;

    if (!patientId || monto === undefined || !mes || !fecha) {
      return res.status(400).json({ error: "Faltan campos requeridos: patientId, monto, mes, fecha" });
    }

    const [inserted] = await db.insert(pagosTable).values({
      patientId: parseInt(patientId),
      monto: String(monto),
      mes,
      tipo,
      nombreObraSocial: nombreObraSocial ?? null,
      fecha,
      estado,
      notas: notas ?? null,
      userId: sess.id,
    }).returning();

    return res.status(201).json(serializePago(inserted));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al crear pago" });
  }
});

// ─── PUT /pagos/:id ───────────────────────────────────────────────────────────
router.put("/pagos/:id", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });

    const id = parseInt(req.params.id);
    const [pago] = await db.select().from(pagosTable).where(eq(pagosTable.id, id));
    if (!pago) return res.status(404).json({ error: "Pago no encontrado" });

    if (sess.role !== "admin" && pago.userId !== sess.id) {
      return res.status(403).json({ error: "Sin acceso a este pago" });
    }

    const updates: Partial<typeof pagosTable.$inferInsert> = { updatedAt: new Date() };
    const body = req.body;

    if (body.patientId !== undefined) updates.patientId = parseInt(body.patientId);
    if (body.monto !== undefined) updates.monto = String(body.monto);
    if (body.mes !== undefined) updates.mes = body.mes;
    if (body.tipo !== undefined) updates.tipo = body.tipo;
    if (body.nombreObraSocial !== undefined) updates.nombreObraSocial = body.nombreObraSocial || null;
    if (body.fecha !== undefined) updates.fecha = body.fecha;
    if (body.estado !== undefined) updates.estado = body.estado;
    if (body.notas !== undefined) updates.notas = body.notas || null;

    const [updated] = await db.update(pagosTable).set(updates).where(eq(pagosTable.id, id)).returning();
    return res.json(serializePago(updated));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al actualizar pago" });
  }
});

// ─── DELETE /pagos/:id ────────────────────────────────────────────────────────
router.delete("/pagos/:id", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });

    const id = parseInt(req.params.id);
    const [pago] = await db.select().from(pagosTable).where(eq(pagosTable.id, id));
    if (!pago) return res.status(404).json({ error: "Pago no encontrado" });

    if (sess.role !== "admin" && pago.userId !== sess.id) {
      return res.status(403).json({ error: "Sin acceso a este pago" });
    }

    await db.delete(pagosTable).where(eq(pagosTable.id, id));
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al eliminar pago" });
  }
});

export default router;
