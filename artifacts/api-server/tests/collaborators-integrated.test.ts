import assert from "node:assert/strict";
import { after, test } from "node:test";
import { once } from "node:events";

// Isolated test database by default; explicitly opt in to heliumdb ONLY for
// synthetic ID-tracked fixtures. Never infer safety from PGHOST or DATABASE_URL.
const url = process.env.COLLABORATOR_TEST_DATABASE_URL;
const devOptIn = process.env.RUN_COLLABORATOR_DEV_TESTS === "1";
if (!devOptIn && (!url || !/collaborator.*test|test.*collaborator/i.test(new URL(url).pathname))) {
  test("requires isolated COLLABORATOR_TEST_DATABASE_URL or explicit RUN_COLLABORATOR_DEV_TESTS=1", () => {
    assert.fail("Database suite was not run; set an isolated collaborator test URL or explicitly opt in to heliumdb");
  });
} else {
  if (devOptIn && url) throw new Error("Select exactly one test database mode");
  if (process.env.NODE_ENV === "production") throw new Error("Cannot run database tests in production");
  if (!devOptIn) {
  process.env.DATABASE_URL = url;
  delete process.env.PGHOST;
  delete process.env.PGDATABASE;
  }
  process.env.NODE_ENV = "test";
  process.env.SESSION_SECRET = "isolated-test-only-secret";
  const [{ default: app }, { db, pool }, tables, { createAuthToken }] = await Promise.all([
    import("../src/app"), import("@workspace/db"), import("@workspace/db/schema"), import("../src/auth-token"),
  ]);
  const database = await pool.query<{ database: string }>("SELECT current_database() AS database");
  if (devOptIn && database.rows[0]?.database !== "heliumdb") {
    await pool.end();
    throw new Error("Refusing development tests: current_database() must be exactly heliumdb");
  }
  const { usersTable, patientsTable, collaboratorsTable, referralAttributionsTable, saasReceiptsTable, saasStatusEventsTable } = tables;
  const server = app.listen(0);
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server unavailable");
  const base = `http://127.0.0.1:${address.port}/api`;
  const prefix = `synthetic-${process.pid}-${Date.now()}`;
  const codeA = `A${process.pid}${Date.now()}`.slice(0, 30);
  const codeB = `B${process.pid}${Date.now()}`.slice(0, 30);
  const ids: number[] = [];
  const patientIds: number[] = [];
  const { eq, inArray, sql } = await import("drizzle-orm");
  const createUser = async (role: string) => {
    const [user] = await db.insert(usersTable).values({
      email: `${prefix}-${role}-${ids.length}@example.test`, passwordHash: "synthetic",
      name: `Synthetic ${role}`, role, active: true,
    }).returning();
    ids.push(user.id);
    return user;
  };
  const request = async (method: string, path: string, user?: { id: number; role: string }, body?: unknown) => {
    const res = await fetch(base + path, {
      method, headers: {
        "content-type": "application/json",
        ...(user ? { authorization: `Bearer ${createAuthToken(user.id, user.role)}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await res.text();
    let parsed: any;
    try { parsed = JSON.parse(text); }
    catch { throw new Error(`${method} ${path} returned ${res.status} non-JSON response: ${text.slice(0, 120)}`); }
    return { status: res.status, body: parsed };
  };
  after(async () => {
    // Only synthetic fixture IDs, never broad/truncate cleanup.
    try {
      if (ids.length) await db.transaction(async tx => {
        await tx.execute(sql`DELETE FROM express_sessions WHERE sess->>'userId' IN (${sql.join(ids.map(id => sql`${String(id)}`), sql`, `)})`);
        if (patientIds.length) await tx.delete(patientsTable).where(inArray(patientsTable.id, patientIds));
        await tx.delete(saasReceiptsTable).where(inArray(saasReceiptsTable.professionalUserId, ids));
        await tx.delete(saasStatusEventsTable).where(inArray(saasStatusEventsTable.professionalUserId, ids));
        await tx.delete(referralAttributionsTable).where(inArray(referralAttributionsTable.professionalUserId, ids));
        await tx.delete(collaboratorsTable).where(inArray(collaboratorsTable.userId, ids));
        await tx.delete(usersTable).where(inArray(usersTable.id, ids));
      });
    } finally {
      server.close();
      await pool.end();
    }
  });

  test("referrals, security barrier, receipts, immutable snapshots and events", async () => {
    const admin = await createUser("admin");
    const professional = await createUser("professional");
    const unattributed = await createUser("professional");
    const a = await createUser("collaborator");
    const b = await createUser("collaborator");
    const [collA] = await db.insert(collaboratorsTable).values({
      userId: a.id, name: "Synthetic A", country: "Test", code: codeA,
      commissionPercent: "40.00", active: true,
    }).returning();
    await db.insert(collaboratorsTable).values({
      userId: b.id, name: "Synthetic B", country: "Test", code: codeB,
      commissionPercent: "25.00", active: true,
    });
    assert.deepEqual((await request("GET", `/referrals/${codeA.toLowerCase()}`)).body, { valid: true, code: codeA });
    assert.equal((await request("GET", "/referrals/UNKNOWN")).body.valid, false);
    assert.equal((await request("GET", "/patients", a)).status, 403);
    assert.equal((await request("GET", "/users", a)).status, 403);
    assert.equal((await request("GET", "/collaborators", a)).status, 403);
    assert.equal((await request("PATCH", "/auth/me", a, { name: "Attack" })).status, 403);
    assert.equal((await request("POST", "/auth/register", a, {})).status, 403);
    assert.equal((await request("POST", "/auth/login", a, {})).status, 403);
    assert.equal((await request("GET", `/referrals/${codeA}`, a)).status, 403);
    assert.equal((await request("GET", "/healthz", a)).status, 403);
    assert.equal((await request("GET", "/auth/me", a)).status, 200);
    assert.equal((await request("GET", "/users", admin)).status, 200);
    assert.notEqual((await request("GET", "/users/professionals", professional)).status, 403);
    const email = `${prefix}-registration@example.test`;
    const registered = await request("POST", "/auth/register", undefined, {
      email, password: "synthetic-password", name: "Synthetic referred", referralCode: codeA.toLowerCase(),
    });
    assert.equal(registered.status, 201);
    ids.push(registered.body.id);
    const [attributedRegistration] = await db.select().from(referralAttributionsTable).where(eq(referralAttributionsTable.professionalUserId, registered.body.id));
    assert.equal(attributedRegistration.collaboratorId, collA.id);
    assert.equal(attributedRegistration.codeUsed, codeA);
    assert.equal(attributedRegistration.source, "public_register");
    assert.equal(attributedRegistration.createdByUserId, null);
    assert.equal((await request("POST", "/auth/register", undefined, {
      email, password: "synthetic-password", name: "Synthetic referred", referralCode: codeB,
    })).status, 409);
    const [unchanged] = await db.select().from(referralAttributionsTable).where(eq(referralAttributionsTable.professionalUserId, registered.body.id));
    assert.equal(unchanged.collaboratorId, collA.id);
    assert.equal((await request("POST", "/auth/register", undefined, {
      email: `${prefix}-invalid@example.test`, password: "synthetic-password", name: "Synthetic", referralCode: "NONEXISTENT",
    })).status, 400);
    await db.insert(referralAttributionsTable).values({
      collaboratorId: collA.id, professionalUserId: professional.id,
      codeUsed: codeA, source: "admin_user_create", createdByUserId: admin.id,
    });
    assert.equal((await request("POST", "/saas/receipts", professional, {})).status, 403);
    const payload = {
      professionalUserId: professional.id, amount: "100.00", currency: "ARS",
      periodFrom: "2026-01-01", periodTo: "2026-01-31",
      receivedAt: "2026-02-12", reference: "synthetic-transfer",
      idempotencyKey: `${prefix}-receipt`,
    };
    assert.equal((await request("POST", "/saas/receipts", admin, { ...payload, periodTo: "2025-12-31" })).status, 400);
    assert.equal((await request("POST", "/saas/receipts", admin, { ...payload, periodTo: undefined })).status, 400);
    const first = await request("POST", "/saas/receipts", admin, payload);
    assert.equal(first.status, 201, JSON.stringify(first.body));
    assert.equal(first.body.commissionAmount, "40.00");
    assert.equal(first.body.createdByUserId, admin.id);
    assert.equal(first.body.periodFrom, payload.periodFrom);
    assert.equal(first.body.periodTo, payload.periodTo);
    assert.equal((await request("POST", "/saas/receipts", admin, payload)).status, 200);
    assert.equal((await request("POST", "/saas/receipts", admin, { ...payload, amount: "200.00" })).status, 409);
    assert.equal((await request("POST", "/saas/receipts", admin, { ...payload, periodFrom: "2026-01-02" })).status, 409);
    const noReferral = await request("POST", "/saas/receipts", admin, { ...payload, professionalUserId: unattributed.id, idempotencyKey: `${prefix}-unattributed` });
    assert.equal(noReferral.status, 201);
    assert.equal(noReferral.body.commissionAmount, null);
    assert.equal((await request("POST", `/saas/receipts/${noReferral.body.id}/paid`, admin, {})).status, 409);
    await db.update(collaboratorsTable).set({ commissionPercent: "60.00", active: false }).where(eq(collaboratorsTable.id, collA.id));
    assert.equal((await request("GET", `/referrals/${codeA}`)).body.valid, false);
    assert.equal((await request("PATCH", `/collaborators/${collA.id}`, admin, { code: "CHANGED" })).status, 409);
    const second = await request("POST", "/saas/receipts", admin, { ...payload, idempotencyKey: `${prefix}-later` });
    assert.equal(second.body.commissionAmount, "60.00");
    const paid = await request("POST", `/saas/receipts/${first.body.id}/paid`, admin, { paymentReference: "synthetic-payout" });
    assert.equal(paid.status, 200);
    assert.equal(paid.body.paidByUserId, admin.id);
    assert.equal((await request("POST", `/saas/receipts/${first.body.id}/paid`, admin, { paymentReference: "synthetic-payout" })).status, 200);
    assert.equal((await request("POST", `/saas/receipts/${first.body.id}/paid`, admin, { paymentReference: "changed" })).status, 409);
    assert.equal((await request("POST", "/saas/status", admin, { professionalUserId: professional.id, status: "paying" })).body.event, "first_paid");
    assert.equal((await request("POST", "/saas/status", admin, { professionalUserId: professional.id, status: "churned" })).body.event, "cancellation");
    assert.equal((await request("POST", "/saas/status", admin, { professionalUserId: professional.id, status: "paying" })).body.event, "reactivation");
    const afterReactivation = await request("GET", "/collaborator/dashboard", a);
    assert.equal(afterReactivation.body.newSubscriptionsThisMonth, 1, "reactivation must not count as a new subscription");
    assert.equal(afterReactivation.body.cancellationsThisMonth, 1);
    assert.equal((await request("POST", "/saas/status", admin, { professionalUserId: unattributed.id, status: "paying" })).body.event, "first_paid");
    assert.equal((await request("POST", "/saas/status", admin, { professionalUserId: unattributed.id, status: "overdue" })).body.event, null);
    assert.equal((await request("POST", "/saas/status", admin, { professionalUserId: unattributed.id, status: "churned" })).body.event, "cancellation");
    assert.equal((await request("POST", "/saas/status", admin, { professionalUserId: registered.body.id, status: "churned" })).body.event, null, "trial must not count as a paid cancellation");
    const existingPaid = await createUser("professional");
    await db.update(usersTable).set({ commercialStatus: "paying" }).where(eq(usersTable.id, existingPaid.id));
    assert.equal((await request("POST", "/saas/status", admin, { professionalUserId: existingPaid.id, status: "overdue" })).body.event, null);
    assert.equal((await request("POST", "/saas/status", admin, { professionalUserId: existingPaid.id, status: "paying" })).body.event, "reactivation");
    const existingEvents = await db.select().from(saasStatusEventsTable).where(eq(saasStatusEventsTable.professionalUserId, existingPaid.id));
    assert.deepEqual(existingEvents.map(e => e.event), ["baseline", "reactivation"]);
    const own = await request("GET", "/collaborator/dashboard", a);
    const other = await request("GET", "/collaborator/dashboard", b);
    assert.equal(own.body.referrals, 2);
    assert.equal(other.body.referrals, 0);
    assert.equal(own.body.pending.ARS, "60.00");
    assert.equal(own.body.paid.ARS, "40.00");
    assert.equal(/professionalUserId|email|patient|phone|Synthetic professional/i.test(JSON.stringify(own.body)), false);
  });

  test("linking a professional preserves the entire user row and clinical access, while dashboards stay isolated", async () => {
    const admin = await createUser("admin");
    const linked = await createUser("professional");
    const ordinary = await createUser("professional");
    const b = await createUser("collaborator");
    const before = (await db.select().from(usersTable).where(eq(usersTable.id, linked.id)))[0];
    const [ownPatient, foreignPatient] = await db.insert(patientsTable).values([
      { name: `${prefix}-own-patient`, assignedProfessionalId: linked.id },
      { name: `${prefix}-foreign-patient`, assignedProfessionalId: ordinary.id },
    ]).returning();
    patientIds.push(ownPatient.id, foreignPatient.id);
    const payload = { name: "Synthetic linked", country: "Test", code: `${codeA}L`, commissionPercent: "30.00", existingUserId: linked.id };
    assert.equal((await request("POST", "/collaborators", ordinary, payload)).status, 403);
    assert.equal((await request("POST", "/collaborators", admin, { ...payload, existingUserId: b.id })).status, 404);
    assert.equal((await request("POST", "/collaborators", admin, { ...payload, existingUserId: -1 })).status, 400);
    assert.equal((await request("POST", "/collaborators", admin, { ...payload, email: before.email })).status, 400);
    assert.equal((await request("POST", "/collaborators", admin, { ...payload, password: "unexpected-password" })).status, 400);
    const created = await request("POST", "/collaborators", admin, payload);
    assert.equal(created.status, 201, JSON.stringify(created.body));
    assert.equal(created.body.userId, linked.id);
    assert.equal(created.body.active, false);
    assert.deepEqual((await db.select().from(usersTable).where(eq(usersTable.id, linked.id)))[0], before);
    assert.equal((await request("POST", "/collaborators", admin, { ...payload, code: `${codeA}X` })).status, 409, "one collaborator row per user");
    assert.equal((await request("POST", "/collaborators", admin, { ...payload, existingUserId: ordinary.id })).status, 409, "unique code");
    const [otherRow] = await db.insert(collaboratorsTable).values({
      userId: b.id, name: "Synthetic B", country: "Test", code: `${codeB}L`, commissionPercent: "25.00", active: true,
    }).returning();
    await db.insert(referralAttributionsTable).values({
      collaboratorId: created.body.id, professionalUserId: ordinary.id,
      codeUsed: payload.code, source: "admin_user_create", createdByUserId: admin.id,
    });
    const third = await createUser("professional");
    await db.insert(referralAttributionsTable).values({
      collaboratorId: otherRow.id, professionalUserId: third.id,
      codeUsed: `${codeB}L`, source: "admin_user_create", createdByUserId: admin.id,
    });
    const own = await request("GET", "/collaborator/dashboard", linked);
    const other = await request("GET", "/collaborator/dashboard", b);
    assert.equal(own.status, 200);
    assert.equal(other.status, 200);
    assert.equal(own.body.code, payload.code);
    assert.equal(own.body.referrals, 1);
    assert.equal(other.body.referrals, 1);
    assert.equal(other.body.code, `${codeB}L`);
    assert.equal((await request("GET", "/collaborator/dashboard", ordinary)).status, 403);
    assert.equal((await request("GET", "/collaborator/dashboard", admin)).status, 403);
    assert.equal((await request("GET", "/collaborator/dashboard")).status, 401);
    assert.deepEqual((await request("GET", `/collaborators/${otherRow.id}/dashboard`, admin)).body.code, `${codeB}L`);
    assert.equal((await request("GET", `/collaborators/${otherRow.id}/dashboard`, linked)).status, 403);
    assert.equal((await request("GET", `/collaborators/${created.body.id}/dashboard`, b)).status, 403);
    assert.equal((await request("GET", "/patients", b)).status, 403);
    assert.equal((await request("POST", "/patients", b, { name: `${prefix}-denied` })).status, 403);
    assert.equal((await request("GET", `/patients/${ownPatient.id}`, b)).status, 403);
    const clinical = await request("GET", "/patients", linked);
    assert.equal(clinical.status, 200);
    assert.ok(clinical.body.some((p: any) => p.id === ownPatient.id));
    assert.ok(!clinical.body.some((p: any) => p.id === foreignPatient.id));
    assert.equal((await request("GET", `/patients/${ownPatient.id}`, linked)).status, 200);
    assert.equal((await request("GET", `/patients/${foreignPatient.id}`, linked)).status, 403);
    assert.equal((await request("PATCH", `/patients/${ownPatient.id}`, linked, { name: `${prefix}-updated-patient` })).status, 200);
    assert.equal((await request("PATCH", `/patients/${foreignPatient.id}`, linked, { name: `${prefix}-denied-update` })).status, 403);
    assert.equal((await request("PATCH", `/patients/${ownPatient.id}`, b, { name: `${prefix}-denied-update` })).status, 403);
    const added = await request("POST", "/patients", linked, { name: `${prefix}-new-patient` });
    assert.equal(added.status, 201, JSON.stringify(added.body));
    patientIds.push(added.body.id);
    assert.equal(added.body.assignedProfessionalId, linked.id);
    assert.equal((await request("GET", "/collaborators", admin)).status, 200);
    assert.equal((await request("PATCH", `/collaborators/${created.body.id}`, admin, { active: true, name: "New display name" })).status, 200);
    assert.deepEqual((await db.select().from(usersTable).where(eq(usersTable.id, linked.id)))[0], before, "admin collaborator updates must not modify linked professional");
    assert.equal((await request("GET", "/patients", linked)).status, 200, "clinical access persists after updating collaborator");
    assert.equal((await request("GET", "/collaborator/dashboard", linked)).status, 200);

    const newAccount = await request("POST", "/collaborators", admin, {
      name: "Synthetic new access", email: `${prefix}-new-access@example.test`,
      password: "synthetic-password", country: "Test", code: `${codeA}N`, commissionPercent: "15.00",
    });
    assert.equal(newAccount.status, 201, JSON.stringify(newAccount.body));
    ids.push(newAccount.body.userId);
    const [newUser] = await db.select().from(usersTable).where(eq(usersTable.id, newAccount.body.userId));
    assert.equal(newUser.role, "collaborator");
    assert.equal(newUser.active, false);
    assert.equal((await request("PATCH", `/collaborators/${newAccount.body.id}`, admin, { active: true })).status, 200);
    assert.equal((await request("GET", "/collaborator/dashboard", { id: newUser.id, role: "collaborator" })).status, 200);
    assert.equal((await request("GET", "/patients", { id: newUser.id, role: "collaborator" })).status, 403);
  });
}