import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { goalsTable, patientsTable } from "@workspace/db/schema";
import { CreateGoalBody, UpdateGoalBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/goals", async (_req, res) => {
  const goals = await db.select().from(goalsTable).orderBy(goalsTable.createdAt);
  
  const enriched = await Promise.all(goals.map(async (g) => {
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, g.patientId));
    return { ...g, patientName: patient?.name ?? "", createdAt: g.createdAt.toISOString() };
  }));
  
  res.json(enriched);
});

router.post("/goals", async (req, res) => {
  const body = CreateGoalBody.parse(req.body);
  const [goal] = await db.insert(goalsTable).values(body).returning();
  res.status(201).json({ ...goal, patientName: "", createdAt: goal.createdAt.toISOString() });
});

router.patch("/goals/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const body = UpdateGoalBody.parse(req.body);
  const [goal] = await db.update(goalsTable).set(body).where(eq(goalsTable.id, id)).returning();
  if (!goal) return res.status(404).json({ error: "Goal not found" });
  
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, goal.patientId));
  res.json({ ...goal, patientName: patient?.name ?? "", createdAt: goal.createdAt.toISOString() });
});

export default router;
