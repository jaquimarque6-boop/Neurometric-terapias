import assert from "node:assert/strict";
import { test } from "node:test";
import { manuscriptImageValidationError } from "./manuscript-image-validation.ts";

test("accepts the image formats supported by manuscript transcription", () => {
  for (const type of ["image/jpeg", "image/png", "image/webp"]) {
    assert.equal(manuscriptImageValidationError({ type, size: 1024 }), null);
  }
});

test("rejects unsupported, empty, and oversized images", () => {
  assert.match(
    manuscriptImageValidationError({ type: "image/heic", size: 1024 }) ?? "",
    /JPG, PNG o WebP/,
  );
  assert.match(
    manuscriptImageValidationError({ type: "image/jpeg", size: 0 }) ?? "",
    /vacío/,
  );
  assert.match(
    manuscriptImageValidationError({ type: "image/jpeg", size: 12 * 1024 * 1024 + 1 }) ?? "",
    /12 MB/,
  );
});