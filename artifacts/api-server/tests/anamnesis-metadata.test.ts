import assert from "node:assert/strict";
import { test } from "node:test";
import { anamnesisMetadata } from "../src/routes/anamnesis-metadata";

test("saving anamnesis, including explicitly clearing a field, stamps user and time", () => {
  const now = new Date("2026-09-29T12:30:00Z");
  assert.deepEqual(anamnesisMetadata({ antecedentes: null }, 9, now),
    { anamnesisUpdatedAt: now, anamnesisUpdatedByUserId: 9 });
});
test("unrelated patient and legacy report edits do not falsely stamp anamnesis", () => {
  assert.deepEqual(anamnesisMetadata({ name: "Nuevo nombre", informeEvolucion: "antiguo" }, 9), {});
});