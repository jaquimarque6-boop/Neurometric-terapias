import { createHmac, randomUUID } from "node:crypto";
import { validCommercialDate } from "./commercial-policy";

export type ActivitiesPassAccount = {
  id: number;
  email: string;
  role: string;
  active: boolean;
  commercialStatus: string;
  trialStartDate: string | null;
  trialEndDate: string | null;
  lastPaymentDate: string | null;
  nextDueDate: string | null;
};

export function isTrustedActivitiesOrigin(
  origin: string,
  nodeEnv = process.env.NODE_ENV,
): boolean {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (url.origin !== origin) return false;

  const hostname = url.hostname.toLowerCase();
  if (url.protocol === "https:") {
    if (
      hostname === "neurometricterapias.com"
      || hostname.endsWith(".neurometricterapias.com")
      || hostname === "neurometricterapias.netlify.app"
      || hostname.endsWith("--neurometricterapias.netlify.app")
    ) {
      return true;
    }
  }

  if (nodeEnv === "development" || nodeEnv === "test") {
    const isLoopback = ["localhost", "127.0.0.1", "::1"].includes(hostname);
    if (isLoopback && ["http:", "https:"].includes(url.protocol)) return true;
    if (
      url.protocol === "https:"
      && (hostname.endsWith(".replit.dev") || hostname.endsWith(".replit.app"))
    ) {
      return true;
    }
  }

  return false;
}

export function hasActiveActivitiesSubscription(
  account: ActivitiesPassAccount,
  today: string,
): boolean {
  if (!account.active || account.role !== "professional") return false;

  if (account.commercialStatus === "trial") {
    return validCommercialDate(account.trialStartDate)
      && validCommercialDate(account.trialEndDate)
      && account.trialStartDate <= today
      && today <= account.trialEndDate;
  }

  if (account.commercialStatus === "paying") {
    return validCommercialDate(account.lastPaymentDate)
      && validCommercialDate(account.nextDueDate)
      && account.lastPaymentDate <= today
      && account.lastPaymentDate <= account.nextDueDate
      && today <= account.nextDueDate;
  }

  return false;
}

export function signActivitiesPass(
  account: ActivitiesPassAccount,
  secret: string,
  now: Date,
  jti: string = randomUUID(),
): string {
  const iat = Math.floor(now.getTime() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: "neurometric-terapias",
    aud: "neurometric-actividades",
    sub: String(account.id),
    email: account.email,
    subscription_active: true,
    jti,
    iat,
    exp: iat + 120,
  })).toString("base64url");
  const signingInput = `${header}.${payload}`;
  const signature = createHmac("sha256", secret).update(signingInput).digest("base64url");
  return `${signingInput}.${signature}`;
}
