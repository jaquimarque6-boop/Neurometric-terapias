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
        id:        req.session?.id        ?? null,
        userId:    req.session?.userId    ?? null,
        userRole:  req.session?.userRole  ?? null,
        userEmail: req.session?.userEmail ?? null,
      },
      request: {
        protocol:           req.protocol,
        secure:             req.secure,
        xForwardedProto:    req.headers["x-forwarded-proto"] ?? null,
        origin:             req.headers.origin ?? null,
        cookieHeader:       req.headers.cookie ? "present" : "absent",
      },
      db: {
        userCount: userCount.length,
        host: (process.env.DATABASE_URL ?? "").replace(/:\/\/[^@]+@/, "://<redacted>@"),
      },
      env: {
        NODE_ENV:       process.env.NODE_ENV     ?? "unset",
        SESSION_SECRET: process.env.SESSION_SECRET ? "set" : "using-default",
        FRONTEND_URL:   process.env.FRONTEND_URL ?? "unset",
      },
      cookieConfig: {
        sameSite: "none",
        secure:   true,
        httpOnly: true,
        proxy:    true,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "error desconocido" });
  }
});

export default router;
