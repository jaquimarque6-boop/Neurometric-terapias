import assert from "node:assert/strict";
import { once } from "node:events";
import { after, test } from "node:test";
import { createRequire } from "node:module";
import vm from "node:vm";
import express from "express";
import bcrypt from "bcryptjs";
import { build } from "esbuild";
import * as schema from "@workspace/db/schema";

// Bundle only the real route source. No application bootstrap, session store,
// database pool or external AI client is loaded by this harness.
const requireModule = createRequire(import.meta.url);
const now = new Date();
const globalGoal = { id: 10, idObjetivo: "G10", nombreObjetivo: "Global", area: "lenguaje", areaClinica: "lenguaje", nivelDificultad: "básico", estadoBanco: "activo", franjaEtariaMin: 3, franjaEtariaMax: 8, isCustom: false, createdBy: null, createdAt: now };
const ownerGoal = { ...globalGoal, id: 11, idObjetivo: "G11", nombreObjetivo: "Propio", isCustom: true, createdBy: 2 };
const foreignGoal = { ...ownerGoal, id: 12, idObjetivo: "G12", nombreObjetivo: "Ajeno", createdBy: 3 };
const activity = (id: number, goalLibraryId: number | null) =>
  ({ id, goalLibraryId, titulo: `Actividad ${id}`, tipo: "clinica", createdAt: now });

const tables = new Map<object, any[]>();
const stats = { selects: 0, inserts: 0, updates: 0, deletes: 0, ai: 0 };
const savedSessions: { userId: number; userRole: string }[] = [];
function reset() {
  tables.clear();
  savedSessions.length = 0;
  tables.set(schema.patientsTable, [
    { id: 1, name: "Propio", age: "5", diagnosis: "lenguaje", assignedProfessionalId: 2 },
    { id: 2, name: "Ajeno", age: "5", diagnosis: "lenguaje", assignedProfessionalId: 3 },
  ]);
  tables.set(schema.goalLibraryTable, [globalGoal, ownerGoal, foreignGoal].map(g => ({ ...g })));
  tables.set(schema.actividadesTable, [activity(20, 10), activity(21, 11), activity(22, 12), activity(23, null)]);
  tables.set(schema.goalsTable, []);
  tables.set(schema.registrosClinicosTable, []);
  tables.set(schema.registrosTable, []);
  tables.set(schema.patientProfessionalsTable, []);
  tables.set(schema.professionalsTable, []);
  tables.set(schema.goalProgressTable, []);
  for (const key of Object.keys(stats) as (keyof typeof stats)[]) stats[key] = 0;
}

function filterRows(rows: any[], condition: any): any[] {
  if (!condition) return rows;
  const chunks = condition.queryChunks ?? [];
  const column = chunks.find((c: any) => c?.name && c?.table);
  const param = chunks.find((c: any) => c?.constructor?.name === "Param");
  const list = chunks.find((c: any) => Array.isArray(c));
  if (!column || (!param && !list)) throw new Error(`Mock cannot interpret SQL condition: ${JSON.stringify(chunks.map((c: any) => ({ name: c?.name, value: c?.value, type: c?.constructor?.name })))}`);
  const name = Object.entries(column.table).find(([, value]) => value === column)?.[0];
  if (!name) throw new Error("Mock cannot locate SQL column");
  return rows.filter(row => list
    ? list.some((item: any) => item.value === row[name])
    : row[name] === param.value);
}
const db = {
  select(_columns?: unknown) {
    return {
      from(table: object) {
        stats.selects++;
        let condition: unknown;
        const query = {
          where(c: unknown) { condition = c; return query; },
          orderBy(..._args: unknown[]) { return query; },
          then(resolve: (value: any[]) => void, reject?: (error: Error) => void) {
            try { resolve(filterRows(tables.get(table) ?? [], condition)); } catch (error) { reject?.(error as Error); }
          },
        };
        return query;
      },
    };
  },
  insert(table: object) {
    return { values(value: any) {
      return { returning() {
        stats.inserts++;
        const rows = tables.get(table) ?? [];
        const record = { id: rows.length ? Math.max(...rows.map((r: any) => r.id)) + 1 : 1, createdAt: now, ...value };
        rows.push(record);
        tables.set(table, rows);
        return Promise.resolve([record]);
      } };
    } };
  },
  update(table: object) {
    return { set(value: any) {
      return { where(condition: unknown) {
        return { returning() {
          const rows = filterRows(tables.get(table) ?? [], condition);
          stats.updates += rows.length;
          rows.forEach(row => Object.assign(row, value));
          return Promise.resolve(rows);
        } };
      } };
    } };
  },
  delete(table: object) {
    return { where(condition: unknown) {
      const rows = tables.get(table) ?? [];
      const removed = filterRows(rows, condition);
      stats.deletes += removed.length;
      tables.set(table, rows.filter(row => !removed.includes(row)));
      return Promise.resolve();
    } };
  },
};

