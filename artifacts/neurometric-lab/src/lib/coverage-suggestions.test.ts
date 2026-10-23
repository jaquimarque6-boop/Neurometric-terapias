import assert from "node:assert/strict";
import test from "node:test";
import { getCoverageSuggestions } from "./coverage-suggestions";

test("coverage suggestions are unique and limited to the current professional's other patients", () => {
  const patients = [
    { id: 1, assignedProfessionalId: 7, coberturaMedica: "OSDE" },
    { id: 2, assignedProfessionalId: 7, coberturaMedica: "  Swiss Medical " },
    { id: 3, assignedProfessionalId: 7, coberturaMedica: "osde " },
    { id: 4, assignedProfessionalId: 8, coberturaMedica: "Cobertura de otra cuenta" },
    { id: 5, assignedProfessionalId: 7, coberturaMedica: "Cobertura del paciente actual" },
    { id: 6, assignedProfessionalId: 7, coberturaMedica: "  " },
    { id: 7, assignedProfessionalId: null, coberturaMedica: "Sin profesional" },
  ];

  assert.deepEqual(
    getCoverageSuggestions(patients, 7, 5),
    ["OSDE", "Swiss Medical"],
  );
});

test("coverage suggestions are empty without an authenticated professional", () => {
  const patients = [
    { id: 1, assignedProfessionalId: 7, coberturaMedica: "OSDE" },
  ];

  assert.deepEqual(getCoverageSuggestions(patients, null), []);
  assert.deepEqual(getCoverageSuggestions(patients, undefined), []);
});
