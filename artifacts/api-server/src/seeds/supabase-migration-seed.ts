import { db, pool } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";

const SUPABASE_URL = "https://taczpgaryiphxnoniftl.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhY3pwZ2FyeWlwaHhub25pZnRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY3OTE4MSwiZXhwIjoyMDkzMjU1MTgxfQ.fPS8B3oIsF6YbUAkjlyTCSCQAADhiWWAfn_i-3cHxfU";

async function fetchAll(table: string): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=${limit}&offset=${offset}`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Accept: "application/json",
        },
      }
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

async function upsertRaw(
  tableName: string,
  rows: Record<string, unknown>[]
): Promise<number> {
  if (rows.length === 0) return 0;
  const cols = Object.keys(rows[0]);
  let count = 0;
  for (const row of rows) {
    const values = cols.map((c) => row[c]);
    const colNames = cols.map((c) => `"${c}"`).join(", ");
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
    const updateSet = cols
      .filter((c) => c !== "id")
      .map((c) => `"${c}" = EXCLUDED."${c}"`)
      .join(", ");
    const query = updateSet
      ? `INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders}) ON CONFLICT ("id") DO UPDATE SET ${updateSet}`
      : `INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders}) ON CONFLICT ("id") DO NOTHING`;
    try {
      await pool.query(query, values);
      count++;
    } catch {
      // skip constraint errors silently
    }
  }
  return count;
}

async function resetSequence(tableName: string) {
  try {
    await pool.query(`
      SELECT setval(
        pg_get_serial_sequence('"${tableName}"', 'id'),
        COALESCE((SELECT MAX(id) FROM "${tableName}"), 1)
      )
    `);
  } catch {
    // ignore if no sequence
  }
}

export async function seedFromSupabaseIfNeeded(): Promise<void> {
  try {
    // Check if we already have the real users from Supabase
    const existingUsers = await db.select({ id: usersTable.id, email: usersTable.email }).from(usersTable);
    const hasRealUsers = existingUsers.some(
      (u) =>
        u.email === "mili@gmail.com" ||
        u.email === "galvanbraian92@gmail.com" ||
        u.email === "nataliaruthfarias1988@gmail.com"
    );

    if (hasRealUsers) {
      console.log("[supabase-seed] Data already migrated, skipping.");
      return;
    }

    console.log("[supabase-seed] Starting migration from Supabase...");

    const order = [
      "professionals",
      "users",
      "patients",
      "patient_professionals",
      "goals",
      "goal_progress",
      "registros_clinicos",
      "citas",
      "pagos",
      "registros",
    ];

    for (const table of order) {
      const rows = await fetchAll(table);
      if (rows.length > 0) {
        const n = await upsertRaw(table, rows);
        await resetSequence(table);
        console.log(`[supabase-seed] ${table}: ${n}/${rows.length} upserted`);
      }
    }

    console.log("[supabase-seed] Migration complete.");
  } catch (err) {
    console.error("[supabase-seed] Migration failed:", err);
  }
}
