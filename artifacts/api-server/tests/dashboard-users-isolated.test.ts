import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { eq } from "drizzle-orm";
import { canRoleAccessApiRoute } from "../src/routes/access-policy";
import { getDashboardCalendarRanges } from "../src/lib/dashboard-calendar";

const databaseUrl = process.env.DATABASE_URL;
const databaseName = "neurometric_isolated_test";
const expectedPort = "55439";

if (process.env.NEUROMETRIC_ISOLATED_DB !== "1" || !databaseUrl) {
  throw new Error("This test requires the explicitly isolated local PostgreSQL test database.");
}
if (process.env.PGHOST || process.env.PGDATABASE || process.env.PGPORT || process.env.PGUSER) {
  throw new Error("Unset PG* overrides before running the isolated database test.");
}

const parsedDatabaseUrl = new URL(databaseUrl);
if (
  !["127.0.0.1", "localhost"].includes(parsedDatabaseUrl.hostname) ||
  parsedDatabaseUrl.port !== expectedPort ||
  decodeURIComponent(parsedDatabaseUrl.pathname.slice(1)) !== databaseName
) {
  throw new Error("Refusing to run outside the named localhost-only test database.");
}

process.env.NODE_ENV = "test";

const {
  db,
  pool,
  usersTable,
  saasStatusEventsTable,
} = await import("@workspace/db");
const { default: dashboardRouter } = await import("../src/routes/dashboard");
const { default: usersRouter } = await import("../src/routes/users");

