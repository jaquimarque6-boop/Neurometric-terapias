export const COMPACT_HOUR_PX = 32;
export const HOUR_PX = 72;
export const START_HOUR = 7;
export const END_HOUR = 21;
export const TOTAL_HOURS = END_HOUR - START_HOUR;
export const GRID_HEIGHT = TOTAL_HOURS * HOUR_PX;

export type AgendaViewMode = "compact" | "expanded";
type AgendaViewStorage = Pick<Storage, "getItem" | "setItem">;

const AGENDA_VIEW_STORAGE_PREFIX = "neurometric:agenda-view:v1";

export function hourPxForView(view: AgendaViewMode): number {
  return view === "compact" ? COMPACT_HOUR_PX : HOUR_PX;
}

export function gridHeightFor(hourPx: number): number {
  return TOTAL_HOURS * hourPx;
}

export function agendaViewStorageKey(userId: number | null | undefined): string | null {
  return userId == null ? null : `${AGENDA_VIEW_STORAGE_PREFIX}:${userId}`;
}

function getBrowserStorage(): AgendaViewStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readAgendaViewPreference(
  userId: number | null | undefined,
  storage: AgendaViewStorage | null = getBrowserStorage(),
): AgendaViewMode {
  const key = agendaViewStorageKey(userId);
  if (!key || !storage) return "expanded";

  try {
    const saved = storage.getItem(key);
    return saved === "compact" || saved === "expanded" ? saved : "expanded";
  } catch {
    return "expanded";
  }
}

export function writeAgendaViewPreference(
  userId: number | null | undefined,
  view: AgendaViewMode,
  storage: AgendaViewStorage | null = getBrowserStorage(),
): void {
  const key = agendaViewStorageKey(userId);
  if (!key || !storage) return;

  try {
    storage.setItem(key, view);
  } catch {
    // Keep the current in-memory selection when browser storage is unavailable.
  }
}

// This list is constant for every render of the weekly grid.
export const HOURS_LABELS = Array.from(
  { length: TOTAL_HOURS },
  (_, index) => START_HOUR + index,
);

export function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

export function topPx(start: string, hourPx = HOUR_PX): number {
  return ((timeToMinutes(start) - START_HOUR * 60) / 60) * hourPx;
}

export function heightPx(start: string, end: string, hourPx = HOUR_PX): number {
  const durationMinutes = timeToMinutes(end) - timeToMinutes(start);
  // Keep height strictly proportional to duration; do not apply a visual
  // minimum that would make short appointments look longer than they are.
  return Math.max(0, (durationMinutes / 60) * hourPx);
}

export function hourAtGridY(y: number, hourPx = HOUR_PX): number {
  return Math.floor(Math.max(0, y) / hourPx) + START_HOUR;
}
