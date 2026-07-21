import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  patientsTable, registrosTable,
  registrosClinicosTable, goalsTable, goalProgressTable,
  usersTable, patientProfessionalsTable, sessionsTable,
  citasTable, pagosTable,
} from "@workspace/db/schema";
import { eq, count, inArray, and, sql } from "drizzle-orm";

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
  if (!sess) {
    console.log(`[GET /api/patients] 401 — sin sesión (cookie: ${req.headers.cookie ? "presente" : "ausente"}, origin: ${req.headers.origin ?? "none"})`);
    return res.status(401).json({ error: "No autenticado" });
  }

  // Admin can request archived list with ?includeArchived=true
  const includeArchived = req.query.includeArchived === "true" && sess.role === "admin";

  let patients: typeof patientsTable.$inferSelect[];
  if (sess.role === "admin") {
    patients = await db
      .select()
      .from(patientsTable)
      .where(eq(patientsTable.archived, includeArchived))
      .orderBy(patientsTable.name);
  } else {
    // Professional: only see their own active (non-archived) patients
    patients = await db
      .select()
      .from(patientsTable)
      .where(and(
        eq(patientsTable.assignedProfessionalId, sess.id),
        eq(patientsTable.archived, false),
      ))
      .orderBy(patientsTable.name);
  }

  // Only load goals for the patients we're actually returning, instead of the
  // entire goals table. enrichPatient still receives the same shape (a flat
  // array it filters by patientId), so the response is byte-for-byte identical.
  const patientIds = patients.map(p => p.id);
  const allGoals = patientIds.length
    ? await db.select().from(goalsTable).where(inArray(goalsTable.patientId, patientIds))
    : [];

  const withCounts = await Promise.all(patients.map(p => enrichPatient(p, allGoals)));
  console.log(`[GET /api/patients] userId=${sess.id} role=${sess.role} includeArchived=${includeArchived} → devolviendo ${withCounts.length} pacientes`);
  return res.json(withCounts);
});

