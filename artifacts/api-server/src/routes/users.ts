import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

function requireAdmin(req: any, res: any): boolean {
  if (req.session?.userRole !== "admin") {
    res.status(403).json({ error: "Solo administradores pueden realizar esta acción" });
    return false;
  }
  return true;
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
  };
}

// GET /api/users — list all users (admin only)
router.get("/users", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  if (!requireAdmin(req, res)) return;
  const users = await db.select().from(usersTable).orderBy(usersTable.name);
  return res.json(users.map(userToJson));
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

// PATCH /api/users/:id — update user (any authenticated user)
router.patch("/users/:id", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  const id = parseInt(req.params.id);
  const { name, email, role, specialty, active, password } = req.body;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!existing) return res.status(404).json({ error: "Usuario no encontrado" });

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name.trim();
  if (email !== undefined) updates.email = email.toLowerCase().trim();
  if (role !== undefined) updates.role = role;
  if (specialty !== undefined) updates.specialty = specialty?.trim() || null;
  if (active !== undefined) updates.active = active;
  if (password) updates.passwordHash = await bcrypt.hash(password, 10);

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, id))
    .returning();

  return res.json(userToJson(updated));
});

// DELETE /api/users/:id — deactivate user (any authenticated user, cannot deactivate self)
router.delete("/users/:id", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
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

export default router;
