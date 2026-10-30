import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  collaboratorsTable,
  patientsTable,
  registrosClinicosTable,
  usersTable,
} from "@workspace/db/schema";
import { count, desc, eq, isNotNull, or, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  activeReferral,
  attributeReferral,
  changeCommercialStatus,
  normalizeCode,
} from "../lib/collaborators";
import { referralAttributionsTable, saasStatusEventsTable } from "@workspace/db/schema";
import { commercialFields, commercialSnapshot, commercialRevision, logCommercialChange } from "../lib/commercial-service";
import { reviewCommercialAccount, validCommercialDate } from "../lib/commercial-policy";
import {
  AssignUserReferralAttributionBody,
  AssignUserReferralAttributionParams,
  AssignUserReferralAttributionResponse,
  GetUserReferralAttributionParams,
  GetUserReferralAttributionResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const PRIMARY_ADMIN_EMAIL = "admin@neurometric.com";

function requireAdmin(req: any, res: any): boolean {
  if (req.session?.userRole !== "admin") {
    res.status(403).json({ error: "Solo administradores pueden realizar esta acción" });
    return false;
  }
  return true;
}

async function requirePrimaryAdmin(req: any, res: any): Promise<number | null> {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "No autenticado" });
    return null;
  }

  // The session supplies only the authenticated account ID. Resolve the
  // current email and role from the database; never authorize from request data.
  const [actor] = await db
    .select({ id: usersTable.id, email: usersTable.email, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  if (!actor || actor.role !== "admin" || actor.email.trim().toLowerCase() !== PRIMARY_ADMIN_EMAIL) {
    res.status(403).json({ error: "Solo la administradora principal puede asignar códigos de referido" });
    return null;
  }
  return actor.id;
}

const COMMERCIAL_STATUSES = ["trial", "paying", "overdue", "courtesy", "churned"] as const;

function userToJson(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    specialty: u.specialty ?? null,
    active: u.active,
    createdAt: u.createdAt.toISOString(),
    // Datos comerciales (metadatos administrativos, separados de pagos clínicos).
    commercialStatus: u.commercialStatus,
    trialStartDate: u.trialStartDate ?? null,
    trialEndDate: u.trialEndDate ?? null,
    lastPaymentDate: u.lastPaymentDate ?? null,
    nextDueDate: u.nextDueDate ?? null,
    monthlyAmount: u.monthlyAmount ?? null,
    paymentMethod: u.paymentMethod ?? null,
    internalNotes: u.internalNotes ?? null,
    trialStartPending: u.trialStartPending,
    commercialReview: reviewCommercialAccount(u),
    commercialRevision: commercialRevision(u),
  };
}

async function safelyLoadMetricRows<T>(
  query: PromiseLike<T[]>,
  req: any,
  metric: "patients" | "clinical_sessions",
): Promise<T[] | null> {
  try {
    return await query;
  } catch (error) {
    req.log?.warn?.({ err: error, metric }, "Could not calculate admin user metric");
    return null;
  }
}

// GET /api/users — administrative account data plus aggregate clinical counts.
router.get("/users", async (req, res) => {
  const sessionUserId = req.session?.userId;
  if (!sessionUserId) return res.status(401).json({ error: "No autenticado" });
  if (!requireAdmin(req, res)) return;

  const [users, patientMetricRows, clinicalSessionMetricRows] = await Promise.all([
    db.select().from(usersTable).orderBy(usersTable.name),
    safelyLoadMetricRows(
      db.select({
        userId: patientsTable.assignedProfessionalId,
        value: count(),
      })
        .from(patientsTable)
        .where(isNotNull(patientsTable.assignedProfessionalId))
        .groupBy(patientsTable.assignedProfessionalId),
      req,
      "patients",
    ),
    safelyLoadMetricRows(
      db.select({
        userId: registrosClinicosTable.userId,
        value: count(),
      })
        .from(registrosClinicosTable)
        .groupBy(registrosClinicosTable.userId),
      req,
      "clinical_sessions",
    ),
  ]);

  const patientCounts = new Map<number, number>();
  for (const row of patientMetricRows ?? []) {
    if (row.userId != null) patientCounts.set(Number(row.userId), Number(row.value));
  }

  const hasUnattributedSessions = clinicalSessionMetricRows?.some(
    row => row.userId == null && Number(row.value) > 0,
  ) ?? false;
  const clinicalSessionCounts = new Map<number, number>();
  for (const row of clinicalSessionMetricRows ?? []) {
    if (row.userId != null) {
      clinicalSessionCounts.set(Number(row.userId), Number(row.value));
    }
  }

  return res.json(users.map(user => {
    const isProfessional = user.role === "professional";
    return {
      ...userToJson(user),
      patientCount: isProfessional
        ? patientMetricRows === null
          ? null
          : patientCounts.get(user.id) ?? 0
        : null,
      clinicalSessionCount: isProfessional
        ? clinicalSessionMetricRows === null || hasUnattributedSessions
          ? null
          : clinicalSessionCounts.get(user.id) ?? 0
        : null,
    };
  }));
});

