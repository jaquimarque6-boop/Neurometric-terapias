import assert from "node:assert/strict";
import test from "node:test";
import {
  ActivitiesSubscriptionInactiveError,
  requestActivitiesAccessUrl,
} from "./actividades-pass-client";

test("requests a pass with the authenticated session and builds the exact protected route", async () => {
  const apiBase = "https://api.example.test";
  const fakeSessionToken = "fake-session-token";
  const fakePass = "fake.header.sig+/?";
  let requestUrl = "";
  let requestInit: RequestInit | undefined;

  const target = await requestActivitiesAccessUrl(
    apiBase,
    fakeSessionToken,
    async (input, init) => {
      requestUrl = String(input);
      requestInit = init;
      return new Response(JSON.stringify({ pase: fakePass }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  );

  assert.equal(requestUrl, `${apiBase}/api/actividades/pase`);
  assert.equal(requestInit?.method, "POST");
  assert.equal(requestInit?.credentials, "include");
  assert.equal(requestInit?.body, undefined);
  assert.equal(new Headers(requestInit?.headers).get("Authorization"), `Bearer ${fakeSessionToken}`);
  assert.ok(!requestUrl.includes(fakePass));
  assert.equal(
    target,
    "https://therapy-spark-toolkit.lovable.app/acceso-terapias#pase=fake.header.sig%2B%2F%3F",
  );
});

test("surfaces inactive-subscription responses without building an access URL", async () => {
  await assert.rejects(
    requestActivitiesAccessUrl("", null, async () => new Response(
      JSON.stringify({ error: "subscription_inactive" }),
      { status: 402, headers: { "Content-Type": "application/json" } },
    )),
    ActivitiesSubscriptionInactiveError,
  );
});
