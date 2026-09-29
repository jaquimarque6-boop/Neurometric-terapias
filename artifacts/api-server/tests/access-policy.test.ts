import assert from "node:assert/strict";
import { test } from "node:test";
import { canAccessLibraryGoal, canAccessPatient } from "../src/routes/access-policy";

const admin = { id: 1, role: "admin" };
const owner = { id: 2, role: "professional" };
const other = { id: 3, role: "professional" };

test("clinical access is restricted to admin and the assigned professional", () => {
  const patient = { assignedProfessionalId: owner.id };
  assert.equal(canAccessPatient(patient, admin), true);
  assert.equal(canAccessPatient(patient, owner), true);
  assert.equal(canAccessPatient(patient, other), false);
  assert.equal(canAccessPatient({ assignedProfessionalId: null }, owner), false);
});

test("global library permits authenticated reads but only admin writes", () => {
  const global = { isCustom: false, createdBy: null };
  assert.equal(canAccessLibraryGoal(global, admin, true), true);
  assert.equal(canAccessLibraryGoal(global, owner, false), true);
  assert.equal(canAccessLibraryGoal(global, owner, true), false);
});

test("custom library reads and writes belong only to owner or admin", () => {
  const custom = { isCustom: true, createdBy: owner.id };
  for (const write of [false, true]) {
    assert.equal(canAccessLibraryGoal(custom, admin, write), true);
    assert.equal(canAccessLibraryGoal(custom, owner, write), true);
    assert.equal(canAccessLibraryGoal(custom, other, write), false);
    assert.equal(canAccessLibraryGoal({ isCustom: true, createdBy: null }, other, write), false);
  }
});