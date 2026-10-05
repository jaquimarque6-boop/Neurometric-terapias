import assert from "node:assert/strict";
import { once } from "node:events";
import { after, test } from "node:test";
import { createRequire } from "node:module";
import vm from "node:vm";
import express from "express";
import { build } from "esbuild";
import * as schema from "@workspace/db/schema";

const now = new Date("2026-10-05T12:00:00.000Z");
const users = [
  {
    id: 1,
    email: "one@example.test",
    name: "Profesional Uno",
    role: "professional",
    specialty: null,
    active: true,
    createdAt: now,
    commercialStatus: "trial",
    trialStartDate: null,
    trialEndDate: null,
    lastPaymentDate: null,
    nextDueDate: null,
    monthlyAmount: null,
    paymentMethod: null,
    internalNotes: null,
    professionalId: 1,
  },
  {
    id: 2,
    email: "two@example.test",
    name: "Profesional Dos",
    role: "professional",
    specialty: null,
    active: true,
    createdAt: now,
    commercialStatus: "paying",
    trialStartDate: null,
    trialEndDate: null,
    lastPaymentDate: null,
    nextDueDate: null,
    monthlyAmount: null,
    paymentMethod: null,
    internalNotes: null,
    professionalId: 2,
  },
];

const unexpectedAuditRows = [{
  userId: 1,
  lastLoginAt: "2026-10-01T12:34:56.000Z",
  loginCount30Days: 3,
  patientSaved30Days: 2,
  clinicalRecordSaved30Days: 1,
  goalSaved30Days: 4,
  reportSaved30Days: 5,
  aiUsed30Days: 6,
  hasClinicalActivity: true,
}];

const db = {
  select() {
    return {
      from(table: object) {
        const query = {
          orderBy() { return query; },
          groupBy() { return query; },
          then(resolve: (value: any[]) => void, reject?: (error: unknown) => void) {
            try {
              const rows = table === schema.usersTable ? users
                : table === schema.userActivityEventsTable ? unexpectedAuditRows
                  : [];
              resolve(rows);
            } catch (error) {
              reject?.(error);
            }
          },
        };
        return query;
      },
    };
  },
};

const requireModule = createRequire(import.meta.url);
const bundle = await build({
  entryPoints: ["src/routes/users.ts"],
  absWorkingDir: new URL("../", import.meta.url).pathname,
  bundle: true,
  platform: "node",
  format: "cjs",
  write: false,
  external: ["express", "@workspace/db", "@workspace/db/schema", "drizzle-orm", "bcryptjs"],
  logLevel: "silent",
});
const routeModule = { exports: {} as any };
vm.runInNewContext(bundle.outputFiles[0].text, {
  module: routeModule,
  exports: routeModule.exports,
  require: (name: string) => {
    if (name === "@workspace/db") return { db };
    if (name === "@workspace/db/schema") return schema;
    return requireModule(name);
  },
  process: { env: {}, emitWarning: () => undefined },
  Buffer,
  Date,
  console,
  setTimeout,
  clearTimeout,
}, { filename: "users.ts" });

const app = express();
app.use((req: any, _res, next) => {
  req.session = { userId: 1, userRole: "admin" };
  next();
});
app.use("/api", routeModule.exports.default);
app.use((error: Error, _req: any, res: any, _next: any) => {
  res.status(500).json({ error: error.message });
});

const server = app.listen(0);
await once(server, "listening");
const address = server.address();
if (!address || typeof address === "string") throw new Error("Test server address unavailable");
after(() => server.close());

test("GET /api/users normalizes string audit dates and falls open when lastLoginAt is invalid", async () => {
  const validResponse = await fetch(`http://127.0.0.1:${address.port}/api/users`);
  const validBody = await validResponse.json() as any[];

  assert.equal(validResponse.status, 200, JSON.stringify(validBody));
  assert.deepEqual(validBody.map(user => user.id), [1, 2]);
  assert.equal(validBody[0].stats.activity.available, true);
  assert.equal(validBody[0].stats.activity.lastLoginAt, "2026-10-01T12:34:56.000Z");

  unexpectedAuditRows[0].lastLoginAt = "not-a-valid-timestamp";
  const invalidResponse = await fetch(`http://127.0.0.1:${address.port}/api/users`);
  const invalidBody = await invalidResponse.json() as any[];

  assert.equal(invalidResponse.status, 200, JSON.stringify(invalidBody));
  assert.deepEqual(invalidBody.map(user => user.id), [1, 2]);
  assert.equal(invalidBody[0].stats.pacientesAsignados, 0);
  assert.equal(invalidBody[0].stats.sesionesRegistradas, 0);
  assert.deepEqual(invalidBody[0].stats.activity, {
    available: false,
    status: "unavailable",
    lastLoginAt: null,
    loginCount30Days: 0,
    hasClinicalActivity: false,
    eventCounts30Days: {
      patientSaved: 0,
      clinicalRecordSaved: 0,
      goalSaved: 0,
      reportSaved: 0,
      aiUsed: 0,
    },
  });
  assert.equal(invalidBody[1].stats.activity.available, false);
});
