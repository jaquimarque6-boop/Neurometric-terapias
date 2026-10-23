export const HOUR_PX = 72;
export const START_HOUR = 7;
export const END_HOUR = 21;
export const TOTAL_HOURS = END_HOUR - START_HOUR;
export const GRID_HEIGHT = TOTAL_HOURS * HOUR_PX;

// This list is constant for every render of the weekly grid.
export const HOURS_LABELS = Array.from(
  { length: TOTAL_HOURS },
  (_, index) => START_HOUR + index,
);

export function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

export function topPx(start: string): number {
  return ((timeToMinutes(start) - START_HOUR * 60) / 60) * HOUR_PX;
}

export function heightPx(start: string, end: string): number {
  const durationMinutes = timeToMinutes(end) - timeToMinutes(start);
  // Keep height strictly proportional to duration; do not apply a visual
  // minimum that would make short appointments look longer than they are.
  return Math.max(0, (durationMinutes / 60) * HOUR_PX);
}

export function hourAtGridY(y: number): number {
  return Math.floor(Math.max(0, y) / HOUR_PX) + START_HOUR;
}
