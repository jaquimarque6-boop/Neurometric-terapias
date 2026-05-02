import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
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
  };
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

  if (!user.active) {
    return res.status(403).json({ error: "Usuario inactivo. Contacte al administrador." });
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
  req.session.userSpecialty = user.specialty ?? null;

  return res.json(userToJson(user));
});

router.get("/auth/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "No autenticado" });
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (!user || !user.active) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: "No autenticado" });
  }
  return res.json(userToJson(user));
});

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

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.post("/auth/register", async (req, res) => {
  const { email, password, name, role, specialty } = req.body;
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
    specialty: specialty ?? null,
    active: true,
    professionalId: null,
  }).returning();

  return res.status(201).json(userToJson(user));
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
