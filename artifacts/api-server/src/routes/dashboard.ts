import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { patientsTable, registrosTable, goalsTable, professionalsTable, goalLibraryTable } from "@workspace/db/schema";
import { eq, count, gte, inArray } from "drizzle-orm";

const router: IRouter = Router();

function getSessionUser(req: any): { id: number; role: string; professionalId: number | null } | null {
  if (!req.session?.userId) return null;
  return {
    id: req.session.userId,
    role: req.session.userRole ?? "professional",
    professionalId: req.session.professionalId ?? null,
  };
}

router.get("/dashboard/stats", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const isAdmin = sess.role === "admin";

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  if (isAdmin) {
    // Admin sees global stats
    const [{ value: totalPatients }] = await db.select({ value: count() }).from(patientsTable);
    const [{ value: activeSessions }] = await db.select({ value: count() }).from(registrosTable);
    const [{ value: goalsAchieved }] = await db.select({ value: count() }).from(goalLibraryTable);
    const [{ value: totalProfessionals }] = await db.select({ value: count() }).from(professionalsTable);
    const [{ value: sessionsThisWeek }] = await db
      .select({ value: count() })
      .from(registrosTable)
      .where(gte(registrosTable.createdAt, oneWeekAgo));
    const [{ value: newPatientsThisMonth }] = await db
      .select({ value: count() })
      .from(patientsTable)
      .where(gte(patientsTable.createdAt, oneMonthAgo));

    return res.json({
      totalPatients: Number(totalPatients),
      activeSessions: Number(activeSessions),
      goalsAchieved: Number(goalsAchieved),
      totalProfessionals: Number(totalProfessionals),
      sessionsThisWeek: Number(sessionsThisWeek),
      newPatientsThisMonth: Number(newPatientsThisMonth),
    });
  }

  // Professional: filter by their own assigned patients
  const myPatients = await db
    .select({ id: patientsTable.id, createdAt: patientsTable.createdAt })
    .from(patientsTable)
    .where(eq(patientsTable.assignedProfessionalId, sess.id));

  const totalPatients = myPatients.length;
  const patientIds = myPatients.map(p => p.id);
  const newPatientsThisMonth = myPatients.filter(p => p.createdAt >= oneMonthAgo).length;

  let activeSessions = 0;
  let sessionsThisWeek = 0;

  if (patientIds.length > 0) {
    const myRegistros = await db
      .select({ createdAt: registrosTable.createdAt })
      .from(registrosTable)
      .where(inArray(registrosTable.patientId, patientIds));

    activeSessions = myRegistros.length;
    sessionsThisWeek = myRegistros.filter(r => r.createdAt >= oneWeekAgo).length;
  }

  const [{ value: goalsAchieved }] = await db.select({ value: count() }).from(goalLibraryTable);
  const [{ value: totalProfessionals }] = await db.select({ value: count() }).from(professionalsTable);

  return res.json({
    totalPatients,
    activeSessions,
    goalsAchieved: Number(goalsAchieved),
    totalProfessionals: Number(totalProfessionals),
    sessionsThisWeek,
    newPatientsThisMonth,
  });
});

export default router;
