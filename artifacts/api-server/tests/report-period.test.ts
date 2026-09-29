import assert from "node:assert/strict";
import { test } from "node:test";
import { selectClinicalPeriod } from "../src/routes/report-period";

const now = new Date("2026-09-29T12:00:00Z");
const record = (fecha: string) => ({ fecha, createdAt: new Date(`${fecha}T12:00:00Z`) });

test("no records: zero used and total, unknown start for last-four mode", () => {
  assert.deepEqual(selectClinicalPeriod([], "4", now), {
    selected: [], periodKind: "4", periodFrom: null, periodTo: "2026-09-29",
    clinicalRecordsUsedCount: 0, clinicalRecordsTotalCount: 0,
  });
});

test("one included record is not confused with one lifetime record", () => {
  const selected = selectClinicalPeriod([record("2026-01-01"), record("2026-09-29")], "mes", now);
  assert.equal(selected.clinicalRecordsUsedCount, 1);
  assert.equal(selected.clinicalRecordsTotalCount, 2);
  assert.equal(selected.periodFrom, "2026-08-30");
});

test("last four sorts by date and retains actual earliest included date", () => {
  const selected = selectClinicalPeriod(["2026-02-01", "2026-07-02", "2026-08-02", "2026-09-01", "2026-09-29"].map(record), "4", now);
  assert.equal(selected.selected.length, 4);
  assert.equal(selected.periodFrom, "2026-07-02");
  assert.equal(selected.clinicalRecordsTotalCount, 5);
});

test("invalid, non-ISO and future session dates do not invent dates from row creation timestamps", () => {
  const records = [
    record("2026-09-10"),
    { fecha: "2026-02-30", createdAt: now },
    { fecha: "09/11/2026", createdAt: now },
    { fecha: "", createdAt: now },
    { fecha: "2026-10-01", createdAt: now },
  ];
  for (const kind of ["mes", "4"]) {
    const period = selectClinicalPeriod(records, kind, now);
    assert.deepEqual(period.selected.map(r => r.fecha), ["2026-09-10"]);
    assert.equal(period.clinicalRecordsUsedCount, 1);
    assert.equal(period.clinicalRecordsTotalCount, 5);
  }
  assert.equal(selectClinicalPeriod(records.slice(1), "4", now).periodFrom, null);
  assert.throws(() => selectClinicalPeriod(records, "12months", now), /Período inválido/);
});