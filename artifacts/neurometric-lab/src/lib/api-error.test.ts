import assert from "node:assert/strict";
import { test } from "node:test";
import { responseErrorMessage } from "./api-error";

test("uses the API's structured error when it is present", async () => {
  const response = new Response(JSON.stringify({ error: "Fecha inválida: trialEndDate" }), {
    status: 400,
    headers: { "content-type": "application/json" },
  });
  assert.equal(await responseErrorMessage(response, "Error al actualizar"), "Fecha inválida: trialEndDate");
});

test("supports message-shaped JSON errors", async () => {
  const response = new Response(JSON.stringify({ message: "Conflicto de revisión" }), {
    status: 409,
    headers: { "content-type": "application/json" },
  });
  assert.equal(await responseErrorMessage(response, "Error al actualizar"), "Conflicto de revisión");
});

test("preserves the HTTP status when the server returns HTML instead of JSON", async () => {
  const response = new Response("<html><body>Internal Server Error</body></html>", {
    status: 500,
    headers: { "content-type": "text/html" },
  });
  assert.equal(await responseErrorMessage(response, "Error al actualizar"), "Error al actualizar (HTTP 500)");
});

test("uses the HTTP status when JSON has no recognized error field", async () => {
  const response = new Response(JSON.stringify({ detail: "ignored" }), {
    status: 503,
    headers: { "content-type": "application/json" },
  });
  assert.equal(await responseErrorMessage(response, "Error al actualizar"), "Error al actualizar (HTTP 503)");
});
