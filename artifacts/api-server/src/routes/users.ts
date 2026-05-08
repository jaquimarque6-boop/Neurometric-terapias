import { Router, type IRouter } from "express";
import { randomBytes } from "crypto";
import { db } from "@workspace/db";
import {
  usersTable,
  auditLogsTable,
  patientsTable,
  registrosClinicosTable,
} from "@workspace/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

function requireAdmin(req: any, res: any): boolean {
  if (req.session?.userRole !== "admin") {
    res.status(403).json({ error: "Solo administradores pueden realizar esta acción" });
    return false;
  }
  return true;
}

function getIp(req: any): string {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ?? req.ip ?? "desconocida";
}

function userToJson(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    specialty: u.specialty ?? null,
    active: u.active,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    aiUsageCount: u.aiUsageCount,
  };
}

// ── GET /users — basic list (admin only) ──────────────────────────────────────
router.get("/users", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  if (!requireAdmin(req, res)) return;
  const users = await db.select().from(usersTable).orderBy(usersTable.name);
  return res.json(users.map(userToJson));
});

// ── GET /users/professionals — selector list ──────────────────────────────────
router.get("/users/professionals", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  const users = await db.select().from(usersTable).where(eq(usersTable.active, true));
  return res.json(
    users
      .filter(u => u.role === "professional" || u.role === "admin")
      .map(u => ({ id: u.id, name: u.name, specialty: u.specialty ?? null, role: u.role }))
  );
});

// ── GET /admin/users — rich list with stats ───────────────────────────────────
router.get("/admin/users", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  if (!requireAdmin(req, res)) return;

  const users = await db.select().from(usersTable).orderBy(usersTable.name);

  const enriched = await Promise.all(users.map(async (u) => {
    let patientCount = 0;
    let sessionCount = 0;

    if (u.professionalId) {
      const [pc] = await db
        .select({ cnt: sql<number>`count(*)::int` })
        .from(patientsTable)
        .where(eq(patientsTable.assignedProfessionalId, u.professionalId));
      patientCount = pc?.cnt ?? 0;

      const [sc] = await db
        .select({ cnt: sql<number>`count(*)::int` })
        .from(registrosClinicosTable)
        .where(eq(registrosClinicosTable.professionalId, u.professionalId));
      sessionCount = sc?.cnt ?? 0;
    }

    return {
      ...userToJson(u),
      patientCount,
      sessionCount,
    };
  }));

  return res.json(enriched);
});

// ── GET /admin/audit-logs ─────────────────────────────────────────────────────
router.get("/admin/audit-logs", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  if (!requireAdmin(req, res)) return;

  const logs = await db
    .select()
    .from(auditLogsTable)
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(200);

  return res.json(logs.map(l => ({
    id: l.id,
    userId: l.userId,
    targetUserId: l.targetUserId,
    action: l.action,
    details: l.details,
    ipAddress: l.ipAddress,
    createdAt: l.createdAt.toISOString(),
  })));
});

// ── POST /users — create user (admin only) ────────────────────────────────────
router.post("/users", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  if (!requireAdmin(req, res)) return;

  const { email, password, name, role, specialty } = req.body;
  if (!email || !name) return res.status(400).json({ error: "Email y nombre son requeridos" });
  if (!password?.trim()) return res.status(400).json({ error: "La contraseña es obligatoria" });
  if (password.trim().length < 6) return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });

  const existing = await db.select().from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()));
  if (existing.length > 0) return res.status(409).json({ error: "Este email ya está registrado" });

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

  db.insert(auditLogsTable).values({
    userId: req.session.userId,
    targetUserId: user.id,
    action: "admin_create_user",
    details: `Nuevo usuario creado: ${user.email} (${user.role})`,
    ipAddress: getIp(req),
  }).catch(() => {});

  return res.status(201).json(userToJson(user));
});

// ── PATCH /users/:id — update user ───────────────────────────────────────────
router.patch("/users/:id", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });

  const id = parseInt(req.params.id);
  const isAdmin = req.session.userRole === "admin";
  const isSelf = req.session.userId === id;

  if (!isAdmin && !isSelf) {
    return res.status(403).json({ error: "No tenés permiso para editar este usuario" });
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!existing) return res.status(404).json({ error: "Usuario no encontrado" });

  const { name, email, role, specialty, active, password } = req.body;
  const updates: Partial<typeof usersTable.$inferInsert> = {};

  if (name !== undefined) updates.name = name.trim();
  if (specialty !== undefined) updates.specialty = specialty?.trim() || null;

  if (isAdmin) {
    if (email !== undefined) updates.email = email.toLowerCase().trim();
    if (role !== undefined) updates.role = role;
    if (active !== undefined) updates.active = active;
  }

  if (password?.trim()) {
    updates.passwordHash = await bcrypt.hash(password.trim(), 10);
  }

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, id))
    .returning();

  if (isAdmin && !isSelf) {
    db.insert(auditLogsTable).values({
      userId: req.session.userId,
      targetUserId: id,
      action: "admin_edit_user",
      details: `Admin editó usuario ${existing.email}: ${Object.keys(updates).filter(k => k !== "passwordHash").join(", ")}`,
      ipAddress: getIp(req),
    }).catch(() => {});
  }

  return res.json(userToJson(updated));
});

