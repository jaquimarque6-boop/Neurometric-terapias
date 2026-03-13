import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { goalLibraryTable, goalsTable, patientsTable } from "@workspace/db/schema";
import { AssignGoalToPatientBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/goal-library", async (_req, res) => {
  const items = await db.select().from(goalLibraryTable).orderBy(goalLibraryTable.modulo, goalLibraryTable.area);
  res.json(items.map(i => ({ ...i, createdAt: i.createdAt.toISOString() })));
});

router.post("/goal-library/:id/assign", async (req, res) => {
  const libraryId = parseInt(req.params.id);
  const body = AssignGoalToPatientBody.parse(req.body);

  const [libraryGoal] = await db.select().from(goalLibraryTable).where(eq(goalLibraryTable.id, libraryId));
  if (!libraryGoal) return res.status(404).json({ error: "Library goal not found" });

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, body.patientId));

  const [goal] = await db.insert(goalsTable).values({
    patientId: body.patientId,
    title: libraryGoal.nombreObjetivo,
    description: libraryGoal.definicionOperativa ?? "",
    category: "cognitive",
    status: "pending",
    targetDate: body.targetDate ?? null,
  }).returning();

  res.status(201).json({
    ...goal,
    patientName: patient?.name ?? "",
    createdAt: goal.createdAt.toISOString(),
  });
});

export default router;
