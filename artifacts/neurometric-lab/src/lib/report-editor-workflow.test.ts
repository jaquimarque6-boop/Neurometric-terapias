import assert from "node:assert/strict";
import { test } from "node:test";
import { addReportArea, removeReportArea, renameReportArea } from "./report-areas";
import {
  acceptPendingReportGeneration,
  cancelPendingReportGeneration,
  cloneReportDraft,
  reportDraftsEqual,
  requestReportGeneration,
  restoreSavedReportDraft,
  type ReportEditorDraft,
} from "./report-editor-workflow";

test("AI report preview preserves professional text, cancels safely, appends on accept, and restores legacy reports", () => {
  let draft: ReportEditorDraft = {
    resumen: "Resumen previo",
    conducta: "Conducta previa",
    areas: { Comunicación: "Texto a conservar", Motricidad: "Texto de motricidad" },
    removedAreas: ["Área eliminada"],
    sugerencias: "Sugerencias previas",
  };

  const added = addReportArea(draft.areas, draft.removedAreas);
  draft = { ...draft, areas: added.areaTexts, removedAreas: added.removedAreaNames };
  assert.equal(draft.areas["Nueva área"], "");
  assert.equal(draft.areas.Comunicación, "Texto a conservar");

  const renamed = renameReportArea(draft.areas, draft.removedAreas, "Comunicación", "Área eliminada");
  assert.equal(renamed.ok, true);
  if (!renamed.ok) return;
  draft = { ...draft, areas: renamed.areaTexts, removedAreas: renamed.removedAreaNames };
  assert.equal(draft.areas["Área eliminada"], "Texto a conservar");
  assert.equal(draft.removedAreas.includes("Área eliminada"), false);

  const removed = removeReportArea(draft.areas, draft.removedAreas, "Motricidad");
  draft = { ...draft, areas: removed.areaTexts, removedAreas: removed.removedAreaNames };
  assert.equal(draft.areas.Motricidad, undefined);
  assert.equal(draft.areas["Nueva área"], "");
  assert.equal(draft.areas["Área eliminada"], "Texto a conservar");

  const generated = {
    resumen: "Resumen generado",
    conducta: "",
    areas: {
      "área eliminada": "Hallazgo sintético",
      "Lenguaje y comunicación": "Aporte nuevo",
    },
    sugerencias: "Sugerencia generada",
  };
  const waiting = requestReportGeneration(draft, generated);
  assert.equal(waiting.confirmationOpen, true);
  assert.deepEqual(waiting.draft, draft);
  assert.deepEqual(waiting.pending, generated);

  const cancelled = cancelPendingReportGeneration(waiting);
  assert.equal(cancelled.confirmationOpen, false);
  assert.equal(cancelled.pending, null);
  assert.deepEqual(cancelled.draft, draft);

  const accepted = acceptPendingReportGeneration(requestReportGeneration(draft, generated));
  assert.deepEqual(accepted.draft, {
    resumen: "Resumen previo\n\nResumen generado",
    conducta: "Conducta previa",
    areas: {
      "Área eliminada": "Texto a conservar\n\nHallazgo sintético",
      "Nueva área": "",
      "Lenguaje y comunicación": "Aporte nuevo",
    },
    removedAreas: ["Motricidad"],
    sugerencias: "Sugerencias previas\n\nSugerencia generada",
  });
  assert.equal(accepted.pending, null);
  assert.equal(accepted.confirmationOpen, false);

  const duplicateAddition = acceptPendingReportGeneration({
    draft: accepted.draft,
    pending: { resumen: "Resumen generado" },
    confirmationOpen: true,
  });
  assert.equal(duplicateAddition.draft.resumen, accepted.draft.resumen);

  const emptyDraft: ReportEditorDraft = {
    resumen: "", conducta: "", areas: {}, removedAreas: [], sugerencias: "",
  };
  const generatedFromEmpty = acceptPendingReportGeneration(requestReportGeneration(emptyDraft, generated));
  assert.equal(generatedFromEmpty.draft.resumen, "Resumen generado");
  assert.equal(generatedFromEmpty.draft.sugerencias, "Sugerencia generada");

  const removedAreaDraft = { ...emptyDraft, removedAreas: ["Motricidad"] };
  const removedAreaAccepted = acceptPendingReportGeneration(requestReportGeneration(removedAreaDraft, {
    areas: { Motricidad: "No reponer", Cognición: "Aporte nuevo" },
  }));
  assert.deepEqual(removedAreaAccepted.draft.areas, { Cognición: "Aporte nuevo" });
  assert.deepEqual(removedAreaAccepted.draft.removedAreas, ["Motricidad"]);

  const legacy = restoreSavedReportDraft({
    resumen: "Informe heredado",
    areas: { Comunicación: "Texto histórico" },
  });
  assert.deepEqual(legacy, {
    resumen: "Informe heredado",
    conducta: "",
    areas: { Comunicación: "Texto histórico" },
    removedAreas: [],
    sugerencias: "",
  });
});

test("accepted AI rewrite replaces the draft only after preview and keeps removed areas", () => {
  const original: ReportEditorDraft = {
    resumen: "Durante la sesión participó. Participó durante la sesión.",
    conducta: "Respondió con apoyo.",
    areas: { Lenguaje: "Usó palabras. Usó palabras." },
    removedAreas: ["Motricidad"],
    sugerencias: "",
  };
  const rewrite = {
    mode: "rewrite" as const,
    resumen: "Participó durante la sesión.",
    conducta: "Respondió con apoyo.",
    areas: {
      Lenguaje: "Usó palabras y amplió su vocabulario.",
      Motricidad: "No debe restituirse.",
    },
    sugerencias: "",
  };
  const sourceSnapshot = cloneReportDraft(original);
  const waiting = requestReportGeneration(sourceSnapshot, rewrite);
  assert.deepEqual(waiting.draft, original, "the editor remains unchanged while the proposal is pending");
  assert.equal(reportDraftsEqual(original, sourceSnapshot), true);
  assert.equal(reportDraftsEqual(original, { ...sourceSnapshot, resumen: "Editado durante la generación" }), false);

  const cancelled = cancelPendingReportGeneration(waiting);
  assert.deepEqual(cancelled.draft, original, "cancel keeps every original field exactly");

  const accepted = acceptPendingReportGeneration(waiting);
  assert.deepEqual(accepted.draft, {
    resumen: "Participó durante la sesión.",
    conducta: "Respondió con apoyo.",
    areas: { Lenguaje: "Usó palabras y amplió su vocabulario." },
    removedAreas: ["Motricidad"],
    sugerencias: "",
  });
  assert.equal(original.resumen, "Durante la sesión participó. Participó durante la sesión.");
});
