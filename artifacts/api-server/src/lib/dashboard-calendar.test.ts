import assert from "node:assert/strict";
import test from "node:test";
import { getDashboardCalendarRanges } from "./dashboard-calendar";

test("uses the Monday-to-Monday calendar week and Buenos Aires calendar month", () => {
  const range = getDashboardCalendarRanges(new Date("2026-10-22T15:00:00.000Z"));

  assert.equal(range.weekStart, "2026-10-19");
  assert.equal(range.nextWeekStart, "2026-10-26");
  assert.equal(range.monthStart, "2026-10-01");
  assert.equal(range.nextMonthStart, "2026-11-01");
  assert.equal(range.monthStartAt.toISOString(), "2026-10-01T03:00:00.000Z");
  assert.equal(range.nextMonthStartAt.toISOString(), "2026-11-01T03:00:00.000Z");
});

test("keeps week and month boundaries aligned to Buenos Aires around UTC midnight", () => {
  const beforeLocalMidnight = getDashboardCalendarRanges(new Date("2026-11-01T02:59:59.999Z"));
  assert.equal(beforeLocalMidnight.monthStart, "2026-10-01");
  assert.equal(beforeLocalMidnight.weekStart, "2026-10-26");
  assert.equal(beforeLocalMidnight.nextWeekStart, "2026-11-02");

  const atLocalMidnight = getDashboardCalendarRanges(new Date("2026-11-01T03:00:00.000Z"));
  assert.equal(atLocalMidnight.monthStart, "2026-11-01");
  assert.equal(atLocalMidnight.weekStart, "2026-10-26");
  assert.equal(atLocalMidnight.nextWeekStart, "2026-11-02");
});

test("the clinical date range includes both calendar-week endpoints and excludes next Monday", () => {
  const { weekStart, nextWeekStart } = getDashboardCalendarRanges(
    new Date("2026-10-22T15:00:00.000Z"),
  );
  const fixtureDates = [
    "2026-10-18",
    "2026-10-19",
    "2026-10-25",
    "2026-10-26",
  ];
  const inWeek = fixtureDates.filter(date => date >= weekStart && date < nextWeekStart);

  assert.deepEqual(inWeek, ["2026-10-19", "2026-10-25"]);
});
