import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  usersTable, patientsTable, registrosClinicosTable,
  registrosTable, goalsTable, goalProgressTable, sessionsTable,
  patientProfessionalsTable, citasTable, pagosTable, gastosTable,
  patientFilesTable, deletionLogTable,
} from "@workspace/db/schema";
import { eq, ne, inArray, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { storageConfigured, deleteStorageObject } from "../lib/supabaseStorage";

const router: IRouter = Router();

function requireAdmin(req: any, res: any): boolean {
  if (req.session?.userRole !== "admin") {
    res.status(403).json({ error: "Solo administradores pueden realizar esta acción" });
    return false;
  }
  return true;
}

function normalizeName(s: string | null | undefined): string {
  return (s ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
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
  };
}

// GET /api/users — list all users (admin only).
// Each user is enriched with real usage stats computed from existing tables
// (no schema changes): assigned patients (patients.assigned_professional_id) and
// clinical-record activity (registros_clinicos). Records with a null user_id are
// recovered via a professionalId / professionalName fallback so legacy rows still count.
router.get("/users", async (req, res) => {
  const sessionUserId = req.session?.userId;
  const sessionRole   = req.session?.userRole;
  console.log(`[GET /api/users] sessionUserId=${sessionUserId} role=${sessionRole}`);
  if (!sessionUserId) return res.status(401).json({ error: "No autenticado" });
  if (!requireAdmin(req, res)) return;

  const users = await db.select().from(usersTable).orderBy(usersTable.name);

  const [patients, registros] = await Promise.all([
    db
      .select({
        assignedProfessionalId: patientsTable.assignedProfessionalId,
        archived: patientsTable.archived,
      })
      .from(patientsTable),
    db
      .select({
        patientId: registrosClinicosTable.patientId,
        userId: registrosClinicosTable.userId,
        professionalId: registrosClinicosTable.professionalId,
        professionalName: registrosClinicosTable.professionalName,
        fecha: registrosClinicosTable.fecha,
        createdAt: registrosClinicosTable.createdAt,
      })
      .from(registrosClinicosTable),
  ]);

  // Lookup maps to recover records whose user_id is null.
  const userByProfId = new Map<number, number>();
  const userByName = new Map<string, number>();
  for (const u of users) {
    if (u.professionalId != null) userByProfId.set(u.professionalId, u.id);
    const n = normalizeName(u.name);
    if (n && !userByName.has(n)) userByName.set(n, u.id);
  }

  const attribute = (r: (typeof registros)[number]): number | null => {
    if (r.userId != null) return r.userId;
    if (r.professionalId != null && userByProfId.has(r.professionalId)) {
      return userByProfId.get(r.professionalId)!;
    }
    const n = normalizeName(r.professionalName);
    if (n && userByName.has(n)) return userByName.get(n)!;
    return null;
  };

  type Stat = {
    pacientesAsignados: number;
    sesionesRegistradas: number;
    pacientesConSesion: Set<number>;
    sesionesEsteMes: number;
    ultimaActividad: Date | null;
  };
  const stats = new Map<number, Stat>();
  for (const u of users) {
    stats.set(u.id, {
      pacientesAsignados: 0,
      sesionesRegistradas: 0,
      pacientesConSesion: new Set<number>(),
      sesionesEsteMes: 0,
      ultimaActividad: null,
    });
  }

  for (const p of patients) {
    if (p.archived) continue;
    if (p.assignedProfessionalId == null) continue;
    const s = stats.get(p.assignedProfessionalId);
    if (s) s.pacientesAsignados++;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  for (const r of registros) {
    const uid = attribute(r);
    if (uid == null) continue;
    const s = stats.get(uid);
    if (!s) continue;
    s.sesionesRegistradas++;
    s.pacientesConSesion.add(r.patientId);
    // Preferimos la fecha clínica real (r.fecha, texto YYYY-MM-DD que escribe el
    // profesional) y usamos created_at solo como respaldo si la fecha no es válida.
    const parsed = r.fecha ? new Date(`${r.fecha}T00:00:00`) : null;
    const eff = parsed && !isNaN(parsed.getTime()) ? parsed : r.createdAt;
    if (eff && eff >= monthStart) s.sesionesEsteMes++;
    if (eff && (!s.ultimaActividad || eff > s.ultimaActividad)) {
      s.ultimaActividad = eff;
    }
  }

  console.log(`[GET /api/users] returning ${users.length} users`);
  return res.json(
    users.map((u) => {
      const s = stats.get(u.id)!;
      return {
        ...userToJson(u),
        stats: {
          pacientesAsignados: s.pacientesAsignados,
          sesionesRegistradas: s.sesionesRegistradas,
          pacientesConSesion: s.pacientesConSesion.size,
          sesionesEsteMes: s.sesionesEsteMes,
          ultimaActividad: s.ultimaActividad ? s.ultimaActividad.toISOString() : null,
        },
      };
    })
  );
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
  const { email, password, name, role, specialty } = req.body;
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
  const [user] = await db.insert(usersTable).values({
    email: email.toLowerCase().trim(),
    passwordHash,
    name: name.trim(),
    role: role ?? "professional",
    specialty: specialty?.trim() || null,
    active: true,
    professionalId: null,
  }).returning();

  return res.status(201).json(userToJson(user));
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
  } = req.body;

  if (!isAdmin && (role !== undefined || active !== undefined)) {
    return res.status(403).json({ error: "No tienes permiso para cambiar el rol o el estado de la cuenta" });
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!existing) return res.status(404).json({ error: "Usuario no encontrado" });

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name.trim();
  if (email !== undefined) updates.email = email.toLowerCase().trim();
  if (specialty !== undefined) updates.specialty = specialty?.trim() || null;
  if (password) updates.passwordHash = await bcrypt.hash(password, 10);
  // Privileged fields — admins only.
  if (isAdmin) {
    if (role !== undefined) updates.role = role;
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

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, id))
    .returning();

  return res.json(userToJson(updated));
});

