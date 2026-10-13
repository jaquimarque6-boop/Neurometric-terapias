import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addReportArea,
  removeReportArea,
  renameReportArea,
  visibleReportAreas,
} from "./report-areas";

test("adding an area preserves existing text and avoids names already used or removed", () => {
  const result = addReportArea(
    { Comunicación: "Texto clínico existente." },
    ["Nueva área"],
    ["Motricidad", "Nueva área 2"],
  );
  assert.equal(result.name, "Nueva área 3");
  assert.deepEqual(result.areaTexts, {
    Comunicación: "Texto clínico existente.",
    "Nueva área 3": "",
  });
  assert.deepEqual(result.removedAreaNames, ["Nueva área"]);
});

test("renaming to a previously removed goal area preserves its text and unhides the destination", () => {
  const result = renameReportArea(
    { Comunicación: "Conserva este texto." },
    ["Área archivada", "Motricidad"],
    "Comunicación",
    "Motricidad",
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.areaTexts, {
    Motricidad: "Conserva este texto.",
  });
  assert.deepEqual(result.removedAreaNames, ["Área archivada"]);
  assert.deepEqual(visibleReportAreas(["Área archivada", "Motricidad"], result.areaTexts, result.removedAreaNames), ["Motricidad"]);
});

test("renaming rejects blank or duplicate names without changing any content", () => {
  const texts = { Comunicación: "Uno", Motricidad: "Dos" };
  const removed = ["Área archivada"];
  assert.deepEqual(renameReportArea(texts, removed, "Comunicación", "  "), {
    ok: false, reason: "empty",
  });
  assert.deepEqual(renameReportArea(texts, removed, "Comunicación", "Motricidad"), {
    ok: false, reason: "duplicate",
  });
  assert.deepEqual(texts, { Comunicación: "Uno", Motricidad: "Dos" });
  assert.deepEqual(removed, ["Área archivada"]);
});

test("removing an area hides only that area and preserves all other content", () => {
  const result = removeReportArea(
    { Comunicación: "Texto A.", Motricidad: "Texto B." },
    ["Área archivada"],
    "Comunicación",
  );
  assert.deepEqual(result.areaTexts, { Motricidad: "Texto B." });
  assert.deepEqual(result.removedAreaNames, ["Área archivada", "Comunicación"]);
  assert.deepEqual(visibleReportAreas(["Comunicación", "Motricidad"], result.areaTexts, result.removedAreaNames), ["Motricidad"]);
});

test("dynamic editor areas remain visible without goal areas", () => {
  assert.deepEqual(
    visibleReportAreas([], { "Lenguaje y comunicación": "Texto generado." }, []),
    ["Lenguaje y comunicación"],
  );
});
