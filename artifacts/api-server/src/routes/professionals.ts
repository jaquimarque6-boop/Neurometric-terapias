import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { professionalsTable, patientsTable } from "@workspace/db/schema";
import { CreateProfessionalBody } from "@workspace/api-zod";
import { eq, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/professionals", async (_req, res) => {
  const professionals = await db.select().from(professionalsTable).orderBy(professionalsTable.createdAt);
  
  const withCounts = await Promise.all(professionals.map(async (pro) => {
    const [{ value }] = await db
      .select({ value: count() })
      .from(patientsTable)
      .where(eq(patientsTable.professionalId, pro.id));
    return { ...pro, patientCount: Number(value), createdAt: pro.createdAt.toISOString() };
  }));
  
  res.json(withCounts);
});

router.post("/professionals", async (req, res) => {
  const body = CreateProfessionalBody.parse(req.body);
  const [professional] = await db.insert(professionalsTable).values(body).returning();
  res.status(201).json({ ...professional, createdAt: professional.createdAt.toISOString() });
});

export default router;