// GET /api/users/professionals — list active professionals for selectors
router.get("/users/professionals", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.active, true));
  return res.json(
    users
      .filter(u => u.role === "professional" || u.role === "admin")
      .map(u => ({ id: u.id, name: u.name, specialty: u.specialty ?? null, role: u.role }))
  );
});

// POST /api/users — create user (admin only)
router.post("/users", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  if (!requireAdmin(req, res)) return;
  const { email, password, name, role, specialty, referralCode } = req.body;
  if (role !== undefined && role !== "professional" && role !== "admin") return res.status(400).json({ error: "Rol inválido; use /api/collaborators para colaboradoras" });
  if (referralCode && (role === "admin" || !await activeReferral(referralCode))) return res.status(400).json({ error: "Código de referido inválido o inactivo" });
  if (!email || !name) {
    return res.status(400).json({ error: "Email y nombre son requeridos" });
  }
  if (!password || !password.trim()) {
    return res.status(400).json({ error: "La contraseña es obligatoria" });
  }
  if (password.trim().length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
  if (existing.length > 0) {
    return res.status(409).json({ error: "Este email ya está registrado" });
  }

  const passwordHash = await bcrypt.hash(password.trim(), 10);
  let user: typeof usersTable.$inferSelect;
  try {
    user = await db.transaction(async (tx) => {
    const [created] = await tx.insert(usersTable).values({
    email: email.toLowerCase().trim(),
    passwordHash,
    name: name.trim(),
    role: role ?? "professional",
    specialty: specialty?.trim() || null,
    active: true,
    professionalId: null,
    trialStartPending: (role ?? "professional") === "professional",
    }).returning();
    await attributeReferral(tx, created.id, referralCode, "admin_user_create", req.session.userId!);
    return created;
    });
  } catch (error: any) {
    if (error.message === "Código de referido inválido o inactivo") return res.status(400).json({ error: error.message });
    if (error.code === "23505") return res.status(409).json({ error: "Email ya registrado" });
    throw error;
  }

  return res.status(201).json(userToJson(user));
});

// The primary administrator can view the current immutable attribution and
// select from active codes when a professional has not yet been attributed.
router.get("/users/:id/referral-attribution", async (req, res): Promise<void> => {
  if (!(await requirePrimaryAdmin(req, res))) return;

  const params = GetUserReferralAttributionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Usuario inválido" });
    return;
  }

  const [professional] = await db
    .select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, params.data.id));
  if (!professional || professional.role !== "professional") {
    res.status(404).json({ error: "Profesional no encontrado" });
    return;
  }

  const [attribution] = await db
    .select({
      code: referralAttributionsTable.codeUsed,
      createdAt: referralAttributionsTable.createdAt,
    })
    .from(referralAttributionsTable)
    .where(eq(referralAttributionsTable.professionalUserId, professional.id));
  const activeCodes = await db
    .select({ code: collaboratorsTable.code })
    .from(collaboratorsTable)
    .where(eq(collaboratorsTable.active, true))
    .orderBy(collaboratorsTable.code);

  res.json(GetUserReferralAttributionResponse.parse({
    attribution: attribution ?? null,
    activeCodes: activeCodes.map(({ code }) => code),
  }));
});

