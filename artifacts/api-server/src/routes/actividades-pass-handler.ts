import type { RequestHandler } from "express";
import { commercialToday } from "../lib/commercial-policy";
import {
  hasActiveActivitiesSubscription,
  isTrustedActivitiesOrigin,
  signActivitiesPass,
  type ActivitiesPassAccount,
} from "../lib/actividades-pass";

type ActivitiesPassDependencies = {
  getAccount: (userId: number) => Promise<ActivitiesPassAccount | null>;
  getSecret: () => string | undefined;
  now?: () => Date;
  createJti?: () => string;
  allowOrigin?: (origin: string) => boolean;
};

export function createActivitiesPassHandler(
  dependencies: ActivitiesPassDependencies,
): RequestHandler {
  return async (req, res): Promise<void> => {
    res.setHeader("Cache-Control", "no-store");

    const sessionUserId = (req as typeof req & {
      session?: { userId?: unknown };
    }).session?.userId;
    if (typeof sessionUserId !== "number" || !Number.isSafeInteger(sessionUserId) || sessionUserId <= 0) {
      res.status(401).json({ error: "unauthenticated" });
      return;
    }

    let account: ActivitiesPassAccount | null;
    try {
      account = await dependencies.getAccount(sessionUserId);
    } catch {
      res.status(503).json({ error: "service_unavailable" });
      return;
    }

    if (!account || !account.active) {
      res.status(401).json({ error: "unauthenticated" });
      return;
    }
    if (account.role !== "professional") {
      res.status(403).json({ error: "forbidden" });
      return;
    }

    const origin = req.get("origin");
    const allowOrigin = dependencies.allowOrigin ?? isTrustedActivitiesOrigin;
    if (origin && !allowOrigin(origin)) {
      res.status(403).json({ error: "forbidden" });
      return;
    }

    const now = dependencies.now?.() ?? new Date();
    if (!hasActiveActivitiesSubscription(account, commercialToday(now))) {
      res.status(402).json({ error: "subscription_inactive" });
      return;
    }

    const secret = dependencies.getSecret();
    if (!secret || Buffer.byteLength(secret, "utf8") < 64 || !secret.trim()) {
      res.status(503).json({ error: "service_unavailable" });
      return;
    }

    const pase = signActivitiesPass(
      account,
      secret,
      now,
      dependencies.createJti?.(),
    );
    res.status(200).json({ pase });
  };
}
