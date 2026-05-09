import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/debug/session", async (req, res) => {
  try {
    const userCount = await db.select({ id: usersTable.id }).from(usersTable);
    res.json({
      session: {
        userId:    req.session?.userId    ?? null,
        userRole:  req.session?.userRole  ?? null,
        userEmail: req.session?.userEmail ?? null,
      },
      db: {
        userCount: userCount.length,
        dbHost: (process.env.DATABASE_URL ?? "").replace(/:[^@]*@/, ":***@").replace(/\/\/[^:]*:[^@]*@/, "//**:**@"),
      },
      cookie: req.headers.cookie ? "present" : "absent",
      origin: req.headers.origin ?? null,
      env: process.env.NODE_ENV ?? null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "db error" });
  }
});

export default router;
