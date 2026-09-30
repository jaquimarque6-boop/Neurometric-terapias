import assert from "node:assert/strict";
import { after, test } from "node:test";
import { once } from "node:events";

const url = process.env.CONSENT_TEST_DATABASE_URL;
const devOptIn = process.env.RUN_CONSENT_DEV_TESTS === "1";
if (!devOptIn && (!url || !/consent.*test|test.*consent/i.test(new URL(url).pathname))) {
  test("requires isolated CONSENT_TEST_DATABASE_URL or explicit RUN_CONSENT_DEV_TESTS=1", () => {
    assert.fail("Set an isolated consent test URL or explicitly opt in to heliumdb.");
  });
} else {
  if (devOptIn && url) throw new Error("Select exactly one test database mode");
  if (process.env.NODE_ENV === "production") throw new Error("Cannot run consent tests in production");
  if (!devOptIn) {
    process.env.DATABASE_URL = url;
    delete process.env.PGHOST;
    delete process.env.PGDATABASE;
  }
  process.env.NODE_ENV = "test";
  process.env.SESSION_SECRET = "isolated-consent-test-only";
  process.env.CONSENT_TERMS_VERSION = "1.0";
  process.env.CONSENT_PRIVACY_VERSION = "1.0";
  process.env.CONSENT_AI_VERSION = "1.0";
  const [{ default: app }, { db, pool }, schema, { createAuthToken }] = await Promise.all([
    import("../src/app"), import("@workspace/db"), import("@workspace/db/schema"), import("../src/auth-token"),
  ]);
  const dbName = await pool.query<{ database: string }>("SELECT current_database() AS database");
  if (devOptIn && dbName.rows[0]?.database !== "heliumdb") {
    await pool.end();
    throw new Error("Refusing consent tests: current_database() must be exactly heliumdb");
  }
  const { usersTable, collaboratorsTable, userConsentAcceptancesTable } = schema;
  const server = app.listen(0);
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server unavailable");
  const base = `http://127.0.0.1:${address.port}/api`;
  const fixtureTag = `legal-${process.pid}-${Date.now()}`;
  const userIds: number[] = [];
  const request = async (method: string, path: string, user?: { id: number; role: string }, body?: unknown) => {
    const response = await fetch(base + path, {
      method,
      headers: {
        "content-type": "application/json",
        ...(user ? { authorization: `Bearer ${createAuthToken(user.id, user.role)}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json().catch(() => null) };
  };
  const createUser = async (role: string, suffix: string) => {
    const [user] = await db.insert(usersTable).values({
      email: `${fixtureTag}-${suffix}@example.test`,
      passwordHash: "synthetic-only",
      name: `Synthetic ${suffix}`,
      role,
      active: true,
    }).returning();
    userIds.push(user.id);
    return user;
  };

  after(async () => {
    try {
      if (userIds.length) {
        const { inArray } = await import("drizzle-orm");
        await db.transaction(async tx => {
          await tx.delete(userConsentAcceptancesTable).where(inArray(userConsentAcceptancesTable.userId, userIds));
          await tx.delete(collaboratorsTable).where(inArray(collaboratorsTable.userId, userIds));
          await tx.delete(usersTable).where(inArray(usersTable.id, userIds));
        });
      }
    } finally {
      server.close();
      await pool.end();
    }
  });

  test("records self-acceptance, separates AI consent, enforces current versions and supports existing roles", async () => {
    const admin = await createUser("admin", "admin");
    const professional = await createUser("professional", "professional");
    const linked = await createUser("professional", "linked");
    const collaborator = await createUser("collaborator", "collaborator");
    const { eq } = await import("drizzle-orm");
    const [link] = await db.insert(collaboratorsTable).values({
      userId: linked.id, name: "Synthetic linked", country: "Test",
      code: `L${Date.now()}`, commissionPercent: "10.00",
    }).returning();
    assert.ok(link);

    assert.equal((await request("GET", "/consents/status")).status, 401);
    for (const user of [admin, professional, linked, collaborator]) {
      const result = await request("GET", "/consents/status", user);
      assert.equal(result.status, 200);
      assert.deepEqual(result.body.accepted, { terms: false, privacy: false, ai: false });
    }

    const adminAccepted = await request("POST", "/consents/accept", admin, { types: ["terms", "privacy"] });
    assert.equal(adminAccepted.status, 200);
    assert.deepEqual((await request("GET", "/consents/status", admin)).body.accepted,
      { terms: true, privacy: true, ai: false });

    assert.equal((await request("POST", "/consents/accept", linked, { types: ["terms", "privacy"] })).status, 200,
      "a professional with collaborator attribution accepts for their own user account");
    assert.deepEqual((await request("GET", "/consents/status", linked)).body.accepted,
      { terms: true, privacy: true, ai: false });

    // A client-supplied user id cannot select or impersonate a different account.
    assert.equal((await request("POST", "/consents/accept", professional, {
      types: ["terms", "privacy"], userId: admin.id, acceptedByUserId: admin.id,
    })).status, 200);
    assert.deepEqual((await request("GET", "/consents/status", professional)).body.accepted,
      { terms: true, privacy: true, ai: false });
    assert.deepEqual((await request("GET", "/consents/status", admin)).body.accepted,
      { terms: true, privacy: true, ai: false });
    const ownRows = await db.select().from(userConsentAcceptancesTable).where(eq(userConsentAcceptancesTable.userId, professional.id));
    assert.equal(ownRows.length, 2);
    assert.ok(ownRows.every(row => row.acceptedByUserId === professional.id && row.version === "1.0"));
    assert.equal((await request("POST", "/consents/accept", professional, { types: ["terms", "privacy"] })).status, 200);
    assert.equal((await db.select().from(userConsentAcceptancesTable).where(eq(userConsentAcceptancesTable.userId, professional.id))).length, 2);

    const adminCreated = await request("POST", "/users", admin, {
      email: `${fixtureTag}-created-by-admin@example.test`,
      password: "synthetic-password",
      name: "Synthetic admin-created professional",
      role: "professional",
    });
    assert.equal(adminCreated.status, 201);
    userIds.push(adminCreated.body.id);
    assert.deepEqual((await request("GET", "/consents/status", {
      id: adminCreated.body.id, role: "professional",
    })).body.accepted, { terms: false, privacy: false, ai: false });

    const publicCreated = await request("POST", "/auth/register", undefined, {
      email: `${fixtureTag}-public@example.test`,
      password: "synthetic-password",
      name: "Synthetic public professional",
    });
    assert.equal(publicCreated.status, 201);
    userIds.push(publicCreated.body.id);
    assert.deepEqual((await request("GET", "/consents/status", {
      id: publicCreated.body.id, role: "professional",
    })).body.accepted, { terms: false, privacy: false, ai: false });

    // Every AI endpoint stops at the consent check before validating/generating content.
    const aiPaths = [
      "/ai/informe-generate", "/ai/perfil-generate", "/ai/objetivos-suggest",
      "/goal-guidance", "/ai/manuscrito-transcribe", "/ai/manuscrito-organize",
    ];
    for (const path of aiPaths) {
      const denied = await request("POST", path, professional, {});
      assert.equal(denied.status, 428, `${path} must require AI consent`);
      assert.equal(denied.body.code, "AI_CONSENT_REQUIRED");
    }
    assert.equal((await request("POST", "/consents/accept", professional, { types: ["ai", "terms"] })).status, 400);
    assert.equal((await request("POST", "/consents/accept", professional, { types: ["admin"], userId: admin.id })).status, 400);

    assert.equal((await request("POST", "/consents/accept", professional, { types: ["ai"] })).status, 200);
    assert.deepEqual((await request("GET", "/consents/status", professional)).body.accepted,
      { terms: true, privacy: true, ai: true });
    assert.equal((await request("POST", "/goal-guidance", professional, {})).status, 400,
      "after consent, request reaches normal route validation without calling external AI");
    assert.equal((await request("POST", "/auth/logout", professional)).status, 200);
    assert.equal((await request("GET", "/consents/status")).status, 401, "closing a session removes access to consent endpoints");
    assert.equal((await request("GET", "/consents/status", professional)).body.accepted.ai, true,
      "acceptance remains in account history for the next authenticated session");

    // Simulate publishing a new AI notice and terms version without changing prior history.
    process.env.CONSENT_AI_VERSION = "1.1";
    process.env.CONSENT_TERMS_VERSION = "1.1";
    try {
      const upgraded = await request("GET", "/consents/status", professional);
      assert.equal(upgraded.body.versions.terms, "1.1");
      assert.equal(upgraded.body.accepted.terms, false);
      assert.equal(upgraded.body.accepted.privacy, true);
      assert.equal(upgraded.body.versions.ai, "1.1");
      assert.equal(upgraded.body.accepted.ai, false);
      assert.equal((await request("POST", "/goal-guidance", professional, {})).status, 428);
    } finally {
      process.env.CONSENT_TERMS_VERSION = "1.0";
      process.env.CONSENT_AI_VERSION = "1.0";
    }

    // A collaborator may manage only their own consent records via the narrow auth allowlist.
    assert.equal((await request("POST", "/consents/accept", collaborator, { types: ["terms", "privacy"] })).status, 200);
    assert.equal((await request("GET", "/consents/status", collaborator)).body.accepted.terms, true);
    assert.equal((await request("POST", "/consents/accept", undefined, { types: ["terms"] })).status, 401);
    assert.equal((await request("POST", "/auth/logout", collaborator)).status, 200);
    assert.ok(linked.id > 0);
  });
}