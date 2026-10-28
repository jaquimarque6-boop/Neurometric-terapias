import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatExistingReportDraft,
  hasExistingReportDraftContent,
  normalizeExistingReportDraft,
} from "./report-context";

test("existing report context keeps clinician wording intact and excludes blank area text", () => {
  const original = "  Observación escrita por la profesional.\nConservar este renglón.  ";
  const draft = normalizeExistingReportDraft({
    resumen: original,
    conducta: "",
    areas: { " Lenguaje ": "  Texto clínico exacto.  ", Vacía: " " },
    removedAreas: ["Motricidad"],
    sugerencias: "",
  });

  assert.ok(draft);
  assert.equal(draft.resumen, original);
  assert.equal(draft.areas.Lenguaje, "  Texto clínico exacto.  ");
  assert.equal(hasExistingReportDraftContent(draft), true);
  const promptContext = formatExistingReportDraft(draft);
  assert.match(promptContext, /Observación escrita por la profesional\.\nConservar este renglón\./);
  assert.match(promptContext, /Lenguaje:   Texto clínico exacto\./);
  assert.match(promptContext, /Áreas retiradas por el profesional: Motricidad/);
  assert.doesNotMatch(promptContext, /Vacía:/);
});

test("existing report context rejects malformed and oversized drafts", () => {
  assert.equal(normalizeExistingReportDraft({ resumen: "incompleto" }), null);
  assert.equal(normalizeExistingReportDraft({
    resumen: "x".repeat(20_001),
    conducta: "",
    areas: {},
    removedAreas: [],
    sugerencias: "",
  }), null);
  assert.equal(normalizeExistingReportDraft({
    resumen: "",
    conducta: "",
    areas: { Comunicación: 1 },
    removedAreas: [],
    sugerencias: "",
  }), null);
});