// DELETE /api/users/:id — deactivate user (admin only, cannot deactivate self)
router.delete("/users/:id", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  if (!requireAdmin(req, res)) return;
  const id = parseInt(req.params.id);

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

// ─── Eliminación definitiva ───────────────────────────────────────────────────

// Helper: patients whose PRIMARY professional is this user. Patients assigned to
// other professionals are never touched.
async function getOwnedPatientIds(userId: number): Promise<number[]> {
  const rows = await db
    .select({ id: patientsTable.id })
    .from(patientsTable)
    .where(eq(patientsTable.assignedProfessionalId, userId));
  return rows.map((r) => r.id);
}

// GET /api/users/:id/deletion-preview — real counts of what a permanent delete
// would remove (admin only). Read-only.
router.get("/users/:id/deletion-preview", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  if (!requireAdmin(req, res)) return;
  const id = parseInt(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "ID inválido" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

  const patientIds = await getOwnedPatientIds(id);

  const countWhere = async (table: any, cond: any) =>
    (await db.select({ id: table.id }).from(table).where(cond)).length;

  // Solo se cuentan (y luego se borran) filas de pacientes CUYO profesional
  // principal es el usuario a eliminar. Las filas históricas del usuario en
  // pacientes de otros profesionales se conservan (se desvinculan, no se borran).
  const registros = patientIds.length
    ? await countWhere(registrosClinicosTable, inArray(registrosClinicosTable.patientId, patientIds))
    : 0;

  const documentos = patientIds.length
    ? await countWhere(patientFilesTable, inArray(patientFilesTable.patientId, patientIds))
    : 0;

  const sesiones = patientIds.length
    ? await countWhere(sessionsTable, inArray(sessionsTable.patientId, patientIds))
    : 0;

  const pagos = patientIds.length
    ? await countWhere(pagosTable, inArray(pagosTable.patientId, patientIds))
    : 0;

  const gastos = await countWhere(gastosTable, eq(gastosTable.userId, id));

  return res.json({
    userId: id,
    userName: user.name,
    pacientes: patientIds.length,
    registros,
    documentos,
    sesiones,
    pagos,
    gastos,
  });
});

// DELETE /api/users/:id/permanent — permanent, transactional delete of the user,
// their assigned patients and ALL dependent data. Storage objects are removed
// after the DB transaction commits; failures there are logged in deletion_log
// (orphan files, never orphan metadata). Requires body { confirm: "ELIMINAR" }.
router.delete("/users/:id/permanent", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  if (!requireAdmin(req, res)) return;
  const id = parseInt(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "ID inválido" });

  if (id === req.session.userId) {
    return res.status(400).json({ error: "No puedes eliminar tu propio usuario" });
  }
  if (req.body?.confirm !== "ELIMINAR") {
    return res.status(400).json({ error: "Confirmación inválida: debes escribir ELIMINAR" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

  const adminId = req.session.userId;
  const [admin] = await db.select().from(usersTable).where(eq(usersTable.id, adminId));

  try {
    const patientIds = await getOwnedPatientIds(id);

    // Collect storage paths BEFORE deleting metadata.
    const files = patientIds.length
      ? await db
          .select({ id: patientFilesTable.id, storagePath: patientFilesTable.storagePath })
          .from(patientFilesTable)
          .where(inArray(patientFilesTable.patientId, patientIds))
      : [];

    let registrosDeleted = 0;

    await db.transaction(async (tx) => {
      // Delete ONLY rows belonging to patients whose primary professional is
      // this user. Historical rows the user left on OTHER professionals'
      // patients are preserved and merely unlinked (user_id → null), so no
      // third-party clinical data is ever destroyed.
      if (patientIds.length > 0) {
        const goalIds = (
          await tx.select({ id: goalsTable.id }).from(goalsTable)
            .where(inArray(goalsTable.patientId, patientIds))
        ).map((g) => g.id);
        if (goalIds.length > 0) {
          await tx.delete(goalProgressTable).where(inArray(goalProgressTable.goalId, goalIds));
        }
        await tx.delete(goalsTable).where(inArray(goalsTable.patientId, patientIds));
        await tx.delete(registrosTable).where(inArray(registrosTable.patientId, patientIds));
        const regs = await tx.delete(registrosClinicosTable)
          .where(inArray(registrosClinicosTable.patientId, patientIds))
          .returning({ id: registrosClinicosTable.id });
        registrosDeleted = regs.length;
        await tx.delete(sessionsTable).where(inArray(sessionsTable.patientId, patientIds));
        await tx.delete(patientProfessionalsTable).where(inArray(patientProfessionalsTable.patientId, patientIds));
        await tx.delete(citasTable).where(inArray(citasTable.patientId, patientIds));
        await tx.delete(pagosTable).where(inArray(pagosTable.patientId, patientIds));
        await tx.delete(patientFilesTable).where(inArray(patientFilesTable.patientId, patientIds));
        await tx.delete(patientsTable).where(inArray(patientsTable.id, patientIds));
      }

      // Unlink (not delete) remaining rows that reference the user on other
      // professionals' patients, so no dangling user_id references remain.
      await tx.update(registrosClinicosTable).set({ userId: null })
        .where(eq(registrosClinicosTable.userId, id));
      await tx.update(citasTable).set({ userId: null })
        .where(eq(citasTable.userId, id));
      await tx.update(pagosTable).set({ userId: null })
        .where(eq(pagosTable.userId, id));

      // Personal data of the user
      await tx.delete(gastosTable).where(eq(gastosTable.userId, id));

      // Finally the user row itself
      await tx.delete(usersTable).where(eq(usersTable.id, id));
    });

    // Post-commit steps. The DB deletion already succeeded at this point, so
    // failures here must NEVER be reported as a rollback — only as warnings.
    const storageErrors: string[] = [];
    let filesDeleted = 0;
    if (files.length > 0 && storageConfigured()) {
      for (const f of files) {
        try {
          await deleteStorageObject(f.storagePath);
          filesDeleted++;
        } catch (e: any) {
          storageErrors.push(`${f.storagePath}: ${e?.message ?? e}`);
        }
      }
    } else if (files.length > 0) {
      storageErrors.push("Storage no configurado: archivos no borrados del bucket");
    }

    try {
      await db.insert(deletionLogTable).values({
        adminId,
        adminName: admin?.name ?? `admin#${adminId}`,
        deletedUserId: id,
        deletedUserName: user.name,
        deletedUserEmail: user.email,
        patientsDeleted: patientIds.length,
        recordsDeleted: registrosDeleted,
        filesDeleted,
        storageErrors: storageErrors.length ? storageErrors.join(" | ") : null,
      });
    } catch (e: any) {
      console.error(`[DELETE /api/users/${id}/permanent] deletion_log falló →`, e?.message ?? e);
      storageErrors.push("No se pudo registrar el log de auditoría (la eliminación sí se completó)");
    }

    console.log(
      `[DELETE /api/users/${id}/permanent] ✓ usuario "${user.name}" eliminado por admin=${adminId}` +
      ` | pacientes=${patientIds.length} registros=${registrosDeleted} archivos=${filesDeleted}/${files.length}` +
      (storageErrors.length ? ` | errores storage=${storageErrors.length}` : "")
    );

    return res.json({
      ok: true,
      deletedUserId: id,
      pacientes: patientIds.length,
      registros: registrosDeleted,
      documentos: files.length,
      archivosBorrados: filesDeleted,
      storageWarnings: storageErrors.length ? storageErrors.length : undefined,
    });
  } catch (err: any) {
    console.error(`[DELETE /api/users/${id}/permanent] ERROR →`, err?.message ?? err);
    return res.status(500).json({
      error: "No se pudo completar la eliminación. No se borró ningún dato (la transacción fue revertida).",
    });
  }
});

export default router;
