import assert from "node:assert/strict";
import { test } from "node:test";
import {
  REFERRAL_KEY, REFERRAL_TTL_MS, buildWhatsAppUrl, captureReferralCandidate,
  getPendingCandidates, getStoredReferral, normalizeReferralCode, validatePendingCandidates,
  type KVStorage, type ReferralValidator,
} from "./referral.ts";

function mem(): KVStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: k => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: k => void data.delete(k) };
}
// Synthetic registry: ANGIE active (synthetic test only, no real data), OLDCODE inactive.
const ACTIVE = new Set(["ANGIE", "TESTB"]);
const validator: ReferralValidator = async code => ({ valid: ACTIVE.has(code), code });

test("normalizes codes and rejects garbage", () => {
  assert.equal(normalizeReferralCode(" angie "), "ANGIE");
  assert.equal(normalizeReferralCode("a"), null);
  assert.equal(normalizeReferralCode("an gie"), null);
  assert.equal(normalizeReferralCode("<script>"), null);
  assert.equal(normalizeReferralCode(null), null);
});

test("captures /?ref=angie synchronously and stores it after server validation", async () => {
  const s = mem();
  assert.equal(captureReferralCandidate("?ref=angie", s, 0), "ANGIE");
  assert.equal(getStoredReferral(s, 0), null, "candidate is untrusted before validation");
  const r = await validatePendingCandidates(validator, s, () => 1000);
  assert.equal(r?.code, "ANGIE");
  assert.equal(getStoredReferral(s, 2000)?.code, "ANGIE");
  assert.deepEqual(getPendingCandidates(s), []);
});

test("persists for 30 days then expires", async () => {
  const s = mem();
  captureReferralCandidate("?ref=angie", s, 0);
  await validatePendingCandidates(validator, s, () => 0);
  assert.equal(getStoredReferral(s, REFERRAL_TTL_MS - 1)?.code, "ANGIE");
  assert.equal(getStoredReferral(s, REFERRAL_TTL_MS), null);
  assert.equal(s.getItem(REFERRAL_KEY), null, "expired entry purged");
});

test("invalid or inactive code is discarded and never stored", async () => {
  const s = mem();
  captureReferralCandidate("?ref=oldcode", s, 0);
  assert.equal(await validatePendingCandidates(validator, s, () => 0), null);
  assert.equal(getStoredReferral(s, 0), null);
  assert.deepEqual(getPendingCandidates(s), []);
});

test("first valid wins: later valid or invalid codes cannot overwrite", async () => {
  const s = mem();
  captureReferralCandidate("?ref=angie", s, 0);
  await validatePendingCandidates(validator, s, () => 0);
  assert.equal(captureReferralCandidate("?ref=testb", s, 10), null);
  assert.equal(captureReferralCandidate("?ref=oldcode", s, 10), null);
  await validatePendingCandidates(validator, s, () => 10);
  assert.equal(getStoredReferral(s, 10)?.code, "ANGIE");
});

test("invalid first candidate does not block a later valid one; order preserved", async () => {
  const s = mem();
  captureReferralCandidate("?ref=oldcode", s, 0);
  captureReferralCandidate("?ref=testb", s, 0);
  captureReferralCandidate("?ref=angie", s, 0);
  const r = await validatePendingCandidates(validator, s, () => 0);
  assert.equal(r?.code, "TESTB");
});

test("after expiry a new valid code can be captured", async () => {
  const s = mem();
  captureReferralCandidate("?ref=angie", s, 0);
  await validatePendingCandidates(validator, s, () => 0);
  assert.equal(captureReferralCandidate("?ref=testb", s, REFERRAL_TTL_MS + 1), "TESTB");
  const r = await validatePendingCandidates(validator, s, () => REFERRAL_TTL_MS + 1);
  assert.equal(r?.code, "TESTB");
});

test("network failure keeps candidate for retry; concurrent calls share one request", async () => {
  const s = mem();
  captureReferralCandidate("?ref=angie", s, 0);
  assert.equal(await validatePendingCandidates(async () => { throw new Error("offline"); }, s, () => 0), null);
  assert.deepEqual(getPendingCandidates(s), ["ANGIE"]);
  let calls = 0;
  const counting: ReferralValidator = async c => { calls++; return validator(c); };
  const [a, b] = await Promise.all([validatePendingCandidates(counting, s, () => 0), validatePendingCandidates(counting, s, () => 0)]);
  assert.equal(calls, 1);
  assert.equal(a?.code, "ANGIE");
  assert.equal(b?.code, "ANGIE");
});

test("server-normalized code is what gets stored, tampered storage is ignored", async () => {
  const s = mem();
  s.setItem(REFERRAL_KEY, JSON.stringify({ code: "bad code!", expiresAt: 1e15 }));
  assert.equal(getStoredReferral(s, 0), null);
  s.setItem(REFERRAL_KEY, "{not json");
  assert.equal(getStoredReferral(s, 0), null);
});

test("WhatsApp builder has no whitelist and only appends normalized codes", () => {
  assert.equal(buildWhatsAppUrl("", "hola", "ANGIE"), null);
  const u = buildWhatsAppUrl("+54 9 11", "Hola", "testb")!;
  assert.ok(u.startsWith("https://wa.me/54911?text="));
  assert.ok(decodeURIComponent(u).endsWith("Referencia: TESTB"));
  assert.ok(!decodeURIComponent(buildWhatsAppUrl("1", "Hola", null)!).includes("Referencia"));
});
