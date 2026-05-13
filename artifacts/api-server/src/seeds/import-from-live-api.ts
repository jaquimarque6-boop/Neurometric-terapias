/**
 * import-from-live-api.ts
 *
 * Imports ONLY the missing users and patients from the live published Replit app
 * (https://neurometric-terapias.replit.app) into the current Supabase database.
 *
 * SOURCE : https://neurometric-terapias.replit.app  (36 users, 52 patients — Neon DB)
 * TARGET : DEPLOYMENT_DATABASE_URL                  (34 users, 31 patients — Supabase)
 *
 * SAFETY RULES (always enforced, even in live mode):
 *   - Never overwrites existing users   (checked by email)
 *   - Never overwrites existing patients (checked by id)
 *   - Never touches citas, registros_clinicos, goals, goal_library, sessions, citas, pagos
 *   - Never modifies auth config, env vars, Render, or Netlify settings
 *   - Patients are inserted with their ORIGINAL IDs (32–52) so professional
 *     assignments (assignedProfessionalId) remain correct without remapping.
 *   - Users are inserted WITHOUT specifying ID (sequence assigns the next
 *     available IDs ≥ 35), because IDs 32–34 are already taken in Supabase by
 *     different accounts. None of the 21 missing patients reference the 5
 *     missing users, so no remapping is needed.
 *
 * PASSWORD LIMITATION:
 *   The source API does NOT expose password_hash. Missing users are inserted
 *   with a bcrypt hash of the placeholder password below. Admins must share
 *   this temporary password with the affected professionals so they can log in
 *   and change it themselves.
 *
 * DEFAULTS TO DRY-RUN — prints every row that WOULD be inserted, writes nothing.
 *
 * Usage:
 *   Dry-run (default, safe):
 *     npx tsx artifacts/api-server/src/seeds/import-from-live-api.ts
 *
 *   Live import (writes to Supabase — run ONLY after dry-run passes):
 *     DRY_RUN=false npx tsx artifacts/api-server/src/seeds/import-from-live-api.ts
 */

import { Pool } from "pg";
import bcrypt from "bcryptjs";

// ─── Configuration ─────────────────────────────────────────────────────────────

const DRY_RUN = process.env.DRY_RUN !== "false"; // default: true (safe)

const SOURCE_BASE = "https://neurometric-terapias.replit.app";
const SOURCE_EMAIL = "admin@neurometric.com";
const SOURCE_PASS = "12345678";

/** Temporary password assigned to imported users. Must be communicated to them. */
const PLACEHOLDER_PASSWORD = "Neurometric2026!";

// ─── Target DB (Supabase via DEPLOYMENT_DATABASE_URL) ─────────────────────────

