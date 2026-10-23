import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { createActivitiesPassHandler } from "./actividades-pass-handler";

const router: IRouter = Router();

router.post("/actividades/pase", createActivitiesPassHandler({
  getAccount: async (userId) => {
    const [user] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        role: usersTable.role,
        active: usersTable.active,
        commercialStatus: usersTable.commercialStatus,
        trialStartDate: usersTable.trialStartDate,
        trialEndDate: usersTable.trialEndDate,
        lastPaymentDate: usersTable.lastPaymentDate,
        nextDueDate: usersTable.nextDueDate,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    return user ?? null;
  },
  getSecret: () => process.env.ACTIVIDADES_PASS_SECRET,
}));

export default router;
