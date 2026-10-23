import assert from "node:assert/strict";
import test from "node:test";
import { calculateAutoGrowTextareaLayout } from "./auto-grow-textarea";

const defaultMetrics = {
  lineHeight: 20,
  paddingTop: 8,
  paddingBottom: 8,
  borderTopWidth: 1,
  borderBottomWidth: 1,
  minRows: 7,
  maxRows: 16,
};

test("auto-growing notes start at seven lines even when empty", () => {
  const layout = calculateAutoGrowTextareaLayout({
    ...defaultMetrics,
    scrollHeight: 36,
  });

  assert.equal(layout.height, 158);
  assert.equal(layout.overflowY, "hidden");
});

test("auto-growing notes expand to fit content below the maximum", () => {
  const layout = calculateAutoGrowTextareaLayout({
    ...defaultMetrics,
    scrollHeight: 240,
  });

  assert.equal(layout.height, 242);
  assert.equal(layout.overflowY, "hidden");
});

test("long notes keep their full value and scroll inside the textarea at its maximum height", () => {
  const layout = calculateAutoGrowTextareaLayout({
    ...defaultMetrics,
    scrollHeight: 900,
  });

  assert.equal(layout.height, 338);
  assert.equal(layout.overflowY, "auto");
});
