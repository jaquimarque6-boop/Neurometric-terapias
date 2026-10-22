import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canAccessLibraryGoal,
  canAccessPatient,
  canAdminAccessApiRoute,
  canCollaboratorAccessApiRoute,
  canRoleAccessApiRoute,
  getPatientListScope,
  shouldBypassCurrentUserAuthorization,
} from "../src/routes/access-policy";

const admin = { id: 1, role: "admin" };
const owner = { id: 2, role: "professional" };
const other = { id: 3, role: "professional" };

test("clinical access is restricted to the assigned professional account", () => {
  const patient = { assignedProfessionalId: owner.id };
  assert.equal(canAccessPatient(patient, admin), false);
  assert.equal(canAccessPatient(patient, owner), true);
  assert.equal(canAccessPatient(patient, other), false);
  assert.equal(canAccessPatient({ assignedProfessionalId: null }, owner), false);
  assert.equal(canAccessPatient(patient, { id: 4, role: "collaborator" }), false);
});

test("patient list scope never grants a global list", () => {
  assert.deepEqual(getPatientListScope(admin, true), {
    archived: true,
    assignedProfessionalId: admin.id,
  });
  assert.deepEqual(getPatientListScope(owner, false), {
    archived: false,
    assignedProfessionalId: owner.id,
  });

  const ownArchivedScope = getPatientListScope(owner, true);
  assert.deepEqual(ownArchivedScope, {
    archived: true,
    assignedProfessionalId: owner.id,
  });

  const archivedPatients = [
    { id: 1, assignedProfessionalId: owner.id, archived: true },
    { id: 2, assignedProfessionalId: other.id, archived: true },
    { id: 3, assignedProfessionalId: owner.id, archived: false },
  ];
  const ownerArchived = archivedPatients.filter(patient =>
    patient.archived === ownArchivedScope.archived &&
    patient.assignedProfessionalId === ownArchivedScope.assignedProfessionalId
  );
  assert.deepEqual(ownerArchived.map(patient => patient.id), [1]);

  const adminArchivedScope = getPatientListScope(admin, true);
  const adminArchived = archivedPatients.filter(patient =>
    patient.archived === adminArchivedScope.archived &&
    patient.assignedProfessionalId === adminArchivedScope.assignedProfessionalId
  );
  assert.deepEqual(adminArchived.map(patient => patient.id), []);
});

test("global library is readable by professionals, not admins, and remains read-only to professionals", () => {
  const global = { isCustom: false, createdBy: null };
  assert.equal(canAccessLibraryGoal(global, admin, false), false);
  assert.equal(canAccessLibraryGoal(global, admin, true), false);
  assert.equal(canAccessLibraryGoal(global, owner, false), true);
  assert.equal(canAccessLibraryGoal(global, owner, true), false);
});

test("custom library reads and writes belong only to the owning professional", () => {
  const custom = { isCustom: true, createdBy: owner.id };
  for (const write of [false, true]) {
    assert.equal(canAccessLibraryGoal(custom, admin, write), false);
    assert.equal(canAccessLibraryGoal(custom, owner, write), true);
    assert.equal(canAccessLibraryGoal(custom, other, write), false);
    assert.equal(canAccessLibraryGoal({ isCustom: true, createdBy: null }, other, write), false);
  }
});

test("admin API access is default-deny with only administrative and aggregate endpoints allowed", () => {
  for (const [method, path] of [
    ["GET", "/api/patients"],
    ["POST", "/api/patients"],
    ["GET", "/api/citas"],
    ["GET", "/api/goals"],
    ["GET", "/api/sessions"],
    ["GET", "/api/registros-clinicos"],
    ["GET", "/api/pagos"],
    ["GET", "/api/gastos"],
    ["GET", "/api/goal-library"],
    ["POST", "/api/ai/informe-generate"],
    ["GET", "/api/export/my-data"],
    ["GET", "/api/users/2/deletion-preview"],
    ["DELETE", "/api/users/2/permanent"],
  ]) {
    assert.equal(canAdminAccessApiRoute(method, path), false, `${method} ${path}`);
  }

  for (const [method, path] of [
    ["GET", "/api/auth/me"],
    ["PATCH", "/api/auth/me"],
    ["GET", "/api/users"],
    ["POST", "/api/users"],
    ["PATCH", "/api/users/2"],
    ["DELETE", "/api/users/2"],
    ["GET", "/api/collaborators"],
    ["POST", "/api/saas/receipts"],
    ["GET", "/api/dashboard/stats"],
  ]) {
    assert.equal(canAdminAccessApiRoute(method, path), true, `${method} ${path}`);
  }
});

test("login reaches credential validation with or without any existing account session", () => {
  const roles = ["admin", "professional", "collaborator"] as const;
  for (const role of roles) {
    for (const hasSession of [false, true]) {
      assert.equal(
        shouldBypassCurrentUserAuthorization(
          "POST",
          "/api/auth/login",
          hasSession,
          false,
        ),
        true,
        `${role} login with ${hasSession ? "prior session/token" : "no session"}`,
      );
    }
  }
  assert.equal(
    shouldBypassCurrentUserAuthorization("POST", "/api/auth/login", false, true),
    true,
    "a stale bearer token must not block credential validation",
  );

  // Login is not added to either authenticated role's protected-route
  // allowlist; it is bypassed only to reach the credential-checking handler.
  assert.equal(canAdminAccessApiRoute("POST", "/api/auth/login"), false);
  assert.equal(canCollaboratorAccessApiRoute("POST", "/api/auth/login"), false);
});

test("login bypass does not bypass authorization on protected clinical routes", () => {
  for (const role of ["admin", "professional", "collaborator"]) {
    assert.equal(
      shouldBypassCurrentUserAuthorization("GET", "/api/patients", true, false),
      false,
      `${role} session must not bypass the patients route`,
    );
  }
  assert.equal(canRoleAccessApiRoute("admin", "GET", "/api/patients"), false);
  assert.equal(canRoleAccessApiRoute("collaborator", "GET", "/api/patients"), false);
  assert.equal(canRoleAccessApiRoute("professional", "GET", "/api/patients"), true);

  const patient = { assignedProfessionalId: owner.id };
  assert.equal(canAccessPatient(patient, owner), true);
  assert.equal(canAccessPatient(patient, other), false);
});