class MockOpenAI {
  chat = { completions: { create: async () => {
    stats.ai++;
    return { choices: [{ message: { content: JSON.stringify({
      objetivos: [{ title: "Autorizado" }],
      motivoConsulta: "Autorizado",
      marcoConceptual: "Autorizado",
      sugerenciaFamilia: "Autorizado",
    }) } }] };
  } } };
}

async function loadRouter(file: string) {
  const output = await build({
    entryPoints: [`src/routes/${file}.ts`],
    absWorkingDir: new URL("../", import.meta.url).pathname,
    bundle: true, platform: "node", format: "cjs", write: false,
    external: ["express", "@workspace/db", "@workspace/db/schema", "drizzle-orm", "openai", "bcryptjs"],
    logLevel: "silent",
  });
  const exports: any = {};
  const module = { exports };
  vm.runInNewContext(output.outputFiles[0].text, {
    module, exports,
    require: (name: string) => {
      if (name === "@workspace/db") return { db };
      if (name === "@workspace/db/schema") return schema;
      if (name === "openai") return MockOpenAI;
      return requireModule(name);
    },
    process: { env: { OPENAI_API_KEY: "mock-key", SESSION_SECRET: "test-secret" } },
    Buffer, Date, console, setTimeout, clearTimeout,
  }, { filename: file });
  if (typeof (module.exports as any).default !== "function") throw new Error(`Router not loaded: ${file}`);
  return (module.exports as any).default;
}

const routes = await Promise.all([
  "goal-library", "actividades", "goal-codes", "goal-guidance",
  "ai-perfil", "ai-objetivos", "registros-clinicos", "auth",
].map(loadRouter));
const app = express();
app.use(express.json());
app.use((req: any, _res, next) => {
  const id = Number(req.headers["x-test-user"]);
  const role = req.headers["x-test-role"] === "admin" ? "admin" : "professional";
  req.session = {
    ...(id ? { userId: id, userRole: role } : {}),
    save: (cb: (err?: Error) => void) => {
      savedSessions.push({ userId: req.session.userId, userRole: req.session.userRole });
      cb();
    },
    destroy: (cb: () => void) => cb(),
  };
  next();
});
for (const route of routes) app.use("/api", route);
app.use((err: Error, _req: any, res: any, _next: any) => res.status(500).json({ error: err.message }));
const server = app.listen(0);
await once(server, "listening");
const address = server.address();
if (!address || typeof address === "string") throw new Error("Test server address unavailable");
const base = `http://127.0.0.1:${address.port}/api`;
after(() => server.close());

