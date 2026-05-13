/**
 * reverse-migration.ts
 *
 * Synchronizes data from Replit PostgreSQL → Supabase (Render's database).
 *
 * DEFAULTS TO DRY-RUN. No data is written unless DRY_RUN=false is explicitly set.
 *
 * Usage:
 *   Dry-run (default, safe):
 *     npx tsx artifacts/api-server/src/seeds/reverse-migration.ts
 *     DRY_RUN=true npx tsx artifacts/api-server/src/seeds/reverse-migration.ts
 *
 *   Live migration (writes to Supabase — only run after dry-run passes):
 *     DRY_RUN=false npx tsx artifacts/api-server/src/seeds/reverse-migration.ts
 */

import { pool } from "@workspace/db";

// ─── Configuration ────────────────────────────────────────────────────────────

const DRY_RUN = process.env.DRY_RUN !== "false"; // default: true

const SUPABASE_URL = "https://taczpgaryiphxnoniftl.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhY3pwZ2FyeWlwaHhub25pZnRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY3OTE4MSwiZXhwIjoyMDkzMjU1MTgxfQ.fPS8B3oIsF6YbUAkjlyTCSCQAADhiWWAfn_i-3cHxfU";

// Migration order respects logical FK tiers (no enforced constraints,
// but ordering keeps data coherent if live-run is interrupted mid-way).
const TABLE_ORDER = [
  // Tier 1 — no dependencies
  "professionals",
  "users",
  "goal_library",
  // Tier 2 — reference Tier 1
  "patients",
  "actividades",
  // Tier 3 — reference Tier 1 + Tier 2
  "patient_professionals",
  "sessions",
  "citas",
  "goals",
  "registros",
  "pagos",
  "registros_clinicos",
  // Tier 4 — reference Tier 3
  "goal_progress",
] as const;

type TableName = (typeof TABLE_ORDER)[number];

// ─── Supabase helpers ─────────────────────────────────────────────────────────

const sbHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

/** Check whether a table exists in Supabase by attempting a zero-row GET. */
async function supabaseTableExists(table: string): Promise<boolean> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?limit=0`,
    { headers: sbHeaders }
  );
  return res.ok;
}

/** Count rows in a Supabase table using the Range header trick. */
async function supabaseCount(table: string): Promise<number | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?select=id`,
    {
      headers: {
        ...sbHeaders,
        Prefer: "count=exact",
        "Range-Unit": "items",
        Range: "0-0",
      },
    }
  );
  if (!res.ok) return null;
  const contentRange = res.headers.get("content-range"); // e.g. "0-0/34"
  if (!contentRange) return null;
  const match = contentRange.match(/\/(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

/** Fetch all rows from a Supabase table via paginated REST API. */
async function supabaseFetchAll(table: string): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=${limit}&offset=${offset}`,
      { headers: sbHeaders }
    );
    if (!res.ok) return rows;
    const batch = (await res.json()) as Record<string, unknown>[];
    if (!Array.isArray(batch) || batch.length === 0) break;
    rows.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return rows;
}

/**
 * Upsert rows into Supabase table using the REST API.
 * Uses ON CONFLICT (id) → UPDATE all other columns.
 * Returns number of rows upserted.
 */
async function supabaseUpsert(
  table: string,
  rows: Record<string, unknown>[]
): Promise<{ ok: number; err: number }> {
  if (rows.length === 0) return { ok: 0, err: 0 };

  const BATCH = 200; // Supabase REST handles ~200 rows per request safely
  let ok = 0;
  let err = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?on_conflict=id`,
      {
        method: "POST",
        headers: {
          ...sbHeaders,
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(chunk),
      }
    );
    if (res.ok) {
      ok += chunk.length;
    } else {
      const body = await res.text();
      console.error(`  [upsert error] ${table} batch ${i}-${i + BATCH}: HTTP ${res.status} — ${body}`);
      err += chunk.length;
    }
  }
  return { ok, err };
}

// ─── Replit PostgreSQL helpers ────────────────────────────────────────────────

