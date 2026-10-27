import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { citasTable, patientsTable } from "@workspace/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { randomUUID } from "crypto";
import { canAccessPatient } from "./access-policy";

const router: IRouter = Router();

router.use("/citas", (req, res, next) => {
  if (req.session?.userId && req.session.userRole !== "professional") {
    return res.status(403).json({ error: "Acceso reservado a profesionales" });
  }
  return next();
});

function getSessionUser(req: any): { id: number; role: string } | null {
  if (!req.session?.userId) return null;
  return {
    id: req.session.userId,
    role: req.session.userRole ?? "professional",
  };
}

async function assignedPatientIds(userId: number): Promise<Set<number>> {
  const patients = await db
    .select({ id: patientsTable.id })
    .from(patientsTable)
    .where(eq(patientsTable.assignedProfessionalId, userId));
  return new Set(patients.map(patient => patient.id));
}

function canAccessCita(
  cita: typeof citasTable.$inferSelect,
  sess: { id: number; role: string },
  patientIds: Set<number>,
): boolean {
  return cita.userId === sess.id &&
    (cita.patientId == null || patientIds.has(cita.patientId));
}

async function resolveAccessibleCita(
  id: number,
  sess: { id: number; role: string },
  res: any,
): Promise<typeof citasTable.$inferSelect | null> {
  const [cita] = await db.select().from(citasTable).where(eq(citasTable.id, id));
  if (!cita) {
    res.status(404).json({ error: "Cita no encontrada" });
    return null;
  }
  if (cita.userId !== sess.id) {
    res.status(403).json({ error: "Sin acceso a esta cita" });
    return null;
  }
  if (cita.patientId != null) {
    const [patient] = await db
      .select({ assignedProfessionalId: patientsTable.assignedProfessionalId })
      .from(patientsTable)
      .where(eq(patientsTable.id, cita.patientId));
    if (!patient || !canAccessPatient(patient, sess)) {
      res.status(403).json({ error: "Sin acceso a esta cita" });
      return null;
    }
  }
  return cita;
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

    const ownedRows = await db
      .select()
      .from(citasTable)
      .where(conditions.length ? and(...conditions) : undefined);
    const currentPatientIds = sess.role === "admin"
      ? null
      : await assignedPatientIds(sess.id);
    const rows = currentPatientIds
      ? ownedRows.filter(cita => canAccessCita(cita, sess, currentPatientIds))
      : ownedRows;

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

    let parsedPatientId: number | null = null;
    if (patientId !== undefined && patientId !== null && patientId !== "") {
      parsedPatientId = Number(patientId);
      if (!Number.isSafeInteger(parsedPatientId) || parsedPatientId <= 0) {
        return res.status(400).json({ error: "Paciente inválido" });
      }
      const [patient] = await db
        .select({ assignedProfessionalId: patientsTable.assignedProfessionalId })
        .from(patientsTable)
        .where(eq(patientsTable.id, parsedPatientId));
      if (!patient) return res.status(404).json({ error: "Paciente no encontrado" });
      if (!canAccessPatient(patient, sess)) {
        return res.status(403).json({ error: "Sin acceso a este paciente" });
      }
    }

    const base = {
      titulo,
      fecha,
      horaInicio,
      horaFin,
      tipo,
      status,
      notas: notas ?? null,
      patientId: parsedPatientId,
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

    const cita = await resolveAccessibleCita(id, sess, res);
    if (!cita) return;

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
      const currentPatientIds = await assignedPatientIds(sess.id);
      const following = allInSerie
        .filter(row => canAccessCita(row, sess, currentPatientIds))
        .filter(c => c.fecha >= cita.fecha);
      for (const c of following) {
        await db.update(citasTable).set({ ...updates, serieId: newSerieId }).where(eq(citasTable.id, c.id));
      }
      return res.json({ ok: true, updated: following.length });
    }

    if (scope === "serie" && cita.serieId) {
      const allInSerie = await db.select().from(citasTable).where(eq(citasTable.serieId, cita.serieId));
      const currentPatientIds = await assignedPatientIds(sess.id);
      const accessible = allInSerie.filter(row => canAccessCita(row, sess, currentPatientIds));
      for (const c of accessible) {
        await db.update(citasTable).set(updates).where(eq(citasTable.id, c.id));
      }
      return res.json({ ok: true, updated: accessible.length });
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

    const cita = await resolveAccessibleCita(id, sess, res);
    if (!cita) return;

    if (scope === "serie" && cita.serieId) {
      const allInSerie = await db.select().from(citasTable).where(eq(citasTable.serieId, cita.serieId));
      const currentPatientIds = await assignedPatientIds(sess.id);
      const accessible = allInSerie.filter(row => canAccessCita(row, sess, currentPatientIds));
      for (const row of accessible) {
        await db.update(citasTable).set({ status: "cancelada" }).where(eq(citasTable.id, row.id));
      }
      return res.json({ ok: true, scope: "serie" });
    }

    if (scope === "siguientes" && cita.serieId) {
      const allInSerie = await db.select().from(citasTable).where(eq(citasTable.serieId, cita.serieId));
      const currentPatientIds = await assignedPatientIds(sess.id);
      const following = allInSerie
        .filter(row => canAccessCita(row, sess, currentPatientIds))
        .filter(c => c.fecha >= cita.fecha);
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
