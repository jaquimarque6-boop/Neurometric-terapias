import assert from "node:assert/strict";
import { after, test } from "node:test";
import {
  saveClinicalRecordWithMaterials,
  toSessionMaterialPayload,
  uploadSessionMaterialPhotos,
} from "./session-materials.ts";

const originalFetch = globalThis.fetch;
after(() => {
  globalThis.fetch = originalFetch;
});

const file = { name: "fotos-bloques.png", type: "image/png", size: 128 } as File;

test("material payloads keep trimmed names and never send File objects as JSON", () => {
  assert.deepEqual(
    toSessionMaterialPayload([
      { id: "material-1", nombre: "  Bloques  ", fotos: [file] },
      { id: "material-2", nombre: "   ", fotos: [] },
    ]),
    [{ id: "material-1", nombre: "Bloques" }],
  );
});

test("quick session stays optional and a complete-session photo failure does not undo the saved record", async () => {
  const calls: Array<{ url: string; method: string; body?: string }> = [];
  let nextRecordId = 40;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const body = typeof init?.body === "string" ? init.body : undefined;
    calls.push({ url, method, body });

    if (url === "/neurometric-lab/api/registros-clinicos" && method === "POST") {
      return new Response(JSON.stringify({ id: ++nextRecordId }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.endsWith("/fotos/upload-url")) {
      return new Response(JSON.stringify({
        photoId: "photo-1",
        uploadUrl: "https://storage.test/upload",
      }), { headers: { "Content-Type": "application/json" } });
    }
    if (url === "https://storage.test/upload" && method === "PUT") {
      return new Response("Storage unavailable", { status: 503 });
    }
    if (url.endsWith("/fotos/photo-1") && method === "DELETE") {
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    throw new Error(`Unexpected request: ${method} ${url}`);
  }) as typeof fetch;

  const quick = await saveClinicalRecordWithMaterials({
    patientId: 1,
    fecha: "2026-10-06",
    resumenSesion: "Resumen breve",
    observaciones: "Observaciones sin cambios",
    recomendacionesHogar: null,
  }, [], "/neurometric-lab");
  assert.equal(quick.record.id, 41);
  assert.deepEqual(quick.failedPhotos, []);
  assert.equal(calls.filter(call => call.url.endsWith("/fotos/upload-url")).length, 0);
  assert.deepEqual(JSON.parse(calls[0].body!).materialesActividades, []);

  const complete = await saveClinicalRecordWithMaterials({
    patientId: 1,
    fecha: "2026-10-06",
    resumenSesion: "Sesión con objetivos",
    observaciones: "Observaciones existentes",
  }, [{
    id: "material-1",
    nombre: "Bloques",
    fotos: [file],
  }], "/neurometric-lab");
  assert.equal(complete.record.id, 42);
  assert.deepEqual(complete.failedPhotos, ["fotos-bloques.png"]);

  const createBody = JSON.parse(calls.find(call =>
    call.url === "/neurometric-lab/api/registros-clinicos" &&
    call.body?.includes("Sesión con objetivos")
  )!.body!);
  assert.deepEqual(createBody.materialesActividades, [{ id: "material-1", nombre: "Bloques" }]);
  assert.ok(calls.some(call => call.url === "https://storage.test/upload" && call.method === "PUT"));
  assert.ok(calls.some(call => call.url.endsWith("/fotos/photo-1") && call.method === "DELETE"));
});

test("edit uploads only newly selected photos to the existing record and material", async () => {
  const calls: Array<{ url: string; method: string }> = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    calls.push({ url, method });

    if (url.endsWith("/fotos/upload-url") && method === "POST") {
      return new Response(JSON.stringify({
        photoId: "photo-new",
        uploadUrl: "https://storage.test/new-photo",
      }), { headers: { "Content-Type": "application/json" } });
    }
    if (url === "https://storage.test/new-photo" && method === "PUT") {
      return new Response(null, { status: 200 });
    }
    if (url.endsWith("/fotos/photo-new/complete") && method === "POST") {
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    throw new Error(`Unexpected request: ${method} ${url}`);
  }) as typeof fetch;

  const failedPhotos = await uploadSessionMaterialPhotos(73, [{
    id: "material-1",
    nombre: "Bloques",
    fotos: [file],
    fotosGuardadas: [{
      id: "photo-saved",
      name: "anterior.png",
      url: "https://storage.test/private-signed-url",
    }],
  }], "/neurometric-lab");

  assert.deepEqual(failedPhotos, []);
  assert.deepEqual(calls, [
    {
      url: "/neurometric-lab/api/registros-clinicos/73/materiales/material-1/fotos/upload-url",
      method: "POST",
    },
    { url: "https://storage.test/new-photo", method: "PUT" },
    {
      url: "/neurometric-lab/api/registros-clinicos/73/materiales/material-1/fotos/photo-new/complete",
      method: "POST",
    },
  ]);
});
