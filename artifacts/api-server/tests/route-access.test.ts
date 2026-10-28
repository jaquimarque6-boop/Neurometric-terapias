import assert from "node:assert/strict";
import { once } from "node:events";
import { after, test } from "node:test";
import { createRequire } from "node:module";
import vm from "node:vm";
import express from "express";
import bcrypt from "bcryptjs";
import { build } from "esbuild";
import * as schema from "@workspace/db/schema";
import {
  canRoleAccessApiRoute,
  shouldBypassCurrentUserAuthorization,
} from "../src/routes/access-policy";
import {
  buildPsychologySessionSummary,
  createEmptyPsychologySessionDraft,
} from "../../neurometric-lab/src/lib/psychology-session";
import { parsePsychologySessionSummary } from "@workspace/clinical-specialty";

// Bundle only the real route source. No application bootstrap, session store,
// database pool or external AI client is loaded by this harness.
const requireModule = createRequire(import.meta.url);
const now = new Date();
const testAiConsentVersion = "1.0";
const globalGoal = { id: 10, idObjetivo: "G10", nombreObjetivo: "Global", area: "lenguaje", areaClinica: "lenguaje", nivelDificultad: "básico", estadoBanco: "activo", franjaEtariaMin: 3, franjaEtariaMax: 8, isCustom: false, createdBy: null, createdAt: now };
const ownerGoal = { ...globalGoal, id: 11, idObjetivo: "G11", nombreObjetivo: "Propio", isCustom: true, createdBy: 2 };
const foreignGoal = { ...ownerGoal, id: 12, idObjetivo: "G12", nombreObjetivo: "Ajeno", createdBy: 3 };
const activity = (id: number, goalLibraryId: number | null) =>
  ({ id, goalLibraryId, titulo: `Actividad ${id}`, tipo: "clinica", createdAt: now });

const tables = new Map<object, any[]>();
const stats = { selects: 0, inserts: 0, updates: 0, deletes: 0, ai: 0 };
const savedSessions: { userId: number; userRole: string }[] = [];
const aiPrompts: string[] = [];
class MockWorkbook {
  worksheets: any[] = [];
  xlsx = {
    writeBuffer: async () => Buffer.from(JSON.stringify(this.worksheets)),
  };

  addWorksheet(name: string) {
    const worksheet: any = {
      name,
      columns: [],
      rows: [],
      getRow: () => ({}),
      addRow(row: any) { this.rows.push(row); },
    };
    this.worksheets.push(worksheet);
    return worksheet;
  }
}

const storage = {
  configured: false,
  uploadPaths: [] as string[],
  downloadPaths: [] as string[],
  deletedPaths: [] as string[],
  objects: new Set<string>(),
};
function reset() {
  tables.clear();
  savedSessions.length = 0;
  aiPrompts.length = 0;
  storage.configured = false;
  storage.uploadPaths.length = 0;
  storage.downloadPaths.length = 0;
  storage.deletedPaths.length = 0;
  storage.objects.clear();
  tables.set(schema.patientsTable, [
    { id: 1, name: "Propio", age: "5", diagnosis: "lenguaje", assignedProfessionalId: 2, createdAt: now },
    { id: 2, name: "Ajeno", age: "5", diagnosis: "lenguaje", assignedProfessionalId: 3, createdAt: now },
  ]);
  tables.set(schema.goalLibraryTable, [globalGoal, ownerGoal, foreignGoal].map(g => ({ ...g })));
  tables.set(schema.actividadesTable, [activity(20, 10), activity(21, 11), activity(22, 12), activity(23, null)]);
  tables.set(schema.goalsTable, []);
  tables.set(schema.registrosClinicosTable, []);
  tables.set(schema.registrosTable, []);
  tables.set(schema.patientReportsTable, []);
  tables.set(schema.citasTable, []);
  tables.set(schema.userConsentAcceptancesTable, []);
  tables.set(schema.patientProfessionalsTable, []);
  tables.set(schema.professionalsTable, []);
  tables.set(schema.goalProgressTable, []);
  for (const key of Object.keys(stats) as (keyof typeof stats)[]) stats[key] = 0;
}

function grantAiConsent(userId: number) {
  const rows = tables.get(schema.userConsentAcceptancesTable) ?? [];
  rows.push({
    id: rows.length + 1,
    userId,
    consentType: "ai",
    version: testAiConsentVersion,
    acceptedAt: now,
    acceptedByUserId: userId,
  });
  tables.set(schema.userConsentAcceptancesTable, rows);
}

function filterRows(rows: any[], condition: any): any[] {
  if (!condition) return rows;
  const comparisons: {
    name: string;
    value?: unknown;
    values?: any[];
    isNull?: boolean;
    isNotNull?: boolean;
  }[] = [];
  const visit = (chunk: any) => {
    const children = chunk?.queryChunks;
    if (!Array.isArray(children)) return;
    const column = children.find((child: any) => child?.name && child?.table);
    const param = children.find((child: any) => child?.constructor?.name === "Param");
    const list = children.find((child: any) => Array.isArray(child));
    const sqlText = children
      .filter((child: any) => child?.constructor?.name === "StringChunk")
      .flatMap((child: any) => child.value ?? [])
      .join("")
      .toLowerCase();
    if (column && (sqlText.includes("is null") || sqlText.includes("is not null"))) {
      const name = Object.entries(column.table).find(([, value]) => value === column)?.[0];
      if (!name) throw new Error("Mock cannot locate SQL column");
      comparisons.push({ name, isNull: sqlText.includes("is null") && !sqlText.includes("is not null"), isNotNull: sqlText.includes("is not null") });
      return;
    }
    if (column && (param || list)) {
      const name = Object.entries(column.table).find(([, value]) => value === column)?.[0];
      if (!name) throw new Error("Mock cannot locate SQL column");
      comparisons.push(param ? { name, value: param.value } : { name, values: list });
      return;
    }
    children.forEach(visit);
  };
  visit(condition);
  if (comparisons.length === 0) throw new Error("Mock cannot interpret SQL condition");
  return rows.filter(row => comparisons.every(({ name, value, values, isNull, isNotNull }) =>
    isNull ? row[name] == null
      : isNotNull ? row[name] != null
      : values ? values.some((item: any) => item.value === row[name]) : row[name] === value,
  ));
}

function filterConsentRows(rows: any[], condition: any): any[] {
  const comparisons: { name: string; value: unknown }[] = [];
  const visit = (chunk: any) => {
    const children = chunk?.queryChunks;
    if (!Array.isArray(children)) return;
    const column = children.find((child: any) => child?.name && child?.table);
    const param = children.find((child: any) => child?.constructor?.name === "Param");
    if (column && param) {
      const name = Object.entries(schema.userConsentAcceptancesTable)
        .find(([, value]) => value === column)?.[0];
      if (name) comparisons.push({ name, value: param.value });
      return;
    }
    children.forEach(visit);
  };
  visit(condition);
  if (comparisons.length === 0) throw new Error("Mock cannot interpret consent query");
  return rows.filter(row => comparisons.every(({ name, value }) => row[name] === value));
}

