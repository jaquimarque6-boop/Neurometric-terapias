import assert from "node:assert/strict";
import { test } from "node:test";
import { clinicalSnapshotForSave, prepareReportSave } from "./report-save";
import {
  acceptPendingReportGeneration,
  requestReportGeneration,
  restoreSavedReportDraft,
} from "./report-editor-workflow";

test("saving a legacy report creates a new document and explicitly keeps unknown provenance null", () => {
  const content = { v: 4, resumen: "Informe antiguo importado explícitamente" };
  const request = prepareReportSave("evolution", "Informe heredado", content, null, null);
  assert.equal(request.method, "POST");
  assert.equal(request.reportId, null);
  assert.deepEqual(request.body, {
    reportType: "evolution", title: "Informe heredado", content,
    periodKind: null, periodFrom: null, periodTo: null,
    clinicalRecordsUsedCount: null, clinicalRecordsTotalCount: null,
  });
});

test("the generated server period/counts remain intact in the saved draft without recounting", () => {
  const meta = {
    periodKind: "mes", periodFrom: "2026-08-30", periodTo: "2026-09-29",
    clinicalRecordsUsedCount: 1, clinicalRecordsTotalCount: 9,
  };
  const request = prepareReportSave("evolution", "Nuevo", { resumen: "Editado" }, meta, null);
  assert.equal(request.method, "POST");
  assert.deepEqual(Object.fromEntries(Object.keys(meta).map(key => [key, request.body[key as keyof typeof request.body]])), meta);
  const edit = prepareReportSave("evolution", "Editado", { resumen: "Más tarde" }, meta,
    { id: 7, reportType: "evolution", updatedAt: "2026-09-29T12:00:00Z" });
  assert.equal(edit.method, "PUT");
  assert.equal(edit.reportId, 7);
  assert.deepEqual(edit.body, {
    title: "Editado",
    content: { resumen: "Más tarde" },
    updatedAt: "2026-09-29T12:00:00Z",
    ...meta,
  });
});

test("the generation's clinical evidence is frozen across range/live-record changes", () => {
  const generated = [{ id: 10, fecha: "2026-08-31" }, { id: 11, fecha: "2026-09-01" }];
  const otherRange = [{ id: 99, fecha: "2026-09-29" }];
  const frozen = clinicalSnapshotForSave(null, generated, 2);
  assert.deepEqual(frozen, generated);
  assert.deepEqual(
    clinicalSnapshotForSave({ content: { clinicalSnapshot: otherRange } }, generated, 2),
    generated,
    "accepted AI improvement updates evidence to the snapshot it actually used",
  );
  assert.notDeepEqual(frozen, otherRange);
  assert.deepEqual(clinicalSnapshotForSave(null, null, null), [], "legacy cannot inherit current sessions");
  assert.throws(() => clinicalSnapshotForSave(null, null, 2), /no coinciden/);
  assert.deepEqual(clinicalSnapshotForSave({ content: { clinicalSnapshot: generated } }, null, 2), generated);
});

test("edited report sections survive save and reopening unchanged", () => {
  const content = {
    v: 4,
    resumen: "Observación general editada por la profesional.",
    conducta: "Participación con apoyo verbal.",
    areas: { Cognición: "Organizó una secuencia con ayuda." },
    sugerencias: "",
    removedAreas: [],
  };
  const request = prepareReportSave(
    "evolution",
    "Informe revisado",
    content,
    null,
    { id: 5, reportType: "evolution", updatedAt: "2026-10-28T10:00:00Z" },
  );
  const reopened = restoreSavedReportDraft(request.body.content);

  assert.equal(request.method, "PUT");
  assert.equal(request.reportId, 5);
  assert.deepEqual(reopened, {
    resumen: content.resumen,
    conducta: content.conducta,
    areas: content.areas,
    removedAreas: [],
    sugerencias: "",
  });
});

test("accepting AI additions and saving an existing report preserves the professional draft", () => {
  const original = {
    resumen: "Conclusión escrita por la profesional.",
    conducta: "Participó con apoyo verbal.",
    areas: { Lenguaje: "Usó frases de dos palabras." },
    removedAreas: ["Motricidad"],
    sugerencias: "",
  };
  const proposed = requestReportGeneration(original, {
    resumen: "Se observó una respuesta a consignas de dos pasos.",
    conducta: "",
    areas: {
      Lenguaje: "Amplió vocabulario en actividades espontáneas.",
      Motricidad: "No debe reaparecer.",
    },
    sugerencias: "La familia puede continuar con las consignas documentadas.",
  });
  assert.equal(proposed.confirmationOpen, true);
  assert.deepEqual(proposed.draft, original, "opening the preview never mutates the editor");

  const accepted = acceptPendingReportGeneration(proposed);
  assert.equal(accepted.draft.resumen, `${original.resumen}\n\nSe observó una respuesta a consignas de dos pasos.`);
  assert.equal(accepted.draft.conducta, original.conducta);
  assert.equal(accepted.draft.areas.Lenguaje, `${original.areas.Lenguaje}\n\nAmplió vocabulario en actividades espontáneas.`);
  assert.deepEqual(accepted.draft.removedAreas, original.removedAreas);
  assert.equal(accepted.draft.areas.Motricidad, undefined);

  const content = { v: 4, ...accepted.draft, clinicalSnapshot: [{ id: 41 }] };
  const savedRequest = prepareReportSave(
    "evolution",
    "Informe actualizado",
    content,
    {
      periodKind: "mes",
      periodFrom: "2026-09-01",
      periodTo: "2026-09-30",
      clinicalRecordsUsedCount: 1,
      clinicalRecordsTotalCount: 3,
    },
    { id: 17, reportType: "evolution", updatedAt: "2026-10-01T12:00:00Z" },
  );
  assert.equal(savedRequest.method, "PUT");
  assert.equal(savedRequest.reportId, 17, "saving an improvement updates the selected report");
  assert.deepEqual(
    restoreSavedReportDraft(savedRequest.body.content),
    accepted.draft,
    "reopening the saved document retains both the professional text and the accepted additions",
  );
});