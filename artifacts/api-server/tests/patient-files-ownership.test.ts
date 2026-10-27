import assert from "node:assert/strict";
import { once } from "node:events";
import { after, test } from "node:test";
import { createRequire } from "node:module";
import vm from "node:vm";
import express from "express";
import { build } from "esbuild";
import * as schema from "@workspace/db/schema";

const requireModule = createRequire(import.meta.url);
const now = new Date("2026-09-29T12:00:00Z");
const patient = { id: 1, name: "Paciente ficticio", assignedProfessionalId: 2 };
const users = [
  { id: 1, name: "Admin de prueba" },
  { id: 2, name: "Profesional A" },
  { id: 3, name: "Profesional B" },
];
const tables = new Map<object, any[]>();
const storage = {
  configured: true,
  objects: new Set<string>(),
  uploadPaths: [] as string[],
  downloadPaths: [] as string[],
  deletedPaths: [] as string[],
  objectExistsCalls: 0,
  downloadTtls: [] as number[],
};

function reset() {
  patient.assignedProfessionalId = 2;
  tables.clear();
  tables.set(schema.patientsTable, [patient]);
  tables.set(schema.usersTable, users);
  tables.set(schema.patientFilesTable, []);
  storage.configured = true;
  storage.objects.clear();
  storage.uploadPaths.length = 0;
  storage.downloadPaths.length = 0;
  storage.deletedPaths.length = 0;
  storage.objectExistsCalls = 0;
  storage.downloadTtls.length = 0;
}

function matches(row: any, condition: any): boolean {
  if (!condition) return true;
  const chunks = condition.queryChunks ?? [];
  const nested = chunks.filter((item: any) => item?.queryChunks);
  if (nested.length) return nested.every((item: any) => matches(row, item));
  const column = chunks.find((item: any) => item?.name && item?.table);
  const parameter = chunks.find((item: any) => item?.constructor?.name === "Param");
  const name = Object.entries(column?.table ?? {}).find(([, value]) => value === column)?.[0];
  if (!name || !parameter) throw new Error("Mock cannot interpret SQL filter");
  return row[name] instanceof Date
    ? row[name].getTime() === parameter.value.getTime()
    : row[name] === parameter.value;
}

function columnValue(table: object, row: any, column: any) {
  const property = Object.entries(table).find(([, value]) => value === column)?.[0];
  return property ? row?.[property] : undefined;
}

const db = {
  select(selection?: any) {
    return { from(table: object) {
      let condition: any;
      let joinedUsers = false;
      const query = {
        leftJoin(joinTable: object) {
          joinedUsers = joinTable === schema.usersTable;
          return query;
        },
        where(value: any) { condition = value; return query; },
        orderBy() { return query; },
        then(resolve: (value: any[]) => void, reject?: (reason: unknown) => void) {
          try {
            const matched = (tables.get(table) ?? []).filter(row => matches(row, condition));
            if (!selection) {
              resolve(matched);
              return;
            }
            resolve(matched.map(row => {
              const uploadedByUser = joinedUsers
                ? users.find(user => user.id === row.uploadedBy) ?? null
                : null;
              return Object.fromEntries(Object.entries(selection).map(([key, column]) => {
                if ((column as any)?.table === schema.patientFilesTable) {
                  return [key, columnValue(schema.patientFilesTable, row, column)];
                }
                if ((column as any)?.table === schema.usersTable) {
                  return [key, columnValue(schema.usersTable, uploadedByUser, column)];
                }
                return [key, undefined];
              }));
            }));
          } catch (error) {
            reject?.(error);
          }
        },
      };
      return query;
    } };
  },
  insert(table: object) {
    return { values(value: any) { return { returning() {
      const rows = tables.get(table) ?? [];
      const row = { id: rows.length ? Math.max(...rows.map(item => item.id)) + 1 : 1, createdAt: now, ...value };
      rows.push(row);
      tables.set(table, rows);
      return Promise.resolve([row]);
    } }; } };
  },
  delete(table: object) {
    return { where(condition: any) {
      const rows = tables.get(table) ?? [];
      const removed = rows.filter(row => matches(row, condition));
      tables.set(table, rows.filter(row => !removed.includes(row)));
      return Promise.resolve();
    } };
  },
};

