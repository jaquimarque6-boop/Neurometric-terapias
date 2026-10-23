import assert from "node:assert/strict";
import { test } from "node:test";
import {
  agendaViewStorageKey,
  COMPACT_HOUR_PX,
  gridHeightFor,
  heightPx,
  hourAtGridY,
  readAgendaViewPreference,
  topPx,
  writeAgendaViewPreference,
} from "./agenda-layout.ts";

test("30, 45, and 60 minute appointments stay proportional in both views", () => {
  const thirtyMinutes = heightPx("09:00", "09:30");
  const fortyFiveMinutes = heightPx("10:15", "11:00");
  const sixtyMinutes = heightPx("11:30", "12:30");

  assert.deepEqual([thirtyMinutes, fortyFiveMinutes, sixtyMinutes], [36, 54, 72]);
  assert.equal(fortyFiveMinutes / thirtyMinutes, 1.5);
  assert.equal(sixtyMinutes / thirtyMinutes, 2);

  assert.deepEqual([
    heightPx("09:00", "09:30", COMPACT_HOUR_PX),
    heightPx("10:15", "11:00", COMPACT_HOUR_PX),
    heightPx("11:30", "12:30", COMPACT_HOUR_PX),
  ], [16, 24, 32]);
});

test("appointment positions and click-to-create hours use each view's scale", () => {
  assert.equal(topPx("07:00"), 0);
  assert.equal(topPx("09:30"), 180);
  assert.equal(hourAtGridY(0), 7);
  assert.equal(hourAtGridY(72), 8);
  assert.equal(hourAtGridY(180), 9);

  assert.equal(topPx("09:30", COMPACT_HOUR_PX), 80);
  assert.equal(hourAtGridY(32, COMPACT_HOUR_PX), 8);
  assert.equal(hourAtGridY(80, COMPACT_HOUR_PX), 9);
  assert.equal(gridHeightFor(COMPACT_HOUR_PX), 448);
  assert.equal(gridHeightFor(72), 1008);
});

test("agenda view preference is persisted separately for each account", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };

  assert.equal(agendaViewStorageKey(12), "neurometric:agenda-view:v1:12");
  assert.equal(readAgendaViewPreference(12, storage), "expanded");

  writeAgendaViewPreference(12, "compact", storage);
  writeAgendaViewPreference(24, "expanded", storage);

  assert.equal(readAgendaViewPreference(12, storage), "compact");
  assert.equal(readAgendaViewPreference(24, storage), "expanded");
  assert.equal(readAgendaViewPreference(null, storage), "expanded");
});

test("invalid preferences and unavailable browser storage fall back safely", () => {
  const invalidStorage = {
    getItem: () => "other",
    setItem: () => {},
  };
  const throwingStorage = {
    getItem: () => { throw new Error("storage disabled"); },
    setItem: () => { throw new Error("storage disabled"); },
  };

  assert.equal(readAgendaViewPreference(12, invalidStorage), "expanded");
  assert.equal(readAgendaViewPreference(12, throwingStorage), "expanded");
  assert.doesNotThrow(() => writeAgendaViewPreference(12, "compact", throwingStorage));
});
