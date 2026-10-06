import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildSessionPath,
  findAccessiblePatient,
  parsePatientId,
} from "./session-navigation.ts";

test("patient query IDs must be positive safe integers", () => {
  assert.equal(parsePatientId("?patientId=23"), 23);
  assert.equal(parsePatientId("patientId=23"), 23);
  for (const search of [
    "",
    "?patientId=",
    "?patientId=0",
    "?patientId=-2",
    "?patientId=2.5",
    "?patientId=23abc",
    "?patientId=9007199254740992",
  ]) {
    assert.equal(parsePatientId(search), null, search);
  }
});

test("URL patients are accepted only when present in the accessible list", () => {
  const patients = [{ id: 23, name: "Paciente permitido" }];

  assert.deepEqual(findAccessiblePatient(patients, 23), patients[0]);
  assert.equal(findAccessiblePatient(patients, 24), null);
  assert.equal(findAccessiblePatient(patients, null), null);
});

test("session routes preserve quick/full choice and add only valid patient IDs", () => {
  assert.equal(buildSessionPath("quick"), "/sesion-rapida");
  assert.equal(buildSessionPath("quick", null), "/sesion-rapida");
  assert.equal(buildSessionPath("quick", 23), "/sesion-rapida?patientId=23");
  assert.equal(buildSessionPath("complete", 23), "/nueva-sesion?patientId=23");
  assert.equal(buildSessionPath("complete", 0), "/nueva-sesion");
});