const output = await build({
  entryPoints: ["src/routes/patient-files.ts"],
  absWorkingDir: new URL("../", import.meta.url).pathname,
  bundle: true,
  platform: "node",
  format: "cjs",
  write: false,
  external: ["express", "@workspace/db", "@workspace/db/schema", "drizzle-orm", "../lib/supabaseStorage"],
  logLevel: "silent",
});
const exports: any = {};
const module = { exports };
vm.runInNewContext(output.outputFiles[0].text, {
  module,
  exports,
  require: (name: string) => {
    if (name === "@workspace/db") return { db };
    if (name === "@workspace/db/schema") return schema;
    if (name === "../lib/supabaseStorage") return {
      storageConfigured: () => storage.configured,
      createSignedUploadUrl: async (path: string) => {
        storage.uploadPaths.push(path);
        return { uploadUrl: `https://storage.test/upload/${encodeURIComponent(path)}` };
      },
      createSignedDownloadUrl: async (path: string, ttl: number) => {
        storage.downloadPaths.push(path);
        storage.downloadTtls.push(ttl);
        return `https://storage.test/download/${encodeURIComponent(path)}`;
      },
      objectExists: async (path: string) => {
        storage.objectExistsCalls++;
        return storage.objects.has(path);
      },
      deleteStorageObject: async (path: string) => {
        storage.deletedPaths.push(path);
        storage.objects.delete(path);
      },
    };
    return requireModule(name);
  },
  process: { env: { SESSION_SECRET: "test-only-secret" } },
  Buffer,
  Date,
  console,
}, { filename: "patient-files.ts" });

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
if (!address || typeof address === "string") throw new Error("Test server unavailable");
after(() => server.close());

async function call(method: string, path: string, user?: number, body?: unknown) {
  const response = await fetch(`http://127.0.0.1:${address.port}/api${path}`, {
    method,
    headers: { "content-type": "application/json", ...(user ? { "x-user": String(user) } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return {
    status: response.status,
    body: response.status === 204 ? null : await response.json(),
  };
}

test("file list, download, and deletion require both current assignment and uploader identity", async () => {
  reset();
  const ownedPath = "patients/1/owned.pdf";
  const foreignPath = "patients/1/foreign.pdf";
  tables.set(schema.patientFilesTable, [
    { id: 1, patientId: 1, uploadedBy: 2, originalName: "propio.pdf", mimeType: "application/pdf", sizeBytes: 20, storagePath: ownedPath, createdAt: now },
    { id: 2, patientId: 1, uploadedBy: 3, originalName: "ajeno.pdf", mimeType: "application/pdf", sizeBytes: 30, storagePath: foreignPath, createdAt: now },
  ]);
  storage.objects.add(ownedPath);
  storage.objects.add(foreignPath);

  const visible = await call("GET", "/patients/1/files", 2);
  assert.equal(visible.status, 200);
  assert.deepEqual(visible.body.map((file: any) => file.id), [1]);
  assert.equal(visible.body[0].uploadedByName, "Profesional A");

  assert.equal((await call("GET", "/patients/1/files/2/download", 2)).status, 404);
  assert.equal((await call("DELETE", "/patients/1/files/2", 2)).status, 404);
  assert.deepEqual(storage.downloadPaths, []);
  assert.deepEqual(storage.deletedPaths, []);
  assert.equal(tables.get(schema.patientFilesTable)?.length, 2);

  patient.assignedProfessionalId = 3;
  assert.equal((await call("GET", "/patients/1/files", 2)).status, 403);
  const afterReassignment = await call("GET", "/patients/1/files", 3);
  assert.deepEqual(afterReassignment.body.map((file: any) => file.id), [2]);
  assert.equal((await call("GET", "/patients/1/files/1/download", 3)).status, 404);
  assert.equal((await call("DELETE", "/patients/1/files/1", 3)).status, 404);
  assert.deepEqual(storage.downloadPaths, []);
  assert.deepEqual(storage.deletedPaths, []);

  const ownDownload = await call("GET", "/patients/1/files/2/download", 3);
  assert.equal(ownDownload.status, 200);
  assert.deepEqual(storage.downloadTtls, [60]);
  const ownDelete = await call("DELETE", "/patients/1/files/2", 3);
  assert.equal(ownDelete.status, 200);
  assert.deepEqual(storage.deletedPaths, [foreignPath]);
  assert.equal(tables.get(schema.patientFilesTable)?.length, 1);
});

test("upload metadata requires a short-lived proof issued to the uploading account", async () => {
  reset();
  const upload = await call("POST", "/patients/1/files/upload-url", 2, {
    name: "informe.pdf", mimeType: "application/pdf", size: 100,
  });
  assert.equal(upload.status, 200);
  const { storagePath, uploadProof } = upload.body;
  storage.objects.add(storagePath);

  const metadata = {
    originalName: "informe.pdf",
    mimeType: "application/pdf",
    size: 100,
    storagePath,
  };
  const before = tables.get(schema.patientFilesTable)?.length;
  const noProof = await call("POST", "/patients/1/files", 2, metadata);
  assert.equal(noProof.status, 403);
  assert.equal(tables.get(schema.patientFilesTable)?.length, before);
  assert.equal(storage.objectExistsCalls, 0, "invalid proof is rejected before storage lookup");

  patient.assignedProfessionalId = 3;
  const reassigned = await call("POST", "/patients/1/files", 3, { ...metadata, uploadProof });
  assert.equal(reassigned.status, 403);
  assert.equal(tables.get(schema.patientFilesTable)?.length, before);
  assert.equal(storage.objectExistsCalls, 0);

  patient.assignedProfessionalId = 2;
  const created = await call("POST", "/patients/1/files", 2, { ...metadata, uploadProof });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  assert.equal(created.body.uploadedBy, 2);
  assert.equal(tables.get(schema.patientFilesTable)?.length, 1);
});