// ── DELETE /users/:id — deactivate user (admin only) ─────────────────────────
router.delete("/users/:id", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  if (!requireAdmin(req, res)) return;

  const id = parseInt(req.params.id);
  if (id === req.session.userId) {
    return res.status(400).json({ error: "No podés desactivar tu propio usuario" });
  }

  const [updated] = await db
    .update(usersTable)
    .set({ active: false })
    .where(eq(usersTable.id, id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Usuario no encontrado" });

  db.insert(auditLogsTable).values({
    userId: req.session.userId,
    targetUserId: id,
    action: "admin_deactivate_user",
    details: `Usuario desactivado: ${updated.email}`,
    ipAddress: getIp(req),
  }).catch(() => {});

  return res.json(userToJson(updated));
});

// ── POST /admin/users/:id/toggle-active ───────────────────────────────────────
router.post("/admin/users/:id/toggle-active", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  if (!requireAdmin(req, res)) return;

  const id = parseInt(req.params.id);
  if (id === req.session.userId) {
    return res.status(400).json({ error: "No podés desactivarte a vos mismo" });
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!existing) return res.status(404).json({ error: "Usuario no encontrado" });

  const newActive = !existing.active;
  const [updated] = await db
    .update(usersTable)
    .set({ active: newActive })
    .where(eq(usersTable.id, id))
    .returning();

  db.insert(auditLogsTable).values({
    userId: req.session.userId,
    targetUserId: id,
    action: newActive ? "admin_activate_user" : "admin_deactivate_user",
    details: `Usuario ${newActive ? "activado" : "desactivado"}: ${existing.email}`,
    ipAddress: getIp(req),
  }).catch(() => {});

  return res.json(userToJson(updated));
});

// ── POST /admin/users/:id/reset-password — admin generates token ──────────────
router.post("/admin/users/:id/reset-password", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  if (!requireAdmin(req, res)) return;

  const id = parseInt(req.params.id);
  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!target) return res.status(404).json({ error: "Usuario no encontrado" });

  const token = randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

  await db.update(usersTable)
    .set({ resetPasswordToken: token, resetPasswordExpiry: expiry })
    .where(eq(usersTable.id, id));

  db.insert(auditLogsTable).values({
    userId: req.session.userId,
    targetUserId: id,
    action: "admin_reset_password",
    details: `Admin generó token de reseteo para: ${target.email}`,
    ipAddress: getIp(req),
  }).catch(() => {});

  return res.json({ ok: true, resetToken: token });
});

// ── DELETE /admin/users/:id — permanent deletion with data guard ──────────────
router.delete("/admin/users/:id", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  if (!requireAdmin(req, res)) return;

  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

  if (id === req.session.userId) {
    return res.status(400).json({ error: "No podés eliminar tu propio usuario" });
  }

  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!target) return res.status(404).json({ error: "Usuario no encontrado" });

  if (target.professionalId) {
    const [pc] = await db
      .select({ cnt: sql<number>`count(*)::int` })
      .from(patientsTable)
      .where(eq(patientsTable.assignedProfessionalId, target.professionalId));

    const [rc] = await db
      .select({ cnt: sql<number>`count(*)::int` })
      .from(registrosClinicosTable)
      .where(eq(registrosClinicosTable.professionalId, target.professionalId));

    if ((pc?.cnt ?? 0) > 0 || (rc?.cnt ?? 0) > 0) {
      return res.status(409).json({
        error: "No se puede eliminar este usuario porque tiene datos clínicos asociados. Podés desactivarlo en su lugar.",
      });
    }
  }

  await db.delete(usersTable).where(eq(usersTable.id, id));

  db.insert(auditLogsTable).values({
    userId: req.session.userId,
    targetUserId: id,
    action: "admin_delete_user",
    details: `Usuario eliminado permanentemente: ${target.email} (${target.role})`,
    ipAddress: getIp(req),
  }).catch(() => {});

  return res.json({ ok: true });
});

export default router;
