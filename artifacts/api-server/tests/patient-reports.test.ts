import assert from "node:assert/strict";
import { once } from "node:events";
import { after, test } from "node:test";
import { createRequire } from "node:module";
import vm from "node:vm";
import express from "express";
import { build } from "esbuild";
import * as schema from "@workspace/db/schema";

const now = new Date("2026-09-29T12:00:00Z");
const patient = { id: 1, name: "Paciente", fechaNacimiento: null, assignedProfessionalId: 2 };
const owner = { id: 2, name: "Profesional" };
const reports: any[] = [];
let queries = 0;
const matches = (row: any, condition: any): boolean => {
  if (!condition) return true;
  const chunks = condition.queryChunks ?? [];
  const nested = chunks.filter((item: any) => item?.queryChunks);
  if (nested.length > 0) return nested.every((item: any) => matches(row, item));
  const column = chunks.find((item: any) => item?.name && item?.table);
  const parameter = chunks.find((item: any) => item?.constructor?.name === "Param");
  const name = Object.entries(column?.table ?? {}).find(([, value]) => value === column)?.[0];
  if (!name || !parameter) throw Error("Unrecognized test filter");
  return row[name] instanceof Date ? row[name].getTime() === parameter.value.getTime() : row[name] === parameter.value;
};
const rows = (table: unknown) => table === schema.patientsTable ? [patient] :
  table === schema.usersTable ? [owner] : table === schema.patientReportsTable ? reports : [];
const db = {
  select(selection?: any) {
    return { from(table: unknown) {
      queries++;
      let condition: unknown;
      let joined = false;
      const q = {
        innerJoin(_table: unknown, _condition: unknown) { joined = true; return q; },
        where(value: unknown) { condition = value; return q; },
        orderBy(_value: unknown) { return q; },
        then(resolve: (value: any[]) => void, reject?: (reason: any) => void) {
          try {
            resolve(rows(table).filter(row => matches(row, condition)).map(row =>
              joined ? { report: row, authorName: owner.name } :
                selection ? { name: owner.name } : row));
          } catch (error) { reject?.(error); }
        },
      };
      return q;
    } };
  },
  insert(_table: unknown) {
    return { values(value: any) { return { returning() {
      const report = { id: reports.length + 1, createdAt: now, updatedAt: now, ...value };
      reports.push(report);
      return Promise.resolve([report]);
    } }; } };
  },
  update(_table: unknown) {
    return { set(value: any) { return { where(condition: unknown) { return { returning() {
      const found = reports.filter(report => matches(report, condition));
      found.forEach(report => Object.assign(report, value));
      return Promise.resolve(found);
    } }; } }; } };
  },
};

const source = await build({
  entryPoints: ["src/routes/patient-reports.ts"],
  absWorkingDir: new URL("../", import.meta.url).pathname,
  bundle: true, platform: "node", format: "cjs", write: false,
  external: ["express", "@workspace/db", "@workspace/db/schema", "drizzle-orm"], logLevel: "silent",
});
const exports: any = {};
const module = { exports };
const requireModule = createRequire(import.meta.url);
vm.runInNewContext(source.outputFiles[0].text, {
  module, exports, require: (name: string) => name === "@workspace/db" ? { db } :
    name === "@workspace/db/schema" ? schema : requireModule(name),
  Date, console, JSON,
}, { filename: "patient-reports.ts" });
const app = express();
app.use(express.json());
app.use((req: any, _res, next) => {
  const id = Number(req.header("x-user"));
  req.session = id ? { userId: id, userRole: id === 1 ? "admin" : "professional" } : {};
  next();
});
app.use("/api", (module.exports as any).default);
app.use((error: Error, _req: any, res: any, _next: any) => res.status(500).json({ error: error.message }));
const server = app.listen(0);
await once(server, "listening");
const address = server.address();
if (!address || typeof address === "string") throw Error("Server unavailable");
after(() => server.close());
async function call(method: string, path: string, user?: number, body?: unknown) {
  const response = await fetch(`http://127.0.0.1:${address.port}/api${path}`, {
    method, headers: { "content-type": "application/json", ...(user ? { "x-user": String(user) } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: await response.json() };
}

test("patient access precedes report reads and writes; admin remains authorized", async () => {
  reports.length = 0;
  assert.equal((await call("GET", "/patients/1/reports")).status, 401);
  assert.equal((await call("POST", "/patients/1/reports", undefined, {})).status, 401);
  const before = queries;
  assert.equal((await call("GET", "/patients/1/reports", 3)).status, 403);
  assert.equal(queries, before + 1, "foreign user may only perform authorization query");
  assert.equal((await call("POST", "/patients/1/reports", 3, {
    reportType: "family", title: "Ajeno", content: { v: 4 },
  })).status, 403);
  assert.equal(reports.length, 0);
  assert.equal((await call("GET", "/patients/1/reports", 1)).status, 200);
});

test("separate documents survive creation and editing does not duplicate or overwrite original author", async () => {
  reports.length = 0;
  assert.equal((await call("POST", "/patients/1/reports", 2, {
    reportType: "evolution", title: "Fecha inválida", content: { v: 4 },
    periodFrom: "2026-02-30",
  })).status, 400);
  const base = { reportType: "evolution", title: "Primer informe", content: { v: 4, resumen: "Texto" },
    periodKind: "mes", periodFrom: "2026-08-29", periodTo: "2026-09-29",
    clinicalRecordsUsedCount: 1, clinicalRecordsTotalCount: 3 };
  const first = await call("POST", "/patients/1/reports", 2, base);
  assert.equal(first.status, 201, JSON.stringify(first.body));
  assert.equal(first.body.authorUserId, 2);
  assert.equal(first.body.content.patientSnapshot.name, "Paciente");
  const second = await call("POST", "/patients/1/reports", 1,
    { reportType: "family", title: "Segundo informe", content: { v: 4, textoFamilia: "Familia" } });
  assert.equal(second.status, 201);
  assert.equal(second.body.periodKind, null);
  assert.equal(second.body.periodFrom, null);
  assert.equal(second.body.periodTo, null);
  assert.equal(second.body.clinicalRecordsUsedCount, null);
  assert.equal(second.body.clinicalRecordsTotalCount, null);
  assert.equal(first.body.clinicalRecordsUsedCount, 1);
  assert.equal(first.body.clinicalRecordsTotalCount, 3);
  assert.equal(reports.length, 2);
  const edit = await call("PUT", `/patients/1/reports/${first.body.id}`, 1,
    { updatedAt: first.body.updatedAt, title: "Editado", content: { v: 4, resumen: "Editado" } });
  assert.equal(edit.status, 200, JSON.stringify(edit.body));
  assert.equal(edit.body.authorUserId, 2);
  assert.equal(edit.body.updatedByUserId, 1);
  assert.equal(edit.body.clinicalRecordsUsedCount, 1);
  assert.equal(reports.length, 2);
  assert.equal(reports[1].title, "Segundo informe");
  assert.equal((await call("PUT", `/patients/1/reports/${first.body.id}`, 2,
    { updatedAt: "2020-01-01T00:00:00Z", title: "Conflict", content: { v: 4 } })).status, 409);
  assert.equal((await call("GET", `/patients/1/reports/${first.body.id}`, 3)).status, 403);
  assert.equal((await call("GET", `/patients/1/reports/${first.body.id}`, 2)).status, 200);
  assert.equal((await call("GET", "/patients/1/reports", 2)).body.length, 2);
});