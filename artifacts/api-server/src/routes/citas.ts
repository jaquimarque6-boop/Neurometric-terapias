import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { citasTable } from "@workspace/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

function getSessionUser(req: any): { id: number; role: string } | null {
  if (!req.session?.userId) return null;
  return {
    id: req.session.userId,
    role: req.session.userRole ?? "professional",
  };
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function generateOccurrences(base: {
  titulo: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tipo: string;
  status: string;
  notas?: string | null;
  patientId?: number | null;
  professionalId?: number | null;
  repetirHasta?: string | null;
  userId?: number | null;
}, serieId: string) {
  const occurrences: typeof base[] = [];
  let current = base.fecha;
  const limit = base.repetirHasta ?? addDays(base.fecha, 365);
  let count = 0;

  while (current <= limit && count < 104) {
    occurrences.push({ ...base, fecha: current });
    current = addDays(current, 7);
    count++;
  }

  return occurrences.map(o => ({ ...o, serieId, repetirSemanal: true }));
}

// ─── GET /citas ───────────────────────────────────────────────────────────────
router.get("/citas", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });

    const { start, end, patientId } = req.query as Record<string, string>;

    const conditions = [];

    // Role-based isolation: professionals see only their own citas (by userId).
    // Same ownership rule as before — just pushed into the SQL WHERE.
    if (sess.role !== "admin") {
      conditions.push(eq(citasTable.userId, sess.id));
    }
    // Filter by date range in SQL (fecha is an ISO yyyy-MM-dd text column, so
    // gte/lte give the same lexicographic comparison the JS filter did).
    if (start && end) {
      conditions.push(gte(citasTable.fecha, start), lte(citasTable.fecha, end));
    }
    if (patientId) {
      conditions.push(eq(citasTable.patientId, parseInt(patientId)));
    }

    const rows = await db
      .select()
      .from(citasTable)
      .where(conditions.length ? and(...conditions) : undefined);

    return res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener citas" });
  }
});

// ─── POST /citas ──────────────────────────────────────────────────────────────
router.post("/citas", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });

    const {
      titulo, fecha, horaInicio, horaFin, tipo = "sesion", status = "programada",
      notas, patientId, repetirSemanal, repetirHasta,
    } = req.body;

    // professionalId stored for display purposes only; ownership is via userId
    const professionalId = req.body.professionalId ?? null;

    if (!titulo || !fecha || !horaInicio || !horaFin) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const base = {
      titulo,
      fecha,
      horaInicio,
      horaFin,
      tipo,
      status,
      notas: notas ?? null,
      patientId: patientId ?? null,
      professionalId: professionalId !== null && professionalId !== undefined
        ? parseInt(professionalId)
        : null,
      repetirHasta: repetirHasta ?? null,
      userId: sess.id,
    };

    if (repetirSemanal) {
      const serieId = randomUUID();
      const occurrences = generateOccurrences(base, serieId);
      const inserted = await db.insert(citasTable).values(occurrences).returning();
      return res.status(201).json(inserted.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
    } else {
      const [inserted] = await db.insert(citasTable).values({ ...base, repetirSemanal: false, serieId: null }).returning();
      return res.status(201).json({ ...inserted, createdAt: inserted.createdAt.toISOString() });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al crear cita" });
  }
});

// ─── PUT /citas/:id ───────────────────────────────────────────────────────────
router.put("/citas/:id", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });

    const id = parseInt(req.params.id);
    const { scope = "solo", titulo, horaInicio, horaFin, tipo, notas, status, fecha, asistencia } = req.body;

    const [cita] = await db.select().from(citasTable).where(eq(citasTable.id, id));
    if (!cita) return res.status(404).json({ error: "Cita no encontrada" });

    // Access check: professionals can only edit their own citas
    if (sess.role !== "admin" && cita.userId !== sess.id) {
      return res.status(403).json({ error: "Sin acceso a esta cita" });
    }

    const updates: Partial<typeof citasTable.$inferInsert> = {};
    if (titulo !== undefined) updates.titulo = titulo;
    if (horaInicio !== undefined) updates.horaInicio = horaInicio;
    if (horaFin !== undefined) updates.horaFin = horaFin;
    if (tipo !== undefined) updates.tipo = tipo;
    if (notas !== undefined) updates.notas = notas;
    if (status !== undefined) updates.status = status;
    if (fecha !== undefined) updates.fecha = fecha;
    if (asistencia !== undefined && ["pendiente", "asistio", "ausente", "reprogramada"].includes(asistencia)) {
      updates.asistencia = asistencia;
    }

    // Sin cambios válidos: devolver la cita tal cual (evita un UPDATE sin SET).
    if (Object.keys(updates).length === 0) {
      return res.json({ ...cita, createdAt: cita.createdAt.toISOString() });
    }

    if (scope === "solo") {
      const [updated] = await db.update(citasTable).set(updates).where(eq(citasTable.id, id)).returning();
      return res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
    }

    if (scope === "siguientes" && cita.serieId) {
      const newSerieId = randomUUID();
      const allInSerie = await db.select().from(citasTable).where(eq(citasTable.serieId, cita.serieId));
      const following = allInSerie.filter(c => c.fecha >= cita.fecha);
      for (const c of following) {
        await db.update(citasTable).set({ ...updates, serieId: newSerieId }).where(eq(citasTable.id, c.id));
      }
      return res.json({ ok: true, updated: following.length });
    }

    if (scope === "serie" && cita.serieId) {
      const allInSerie = await db.select().from(citasTable).where(eq(citasTable.serieId, cita.serieId));
      for (const c of allInSerie) {
        await db.update(citasTable).set(updates).where(eq(citasTable.id, c.id));
      }
      return res.json({ ok: true, updated: allInSerie.length });
    }

    const [updated] = await db.update(citasTable).set(updates).where(eq(citasTable.id, id)).returning();
    return res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al actualizar cita" });
  }
});

// ─── DELETE /citas/:id ────────────────────────────────────────────────────────
router.delete("/citas/:id", async (req, res) => {
  try {
    const sess = getSessionUser(req);
    if (!sess) return res.status(401).json({ error: "No autenticado" });

    const id = parseInt(req.params.id);
    const { scope = "solo" } = req.query as Record<string, string>;

    const [cita] = await db.select().from(citasTable).where(eq(citasTable.id, id));
    if (!cita) return res.status(404).json({ error: "Cita no encontrada" });

    // Access check: professionals can only cancel their own citas
    if (sess.role !== "admin" && cita.userId !== sess.id) {
      return res.status(403).json({ error: "Sin acceso a esta cita" });
    }

    if (scope === "serie" && cita.serieId) {
      await db.update(citasTable).set({ status: "cancelada" }).where(eq(citasTable.serieId, cita.serieId));
      return res.json({ ok: true, scope: "serie" });
    }

    if (scope === "siguientes" && cita.serieId) {
      const allInSerie = await db.select().from(citasTable).where(eq(citasTable.serieId, cita.serieId));
      const following = allInSerie.filter(c => c.fecha >= cita.fecha);
      for (const c of following) {
        await db.update(citasTable).set({ status: "cancelada" }).where(eq(citasTable.id, c.id));
      }
      return res.json({ ok: true, scope: "siguientes", cancelled: following.length });
    }

    await db.update(citasTable).set({ status: "cancelada" }).where(eq(citasTable.id, id));
    return res.json({ ok: true, scope: "solo" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al cancelar cita" });
  }
});

export default router;
