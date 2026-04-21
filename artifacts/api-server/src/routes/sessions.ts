import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { registrosTable, patientsTable } from "@workspace/db/schema";
import { eq, inArray } from "drizzle-orm";

const router: IRouter = Router();

function getSessionUser(req: any): { id: number; role: string } | null {
  if (!req.session?.userId) return null;
  return {
    id: req.session.userId,
    role: req.session.userRole ?? "professional",
  };
}

// Return registros scoped to the logged-in user's patients
async function getScopedRegistros(sess: { id: number; role: string }) {
  if (sess.role === "admin") {
    return await db.select().from(registrosTable).orderBy(registrosTable.fecha);
  }

  // Professionals: only see registros for their own patients
  const myPatients = await db
    .select({ id: patientsTable.id })
    .from(patientsTable)
    .where(eq(patientsTable.assignedProfessionalId, sess.id));

  if (myPatients.length === 0) return [];

  const patientIds = myPatients.map(p => p.id);
  return await db
    .select()
    .from(registrosTable)
    .where(inArray(registrosTable.patientId, patientIds))
    .orderBy(registrosTable.fecha);
}

router.get("/sessions", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const registros = await getScopedRegistros(sess);
  res.json(registros.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.get("/registros", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const registros = await getScopedRegistros(sess);
  res.json(registros.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.get("/registros/:id", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const id = parseInt(req.params.id);
  const [registro] = await db.select().from(registrosTable).where(eq(registrosTable.id, id));
  if (!registro) return res.status(404).json({ error: "Registro not found" });

  // Access check: professionals can only see registros for their own patients
  if (sess.role !== "admin") {
    const myPatients = await db
      .select({ id: patientsTable.id })
      .from(patientsTable)
      .where(eq(patientsTable.assignedProfessionalId, sess.id));
    const myPatientIds = myPatients.map(p => p.id);
    if (!myPatientIds.includes(registro.patientId)) {
      return res.status(403).json({ error: "Sin acceso a este registro" });
    }
  }

  return res.json({ ...registro, createdAt: registro.createdAt.toISOString() });
});

export default router;
