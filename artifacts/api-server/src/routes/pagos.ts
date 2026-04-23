import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { pagosTable, patientsTable } from "@workspace/db/schema";
import { eq, and, SQL } from "drizzle-orm";

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

    const { mes, tipo, patientId } = req.query as Record<string, string>;

    // Build WHERE conditions at the SQL level — no JS filtering
    const conditions: SQL[] = [];
    if (sess.role !== "admin") conditions.push(eq(pagosTable.userId, sess.id));
    if (mes) conditions.push(eq(pagosTable.mes, mes));
    if (tipo) conditions.push(eq(pagosTable.tipo, tipo));
    if (patientId) conditions.push(eq(pagosTable.patientId, parseInt(patientId)));

    // Single query with LEFT JOIN for patient name
    const rows = await db
      .select({
        id: pagosTable.id,
        patientId: pagosTable.patientId,
        patientName: patientsTable.name,
        monto: pagosTable.monto,
        mes: pagosTable.mes,
        tipo: pagosTable.tipo,
        nombreObraSocial: pagosTable.nombreObraSocial,
        fecha: pagosTable.fecha,
        estado: pagosTable.estado,
        notas: pagosTable.notas,
        userId: pagosTable.userId,
        createdAt: pagosTable.createdAt,
        updatedAt: pagosTable.updatedAt,
      })
      .from(pagosTable)
      .leftJoin(patientsTable, eq(pagosTable.patientId, patientsTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(pagosTable.fecha);

    return res.json(rows.map(p => ({
      ...p,
      patientName: p.patientName ?? "—",
      monto: String(p.monto),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })));
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

    const { patientId, monto, mes, tipo = "particular", nombreObraSocial, fecha, notas } = req.body;

    if (!patientId || monto === undefined || !mes || !fecha) {
      return res.status(400).json({ error: "Faltan campos requeridos: patientId, monto, mes, fecha" });
    }

    const pid = parseInt(patientId);
    const [[inserted], [patient]] = await Promise.all([
      db.insert(pagosTable).values({
        patientId: pid,
        monto: String(monto),
        mes,
        tipo,
        nombreObraSocial: nombreObraSocial ?? null,
        fecha,
        estado: "pagado",
        notas: notas ?? null,
        userId: sess.id,
      }).returning(),
      db.select({ name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, pid)),
    ]);

    return res.status(201).json({ ...serializePago(inserted), patientName: patient?.name ?? "—" });
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
    if (body.notas !== undefined) updates.notas = body.notas || null;

    const [[updated], [patient]] = await Promise.all([
      db.update(pagosTable).set(updates).where(eq(pagosTable.id, id)).returning(),
      db.select({ name: patientsTable.name }).from(patientsTable)
        .where(eq(patientsTable.id, updates.patientId ?? pago.patientId)),
    ]);
    return res.json({ ...serializePago(updated), patientName: patient?.name ?? "—" });
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
