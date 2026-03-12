import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sessionsTable, patientsTable, professionalsTable } from "@workspace/db/schema";
import { CreateSessionBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/sessions", async (_req, res) => {
  const sessions = await db.select().from(sessionsTable).orderBy(sessionsTable.createdAt);
  
  const enriched = await Promise.all(sessions.map(async (s) => {
    let patientName = "";
    let professionalName = "";
    
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, s.patientId));
    if (patient) patientName = patient.name;
    
    if (s.professionalId) {
      const [pro] = await db.select().from(professionalsTable).where(eq(professionalsTable.id, s.professionalId));
      if (pro) professionalName = pro.name;
    }
    
    return { ...s, patientName, professionalName, createdAt: s.createdAt.toISOString() };
  }));
  
  res.json(enriched);
});

router.post("/sessions", async (req, res) => {
  const body = CreateSessionBody.parse(req.body);
  const [session] = await db.insert(sessionsTable).values(body).returning();
  res.status(201).json({ ...session, patientName: "", professionalName: "", createdAt: session.createdAt.toISOString() });
});

export default router;
