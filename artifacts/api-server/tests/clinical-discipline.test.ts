import assert from "node:assert/strict";
import { test } from "node:test";
import { detectClinicalDiscipline } from "../src/lib/clinical-discipline";

const occupationalAreas = [
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

test("recognizes every new occupational-therapy goal area", () => {
  for (const area of occupationalAreas) {
    assert.equal(
      detectClinicalDiscipline("", [area]),
      "terapia_ocupacional",
      `${area} should select the occupational-therapy branch`,
    );
  }
});

test("an explicit specialty takes precedence over overlapping goal areas", () => {
  assert.equal(
    detectClinicalDiscipline("Terapia Ocupacional", ["lectoescritura"]),
    "terapia_ocupacional",
  );
  assert.equal(
    detectClinicalDiscipline("Fonoaudiología", ["juego"]),
    "fonoaudiología",
  );
  assert.equal(
    detectClinicalDiscipline("Psicopedagogía", ["rutinas y hábitos"]),
    "psicopedagogía",
  );
});

test("keeps existing shared-area inference intact", () => {
  assert.equal(detectClinicalDiscipline("", ["cognición"]), "psicopedagogía");
  assert.equal(detectClinicalDiscipline("", ["lenguaje"]), "fonoaudiología");
});