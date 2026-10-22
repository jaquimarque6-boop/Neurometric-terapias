import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { UpdatePatientBody } from "@workspace/api-zod";
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
const { default: patientsRouter } = await import("../src/routes/patients");

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
      age integer,
      fecha_nacimiento text,
      diagnosis text,
      profesional_nombre text,
      assigned_professional_id integer,
      franja_etaria text,
      fecha_inicio text,
      progreso text,
      promedio_desempeno real,
      semaforo text,
      observaciones text,
      motivo_consulta text,
      antecedentes text,
      historia_familiar text,
      escolaridad text,
      lenguaje_comunicacion text,
      atencion_conducta text,
      voz_habla text,
      deglucion text,
      impresion_clinica text,
      rutinas_habitos text,
      entorno_participacion text,
      anamnesis_updated_at timestamptz,
      anamnesis_updated_by_user_id integer,
      informe_evolucion text,
      informe_familia text,
      informe_mensual text,
      perfil_ia text,
      perfil_ia_created_at timestamp,
      perfil_ia_updated_at timestamp,
      archived boolean NOT NULL DEFAULT false,
      archived_at timestamp,
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
      user_id integer,
      fecha text NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE goal_library (id serial PRIMARY KEY);
    CREATE TABLE goals (
      id serial PRIMARY KEY,
      patient_id integer NOT NULL,
      goal_library_id integer,
      codigo text,
      title text NOT NULL,
      description text,
      category text NOT NULL,
      area_clinica text,
      franja_etaria text,
      nivel_dificultad text,
      status text NOT NULL DEFAULT 'activo',
      progress_pct integer,
      fecha_asignacion text,
      target_date text,
      notas text,
      created_at timestamp NOT NULL DEFAULT now()
    );
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
  // Exercise the additive schema migration only on this disposable loopback DB.
  await pool.query("ALTER TABLE public.patients ADD COLUMN psychology_data jsonb");

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
    (req as any).session = {
      userId,
      userRole: role,
      userSpecialty: req.header("x-test-specialty") ?? null,
    };
    next();
  });
  testApp.use("/api", dashboardRouter);
  testApp.use("/api", usersRouter);
  testApp.use("/api", patientsRouter);
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
      specialty?: string;
      method?: string;
      body?: unknown;
    } = {}) => {
      const response = await fetch(`${baseUrl}${path}`, {
        method: options.method ?? "GET",
        headers: {
          ...(options.role && options.userId
            ? { "x-test-role": options.role, "x-test-user-id": String(options.userId) }
            : {}),
          ...(options.specialty ? { "x-test-specialty": options.specialty } : {}),
          ...(options.body === undefined ? {} : { "content-type": "application/json" }),
        },
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      });
      const text = await response.text();
      let body: any = null;
      try { body = JSON.parse(text); } catch { /* expected for some Express error responses */ }
      return { status: response.status, body, text };
    };

    const account = async (
      email: string,
      role: string,
      active = true,
      specialty: string | null = null,
    ) => {
      const [created] = await db.insert(usersTable).values({
        email,
        passwordHash: "fictitious-test-hash",
        name: `Cuenta ficticia ${email}`,
        role,
        specialty,
        active,
        commercialStatus: "trial",
        trialStartDate: "2026-10-01",
        trialEndDate: "2026-10-15",
        trialStartPending: false,
      }).returning();
      return created;
    };

    const admin = await account("admin@isolated.test", "admin");
    const professionalA = await account("professional-a@isolated.test", "professional", true, "Psicología");
    const professionalB = await account("professional-b@isolated.test", "professional", true, "Fonoaudiología");
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
      { patientId: patientA.id, userId: professionalA.id, fecha: ranges.weekStart, createdAt: staleCreatedAt },
      { patientId: patientA.id, userId: professionalA.id, fecha: sunday, createdAt: staleCreatedAt },
      { patientId: patientB.id, userId: professionalA.id, fecha: sunday, createdAt: staleCreatedAt },
      { patientId: patientA.id, userId: professionalA.id, fecha: ranges.nextWeekStart, createdAt: currentCreatedAt },
      { patientId: patientA.id, userId: professionalA.id, fecha: beforeWeek, createdAt: currentCreatedAt },
      { patientId: patientC.id, userId: professionalB.id, fecha: ranges.weekStart, createdAt: staleCreatedAt },
      { patientId: patientD.id, userId: admin.id, fecha: ranges.weekStart, createdAt: staleCreatedAt },
    ];
    for (const row of clinicalRows) {
      await pool.query(
        "INSERT INTO registros_clinicos (patient_id, user_id, fecha, created_at) VALUES ($1, $2, $3, $4)",
        [row.patientId, row.userId, row.fecha, row.createdAt],
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
    const listedProfessionalA = userList.body.find((user: any) => user.id === professionalA.id);
    const listedProfessionalB = userList.body.find((user: any) => user.id === professionalB.id);
    const listedInactiveProfessional = userList.body.find((user: any) => user.email === "inactive-professional@isolated.test");
    const listedAdmin = userList.body.find((user: any) => user.id === admin.id);
    assert.equal(listedProfessionalA.patientCount, 2, "patient total includes active and archived assigned patients");
    assert.equal(listedProfessionalB.patientCount, 1, "patient counts remain scoped to each account");
    assert.equal(listedInactiveProfessional.patientCount, 0, "no assigned patients is returned as a real zero");
    assert.equal(listedProfessionalA.clinicalSessionCount, 5, "session totals use the exact account relation across all dates");
    assert.equal(listedProfessionalB.clinicalSessionCount, 1, "sessions are attributed by recording account, not another professional's patient list");
    assert.equal(listedInactiveProfessional.clinicalSessionCount, 0, "no linked sessions is returned as a real zero");
    assert.equal(listedAdmin.patientCount, null, "clinical metrics do not apply to administrative accounts");
    assert.equal(listedAdmin.clinicalSessionCount, null, "clinical metrics do not apply to administrative accounts");
    assert.equal(JSON.stringify(userList.body).includes("Paciente ficticio"), false, "user metrics never return patient details");

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

    const section = (status: "not_explored" | "draft" | "recorded", text = "") => ({ status, text });
    const psychologyDataForAge = (age: number) => ({
      schemaVersion: 1 as const,
      anamnesis: {
        sections: {
          reasonAndExpectations: section("draft", `Motivo ficticio para paciente de ${age} años`),
          personalFamilyHistory: section("not_explored"),
          developmentalHistory: section("not_explored"),
          emotionalRegulation: section("not_explored"),
          behaviorDailyFunctioning: section("not_explored"),
          relationshipsSupport: section("not_explored"),
          lifeContext: section("not_explored"),
          sleepHabitsRoutines: section("not_explored"),
          strengthsInterestsResources: section("not_explored"),
          previousTreatmentsStrategies: section("not_explored"),
          riskAndProtection: section("not_explored"),
        },
      },
      evaluations: [{
        id: `00000000-0000-4000-8000-${String(age).padStart(12, "0")}`,
        title: `Evaluación ficticia ${age}`,
        date: "2026-10-22",
        status: "draft" as const,
        areas: {
          emotionalAffective: "Observación ficticia",
          behavioral: "",
          cognitiveExecutive: "",
          socialRelational: "",
          autonomyDailyFunctioning: "",
          copingEmotionalRegulation: "",
          strengthsResources: "",
        },
        interviews: [{
          id: `10000000-0000-4000-8000-${String(age).padStart(12, "0")}`,
          date: null,
          participant: "Informante ficticio",
          notes: "Nota de entrevista ficticia",
        }],
        instruments: [{
          id: `20000000-0000-4000-8000-${String(age).padStart(12, "0")}`,
          name: "Instrumento ficticio",
          version: "",
          date: "2026-10-22",
          results: "Resultado manual ficticio",
          interpretation: "Interpretación profesional ficticia",
        }],
        professionalInterpretation: "Borrador ficticio, sin diagnóstico ni puntuación automática.",
      }],
    });

    const psychologyPatientIds: Array<{ age: number; id: number; data: ReturnType<typeof psychologyDataForAge> }> = [];
    for (const age of [4, 10, 16, 35, 75]) {
      const inserted = await pool.query(
        `INSERT INTO patients (name, age, assigned_professional_id, motivo_consulta)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [`Paciente ficticio ${age}`, age, professionalA.id, "Motivo histórico sin modificar"],
      );
      const patientId = Number(inserted.rows[0]?.id);
      const psychologyData = psychologyDataForAge(age);
      const contractValidation = UpdatePatientBody.pick({ psychologyData: true }).safeParse({ psychologyData });
      assert.equal(
        contractValidation.success,
        true,
        `fictional psychology data must match OpenAPI: ${contractValidation.success ? "" : JSON.stringify(contractValidation.error.issues)}`,
      );
      const saved = await request(`/patients/${patientId}`, {
        role: "professional",
        userId: professionalA.id,
        specialty: "Psicología",
        method: "PUT",
        body: { psychologyData },
      });
      assert.equal(
        saved.status,
        200,
        `psychology data saves for the fictional ${age}-year-old patient: ${JSON.stringify(saved.body)}`,
      );
      assert.deepEqual(saved.body.psychologyData, psychologyData);
      assert.equal(saved.body.motivoConsulta, "Motivo histórico sin modificar");

      const loaded = await request(`/patients/${patientId}`, {
        role: "professional",
        userId: professionalA.id,
        specialty: "Psicología",
      });
      assert.equal(loaded.status, 200);
      assert.deepEqual(loaded.body.psychologyData, psychologyData, `psychology data reloads for age ${age}`);
      psychologyPatientIds.push({ age, id: patientId, data: psychologyData });
    }

    const psychologistList = await request("/patients", {
      role: "professional",
      userId: professionalA.id,
      specialty: "Psicología",
    });
    assert.equal(psychologistList.status, 200);
    assert.equal(
      psychologistList.body.some((patient: any) => Object.hasOwn(patient, "psychologyData")),
      false,
      "the general patient list does not include sensitive Psychology content",
    );

    const fonoPatient = await pool.query(
      `INSERT INTO patients (name, age, assigned_professional_id, motivo_consulta, psychology_data)
       VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING id`,
      [
        "Paciente ficticio de Fonoaudiología",
        10,
        professionalB.id,
        "Anamnesis heredada de Fonoaudiología",
        JSON.stringify(psychologyDataForAge(10)),
      ],
    );
    const fonoPatientId = Number(fonoPatient.rows[0]?.id);
    const fonoDetail = await request(`/patients/${fonoPatientId}`, {
      role: "professional",
      userId: professionalB.id,
      specialty: "Fonoaudiología",
    });
    assert.equal(fonoDetail.status, 200);
    assert.equal(Object.hasOwn(fonoDetail.body, "psychologyData"), false, "non-Psychology professionals cannot read the Psychology field");
    const fonoList = await request("/patients", {
      role: "professional",
      userId: professionalB.id,
      specialty: "Fonoaudiología",
    });
    assert.equal(fonoList.status, 200);
    assert.equal(
      fonoList.body.some((patient: any) => Object.hasOwn(patient, "psychologyData")),
      false,
      "other specialties do not receive Psychology content from list responses",
    );
    const fonoLegacyUpdate = await request(`/patients/${fonoPatientId}`, {
      role: "professional",
      userId: professionalB.id,
      specialty: "Fonoaudiología",
      method: "PUT",
      body: { motivoConsulta: "Anamnesis heredada actualizada" },
    });
    assert.equal(fonoLegacyUpdate.status, 200);
    assert.equal(Object.hasOwn(fonoLegacyUpdate.body, "psychologyData"), false, "unrelated updates do not expose Psychology content");
    const fonoStoredAfterLegacyUpdate = await pool.query(
      "SELECT psychology_data, motivo_consulta FROM patients WHERE id = $1",
      [fonoPatientId],
    );
    assert.deepEqual(fonoStoredAfterLegacyUpdate.rows[0]?.psychology_data, psychologyDataForAge(10));
    assert.equal(fonoStoredAfterLegacyUpdate.rows[0]?.motivo_consulta, "Anamnesis heredada actualizada");
    const deniedPsychologyWrite = await request(`/patients/${fonoPatientId}`, {
      role: "professional",
      userId: professionalB.id,
      specialty: "Fonoaudiología",
      method: "PUT",
      body: { psychologyData: psychologyDataForAge(10) },
    });
    assert.equal(deniedPsychologyWrite.status, 403, "other specialties cannot write Psychology data");

    const invalidPsychologyData = await request(`/patients/${psychologyPatientIds[0].id}`, {
      role: "professional",
      userId: professionalA.id,
      specialty: "Psicología",
      method: "PUT",
      body: { psychologyData: null },
    });
    assert.equal(invalidPsychologyData.status, 400, "null cannot accidentally erase Psychology data");

    await pool.query("DROP TABLE public.patients");
    const unavailablePatients = await request("/users", { role: "admin", userId: admin.id });
    assert.equal(unavailablePatients.status, 200, "a failed metric does not prevent the administrative user list");
    assert.equal(
      unavailablePatients.body.find((user: any) => user.id === professionalA.id).patientCount,
      null,
      "an uncomputable metric is distinct from a true zero",
    );
    assert.equal(
      unavailablePatients.body.find((user: any) => user.id === professionalA.id).clinicalSessionCount,
      5,
      "one metric can remain available when the other query fails",
    );

    await pool.query(
      "INSERT INTO registros_clinicos (patient_id, user_id, fecha) VALUES ($1, NULL, $2)",
      [patientA.id, "2020-01-01"],
    );
    const unattributedSessions = await request("/users", { role: "admin", userId: admin.id });
    assert.equal(unattributedSessions.status, 200);
    assert.equal(
      unattributedSessions.body.find((user: any) => user.id === professionalA.id).clinicalSessionCount,
      null,
      "unattributed historical sessions do not get guessed or silently omitted from professional totals",
    );

    await pool.query("DROP TABLE public.registros_clinicos");
    const unavailableSessions = await request("/users", { role: "admin", userId: admin.id });
    assert.equal(unavailableSessions.status, 200);
    assert.equal(
      unavailableSessions.body.find((user: any) => user.id === professionalA.id).clinicalSessionCount,
      null,
      "an uncomputable session total is distinct from a true zero",
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
    await pool.end();
  }
});
