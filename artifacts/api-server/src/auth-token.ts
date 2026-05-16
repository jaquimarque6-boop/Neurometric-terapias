import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.SESSION_SECRET ?? "neurometric-secret-key-2024";
const TTL_MS = 7 * 24 * 3600_000;

function b64url(s: string): string {
  return Buffer.from(s).toString("base64url");
}

export function createAuthToken(userId: number, role: string): string {
  const payload = { userId, role, exp: Date.now() + TTL_MS };
  const encoded = b64url(JSON.stringify(payload));
  const sig = createHmac("sha256", SECRET).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyAuthToken(token: string): { userId: number; role: string } | null {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    const encoded = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    if (!encoded || !sig) return null;

    const expected = createHmac("sha256", SECRET).update(encoded).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Date.now()) return null;
    if (!payload.userId || !payload.role) return null;
    return { userId: Number(payload.userId), role: String(payload.role) };
  } catch {
    return null;
  }
}
