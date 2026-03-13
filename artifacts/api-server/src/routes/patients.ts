import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  patientsTable, registrosTable,
  registrosClinicosTable, goalsTable, goalProgressTable,
} from "@workspace/db/schema";
import { eq, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/patients", async (_req, res) => {
  const patients = await db.select().from(patientsTable).orderBy(patientsTable.name);
  const withCounts = await Promise.all(patients.map(async p => {
    const [{ value }] = await db.select({ value: count() }).from(registrosTable).where(eq(registrosTable.patientId, p.id));
    return { ...p, totalRegistros: Number(value), createdAt: p.createdAt.toISOString() };
  }));
  res.json(withCounts);
});

router.post("/patients", async (req, res) => {
  const body = req.body;
  const [patient] = await db.insert(patientsTable).values({
    name: body.name,
    age: body.age ?? null,
    diagnosis: body.diagnosis ?? null,
    profesionalNombre: body.profesionalNombre ?? null,
    franjaEtaria: body.franjaEtaria ?? null,
    fechaInicio: body.fechaInicio ?? null,
  }).returning();
  res.status(201).json({ ...patient, totalRegistros: 0, createdAt: patient.createdAt.toISOString() });
});

router.get("/patients/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
  if (!patient) return res.status(404).json({ error: "Patient not found" });
  const [{ value }] = await db.select({ value: count() }).from(registrosTable).where(eq(registrosTable.patientId, id));
  res.json({ ...patient, totalRegistros: Number(value), createdAt: patient.createdAt.toISOString() });
});

router.put("/patients/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
  if (!existing) return res.status(404).json({ error: "Patient not found" });
  const body = req.body;
  const [updated] = await db.update(patientsTable).set({
    name: body.name ?? existing.name,
    age: body.age ?? existing.age,
    diagnosis: body.diagnosis ?? existing.diagnosis,
    profesionalNombre: body.profesionalNombre ?? existing.profesionalNombre,
    franjaEtaria: body.franjaEtaria ?? existing.franjaEtaria,
    fechaInicio: body.fechaInicio ?? existing.fechaInicio,
  }).where(eq(patientsTable.id, id)).returning();
  const [{ value }] = await db.select({ value: count() }).from(registrosTable).where(eq(registrosTable.patientId, id));
  res.json({ ...updated, totalRegistros: Number(value), createdAt: updated.createdAt.toISOString() });
});

// ─── Clinical Timeline ────────────────────────────────────────────────────────
router.get("/patients/:id/timeline", async (req, res) => {
  const patientId = parseInt(req.params.id);
  const events: any[] = [];

  // 1. Clinical sessions
  const sessions = await db.select().from(registrosClinicosTable)
    .where(eq(registrosClinicosTable.patientId, patientId));

  for (const s of sessions) {
    const desc = s.resumenSesion?.trim() || "Sesión clínica registrada";
    events.push({
      id: `sesion-${s.id}`,
      type: "sesion",
      date: s.fecha,
      sortKey: s.fecha,
      title: "Sesión realizada",
      description: desc,
      badge: s.professionalName ?? null,
      meta: s.observaciones ?? null,
    });
  }

  // 2. Goals — assignment events + progress
  const goals = await db.select().from(goalsTable)
    .where(eq(goalsTable.patientId, patientId));

  for (const g of goals) {
    if (g.fechaAsignacion) {
      events.push({
        id: `goal-assigned-${g.id}`,
        type: "objetivo_asignado",
        date: g.fechaAsignacion,
        sortKey: g.fechaAsignacion,
        title: "Objetivo asignado",
        description: g.title,
        badge: g.areaClinica ?? g.category ?? null,
        meta: g.description ?? null,
        extra: { codigo: g.codigo, nivel: g.nivelDificultad },
      });
    }

    const progress = await db.select().from(goalProgressTable)
      .where(eq(goalProgressTable.goalId, g.id));

    for (const p of progress) {
      const isLogrado    = p.statusNuevo === "logrado";
      const isStatusChg  = p.statusAnterior !== p.statusNuevo;
      const hasNota      = !!p.nota?.trim();

      if (!hasNota && !isStatusChg) continue;

      let type = "nota_progreso";
      let title = "Nota de progreso";
      if (isLogrado) { type = "objetivo_logrado"; title = "Objetivo logrado"; }
      else if (isStatusChg) { type = "estado_actualizado"; title = "Estado actualizado"; }

      events.push({
        id: `progress-${p.id}`,
        type,
        date: p.createdAt,
        sortKey: p.createdAt,
        title,
        description: g.title,
        badge: isLogrado ? "logrado" : (isStatusChg ? (p.statusNuevo ?? null) : null),
        meta: p.nota ?? null,
        extra: {
          goalArea: g.areaClinica ?? g.category,
          statusAnterior: p.statusAnterior,
          statusNuevo: p.statusNuevo,
        },
      });
    }
  }

  // Sort newest first
  events.sort((a, b) => new Date(b.sortKey).getTime() - new Date(a.sortKey).getTime());

  res.json(events);
});

export default router;
