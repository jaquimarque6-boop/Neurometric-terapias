type PreviewMode = "current" | "improved";

type Appointment = {
  id: number;
  day: number;
  start: string;
  end: string;
  patient: string;
  status: "pending" | "attended" | "rescheduled";
};

const START_HOUR = 7;
const END_HOUR = 21;
const WEEK_START = new Date(2026, 9, 19, 12);
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const APPOINTMENTS: Appointment[] = [
  { id: 1, day: 0, start: "09:00", end: "09:30", patient: "Sofía Fernández", status: "pending" },
  { id: 2, day: 0, start: "10:15", end: "11:00", patient: "Mariano López", status: "attended" },
  { id: 3, day: 0, start: "11:30", end: "12:30", patient: "Camila de la Cruz", status: "pending" },
  { id: 4, day: 1, start: "15:00", end: "15:30", patient: "Tomás Benítez", status: "rescheduled" },
  { id: 5, day: 3, start: "14:00", end: "14:45", patient: "Valentina Ríos", status: "pending" },
  { id: 6, day: 4, start: "10:00", end: "11:00", patient: "Lucía Martínez", status: "attended" },
];

const STATUS_CLASSES = {
  pending: "border-stone-300 bg-stone-50 text-stone-700",
  attended: "border-emerald-400 bg-emerald-50 text-emerald-800",
  rescheduled: "border-amber-400 bg-amber-50 text-amber-800",
};

function minutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function timeLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function dateForDay(index: number) {
  const date = new Date(WEEK_START);
  date.setDate(date.getDate() + index);
  return date;
}

export function WeeklyCalendarPreview({ mode }: { mode: PreviewMode }) {
  const isImproved = mode === "improved";
  const pixelsPerHour = isImproved ? 72 : 32;
  const minEventHeight = isImproved ? 0 : 24;
  const gridHeight = (END_HOUR - START_HOUR) * pixelsPerHour + (isImproved ? 0 : 16);
  const hourLabels = Array.from({ length: END_HOUR - START_HOUR }, (_, index) => START_HOUR + index);
  const minWeekWidth = isImproved ? 980 : 700;

  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      <div className="flex h-dvh min-h-[620px] min-w-0 flex-col overflow-hidden">
        <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border/70 bg-card px-4 py-3 shadow-sm">
          <div className="min-w-[110px]">
            <h1 className="font-display text-lg font-bold">Agenda</h1>
            <p className="text-xs capitalize text-muted-foreground">19–25 de octubre de 2026</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Semana anterior">‹</button>
            <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium">Esta semana</button>
            <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Semana siguiente">›</button>
          </div>
          <button className="hidden rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground sm:block">+ Nueva cita</button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
          <div style={{ minWidth: minWeekWidth }}>
            <div className="sticky top-0 z-20 flex border-b border-border/70 bg-card/95 shadow-sm backdrop-blur">
              <div className={`shrink-0 ${isImproved ? "w-16" : "w-14"}`} />
              {WEEKDAYS.map((weekday, index) => (
                <div key={weekday} className="flex flex-1 flex-col items-center border-l border-border/50 py-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{weekday}</span>
                  <span className="mt-1 text-lg font-bold leading-none">{dateForDay(index).getDate()}</span>
                </div>
              ))}
            </div>

            <div className="flex">
              <div className={`relative shrink-0 ${isImproved ? "w-16" : "w-14"}`} style={{ height: gridHeight }}>
                {hourLabels.map(hour => (
                  <span
                    key={hour}
                    className={`absolute right-2 font-medium leading-none text-muted-foreground ${
                      isImproved && hour === START_HOUR ? "translate-y-0" : "-translate-y-1/2"
                    } ${isImproved ? "text-xs" : "text-[10px]"}`}
                    style={{ top: isImproved && hour === START_HOUR ? 6 : (hour - START_HOUR) * pixelsPerHour }}
                  >
                    {timeLabel(hour)}
                  </span>
                ))}
              </div>

              {WEEKDAYS.map((weekday, dayIndex) => (
                <div
                  key={weekday}
                  className="relative flex-1 border-l border-border/50"
                  style={{ height: gridHeight }}
                >
                  {hourLabels.map(hour => (
                    <div key={hour}>
                      <div className="absolute left-0 right-0 border-t border-border/70" style={{ top: (hour - START_HOUR) * pixelsPerHour }} />
                      <div className="absolute left-0 right-0 border-t border-dashed border-border/60" style={{ top: (hour - START_HOUR) * pixelsPerHour + pixelsPerHour / 2 }} />
                    </div>
                  ))}
                  {isImproved && <div className="absolute inset-x-0 border-t border-border/70" style={{ top: gridHeight }} />}

                  {APPOINTMENTS.filter(appointment => appointment.day === dayIndex).map(appointment => {
                    const rawDuration = ((minutes(appointment.end) - minutes(appointment.start)) / 60) * pixelsPerHour;
                    const height = Math.max(rawDuration, minEventHeight);
                    const top = ((minutes(appointment.start) - START_HOUR * 60) / 60) * pixelsPerHour;
                    return (
                      <div
                        key={appointment.id}
                        className={`absolute overflow-hidden text-left ${STATUS_CLASSES[appointment.status]} ${
                          isImproved
                            ? "left-1 right-1 rounded-md border-l-4 px-2 py-0.5 shadow-sm"
                            : "left-0.5 right-0.5 rounded-sm border-l-2 px-1 py-0.5"
                        }`}
                        style={{
                          top: isImproved ? top : top + 1,
                          height: isImproved ? height : height - 2,
                        }}
                      >
                        <div className="flex h-full min-w-0 flex-col justify-start gap-0.5">
                          <span className={`truncate font-semibold ${isImproved ? "text-xs leading-4" : "text-[10px] leading-tight"}`}>
                            {appointment.patient}
                          </span>
                          {isImproved ? (
                            <span className="whitespace-nowrap text-[11px] leading-3 opacity-75">
                              {appointment.start}–{appointment.end}
                            </span>
                          ) : (
                            height > 24 && <span className="text-[9px] leading-none opacity-60">{appointment.start}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
