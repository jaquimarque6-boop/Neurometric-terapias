import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAX_REPORT_CONTEXT_CHARS,
  buildSessionContext,
  documentedAreaSources,
  normalizeReportAreas,
  reportContextLength,
  reportContextWithinBudget,
} from "../src/routes/report-context";

test("clinical areas can come from anamnesis without goals, and include goal areas when present", () => {
  const anamnesis = { lenguajeComunicacion: "Usa frases breves.", atencionConducta: "Atención variable." };
  assert.deepEqual(documentedAreaSources(anamnesis, []), ["Lenguaje y comunicación", "Atención y conducta"]);
  assert.deepEqual(documentedAreaSources(anamnesis, ["Lectoescritura"]), [
    "Lenguaje y comunicación", "Atención y conducta", "Lectoescritura",
  ]);
});

test("dynamic area output is normalized to a string map without rejecting unknown area names", () => {
  assert.deepEqual(normalizeReportAreas({
    "  Comunicación  ": "Se registró trabajo en turnos.",
    "Motricidad": 12,
    "": "No debe crearse un área sin nombre.",
  }), { "Comunicación": "Se registró trabajo en turnos." });
});

test("includes multiple sessions, outcomes as written, and material names without photos", () => {
  const context = buildSessionContext([
    {
      fecha: "2026-04-10",
      resumenSesion: "Se trabajó con secuencias visuales.",
      observaciones: "Sostuvo la atención con dos apoyos verbales.",
      materialesActividades: [{ nombre: "Tarjetas de secuencias" }],
    },
    {
      fecha: "2026-04-17",
      resumenSesion: "Se repitió la actividad.",
      materialesActividades: [{ nombre: "Láminas" }, { nombre: "Juego de turnos" }],
    },
  ]);
  assert.match(context, /Sesión 1/);
  assert.match(context, /Sesión 2/);
  assert.match(context, /dos apoyos verbales/);
  assert.match(context, /Tarjetas de secuencias/);
  assert.match(context, /Juego de turnos/);
  assert.doesNotMatch(context, /fotos|storagePath|originalName/i);
});

test("incomplete records retain available facts and do not stringify missing values", () => {
  const context = buildSessionContext([
    { fecha: "2026-02-30", resumenSesion: "Se registró una actividad." },
    { fecha: "2026-04-17", observaciones: "Sin descripción de la actividad." },
  ]);
  assert.match(context, /fecha no válida\/no registrada/);
  assert.match(context, /Se registró una actividad/);
  assert.match(context, /Sin descripción de la actividad/);
  assert.doesNotMatch(context, /undefined|null/);
});

test("long histories are measured as a whole and exceed the explicit context budget", () => {
  const sessions = Array.from({ length: 120 }, (_, i) => ({
    fecha: "2026-04-17",
    resumenSesion: `Sesión ${i}: ${"evidencia clínica documentada ".repeat(20)}`,
  }));
  const prompt = buildSessionContext(sessions);
  const size = reportContextLength("system", prompt);
  assert.ok(size > MAX_REPORT_CONTEXT_CHARS);
  assert.equal(reportContextWithinBudget("system", prompt), false);
  assert.equal((prompt.match(/\[Sesión /g) ?? []).length, 120);
});

test("brief contexts remain within budget", () => {
  const prompt = buildSessionContext([{ fecha: "2026-04-17", resumenSesion: "Actividad registrada." }]);
  assert.equal(reportContextWithinBudget("system", prompt), true);
});