// This operation only inserts one attribution row. It never updates the user,
// subscription state, clinical data, or historical receipt snapshots.
router.put("/users/:id/referral-attribution", async (req, res): Promise<void> => {
  const actorId = await requirePrimaryAdmin(req, res);
  if (!actorId) return;

  const params = AssignUserReferralAttributionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Usuario inválido" });
    return;
  }
  const body = AssignUserReferralAttributionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Código de referido inválido" });
    return;
  }

  const code = normalizeCode(body.data.code);

  let result: {
    state: "created" | "unchanged" | "conflict" | "not_found";
    attribution?: { code: string; createdAt: Date };
  };
  try {
    result = await db.transaction(async tx => {
      await tx.execute(sql`SELECT id FROM users WHERE id = ${params.data.id} FOR UPDATE`);
      const [professional] = await tx
        .select({ id: usersTable.id, role: usersTable.role })
        .from(usersTable)
        .where(eq(usersTable.id, params.data.id));
      if (!professional || professional.role !== "professional") return { state: "not_found" };

      const [existing] = await tx
        .select({
          code: referralAttributionsTable.codeUsed,
          createdAt: referralAttributionsTable.createdAt,
        })
        .from(referralAttributionsTable)
        .where(eq(referralAttributionsTable.professionalUserId, professional.id));
      if (existing) {
        return normalizeCode(existing.code) === code
          ? { state: "unchanged", attribution: existing }
          : { state: "conflict", attribution: existing };
      }

      await attributeReferral(tx, professional.id, code, "admin_manual_assignment", actorId);
      const [created] = await tx
        .select({
          code: referralAttributionsTable.codeUsed,
          createdAt: referralAttributionsTable.createdAt,
        })
        .from(referralAttributionsTable)
        .where(eq(referralAttributionsTable.professionalUserId, professional.id));
      if (!created) throw new Error("La atribución no quedó guardada");
      return { state: "created", attribution: created };
    });
  } catch (error: any) {
    if (error?.message === "Código de referido inválido o inactivo") {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error?.code === "23505") {
      res.status(409).json({ error: "La profesional ya tiene una atribución de referido" });
      return;
    }
    throw error;
  }

  if (result.state === "not_found") {
    res.status(404).json({ error: "Profesional no encontrado" });
    return;
  }
  if (result.state === "conflict") {
    res.status(409).json({
      error: "La profesional ya tiene una atribución; no se reemplazó el código existente",
      code: result.attribution?.code,
    });
    return;
  }

  const response = AssignUserReferralAttributionResponse.parse(result.attribution);
  res.status(result.state === "created" ? 201 : 200).json(response);
});

router.get("/users/:id/commercial-history", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  if (!requireAdmin(req, res)) return;
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: "Usuario inválido" });
  const rows = await db.select({
    id: saasStatusEventsTable.id, event: saasStatusEventsTable.event,
    actorUserId: saasStatusEventsTable.actorUserId, actorName: usersTable.name,
    effectiveDate: saasStatusEventsTable.effectiveDate, occurredAt: saasStatusEventsTable.occurredAt,
    details: saasStatusEventsTable.details,
  }).from(saasStatusEventsTable).leftJoin(usersTable, eq(usersTable.id, saasStatusEventsTable.actorUserId))
    .where(eq(saasStatusEventsTable.professionalUserId, id))
    .orderBy(desc(saasStatusEventsTable.occurredAt), desc(saasStatusEventsTable.id)).limit(200);
  return res.json(rows);
});

