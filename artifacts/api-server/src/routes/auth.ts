import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, professionalsTable } from "@workspace/db/schema";
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
  }
}

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son requeridos" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
  if (!user) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  req.session.userId = user.id;
  req.session.userRole = user.role;
  req.session.professionalId = user.professionalId ?? null;
  req.session.userName = user.name;
  req.session.userEmail = user.email;

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    professionalId: user.professionalId,
  });
});

router.get("/auth/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "No autenticado" });
  }
  res.json({
    id: req.session.userId,
    email: req.session.userEmail,
    name: req.session.userName,
    role: req.session.userRole,
    professionalId: req.session.professionalId,
  });
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.post("/auth/register", async (req, res) => {
  const { email, password, name, role, professionalId } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Email, contraseña y nombre son requeridos" });
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
  if (existing.length > 0) {
    return res.status(409).json({ error: "Este email ya está registrado" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({
    email: email.toLowerCase().trim(),
    passwordHash,
    name,
    role: role ?? "professional",
    professionalId: professionalId ? parseInt(professionalId) : null,
  }).returning();

  res.status(201).json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    professionalId: user.professionalId,
  });
});

router.get("/auth/users", async (req, res) => {
  if (req.session.userRole !== "admin") {
    return res.status(403).json({ error: "Solo administradores" });
  }
  const users = await db.select({
    id: usersTable.id,
    email: usersTable.email,
    name: usersTable.name,
    role: usersTable.role,
    professionalId: usersTable.professionalId,
    createdAt: usersTable.createdAt,
  }).from(usersTable);
  res.json(users.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })));
});

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
  });
  console.log("Admin user seeded: admin@neurometric.cl / admin1234");
}

export default router;
