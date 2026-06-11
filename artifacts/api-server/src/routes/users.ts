import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, patientsTable, registrosClinicosTable } from "@workspace/db/schema";
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

function normalizeName(s: string | null | undefined): string {
  return (s ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
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
    if (r.createdAt && r.createdAt >= monthStart) s.sesionesEsteMes++;
    if (r.createdAt && (!s.ultimaActividad || r.createdAt > s.ultimaActividad)) {
      s.ultimaActividad = r.createdAt;
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