// PATCH /api/users/:id — update user.
// Admins can manage any user. Non-admins may only edit their OWN account and only
// non-privileged fields (name, email, specialty, password); they cannot change
// `role` or `active`, nor edit other users.
router.patch("/users/:id", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  const id = parseInt(req.params.id);
  const isAdmin = req.session.userRole === "admin";
  const isSelf  = id === req.session.userId;

  if (!isAdmin && !isSelf) {
    return res.status(403).json({ error: "Solo administradores pueden gestionar otros usuarios" });
  }

  const {
    name, email, role, specialty, active, password,
    commercialStatus, trialStartDate, trialEndDate, lastPaymentDate,
    nextDueDate, monthlyAmount, paymentMethod, internalNotes,
    commercialChangeReason,
    expectedCommercialRevision,
  } = req.body;

  if (role !== undefined) {
    return res.status(403).json({ error: "El rol no se puede cambiar desde administración; cree una cuenta con el rol correcto" });
  }
  if (!isAdmin && active !== undefined) {
    return res.status(403).json({ error: "No tienes permiso para cambiar el estado de la cuenta" });
  }
  if (!isAdmin && commercialFields.some(key => req.body[key] !== undefined)) {
    return res.status(403).json({ error: "Solo administradores pueden modificar datos comerciales" });
  }
  if (commercialChangeReason !== undefined && (typeof commercialChangeReason !== "string" || commercialChangeReason.length > 500)) {
    return res.status(400).json({ error: "El motivo debe tener hasta 500 caracteres" });
  }
  if (expectedCommercialRevision !== undefined && (typeof expectedCommercialRevision !== "string" || !/^[a-f0-9]{64}$/.test(expectedCommercialRevision))) {
    return res.status(400).json({ error: "Versión comercial inválida" });
  }
  for (const key of ["trialStartDate", "trialEndDate", "lastPaymentDate", "nextDueDate"] as const) {
    const value = req.body[key];
    if (value !== undefined && value !== null && value !== "" && !validCommercialDate(value)) {
      return res.status(400).json({ error: `Fecha inválida: ${key}` });
    }
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!existing) return res.status(404).json({ error: "Usuario no encontrado" });
  if (existing.role === "collaborator") return res.status(403).json({ error: "Use /api/collaborators para gestionar colaboradoras" });

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name.trim();
  if (email !== undefined) updates.email = email.toLowerCase().trim();
  if (specialty !== undefined) updates.specialty = specialty?.trim() || null;
  if (password) updates.passwordHash = await bcrypt.hash(password, 10);
  // Privileged fields — admins only.
  if (isAdmin) {
    if (active !== undefined) updates.active = active;
    // Datos comerciales (solo admin). No afectan login/auth ni pagos clínicos.
    if (commercialStatus !== undefined) {
      if (!COMMERCIAL_STATUSES.includes(commercialStatus)) {
        return res.status(400).json({ error: "Estado comercial inválido" });
      }
      updates.commercialStatus = commercialStatus;
    }
    if (trialStartDate !== undefined) updates.trialStartDate = trialStartDate || null;
    if (trialEndDate !== undefined) updates.trialEndDate = trialEndDate || null;
    if (lastPaymentDate !== undefined) updates.lastPaymentDate = lastPaymentDate || null;
    if (nextDueDate !== undefined) updates.nextDueDate = nextDueDate || null;
    if (monthlyAmount !== undefined) {
      if (monthlyAmount === "" || monthlyAmount == null) {
        updates.monthlyAmount = null;
      } else if (isNaN(Number(monthlyAmount))) {
        return res.status(400).json({ error: "Monto mensual inválido" });
      } else {
        updates.monthlyAmount = String(monthlyAmount);
      }
    }
    if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod?.trim() || null;
    if (internalNotes !== undefined) updates.internalNotes = internalNotes?.trim() || null;
  }

  const updated = await db.transaction(async tx => {
    await tx.execute(sql`SELECT id FROM users WHERE id = ${id} FOR UPDATE`);
    const [before] = await tx.select().from(usersTable).where(eq(usersTable.id, id));
    if (!before) throw new Error("Usuario no encontrado");
    if (expectedCommercialRevision !== undefined && expectedCommercialRevision !== commercialRevision(before)) return null;
    if (isAdmin && ((trialStartDate !== undefined && (trialStartDate || null) !== before.trialStartDate) ||
        (trialEndDate !== undefined && (trialEndDate || null) !== before.trialEndDate) ||
        (commercialStatus !== undefined && commercialStatus !== "trial"))) {
      updates.trialStartPending = false;
    }
    if (updates.commercialStatus !== undefined && updates.commercialStatus !== before.commercialStatus && before.role === "professional") {
      await changeCommercialStatus(tx, id, updates.commercialStatus, req.session.userId!, undefined, false);
      delete updates.commercialStatus;
    }
    const [record] = Object.keys(updates).length
      ? await tx.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning()
      : await tx.select().from(usersTable).where(eq(usersTable.id, id));
    await logCommercialChange(tx, id, req.session.userId!, "commercial_correction",
      commercialSnapshot(before), commercialSnapshot(record),
      commercialChangeReason?.trim() ? { reason: commercialChangeReason.trim() } : {});
    return record;
  });

  if (!updated) return res.status(409).json({ error: "Los datos comerciales cambiaron mientras editabas. Cerrá la edición y volvé a abrirla para revisar los valores actuales; no se guardó ningún cambio." });
  return res.json(userToJson(updated));
});

// DELETE /api/users/:id — deactivate user (admin only, cannot deactivate self)
router.delete("/users/:id", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  if (!requireAdmin(req, res)) return;
  const id = parseInt(req.params.id);
  const [target] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, id));
  if (target?.role === "collaborator") return res.status(403).json({ error: "Use /api/collaborators para gestionar colaboradoras" });

  if (id === req.session.userId) {
    return res.status(400).json({ error: "No puedes desactivar tu propio usuario" });
  }

  const [updated] = await db
    .update(usersTable)
    .set({ active: false })
    .where(eq(usersTable.id, id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Usuario no encontrado" });
  return res.json(userToJson(updated));
});

// Clinical records are not part of administrative account management. Do not
// expose deletion previews or allow a user-management action to erase them.
router.get("/users/:id/deletion-preview", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  if (!requireAdmin(req, res)) return;
  return res.status(403).json({ error: "La vista previa de datos clínicos no está disponible en administración" });
});

// Permanent deletion would also erase or unlink clinical records. Administrators
// can deactivate access with DELETE /users/:id, but cannot perform this action.
router.delete("/users/:id/permanent", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  if (!requireAdmin(req, res)) return;
  return res.status(403).json({ error: "La eliminación definitiva está deshabilitada. Desactive el acceso sin borrar datos clínicos." });
});

export default router;