/** Count rows in a Replit PostgreSQL table. */
async function sourceCount(table: string): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM "${table}"`
  );
  return parseInt(rows[0].count, 10);
}

/** Fetch all rows from a Replit PostgreSQL table. */
async function sourceFetchAll(table: string): Promise<Record<string, unknown>[]> {
  const { rows } = await pool.query(`SELECT * FROM "${table}" ORDER BY id`);
  return rows;
}

/** Reset a Supabase serial sequence to MAX(id) after upsert. */
async function supabaseResetSequence(table: string): Promise<void> {
  const sql = `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1))`;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: sbHeaders,
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    // Supabase may not expose exec_sql — use the SQL editor endpoint instead.
    // This is a best-effort step; warn but don't fail.
    console.warn(`  [sequence] Could not reset sequence for "${table}" via REST — reset manually if needed.`);
  }
}

// ─── Reporting ────────────────────────────────────────────────────────────────

function pad(s: string | number, n: number): string {
  return String(s).padEnd(n);
}

function rpad(s: string | number, n: number): string {
  return String(s).padStart(n);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  Neurometric — Reverse Migration: Replit PostgreSQL → Supabase");
  console.log(`  Mode: ${DRY_RUN ? "DRY-RUN (no writes)" : "⚠️  LIVE — data will be written to Supabase"}`);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");

  // ── Phase 1: verify target tables exist ────────────────────────────────────
  console.log("── Phase 1: Verifying Supabase table existence ─────────────────");
  const missing: string[] = [];
  const exists: string[] = [];

  for (const table of TABLE_ORDER) {
    const ok = await supabaseTableExists(table);
    const icon = ok ? "✓" : "✗ MISSING";
    console.log(`  ${icon}  ${table}`);
    if (ok) exists.push(table);
    else missing.push(table);
  }

  if (missing.length > 0) {
    console.log("");
    console.log(`  ⚠️  ${missing.length} table(s) missing in Supabase: ${missing.join(", ")}`);
    console.log("  These tables must be created via Drizzle migrations on Render before live migration.");
  } else {
    console.log("");
    console.log("  All tables present in Supabase. ✓");
  }

  // ── Phase 2: row counts comparison ────────────────────────────────────────
  console.log("");
  console.log("── Phase 2: Row count comparison ────────────────────────────────");
  console.log("");
  console.log(
    `  ${"Table".padEnd(26)} ${"Source (Replit PG)".padStart(18)} ${"Target (Supabase)".padStart(18)} ${"Delta".padStart(8)}  ${"Action"}`
  );
  console.log("  " + "─".repeat(90));

  type TableReport = {
    table: string;
    sourceCount: number;
    targetCount: number | null;
    delta: number | null;
    missingInTarget: boolean;
  };

  const reports: TableReport[] = [];

  for (const table of TABLE_ORDER) {
    const sc = await sourceCount(table);
    const tc = exists.includes(table) ? await supabaseCount(table) : null;
    const delta = tc !== null ? sc - tc : null;
    const isMissing = missing.includes(table);

    reports.push({ table, sourceCount: sc, targetCount: tc, delta, missingInTarget: isMissing });

    let action: string;
    if (isMissing) {
      action = "BLOCKED — table missing";
    } else if (delta === 0) {
      action = "already in sync";
    } else if (delta !== null && delta > 0) {
      action = `${delta} row(s) to upsert`;
    } else if (delta !== null && delta < 0) {
      action = `target has ${Math.abs(delta)} extra row(s) (will not delete)`;
    } else {
      action = "unknown";
    }

    const tcDisplay = tc !== null ? String(tc) : "N/A";
    const deltaDisplay = delta !== null ? (delta > 0 ? `+${delta}` : String(delta)) : "N/A";

    console.log(
      `  ${pad(table, 26)} ${rpad(sc, 18)} ${rpad(tcDisplay, 18)} ${rpad(deltaDisplay, 8)}  ${action}`
    );
  }

  // ── Phase 3: sample data preview ──────────────────────────────────────────
  console.log("");
  console.log("── Phase 3: Source data samples (first row per table) ───────────");
  for (const table of ["users", "patients", "professionals"]) {
    if (!TABLE_ORDER.includes(table as TableName)) continue;
    try {
      const { rows } = await pool.query(`SELECT * FROM "${table}" ORDER BY id LIMIT 1`);
      if (rows.length > 0) {
        const preview = Object.entries(rows[0])
          .filter(([k]) => !["password_hash", "passwordHash"].includes(k))
          .slice(0, 5)
          .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
          .join(", ");
        console.log(`  ${table}: { ${preview}, … }`);
      }
    } catch {
      console.log(`  ${table}: (could not read sample)`);
    }
  }

  // ── Phase 4: risk summary ──────────────────────────────────────────────────
  console.log("");
  console.log("── Phase 4: Risk summary ────────────────────────────────────────");

  const totalSourceRows = reports.reduce((sum, r) => sum + r.sourceCount, 0);
  const totalToUpsert = reports
    .filter((r) => !r.missingInTarget && r.delta !== null && r.delta > 0)
    .reduce((sum, r) => sum + (r.delta ?? 0), 0);
  const tablesBlocked = reports.filter((r) => r.missingInTarget).length;
  const tablesInSync = reports.filter((r) => !r.missingInTarget && r.delta === 0).length;
  const tablesWithExtra = reports.filter(
    (r) => !r.missingInTarget && r.delta !== null && r.delta < 0
  );

  console.log(`  Total source rows (Replit PG):  ${totalSourceRows}`);
  console.log(`  Rows that would be upserted:    ${totalToUpsert}`);
  console.log(`  Tables already in sync:         ${tablesInSync}`);
  console.log(`  Tables blocked (missing):       ${tablesBlocked}`);

  if (tablesWithExtra.length > 0) {
    console.log(`  ⚠️  Tables where Supabase has more rows than source:`);
    for (const r of tablesWithExtra) {
      console.log(`       ${r.table}: Supabase has ${r.targetCount}, source has ${r.sourceCount}`);
    }
    console.log("     These rows will NOT be deleted. Review manually before live run.");
  }

  if (missing.length > 0) {
    console.log(`  ⚠️  BLOCKED tables: ${missing.join(", ")}`);
    console.log("     Run Drizzle migrations on Render first: drizzle-kit push");
  }

  console.log("");
  console.log("  IMPORTANT — after live migration, serial sequences on Supabase");
  console.log("  must be reset so new inserts do not collide with migrated IDs.");
  console.log("  The live run will attempt this automatically per table.");

  // ── Phase 5: live migration (only if DRY_RUN=false) ──────────────────────
  if (DRY_RUN) {
    console.log("");
    console.log("── Dry-run complete. No data written. ───────────────────────────");
    console.log("   To execute: DRY_RUN=false npx tsx artifacts/api-server/src/seeds/reverse-migration.ts");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("");
    await pool.end();
    return;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LIVE MIGRATION — only reached when DRY_RUN=false
  // ─────────────────────────────────────────────────────────────────────────
  console.log("");
  console.log("── Phase 5: LIVE MIGRATION ──────────────────────────────────────");
  console.log("   Writing to Supabase now…");
  console.log("");

  for (const table of TABLE_ORDER) {
    if (missing.includes(table)) {
      console.log(`  [SKIP] ${table} — table does not exist in Supabase`);
      continue;
    }

    const rows = await sourceFetchAll(table);
    if (rows.length === 0) {
      console.log(`  [SKIP] ${table} — no rows in source`);
      continue;
    }

    process.stdout.write(`  [${table}] upserting ${rows.length} rows… `);
    const { ok, err } = await supabaseUpsert(table, rows);
    console.log(`done (${ok} ok, ${err} errors)`);

    await supabaseResetSequence(table);
  }

  console.log("");
  console.log("── Live migration complete. ──────────────────────────────────────");
  console.log("   Verify on Netlify: login, check patient count, check users.");
  console.log("   If anything looks wrong, restore Supabase from backup immediately.");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");

  await pool.end();
}

main().catch((err) => {
  console.error("\n[FATAL]", err);
  process.exit(1);
});
