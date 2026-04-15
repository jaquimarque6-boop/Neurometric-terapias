import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  patientsTable, registrosTable,
  registrosClinicosTable, goalsTable, goalProgressTable,
  usersTable,
} from "@workspace/db/schema";
import { eq, count, inArray } from "drizzle-orm";

const router: IRouter = Router();

// ─── Clinical insight helpers ─────────────────────────────────────────────────

type PatientGoal = typeof goalsTable.$inferSelect;

type ClinicalStatus = "Buen progreso" | "En progreso" | "Estancado" | "Requiere ajuste";

function computeClinicalStatus(
  promedioDesempeno: number | null,
  activeCount: number,
  achievedCount: number,
): ClinicalStatus {
  const pct = promedioDesempeno ?? 0;
  const totalGoals = activeCount + achievedCount;

  if (totalGoals === 0) return "Requiere ajuste";
  if (pct >= 0.70) return "Buen progreso";
  if (pct >= 0.45 || (achievedCount > 0 && achievedCount / totalGoals >= 0.4)) return "En progreso";
  if (activeCount > 0 && pct > 0) return "Estancado";
  return "Requiere ajuste";
}

function computeNextAction(status: ClinicalStatus, activeCount: number, achievedCount: number): string {
  if (activeCount === 0 && achievedCount === 0) return "Agregar nuevo objetivo";
  switch (status) {
    case "Buen progreso":
      return achievedCount > 0 ? "Aumentar dificultad" : "Continuar objetivo actual";
    case "En progreso":
      return "Continuar objetivo actual";
    case "Estancado":
      return "Revisar estrategia";
    case "Requiere ajuste":
      return activeCount === 0 ? "Agregar nuevo objetivo" : "Revisar estrategia";
  }
}

function computeCurrentFocus(goals: PatientGoal[]): { title: string; area: string } | null {
  const inProgress = goals.find(g => g.status === "en progreso");
  const active = goals.find(g => g.status === "activo");
  const target = inProgress ?? active;
  if (!target) return null;
  const area = target.areaClinica ?? target.category;
  const shortTitle = target.title.length > 45 ? target.title.slice(0, 42) + "…" : target.title;
  return { title: shortTitle, area };
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

function getSessionUser(req: any): { id: number; role: string } | null {
  if (!req.session?.userId) return null;
  return { id: req.session.userId, role: req.session.userRole ?? "professional" };
}

async function enrichPatient(p: typeof patientsTable.$inferSelect, allGoals: typeof goalsTable.$inferSelect[]) {
  const [{ value }] = await db
    .select({ value: count() })
    .from(registrosTable)
    .where(eq(registrosTable.patientId, p.id));

  const patientGoals = allGoals.filter(g => g.patientId === p.id);
  const activeGoals  = patientGoals.filter(g => g.status === "activo" || g.status === "en progreso");
  const achievedGoals = patientGoals.filter(g => g.status === "logrado");

  const clinicalStatus = computeClinicalStatus(
    p.promedioDesempeno as number | null,
    activeGoals.length,
    achievedGoals.length,
  );
  const currentFocus = computeCurrentFocus(activeGoals);
  const nextAction = computeNextAction(clinicalStatus, activeGoals.length, achievedGoals.length);

  return {
    ...p,
    totalRegistros: Number(value),
    createdAt: p.createdAt.toISOString(),
    clinicalStatus,
    currentFocus,
    nextAction,
    activeGoalsCount: activeGoals.length,
    achievedGoalsCount: achievedGoals.length,
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get("/patients", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  let patients: typeof patientsTable.$inferSelect[];
  if (sess.role === "admin") {
    patients = await db.select().from(patientsTable).orderBy(patientsTable.name);
  } else {
    // Professional: only see assigned patients
    patients = await db
      .select()
      .from(patientsTable)
      .where(eq(patientsTable.assignedProfessionalId, sess.id))
      .orderBy(patientsTable.name);
  }

  const allGoals = await db.select().from(goalsTable);

  const withCounts = await Promise.all(patients.map(p => enrichPatient(p, allGoals)));
  return res.json(withCounts);
});

router.post("/patients", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const body = req.body;

  // Determine assigned professional — any user can pick from the dropdown
  let assignedProfessionalId: number | null = null;
  let profesionalNombre: string | null = body.profesionalNombre ?? null;

  if (body.assignedProfessionalId) {
    assignedProfessionalId = parseInt(body.assignedProfessionalId);
    if (!profesionalNombre) {
      const [prof] = await db.select().from(usersTable).where(eq(usersTable.id, assignedProfessionalId));
      profesionalNombre = prof?.name ?? null;
    }
  }

  const [patient] = await db.insert(patientsTable).values({
    name: body.name,
    age: body.age ?? null,
    diagnosis: body.diagnosis ?? null,
    profesionalNombre,
    assignedProfessionalId,
    franjaEtaria: body.franjaEtaria ?? null,
    fechaInicio: body.fechaInicio ?? null,
  }).returning();

  return res.status(201).json({ ...patient, totalRegistros: 0, createdAt: patient.createdAt.toISOString() });
});

router.get("/patients/:id", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const id = parseInt(req.params.id);
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
  if (!patient) return res.status(404).json({ error: "Patient not found" });

  // Access check
  if (sess.role !== "admin" && patient.assignedProfessionalId !== sess.id) {
    return res.status(403).json({ error: "Sin acceso a este paciente" });
  }

  const [{ value }] = await db.select({ value: count() }).from(registrosTable).where(eq(registrosTable.patientId, id));
  return res.json({ ...patient, totalRegistros: Number(value), createdAt: patient.createdAt.toISOString() });
});

