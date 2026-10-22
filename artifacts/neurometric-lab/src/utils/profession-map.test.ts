import assert from "node:assert/strict";
import { test } from "node:test";
import { getDiagnosisOptionsForProfesion, getDiagnosesByProfesion, getBancoAreas, getProfesion } from "./profession-map";

test("recognizes the four core specialties and preserved display-name variants", () => {
  assert.equal(getProfesion("Fonoaudiología"), "fonoaudiologia");
  assert.equal(getProfesion("Psicopedagogía"), "psicopedagogia");
  assert.equal(getProfesion("Terapia Ocupacional"), "terapia_ocupacional");
  assert.equal(getProfesion("Psicología"), "psicologia");
  assert.equal(getProfesion("Psicología Infantil"), "psicologia");
  assert.equal(getProfesion("Neuropsicología"), "psicologia");
  assert.equal(getProfesion("Logopedia"), "fonoaudiologia");
});

test("Psychology and unknown specialties do not inherit another specialty's bank", () => {
  for (const specialty of ["psicologia", "general"] as const) {
    assert.deepEqual(getDiagnosesByProfesion(specialty), []);
    assert.deepEqual(getBancoAreas(specialty), []);
  }
  assert.equal(getProfesion("Otra especialidad"), "general");
  assert.equal(getProfesion("Kinesiología"), "general");
  assert.equal(getProfesion(undefined), "general");
});

test("known patient diagnoses remain available without mutating stored values", () => {
  const storedDiagnoses = ["TSH", "TDAH", "Diagnóstico ya registrado"];
  const original = [...storedDiagnoses];
  const options = getDiagnosisOptionsForProfesion(
    getProfesion("Neuropsicología"),
    storedDiagnoses,
  );

  assert.deepEqual(options.map((option) => option.value), storedDiagnoses);
  assert.deepEqual(storedDiagnoses, original);
});

test("existing specialty diagnosis and goal-area banks remain configured", () => {
  assert.ok(getDiagnosesByProfesion("fonoaudiologia").length > 0);
  assert.ok(getDiagnosesByProfesion("psicopedagogia").length > 0);
  assert.ok(getDiagnosesByProfesion("terapia_ocupacional").length > 0);
  assert.ok(getBancoAreas("fonoaudiologia").length > 0);
  assert.ok(getBancoAreas("psicopedagogia").length > 0);
  assert.ok(getBancoAreas("terapia_ocupacional").length > 0);
});
