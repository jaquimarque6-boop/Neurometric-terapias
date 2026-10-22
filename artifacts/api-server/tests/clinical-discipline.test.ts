import assert from "node:assert/strict";
import { test } from "node:test";
import {
  hasSpecialtySpecificContent,
  normalizeClinicalSpecialty,
  resolveClinicalSpecialty,
} from "@workspace/clinical-specialty";

test("recognizes the four core specialties and existing psychology labels", () => {
  assert.equal(normalizeClinicalSpecialty("Fonoaudiología"), "fonoaudiologia");
  assert.equal(normalizeClinicalSpecialty("Psicopedagogía"), "psicopedagogia");
  assert.equal(normalizeClinicalSpecialty("Terapia Ocupacional"), "terapia_ocupacional");
  assert.equal(normalizeClinicalSpecialty("Psicología"), "psicologia");
  assert.equal(normalizeClinicalSpecialty("Psicología Infantil"), "psicologia");
  assert.equal(normalizeClinicalSpecialty("Neuropsicología"), "psicologia");
  assert.equal(normalizeClinicalSpecialty("Logopedia"), "fonoaudiologia");
});

test("unknown and missing specialties resolve to general rather than Fonoaudiología", () => {
  assert.equal(normalizeClinicalSpecialty("Otra especialidad"), "general");
  assert.equal(normalizeClinicalSpecialty(undefined), "general");
  assert.equal(normalizeClinicalSpecialty(""), "general");
});

test("an explicit professional specialty takes precedence over patient assignments", () => {
  assert.equal(
    resolveClinicalSpecialty("Neuropsicología", ["Fonoaudiología"]),
    "psicologia",
  );
  assert.equal(
    resolveClinicalSpecialty("Terapia Ocupacional", ["Psicopedagogía"]),
    "terapia_ocupacional",
  );
});

test("assignment fallback is used only when it identifies one specialty", () => {
  assert.equal(resolveClinicalSpecialty(null, ["Psicopedagogía"]), "psicopedagogia");
  assert.equal(
    resolveClinicalSpecialty(null, ["Fonoaudiología", "Psicopedagogía"]),
    "general",
  );
  assert.equal(
    resolveClinicalSpecialty("Especialidad no reconocida", ["Fonoaudiología"]),
    "general",
  );
});

test("only specialties with configured content use specialty-specific guidance", () => {
  for (const specialty of [
    "fonoaudiologia",
    "psicopedagogia",
    "terapia_ocupacional",
  ] as const) {
    assert.equal(hasSpecialtySpecificContent(specialty), true);
  }
  assert.equal(hasSpecialtySpecificContent("psicologia"), false);
  assert.equal(hasSpecialtySpecificContent("general"), false);
});