async function updatePatientById(id: number, body: any, req: any, res: any) {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const [existing] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
  if (!existing) return res.status(404).json({ error: "Patient not found" });

  // Access check
  if (sess.role !== "admin" && existing.assignedProfessionalId !== sess.id) {
    return res.status(403).json({ error: "Sin acceso a este paciente" });
  }

  // If admin is reassigning professional
  let assignedProfessionalId = existing.assignedProfessionalId;
  let profesionalNombre = existing.profesionalNombre;

  if (sess.role === "admin" && body.assignedProfessionalId !== undefined) {
    if (body.assignedProfessionalId === null || body.assignedProfessionalId === "") {
      assignedProfessionalId = null;
      profesionalNombre = null;
    } else {
      assignedProfessionalId = parseInt(body.assignedProfessionalId);
      const [prof] = await db.select().from(usersTable).where(eq(usersTable.id, assignedProfessionalId));
      profesionalNombre = prof?.name ?? existing.profesionalNombre;
    }
  }

  if (body.profesionalNombre !== undefined && sess.role === "admin") {
    profesionalNombre = body.profesionalNombre ?? null;
  }

  const [updated] = await db.update(patientsTable).set({
    name: body.name ?? existing.name,
    age: body.age ?? existing.age,
    diagnosis: body.diagnosis ?? existing.diagnosis,
    profesionalNombre,
    assignedProfessionalId,
    franjaEtaria: body.franjaEtaria ?? existing.franjaEtaria,
    fechaInicio: body.fechaInicio ?? existing.fechaInicio,
    observaciones: body.observaciones !== undefined ? body.observaciones : existing.observaciones,
    motivoConsulta: body.motivoConsulta !== undefined ? body.motivoConsulta : existing.motivoConsulta,
    antecedentes: body.antecedentes !== undefined ? body.antecedentes : existing.antecedentes,
    historiaFamiliar: body.historiaFamiliar !== undefined ? body.historiaFamiliar : existing.historiaFamiliar,
    escolaridad: body.escolaridad !== undefined ? body.escolaridad : existing.escolaridad,
    informeEvolucion: body.informeEvolucion !== undefined ? body.informeEvolucion : existing.informeEvolucion,
    informeFamilia: body.informeFamilia !== undefined ? body.informeFamilia : existing.informeFamilia,
  }).where(eq(patientsTable.id, id)).returning();

  const [{ value }] = await db.select({ value: count() }).from(registrosTable).where(eq(registrosTable.patientId, id));
  return res.json({ ...updated, totalRegistros: Number(value), createdAt: updated.createdAt.toISOString() });
}

router.put("/patients/:id", async (req, res) => {
  await updatePatientById(parseInt(req.params.id), req.body, req, res);
});

router.patch("/patients/:id", async (req, res) => {
  await updatePatientById(parseInt(req.params.id), req.body, req, res);
});

// ─── Clinical Timeline ────────────────────────────────────────────────────────
router.get("/patients/:id/timeline", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const patientId = parseInt(req.params.id);

  // Access check
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId));
  if (!patient) return res.status(404).json({ error: "Paciente no encontrado" });
  if (sess.role !== "admin" && patient.assignedProfessionalId !== sess.id) {
    return res.status(403).json({ error: "Sin acceso a este paciente" });
  }

  const events: any[] = [];

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
        progressPct: p.progressPct ?? null,
        extra: {
          goalArea: g.areaClinica ?? g.category,
          statusAnterior: p.statusAnterior,
          statusNuevo: p.statusNuevo,
        },
      });
    }
  }

  events.sort((a, b) => new Date(b.sortKey).getTime() - new Date(a.sortKey).getTime());
  return res.json(events);
});

export default router;
