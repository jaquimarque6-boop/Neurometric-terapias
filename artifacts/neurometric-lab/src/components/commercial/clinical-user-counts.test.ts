import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ClinicalUserCounts } from "./clinical-user-counts";

test("renders real zero counts distinctly from unavailable metrics", () => {
  const zeroMarkup = renderToStaticMarkup(
    React.createElement(ClinicalUserCounts, {
      userId: 10,
      role: "professional",
      patientCount: 0,
      clinicalSessionCount: 0,
    }),
  );
  assert.match(zeroMarkup, /Pacientes:/);
  assert.match(zeroMarkup, /Sesiones:/);
  assert.match(zeroMarkup, />0<\/span>/);
  assert.doesNotMatch(zeroMarkup, />N\/D<\/span>/);

  const unavailableMarkup = renderToStaticMarkup(
    React.createElement(ClinicalUserCounts, {
      userId: 11,
      role: "professional",
      patientCount: null,
      clinicalSessionCount: null,
    }),
  );
  assert.equal((unavailableMarkup.match(/>N\/D<\/span>/g) ?? []).length, 2);
  assert.match(unavailableMarkup, /No disponible: no se pudo calcular de forma confiable/);
});

test("does not show clinical counts for administrative accounts", () => {
  const markup = renderToStaticMarkup(
    React.createElement(ClinicalUserCounts, {
      userId: 1,
      role: "admin",
      patientCount: null,
      clinicalSessionCount: null,
    }),
  );
  assert.equal(markup, "");
});
