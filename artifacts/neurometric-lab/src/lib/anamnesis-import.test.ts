import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildAnamnesisImportDraft,
  normalizeAnamnesisImportValues,
} from "./anamnesis-import.ts";

test("preserves existing anamnesis and appends a proposal for review", () => {
  const draft = buildAnamnesisImportDraft(
    { motivoConsulta: "Motivo ya registrado", antecedentes: "" },
    { motivoConsulta: "Nuevo motivo", antecedentes: "Antecedente transcripto" },
  );
  assert.equal(draft.motivoConsulta, "Motivo ya registrado\n\nNuevo motivo");
  assert.equal(draft.antecedentes, "Antecedente transcripto");
});

test("does not duplicate identical text or clear fields without a proposal", () => {
  const draft = buildAnamnesisImportDraft(
    { motivoConsulta: "Texto actual", antecedentes: "Historia actual" },
    { motivoConsulta: " Texto actual ", antecedentes: "" },
  );
  assert.equal(draft.motivoConsulta, "Texto actual");
  assert.equal(draft.antecedentes, "Historia actual");
});

test("normalizes only the existing anamnesis fields to editable strings", () => {
  const values = normalizeAnamnesisImportValues({
    motivoConsulta: "Consulta",
    campoInventado: "No debe pasar",
    observaciones: null,
  });
  assert.equal(values.motivoConsulta, "Consulta");
  assert.equal(values.observaciones, "");
  assert.equal("campoInventado" in values, false);
  assert.equal(Object.keys(values).length, 12);
});