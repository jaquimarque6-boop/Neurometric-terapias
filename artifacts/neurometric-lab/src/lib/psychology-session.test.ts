import assert from "node:assert/strict";
import test from "node:test";
import {
  formatPsychologySessionSummary,
  parsePsychologySessionSummary,
} from "@workspace/clinical-specialty";
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

test("structured session notes reopen, edit, and resave without losing empty or special-character fields", () => {
  const draft = {
    ...createEmptyPsychologySessionDraft(),
    focus: "Explorar recursos actuales.\nIncluye coma, | y [[NEUROMETRIC:PSICOLOGIA:V1:FIN]]; ñ, á, y 🧠.",
    interventions: 'Recurso "A"; segunda línea.',
    participation: "La persona eligió: «sí».",
  };
  const summary = buildPsychologySessionSummary(
    ["emotion", "strengths"],
    draft,
  );
  const reopened = parsePsychologySessionSummary(summary);

  assert.ok(reopened);
  assert.deepEqual(reopened.areas, [
    PSYCHOLOGY_SESSION_AREAS[0],
    PSYCHOLOGY_SESSION_AREAS[9],
  ]);
  assert.deepEqual(reopened.fields, draft);
  assert.equal(reopened.fields.objectives, "");
  assert.equal(reopened.fields.evolution, "");
  const readable = formatPsychologySessionSummary(summary);
  assert.match(readable, /Foco terapéutico: Explorar recursos actuales\./);
  assert.match(readable, /Intervenciones: Recurso "A"; segunda línea\./);
  assert.doesNotMatch(readable, /^\[\[NEUROMETRIC:PSICOLOGIA:V1:INICIO\]\]/);
  assert.doesNotMatch(readable, /\n\[\[NEUROMETRIC:PSICOLOGIA:V1:FIN\]\]$/);

  const resaved = buildPsychologySessionSummary(
    reopened.areas.map(area => area.id),
    { ...reopened.fields, focus: "Foco editado; conserva ñ y 🔎." },
    reopened.areas,
  );
  const reopenedAgain = parsePsychologySessionSummary(resaved);
  assert.ok(reopenedAgain);
  assert.equal(reopenedAgain.fields.focus, "Foco editado; conserva ñ y 🔎.");
  assert.equal(reopenedAgain.fields.objectives, "");
  assert.equal(reopenedAgain.fields.interventions, draft.interventions);
  assert.equal(reopenedAgain.fields.participation, draft.participation);
  assert.equal(reopenedAgain.fields.evolution, "");
  assert.equal(reopenedAgain.fields.nextSteps, "");
});

test("legacy summaries remain unchanged and are not inferred into structured fields", () => {
  const legacy = "Resumen anterior\nIntervenciones: conversación y juego.";
  assert.equal(parsePsychologySessionSummary(legacy), null);
  assert.equal(formatPsychologySessionSummary(legacy), legacy);
});

test("session saving remains optional until an area or clinical note is entered", () => {
  const empty = createEmptyPsychologySessionDraft();
  assert.equal(hasPsychologySessionContent([], empty, ""), false);
  assert.equal(hasPsychologySessionContent(["anxiety"], empty, ""), true);
  assert.equal(hasPsychologySessionContent([], empty, "Observación registrada."), true);
});
