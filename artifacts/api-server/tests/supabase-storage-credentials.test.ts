import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const apiDirectory = fileURLToPath(new URL("..", import.meta.url));

const storageProbe = `
const storage = await import("./src/lib/supabaseStorage.ts");
const calls = [];

globalThis.fetch = async (input, init = {}) => {
  const headers = new Headers(init.headers);
  const authorization = headers.get("authorization");
  const isLegacy = process.env.TEST_KEY_KIND === "legacy";

  if (!headers.get("apikey")) throw new Error("apikey header missing");
  if (isLegacy && !authorization?.startsWith("Bearer ")) {
    throw new Error("legacy JWT bearer header missing");
  }
  if (!isLegacy && authorization !== null) {
    throw new Error("non-JWT key must not be sent as bearer");
  }

  calls.push({
    url: String(input),
    method: init.method ?? "GET",
    range: headers.get("range"),
  });

  if (calls.length === 1) {
    return Response.json({ url: "/object/upload/sign/test-bucket/test-file?token=upload" });
  }
  if (calls.length === 2) {
    return Response.json({ signedURL: "/object/sign/test-bucket/test-file?token=download" });
  }
  if (calls.length === 3) return new Response(null, { status: 206 });
  if (calls.length === 4) return new Response(null, { status: 200 });
  throw new Error("unexpected Storage request");
};

const upload = await storage.createSignedUploadUrl("patients/1/test.pdf");
const download = await storage.createSignedDownloadUrl("patients/1/test.pdf", 300);
const exists = await storage.objectExists("patients/1/test.pdf");
await storage.deleteStorageObject("patients/1/test.pdf");

if (!upload.uploadUrl.includes("/storage/v1/object/upload/sign/test-bucket/")) {
  throw new Error("signed upload URL response was not processed");
}
if (!download.includes("/storage/v1/object/sign/test-bucket/")) {
  throw new Error("signed download URL response was not processed");
}
if (!exists || calls.length !== 4) throw new Error("Storage operation result mismatch");
if (calls.map((call) => call.method).join(",") !== "POST,POST,GET,DELETE") {
  throw new Error("Storage request methods mismatch");
}
if (calls[2].range !== "bytes=0-0") throw new Error("object existence range missing");
console.log("storage-probe-pass");
`;

function runStorageProbe(key: string, keyKind: "legacy" | "secret"): void {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "-e", storageProbe],
    {
      cwd: apiDirectory,
      encoding: "utf8",
      timeout: 15_000,
      // Pass only non-secret runtime requirements and a synthetic test key.
      env: {
        PATH: process.env.PATH ?? "",
        NODE_ENV: "test",
        SUPABASE_URL: "https://storage-test.invalid",
        SUPABASE_FILES_BUCKET: "test-bucket",
        SUPABASE_SERVICE_KEY: key,
        TEST_KEY_KIND: keyKind,
      },
    },
  );

  assert.equal(result.error, undefined, "isolated Storage probe could not start");
  assert.equal(result.status, 0, "isolated Storage probe failed");
  assert.match(result.stdout, /storage-probe-pass/);
}

function syntheticLegacyServiceRoleJwt(): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ role: "service_role" })}.synthetic-signature`;
}

test("sb_secret credentials use apikey without a Bearer header", () => {
  runStorageProbe("sb_secret_synthetic-test-value", "secret");
});

test("legacy service_role JWT keeps Storage operations working with Bearer auth", () => {
  runStorageProbe(syntheticLegacyServiceRoleJwt(), "legacy");
});
