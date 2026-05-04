import pg from '/home/runner/workspace/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const { Pool } = pg;
const local = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: false,
});

async function fetchAll(table) {
  let rows = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=${limit}&offset=${offset}`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Accept': 'application/json',
      }
    });
    if (!res.ok) {
      const text = await res.text();
      console.log(`  [WARN] ${table}: HTTP ${res.status} - ${text.slice(0, 200)}`);
      return [];
    }
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    rows = rows.concat(batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return rows;
}

async function upsertRows(table, rows, conflictCol = 'id') {
  if (rows.length === 0) {
    console.log(`  ${table}: 0 rows (skipped)`);
    return;
  }
  const cols = Object.keys(rows[0]);
  let inserted = 0;
  let skipped = 0;
  for (const row of rows) {
    const values = cols.map(c => row[c]);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const colNames = cols.map(c => `"${c}"`).join(', ');
    const updateSet = cols
      .filter(c => c !== conflictCol)
      .map(c => `"${c}" = EXCLUDED."${c}"`)
      .join(', ');
    const query = updateSet
      ? `INSERT INTO "${table}" (${colNames}) VALUES (${placeholders}) ON CONFLICT ("${conflictCol}") DO UPDATE SET ${updateSet}`
      : `INSERT INTO "${table}" (${colNames}) VALUES (${placeholders}) ON CONFLICT ("${conflictCol}") DO NOTHING`;
    try {
      await local.query(query, values);
      inserted++;
    } catch (e) {
      skipped++;
    }
  }
  console.log(`  ${table}: ${inserted} upserted, ${skipped} skipped`);
}

async function fixSequence(table) {
  try {
    await local.query(`
      SELECT setval(
        pg_get_serial_sequence('"${table}"', 'id'),
        COALESCE((SELECT MAX(id) FROM "${table}"), 1)
      )
    `);
  } catch (_) {}
}

async function run() {
  console.log('=== Migración desde Supabase ===\n');

  const tables = [
    'goal_library',
    'professionals',
    'users',
    'patients',
    'patient_professionals',
    'actividades',
    'goals',
    'goal_progress',
    'registros_clinicos',
    'sessions',
    'citas',
    'pagos',
    'registros',
  ];

  for (const table of tables) {
    process.stdout.write(`Fetching ${table}... `);
    const rows = await fetchAll(table);
    console.log(`${rows.length} rows`);
    await upsertRows(table, rows);
    await fixSequence(table);
  }

  console.log('\n=== Verificación final ===');
  for (const table of tables) {
    const r = await local.query(`SELECT COUNT(*) as count FROM "${table}"`);
    console.log(`  ${table}: ${r.rows[0].count} registros`);
  }

  await local.end();
  console.log('\n✓ Migración completada.');
}

run().catch(e => {
  console.error('Error fatal:', e.message);
  process.exit(1);
});
