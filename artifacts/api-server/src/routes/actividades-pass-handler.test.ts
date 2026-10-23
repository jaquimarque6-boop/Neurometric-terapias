import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import test from "node:test";
import { isTrustedActivitiesOrigin, type ActivitiesPassAccount } from "../lib/actividades-pass";
import { createActivitiesPassHandler } from "./actividades-pass-handler";

const TEST_SECRET = "synthetic-test-secret-".padEnd(64, "x");
const NOW = new Date("2026-10-23T15:00:00.000Z");
const TEST_JTI = "123e4567-e89b-42d3-a456-426614174000";

const paidProfessional: ActivitiesPassAccount = {
  id: 418,
  email: "profesional@example.test",
  role: "professional",
  active: true,
  commercialStatus: "paying",
  trialStartDate: null,
  trialEndDate: null,
  lastPaymentDate: "2026-10-01",
  nextDueDate: "2026-10-31",
};

type RequestOptions = {
  sessionUserId?: number | null;
  account?: ActivitiesPassAccount | null;
  secret?: string;
  now?: Date;
  jti?: string;
  origin?: string;
};

async function requestPass(options: RequestOptions = {}) {
  const app = express();
  app.use((req, _res, next) => {
    Object.defineProperty(req, "session", {
      configurable: true,
      value: options.sessionUserId == null ? {} : { userId: options.sessionUserId },
    });
    next();
  });
  app.post("/api/actividades/pase", createActivitiesPassHandler({
    getAccount: async () => options.account === undefined ? paidProfessional : options.account,
    getSecret: () => options.secret === undefined ? TEST_SECRET : options.secret,
    now: () => options.now ?? NOW,
    createJti: options.jti ? () => options.jti! : undefined,
  }));

  const server = createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/actividades/pase`, {
      method: "POST",
      headers: options.origin ? { Origin: options.origin } : undefined,
    });
    return { response, body: await response.json() as Record<string, unknown> };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
}

function decodeSegment(segment: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as Record<string, unknown>;
}

test("emits the Lovable HS256 pass format with the exact claims and two-minute lifetime", async () => {
  const jti = "123e4567-e89b-42d3-a456-426614174000";
  const { response, body } = await requestPass({ sessionUserId: paidProfessional.id, jti });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(Object.keys(body), ["pase"]);
  assert.equal(typeof body.pase, "string");

  const token = body.pase as string;
  const parts = token.split(".");
  assert.equal(parts.length, 3);
  const header = decodeSegment(parts[0]);
  const payload = decodeSegment(parts[1]);
  assert.deepEqual(header, { alg: "HS256", typ: "JWT" });
  assert.deepEqual(payload, {
    iss: "neurometric-terapias",
    aud: "neurometric-actividades",
    sub: String(paidProfessional.id),
    email: paidProfessional.email,
    subscription_active: true,
    jti,
    iat: Math.floor(NOW.getTime() / 1000),
    exp: Math.floor(NOW.getTime() / 1000) + 120,
  });
  assert.equal(
    parts[2],
    createHmac("sha256", TEST_SECRET).update(`${parts[0]}.${parts[1]}`).digest("base64url"),
  );
});

test("rejects missing sessions and non-professional roles", async () => {
  const unauthenticated = await requestPass();
  assert.equal(unauthenticated.response.status, 401);
  assert.deepEqual(unauthenticated.body, { error: "unauthenticated" });

  const admin = await requestPass({
    sessionUserId: 2,
    account: { ...paidProfessional, id: 2, role: "admin" },
  });
  assert.equal(admin.response.status, 403);
  assert.deepEqual(admin.body, { error: "forbidden" });

  const inactive = await requestPass({
    sessionUserId: paidProfessional.id,
    account: { ...paidProfessional, active: false, commercialStatus: "courtesy" },
  });
  assert.equal(inactive.response.status, 401);
});

test("accepts only Neurometric Terapias origins for browser pass requests", async () => {
  const officialDomain = await requestPass({
    sessionUserId: paidProfessional.id,
    origin: "https://neurometricterapias.com",
  });
  assert.equal(officialDomain.response.status, 200);

  const unrelatedNetlifySite = await requestPass({
    sessionUserId: paidProfessional.id,
    origin: "https://other-app.netlify.app",
  });
  assert.equal(unrelatedNetlifySite.response.status, 403);
  assert.deepEqual(unrelatedNetlifySite.body, { error: "forbidden" });

  assert.equal(isTrustedActivitiesOrigin("https://workspace.replit.dev", "test"), true);
  assert.equal(isTrustedActivitiesOrigin("https://workspace.replit.dev", "production"), false);
});

test("allows paid subscriptions and trials only while their valid dates are current", async () => {
  const paid = await requestPass({ sessionUserId: paidProfessional.id });
  assert.equal(paid.response.status, 200);

  const currentTrial = await requestPass({
    sessionUserId: 419,
    account: {
      ...paidProfessional,
      id: 419,
      commercialStatus: "trial",
      trialStartDate: "2026-10-10",
      trialEndDate: "2026-10-24",
      lastPaymentDate: null,
      nextDueDate: null,
    },
  });
  assert.equal(currentTrial.response.status, 200);

  const lastMomentOfTrial = await requestPass({
    sessionUserId: 419,
    now: new Date("2026-10-25T02:59:59.000Z"),
    account: {
      ...paidProfessional,
      id: 419,
      commercialStatus: "trial",
      trialStartDate: "2026-10-10",
      trialEndDate: "2026-10-24",
      lastPaymentDate: null,
      nextDueDate: null,
    },
  });
  assert.equal(lastMomentOfTrial.response.status, 200);

  const firstMomentAfterTrial = await requestPass({
    sessionUserId: 419,
    now: new Date("2026-10-25T03:00:00.000Z"),
    account: {
      ...paidProfessional,
      id: 419,
      commercialStatus: "trial",
      trialStartDate: "2026-10-10",
      trialEndDate: "2026-10-24",
      lastPaymentDate: null,
      nextDueDate: null,
    },
  });
  assert.equal(firstMomentAfterTrial.response.status, 402);

  const futureTrial = await requestPass({
    sessionUserId: 419,
    account: {
      ...paidProfessional,
      id: 419,
      commercialStatus: "trial",
      trialStartDate: "2026-10-24",
      trialEndDate: "2026-11-07",
      lastPaymentDate: null,
      nextDueDate: null,
    },
  });
  assert.equal(futureTrial.response.status, 402);

  const expiredTrial = await requestPass({
    sessionUserId: 420,
    account: {
      ...paidProfessional,
      id: 420,
      commercialStatus: "trial",
      trialStartDate: "2026-10-01",
      trialEndDate: "2026-10-22",
      lastPaymentDate: null,
      nextDueDate: null,
    },
  });
  assert.equal(expiredTrial.response.status, 402);
  assert.deepEqual(expiredTrial.body, { error: "subscription_inactive" });

  const expiredPaidSubscription = await requestPass({
    sessionUserId: 422,
    account: {
      ...paidProfessional,
      id: 422,
      lastPaymentDate: "2026-10-01",
      nextDueDate: "2026-10-22",
    },
  });
  assert.equal(expiredPaidSubscription.response.status, 402);

  const missingPaymentDates = await requestPass({
    sessionUserId: 421,
    account: { ...paidProfessional, id: 421, lastPaymentDate: null, nextDueDate: null },
  });
  assert.equal(missingPaymentDates.response.status, 402);
});

test("allows active courtesy accounts without billing dates and rejects overdue or churned statuses", async () => {
  const courtesy = await requestPass({
    sessionUserId: 423,
    account: {
      ...paidProfessional,
      id: 423,
      commercialStatus: "courtesy",
      trialStartDate: null,
      trialEndDate: null,
      lastPaymentDate: null,
      nextDueDate: null,
    },
  });
  assert.equal(courtesy.response.status, 200);

  for (const commercialStatus of ["overdue", "churned"]) {
    const denied = await requestPass({
      sessionUserId: 424,
      account: { ...paidProfessional, id: 424, commercialStatus },
    });
    assert.equal(denied.response.status, 402, `${commercialStatus} must not receive a pass`);
  }
});

test("does not issue a pass when the shared signing secret is missing or too short", async () => {
  const missing = await requestPass({ sessionUserId: paidProfessional.id, secret: "" });
  assert.equal(missing.response.status, 503);
  assert.deepEqual(missing.body, { error: "service_unavailable" });

  const short = await requestPass({ sessionUserId: paidProfessional.id, secret: "short" });
  assert.equal(short.response.status, 503);
});
