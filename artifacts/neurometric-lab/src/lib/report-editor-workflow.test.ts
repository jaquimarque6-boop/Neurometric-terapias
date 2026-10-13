import assert from "node:assert/strict";
import { test } from "node:test";
import { addReportArea, removeReportArea, renameReportArea } from "./report-areas";
import {
  acceptPendingReportGeneration,
  cancelPendingReportGeneration,
  requestReportGeneration,
  restoreSavedReportDraft,
  type ReportEditorDraft,
} from "./report-editor-workflow";

test("synthetic editor flow keeps area text, cancels safely, replaces only on accept, and restores legacy reports", () => {
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
    areas: { "Lenguaje y comunicación": "Hallazgo sintético" },
    sugerencias: "Sugerencia generada",
  };
  const waiting = requestReportGeneration(draft, generated);
  assert.equal(waiting.confirmationOpen, true);
  assert.deepEqual(waiting.draft, draft);

  const cancelled = cancelPendingReportGeneration(waiting);
  assert.equal(cancelled.confirmationOpen, false);
  assert.equal(cancelled.pending, null);
  assert.deepEqual(cancelled.draft, draft);

  const accepted = acceptPendingReportGeneration(requestReportGeneration(draft, generated));
  assert.deepEqual(accepted.draft, {
    resumen: "Resumen generado",
    conducta: "",
    areas: { "Lenguaje y comunicación": "Hallazgo sintético" },
    removedAreas: [],
    sugerencias: "Sugerencia generada",
  });
  assert.equal(accepted.pending, null);
  assert.equal(accepted.confirmationOpen, false);

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
