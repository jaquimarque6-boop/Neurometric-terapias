import assert from "node:assert/strict";
import test from "node:test";
import { dispatchUsageEventWrite, getUsageAuditStatus, readUsageAuditRows } from "./usage-audit";

test("usage audit status distinguishes clinical activity, login-only, no login, and inactive", () => {
  assert.equal(getUsageAuditStatus({
    accountActive: true,
    hasClinicalActivity: true,
    lastLoginAt: null,
    trackingAvailable: true,
  }), "active");
  assert.equal(getUsageAuditStatus({
    accountActive: true,
    hasClinicalActivity: false,
    lastLoginAt: "2026-10-01T12:00:00.000Z",
    trackingAvailable: true,
  }), "login_only");
  assert.equal(getUsageAuditStatus({
    accountActive: true,
    hasClinicalActivity: false,
    lastLoginAt: null,
    trackingAvailable: true,
  }), "no_login");
  assert.equal(getUsageAuditStatus({
    accountActive: false,
    hasClinicalActivity: true,
    lastLoginAt: "2026-10-01T12:00:00.000Z",
    trackingAvailable: false,
  }), "inactive");
  assert.equal(getUsageAuditStatus({
    accountActive: true,
    hasClinicalActivity: false,
    lastLoginAt: null,
    trackingAvailable: false,
  }), "unavailable");
});

test("a failed audit read returns unavailable empty stats without rejecting", async () => {
  let failureReported = false;
  const result = await readUsageAuditRows(
    () => Promise.reject(new Error("table unavailable")),
    () => { failureReported = true; },
  );

  assert.deepEqual(result, { available: false, rows: [] });
  assert.equal(failureReported, true);
});

test("a failed usage-event write is swallowed and reported without blocking its caller", async () => {
  let failureReported = false;

  assert.doesNotThrow(() => {
    dispatchUsageEventWrite(
      () => Promise.reject(new Error("database unavailable")),
      () => { failureReported = true; },
    );
  });

  await new Promise<void>(resolve => setImmediate(resolve));
  assert.equal(failureReported, true);
});

test("usage-event write failures cannot escape even if the warning handler fails", async () => {
  assert.doesNotThrow(() => {
    dispatchUsageEventWrite(
      () => Promise.reject(new Error("database unavailable")),
      () => { throw new Error("warning handler unavailable"); },
    );
  });

  await new Promise<void>(resolve => setImmediate(resolve));
});