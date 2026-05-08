import { Router, type IRouter } from "express";
import { randomBytes } from "crypto";
import { db } from "@workspace/db";
import { usersTable, auditLogsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

declare module "express-session" {
  interface SessionData {
    userId: number;
    userRole: string;
    professionalId: number | null;
    userName: string;
    userEmail: string;
    userSpecialty: string | null;
  }
}

function userToJson(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    professionalId: u.professionalId ?? null,
    specialty: u.specialty ?? null,
    active: u.active,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
  };
}

function getIp(req: any): string {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ?? req.ip ?? "desconocida";
}

// ── Login ─────────────────────────────────────────────────────────────────────
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son requeridos" });
  }

  const normalizedEmail = email.toLowerCase().trim();

  let user: typeof usersTable.$inferSelect | undefined;
  let dbError: string | null = null;
  try {
    const [found] = await db.select().from(usersTable)
      .where(eq(usersTable.email, normalizedEmail));
    user = found;
  } catch (err: any) {
    dbError = err?.message ?? String(err);
  }

  // ── DIAGNOSTIC LOG (temporary) ────────────────────────────────────────────
  const diag: Record<string, unknown> = {
    email: normalizedEmail,
    user_found: !!user,
    db_error: dbError,
    active: user?.active ?? null,
    role: user?.role ?? null,
    has_password_hash: user ? user.passwordHash.length > 0 : null,
    hash_prefix: user ? user.passwordHash.slice(0, 7) : null, // e.g. "$2b$10$" — safe, no secret data
  };

  if (!user || dbError) {
    diag.failure = dbError ? "db_error" : "user_not_found";
    console.log("[login-diag]", JSON.stringify(diag));
    db.insert(auditLogsTable).values({
      action: "login_fail",
      details: `Intento fallido — email no encontrado: ${normalizedEmail}`,
      ipAddress: getIp(req),
    }).catch(() => {});
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  if (!user.active) {
    diag.failure = "account_inactive";
    console.log("[login-diag]", JSON.stringify(diag));
    db.insert(auditLogsTable).values({
      userId: user.id,
      action: "login_fail",
      details: "Intento de acceso con cuenta inactiva",
      ipAddress: getIp(req),
    }).catch(() => {});
    return res.status(403).json({ error: "Tu cuenta está inactiva. Contactá al administrador." });
  }

  let valid = false;
  let bcryptError: string | null = null;
  try {
    valid = await bcrypt.compare(password, user.passwordHash);
  } catch (err: any) {
    bcryptError = err?.message ?? String(err);
  }

  if (!valid || bcryptError) {
    diag.failure = bcryptError ? `bcrypt_error: ${bcryptError}` : "wrong_password";
    console.log("[login-diag]", JSON.stringify(diag));
    db.insert(auditLogsTable).values({
      userId: user.id,
      action: "login_fail",
      details: "Contraseña incorrecta",
      ipAddress: getIp(req),
    }).catch(() => {});
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  diag.failure = null;
  console.log("[login-diag]", JSON.stringify(diag));
  // ── END DIAGNOSTIC LOG ────────────────────────────────────────────────────

  req.session.userId = user.id;
  req.session.userRole = user.role;
  req.session.professionalId = user.professionalId ?? null;
  req.session.userName = user.name;
  req.session.userEmail = user.email;
  req.session.userSpecialty = user.specialty ?? null;

  db.update(usersTable)
    .set({ lastLoginAt: new Date() })
    .where(eq(usersTable.id, user.id))
    .catch(() => {});

  db.insert(auditLogsTable).values({
    userId: user.id,
    action: "login_success",
    details: `Inicio de sesión exitoso`,
    ipAddress: getIp(req),
  }).catch(() => {});

  return res.json(userToJson(user));
});

// ── Me ────────────────────────────────────────────────────────────────────────
router.get("/auth/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "No autenticado" });
  }
  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.id, req.session.userId));
  if (!user || !user.active) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: "Sesión expirada. Iniciá sesión nuevamente." });
  }
  return res.json(userToJson(user));
});

// ── Update own profile ────────────────────────────────────────────────────────
router.patch("/auth/me", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "No autenticado" });
  const { name, specialty } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Nombre requerido" });
  }
  const [updated] = await db
    .update(usersTable)
    .set({
      name: name.trim(),
      specialty: specialty !== undefined ? (specialty?.trim() || null) : undefined,
    })
    .where(eq(usersTable.id, req.session.userId))
    .returning();
  req.session.userName = updated.name;
  req.session.userSpecialty = updated.specialty ?? null;
  return res.json(userToJson(updated));
});