const addDays = (date: string, days: number) => {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

async function createTestSchema() {
  const existing = await pool.query("SELECT to_regclass('public.users') AS users_table");
  assert.equal(existing.rows[0]?.users_table, null, "test database must start empty");

  await pool.query(`
    CREATE TABLE users (
      id serial PRIMARY KEY,
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      role text NOT NULL DEFAULT 'professional',
      professional_id integer,
      name text NOT NULL,
      specialty text,
      active boolean NOT NULL DEFAULT true,
      commercial_status text NOT NULL DEFAULT 'trial',
      trial_start_date date,
      trial_end_date date,
      trial_start_pending boolean NOT NULL DEFAULT false,
      last_payment_date date,
      next_due_date date,
      monthly_amount numeric,
      payment_method text,
      internal_notes text,
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE patients (
      id serial PRIMARY KEY,
      name text NOT NULL,
      assigned_professional_id integer,
      archived boolean NOT NULL DEFAULT false,
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE registros (
      id serial PRIMARY KEY,
      patient_id integer NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE registros_clinicos (
      id serial PRIMARY KEY,
      patient_id integer NOT NULL,
      fecha text NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE goal_library (id serial PRIMARY KEY);
    CREATE TABLE saas_status_events (
      id serial PRIMARY KEY,
      professional_user_id integer NOT NULL,
      event text NOT NULL CONSTRAINT saas_status_events_event_check
        CHECK (event IN ('baseline', 'first_paid', 'cancellation', 'reactivation')),
      actor_user_id integer NOT NULL,
      effective_date date NOT NULL,
      occurred_at timestamptz NOT NULL DEFAULT now(),
      details jsonb
    );
  `);
}

test("summary SQL, role scope, and trial-end edit work only against fake isolated PostgreSQL data", async () => {
  const databaseInfo = await pool.query(
    "SELECT current_database() AS database_name, inet_server_addr()::text AS server_address",
  );
  assert.equal(databaseInfo.rows[0]?.database_name, databaseName);
  const serverAddress = String(databaseInfo.rows[0]?.server_address ?? "").split("/")[0];
  assert.ok(
    ["127.0.0.1", "::1"].includes(serverAddress),
    `database server must be loopback-only; received ${serverAddress || "no TCP address"}`,
  );

  await createTestSchema();

  const testApp = express();
  testApp.use(express.json());
  testApp.use("/api", (req, res, next) => {
    const role = req.header("x-test-role");
    const userId = Number(req.header("x-test-user-id"));
    if (!role || !Number.isSafeInteger(userId) || userId < 1) {
      next();
      return;
    }

    const path = `${req.baseUrl}${req.path}`;
    if (!canRoleAccessApiRoute(role, req.method, path)) {
      res.status(403).json({ error: "Acceso denegado" });
      return;
    }
    (req as any).session = { userId, userRole: role };
    next();
  });
  testApp.use("/api", dashboardRouter);
  testApp.use("/api", usersRouter);
  let lastRouteError: any;
  testApp.use((error: any, _req: unknown, res: express.Response, _next: unknown) => {
    lastRouteError = error;
    res.status(500).type("html").send("<!doctype html><html><body><pre>Internal Server Error</pre></body></html>");
  });

  const server = testApp.listen(0);
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.once("listening", resolve);
    });
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const baseUrl = `http://127.0.0.1:${address.port}/api`;

    const request = async (path: string, options: {
      role?: string;
      userId?: number;
      method?: string;
      body?: unknown;
    } = {}) => {
      const response = await fetch(`${baseUrl}${path}`, {
        method: options.method ?? "GET",
        headers: {
          ...(options.role && options.userId
            ? { "x-test-role": options.role, "x-test-user-id": String(options.userId) }
            : {}),
          ...(options.body === undefined ? {} : { "content-type": "application/json" }),
        },
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      });
      const text = await response.text();
      let body: any = null;
      try { body = JSON.parse(text); } catch { /* expected for some Express error responses */ }
      return { status: response.status, body, text };
    };

    const account = async (email: string, role: string, active = true) => {
      const [created] = await db.insert(usersTable).values({
        email,
        passwordHash: "fictitious-test-hash",
        name: `Cuenta ficticia ${email}`,
        role,
        active,
        commercialStatus: "trial",
        trialStartDate: "2026-10-01",
        trialEndDate: "2026-10-15",
        trialStartPending: false,
      }).returning();
      return created;
    };

    const admin = await account("admin@isolated.test", "admin");
    const professionalA = await account("professional-a@isolated.test", "professional");
    const professionalB = await account("professional-b@isolated.test", "professional");
    await account("inactive-professional@isolated.test", "professional", false);
    const collaborator = await account("collaborator@isolated.test", "collaborator");

    const ranges = getDashboardCalendarRanges(new Date());
    const addPatient = async (
      name: string,
      assignedProfessionalId: number | null,
      archived: boolean,
      createdAt: Date,
    ) => {
      const result = await pool.query(
        `INSERT INTO patients (name, assigned_professional_id, archived, created_at)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [name, assignedProfessionalId, archived, createdAt],
      );
      return { id: Number(result.rows[0].id) };
    };
    const patientA = await addPatient(
      "Paciente ficticio A",
      professionalA.id,
      false,
      new Date(ranges.monthStartAt.getTime() + 60 * 60 * 1000),
    );
    const patientB = await addPatient(
      "Paciente ficticio archivado B",
      professionalA.id,
      true,
      new Date(ranges.monthStartAt.getTime() + 2 * 60 * 60 * 1000),
    );
    const patientC = await addPatient(
      "Paciente ficticio C",
      professionalB.id,
      false,
      new Date(ranges.nextMonthStartAt.getTime() + 60 * 60 * 1000),
    );
    const patientD = await addPatient(
      "Paciente ficticio archivado D",
      null,
      true,
      new Date(ranges.monthStartAt.getTime() - 24 * 60 * 60 * 1000),
    );

    const sunday = addDays(ranges.nextWeekStart, -1);
    const beforeWeek = addDays(ranges.weekStart, -1);
    const staleCreatedAt = new Date("2000-01-01T00:00:00.000Z");
    const currentCreatedAt = new Date();
    const clinicalRows = [
      { patientId: patientA.id, fecha: ranges.weekStart, createdAt: staleCreatedAt },
      { patientId: patientA.id, fecha: sunday, createdAt: staleCreatedAt },
      { patientId: patientB.id, fecha: sunday, createdAt: staleCreatedAt },
      { patientId: patientA.id, fecha: ranges.nextWeekStart, createdAt: currentCreatedAt },
      { patientId: patientA.id, fecha: beforeWeek, createdAt: currentCreatedAt },
      { patientId: patientC.id, fecha: ranges.weekStart, createdAt: staleCreatedAt },
      { patientId: patientD.id, fecha: ranges.weekStart, createdAt: staleCreatedAt },
    ];
    for (const row of clinicalRows) {
      await pool.query(
        "INSERT INTO registros_clinicos (patient_id, fecha, created_at) VALUES ($1, $2, $3)",
        [row.patientId, row.fecha, row.createdAt],
      );
    }
    await pool.query(
      "INSERT INTO registros (patient_id) VALUES ($1), ($2)",
      [patientA.id, patientB.id],
    );

    const unauthenticated = await request("/dashboard/stats");
    assert.equal(unauthenticated.status, 401);

    const adminStats = await request("/dashboard/stats", { role: "admin", userId: admin.id });
    assert.equal(adminStats.status, 200);
    assert.equal(adminStats.body.totalProfessionals, 2, "counts active professional user accounts only");
    assert.equal(adminStats.body.totalPatients, 4, "registered patients include archived records");
    assert.equal(adminStats.body.activeSessions, 2);
    assert.equal(adminStats.body.goalsAchieved, 0);
    assert.equal(adminStats.body.newPatientsThisMonth, 2, "new patients include archived records in the current local month");
    assert.equal(adminStats.body.sessionsThisWeek, 5, "counts clinical session dates in Monday-through-Sunday calendar week");
    assert.equal(JSON.stringify(adminStats.body).includes("Paciente ficticio"), false, "summary response must not expose patient details");

    const professionalAStats = await request("/dashboard/stats", {
      role: "professional",
      userId: professionalA.id,
    });
    assert.equal(professionalAStats.status, 200);
    assert.equal(professionalAStats.body.totalPatients, 2);
    assert.equal(professionalAStats.body.activeSessions, 2);
    assert.equal(professionalAStats.body.goalsAchieved, 0);
    assert.equal(professionalAStats.body.totalProfessionals, 2);
    assert.equal(professionalAStats.body.newPatientsThisMonth, 2);
    assert.equal(professionalAStats.body.sessionsThisWeek, 3, "professional sees only sessions for assigned patients");

    const professionalBStats = await request("/dashboard/stats", {
      role: "professional",
      userId: professionalB.id,
    });
    assert.equal(professionalBStats.status, 200);
    assert.equal(professionalBStats.body.totalPatients, 1);
    assert.equal(professionalBStats.body.activeSessions, 0);
    assert.equal(professionalBStats.body.goalsAchieved, 0);
    assert.equal(professionalBStats.body.totalProfessionals, 2);
    assert.equal(professionalBStats.body.newPatientsThisMonth, 0);
    assert.equal(professionalBStats.body.sessionsThisWeek, 1);

    assert.equal(
      (await request("/dashboard/stats", { role: "collaborator", userId: collaborator.id })).status,
      403,
    );
    assert.equal(
      (await request("/dashboard/stats", { role: "unknown", userId: collaborator.id })).status,
      403,
    );

    const userList = await request("/users", { role: "admin", userId: admin.id });
    assert.equal(userList.status, 200);
    const editableUser = userList.body.find((user: any) => user.id === professionalA.id);
    assert.ok(editableUser?.commercialRevision);

    const editPayload = (user: any, trialEndDate: string) => ({
      name: user.name,
      email: user.email,
      specialty: user.specialty,
      commercialStatus: user.commercialStatus,
      expectedCommercialRevision: user.commercialRevision,
      trialStartDate: user.trialStartDate,
      trialEndDate,
      lastPaymentDate: user.lastPaymentDate,
      nextDueDate: user.nextDueDate,
      monthlyAmount: user.monthlyAmount ?? "",
      paymentMethod: user.paymentMethod,
      internalNotes: user.internalNotes,
    });
    const deniedEdit = await request(`/users/${professionalA.id}`, {
      role: "professional",
      userId: professionalA.id,
      method: "PATCH",
      body: { trialEndDate: "2026-12-01" },
    });
    assert.equal(deniedEdit.status, 403, "professional cannot edit commercial dates");

    const newTrialEndDate = addDays(ranges.monthStart, 30);
    const rejectedByLegacyConstraint = await request(`/users/${professionalA.id}`, {
      role: "admin",
      userId: admin.id,
      method: "PATCH",
      body: editPayload(editableUser, newTrialEndDate),
    });
    assert.equal(rejectedByLegacyConstraint.status, 500);
    assert.match(rejectedByLegacyConstraint.text, /Internal Server Error/);
    assert.equal(
      rejectedByLegacyConstraint.body,
      null,
      "Express's production-style unhandled error response is not JSON",
    );
    const databaseError = lastRouteError?.cause ?? lastRouteError;
    assert.equal(databaseError?.code, "23514", "PostgreSQL check_violation rejects commercial_correction");
    assert.equal(databaseError?.constraint, "saas_status_events_event_check");

    const unchanged = await db
      .select({ trialEndDate: usersTable.trialEndDate })
      .from(usersTable)
      .where(eq(usersTable.id, professionalA.id));
    assert.equal(
      unchanged[0]?.trialEndDate,
      editableUser.trialEndDate,
      "audit constraint failure rolls the date update back",
    );

    // Replace only the disposable test fixture schema with the corrected event
    // constraint; no production migration is run by this test.
    await pool.query(`
      DROP TABLE public.saas_status_events;
      CREATE TABLE public.saas_status_events (
        id serial PRIMARY KEY,
        professional_user_id integer NOT NULL,
        event text NOT NULL CONSTRAINT saas_status_events_event_check CHECK (
          event IN (
            'baseline','first_paid','cancellation','reactivation',
            'commercial_status_changed','commercial_correction','trial_started','payment_renewal'
          )
        ),
        actor_user_id integer NOT NULL,
        effective_date date NOT NULL,
        occurred_at timestamptz NOT NULL DEFAULT now(),
        details jsonb
      );
    `);

    const updated = await request(`/users/${professionalA.id}`, {
      role: "admin",
      userId: admin.id,
      method: "PATCH",
      body: editPayload(editableUser, newTrialEndDate),
    });
    assert.equal(updated.status, 200, `admin trial-end edit should save; received ${updated.status}`);
    assert.equal(updated.body.trialEndDate, newTrialEndDate);
    const eventRows = await db.select().from(saasStatusEventsTable);
    assert.equal(eventRows.length, 1);
    assert.equal(eventRows[0]?.event, "commercial_correction");
    assert.deepEqual(eventRows[0]?.details && (eventRows[0].details as any).after.trialEndDate, newTrialEndDate);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
    await pool.end();
  }
});
