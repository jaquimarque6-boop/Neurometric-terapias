import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { patientsTable, registrosTable, goalsTable, professionalsTable, goalLibraryTable } from "@workspace/db/schema";
import { eq, count, gte } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res) => {
  const [{ value: totalPatients }] = await db.select({ value: count() }).from(patientsTable);
  const [{ value: activeSessions }] = await db.select({ value: count() }).from(registrosTable);
  const [{ value: goalsAchieved }] = await db.select({ value: count() }).from(goalLibraryTable);
  const [{ value: totalProfessionals }] = await db.select({ value: count() }).from(professionalsTable);

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [{ value: sessionsThisWeek }] = await db
    .select({ value: count() })
    .from(registrosTable)
    .where(gte(registrosTable.createdAt, oneWeekAgo));

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const [{ value: newPatientsThisMonth }] = await db
    .select({ value: count() })
    .from(patientsTable)
    .where(gte(patientsTable.createdAt, oneMonthAgo));

  res.json({
    totalPatients: Number(totalPatients),
    activeSessions: Number(activeSessions),
    goalsAchieved: Number(goalsAchieved),
    totalProfessionals: Number(totalProfessionals),
    sessionsThisWeek: Number(sessionsThisWeek),
    newPatientsThisMonth: Number(newPatientsThisMonth),
  });
});

export default router;
