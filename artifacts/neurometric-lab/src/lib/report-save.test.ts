import assert from "node:assert/strict";
import { test } from "node:test";
import { clinicalSnapshotForSave, prepareReportSave } from "./report-save";

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
  assert.deepEqual(edit.body, { title: "Editado", content: { resumen: "Más tarde" }, updatedAt: "2026-09-29T12:00:00Z" });
});

test("the generation's clinical evidence is frozen across range/live-record changes", () => {
  const generated = [{ id: 10, fecha: "2026-08-31" }, { id: 11, fecha: "2026-09-01" }];
  const otherRange = [{ id: 99, fecha: "2026-09-29" }];
  const frozen = clinicalSnapshotForSave(null, generated, 2);
  assert.deepEqual(frozen, generated);
  assert.notDeepEqual(frozen, otherRange);
  assert.deepEqual(clinicalSnapshotForSave(null, null, null), [], "legacy cannot inherit current sessions");
  assert.throws(() => clinicalSnapshotForSave(null, null, 2), /no coinciden/);
  assert.deepEqual(clinicalSnapshotForSave({ content: { clinicalSnapshot: generated } }, null, 2), generated);
});