router.post("/patients", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) {
    const cookieHdr  = req.headers.cookie ? "presente" : "ausente";
    const tokenHdr   = req.headers.authorization?.startsWith("Bearer ") ? "presente" : "ausente";
    const sessionId  = (req.session as any)?.id ?? "sin-id";
    console.warn(
      `[POST /api/patients] 401 — sin sesión` +
      ` | cookie=${cookieHdr}` +
      ` | token-header=${tokenHdr}` +
      ` | sessionId=${sessionId}` +
      ` | origin=${req.headers.origin ?? "none"}` +
      ` | userId-en-sesion=${(req.session as any)?.userId ?? "undefined"}`
    );
    return res.status(401).json({ error: "No autenticado. Tu sesión puede haber vencido." });
  }

  const body = req.body;
  console.log(
    `[POST /api/patients] ✓ autenticado` +
    ` | userId=${sess.id}` +
    ` | role=${sess.role}` +
    ` | origin=${req.headers.origin ?? "none"}` +
    ` | name=${JSON.stringify(body.name)}`
  );

  // name is required
  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return res.status(400).json({ error: "El nombre del paciente es obligatorio." });
  }

  // Sanitise age — reject non-numeric strings, allow undefined/null
  let age: number | null = null;
  if (body.age !== undefined && body.age !== null && body.age !== "") {
    age = parseInt(body.age);
    if (isNaN(age) || age < 0 || age > 150) {
      return res.status(400).json({ error: "Edad inválida. Debe ser un número entre 0 y 150." });
    }
  }

  // Sanitise fecha de nacimiento — optional, must be YYYY-MM-DD and not in the future
  let fechaNacimiento: string | null = null;
  if (typeof body.fechaNacimiento === "string" && body.fechaNacimiento.trim()) {
    const v = body.fechaNacimiento.trim();
    const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T12:00:00`) : new Date(NaN);
    if (isNaN(d.getTime()) || d.getTime() > Date.now()) {
      return res.status(400).json({ error: "Fecha de nacimiento inválida." });
    }
    fechaNacimiento = v;
  }

  // Determine assigned professional
  let assignedProfessionalId: number | null = null;
  let profesionalNombre: string | null = body.profesionalNombre ?? null;

  try {
    if (body.assignedProfessionalId) {
      assignedProfessionalId = parseInt(body.assignedProfessionalId);
      if (!profesionalNombre) {
        const [prof] = await db.select().from(usersTable).where(eq(usersTable.id, assignedProfessionalId));
        profesionalNombre = prof?.name ?? null;
      }
    } else if (sess.role !== "admin") {
      // Professionals are automatically the assigned professional
      assignedProfessionalId = sess.id;
      const [prof] = await db.select().from(usersTable).where(eq(usersTable.id, sess.id));
      profesionalNombre = prof?.name ?? null;
    }

    const [patient] = await db.insert(patientsTable).values({
      name: body.name.trim(),
      age,
      fechaNacimiento,
      diagnosis: body.diagnosis?.trim() || null,
      profesionalNombre,
      assignedProfessionalId,
      franjaEtaria: body.franjaEtaria ?? null,
      fechaInicio: body.fechaInicio ?? null,
    }).returning();

    console.log(`[POST /api/patients] ✓ creado id=${patient.id} name="${patient.name}" profesional=${profesionalNombre ?? "ninguno"} assignedId=${assignedProfessionalId}`);
    return res.status(201).json({ ...patient, totalRegistros: 0, createdAt: patient.createdAt.toISOString() });

  } catch (err: any) {
    const detail = err?.message ?? String(err);
    console.error(`[POST /api/patients] ERROR userId=${sess.id} →`, detail);

    // Provide a user-friendly message while logging the real cause
    const friendly =
      detail.includes("violates not-null") ? "Falta un campo obligatorio en el paciente." :
      detail.includes("duplicate key")     ? "Ya existe un paciente con esos datos." :
      detail.includes("connect")           ? "No se pudo conectar a la base de datos. Intenta de nuevo." :
      "Error al guardar el paciente. Intenta de nuevo.";

    return res.status(500).json({ error: friendly, detail });
  }
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

  // Sanitise fecha de nacimiento — optional, must be YYYY-MM-DD and not in the future
  let fechaNacimiento = existing.fechaNacimiento;
  if (body.fechaNacimiento !== undefined) {
    if (typeof body.fechaNacimiento === "string" && body.fechaNacimiento.trim()) {
      const v = body.fechaNacimiento.trim();
      const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T12:00:00`) : new Date(NaN);
      if (isNaN(d.getTime()) || d.getTime() > Date.now()) {
        return res.status(400).json({ error: "Fecha de nacimiento inválida." });
      }
      fechaNacimiento = v;
    } else {
      fechaNacimiento = null;
    }
  }

  const [updated] = await db.update(patientsTable).set({
    name: body.name ?? existing.name,
    age: body.age !== undefined ? body.age : existing.age,
    fechaNacimiento,
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
    lenguajeComunicacion: body.lenguajeComunicacion !== undefined ? body.lenguajeComunicacion : existing.lenguajeComunicacion,
    atencionConducta: body.atencionConducta !== undefined ? body.atencionConducta : existing.atencionConducta,
    vozHabla: body.vozHabla !== undefined ? body.vozHabla : existing.vozHabla,
    deglucion: body.deglucion !== undefined ? body.deglucion : existing.deglucion,
    impresionClinica: body.impresionClinica !== undefined ? body.impresionClinica : existing.impresionClinica,
    rutinasHabitos: body.rutinasHabitos !== undefined ? body.rutinasHabitos : existing.rutinasHabitos,
    entornoParticipacion: body.entornoParticipacion !== undefined ? body.entornoParticipacion : existing.entornoParticipacion,
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

// ─── Archive / Restore ────────────────────────────────────────────────────────

router.patch("/patients/:id/archive", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const id = parseInt(req.params.id);
  try {
    const [existing] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
    if (!existing) return res.status(404).json({ error: "Paciente no encontrado" });

    if (sess.role !== "admin" && existing.assignedProfessionalId !== sess.id) {
      return res.status(403).json({ error: "No tienes permiso para archivar este paciente" });
    }
    if (existing.archived) {
      return res.status(400).json({ error: "El paciente ya está archivado" });
    }

    const [updated] = await db.update(patientsTable)
      .set({ archived: true, archivedAt: new Date() })
      .where(eq(patientsTable.id, id))
      .returning();

    console.log(`[PATCH /api/patients/${id}/archive] userId=${sess.id} → archivado "${updated.name}"`);
    return res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  } catch (err: any) {
    console.error(`[PATCH /api/patients/${id}/archive] ERROR →`, err?.message);
    return res.status(500).json({ error: "Error al archivar el paciente" });
  }
});

router.patch("/patients/:id/restore", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const id = parseInt(req.params.id);
  try {
    const [existing] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
    if (!existing) return res.status(404).json({ error: "Paciente no encontrado" });

    if (sess.role !== "admin" && existing.assignedProfessionalId !== sess.id) {
      return res.status(403).json({ error: "No tienes permiso para restaurar este paciente" });
    }

    const [updated] = await db.update(patientsTable)
      .set({ archived: false, archivedAt: null })
      .where(eq(patientsTable.id, id))
      .returning();

    console.log(`[PATCH /api/patients/${id}/restore] userId=${sess.id} → restaurado "${updated.name}"`);
    return res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  } catch (err: any) {
    console.error(`[PATCH /api/patients/${id}/restore] ERROR →`, err?.message);
    return res.status(500).json({ error: "Error al restaurar el paciente" });
  }
});