// ── Change own password ───────────────────────────────────────────────────────
router.post("/auth/change-password", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "No autenticado" });
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Se requiere la contraseña actual y la nueva" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "La nueva contraseña debe tener al menos 8 caracteres" });
  }

  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.id, req.session.userId));
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "La contraseña actual es incorrecta" });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable)
    .set({ passwordHash, resetPasswordToken: null, resetPasswordExpiry: null })
    .where(eq(usersTable.id, user.id));

  db.insert(auditLogsTable).values({
    userId: user.id,
    targetUserId: user.id,
    action: "password_change",
    details: "Usuario cambió su propia contraseña",
    ipAddress: getIp(req),
  }).catch(() => {});

  return res.json({ ok: true });
});

// ── Forgot password (generates reset token) ───────────────────────────────────
router.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email requerido" });

  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()));

  if (!user || !user.active) {
    return res.json({ ok: true, found: false });
  }

  const token = randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.update(usersTable)
    .set({ resetPasswordToken: token, resetPasswordExpiry: expiry })
    .where(eq(usersTable.id, user.id));

  db.insert(auditLogsTable).values({
    userId: user.id,
    action: "password_reset_requested",
    details: `Token de recuperación generado`,
    ipAddress: getIp(req),
  }).catch(() => {});

  return res.json({ ok: true, found: true, resetToken: token });
});

// ── Reset password via token ──────────────────────────────────────────────────
router.post("/auth/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token y nueva contraseña son requeridos" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
  }

  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.resetPasswordToken, token));

  if (!user || !user.resetPasswordExpiry || user.resetPasswordExpiry < new Date()) {
    return res.status(400).json({ error: "El enlace de recuperación es inválido o expiró" });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable)
    .set({ passwordHash, resetPasswordToken: null, resetPasswordExpiry: null })
    .where(eq(usersTable.id, user.id));

  db.insert(auditLogsTable).values({
    userId: user.id,
    targetUserId: user.id,
    action: "password_reset_completed",
    details: "Contraseña reseteada via token de recuperación",
    ipAddress: getIp(req),
  }).catch(() => {});

  return res.json({ ok: true });
});

// ── Logout ────────────────────────────────────────────────────────────────────
router.post("/auth/logout", (req, res) => {
  const userId = req.session.userId;
  req.session.destroy(() => {
    if (userId) {
      db.insert(auditLogsTable).values({
        userId,
        action: "logout",
        details: "Cierre de sesión",
      }).catch(() => {});
    }
    res.json({ ok: true });
  });
});

// ── Register ──────────────────────────────────────────────────────────────────
router.post("/auth/register", async (req, res) => {
  const { email, password, name, role, specialty } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Email, contraseña y nombre son requeridos" });
  }

  const existing = await db.select().from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()));
  if (existing.length > 0) {
    return res.status(409).json({ error: "Este email ya está registrado" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({
    email: email.toLowerCase().trim(),
    passwordHash,
    name,
    role: role ?? "professional",
    specialty: specialty ?? null,
    active: true,
    professionalId: null,
  }).returning();

  return res.status(201).json(userToJson(user));
});

// ── Seeds ─────────────────────────────────────────────────────────────────────
export async function seedAdminIfNeeded() {
  const existing = await db.select().from(usersTable);
  if (existing.length > 0) return;

  const passwordHash = await bcrypt.hash("admin1234", 10);
  await db.insert(usersTable).values({
    email: "admin@neurometric.cl",
    passwordHash,
    name: "Administrador",
    role: "admin",
    professionalId: null,
    specialty: null,
    active: true,
  });
  console.log("Admin user seeded: admin@neurometric.cl / admin1234");
}

export async function ensureJaquiAdmin() {
  const passwordHash = await bcrypt.hash("12345678", 10);
  const existing = await db.select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.email, "jaquimarque6@gmail.com"));

  if (existing.length === 0) {
    await db.insert(usersTable).values({
      email: "jaquimarque6@gmail.com",
      passwordHash,
      name: "Jaqui",
      role: "admin",
      professionalId: null,
      specialty: null,
      active: true,
    });
    console.log("[seed] Admin jaquimarque6@gmail.com created.");
  } else if (existing[0].role !== "admin") {
    await db.update(usersTable)
      .set({ role: "admin", active: true, passwordHash })
      .where(eq(usersTable.email, "jaquimarque6@gmail.com"));
    console.log("[seed] Admin jaquimarque6@gmail.com updated to admin role.");
  }
}

export async function ensureTempAdmin() {
  const email = "admin@neurometric.com";
  const passwordHash = await bcrypt.hash("12345678", 10);
  const existing = await db.select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (existing.length === 0) {
    await db.insert(usersTable).values({
      email,
      passwordHash,
      name: "Admin",
      role: "admin",
      professionalId: null,
      specialty: null,
      active: true,
    });
    console.log("[seed] Admin admin@neurometric.com created.");
  } else {
    await db.update(usersTable)
      .set({ role: "admin", active: true, passwordHash })
      .where(eq(usersTable.email, email));
    console.log("[seed] Admin admin@neurometric.com ensured.");
  }
}

export default router;
