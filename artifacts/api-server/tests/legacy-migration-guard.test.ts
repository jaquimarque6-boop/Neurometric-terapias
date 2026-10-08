import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { assertLegacyMigrationEnabled } from "../src/seeds/legacy-migration-guard";

const optInVariables = [
  "ENABLE_LEGACY_SUPABASE_SEED",
  "ENABLE_LEGACY_SUPABASE_REVERSE_MIGRATION",
];

test("legacy migrations require a literal true opt-in", () => {
  for (const variable of optInVariables) {
    const previousValue = process.env[variable];

    try {
      delete process.env[variable];
      assert.throws(() => assertLegacyMigrationEnabled(variable), /explicitly enable/);

      process.env[variable] = "false";
      assert.throws(() => assertLegacyMigrationEnabled(variable), /explicitly enable/);

      process.env[variable] = "true";
      assert.doesNotThrow(() => assertLegacyMigrationEnabled(variable));
    } finally {
      if (previousValue === undefined) delete process.env[variable];
      else process.env[variable] = previousValue;
    }
  }
});

test("API startup omits the old migration seed and retains normal seeds", () => {
  const appSource = readFileSync(new URL("../src/app.ts", import.meta.url), "utf8");

  assert.ok(!appSource.includes("seedFromSupabaseIfNeeded"));
  assert.ok(appSource.includes("seedAdminIfNeeded().catch(console.error)"));
  assert.ok(appSource.includes("ensureJaquiAdmin().catch(console.error)"));
  assert.ok(appSource.includes("ensureTempAdmin().catch(console.error)"));
  assert.ok(appSource.includes("seedGoalLibraryIfNeeded().catch(console.error)"));
});

test("historical scripts use the environment key and remain opt-in gated", () => {
  const seedSource = readFileSync(
    new URL("../src/seeds/supabase-migration-seed.ts", import.meta.url),
    "utf8",
  );
  const reverseSource = readFileSync(
    new URL("../src/seeds/reverse-migration.ts", import.meta.url),
    "utf8",
  );
  const jwtLikeToken = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/;

  assert.ok(!jwtLikeToken.test(seedSource), "the historical seed must not contain a JWT literal");
  assert.ok(!jwtLikeToken.test(reverseSource), "the reverse migration must not contain a JWT literal");
  assert.ok(seedSource.includes("process.env.SUPABASE_SERVICE_KEY"));
  assert.ok(reverseSource.includes("process.env.SUPABASE_SERVICE_KEY"));
  assert.ok(seedSource.includes('assertLegacyMigrationEnabled("ENABLE_LEGACY_SUPABASE_SEED")'));
  assert.ok(reverseSource.includes(
    'assertLegacyMigrationEnabled("ENABLE_LEGACY_SUPABASE_REVERSE_MIGRATION")',
  ));
  assert.ok(reverseSource.includes('process.env.DRY_RUN !== "false"'));
});