const db = {
  select(columns?: unknown) {
    const isCountOnlyQuery = Boolean(
      columns &&
      typeof columns === "object" &&
      "value" in columns &&
      !("userId" in columns),
    );
    const isGroupedCountQuery = Boolean(
      columns && typeof columns === "object" && "value" in columns && "userId" in columns,
    );
    return {
      from(table: object) {
        stats.selects++;
        let condition: unknown;
        let rowLimit: number | undefined;
        let groupColumn: any;
        let sortColumn: string | undefined;
        let sortDescending = false;
        const query = {
          where(c: unknown) { condition = c; return query; },
          orderBy(...args: any[]) {
            const chunks = args.flatMap(arg => arg?.queryChunks ?? []);
            const column = chunks.find((chunk: any) => chunk?.name && chunk?.table);
            sortColumn = column
              ? Object.entries(column.table).find(([, value]) => value === column)?.[0]
              : undefined;
            sortDescending = chunks.some((chunk: any) =>
              (chunk?.value ?? []).join?.("").toLowerCase().includes("desc"),
            );
            return query;
          },
          groupBy(column: unknown) { groupColumn = column; return query; },
          limit(count: number) { rowLimit = count; return query; },
          then(resolve: (value: any[]) => void, reject?: (error: Error) => void) {
            try {
              const sourceRows = tables.get(table) ?? [];
              let rows = table === schema.userConsentAcceptancesTable
                ? filterConsentRows(sourceRows, condition)
                : filterRows(sourceRows, condition);
              if (sortColumn) {
                rows = [...rows].sort((a, b) => {
                  const left = a[sortColumn!];
                  const right = b[sortColumn!];
                  const diff = left instanceof Date && right instanceof Date
                    ? left.getTime() - right.getTime()
                    : String(left ?? "").localeCompare(String(right ?? ""));
                  return sortDescending ? -diff || (sortDescending ? (b.id ?? 0) - (a.id ?? 0) : 0) : diff;
                });
              }
              if (isGroupedCountQuery && groupColumn?.table) {
                const groupKey = Object.entries(groupColumn.table)
                  .find(([, value]) => value === groupColumn)?.[0];
                if (!groupKey) throw new Error("Mock cannot locate grouped SQL column");
                const counts = new Map<any, number>();
                for (const row of rows) counts.set(row[groupKey], (counts.get(row[groupKey]) ?? 0) + 1);
                rows = [...counts].map(([userId, value]) => ({ userId, value }));
              }
              if (isCountOnlyQuery) {
                resolve([{ value: rows.length }]);
                return;
              }
              resolve(rowLimit === undefined ? rows : rows.slice(0, rowLimit));
            } catch (error) { reject?.(error as Error); }
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
        const rows = filterRows(tables.get(table) ?? [], condition);
        let executed = false;
        const execute = () => {
          if (executed) return;
          executed = true;
          stats.updates += rows.length;
          rows.forEach(row => Object.assign(row, value));
        };
        return {
          returning() {
            execute();
            return Promise.resolve(rows);
          },
          then(resolve: (value: any[]) => void, reject?: (error: Error) => void) {
            try {
              execute();
              resolve(rows);
            } catch (error) { reject?.(error as Error); }
          },
        };
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
  chat = { completions: { create: async (input: any) => {
    stats.ai++;
    const messages = JSON.stringify(input.messages);
    aiPrompts.push(messages);
    const isClinicalReport = input.messages.some((message: any) =>
      message.role === "user" && String(message.content).includes("Genera el informe clínico"),
    );
    const isClinicalProfile = input.messages.some((message: any) =>
      message.role === "user" && String(message.content).includes("Genera el PERFIL CLÍNICO"),
    );
    const response = isClinicalReport ? {
      resumen: "Al inicio solicitó un objeto de transición antes de comenzar.",
      conducta: "",
      areas: {
        "Funciones cognitivas y ejecutivas": "Participó en la organización de una secuencia con apoyo.",
        "Cognición": "",
      },
      sugerencias: "",
    } : isClinicalProfile ? {
      motivoConsulta: "Consulta por dificultades descritas en la anamnesis.",
      antecedentes: "",
      fortalezas: "",
      dificultades: "",
      areasIntervencion: "",
      objetivosPrioritarios: "",
      resumenProfesional: "Síntesis basada en los datos consignados.",
    } : {
      objetivos: [{ title: "Autorizado" }],
      motivoConsulta: "Autorizado",
      marcoConceptual: "Autorizado",
      sugerenciaFamilia: "Autorizado",
    };
    return { choices: [{ message: { content: JSON.stringify(response) } }] };
  } } };
}

async function loadRouter(file: string) {
  const output = await build({
    entryPoints: [`src/routes/${file}.ts`],
    absWorkingDir: new URL("../", import.meta.url).pathname,
    bundle: true, platform: "node", format: "cjs", write: false,
    external: ["express", "@workspace/db", "@workspace/db/schema", "drizzle-orm", "openai", "bcryptjs", "exceljs", "../lib/supabaseStorage"],
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
      if (name === "exceljs") return { Workbook: MockWorkbook };
      if (name === "../lib/supabaseStorage") return {
        storageConfigured: () => storage.configured,
        createSignedUploadUrl: async (path: string) => {
          storage.uploadPaths.push(path);
          return { uploadUrl: `https://storage.test/upload/${encodeURIComponent(path)}` };
        },
        createSignedDownloadUrl: async (path: string) => {
          storage.downloadPaths.push(path);
          return `https://storage.test/download/${encodeURIComponent(path)}`;
        },
        objectExists: async (path: string) => storage.objects.has(path),
        deleteStorageObject: async (path: string) => {
          storage.deletedPaths.push(path);
          storage.objects.delete(path);
        },
      };
      return requireModule(name);
    },
    process: {
      env: { OPENAI_API_KEY: "mock-key", SESSION_SECRET: "test-secret", CONSENT_AI_VERSION: testAiConsentVersion },
      versions: process.versions,
    },
    Buffer, Date, console, setTimeout, clearTimeout,
  }, { filename: file });
  if (typeof (module.exports as any).default !== "function") throw new Error(`Router not loaded: ${file}`);
  return (module.exports as any).default;
}

const routes = await Promise.all([
  "auth", "users", "patients", "professionals", "goal-library", "actividades", "goal-codes", "goal-guidance",
  "ai-perfil", "ai-objetivos", "ai-informe", "registros-clinicos", "citas", "export",
].map(loadRouter));
const app = express();
app.use(express.json());
app.use((req: any, _res, next) => {
  const id = Number(req.headers["x-test-user"]);
  const role = req.headers["x-test-role"] ?? "professional";
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

async function request(
  method: string,
  path: string,
  user?: "owner" | "foreign" | "admin" | "collaborator",
  body?: any,
  bypassRolePolicy = false,
) {
  const role =
    user === "owner" || user === "foreign"
      ? "professional"
      : user === "admin" || user === "collaborator"
        ? user
        : undefined;
  const hasPriorSession = Boolean(user);
  const bypassCurrentUserAuthorization = shouldBypassCurrentUserAuthorization(
    method,
    `/api${path}`,
    hasPriorSession,
    false,
  );
  if (
    hasPriorSession &&
    !bypassCurrentUserAuthorization &&
    !bypassRolePolicy &&
    role &&
    !canRoleAccessApiRoute(role, method, `/api${path}`)
  ) {
    return { status: 403, body: { error: "Acceso denegado" } };
  }
  const id = user === "admin" ? 1 : user === "foreign" ? 3 : user === "collaborator" ? 4 : 2;
  const response = await fetch(base + path, {
    method,
    headers: { ...(user ? { "x-test-user": String(id), "x-test-role": role ?? "professional" } : {}), "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}
async function status(method: string, path: string, user?: "owner" | "foreign" | "admin" | "collaborator", body?: any) {
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
    ["GET", "/ai/perfil/1"], ["GET", "/ai/perfil/1/versions"], ["PUT", "/ai/perfil/1", {}],
    ["POST", "/ai/perfil-generate", { patientId: 1 }],
    ["POST", "/ai/objetivos-suggest", { patientId: 1 }],
    ["POST", "/ai/informe-generate", { patientId: 1 }],
    ["POST", "/registros-clinicos", { patientId: 1, fecha: "2026-01-01" }],
  ];
  for (const [method, path, body] of endpoints) {
    assert.equal(await status(method, path, undefined, body), 401, `${method} ${path}`);
  }
  assert.equal(stats.selects + stats.inserts + stats.updates + stats.deletes + stats.ai, 0);
});

test("admin sessions are denied clinical routes before any clinical query, write, or AI call", async () => {
  reset();
  const endpoints: [string, string, any?][] = [
    ["GET", "/goal-library"],
    ["POST", "/goal-library", { idObjetivo: "NEW", nombreObjetivo: "Objetivo" }],
    ["GET", "/patients/1/suggested-goals"],
    ["POST", "/goal-library/10/assign", { patientId: 1 }],
    ["GET", "/actividades"],
    ["POST", "/actividades", { titulo: "Actividad" }],
    ["GET", "/goal-codes/check?code=L-01"],
    ["POST", "/goal-codes/generate", { areaClinica: "lenguaje" }],
    ["POST", "/goal-codes/migrate", {}],
    ["POST", "/goal-guidance", { title: "Objetivo" }],
    ["GET", "/ai/perfil/1"],
    ["GET", "/ai/perfil/1/versions"],
    ["PUT", "/ai/perfil/1", { perfil: {} }],
    ["POST", "/ai/perfil-generate", { patientId: 1 }],
    ["POST", "/ai/objetivos-suggest", { patientId: 1 }],
    ["POST", "/ai/informe-generate", { patientId: 1 }],
    ["POST", "/registros-clinicos", { patientId: 1, fecha: "2026-01-01" }],
  ];
  for (const [method, path, body] of endpoints) {
    assert.equal(await status(method, path, "admin", body), 403, `${method} ${path}`);
  }
  assert.equal(stats.selects + stats.inserts + stats.updates + stats.deletes + stats.ai, 0);
});

test("patient router independently rejects admin requests before reading patient data", async () => {
  reset();
  const result = await request("GET", "/patients", "admin", undefined, true);
  assert.equal(result.status, 403);
  assert.equal(stats.selects, 0);
});

test("collaborator sessions cannot enter clinical routes while login remains public", async () => {
  reset();
  const before = stats.selects + stats.inserts + stats.updates + stats.deletes + stats.ai;
  const deniedPatients = await request("GET", "/patients", "collaborator");
  assert.equal(deniedPatients.status, 403);
  const deniedClinicalRecords = await request("GET", "/registros-clinicos", "collaborator");
  assert.equal(deniedClinicalRecords.status, 403);
  assert.equal(stats.selects + stats.inserts + stats.updates + stats.deletes + stats.ai, before);
});

test("admin user management returns account metadata only and cannot change a role", async () => {
  reset();
  tables.set(schema.usersTable, [{
    id: 2,
    email: "professional@example.test",
    name: "Profesional de prueba",
    passwordHash: "not-returned",
    role: "professional",
    specialty: "Fonoaudiología",
    active: true,
    createdAt: now,
    commercialStatus: "trial",
    trialStartDate: null,
    trialEndDate: null,
    trialStartPending: false,
    lastPaymentDate: null,
    nextDueDate: null,
    monthlyAmount: null,
    paymentMethod: null,
    internalNotes: null,
    professionalId: null,
  }]);
  const users = await request("GET", "/users", "admin");
  assert.equal(users.status, 200);
  assert.equal(users.body.length, 1);
  assert.equal(users.body[0].email, "professional@example.test");
  assert.equal("passwordHash" in users.body[0], false);
  assert.equal("stats" in users.body[0], false);
  assert.equal("pacientes" in users.body[0], false);
  const selectsBeforeDeniedRoleChange = stats.selects;
  assert.equal(await status("PATCH", "/users/2", "admin", { role: "admin" }), 403);
  assert.equal(stats.selects, selectsBeforeDeniedRoleChange, "the rejected role change does not query clinical or account rows");
});

test("admin professional directory returns contact metadata without querying patient assignments", async () => {
  reset();
  tables.set(schema.professionalsTable, [{
    id: 7,
    name: "Profesional de prueba",
    email: "professional@example.test",
    phone: "555-0100",
    specialty: "Fonoaudiología",
    license: "LIC-7",
    status: "active",
    createdAt: now,
  }]);

  const result = await request("GET", "/professionals", "admin");
  assert.equal(result.status, 200);
  assert.equal(result.body.length, 1);
  assert.equal(result.body[0].name, "Profesional de prueba");
  assert.equal("patientCount" in result.body[0], false);
  assert.equal(stats.selects, 1, "the directory reads professional records only");
});

test("patient routes deny foreign patients before inserts, context queries and AI", async () => {
  reset();
  grantAiConsent(2);
  const endpoints: [string, string, any?][] = [
    ["GET", "/patients/2/suggested-goals"],
    ["POST", "/goal-library/10/assign", { patientId: 2 }],
    ["GET", "/ai/perfil/2"], ["PUT", "/ai/perfil/2", { perfil: {} }],
    ["POST", "/ai/perfil-generate", { patientId: 2 }],
    ["POST", "/ai/objetivos-suggest", { patientId: 2 }],
    ["POST", "/ai/informe-generate", { patientId: 2 }],
    ["POST", "/registros-clinicos", { patientId: 2, fecha: "2026-01-01" }],
  ];
  for (const [method, path, body] of endpoints) {
    const before = { ...stats };
    assert.equal(await status(method, path, "owner", body), 403, `${method} ${path}`);
    assert.equal(stats.inserts, before.inserts);
    assert.equal(stats.updates, before.updates);
    assert.equal(stats.ai, before.ai);
    const consentChecked = path === "/ai/perfil-generate" || path === "/ai/objetivos-suggest" || path === "/ai/informe-generate";
    assert.equal(
      stats.selects - before.selects,
      consentChecked ? 2 : 1,
      consentChecked ? "only AI consent and patient authorization queries allowed" : "only patient authorization query allowed",
    );
  }
  assert.equal(await status("POST", "/registros-clinicos", "owner", { patientId: 999, fecha: "2026-01-01" }), 404);
  assert.equal(await status("POST", "/goal-library/10/assign", "owner", { patientId: 999 }), 404);
});

test("patient list coverage data is scoped to each professional account", async () => {
  reset();
  const rows = tables.get(schema.patientsTable)!;
  rows[0].archived = false;
  rows[0].coberturaMedica = "Cobertura propia";
  rows[1].archived = false;
  rows[1].coberturaMedica = "Cobertura de otra cuenta";
  rows.push(
    {
      id: 3,
      name: "Paciente archivado propio",
      assignedProfessionalId: 2,
      archived: true,
      coberturaMedica: "Cobertura archivada propia",
      createdAt: now,
    },
    {
      id: 4,
      name: "Paciente archivado ajeno",
      assignedProfessionalId: 3,
      archived: true,
      coberturaMedica: "Cobertura archivada ajena",
      createdAt: now,
    },
  );

  const ownerPatients = await request("GET", "/patients", "owner");
  assert.equal(ownerPatients.status, 200);
  assert.equal(ownerPatients.body.length, 1);
  assert.equal(ownerPatients.body[0].coberturaMedica, "Cobertura propia");
  assert.equal(
    ownerPatients.body.some((patient: any) => patient.coberturaMedica === "Cobertura de otra cuenta"),
    false,
  );

  const ownerArchivedPatients = await request("GET", "/patients?includeArchived=true", "owner");
  assert.equal(ownerArchivedPatients.status, 200);
  assert.equal(ownerArchivedPatients.body.length, 1);
  assert.equal(ownerArchivedPatients.body[0].coberturaMedica, "Cobertura archivada propia");
  assert.equal(
    ownerArchivedPatients.body.some((patient: any) => patient.coberturaMedica === "Cobertura archivada ajena"),
    false,
  );

  const foreignPatients = await request("GET", "/patients", "foreign");
  assert.equal(foreignPatients.status, 200);
  assert.equal(foreignPatients.body.length, 1);
  assert.equal(foreignPatients.body[0].coberturaMedica, "Cobertura de otra cuenta");

  const foreignArchivedPatients = await request("GET", "/patients?includeArchived=true", "foreign");
  assert.equal(foreignArchivedPatients.status, 200);
  assert.equal(foreignArchivedPatients.body.length, 1);
  assert.equal(foreignArchivedPatients.body[0].coberturaMedica, "Cobertura archivada ajena");
});

test("patient coverage is optional, persists through existing patient access, and never changes unrelated fields", async () => {
  reset();

  const created = await request("POST", "/patients", "owner", {
    name: "Paciente ficticio con cobertura",
    coberturaMedica: "  Prepaga de prueba  ",
    numeroAfiliado: "  AF-TEST-42  ",
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  assert.equal(created.body.coberturaMedica, "Prepaga de prueba");
  assert.equal(created.body.numeroAfiliado, "AF-TEST-42");

  const createdRow = tables.get(schema.patientsTable)?.find(row => row.id === created.body.id);
  assert.equal(createdRow?.coberturaMedica, "Prepaga de prueba");
  assert.equal(createdRow?.numeroAfiliado, "AF-TEST-42");

  const privatePayPatient = await request("POST", "/patients", "owner", {
    name: "Paciente particular ficticio",
  });
  assert.equal(privatePayPatient.status, 201);
  assert.equal(privatePayPatient.body.coberturaMedica, null);
  assert.equal(privatePayPatient.body.numeroAfiliado, null);

  const updated = await request("PUT", "/patients/1", "owner", {
    coberturaMedica: "Obra social de prueba",
    numeroAfiliado: "",
  });
  assert.equal(updated.status, 200, JSON.stringify(updated.body));
  assert.equal(updated.body.coberturaMedica, "Obra social de prueba");
  assert.equal(updated.body.numeroAfiliado, null);
  assert.equal(updated.body.name, "Propio");
  assert.equal(updated.body.diagnosis, "lenguaje");

  const updatesBeforeDeniedRequest = stats.updates;
  const denied = await request("PUT", "/patients/2", "owner", {
    coberturaMedica: "No autorizado",
  });
  assert.equal(denied.status, 403);
  assert.equal(stats.updates, updatesBeforeDeniedRequest);

  const invalid = await request("PATCH", "/patients/1", "owner", {
    numeroAfiliado: 42,
  });
  assert.equal(invalid.status, 400);
  assert.equal(stats.updates, updatesBeforeDeniedRequest);
});

test("assigned professional can access own clinical data and authorized AI uses mocked provider", async () => {
  reset();
  grantAiConsent(2);
  assert.equal(await status("GET", "/patients/1/suggested-goals", "owner"), 200);
  assert.equal(await status("POST", "/goal-library/10/assign", "owner", { patientId: 1 }), 201);
  assert.equal(await status("POST", "/registros-clinicos", "owner", { patientId: 1, fecha: "2026-01-01" }), 201);
  assert.equal(await status("GET", "/ai/perfil/1", "owner"), 200);
  assert.equal(await status("PUT", "/ai/perfil/1", "owner", {
    perfil: {
      motivoConsulta: "Test", antecedentes: "", fortalezas: "", dificultades: "",
      areasIntervencion: "", objetivosPrioritarios: "", resumenProfesional: "",
    },
  }), 201);
  const suggested = await request("POST", "/ai/objetivos-suggest", "owner", { patientId: 1 });
  assert.equal(suggested.status, 200, JSON.stringify(suggested.body));
  assert.equal(suggested.body.objetivos[0].title, "Autorizado");
  assert.equal((await request("POST", "/ai/perfil-generate", "owner", { patientId: 1 })).status, 200);
  assert.equal(stats.ai, 2);
});

test("AI reports use only sessions authored by the requesting account", async () => {
  reset();
  grantAiConsent(2);
  const today = now.toISOString().slice(0, 10);
  tables.set(schema.registrosClinicosTable, [
    {
      id: 101, patientId: 1, userId: 2, fecha: today,
      resumenSesion: "DETALLE_PROPIO_DE_PRUEBA", observaciones: "Nota propia ficticia",
      recomendacionesHogar: null, materialesActividades: [], createdAt: now,
    },
    {
      id: 102, patientId: 1, userId: 3, fecha: today,
      resumenSesion: "DETALLE_AJENO_DE_PRUEBA", observaciones: "Nota ajena ficticia",
      recomendacionesHogar: null, materialesActividades: [], createdAt: now,
    },
  ]);
  tables.set(schema.registrosTable, [{
    id: 201, patientId: 1, fecha: today, objetivoNombre: "Objetivo sin autoría",
    informeSesion: "DETALLE_LEGACY_SIN_AUTOR_DE_PRUEBA", createdAt: now,
  }]);

  const response = await request("POST", "/ai/informe-generate", "owner", {
    patientId: 1,
    rango: "historia",
  }, true);
  assert.equal(response.status, 200, JSON.stringify(response.body));
  assert.deepEqual(response.body.clinicalSnapshot.map((session: any) => session.id), [101]);
  assert.equal(response.body.clinicalRecordsTotalCount, 1);
  assert.equal(aiPrompts.length, 1);
  assert.match(aiPrompts[0], /DETALLE_PROPIO_DE_PRUEBA/);
  assert.doesNotMatch(aiPrompts[0], /DETALLE_AJENO_DE_PRUEBA/);
  assert.doesNotMatch(aiPrompts[0], /DETALLE_LEGACY_SIN_AUTOR_DE_PRUEBA/);
  assert.match(aiPrompts[0], /La evidencia disponible puede ser parcial/);
  assert.doesNotMatch(aiPrompts[0], /registros históricos importados de desempeño excluidos por procedencia/);
  assert.doesNotMatch(aiPrompts[0], /Sesiones clínicas incluidas:|Total de sesiones verificables|Sesión 1 —/);
});

test("AI clinical profiles use only authorized sessions and recorded progress", async () => {
  reset();
  grantAiConsent(2);
  const today = now.toISOString().slice(0, 10);
  tables.set(schema.patientsTable, [{
    ...tables.get(schema.patientsTable)![0],
    psychologyData: {
      schemaVersion: 1,
      anamnesis: {
        sections: {
          reasonAndExpectations: { status: "recorded", text: "MOTIVO_PSICOLOGIA_SINTETICO" },
        },
      },
      evaluations: [{
        id: "evaluation-test",
        title: "Evaluación sintética",
        date: today,
        status: "completed",
        areas: { cognitiveExecutive: "EVALUACION_PSICOLOGIA_SINTETICA" },
        interviews: [],
        instruments: [],
        professionalInterpretation: "",
      }],
    },
  }]);
  tables.set(schema.registrosClinicosTable, [
    {
      id: 101, patientId: 1, userId: 2, fecha: today,
      resumenSesion: "DETALLE_PROPIO_PERFIL", observaciones: "Observación propia ficticia",
      recomendacionesHogar: null, materialesActividades: [], createdAt: now,
    },
    {
      id: 102, patientId: 1, userId: 3, fecha: today,
      resumenSesion: "DETALLE_AJENO_PERFIL", observaciones: "Nota ajena ficticia",
      recomendacionesHogar: null, materialesActividades: [], createdAt: now,
    },
  ]);
  tables.set(schema.goalsTable, [{
    id: 31, patientId: 1, status: "activo", title: "Objetivo sin porcentaje",
    areaClinica: "cognición", category: "cognición", progressPct: null, createdAt: now,
  }]);
  tables.set(schema.patientProfessionalsTable, [{ id: 1, patientId: 1, professionalId: 7 }]);
  tables.set(schema.professionalsTable, [{ id: 7, name: "Profesional ficticio", specialty: "Psicología" }]);

  const response = await request("POST", "/ai/perfil-generate", "owner", { patientId: 1 });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  assert.equal(aiPrompts.length, 1);
  assert.match(aiPrompts[0], /DETALLE_PROPIO_PERFIL/);
  assert.doesNotMatch(aiPrompts[0], /DETALLE_AJENO_PERFIL/);
  assert.match(aiPrompts[0], /MOTIVO_PSICOLOGIA_SINTETICO/);
  assert.match(aiPrompts[0], /EVALUACION_PSICOLOGIA_SINTETICA/);
  assert.doesNotMatch(aiPrompts[0], /progreso registrado: (0|20|55|100)%/);
});

test("clinical profile saves create immutable author-scoped versions and preserve legacy data", async () => {
  reset();
  const patientRows = tables.get(schema.patientsTable)!;
  patientRows[0].perfilIa = JSON.stringify({ motivoConsulta: "PERFIL_LEGADO_INTACTO" });
  patientRows[0].perfilIaCreatedAt = now;
  patientRows[0].perfilIaUpdatedAt = now;

  const legacy = await request("GET", "/ai/perfil/1", "owner");
  assert.equal(legacy.status, 200);
  assert.equal(legacy.body.source, "legacy");
  assert.equal(legacy.body.perfil.motivoConsulta, "PERFIL_LEGADO_INTACTO");

  const profile = {
    motivoConsulta: "Versión nueva",
    antecedentes: "",
    fortalezas: "",
    dificultades: "",
    areasIntervencion: "",
    objetivosPrioritarios: "",
    resumenProfesional: "",
  };
  const first = await request("PUT", "/ai/perfil/1", "owner", { perfil: profile });
  assert.equal(first.status, 201);
  assert.equal(first.body.source, "version");
  assert.equal(patientRows[0].perfilIa, JSON.stringify({ motivoConsulta: "PERFIL_LEGADO_INTACTO" }));

  const second = await request("PUT", "/ai/perfil/1", "owner", { perfil: { ...profile, motivoConsulta: "Segunda versión" } });
  assert.equal(second.status, 201);
  assert.notEqual(second.body.versionId, first.body.versionId);
  assert.equal((await request("GET", "/ai/perfil/1", "owner")).body.perfil.motivoConsulta, "Segunda versión");
  const versions = await request("GET", "/ai/perfil/1/versions", "owner");
  assert.equal(versions.status, 200);
  assert.deepEqual(versions.body.map((version: any) => version.perfil.motivoConsulta), ["Segunda versión", "Versión nueva"]);
  assert.equal((await request("GET", "/ai/perfil/1/versions", "foreign")).status, 403);
  patientRows[0].assignedProfessionalId = 3;
  const reassignedVersions = await request("GET", "/ai/perfil/1/versions", "foreign");
  assert.equal(reassignedVersions.status, 200);
  assert.deepEqual(reassignedVersions.body, [], "the newly assigned professional cannot see another account's versions");
  const reassignedCurrent = await request("GET", "/ai/perfil/1", "foreign");
  assert.equal(reassignedCurrent.body.source, "legacy", "legacy data must not be attributed to the former author");
});

test("AI prompt stays unchanged when no excluded historical performance records exist", async () => {
  reset();
  grantAiConsent(2);
  const today = now.toISOString().slice(0, 10);
  tables.set(schema.registrosClinicosTable, [{
    id: 101, patientId: 1, userId: 2, fecha: today,
    resumenSesion: "DETALLE_PROPIO_DE_PRUEBA", observaciones: null,
    recomendacionesHogar: null, materialesActividades: [], createdAt: now,
  }]);

  const response = await request("POST", "/ai/informe-generate", "owner", {
    patientId: 1,
    rango: "historia",
  }, true);
  assert.equal(response.status, 200, JSON.stringify(response.body));
  assert.equal(aiPrompts.length, 1);
  assert.match(aiPrompts[0], /DETALLE_PROPIO_DE_PRUEBA/);
  assert.doesNotMatch(aiPrompts[0], /La evidencia disponible puede ser parcial/);
  assert.doesNotMatch(aiPrompts[0], /Sesiones clínicas incluidas:|Total de sesiones verificables|Sesión 1 —/);
});

test("AI report improvement receives professional text for incremental additions and rejects oversized drafts", async () => {
  reset();
  grantAiConsent(2);
  const draft = {
    resumen: "OBSERVACION_PROFESIONAL_QUE_DEBE_CONSERVARSE",
    conducta: "Conducta ya redactada.",
    areas: { Lenguaje: "Texto de área escrito por el profesional." },
    removedAreas: ["Motricidad"],
    sugerencias: "",
  };
  const response = await request("POST", "/ai/informe-generate", "owner", {
    patientId: 1,
    rango: "historia",
    draft,
  }, true);

  assert.equal(response.status, 200, JSON.stringify(response.body));
  assert.equal(aiPrompts.length, 1);
  assert.match(aiPrompts[0], /OBSERVACION_PROFESIONAL_QUE_DEBE_CONSERVARSE/);
  assert.match(aiPrompts[0], /Texto de área escrito por el profesional/);
  assert.match(aiPrompts[0], /Motricidad/);
  assert.match(aiPrompts[0], /únicamente aportes nuevos/);
  assert.match(aiPrompts[0], /no reescribas, resumas, elimines ni repitas/i);

  const aiCallsBeforeInvalidDraft = stats.ai;
  const invalid = await request("POST", "/ai/informe-generate", "owner", {
    patientId: 1,
    rango: "historia",
    draft: {
      resumen: "x".repeat(20_001),
      conducta: "",
      areas: {},
      removedAreas: [],
      sugerencias: "",
    },
  }, true);
  assert.equal(invalid.status, 400);
  assert.equal(stats.ai, aiCallsBeforeInvalidDraft, "invalid drafts are rejected before calling the AI provider");
});

test("AI generation uses session areas and keeps unrelated observations without objectives or counts", async () => {
  reset();
  grantAiConsent(2);
  const today = now.toISOString().slice(0, 10);
  const summary = buildPsychologySessionSummary(["cognition"], {
    ...createEmptyPsychologySessionDraft(),
    focus: "Memoria funcional",
    interventions: "Organización de una secuencia.",
    participation: "Participó con apoyo.",
  });
  tables.set(schema.registrosClinicosTable, [{
    id: 101,
    patientId: 1,
    userId: 2,
    fecha: today,
    resumenSesion: summary,
    observaciones: "Al inicio solicitó un objeto de transición antes de comenzar.",
    recomendacionesHogar: null,
    materialesActividades: [],
    createdAt: now,
  }]);

  const response = await request("POST", "/ai/informe-generate", "owner", {
    patientId: 1,
    rango: "historia",
  }, true);

  assert.equal(response.status, 200, JSON.stringify(response.body));
  assert.equal(aiPrompts.length, 1);
  assert.match(aiPrompts[0], /Funciones cognitivas y ejecutivas/);
  assert.match(aiPrompts[0], /Memoria funcional/);
  assert.match(aiPrompts[0], /Al inicio solicitó un objeto de transición/);
  assert.match(aiPrompts[0], /Las observaciones relevantes que no correspondan claramente a un área deben conservarse en/);
  assert.match(aiPrompts[0], /resumen/);
  assert.doesNotMatch(aiPrompts[0], /No hay objetivos terapéuticos registrados|OBJETIVOS TERAPÉUTICOS — 0/);
  assert.doesNotMatch(aiPrompts[0], /Sesiones clínicas incluidas:|Total de sesiones verificables|Sesión 1 —/);
  assert.doesNotMatch(aiPrompts[0], /Terminología a usar|Menciona la cantidad de sesiones/);
  assert.equal(response.body.resumen, "Al inicio solicitó un objeto de transición antes de comenzar.");
  assert.deepEqual(response.body.areas, {
    "Funciones cognitivas y ejecutivas": "Participó en la organización de una secuencia con apoyo.",
  });
  assert.equal(response.body.conducta, "");
  assert.equal(response.body.sugerencias, "");
});

test("session materials photos are record-scoped, signed only after access checks, and deleted with the record", async () => {
  reset();
  storage.configured = true;
  const materialId = "material-01";
  const created = await request("POST", "/registros-clinicos", "owner", {
    patientId: 1,
    fecha: "2026-10-06",
    resumenSesion: "Sesión rápida",
    materialesActividades: [{ id: materialId, nombre: "Bloques" }],
  });
  assert.equal(created.status, 201);
  const recordId = created.body.id;

  const deniedRead = await request("GET", `/registros-clinicos/${recordId}/materiales`, "foreign");
  assert.equal(deniedRead.status, 403);
  const deniedUpload = await request(
    "POST",
    `/registros-clinicos/${recordId}/materiales/${materialId}/fotos/upload-url`,
    "foreign",
    { name: "bloques.png", mimeType: "image/png", size: 100 },
  );
  assert.equal(deniedUpload.status, 403);
  assert.deepEqual(storage.downloadPaths, []);
  assert.deepEqual(storage.uploadPaths, []);

  const upload = await request(
    "POST",
    `/registros-clinicos/${recordId}/materiales/${materialId}/fotos/upload-url`,
    "owner",
    { name: "bloques.png", mimeType: "image/png", size: 100 },
  );
  assert.equal(upload.status, 200);
  const photoId = upload.body.photoId;
  const expectedPath = `clinical-records/${recordId}/${materialId}/${photoId}`;
  assert.equal(storage.uploadPaths[0], expectedPath);
  storage.objects.add(expectedPath);

  assert.equal(await status(
    "POST",
    `/registros-clinicos/${recordId}/materiales/${materialId}/fotos/${photoId}/complete`,
    "owner",
  ), 200);
  const materials = await request("GET", `/registros-clinicos/${recordId}/materiales`, "owner");
  assert.equal(materials.status, 200);
  assert.equal(materials.body[0].nombre, "Bloques");
  assert.equal(materials.body[0].fotos[0].originalName, "bloques.png");
  assert.equal(materials.body[0].fotos[0].url, `https://storage.test/download/${encodeURIComponent(expectedPath)}`);
  assert.deepEqual(storage.downloadPaths, [expectedPath]);

  const listed = await request("GET", "/registros-clinicos?patientId=1", "owner");
  assert.equal(listed.body[0].materialesActividades[0].fotos[0].storagePath, undefined);
  assert.deepEqual(tables.get(schema.patientFilesTable) ?? [], []);

  assert.equal(await status("DELETE", `/registros-clinicos/${recordId}`, "owner"), 204);
  assert.deepEqual(storage.deletedPaths, [expectedPath]);
  assert.equal(storage.objects.has(expectedPath), false);
  assert.equal((tables.get(schema.registrosClinicosTable) ?? []).length, 0);
});

test("reassigned professionals lose access to their own clinical sessions and attachments", async () => {
  reset();
  storage.configured = true;
  const photoPath = "clinical-records/11/material-01/photo-01";
  tables.set(schema.registrosClinicosTable, [
    {
      id: 10, patientId: 1, userId: 2, fecha: "2026-10-01",
      resumenSesion: "Sesión actual", materialesActividades: null, createdAt: now,
    },
    {
      id: 11, patientId: 2, userId: 2, fecha: "2026-10-02",
      resumenSesion: "Sesión anterior", createdAt: now,
      materialesActividades: [{
        id: "material-01",
        nombre: "Material ficticio",
        fotos: [{
          id: "photo-01", originalName: "foto.png", mimeType: "image/png",
          sizeBytes: 100, storagePath: photoPath, uploaded: true,
        }],
      }],
    },
    {
      id: 12, patientId: 1, userId: 3, fecha: "2026-10-03",
      resumenSesion: "Otra cuenta", materialesActividades: null, createdAt: now,
    },
  ]);
  storage.objects.add(photoPath);

  const listed = await request("GET", "/registros-clinicos", "owner");
  assert.equal(listed.status, 200);
  assert.deepEqual(listed.body.map((row: any) => row.id), [10]);
  assert.equal((await request("GET", "/registros-clinicos/10", "owner")).status, 200);
  assert.equal((await request("GET", "/registros-clinicos/11", "owner")).status, 403);
  assert.equal((await request("GET", "/registros-clinicos/12", "owner")).status, 403);

  assert.equal((await request("GET", "/registros-clinicos/11/materiales", "owner")).status, 403);
  assert.equal((await request(
    "POST",
    "/registros-clinicos/11/materiales/material-01/fotos/upload-url",
    "owner",
    { name: "nueva.png", mimeType: "image/png", size: 100 },
  )).status, 403);
  assert.equal((await request(
    "POST",
    "/registros-clinicos/11/materiales/material-01/fotos/photo-01/complete",
    "owner",
  )).status, 403);
  assert.equal((await request(
    "DELETE",
    "/registros-clinicos/11/materiales/material-01/fotos/photo-01",
    "owner",
  )).status, 403);
  assert.equal((await request("PATCH", "/registros-clinicos/11", "owner", { observaciones: "No autorizado" })).status, 403);
  assert.equal((await request("DELETE", "/registros-clinicos/11", "owner")).status, 403);
  assert.deepEqual(storage.downloadPaths, []);
  assert.deepEqual(storage.uploadPaths, []);
  assert.deepEqual(storage.deletedPaths, []);
  assert.equal(tables.get(schema.registrosClinicosTable)?.length, 3);
});

test("former professionals cannot access unattributed legacy sessions or their photos", async () => {
  reset();
  storage.configured = true;
  const photoPath = "clinical-records/50/material-legacy/photo-legacy";
  tables.set(schema.registrosClinicosTable, [{
    id: 50,
    patientId: 2,
    userId: null,
    fecha: "2024-06-01",
    resumenSesion: "Contenido histórico ficticio",
    createdAt: now,
    materialesActividades: [{
      id: "material-legacy",
      nombre: "Material histórico",
      fotos: [{
        id: "photo-legacy",
        originalName: "imagen-historica.png",
        mimeType: "image/png",
        sizeBytes: 100,
        storagePath: photoPath,
        uploaded: true,
      }],
    }],
  }]);
  storage.objects.add(photoPath);

  assert.deepEqual((await request("GET", "/registros-clinicos", "owner")).body, []);
  assert.equal((await request("GET", "/registros-clinicos/50", "owner")).status, 403);
  assert.equal((await request("GET", "/registros-clinicos/50/materiales", "owner")).status, 403);
  assert.equal((await request(
    "POST",
    "/registros-clinicos/50/materiales/material-legacy/fotos/photo-legacy/complete",
    "owner",
  )).status, 403);
  assert.equal((await request(
    "POST",
    "/registros-clinicos/50/materiales/material-legacy/fotos/upload-url",
    "owner",
    { name: "otra.png", mimeType: "image/png", size: 100 },
  )).status, 403);
  assert.equal((await request(
    "DELETE",
    "/registros-clinicos/50/materiales/material-legacy/fotos/photo-legacy",
    "owner",
  )).status, 403);
  assert.equal((await request("PATCH", "/registros-clinicos/50", "owner", { observaciones: "Cambio" })).status, 403);
  assert.equal((await request("DELETE", "/registros-clinicos/50", "owner")).status, 403);
  assert.equal((await request("GET", "/patients/2/timeline", "owner")).status, 403);

  const exported = await request("GET", "/export/my-data", "owner");
  assert.equal(exported.status, 200);
  const clinicalSheet = exported.body.find((sheet: any) => sheet.name === "Registros clínicos");
  assert.deepEqual(clinicalSheet.rows, []);
  assert.deepEqual(storage.downloadPaths, []);
  assert.deepEqual(storage.uploadPaths, []);
  assert.deepEqual(storage.deletedPaths, []);
  assert.equal(storage.objects.has(photoPath), true);
  assert.equal(tables.get(schema.registrosClinicosTable)?.length, 1);
});

test("patient-linked appointments require current assignment for reads and changes", async () => {
  reset();
  tables.set(schema.citasTable, [
    {
      id: 101, userId: 2, patientId: 1, titulo: "Cita vigente", fecha: "2026-10-01",
      horaInicio: "10:00", horaFin: "11:00", tipo: "sesion", status: "programada",
      serieId: "weekly-test", createdAt: now,
    },
    {
      id: 102, userId: 2, patientId: 2, titulo: "Cita reasignada", fecha: "2026-10-08",
      horaInicio: "10:00", horaFin: "11:00", tipo: "sesion", status: "programada",
      serieId: "weekly-test", createdAt: now,
    },
    {
      id: 103, userId: 2, patientId: null, titulo: "Evento personal", fecha: "2026-10-03",
      horaInicio: "12:00", horaFin: "13:00", tipo: "personal", status: "programada",
      createdAt: now,
    },
  ]);

  const list = await request("GET", "/citas", "owner");
  assert.equal(list.status, 200);
  assert.deepEqual(list.body.map((row: any) => row.id), [101, 103]);
  assert.deepEqual((await request("GET", "/citas?patientId=2", "owner")).body, []);
  assert.equal((await request("PUT", "/citas/102", "owner", { titulo: "Cambio no autorizado" })).status, 403);
  assert.equal((await request("DELETE", "/citas/102", "owner")).status, 403);

  const seriesUpdate = await request("PUT", "/citas/101", "owner", {
    scope: "serie", titulo: "Cita actualizada",
  });
  assert.equal(seriesUpdate.status, 200);
  const citations = tables.get(schema.citasTable)!;
  assert.equal(citations.find(row => row.id === 101)?.titulo, "Cita actualizada");
  assert.equal(citations.find(row => row.id === 102)?.titulo, "Cita reasignada");
  const seriesCancellation = await request("DELETE", "/citas/101?scope=serie", "owner");
  assert.equal(seriesCancellation.status, 200);
  assert.equal(citations.find(row => row.id === 101)?.status, "cancelada");
  assert.equal(citations.find(row => row.id === 102)?.status, "programada");

  const deniedCreate = await request("POST", "/citas", "owner", {
    titulo: "Cita ajena", fecha: "2026-10-09", horaInicio: "10:00", horaFin: "11:00",
    patientId: 2,
  });
  assert.equal(deniedCreate.status, 403);
  assert.equal(citations.length, 3);
  assert.equal((await request("POST", "/citas", "owner", {
    titulo: "Cita propia", fecha: "2026-10-10", horaInicio: "10:00", horaFin: "11:00",
    patientId: 1,
  })).status, 201);
  assert.equal((await request("POST", "/citas", "owner", {
    titulo: "Evento personal nuevo", fecha: "2026-10-11", horaInicio: "10:00", horaFin: "11:00",
  })).status, 201);
});

test("exports include authored sessions only while their patients remain assigned", async () => {
  reset();
  tables.set(schema.registrosClinicosTable, [
    { id: 21, patientId: 1, userId: 2, fecha: "2026-10-01", resumenSesion: "Propia", createdAt: now },
    { id: 22, patientId: 2, userId: 2, fecha: "2026-10-02", resumenSesion: "Paciente reasignado", createdAt: now },
    { id: 23, patientId: 1, userId: 3, fecha: "2026-10-03", resumenSesion: "Otra cuenta", createdAt: now },
    { id: 24, patientId: 1, userId: null, fecha: "2026-10-04", resumenSesion: "Legado sin autor", createdAt: now },
  ]);

  const exported = await request("GET", "/export/my-data", "owner");
  assert.equal(exported.status, 200);
  const clinicalSheet = exported.body.find((sheet: any) => sheet.name === "Registros clínicos");
  assert.deepEqual(clinicalSheet.rows.map((row: any) => row.id), [21, 24]);

  const patients = tables.get(schema.patientsTable)!;
  patients.find(patient => patient.id === 1)!.assignedProfessionalId = 3;
  const afterReassignment = await request("GET", "/export/my-data", "owner");
  assert.equal(afterReassignment.status, 204);
  assert.equal(tables.get(schema.registrosClinicosTable)?.length, 4);
  assert.equal(tables.get(schema.registrosClinicosTable)?.find(row => row.id === 24)?.userId, null);
});

test("clinical-record routes preserve structured Psychology notes when saving and reading", async () => {
  reset();
  const ages = [4, 10, 16, 35, 75];
  tables.set(schema.patientsTable, ages.map((age, index) => ({
    id: index + 1,
    name: `Paciente ficticio ${age}`,
    age: String(age),
    diagnosis: null,
    assignedProfessionalId: 2,
  })));
  const summary = buildPsychologySessionSummary(
    ["emotion", "strengths"],
    {
      ...createEmptyPsychologySessionDraft(),
      focus: "Explorar recursos; incluir coma, |, ñ y 🧠.",
      interventions: 'Recurso "A"\nsegunda línea',
    },
  );
  const observations = "Registrar hechos observables y su contexto.";
  let firstRecordId: number | null = null;

  for (let index = 0; index < ages.length; index += 1) {
    const created = await request("POST", "/registros-clinicos", "owner", {
      patientId: index + 1,
      fecha: "2026-10-22",
      resumenSesion: summary,
      observaciones: observations,
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    if (index === 0) firstRecordId = created.body.id;

    const recovered = await request(
      "GET",
      `/registros-clinicos/${created.body.id}`,
      "owner",
    );
    assert.equal(recovered.status, 200, JSON.stringify(recovered.body));
    assert.equal(recovered.body.resumenSesion, summary);
    assert.equal(recovered.body.observaciones, observations);
    const parsed = parsePsychologySessionSummary(recovered.body.resumenSesion);
    assert.ok(parsed);
    assert.equal(parsed.fields.objectives, "");
    assert.equal(parsed.fields.evolution, "");
  }

  assert.ok(firstRecordId);
  const revisedSummary = buildPsychologySessionSummary(
    ["emotion", "strengths"],
    {
      ...createEmptyPsychologySessionDraft(),
      focus: "Foco editado con símbolo → y acento.",
      interventions: 'Recurso "A"\nsegunda línea',
    },
  );
  const edited = await request("PATCH", `/registros-clinicos/${firstRecordId}`, "owner", {
    resumenSesion: revisedSummary,
  });
  assert.equal(edited.status, 200, JSON.stringify(edited.body));

  const reopened = await request("GET", `/registros-clinicos/${firstRecordId}`, "owner");
  assert.equal(reopened.status, 200);
  const finalSummary = parsePsychologySessionSummary(reopened.body.resumenSesion);
  assert.ok(finalSummary);
  assert.equal(finalSummary.fields.focus, "Foco editado con símbolo → y acento.");
  assert.equal(finalSummary.fields.interventions, 'Recurso "A"\nsegunda línea');
  assert.equal(finalSummary.fields.objectives, "");
  assert.equal(reopened.body.observaciones, observations);
});

test("editing clinical record materials preserves, removes, and cleans up photos under record access checks", async () => {
  reset();
  storage.configured = true;
  const record = await request("POST", "/registros-clinicos", "owner", {
    patientId: 1,
    fecha: "2026-10-06",
    materialesActividades: [{ id: "material-01", nombre: "Bloques" }],
  });
  assert.equal(record.status, 201);
  const recordId = record.body.id;

  const uploadFirst = await request(
    "POST",
    `/registros-clinicos/${recordId}/materiales/material-01/fotos/upload-url`,
    "owner",
    { name: "bloques.png", mimeType: "image/png", size: 100 },
  );
  const firstPhotoId = uploadFirst.body.photoId;
  const firstPath = `clinical-records/${recordId}/material-01/${firstPhotoId}`;
  storage.objects.add(firstPath);
  assert.equal(await status(
    "POST",
    `/registros-clinicos/${recordId}/materiales/material-01/fotos/${firstPhotoId}/complete`,
    "owner",
  ), 200);

  const deniedEdit = await request("PATCH", `/registros-clinicos/${recordId}`, "foreign", {
    materialesActividades: [],
  });
  assert.equal(deniedEdit.status, 403);
  assert.deepEqual(storage.deletedPaths, []);
  assert.equal(storage.objects.has(firstPath), true);

  const invalidPhoto = await request("PATCH", `/registros-clinicos/${recordId}`, "owner", {
    materialesActividades: [{
      id: "material-01",
      nombre: "Bloques",
      fotosIds: ["not-a-record-photo"],
    }],
  });
  assert.equal(invalidPhoto.status, 400);
  assert.deepEqual(storage.deletedPaths, []);
  assert.equal(storage.objects.has(firstPath), true);

  const renamed = await request("PATCH", `/registros-clinicos/${recordId}`, "owner", {
    materialesActividades: [{
      id: "material-01",
      nombre: "Bloques apilables",
      fotosIds: [firstPhotoId],
    }],
  });
  assert.equal(renamed.status, 200);
  assert.equal(renamed.body.materialesActividades[0].nombre, "Bloques apilables");
  assert.deepEqual(storage.deletedPaths, []);
  assert.equal(storage.objects.has(firstPath), true);

  const removedPhoto = await request("PATCH", `/registros-clinicos/${recordId}`, "owner", {
    materialesActividades: [{
      id: "material-01",
      nombre: "Bloques apilables",
      fotosIds: [],
    }],
  });
  assert.equal(removedPhoto.status, 200);
  assert.deepEqual(storage.deletedPaths, [firstPath]);
  assert.equal(storage.objects.has(firstPath), false);

  assert.equal((await request("PATCH", `/registros-clinicos/${recordId}`, "owner", {
    materialesActividades: [{
      id: "material-02",
      nombre: "Tarjetas",
      fotosIds: [],
    }],
  })).status, 200);
  const uploadSecond = await request(
    "POST",
    `/registros-clinicos/${recordId}/materiales/material-02/fotos/upload-url`,
    "owner",
    { name: "tarjetas.png", mimeType: "image/png", size: 100 },
  );
  const secondPhotoId = uploadSecond.body.photoId;
  const secondPath = `clinical-records/${recordId}/material-02/${secondPhotoId}`;
  storage.objects.add(secondPath);
  assert.equal(await status(
    "POST",
    `/registros-clinicos/${recordId}/materiales/material-02/fotos/${secondPhotoId}/complete`,
    "owner",
  ), 200);

  const removedMaterial = await request("PATCH", `/registros-clinicos/${recordId}`, "owner", {
    materialesActividades: [],
  });
  assert.equal(removedMaterial.status, 200);
  assert.equal(removedMaterial.body.materialesActividades, null);
  assert.deepEqual(storage.deletedPaths, [firstPath, secondPath]);
  assert.equal(storage.objects.has(secondPath), false);
});

test("global library is read-only to professionals, custom goals are owner-only, and admins are denied", async () => {
  reset();
  assert.deepEqual((await request("GET", "/goal-library", "owner")).body.map((g: any) => g.id), [10, 11]);
  assert.equal(await status("GET", "/goal-library", "admin"), 403);
  assert.equal(await status("POST", "/goal-library", "owner", { idObjetivo: "NEW", nombreObjetivo: "Global" }), 403);
  assert.equal(await status("PATCH", "/goal-library/10", "owner", { nombreObjetivo: "Change" }), 403);
  assert.equal(await status("PATCH", "/goal-library/12", "owner", { nombreObjetivo: "Change" }), 403);
  assert.equal(await status("POST", "/goal-library/12/assign", "owner", { patientId: 1 }), 403);
  assert.equal(await status("PATCH", "/goal-library/11", "owner", { nombreObjetivo: "Updated" }), 200);
  assert.equal(await status("POST", "/goal-library", "owner", { idObjetivo: "NEW", nombreObjetivo: "Mine", isCustom: true }), 201);
  assert.equal(await status("POST", "/goal-library", "admin", { idObjetivo: "ADM", nombreObjetivo: "Admin" }), 403);
  assert.equal(await status("PATCH", "/goal-library/10", "admin", { nombreObjetivo: "Updated" }), 403);
  assert.equal(await status("POST", "/goal-library/11/assign", "owner", { patientId: 1 }), 201);
  const suggested = (await request("GET", "/patients/1/suggested-goals", "owner")).body;
  assert.ok(suggested.every((g: any) => g.createdBy !== 3));
});

test("activities inherit linked goal visibility and writes, including reassociation target", async () => {
  reset();
  assert.deepEqual((await request("GET", "/actividades", "owner")).body.map((a: any) => a.id), [20, 21, 23]);
  assert.equal(await status("GET", "/actividades", "admin"), 403);
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
  assert.equal(await status("POST", "/actividades", "admin", { titulo: "Global", goalLibraryId: 10 }), 403);
  assert.equal(await status("PATCH", "/actividades/20", "admin", { goalLibraryId: 12 }), 403);
});

test("goal-code migration stays disabled and clinical guidance is professional-only", async () => {
  reset();
  grantAiConsent(2);
  assert.equal(await status("POST", "/goal-codes/migrate", "owner", {}), 403);
  assert.equal(stats.selects, 0);
  assert.equal(await status("POST", "/goal-codes/migrate", "admin", {}), 403);
  assert.equal(await status("POST", "/goal-guidance", "admin", { title: "Objetivo" }), 403);
  assert.equal(await status("POST", "/goal-guidance", "owner", { title: "Goal" }), 200);
  assert.equal(stats.ai, 1);
});

test("login validates admin, professional, and collaborator credentials with or without a prior session", async () => {
  reset();
  const hash = await bcrypt.hash("correct-password", 4);
  tables.set(schema.usersTable, [
    { id: 1, email: "admin@example.test", passwordHash: hash, name: "Admin", role: "admin", active: true, professionalId: null },
    { id: 2, email: "pro@example.test", passwordHash: hash, name: "Professional", role: "professional", active: true, professionalId: null },
    { id: 4, email: "collaborator@example.test", passwordHash: hash, name: "Collaborator", role: "collaborator", active: true, professionalId: null },
  ]);
  const accounts = [
    { email: "admin@example.test", role: "admin", expectedId: 1 },
    { email: "pro@example.test", role: "professional", expectedId: 2 },
    { email: "collaborator@example.test", role: "collaborator", expectedId: 4 },
  ] as const;
  const priorSessions = [
    { actor: "admin", label: "admin" },
    { actor: "owner", label: "professional" },
    { actor: "collaborator", label: "collaborator" },
  ] as const;

  for (const account of accounts) {
    const withoutSession = await request("POST", "/auth/login", undefined, {
      email: account.email,
      password: "correct-password",
    });
    assert.equal(withoutSession.status, 200, `${account.role} login without session`);
    assert.equal(withoutSession.body.role, account.role);
    assert.equal(withoutSession.body.id, account.expectedId);
    assert.ok(withoutSession.body.token);
    const invalidWithoutSession = await request("POST", "/auth/login", undefined, {
      email: account.email,
      password: "wrong",
    });
    assert.equal(invalidWithoutSession.status, 401, `${account.role} invalid credentials without session`);
  }

  for (const previousSession of priorSessions) {
    for (const account of accounts) {
      const result = await request("POST", "/auth/login", previousSession.actor, {
        email: account.email,
        password: "correct-password",
      });
      assert.equal(result.status, 200, `${account.role} login with previous ${previousSession.label} session`);
      assert.equal(result.body.role, account.role);
      assert.equal(result.body.id, account.expectedId);
      assert.ok(result.body.token);

      const invalid = await request("POST", "/auth/login", previousSession.actor, {
        email: account.email,
        password: "wrong",
      });
      assert.equal(invalid.status, 401, `${account.role} invalid credentials with previous ${previousSession.label} session`);
    }
  }

  assert.equal(savedSessions.length, accounts.length * (priorSessions.length + 1));
  assert.ok(savedSessions.every(session => accounts.some(
    account => account.expectedId === session.userId && account.role === session.userRole,
  )));
});