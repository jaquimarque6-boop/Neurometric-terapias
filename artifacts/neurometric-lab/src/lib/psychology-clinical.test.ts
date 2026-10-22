import assert from "node:assert/strict";
import test from "node:test";
import {
  ANAMNESIS_FIELDS,
  createEmptyEvaluation,
  createPsychologyRecordId,
  getPsychologyAgeStage,
} from "./psychology-clinical";

test("assigns the requested age stages using the shared age calculation", () => {
  const cases = [
    { age: 4, stage: "primera_infancia", label: "Primera infancia" },
    { age: 10, stage: "ninez", label: "Niñez" },
    { age: 16, stage: "adolescencia", label: "Adolescencia" },
    { age: 35, stage: "adultez", label: "Adultez" },
    { age: 75, stage: "adultez_mayor", label: "Adultez mayor" },
  ] as const;

  for (const example of cases) {
    const result = getPsychologyAgeStage(undefined, example.age);
    assert.equal(result.stage, example.stage);
    assert.equal(result.label, example.label);
    assert.equal(result.age, example.age);
    assert.equal(result.formattedAge, `${example.age} años`);
  }
});

test("prefers date of birth and falls back to manual age when the date is invalid", () => {
  const today = new Date();
  const birthDate = new Date(today.getFullYear() - 35, today.getMonth(), today.getDate());
  const dateString = [
    birthDate.getFullYear(),
    String(birthDate.getMonth() + 1).padStart(2, "0"),
    String(birthDate.getDate()).padStart(2, "0"),
  ].join("-");

  assert.equal(getPsychologyAgeStage(dateString, 4).stage, "adultez");
  assert.equal(getPsychologyAgeStage("not-a-date", 10).stage, "ninez");
});

test("keeps prompts neutral for adults and uses school/caregiver context only when age-appropriate", () => {
  const familyHistory = ANAMNESIS_FIELDS.find(({ key }) => key === "personalFamilyHistory");
  const lifeContext = ANAMNESIS_FIELDS.find(({ key }) => key === "lifeContext");
  assert.ok(familyHistory);
  assert.ok(lifeContext);

  assert.match(familyHistory.prompt("primera_infancia"), /cuidadores/);
  assert.doesNotMatch(familyHistory.prompt("adultez"), /cuidadores|familiares/);
  assert.match(lifeContext.prompt("ninez"), /escuela/);
  assert.doesNotMatch(lifeContext.prompt("adultez"), /escuela/);
});

test("creates UUIDs compatible with the patient API contract", () => {
  assert.match(createPsychologyRecordId(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.match(createEmptyEvaluation().id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});
