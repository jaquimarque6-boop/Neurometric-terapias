import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatExistingReportDraft,
  hasExistingReportDraftContent,
  normalizeCompleteReportRewrite,
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

test("complete AI rewrites keep original area names and reject omissions or removed areas", () => {
  const original = normalizeExistingReportDraft({
    resumen: "Observación clínica original.",
    conducta: "Respondió con apoyo.",
    areas: { "Lenguaje y comunicación": "Usó frases breves." },
    removedAreas: ["Motricidad"],
    sugerencias: "Continuar con la actividad documentada.",
  });
  assert.ok(original);

  const normalized = normalizeCompleteReportRewrite({
    resumen: "Observación clínica reorganizada.",
    conducta: "Con apoyo, respondió a las consignas.",
    areas: {
      "lenguaje y comunicacion": "Usó frases breves en la actividad.",
      Cognición: "Organizó una secuencia con apoyo.",
    },
    sugerencias: "Se propone continuar con la actividad documentada.",
  }, original, ["Cognición"]);
  assert.deepEqual(normalized, {
    resumen: "Observación clínica reorganizada.",
    conducta: "Con apoyo, respondió a las consignas.",
    areas: {
      "Lenguaje y comunicación": "Usó frases breves en la actividad.",
      Cognición: "Organizó una secuencia con apoyo.",
    },
    sugerencias: "Se propone continuar con la actividad documentada.",
  });

  assert.equal(normalizeCompleteReportRewrite({
    resumen: "",
    conducta: "Respondió con apoyo.",
    areas: { "Lenguaje y comunicación": "Usó frases breves." },
    sugerencias: "Continuar con la actividad documentada.",
  }, original, ["Cognición"]), null, "a non-empty section cannot be erased");
  assert.equal(normalizeCompleteReportRewrite({
    resumen: "Observación clínica reorganizada.",
    conducta: "Respondió con apoyo.",
    areas: {},
    sugerencias: "Continuar con la actividad documentada.",
  }, original, ["Cognición"]), null, "a non-empty area cannot be omitted");
  assert.equal(normalizeCompleteReportRewrite({
    resumen: "Observación clínica reorganizada.",
    conducta: "Respondió con apoyo.",
    areas: {
      "Lenguaje y comunicación": "Usó frases breves.",
      Motricidad: "Área retirada.",
    },
    sugerencias: "Continuar con la actividad documentada.",
  }, original, ["Cognición"]), null, "a removed area cannot return");
  assert.equal(normalizeCompleteReportRewrite({
    resumen: "Observación clínica reorganizada.",
    conducta: "Respondió con apoyo.",
    areas: {
      "Lenguaje y comunicación": "Usó frases breves.",
      "Área inventada": "Contenido.",
    },
    sugerencias: "Continuar con la actividad documentada.",
  }, original, ["Cognición"]), null, "unsupported area names are rejected");
});
