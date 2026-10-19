import assert from "node:assert/strict";
import { test } from "node:test";
import { once } from "node:events";
import bcrypt from "bcryptjs";
import { eq, inArray, sql } from "drizzle-orm";
import { addDays, addCalendarMonth, commercialToday } from "../src/lib/commercial-policy";

// Explicit development opt-in, synthetic ID-scoped fixtures only. No seeds,
// credentials from real users, production URLs, external AI or object storage.
if (process.env.RUN_COMMERCIAL_DEV_TESTS !== "1" || process.env.NODE_ENV === "production") {
  throw new Error("Set RUN_COMMERCIAL_DEV_TESTS=1 for synthetic tests in heliumdb only.");
}
process.env.NODE_ENV = "test";
const { db, pool, usersTable, patientsTable, registrosClinicosTable, goalsTable,
  patientReportsTable, patientFilesTable, saasReceiptsTable, saasStatusEventsTable,
  collaboratorsTable, referralAttributionsTable } = await import("@workspace/db");
const database = await pool.query("SELECT current_database() AS name");
if (database.rows[0]?.name !== "heliumdb") {
  await pool.end();
  throw new Error("Refusing tests outside development heliumdb.");
}
const { default: app } = await import("../src/app");
const { createAuthToken } = await import("../src/auth-token");

