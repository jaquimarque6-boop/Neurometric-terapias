import assert from "node:assert/strict";
import { test } from "node:test";
import { renderReportPrintHtml } from "./report-print";

test("clinical print omits empty areas and sections without changing editor content", () => {
  const html = renderReportPrintHtml({
    kind: "clinical",
    patientName: "Paciente",
    reportDate: "28 de octubre de 2026",
    printedDate: "28 de octubre de 2026",
    resumen: "Observación general conservada.",
    conducta: "",
    areas: { Cognición: "  ", Comunicación: "Trabajo documentado." },
    sugerencias: "No registrado",
  });

  assert.match(html, /Observación general conservada/);
  assert.match(html, /Comunicación/);
  assert.match(html, /Trabajo documentado/);
  assert.doesNotMatch(html, /Conducta en sesiones|Sugerencias para la familia|Cognición|No registrado|Sin contenido/);
  assert.doesNotMatch(html, /sesiones del período|cantidad de sesiones|registros clínicos utilizados/i);
});

test("family print omits empty sections and session totals", () => {
  const html = renderReportPrintHtml({
    kind: "family",
    patientName: "Paciente",
    reportDate: "28 de octubre de 2026",
    printedDate: "28 de octubre de 2026",
    achievedGoals: [],
    workingGoals: ["Objetivo vigente"],
    familyMessage: "",
  });

  assert.match(html, /Objetivo vigente/);
  assert.doesNotMatch(html, /Lo que logró|Mensaje y sugerencias|sesiones del período|No determinado/i);
});

test("print content escapes user text and never includes editor instructions", () => {
  const html = renderReportPrintHtml({
    kind: "clinical",
    patientName: "Paciente <script>alert(1)</script>",
    reportDate: "Hoy",
    printedDate: "Hoy",
    resumen: "Áreas documentadas por la IA o agregadas manualmente.",
    conducta: "",
    areas: {},
    sugerencias: "",
  });

  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>|Podés editar, renombrar o quitar cada una/);
  assert.doesNotMatch(html, /Conducta en sesiones|Desarrollo por área|Sugerencias para la familia/);
});
