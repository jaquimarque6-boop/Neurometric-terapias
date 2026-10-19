import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addDays, addCalendarMonth, commercialToday, validCommercialDate,
  reviewCommercialAccount, renewalPeriod, canRenewCommercially, type CommercialAccount,
} from "../src/lib/commercial-policy";
const account: CommercialAccount = {
  role: "professional", active: true, commercialStatus: "trial",
  trialStartDate: null, trialEndDate: null, lastPaymentDate: null, nextDueDate: null,
};
test("calendar dates use Argentina business date, strict validation and inclusive 15-day trials", () => {
  assert.equal(commercialToday(new Date("2026-10-20T02:00:00Z")), "2026-10-19");
  assert.equal(validCommercialDate("2026-02-30"), false);
  assert.equal(validCommercialDate("2028-02-29"), true);
  assert.equal(validCommercialDate("20/10/2026"), false);
  assert.equal(addDays("2026-10-19", 14), "2026-11-02");
  const trial = { ...account, trialStartDate: "2026-10-19", trialEndDate: "2026-11-02" };
  assert.equal(reviewCommercialAccount(trial, "2026-10-19").daysRemaining, 15);
  assert.equal(reviewCommercialAccount(trial, "2026-11-02").daysRemaining, 1);
  assert.equal(reviewCommercialAccount(trial, "2026-11-03").issues.some(i => i.code === "expired"), true);
});
test("calendar monthly renewals preserve early expiry and restart late periods, including leap years", () => {
  assert.equal(addCalendarMonth("2026-01-31"), "2026-02-28");
  assert.equal(addCalendarMonth("2028-01-31"), "2028-02-29");
  assert.equal(addCalendarMonth("2026-12-31"), "2027-01-31");
  assert.deepEqual(renewalPeriod({ ...account, nextDueDate: "2026-11-30" }, "2026-11-20", "2026-11-20"),
    { periodFrom: "2026-11-30", periodTo: "2026-12-30" });
  assert.deepEqual(renewalPeriod({ ...account, nextDueDate: "2026-10-01" }, "2026-10-19", "2026-10-19"),
    { periodFrom: "2026-10-19", periodTo: "2026-11-19" });
  assert.throws(() => renewalPeriod(account, "2026-12-01", "2026-11-01"));
  assert.throws(() => renewalPeriod({ ...account, lastPaymentDate: "2026-10-10" }, "2026-10-01", "2026-11-01"));
});
test("review never mutates or blocks existing accounts, and missing dates are not invented", () => {
  const before = structuredClone(account);
  const r = reviewCommercialAccount(account, "2026-10-19");
  assert.equal(r.needsReview, true);
  assert.equal(r.expiresOn, null);
  assert.equal(r.blockingEnabled, false);
  assert.deepEqual(account, before);
  assert.deepEqual(reviewCommercialAccount({ ...account, trialStartPending: true }).issues.map(i => i.code), ["trial_pending"]);
});
test("courtesy, churned, disabled and administrator accounts are exempt without changing their behavior", () => {
  for (const variation of [{ commercialStatus: "courtesy" }, { commercialStatus: "churned" }, { active: false }, { role: "admin" }]) {
    const user = { ...account, ...variation, nextDueDate: "2000-01-01" };
    assert.equal(reviewCommercialAccount(user).exempt, true);
    assert.equal(reviewCommercialAccount(user).notice, null);
    assert.equal(canRenewCommercially(user), false);
  }
});
test("warnings distinguish 5, 3, 1 days, today and expired without suspending access", () => {
  for (const [days, severity, fragment] of [
    [5, "warning", "5 días"], [3, "urgent", "3 días"], [1, "urgent", "mañana"],
    [0, "urgent", "hoy"], [-1, "urgent", "continúa habilitado"],
  ] as const) {
    const r = reviewCommercialAccount({ ...account, commercialStatus: "paying",
      lastPaymentDate: "2026-10-01", nextDueDate: addDays("2026-10-19", days) }, "2026-10-19");
    assert.equal(r.severity, severity);
    assert.ok(r.notice?.includes(fragment));
    assert.equal(r.blockingEnabled, false);
  }
});
test("review flags inconsistent periods and future payments without correcting them", () => {
  assert.ok(reviewCommercialAccount({ ...account, trialStartDate: "2026-10-01", trialEndDate: "2026-10-02" }, "2026-10-01")
    .issues.some(i => i.code === "trial_duration"));
  const result = reviewCommercialAccount({ ...account, commercialStatus: "paying",
    lastPaymentDate: "2026-11-01", nextDueDate: "2026-10-01" }, "2026-10-19");
  assert.deepEqual(result.issues.map(i => i.code), ["future_payment", "due_before_payment", "expired"]);
});
