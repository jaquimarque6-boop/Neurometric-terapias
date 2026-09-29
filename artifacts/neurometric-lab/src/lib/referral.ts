// Single source of truth for the collaborator referral flow on the browser.
//
// Flow:
//  1. `captureReferralCandidate(search)` runs SYNCHRONOUSLY in main.tsx before
//     React mounts, so the `?ref=` query survives any auth redirect ("/" -> "/login").
//     The raw value is only a *candidate*: untrusted until the server says so.
//  2. `validatePendingCandidates(validator)` asks `GET /api/referrals/:code` and
//     promotes the FIRST valid candidate to the stored referral (30 days).
//  3. Once a valid, non-expired referral exists, nothing can overwrite it
//     (first valid wins). Invalid / inactive codes are simply discarded.
//
// Storage is first-party localStorage of THIS browser only. It is not shared
// across devices or browsers.

export const REFERRAL_KEY = "nm_referral";
export const REFERRAL_CANDIDATES_KEY = "nm_referral_candidates";
export const REFERRAL_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_CANDIDATES = 5;

export type StoredReferral = { code: string; validatedAt: number; expiresAt: number };
export type ReferralValidation = { valid: boolean; code: string };
export type ReferralValidator = (code: string) => Promise<ReferralValidation>;

export interface KVStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultStorage(): KVStorage | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

/** Uppercase ASCII letters/digits, 2–32 chars. Returns null if not a plausible code. */
export function normalizeReferralCode(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const code = String(raw).trim().toUpperCase();
  return /^[A-Z0-9]{2,32}$/.test(code) ? code : null;
}

function readJSON<T>(s: KVStorage, key: string): T | null {
  try {
    const v = s.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

function safeSet(s: KVStorage, key: string, value: unknown) {
  try { s.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}
function safeRemove(s: KVStorage, key: string) {
  try { s.removeItem(key); } catch { /* ignore */ }
}

/** Returns the validated, non-expired referral or null (expired entries are purged). */
export function getStoredReferral(storage: KVStorage | null = defaultStorage(), now = Date.now()): StoredReferral | null {
  if (!storage) return null;
  const r = readJSON<StoredReferral>(storage, REFERRAL_KEY);
  if (!r || typeof r.code !== "string" || typeof r.expiresAt !== "number") {
    if (r) safeRemove(storage, REFERRAL_KEY);
    return null;
  }
  if (r.expiresAt <= now || !normalizeReferralCode(r.code)) {
    safeRemove(storage, REFERRAL_KEY);
    return null;
  }
  return r;
}

export function getPendingCandidates(storage: KVStorage | null = defaultStorage()): string[] {
  if (!storage) return [];
  const list = readJSON<unknown>(storage, REFERRAL_CANDIDATES_KEY);
  return Array.isArray(list) ? list.map(c => normalizeReferralCode(String(c))).filter((c): c is string => !!c) : [];
}

/** Synchronous capture from a query string. Never trusts the value; only queues it. */
export function captureReferralCandidate(search: string, storage: KVStorage | null = defaultStorage(), now = Date.now()): string | null {
  if (!storage) return null;
  let raw: string | null = null;
  try { raw = new URLSearchParams(search).get("ref"); } catch { return null; }
  const code = normalizeReferralCode(raw);
  if (!code) return null;
  // First valid wins: a live validated referral blocks any new candidate.
  if (getStoredReferral(storage, now)) return null;
  const list = getPendingCandidates(storage);
  if (!list.includes(code)) {
    list.push(code);
    safeSet(storage, REFERRAL_CANDIDATES_KEY, list.slice(0, MAX_CANDIDATES));
  }
  return code;
}

/**
 * Validates queued candidates in arrival order. The first one the server
 * confirms is stored for 30 days; invalid ones are dropped. Network errors keep
 * the remaining candidates for a later retry. Safe to call concurrently: an
 * in-flight promise is shared.
 */
let inflight: Promise<StoredReferral | null> | null = null;
export function validatePendingCandidates(
  validator: ReferralValidator,
  storage: KVStorage | null = defaultStorage(),
  now: () => number = Date.now,
): Promise<StoredReferral | null> {
  if (inflight) return inflight;
  inflight = (async () => {
    if (!storage) return null;
    const existing = getStoredReferral(storage, now());
    if (existing) { safeRemove(storage, REFERRAL_CANDIDATES_KEY); return existing; }
    const queue = getPendingCandidates(storage);
    while (queue.length) {
      const candidate = queue[0];
      let result: ReferralValidation;
      try {
        result = await validator(candidate);
      } catch {
        safeSet(storage, REFERRAL_CANDIDATES_KEY, queue); // retry later
        return null;
      }
      queue.shift();
      // Re-check: another tab may have stored a valid referral meanwhile.
      const raced = getStoredReferral(storage, now());
      if (raced) { safeRemove(storage, REFERRAL_CANDIDATES_KEY); return raced; }
      const serverCode = normalizeReferralCode(result?.code);
      if (result?.valid === true && serverCode) {
        const t = now();
        const stored: StoredReferral = { code: serverCode, validatedAt: t, expiresAt: t + REFERRAL_TTL_MS };
        safeSet(storage, REFERRAL_KEY, stored);
        safeRemove(storage, REFERRAL_CANDIDATES_KEY);
        return stored;
      }
      safeSet(storage, REFERRAL_CANDIDATES_KEY, queue);
    }
    safeRemove(storage, REFERRAL_CANDIDATES_KEY);
    return null;
  })().finally(() => { inflight = null; });
  return inflight;
}

/** Single WhatsApp link builder. Appends the validated referral code when present. */
export function buildWhatsAppUrl(number: string, message: string, referralCode: string | null): string | null {
  const digits = (number ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const code = normalizeReferralCode(referralCode);
  const text = code ? `${message}\n\nReferencia: ${code}` : message;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