test("commercial verification integration with temporary accounts and fictitious clinical data", async t => {
  const server = app.listen(0);
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api`;
  const prefix = `commercial-test-${process.pid}-${Date.now()}`;
  const ids: number[] = [];
  const patientIds: number[] = [];
  const password = "Synthetic-commercial-only-2026!";
  const passwordHash = await bcrypt.hash(password, 4);
  const today = commercialToday();
  const baseline = async () => (await pool.query(`
    SELECT md5(coalesce(string_agg(concat_ws('|',id,active,role,commercial_status,
      trial_start_date,trial_end_date,last_payment_date,next_due_date,trial_start_pending),
      ',' ORDER BY id),'')) AS fingerprint FROM users WHERE NOT (id = ANY($1::int[]))`, [ids])).rows[0].fingerprint;
  const beforeExisting = await baseline();
  t.after(async () => {
    try {
      assert.equal(await baseline(), beforeExisting, "pre-existing accounts must remain unchanged");
    } finally {
      try {
        await db.transaction(async tx => {
          if (patientIds.length) {
            await tx.delete(patientFilesTable).where(inArray(patientFilesTable.patientId, patientIds));
            await tx.delete(patientReportsTable).where(inArray(patientReportsTable.patientId, patientIds));
            await tx.delete(goalsTable).where(inArray(goalsTable.patientId, patientIds));
            await tx.delete(registrosClinicosTable).where(inArray(registrosClinicosTable.patientId, patientIds));
            await tx.delete(patientsTable).where(inArray(patientsTable.id, patientIds));
          }
          if (ids.length) {
            await tx.execute(sql`DELETE FROM express_sessions WHERE sess->>'userId' IN (${sql.join(ids.map(id => sql`${String(id)}`), sql`, `)})`);
            await tx.delete(saasReceiptsTable).where(inArray(saasReceiptsTable.professionalUserId, ids));
            await tx.delete(saasStatusEventsTable).where(inArray(saasStatusEventsTable.professionalUserId, ids));
            await tx.delete(referralAttributionsTable).where(inArray(referralAttributionsTable.professionalUserId, ids));
            await tx.delete(collaboratorsTable).where(inArray(collaboratorsTable.userId, ids));
            await tx.delete(usersTable).where(inArray(usersTable.id, ids));
          }
        });
      } finally {
        server.close();
        await pool.end();
      }
    }
  });
  const make = async (overrides: Partial<typeof usersTable.$inferInsert> = {}) => {
    const [user] = await db.insert(usersTable).values({
      name: "Profesional ficticia", email: `${prefix}-${ids.length}@example.test`,
      role: "professional", passwordHash, ...overrides,
    }).returning();
    ids.push(user.id);
    return user;
  };
  const read = async (id: number) => (await db.select().from(usersTable).where(eq(usersTable.id, id)))[0];
  const request = async (method: string, path: string, user?: { id: number; role: string }, body?: unknown) => {
    const res = await fetch(base + path, {
      method, headers: { "content-type": "application/json",
        ...(user ? { authorization: `Bearer ${createAuthToken(user.id, user.role)}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: res.status, body: await res.json() as any };
  };
  const login = (u: typeof usersTable.$inferSelect) => request("POST", "/auth/login", undefined, { email: u.email, password });
  const admin = await make({ role: "admin" });
  const legacy = await make();
  const professional = await make({ commercialStatus: "paying", lastPaymentDate: addDays(today, -20), nextDueDate: addDays(today, 10) });

  await t.test("new public/admin-created trials start exactly once on enabled login, not registration or failed login", async () => {
    const registration = await request("POST", "/auth/register", undefined, {
      name: "Prueba nueva ficticia", email: `${prefix}-signup@example.test`, password,
    });
    assert.equal(registration.status, 201);
    ids.push(registration.body.id);
    const fresh = await read(registration.body.id);
    assert.equal(fresh.trialStartPending, true);
    assert.equal(fresh.trialStartDate, null);
    assert.equal((await request("POST", "/auth/login", undefined, { email: fresh.email, password: "wrong" })).status, 401);
    assert.equal((await read(fresh.id)).trialStartDate, null);
    const logins = await Promise.all([login(fresh), login(fresh)]);
    assert.deepEqual(logins.map(r => r.status), [200, 200]);
    const started = await read(fresh.id);
    assert.equal(started.trialStartDate, today);
    assert.equal(started.trialEndDate, addDays(today, 14));
    assert.equal(started.trialStartPending, false);
    assert.equal((await request("GET", "/commercial/me", fresh)).body.daysRemaining, 15);
    await request("POST", "/auth/logout", fresh);
    await login(fresh);
    assert.deepEqual(await read(fresh.id), started);
    assert.equal((await db.select().from(saasStatusEventsTable).where(eq(saasStatusEventsTable.professionalUserId, fresh.id))).length, 1);
    const created = await request("POST", "/users", admin, {
      name: "Creada por admin", email: `${prefix}-admin-created@example.test`, password,
    });
    assert.equal(created.status, 201);
    ids.push(created.body.id);
    assert.equal((await read(created.body.id)).trialStartPending, true);
    await login(await read(created.body.id));
    assert.equal((await read(created.body.id)).trialStartDate, today);
  });
  await t.test("old trials/admin accounts are never backfilled and expiry never denies clinical access", async () => {
    await login(legacy);
    assert.deepEqual(await read(legacy.id), legacy);
    await login(admin);
    assert.deepEqual(await read(admin.id), admin);
    const expired = await make({ trialStartDate: addDays(today, -20), trialEndDate: addDays(today, -6) });
    assert.equal((await login(expired)).status, 200);
    const review = (await request("GET", "/commercial/me", expired)).body;
    assert.equal(review.blockingEnabled, false);
    assert.equal(review.needsReview, true);
    assert.ok(review.issues.some((i: any) => i.code === "expired"));
    assert.equal((await request("GET", "/patients", expired)).status, 200);
    assert.equal((await request("GET", "/users", legacy)).status, 403);
    assert.equal((await request("GET", `/users/${legacy.id}/commercial-history`, legacy)).status, 403);
    assert.equal((await request("PATCH", `/users/${legacy.id}`, legacy, { trialStartDate: today })).status, 403);
  });
  await t.test("confirmed renewal is atomic and idempotent, keeps paid days and frozen commissions", async () => {
    const collabUser = await make({ role: "collaborator" });
    const [collab] = await db.insert(collaboratorsTable).values({
      userId: collabUser.id, name: "Colaboradora ficticia", country: "Test", code: `T${Date.now()}`,
      commissionPercent: "40.00", active: true,
    }).returning();
    await db.insert(referralAttributionsTable).values({
      professionalUserId: professional.id, collaboratorId: collab.id, codeUsed: collab.code,
      source: "admin_user_create", createdByUserId: admin.id,
    });
    const payload = { professionalUserId: professional.id, receivedAt: today,
      amount: "100.00", currency: "ARS", reference: `${prefix}-transfer-1`, idempotencyKey: `${prefix}-key1` };
    assert.equal((await request("POST", "/saas/receipts", legacy, payload)).status, 403);
    const preview = await request("GET", `/saas/renewal-preview?professionalUserId=${professional.id}&receivedAt=${today}`, admin);
    assert.equal(preview.body.periodFrom, professional.nextDueDate);
    const responses = await Promise.all([
      request("POST", "/saas/receipts", admin, payload), request("POST", "/saas/receipts", admin, payload),
    ]);
    assert.deepEqual(responses.map(r => r.status).sort(), [200, 201]);
    assert.equal(responses[0].body.id, responses[1].body.id);
    const firstReceipt = responses[0].body;
    assert.equal(firstReceipt.commissionAmount, "40.00");
    assert.equal(firstReceipt.commissionPercentSnapshot, "40.00");
    const renewed = await read(professional.id);
    assert.equal(renewed.lastPaymentDate, today);
    assert.equal(renewed.nextDueDate, addCalendarMonth(professional.nextDueDate!));
    assert.equal((await request("POST", "/saas/receipts", admin, { ...payload, amount: "101.00" })).status, 409);
    assert.equal((await request("POST", "/saas/receipts", admin, { ...payload, idempotencyKey: `${prefix}-other-key` })).status, 409);
    assert.deepEqual(await read(professional.id), renewed);
    await db.update(collaboratorsTable).set({ commissionPercent: "25.00" }).where(eq(collaboratorsTable.id, collab.id));
    const second = await request("POST", "/saas/receipts", admin, {
      ...payload, reference: `${prefix}-transfer-2`, idempotencyKey: `${prefix}-key2`,
    });
    assert.equal(second.status, 201);
    assert.equal(second.body.commissionAmount, "25.00");
    assert.equal((await read(professional.id)).nextDueDate, addCalendarMonth(renewed.nextDueDate!));
    const frozen = (await db.select().from(saasReceiptsTable).where(eq(saasReceiptsTable.id, firstReceipt.id)))[0];
    assert.equal(frozen.commissionAmount, "40.00");
    assert.equal(frozen.commissionPercentSnapshot, "40.00");
    const history = await request("GET", `/users/${professional.id}/commercial-history`, admin);
    assert.equal(history.body.filter((e: any) => e.event === "payment_renewal").length, 2);
  });
  await t.test("late renewals start at receipt date; state changes alone are not payments; manual corrections are audited", async () => {
    const late = await make({ commercialStatus: "overdue", nextDueDate: addDays(today, -10), lastPaymentDate: addDays(today, -40) });
    const receipt = await request("POST", "/saas/receipts", admin, {
      professionalUserId: late.id, receivedAt: today, amount: "200.00", currency: "ARS",
      reference: `${prefix}-late`, idempotencyKey: `${prefix}-late-key`,
    });
    assert.equal(receipt.status, 201);
    assert.equal(receipt.body.periodFrom, today);
    assert.equal((await read(late.id)).nextDueDate, addCalendarMonth(today));
    assert.equal((await read(late.id)).commercialStatus, "paying");
    assert.equal((await request("PATCH", `/users/${legacy.id}`, admin, { commercialStatus: "paying" })).status, 200);
    assert.equal((await read(legacy.id)).lastPaymentDate, null);
    assert.equal((await read(legacy.id)).nextDueDate, null);
    assert.equal((await request("PATCH", `/users/${legacy.id}`, admin, {
      lastPaymentDate: "2026-02-30",
    })).status, 400);
    assert.equal((await request("PATCH", `/users/${legacy.id}`, admin, {
      lastPaymentDate: today, nextDueDate: addCalendarMonth(today), commercialChangeReason: "Comprobante ficticio revisado",
    })).status, 200);
    const history = (await request("GET", `/users/${legacy.id}/commercial-history`, admin)).body;
    assert.equal(history[0].actorUserId, admin.id);
    assert.equal(history[0].details.before.lastPaymentDate, null);
    assert.equal(history[0].details.after.lastPaymentDate, today);
    assert.equal(history[0].details.reason, "Comprobante ficticio revisado");
    assert.equal((await db.select().from(saasReceiptsTable).where(eq(saasReceiptsTable.professionalUserId, legacy.id))).length, 0);
    const own = (await request("GET", "/commercial/me", legacy)).body;
    assert.equal(own.nextDueDate, addCalendarMonth(today), "open sessions see new dates without login");
    const staleEdit = await request("PATCH", `/users/${legacy.id}`, admin, {
      nextDueDate: addDays(today, -1), expectedCommercialRevision: "0".repeat(64),
    });
    assert.equal(staleEdit.status, 409);
    assert.equal((await read(legacy.id)).nextDueDate, addCalendarMonth(today));
  });
  await t.test("courtesy and churned/disabled accounts retain exact dates, state, access and no trial restarts", async () => {
    for (const override of [{ commercialStatus: "courtesy" }, { commercialStatus: "churned" }, { active: false }]) {
      const special = await make({ ...override, trialStartPending: true });
      assert.equal((await login(special)).status, special.active ? 200 : 403);
      const receipt = await request("POST", "/saas/receipts", admin, {
        professionalUserId: special.id, receivedAt: today, periodFrom: today, periodTo: addCalendarMonth(today),
        amount: "100.00", currency: "ARS", reference: `${prefix}-${special.id}`, idempotencyKey: `${prefix}-${special.id}`,
      });
      assert.equal(receipt.status, 201);
      assert.deepEqual(await read(special.id), special);
      assert.equal((await request("GET", "/patients", special)).status, special.active ? 200 : 401);
    }
  });
  await t.test("clinical records, anamnesis, reports, goals and document metadata are unchanged by commercial edits", async () => {
    const [patient] = await db.insert(patientsTable).values({
      name: "Paciente ficticio", assignedProfessionalId: professional.id,
      motivoConsulta: "Anamnesis ficticia", antecedentes: "Antecedentes ficticios",
    }).returning();
    patientIds.push(patient.id);
    // Do not migrate unrelated clinical schema for this test. Development may
    // not yet have optional material columns present in the ORM declaration.
    await pool.query("INSERT INTO registros_clinicos (patient_id, user_id, fecha, resumen_sesion) VALUES ($1,$2,$3,$4)",
      [patient.id, professional.id, today, "Sesión ficticia"]);
    await db.insert(goalsTable).values({ patientId: patient.id, title: "Objetivo ficticio", category: "lenguaje" });
    await db.insert(patientReportsTable).values({ patientId: patient.id, reportType: "technical", title: "Informe ficticio",
      content: { resumen: "Texto ficticio" }, authorUserId: professional.id, updatedByUserId: professional.id });
    await db.insert(patientFilesTable).values({ patientId: patient.id, uploadedBy: professional.id, originalName: "ficticio.txt",
      mimeType: "text/plain", sizeBytes: 1, storagePath: `${prefix}/not-an-upload.txt` });
    const snapshot = async () => Promise.all([
      db.select().from(patientsTable).where(eq(patientsTable.id, patient.id)),
      pool.query("SELECT * FROM registros_clinicos WHERE patient_id = $1 ORDER BY id", [patient.id]).then(r => r.rows),
      db.select().from(goalsTable).where(eq(goalsTable.patientId, patient.id)),
      db.select().from(patientReportsTable).where(eq(patientReportsTable.patientId, patient.id)),
      db.select().from(patientFilesTable).where(eq(patientFilesTable.patientId, patient.id)),
    ]);
    const before = await snapshot();
    await request("PATCH", `/users/${professional.id}`, admin, { commercialStatus: "overdue", nextDueDate: addDays(today, -1) });
    assert.equal((await request("GET", `/patients/${patient.id}`, professional)).status, 200);
    assert.equal((await request("GET", "/commercial/me", professional)).body.blockingEnabled, false);
    assert.deepEqual(await snapshot(), before);
  });
});
