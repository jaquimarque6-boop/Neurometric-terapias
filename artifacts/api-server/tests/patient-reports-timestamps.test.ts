import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { patientReportsTable } from "@workspace/db/schema";

test("report timestamps use millisecond precision in migration and Drizzle for optimistic edits", () => {
  assert.equal(patientReportsTable.createdAt.getSQLType(), "timestamp (3) with time zone");
  assert.equal(patientReportsTable.updatedAt.getSQLType(), "timestamp (3) with time zone");
  const migration = readFileSync(new URL("../../../scripts/phase1-patient-reports.sql", import.meta.url), "utf8");
  assert.match(migration, /created_at timestamptz\(3\) NOT NULL DEFAULT now\(\)/);
  assert.match(migration, /updated_at timestamptz\(3\) NOT NULL DEFAULT now\(\)/);
  assert.match(migration, /clinical_records_used_count <= clinical_records_total_count/);
});