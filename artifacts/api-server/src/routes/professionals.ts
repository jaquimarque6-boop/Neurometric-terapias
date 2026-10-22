import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { professionalsTable } from "@workspace/db/schema";
import { CreateProfessionalBody } from "@workspace/api-zod";

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
  return res.json(professionals.map(pro => ({
    ...pro,
    createdAt: pro.createdAt.toISOString(),
  })));
});

router.post("/professionals", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const body = CreateProfessionalBody.parse(req.body);
  const [professional] = await db.insert(professionalsTable).values(body).returning();
  res.status(201).json({ ...professional, createdAt: professional.createdAt.toISOString() });
});

export default router;