async function request(method: string, path: string, user?: "owner" | "foreign" | "admin", body?: any) {
  const id = user === "admin" ? 1 : user === "foreign" ? 3 : 2;
  const response = await fetch(base + path, {
    method,
    headers: { ...(user ? { "x-test-user": String(id), "x-test-role": user === "admin" ? "admin" : "professional" } : {}), "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}
async function status(method: string, path: string, user?: "owner" | "foreign" | "admin", body?: any) {
  return (await request(method, path, user, body)).status;
}

test("all protected route methods reject anonymous requests before DB or AI", async () => {
  reset();
  const endpoints: [string, string, any?][] = [
    ["GET", "/goal-library"], ["POST", "/goal-library", {}],
    ["PATCH", "/goal-library/10", {}], ["POST", "/goal-library/10/assign", { patientId: 1 }],
    ["GET", "/patients/1/suggested-goals"],
    ["GET", "/actividades"], ["POST", "/actividades", {}],
    ["PATCH", "/actividades/20", {}], ["DELETE", "/actividades/20"],
    ["POST", "/goal-codes/migrate", {}], ["POST", "/goal-guidance", {}],
    ["GET", "/ai/perfil/1"], ["PUT", "/ai/perfil/1", {}],
    ["POST", "/ai/perfil-generate", { patientId: 1 }],
    ["POST", "/ai/objetivos-suggest", { patientId: 1 }],
    ["POST", "/registros-clinicos", { patientId: 1, fecha: "2026-01-01" }],
  ];
  for (const [method, path, body] of endpoints) {
    assert.equal(await status(method, path, undefined, body), 401, `${method} ${path}`);
  }
  assert.equal(stats.selects + stats.inserts + stats.updates + stats.deletes + stats.ai, 0);
});

test("patient routes deny foreign patients before inserts, context queries and AI", async () => {
  reset();
  const endpoints: [string, string, any?][] = [
    ["GET", "/patients/2/suggested-goals"],
    ["POST", "/goal-library/10/assign", { patientId: 2 }],
    ["GET", "/ai/perfil/2"], ["PUT", "/ai/perfil/2", { perfil: {} }],
    ["POST", "/ai/perfil-generate", { patientId: 2 }],
    ["POST", "/ai/objetivos-suggest", { patientId: 2 }],
    ["POST", "/registros-clinicos", { patientId: 2, fecha: "2026-01-01" }],
  ];
  for (const [method, path, body] of endpoints) {
    const before = { ...stats };
    assert.equal(await status(method, path, "owner", body), 403, `${method} ${path}`);
    assert.equal(stats.inserts, before.inserts);
    assert.equal(stats.updates, before.updates);
    assert.equal(stats.ai, before.ai);
    assert.equal(stats.selects - before.selects, 1, "only patient authorization query allowed");
  }
  assert.equal(await status("POST", "/registros-clinicos", "owner", { patientId: 999, fecha: "2026-01-01" }), 404);
  assert.equal(await status("POST", "/goal-library/10/assign", "owner", { patientId: 999 }), 404);
});

test("admin and assigned professional pass clinical guards; authorized AI uses mocked provider", async () => {
  reset();
  assert.equal(await status("GET", "/patients/1/suggested-goals", "owner"), 200);
  assert.equal(await status("GET", "/patients/2/suggested-goals", "admin"), 200);
  assert.equal(await status("POST", "/goal-library/10/assign", "owner", { patientId: 1 }), 201);
  assert.equal(await status("POST", "/goal-library/10/assign", "admin", { patientId: 2 }), 201);
  assert.equal(await status("POST", "/registros-clinicos", "owner", { patientId: 1, fecha: "2026-01-01" }), 201);
  assert.equal(await status("GET", "/ai/perfil/1", "owner"), 200);
  assert.equal(await status("PUT", "/ai/perfil/1", "owner", { perfil: { motivoConsulta: "Test" } }), 200);
  assert.equal(await status("GET", "/ai/perfil/2", "admin"), 200);
  const suggested = await request("POST", "/ai/objetivos-suggest", "owner", { patientId: 1 });
  assert.equal(suggested.status, 200, JSON.stringify(suggested.body));
  assert.equal(suggested.body.objetivos[0].title, "Autorizado");
  assert.equal((await request("POST", "/ai/perfil-generate", "owner", { patientId: 1 })).status, 200);
  assert.equal(stats.ai, 2);
});

test("global library is readable to professionals but admin-written; custom goals are owner-only", async () => {
  reset();
  assert.deepEqual((await request("GET", "/goal-library", "owner")).body.map((g: any) => g.id), [10, 11]);
  assert.deepEqual((await request("GET", "/goal-library", "admin")).body.map((g: any) => g.id), [10, 11, 12]);
  assert.equal(await status("POST", "/goal-library", "owner", { idObjetivo: "NEW", nombreObjetivo: "Global" }), 403);
  assert.equal(await status("PATCH", "/goal-library/10", "owner", { nombreObjetivo: "Change" }), 403);
  assert.equal(await status("PATCH", "/goal-library/12", "owner", { nombreObjetivo: "Change" }), 403);
  assert.equal(await status("POST", "/goal-library/12/assign", "owner", { patientId: 1 }), 403);
  assert.equal(await status("PATCH", "/goal-library/11", "owner", { nombreObjetivo: "Updated" }), 200);
  assert.equal(await status("POST", "/goal-library", "owner", { idObjetivo: "NEW", nombreObjetivo: "Mine", isCustom: true }), 201);
  assert.equal(await status("POST", "/goal-library", "admin", { idObjetivo: "ADM", nombreObjetivo: "Admin" }), 201);
  assert.equal(await status("PATCH", "/goal-library/10", "admin", { nombreObjetivo: "Updated" }), 200);
  assert.equal(await status("POST", "/goal-library/11/assign", "owner", { patientId: 1 }), 201);
  const suggested = (await request("GET", "/patients/1/suggested-goals", "owner")).body;
  assert.ok(suggested.every((g: any) => g.createdBy !== 3));
});

test("activities inherit linked goal visibility and writes, including reassociation target", async () => {
  reset();
  assert.deepEqual((await request("GET", "/actividades", "owner")).body.map((a: any) => a.id), [20, 21, 23]);
  assert.deepEqual((await request("GET", "/actividades", "admin")).body.map((a: any) => a.id), [20, 21, 22, 23]);
  assert.equal(await status("POST", "/actividades", "owner", { titulo: "No link" }), 403);
  assert.equal(await status("POST", "/actividades", "owner", { titulo: "Global", goalLibraryId: 10 }), 403);
  assert.equal(await status("POST", "/actividades", "owner", { titulo: "Foreign", goalLibraryId: 12 }), 403);
  assert.equal(await status("PATCH", "/actividades/20", "owner", { titulo: "Edit" }), 403);
  assert.equal(await status("PATCH", "/actividades/22", "owner", { titulo: "Edit" }), 403);
  assert.equal(await status("DELETE", "/actividades/23", "owner"), 403);
  assert.equal(await status("PATCH", "/actividades/21", "owner", { goalLibraryId: 12 }), 403);
  assert.equal(await status("PATCH", "/actividades/21", "owner", { goalLibraryId: 10 }), 403);
  assert.equal(await status("PATCH", "/actividades/21", "owner", { goalLibraryId: null }), 403);
  assert.equal(await status("POST", "/actividades", "owner", { titulo: "Own", goalLibraryId: 11 }), 201);
  assert.equal(await status("PATCH", "/actividades/21", "owner", { titulo: "Edited" }), 200);
  assert.equal(await status("DELETE", "/actividades/21", "owner"), 204);
  assert.equal(await status("POST", "/actividades", "admin", { titulo: "Global", goalLibraryId: 10 }), 201);
  assert.equal(await status("PATCH", "/actividades/20", "admin", { goalLibraryId: 12 }), 200);
});

test("migration is admin-only and guidance requires authentication", async () => {
  reset();
  assert.equal(await status("POST", "/goal-codes/migrate", "owner", {}), 403);
  assert.equal(stats.selects, 0);
  assert.equal(await status("POST", "/goal-codes/migrate", "admin", {}), 200);
  assert.equal(await status("POST", "/goal-guidance", "owner", { title: "Goal" }), 200);
  assert.equal(stats.ai, 1);
});

test("unchanged login accepts admin and professional using bcrypt and persists the session", async () => {
  reset();
  const hash = await bcrypt.hash("correct-password", 4);
  tables.set(schema.usersTable, [
    { id: 1, email: "admin@example.test", passwordHash: hash, name: "Admin", role: "admin", active: true, professionalId: null },
    { id: 2, email: "pro@example.test", passwordHash: hash, name: "Professional", role: "professional", active: true, professionalId: null },
  ]);
  for (const role of ["admin", "pro"]) {
    const result = await request("POST", "/auth/login", undefined, { email: `${role}@example.test`, password: "correct-password" });
    assert.equal(result.status, 200);
    assert.equal(result.body.role, role === "pro" ? "professional" : "admin");
    assert.ok(result.body.token);
    assert.equal(await status("POST", "/auth/login", undefined, { email: `${role}@example.test`, password: "wrong" }), 401);
  }
  assert.deepEqual(savedSessions, [
    { userId: 1, userRole: "admin" },
    { userId: 2, userRole: "professional" },
  ]);
});