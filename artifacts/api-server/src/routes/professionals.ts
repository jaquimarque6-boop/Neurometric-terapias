import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { professionalsTable, patientProfessionalsTable } from "@workspace/db/schema";
import { CreateProfessionalBody } from "@workspace/api-zod";
import { eq, count } from "drizzle-orm";

const router: IRouter = Router();

function requireAdmin(req: any, res: any): boolean {
  if (!req.session?.userId) {
    res.status(401).json({ error: "No autenticado" });
    return false;
  }
  if (req.session.userRole !== "admin") {
    res.status(403).json({ error: "Solo administradores pueden gestionar profesionales" });
    return false;
  }
  return true;
}

router.get("/professionals", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const professionals = await db.select().from(professionalsTable).orderBy(professionalsTable.createdAt);

  const withCounts = await Promise.all(professionals.map(async (pro) => {
    const [{ value }] = await db
      .select({ value: count() })
      .from(patientProfessionalsTable)
      .where(eq(patientProfessionalsTable.professionalId, pro.id));
    return { ...pro, patientCount: Number(value), createdAt: pro.createdAt.toISOString() };
  }));

  res.json(withCounts);
});

router.post("/professionals", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const body = CreateProfessionalBody.parse(req.body);
  const [professional] = await db.insert(professionalsTable).values(body).returning();
  res.status(201).json({ ...professional, createdAt: professional.createdAt.toISOString() });
});

export default router;
