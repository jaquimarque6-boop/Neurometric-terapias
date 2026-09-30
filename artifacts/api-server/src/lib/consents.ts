import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { userConsentAcceptancesTable } from "@workspace/db/schema";

export type ConsentType = "terms" | "privacy" | "ai";

// Bump only the affected version when the corresponding notice changes.
const DEFAULT_VERSIONS: Record<ConsentType, string> = {
  terms: "1.0",
  privacy: "1.0",
  ai: "1.0",
};

export function currentConsentVersions(): Record<ConsentType, string> {
  return {
    terms: process.env.CONSENT_TERMS_VERSION || DEFAULT_VERSIONS.terms,
    privacy: process.env.CONSENT_PRIVACY_VERSION || DEFAULT_VERSIONS.privacy,
    ai: process.env.CONSENT_AI_VERSION || DEFAULT_VERSIONS.ai,
  };
}

export async function hasCurrentConsent(userId: number, type: ConsentType): Promise<boolean> {
  const version = currentConsentVersions()[type];
  const [row] = await db.select({ id: userConsentAcceptancesTable.id })
    .from(userConsentAcceptancesTable)
    .where(and(
      eq(userConsentAcceptancesTable.userId, userId),
      eq(userConsentAcceptancesTable.consentType, type),
      eq(userConsentAcceptancesTable.version, version),
    )).limit(1);
  return !!row;
}

export async function requireAiConsent(req: any, res: any): Promise<boolean> {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "No autenticado" });
    return false;
  }
  if (await hasCurrentConsent(userId, "ai")) return true;
  res.status(428).json({
    error: "Se requiere aceptar el aviso de uso de IA vigente.",
    code: "AI_CONSENT_REQUIRED",
    consentType: "ai",
    version: currentConsentVersions().ai,
  });
  return false;
}