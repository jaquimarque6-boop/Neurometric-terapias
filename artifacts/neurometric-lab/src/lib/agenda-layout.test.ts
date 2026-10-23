import assert from "node:assert/strict";
import { test } from "node:test";
import { heightPx, hourAtGridY, topPx } from "./agenda-layout.ts";

test("weekly appointment heights stay proportional for 30, 45, and 60 minutes", () => {
  const thirtyMinutes = heightPx("09:00", "09:30");
  const fortyFiveMinutes = heightPx("10:15", "11:00");
  const sixtyMinutes = heightPx("11:30", "12:30");

  assert.deepEqual([thirtyMinutes, fortyFiveMinutes, sixtyMinutes], [36, 54, 72]);
  assert.equal(fortyFiveMinutes / thirtyMinutes, 1.5);
  assert.equal(sixtyMinutes / thirtyMinutes, 2);
});

test("appointment positions and click-to-create hours use the same scale", () => {
  assert.equal(topPx("07:00"), 0);
  assert.equal(topPx("09:30"), 180);
  assert.equal(hourAtGridY(0), 7);
  assert.equal(hourAtGridY(72), 8);
  assert.equal(hourAtGridY(180), 9);
});