// ─── Hard delete (definitive) ─────────────────────────────────────────────────
// Permanently removes the patient and ALL related data across:
//   • goal_progress  (via goals)
//   • goals
//   • registros
//   • registros_clinicos
//   • sessions
//   • patient_professionals
//   • citas
//   • pagos
//   • patients
// Wrapped in a transaction so a failure leaves the DB unchanged.
router.delete("/patients/:id", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) {
    const cookieHdr = req.headers.cookie ? "presente" : "ausente";
    const tokenHdr  = req.headers.authorization?.startsWith("Bearer ") ? "presente" : "ausente";
    console.warn(
      `[DELETE /api/patients/${req.params.id}] 401 — sin sesión` +
      ` | cookie=${cookieHdr}` +
      ` | token-header=${tokenHdr}` +
      ` | origin=${req.headers.origin ?? "none"}`
    );
    return res.status(401).json({ error: "No autenticado. Tu sesión puede haber vencido." });
  }

  const id = parseInt(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "ID de paciente inválido" });
  }

  try {
    const [existing] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
    if (!existing) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    // Permission: admin OR assigned professional may delete.
    if (sess.role !== "admin" && existing.assignedProfessionalId !== sess.id) {
      console.warn(
        `[DELETE /api/patients/${id}] 403 — userId=${sess.id} role=${sess.role}` +
        ` no es admin ni profesional asignado (asignado=${existing.assignedProfessionalId})`
      );
      return res.status(403).json({
        error: "No tienes permiso para eliminar este paciente. Solo el profesional asignado o un administrador pueden hacerlo.",
      });
    }

    await db.transaction(async (tx) => {
      // 1. Goal progress entries (children of goals)
      const goalIds = (await tx.select({ id: goalsTable.id })
        .from(goalsTable)
        .where(eq(goalsTable.patientId, id))).map(g => g.id);

      if (goalIds.length > 0) {
        await tx.delete(goalProgressTable).where(inArray(goalProgressTable.goalId, goalIds));
      }

      // 2. Direct children of patient
      await tx.delete(goalsTable).where(eq(goalsTable.patientId, id));
      await tx.delete(registrosTable).where(eq(registrosTable.patientId, id));
      await tx.delete(registrosClinicosTable).where(eq(registrosClinicosTable.patientId, id));
      await tx.delete(sessionsTable).where(eq(sessionsTable.patientId, id));
      await tx.delete(patientProfessionalsTable).where(eq(patientProfessionalsTable.patientId, id));
      await tx.delete(citasTable).where(eq(citasTable.patientId, id));
      await tx.delete(pagosTable).where(eq(pagosTable.patientId, id));

      // 3. Patient row
      await tx.delete(patientsTable).where(eq(patientsTable.id, id));
    });

    console.log(
      `[DELETE /api/patients/${id}] ✓ eliminado definitivamente "${existing.name}"` +
      ` | userId=${sess.id} role=${sess.role}`
    );
    return res.json({ ok: true, deletedId: id });
  } catch (err: any) {
    const detail = err?.message ?? String(err);
    console.error(`[DELETE /api/patients/${id}] ERROR userId=${sess.id} →`, detail);
    return res.status(500).json({
      error: "Error al eliminar el paciente. Intenta de nuevo.",
      detail,
    });
  }
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
