import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { userConsentAcceptancesTable } from "@workspace/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { currentConsentVersions, type ConsentType } from "../lib/consents";

const router: IRouter = Router();
const ALLOWED = new Set<ConsentType>(["terms", "privacy", "ai"]);

router.get("/consents/status", async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "No autenticado" });
  const versions = currentConsentVersions();
  const rows = await db.select({
    consentType: userConsentAcceptancesTable.consentType,
    version: userConsentAcceptancesTable.version,
  }).from(userConsentAcceptancesTable).where(eq(userConsentAcceptancesTable.userId, userId));
  const accepted = {
    terms: rows.some(row => row.consentType === "terms" && row.version === versions.terms),
    privacy: rows.some(row => row.consentType === "privacy" && row.version === versions.privacy),
    ai: rows.some(row => row.consentType === "ai" && row.version === versions.ai),
  };
  return res.json({ versions, accepted });
});

router.post("/consents/accept", async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "No autenticado" });
  const types = req.body?.types;
  if (!Array.isArray(types) || types.length < 1 || types.length > 2 ||
      new Set(types).size !== types.length ||
      !types.every((type: unknown) => typeof type === "string" && ALLOWED.has(type as ConsentType)) ||
      (types.includes("ai") && types.length !== 1)) {
    return res.status(400).json({ error: "Tipos de aceptación inválidos" });
  }
  const versions = currentConsentVersions();
  const acceptedAt = new Date();
  await db.insert(userConsentAcceptancesTable).values(types.map((consentType: ConsentType) => ({
    userId,
    acceptedByUserId: userId,
    consentType,
    version: versions[consentType],
    acceptedAt,
  }))).onConflictDoNothing();
  const rows = await db.select().from(userConsentAcceptancesTable)
    .where(and(eq(userConsentAcceptancesTable.userId, userId), inArray(userConsentAcceptancesTable.consentType, types)));
  return res.json({
    accepted: rows.filter(row => types.includes(row.consentType as ConsentType)),
  });
});

export default router;