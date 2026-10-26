import assert from "node:assert/strict";
import { after, test } from "node:test";
import { once } from "node:events";
import express from "express";
import { readFile } from "node:fs/promises";

const databaseUrl = process.env.PERSONAL_NOTES_TEST_DATABASE_URL;
const databaseName = "neurometric_personal_notes_test";
const expectedPort = "55449";

if (!databaseUrl) {
  throw new Error("Set PERSONAL_NOTES_TEST_DATABASE_URL to the isolated localhost test database.");
}
if (process.env.PGHOST || process.env.PGDATABASE || process.env.PGPORT || process.env.PGUSER) {
  throw new Error("Unset PG* overrides before running the isolated personal-notes test.");
}

const parsedUrl = new URL(databaseUrl);
if (
  !["127.0.0.1", "localhost"].includes(parsedUrl.hostname) ||
  parsedUrl.port !== expectedPort ||
  decodeURIComponent(parsedUrl.pathname.slice(1)) !== databaseName
) {
  throw new Error("Refusing personal-notes integration tests outside the named localhost-only database.");
}

process.env.DATABASE_URL = databaseUrl;
process.env.NODE_ENV = "test";

const [{ db, pool }, { default: personalNotesRouter }] = await Promise.all([
  import("@workspace/db"),
  import("../src/routes/personal-notes"),
]);

const dbAddress = await pool.query<{ database: string; address: string | null }>(
  "SELECT current_database() AS database, inet_server_addr()::text AS address",
);
assert.equal(dbAddress.rows[0]?.database, databaseName);
assert.ok(
  ["127.0.0.1", "localhost"].includes((dbAddress.rows[0]?.address ?? "").replace(/\/\d+$/, "")),
  "test PostgreSQL must listen only on loopback",
);

await pool.query(`
  CREATE TABLE users (
    id serial PRIMARY KEY,
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    role text NOT NULL DEFAULT 'professional',
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )
`);
const migrationSql = await readFile(new URL("../../../docs/sql/personal-notes.sql", import.meta.url), "utf8");
await pool.query(migrationSql);

const app = express();
app.use(express.json());
app.use("/api", (req, _res, next) => {
  const userId = req.header("x-test-user-id");
  const role = req.header("x-test-user-role") ?? "professional";
  (req as any).session = userId ? { userId: Number(userId), userRole: role } : {};
  next();
});
app.use("/api", personalNotesRouter);

const server = app.listen(0, "127.0.0.1");
await once(server, "listening");
const address = server.address();
if (!address || typeof address === "string") throw new Error("Test server unavailable");
const base = `http://127.0.0.1:${address.port}/api`;
const fixtureTag = `personal-notes-${process.pid}-${Date.now()}`;
const userIds: number[] = [];

const request = async (method: string, path: string, userId?: number, body?: unknown, role = "professional") => {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(userId === undefined ? {} : { "x-test-user-id": String(userId), "x-test-user-role": role }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return {
    status: response.status,
    body: response.status === 204 ? null : await response.json().catch(() => null),
  };
};

const createUser = async (role: string, suffix: string) => {
  const result = await pool.query<{ id: number }>(
    "INSERT INTO users (email, password_hash, role, name) VALUES ($1, $2, $3, $4) RETURNING id",
    [`${fixtureTag}-${suffix}@example.test`, "synthetic-only", role, `Synthetic ${suffix}`],
  );
  const id = Number(result.rows[0].id);
  userIds.push(id);
  return id;
};

after(async () => {
  try {
    if (userIds.length) await pool.query("DELETE FROM users WHERE id = ANY($1::int[])", [userIds]);
  } finally {
    await pool.query("DROP TABLE IF EXISTS personal_notes; DROP TABLE IF EXISTS users");
    await new Promise<void>(resolve => server.close(() => resolve()));
    await pool.end();
  }
});

test("la API usa PostgreSQL real aislado y no permite acceder a notas de otra cuenta", async () => {
  const userA = await createUser("professional", "a");
  const userB = await createUser("admin", "b");
  assert.equal((await request("GET", "/personal-notes")).status, 401);

  const createdA = await request("POST", "/personal-notes", userA, {
    content: "Privada A",
    reminderDate: "2026-10-29",
  });
  const createdB = await request("POST", "/personal-notes", userB, { content: "Privada B" }, "admin");
  assert.equal(createdA.status, 201);
  assert.equal(createdB.status, 201);

  const aId = createdA.body.id as number;
  const bId = createdB.body.id as number;
  assert.deepEqual((await request("GET", "/personal-notes", userA)).body.map((row: any) => row.id), [aId]);
  assert.deepEqual((await request("GET", "/personal-notes", userB, undefined, "admin")).body.map((row: any) => row.id), [bId]);
  assert.equal((await request("PATCH", `/personal-notes/${bId}`, userA, { content: "No autorizado" })).status, 404);
  assert.equal((await request("DELETE", `/personal-notes/${bId}`, userA)).status, 404);

  const changedA = await request("PATCH", `/personal-notes/${aId}`, userA, {
    isPinned: true,
    isCompleted: true,
    reminderDate: null,
  });
  assert.equal(changedA.status, 200);
  assert.equal(changedA.body.isPinned, true);
  assert.equal(changedA.body.isCompleted, true);
  assert.equal(changedA.body.reminderDate, null);
  assert.equal((await request("GET", "/personal-notes", userB, undefined, "admin")).body[0].content, "Privada B");
  assert.equal((await request("DELETE", `/personal-notes/${aId}`, userA)).status, 204);
});
