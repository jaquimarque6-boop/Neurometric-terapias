import assert from "node:assert/strict";
import { once } from "node:events";
import { test } from "node:test";
import bcrypt from "bcryptjs";
import { eq, inArray } from "drizzle-orm";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL is required. Refusing to run account access tests against the development database.",
  );
}

// @workspace/db prefers PG* variables when they are present. The test database
// must be selected explicitly, even in environments that inject PGHOST/PGDATABASE.
process.env.DATABASE_URL = testDatabaseUrl;
for (const key of ["PGHOST", "PGPORT", "PGUSER", "PGPASSWORD", "PGDATABASE"]) {
  delete process.env[key];
}
process.env.NODE_ENV = "test";

const { default: app } = await import("../src/app.ts");
const { db, pool } = await import("@workspace/db");
const {
  usersTable,
  patientsTable,
  registrosClinicosTable,
} = await import("@workspace/db/schema");

type Credentials = {
  cookie: string;
  token: string;
};

type ApiResult = {
  response: Response;
  body: any;
};

function readSessionCookie(response: Response): string {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const setCookies = headers.getSetCookie?.() ?? [headers.get("set-cookie") ?? ""];
  const sessionCookie = setCookies
    .flatMap((header) => header.split(/,(?=[^;]+?=)/))
    .map((header) => header.match(/connect\.sid=[^;]+/)?.[0])
    .find(Boolean);

  assert.ok(sessionCookie, "login should issue a connect.sid cookie");
  return sessionCookie;
}

