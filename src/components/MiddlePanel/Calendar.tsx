import { useMemo, useState } from "react";

export function CalendarPanel() {
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState<string>(() => today.toISOString().slice(0, 10));

  const eventsByDate = useMemo<Record<string, { time: string; title: string; location?: string }[]>>(
    () => ({
       [new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString().slice(0, 10)]: [
        { time: "11:00", title: "Client Sync", location: "Meet" },
      ],
      [new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3).toISOString().slice(0, 10)]: [
        { time: "16:00", title: "Code Review", location: "Room 2A" },
      ],
    }),
    [today]
  );

  const { monthLabel, weeks } = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const startDay = startOfMonth.getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { key: string; label: number; isToday: boolean }[] = [];
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const key = date.toISOString().slice(0, 10);
      days.push({
        key,
        label: day,
        isToday: key === today.toISOString().slice(0, 10),
      });
    }

    // Pad with blanks before the first day to align to the week grid
    const blanks = Array.from({ length: startDay }, () => null);
    const padded = [...blanks, ...days];
    while (padded.length % 7 !== 0) padded.push(null);

    const weeksArr: ({ key: string; label: number; isToday: boolean } | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      weeksArr.push(padded.slice(i, i + 7));
    }

    const formatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
    return { monthLabel: formatter.format(today), weeks: weeksArr };
  }, [today]);

  const selectedEvents = eventsByDate[selectedDate] ?? [];

  return (
    <div className="w-full max-w-3xl px-6 py-6 flex flex-col gap-6 overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-neutral-100">{monthLabel}</h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border border-neutral-600" />
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Has events</span>
          </div>
        </div>
      </div>

      {/* Month grid */}
      <div className="bg-neutral-900/40 border border-neutral-800/50 rounded-2xl p-4 shadow-xl backdrop-blur">
        <div className="grid grid-cols-7 text-xs font-semibold text-neutral-400 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center tracking-wide">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weeks.map((week, wi) =>
            week.map((day, di) => {
              if (!day) {
                return (
                  <div
                    key={`blank-${wi}-${di}`}
                    className="h-16 rounded-xl border border-neutral-800/40 bg-neutral-900/30"
                  />
                );
              }

              const hasEvents = Boolean(eventsByDate[day.key]);
              const isSelected = selectedDate === day.key;

              return (
                <button
                  key={day.key}
                  onClick={() => setSelectedDate(day.key)}
                  className={`h-12 sm:h-16 w-full rounded-xl border text-xs sm:text-sm flex flex-col items-start justify-between p-2 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-lg
                  ${day.isToday ? "border-blue-500/60 bg-blue-500/15 text-blue-50" : "border-neutral-800/60 bg-neutral-800/40 text-neutral-100"}
                  ${isSelected ? "ring-2 ring-blue-400/60" : ""}
                  `}
                >
                  <span className="text-[10px] sm:text-xs font-semibold">{day.label}</span>
                  {hasEvents ? (
                  <span className="text-[8px] sm:text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-100 border border-emerald-500/30">
                    {eventsByDate[day.key].length} event{eventsByDate[day.key].length > 1 ? "s" : ""}
                  </span>
                  ) : (
                  <span className="text-[8px] sm:text-[10px] text-neutral-500">No events</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Day agenda */}
      <div className="bg-neutral-900/40 border border-neutral-800/50 rounded-2xl p-4 shadow-xl backdrop-blur flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-400">Agenda</p>
            <p className="text-lg font-semibold text-neutral-50">
              {new Date(selectedDate).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <button className="px-3 py-1.5 text-sm rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 transition-all shadow-blue-500/20 shadow">
            Add event
          </button>
        </div>

        {selectedEvents.length === 0 ? (
          <div className="text-sm text-neutral-400 border border-dashed border-neutral-700/70 rounded-xl p-4 text-center">
            No events for this day.
          </div>
        ) : (
          <div className="space-y-3">
            {selectedEvents.map((e, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-neutral-700/60 bg-neutral-800/50 px-4 py-3 shadow-sm"
              >
                <div>
                  <p className="text-sm font-semibold text-neutral-50">{e.title}</p>
                  <p className="text-xs text-neutral-400">{e.location ?? "TBD"}</p>
                </div>
                <span className="text-xs sm:text-sm font-mono text-blue-100 bg-blue-500/15 px-2 py-1 rounded-md border border-blue-500/30">
                  {e.time}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
