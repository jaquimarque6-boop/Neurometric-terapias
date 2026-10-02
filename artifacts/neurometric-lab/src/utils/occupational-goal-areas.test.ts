import assert from "node:assert/strict";
import { test } from "node:test";
import { AREA_PREFIXES, AREA_SUBAREAS } from "./goal-code-generator";
import { BANCO_AREAS_TO, getBancoAreas } from "./profession-map";

const requiredOccupationalAreas = [
  "actividades de la vida diaria y autonomía",
  "rutinas y hábitos",
  "procesamiento y regulación sensorial",
  "motricidad fina y destreza manual",
  "motricidad gruesa",
  "coordinación visomotora",
  "grafomotricidad",
  "juego",
  "participación social",
  "participación escolar",
  "planificación y organización motora",
  "entorno y participación",
];

test("the occupational session bank includes all requested areas", () => {
  const areas = getBancoAreas("ocupacional");
  for (const area of requiredOccupationalAreas) {
    assert.ok(areas.includes(area), `${area} should be available to OT`);
  }
  assert.equal(areas, BANCO_AREAS_TO);
});

test("each occupational area has a code prefix and subarea choices", () => {
  for (const area of requiredOccupationalAreas) {
    assert.ok(AREA_PREFIXES[area], `${area} should have a stable code prefix`);
    assert.ok(AREA_SUBAREAS[area]?.length, `${area} should have subarea choices`);
  }
});

test("legacy and shared occupational filters remain available", () => {
  const areas = getBancoAreas("ocupacional");
  for (const area of [
    "integración sensorial",
    "motricidad fina",
    "motricidad gruesa",
    "coordinación visomotora",
    "actividades de la vida diaria",
    "grafomotricidad",
    "autorregulación",
    "praxias",
    "cognición",
    "estimulación temprana",
  ]) {
    assert.ok(areas.includes(area), `${area} should remain available`);
  }
});