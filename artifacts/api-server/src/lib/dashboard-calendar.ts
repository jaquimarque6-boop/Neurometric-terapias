export const DASHBOARD_TIME_ZONE = "America/Argentina/Buenos_Aires";

export type DashboardCalendarRanges = {
  weekStart: string;
  nextWeekStart: string;
  monthStart: string;
  nextMonthStart: string;
  monthStartAt: Date;
  nextMonthStartAt: Date;
};

const zonedDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: DASHBOARD_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function getZonedParts(date: Date) {
  const parts = zonedDateTimeFormatter.formatToParts(date);
  const value = (type: string) => Number(parts.find(part => part.type === type)!.value);
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

function dateString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addCalendarDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function localMidnightAsUtc(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const targetWallTime = Date.UTC(year, month - 1, day);
  let instant = targetWallTime;

  // Resolve the Buenos Aires wall-clock midnight to its UTC instant.
  // Iterating also handles time-zone offset changes without assuming UTC-3.
  for (let attempt = 0; attempt < 4; attempt++) {
    const zoned = getZonedParts(new Date(instant));
    const zonedAsUtc = Date.UTC(
      zoned.year,
      zoned.month - 1,
      zoned.day,
      zoned.hour,
      zoned.minute,
      zoned.second,
    );
    const nextInstant = targetWallTime - (zonedAsUtc - instant);
    if (nextInstant === instant) break;
    instant = nextInstant;
  }

  return new Date(instant);
}

export function getDashboardCalendarRanges(now = new Date()): DashboardCalendarRanges {
  const { year, month, day } = getZonedParts(now);
  const today = dateString(year, month, day);
  const weekday = new Date(`${today}T00:00:00.000Z`).getUTCDay();
  const daysSinceMonday = (weekday + 6) % 7;
  const weekStart = addCalendarDays(today, -daysSinceMonday);
  const nextWeekStart = addCalendarDays(weekStart, 7);
  const monthStart = dateString(year, month, 1);
  const nextMonthDate = new Date(Date.UTC(year, month, 1));
  const nextMonthStart = dateString(
    nextMonthDate.getUTCFullYear(),
    nextMonthDate.getUTCMonth() + 1,
    nextMonthDate.getUTCDate(),
  );

  return {
    weekStart,
    nextWeekStart,
    monthStart,
    nextMonthStart,
    monthStartAt: localMidnightAsUtc(monthStart),
    nextMonthStartAt: localMidnightAsUtc(nextMonthStart),
  };
}