async function jsonResult(response: Response): Promise<any> {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function request(
  baseUrl: string,
  path: string,
  init: RequestInit = {},
  credentials?: Partial<Credentials>,
): Promise<ApiResult> {
  const headers = new Headers(init.headers);
  headers.set("x-forwarded-proto", "https");
  if (credentials?.cookie) headers.set("cookie", credentials.cookie);
  if (credentials?.token) headers.set("authorization", `Bearer ${credentials.token}`);

  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  return { response, body: await jsonResult(response) };
}

async function login(baseUrl: string, email: string, password: string): Promise<Credentials> {
  const result = await request(baseUrl, "/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  assert.equal(result.response.status, 200, `login failed for ${email}`);
  assert.equal(result.body.email, email);
  assert.equal(typeof result.body.token, "string");
  return {
    cookie: readSessionCookie(result.response),
    token: result.body.token,
  };
}

test("deactivation revokes old credentials without deleting account data", async () => {
  const suffix = `${Date.now()}-${process.pid}`;
  const password = "security-test-password";
  const professionalEmail = `security-professional-${suffix}@example.test`;
  const adminEmail = `security-admin-${suffix}@example.test`;
  const secondAdminEmail = `security-mutator-${suffix}@example.test`;
  const passwordHash = await bcrypt.hash(password, 4);

  const [professional, admin, secondAdmin] = await db
    .insert(usersTable)
    .values([
      {
        email: professionalEmail,
        passwordHash,
        name: "Security Professional",
        role: "professional",
        active: true,
        professionalId: null,
        specialty: "Fonoaudiología",
      },
      {
        email: adminEmail,
        passwordHash,
        name: "Security Admin",
        role: "admin",
        active: true,
        professionalId: null,
        specialty: null,
      },
      {
        email: secondAdminEmail,
        passwordHash,
        name: "Security Mutator",
        role: "admin",
        active: true,
        professionalId: null,
        specialty: null,
      },
    ])
    .returning();

  const [patient] = await db
    .insert(patientsTable)
    .values({
      name: "Security Patient",
      age: 7,
      diagnosis: "Registro que debe conservarse",
      assignedProfessionalId: professional.id,
    })
    .returning();

  const [clinicalRecord] = await db
    .insert(registrosClinicosTable)
    .values({
      patientId: patient.id,
      patientName: patient.name,
      professionalName: professional.name,
      userId: professional.id,
      fecha: "2026-09-24",
      resumenSesion: "Registro clínico que debe conservarse",
    })
    .returning();

  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // An active professional can log in and use a protected route.
    const professionalCredentials = await login(baseUrl, professionalEmail, password);
    const activeMe = await request(baseUrl, "/api/auth/me", {}, professionalCredentials);
    assert.equal(activeMe.response.status, 200);
    assert.equal(activeMe.body.id, professional.id);
    assert.equal(activeMe.body.role, "professional");

    const adminCredentials = await login(baseUrl, adminEmail, password);
    const mutatorCredentials = await login(baseUrl, secondAdminEmail, password);
    const adminUsersBefore = await request(baseUrl, "/api/users", {}, adminCredentials);
    assert.equal(adminUsersBefore.response.status, 200);
    assert.ok(adminUsersBefore.body.some((user: any) => user.id === professional.id));

    // Deactivation is performed through the same protected admin flow used by
    // the UI, not by mutating the database behind the API's back.
    const deactivated = await request(
      baseUrl,
      `/api/users/${professional.id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ active: false }),
      },
      mutatorCredentials,
    );
    assert.equal(deactivated.response.status, 200);
    assert.equal(deactivated.body.active, false);

    // Both credentials were issued while the account was active. Each must
    // be rejected after the database state changes.
    const inactiveCookie = await request(
      baseUrl,
      "/api/auth/me",
      {},
      { cookie: professionalCredentials.cookie },
    );
    assert.equal(inactiveCookie.response.status, 401);

    const inactiveBearer = await request(
      baseUrl,
      "/api/auth/me",
      {},
      { token: professionalCredentials.token },
    );
    assert.equal(inactiveBearer.response.status, 401);

    const inactiveLogin = await request(baseUrl, "/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: professionalEmail, password }),
    });
    assert.equal(inactiveLogin.response.status, 403);

    // A previously issued admin token must use the current role from users,
    // rather than the role embedded in the token.
    const demoted = await request(
      baseUrl,
      `/api/users/${admin.id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: "professional" }),
      },
      mutatorCredentials,
    );
    assert.equal(demoted.response.status, 200);
    assert.equal(demoted.body.role, "professional");

    const oldAdminBearer = await request(baseUrl, "/api/users", {}, {
      token: adminCredentials.token,
    });
    assert.equal(oldAdminBearer.response.status, 403);
    const oldAdminCookie = await request(baseUrl, "/api/users", {}, {
      cookie: adminCredentials.cookie,
    });
    assert.equal(oldAdminCookie.response.status, 403);

    // Reactivation restores both the normal login flow and protected access.
    const reactivated = await request(
      baseUrl,
      `/api/users/${professional.id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ active: true }),
      },
      mutatorCredentials,
    );
    assert.equal(reactivated.response.status, 200);
    assert.equal(reactivated.body.active, true);

    const reactivatedCredentials = await login(baseUrl, professionalEmail, password);
    const reactivatedMe = await request(
      baseUrl,
      "/api/auth/me",
      {},
      reactivatedCredentials,
    );
    assert.equal(reactivatedMe.response.status, 200);
    assert.equal(reactivatedMe.body.id, professional.id);

    // The signed Bearer token was not deleted or blacklisted: once the account
    // is active again, the current database state authorizes it again.
    const oldBearerAfterReactivation = await request(
      baseUrl,
      "/api/auth/me",
      {},
      { token: professionalCredentials.token },
    );
    assert.equal(oldBearerAfterReactivation.response.status, 200);
    assert.equal(oldBearerAfterReactivation.body.id, professional.id);

    const [usersAfter, patientsAfter, recordsAfter] = await Promise.all([
      db
        .select({ id: usersTable.id, email: usersTable.email })
        .from(usersTable)
        .where(inArray(usersTable.id, [professional.id, admin.id, secondAdmin.id])),
      db
        .select({
          id: patientsTable.id,
          name: patientsTable.name,
          assignedProfessionalId: patientsTable.assignedProfessionalId,
        })
        .from(patientsTable)
        .where(eq(patientsTable.id, patient.id)),
      db
        .select({
          id: registrosClinicosTable.id,
          patientId: registrosClinicosTable.patientId,
          resumenSesion: registrosClinicosTable.resumenSesion,
        })
        .from(registrosClinicosTable)
        .where(eq(registrosClinicosTable.id, clinicalRecord.id)),
    ]);

    assert.deepEqual(
      usersAfter.map(({ id, email }) => ({ id, email })).sort((a, b) => a.id - b.id),
      [
        { id: professional.id, email: professionalEmail },
        { id: admin.id, email: adminEmail },
        { id: secondAdmin.id, email: secondAdminEmail },
      ].sort((a, b) => a.id - b.id),
    );
    assert.deepEqual(patientsAfter, [
      {
        id: patient.id,
        name: "Security Patient",
        assignedProfessionalId: professional.id,
      },
    ]);
    assert.deepEqual(recordsAfter, [
      {
        id: clinicalRecord.id,
        patientId: patient.id,
        resumenSesion: "Registro clínico que debe conservarse",
      },
    ]);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });

    await db
      .delete(registrosClinicosTable)
      .where(eq(registrosClinicosTable.id, clinicalRecord.id));
    await db.delete(patientsTable).where(eq(patientsTable.id, patient.id));
    await db
      .delete(usersTable)
      .where(inArray(usersTable.id, [professional.id, admin.id, secondAdmin.id]));
    await pool.end();
  }
});