function getTargetPool(): Pool {
  const connStr = process.env.DEPLOYMENT_DATABASE_URL;
  if (!connStr) throw new Error("DEPLOYMENT_DATABASE_URL is not set");
  return new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ApiUser {
  id: number;
  email: string;
  name: string;
  role: string;
  specialty: string | null;
  active: boolean;
  createdAt: string;
}

interface ApiPatient {
  id: number;
  name: string;
  age: number | null;
  fechaNacimiento: string | null;
  diagnosis: string | null;
  profesionalNombre: string | null;
  assignedProfessionalId: number | null;
  franjaEtaria: string | null;
  fechaInicio: string | null;
  progreso: string | null;
  promedioDesempeno: number | null;
  semaforo: string | null;
  observaciones: string | null;
  motivoConsulta: string | null;
  antecedentes: string | null;
  historiaFamiliar: string | null;
  escolaridad: string | null;
  lenguajeComunicacion: string | null;
  atencionConducta: string | null;
  vozHabla: string | null;
  deglucion: string | null;
  impresionClinica: string | null;
  informeEvolucion: string | null;
  informeFamilia: string | null;
  informeMensual: string | null;
  createdAt: string;
}

// ─── Source API helpers ────────────────────────────────────────────────────────

async function getSessionCookie(): Promise<string> {
  const res = await fetch(`${SOURCE_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: SOURCE_EMAIL, password: SOURCE_PASS }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error("No Set-Cookie header on login response");
  // Extract the connect.sid cookie value
  const match = setCookie.match(/(connect\.sid=[^;]+)/);
  if (!match) throw new Error("Could not parse connect.sid from Set-Cookie: " + setCookie);
  return match[1];
}

async function fetchFromSource<T>(path: string, cookie: string): Promise<T> {
  const res = await fetch(`${SOURCE_BASE}${path}`, {
    headers: { Cookie: cookie },
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const mode = DRY_RUN ? "DRY-RUN (nothing will be written)" : "LIVE (data WILL be written to Supabase)";
  console.log(`\n${"═".repeat(70)}`);
  console.log(`  Neurometric — Import from Live API`);
  console.log(`  Mode: ${mode}`);
  console.log(`${"═".repeat(70)}\n`);

  // ── 1. Authenticate with source API ──────────────────────────────────────────
  console.log("► Authenticating with source API…");
  const cookie = await getSessionCookie();
  console.log("  ✓ Session established\n");

  // ── 2. Fetch source data ──────────────────────────────────────────────────────
  console.log("► Fetching source data from live API…");
  const [srcUsers, srcPatients] = await Promise.all([
    fetchFromSource<ApiUser[]>("/api/users", cookie),
    fetchFromSource<ApiPatient[]>("/api/patients", cookie),
  ]);
  console.log(`  Source: ${srcUsers.length} users, ${srcPatients.length} patients\n`);

  // ── 3. Connect to target DB ───────────────────────────────────────────────────
  console.log("► Connecting to target Supabase database…");
  const pool = getTargetPool();

  const [tgtUsersRes, tgtPatientsRes] = await Promise.all([
    pool.query<{ email: string }>("SELECT email FROM users"),
    pool.query<{ id: number }>("SELECT id FROM patients"),
  ]);
  const existingEmails = new Set(tgtUsersRes.rows.map((r) => r.email));
  const existingPatientIds = new Set(tgtPatientsRes.rows.map((r) => r.id));
  console.log(`  Target: ${existingEmails.size} existing users, ${existingPatientIds.size} existing patients\n`);

  // ── 4. Compute diff ───────────────────────────────────────────────────────────
  const missingUsers = srcUsers.filter((u) => !existingEmails.has(u.email));
  const missingPatients = srcPatients.filter((p) => !existingPatientIds.has(p.id));

  // ── 5. Report what will be inserted ──────────────────────────────────────────
  console.log(`${"─".repeat(70)}`);
  console.log(`USERS TO INSERT: ${missingUsers.length}`);
  console.log(`${"─".repeat(70)}`);

  if (missingUsers.length === 0) {
    console.log("  (none — all source users already exist in Supabase by email)\n");
  } else {
    console.log(`  ⚠  PASSWORD NOTE: password_hash is NOT exposed by the source API.`);
    console.log(`     These users will be inserted with placeholder password:`);
    console.log(`     "${PLACEHOLDER_PASSWORD}"`);
    console.log(`     Communicate this password to each professional so they can log in.\n`);

    for (const u of missingUsers) {
      console.log(
        `  INSERT user | email: ${u.email} | name: ${u.name} | role: ${u.role} | specialty: ${u.specialty ?? "null"} | active: ${u.active} | createdAt: ${u.createdAt}`
      );
    }
    console.log();
  }

  console.log(`${"─".repeat(70)}`);
  console.log(`PATIENTS TO INSERT: ${missingPatients.length}`);
  console.log(`${"─".repeat(70)}`);

  if (missingPatients.length === 0) {
    console.log("  (none — all source patients already exist in Supabase by id)\n");
  } else {
    for (const p of missingPatients.sort((a, b) => a.id - b.id)) {
      const clinicalFields = [
        p.motivoConsulta && "motivoConsulta",
        p.antecedentes && "antecedentes",
        p.escolaridad && "escolaridad",
        p.lenguajeComunicacion && "lenguajeComunicacion",
        p.atencionConducta && "atencionConducta",
        p.impresionClinica && "impresionClinica",
        p.informeEvolucion && "informeEvolucion",
      ]
        .filter(Boolean)
        .join(", ");

      console.log(
        `  INSERT patient id=${p.id} | "${p.name}" | age: ${p.age ?? "null"} | diagnosis: ${p.diagnosis ?? "null"} | prof_id: ${p.assignedProfessionalId ?? "null"} (${p.profesionalNombre ?? "unassigned"})${clinicalFields ? ` | clinical data: [${clinicalFields}]` : ""}`
      );
    }
    console.log();
  }

  // Report conflicts (patients that exist in both but with different prof assignment) — never touched
  const conflicts: Array<{ id: number; name: string; srcProf: number | null; tgtProf: number | null }> = [];
  const tgtPatientMap = new Map<number, { assigned_professional_id: number | null }>();
  (await pool.query<{ id: number; assigned_professional_id: number | null }>(
    "SELECT id, assigned_professional_id FROM patients"
  )).rows.forEach((r) => tgtPatientMap.set(r.id, r));

  for (const sp of srcPatients) {
    if (!existingPatientIds.has(sp.id)) continue;
    const tp = tgtPatientMap.get(sp.id);
    if (tp && tp.assigned_professional_id !== sp.assignedProfessionalId) {
      conflicts.push({ id: sp.id, name: sp.name, srcProf: sp.assignedProfessionalId, tgtProf: tp.assigned_professional_id });
    }
  }

  if (conflicts.length > 0) {
    console.log(`${"─".repeat(70)}`);
    console.log(`SKIPPED — PROFESSIONAL ASSIGNMENT CONFLICTS (patient exists in both, prof differs):`);
    console.log(`${"─".repeat(70)}`);
    for (const c of conflicts) {
      console.log(`  SKIP patient id=${c.id} "${c.name}" | source prof_id: ${c.srcProf} | target prof_id: ${c.tgtProf} — NOT modified`);
    }
    console.log();
  }

  // ── 6. Dry-run exit ───────────────────────────────────────────────────────────
  if (DRY_RUN) {
    console.log(`${"═".repeat(70)}`);
    console.log(`  DRY-RUN COMPLETE — nothing was written.`);
    console.log(`  To execute, run with:  DRY_RUN=false npx tsx artifacts/api-server/src/seeds/import-from-live-api.ts`);
    console.log(`${"═".repeat(70)}\n`);
    await pool.end();
    return;
  }

  // ── 7. Live insert — users ────────────────────────────────────────────────────
  console.log(`${"═".repeat(70)}`);
  console.log("LIVE MODE — writing to Supabase…");
  console.log(`${"═".repeat(70)}\n`);

  const passwordHash = await bcrypt.hash(PLACEHOLDER_PASSWORD, 10);
  let usersInserted = 0;

  for (const u of missingUsers) {
    // Do NOT specify id — the sequence will assign the next available ID.
    // IDs 32-34 are already taken in Supabase by different accounts.
    await pool.query(
      `INSERT INTO users (email, password_hash, role, name, specialty, active, created_at)
       SELECT $1, $2, $3, $4, $5, $6, $7
       WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = $1)`,
      [
        u.email,
        passwordHash,
        u.role,
        u.name,
        u.specialty,
        u.active,
        new Date(u.createdAt),
      ]
    );
    console.log(`  ✓ Inserted user: ${u.email} (${u.name})`);
    usersInserted++;
  }

  if (usersInserted > 0) {
    console.log(`\n  ${usersInserted} user(s) inserted.\n`);
  }

  // ── 8. Live insert — patients ─────────────────────────────────────────────────
  // Patients are inserted with their ORIGINAL IDs (32–52) so that
  // assignedProfessionalId references remain valid without remapping.
  let patientsInserted = 0;

  for (const p of missingPatients.sort((a, b) => a.id - b.id)) {
    await pool.query(
      `INSERT INTO patients
         (id, name, age, diagnosis, profesional_nombre, assigned_professional_id,
          franja_etaria, fecha_inicio, progreso, promedio_desempeno, semaforo,
          observaciones, motivo_consulta, antecedentes, historia_familiar, escolaridad,
          lenguaje_comunicacion, atencion_conducta, voz_habla, deglucion,
          impresion_clinica, informe_evolucion, informe_familia, informe_mensual,
          fecha_nacimiento, created_at)
       OVERRIDING SYSTEM VALUE
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
       ON CONFLICT (id) DO NOTHING`,
      [
        p.id,
        p.name,
        p.age,
        p.diagnosis,
        p.profesionalNombre,
        p.assignedProfessionalId,
        p.franjaEtaria,
        p.fechaInicio,
        p.progreso,
        p.promedioDesempeno,
        p.semaforo,
        p.observaciones,
        p.motivoConsulta,
        p.antecedentes,
        p.historiaFamiliar,
        p.escolaridad,
        p.lenguajeComunicacion,
        p.atencionConducta,
        p.vozHabla,
        p.deglucion,
        p.impresionClinica,
        p.informeEvolucion,
        p.informeFamilia,
        p.informeMensual,
        p.fechaNacimiento,
        new Date(p.createdAt),
      ]
    );
    console.log(`  ✓ Inserted patient id=${p.id}: "${p.name}" (${p.profesionalNombre ?? "unassigned"})`);
    patientsInserted++;
  }

  // Fix patients sequence so next auto-generated ID doesn't collide
  if (patientsInserted > 0) {
    const { rows } = await pool.query<{ max: number }>("SELECT MAX(id) AS max FROM patients");
    const maxId = rows[0]?.max ?? 52;
    await pool.query(`SELECT setval('patients_id_seq', $1, true)`, [maxId]);
    console.log(`\n  ${patientsInserted} patient(s) inserted. Sequence reset to ${maxId}.\n`);
  }

  // ── 9. Final verification ─────────────────────────────────────────────────────
  const [finalUsers, finalPatients] = await Promise.all([
    pool.query<{ count: string }>("SELECT COUNT(*) AS count FROM users"),
    pool.query<{ count: string }>("SELECT COUNT(*) AS count FROM patients"),
  ]);

  console.log(`${"═".repeat(70)}`);
  console.log(`  IMPORT COMPLETE`);
  console.log(`  Supabase now has: ${finalUsers.rows[0].count} users, ${finalPatients.rows[0].count} patients`);
  console.log(`${"═".repeat(70)}\n`);

  await pool.end();
}

main().catch((err) => {
  console.error("\n✗ FATAL ERROR:", err.message);
  process.exit(1);
});
