import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { reviewCommercialAccount } from "../lib/commercial-policy";
const router = Router();
// Read-only and informational; never changes authentication or clinical access.
router.get("/commercial/me", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "No autenticado" });
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (!user) return res.status(401).json({ error: "No autenticado" });
  return res.json({
    ...reviewCommercialAccount(user), commercialStatus: user.commercialStatus,
    trialStartDate: user.trialStartDate, trialEndDate: user.trialEndDate,
    lastPaymentDate: user.lastPaymentDate, nextDueDate: user.nextDueDate,
  });
});
export default router;
