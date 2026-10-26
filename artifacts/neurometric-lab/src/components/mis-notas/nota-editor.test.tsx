import React from "react";
import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { NotaEditor } from "./nota-editor";

const noSave = async () => {};

test("la edición permite fecha opcional y mantiene estructura adaptable", () => {
  const markup = renderToStaticMarkup(React.createElement(NotaEditor, { onSave: noSave }));
  assert.match(markup, /type="date"/);
  assert.match(markup, /Recordatorio/);
  assert.match(markup, /sm:flex-row/);
  assert.match(markup, /w-full sm:w-48/);
});

test("la creación rápida solo pide texto, sin fecha obligatoria", () => {
  const markup = renderToStaticMarkup(React.createElement(NotaEditor, { compact: true, onSave: noSave }));
  assert.match(markup, /Anotá una idea o tarea/);
  assert.doesNotMatch(markup, /type="date"/);
  assert.match(markup, /button-save-quick-note/);
});
