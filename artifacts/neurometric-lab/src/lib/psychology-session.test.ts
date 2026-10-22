import assert from "node:assert/strict";
import test from "node:test";
import { getPsychologyAgeStage } from "./psychology-clinical";
import {
  buildPsychologySessionSummary,
  createEmptyPsychologySessionDraft,
  getPsychologySessionSuggestions,
  hasPsychologySessionContent,
  PSYCHOLOGY_SESSION_AREAS,
} from "./psychology-session";

test("the requested ages receive age-specific, non-school guidance for adults", () => {
  const cases = [
    { age: 4, stage: "primera_infancia", label: "Primera infancia" },
    { age: 10, stage: "ninez", label: "Niñez" },
    { age: 16, stage: "adolescencia", label: "Adolescencia" },
    { age: 35, stage: "adultez", label: "Adultez" },
    { age: 75, stage: "adultez_mayor", label: "Adultez mayor" },
  ] as const;

  const stageSuggestions = cases.map(({ age, stage, label }) => {
    const ageStage = getPsychologyAgeStage(undefined, age);
    assert.equal(ageStage.stage, stage);
    assert.equal(ageStage.label, label);
    return getPsychologySessionSuggestions(ageStage.stage);
  });

  assert.notEqual(stageSuggestions[0].focus, stageSuggestions[3].focus);
  assert.match(stageSuggestions[0].participation, /juego/);
  assert.match(stageSuggestions[1].objectives, /niño o la niña/);
  assert.match(stageSuggestions[2].focus, /adolescente/);
  assert.doesNotMatch(Object.values(stageSuggestions[3]).join(" "), /escuela|escolar|infantil|juego/);
  assert.doesNotMatch(Object.values(stageSuggestions[4]).join(" "), /escuela|escolar|infantil|juego/);
});

test("area choices support several areas and tailor the focus suggestion", () => {
  const ids = [PSYCHOLOGY_SESSION_AREAS[0].id, PSYCHOLOGY_SESSION_AREAS[1].id];
  const suggestion = getPsychologySessionSuggestions("adultez", ids).focus;

  assert.match(suggestion, /Regulación e identificación emocional/);
  assert.match(suggestion, /Ansiedad, estrés y afrontamiento/);
  assert.equal(new Set(ids).size, 2);
});

test("session notes serialize as readable labels and empty optional fields stay omitted", () => {
  const draft = {
    ...createEmptyPsychologySessionDraft(),
    focus: "Explorar recursos actuales.",
    objectives: "Acordar un objetivo con la persona.",
    nextSteps: "Revisar el objetivo en el próximo encuentro.",
  };
  const summary = buildPsychologySessionSummary(
    ["emotion", "strengths"],
    draft,
  );

  assert.equal(
    summary,
    [
      "Áreas trabajadas: Regulación e identificación emocional, Recursos personales y fortalezas",
      "Foco terapéutico: Explorar recursos actuales.",
      "Objetivos de la sesión: Acordar un objetivo con la persona.",
      "Próximos pasos: Revisar el objetivo en el próximo encuentro.",
    ].join("\n"),
  );
  assert.doesNotMatch(summary, /Intervenciones y técnicas utilizadas|Evolución observada/);
});

test("session saving remains optional until an area or clinical note is entered", () => {
  const empty = createEmptyPsychologySessionDraft();
  assert.equal(hasPsychologySessionContent([], empty, ""), false);
  assert.equal(hasPsychologySessionContent(["anxiety"], empty, ""), true);
  assert.equal(hasPsychologySessionContent([], empty, "Observación registrada."), true);
});
