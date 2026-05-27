import { useMemo, useState } from 'react';

import { useGoogleData } from "../../contexts/GoogleDataProvider";

export function CalendarPanel() {
  const { agenda: googleEvents, connected, loading } = useGoogleData();
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }, [today]);
  const [selectedDate, setSelectedDate] = useState<string>(() => todayKey);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());

  // Convert Google agenda to events by date format
  const eventsByDate = useMemo<Record<string, { time: string; title: string; location?: string }[]>>(() => {
    const events: Record<string, { time: string; title: string; location?: string }[]> = {};
    
    googleEvents.forEach((event) => {
      const dateKey = event.date;
      if (!events[dateKey]) {
        events[dateKey] = [];
      }
      events[dateKey].push({
        time: event.time,
        title: event.event,
        location: undefined,
      });
    });
    
    return events;
  }, [googleEvents]);

  const { monthLabel, weeks } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const startDay = startOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { key: string; label: number; isToday: boolean }[] = [];
    for (let day = 1; day <= daysInMonth; day += 1) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        key,
        label: day,
        isToday: key === todayKey,
      });
    }

    const blanks = Array.from({ length: startDay }, () => null);
    const padded = [...blanks, ...days];
    while (padded.length % 7 !== 0) padded.push(null);

    const weeksArr: ({ key: string; label: number; isToday: boolean } | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      weeksArr.push(padded.slice(i, i + 7));
    }

    const formatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
    return { monthLabel: formatter.format(currentMonth), weeks: weeksArr };
  }, [currentMonth, today, todayKey]);

  const selectedEvents = eventsByDate[selectedDate] ?? [];

  const selectedDateObj = useMemo(() => {
    const parts = selectedDate.split("-").map((p) => Number(p));
    const [year, month, day] = parts;
    return new Date(year, month - 1, day);
  }, [selectedDate]);

  function connectGoogle() {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    window.location.href = `${BACKEND_URL}/auth/google/login`;
  }

  function previousMonth() {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function goToToday() {
    setCurrentMonth(new Date());
    setSelectedDate(todayKey);
  }

  if (loading) {
    return (
      <div className="w-full max-w-3xl px-6 py-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-[rgba(59,130,246,0.15)] border-t-[#3b82f6] animate-spin mb-4" />
        <p className="text-[#7a7a8c] font-light text-sm tracking-wide">Syncing Workspace Agenda...</p>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="w-full max-w-2xl mx-auto px-6 py-12 flex flex-col items-center justify-center text-center gap-6 border border-[rgba(59,130,246,0.15)] bg-[#0c0c10] rounded-[20px] shadow-2xl my-12 relative overflow-hidden">
        {/* Neon accent glow behind card */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)]" />
        
        <div className="w-14 h-14 bg-[rgba(59,130,246,0.05)] border border-[rgba(59,130,246,0.15)] rounded-2xl flex items-center justify-center text-2xl mb-2 relative">
          📅
        </div>
        <div>
          <h2 className="font-['Syne'] font-extrabold text-2xl text-[#f0f0f5] mb-2">Google Agenda Connection</h2>
          <p className="text-sm text-[#7a7a8c] leading-relaxed max-w-md mx-auto font-light">
            Enable calendar awareness for Prodigy. Cross-reference schedule requests, extract meetings, and query your schedules in real-time.
          </p>
        </div>
        <button
          onClick={connectGoogle}
          className="bg-[#3b82f6] text-white px-7 py-3 rounded-lg text-sm font-normal transition-all duration-300 shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:bg-[#2563eb] hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(59,130,246,0.35)]"
        >
          Connect Google Calendar
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl px-6 py-8 flex flex-col gap-6 min-h-[1200px] pb-8">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3.5">
          <h2 className="font-['Syne'] font-extrabold text-2xl tracking-tight text-[#f0f0f5]">{monthLabel}</h2>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#10b981] bg-[rgba(16,185,129,0.08)] px-2.5 py-0.5 rounded-full border border-[rgba(16,185,129,0.15)]">
            Live Link
          </span>
        </div>
        
        {/* Navigation Action Elements */}
        <div className="flex items-center gap-2 bg-[#0c0c10] border border-[rgba(59,130,246,0.15)] p-1 rounded-xl">
          <button
            onClick={previousMonth}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-[#7a7a8c] hover:text-[#f0f0f5]"
            aria-label="Previous month"
          >
            <svg className="w-4 h-4 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[rgba(59,130,246,0.06)] border border-[rgba(59,130,246,0.15)] transition-colors text-[#3b82f6] hover:bg-[rgba(59,130,246,0.1)]"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-[#7a7a8c] hover:text-[#f0f0f5]"
            aria-label="Next month"
          >
            <svg className="w-4 h-4 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Modern Key Legenda Strip */}
      <div className="flex items-center gap-4 text-[11px] uppercase tracking-wider text-[#7a7a8c] font-semibold mb-1">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white/10 border border-white/20" />
          <span>Vacant</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
          <span>Current Day</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
          <span>Events Connected</span>
        </div>
      </div>

      {/* Grid Container Matrix */}
      <div className="bg-[#0c0c10] border border-[rgba(59,130,246,0.15)] rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        {/* Ambient glow edge */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(59,130,246,0.25)] to-transparent" />
        
        <div className="grid grid-cols-7 text-center text-xs font-semibold tracking-widest text-[#7a7a8c] uppercase mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {weeks.map((week, wi) =>
            week.map((day, di) => {
              if (!day) {
                return (
                  <div
                    key={`blank-${wi}-${di}`}
                    className="h-14 sm:h-16 rounded-xl bg-[#050507]/40 border border-white/[0.02]"
                  />
                );
              }

              const hasEvents = Boolean(eventsByDate[day.key]);
              const isSelected = selectedDate === day.key;

              return (
                <button
                  key={day.key}
                  onClick={() => setSelectedDate(day.key)}
                  className={`h-14 sm:h-16 w-full rounded-xl border text-left p-2.5 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden
                  ${day.isToday 
                    ? "border-[#3b82f6] bg-[rgba(59,130,246,0.06)] text-[#f0f0f5]" 
                    : "border-white/5 bg-[#050507]/80 text-[#7a7a8c] hover:border-white/10 hover:bg-[#0c0c10]"
                  }
                  ${isSelected ? "ring-[1.5px] ring-[#3b82f6]/60 border-transparent shadow-[0_0_15px_rgba(59,130,246,0.1)]" : ""}
                  `}
                >
                  <span className={`text-[11px] font-bold ${day.isToday ? "text-[#3b82f6]" : "text-[#f0f0f5]/80 group-hover:text-white"}`}>
                    {day.label}
                  </span>
                  
                  {hasEvents ? (
                    <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-md bg-[rgba(16,185,129,0.08)] text-[#10b981] border border-[rgba(16,185,129,0.15)] self-end">
                      {eventsByDate[day.key].length} Event{eventsByDate[day.key].length > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-[9px] opacity-40 self-end font-light lowercase">empty</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Selected Day Agenda Section */}
      <div className="bg-[#0c0c10] border border-[rgba(59,130,246,0.15)] rounded-2xl p-6 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#3b82f6] mb-1">Agenda Context</p>
            <p className="font-['Syne'] text-lg font-bold text-[#f0f0f5]">
              {selectedDateObj.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#7a7a8c] bg-white/5 px-3 py-1.5 rounded-md border border-white/10">
            Read-only
          </span>
        </div>

        {selectedEvents.length === 0 ? (
          <div className="text-sm text-[#7a7a8c] border border-dashed border-white/5 rounded-xl py-8 text-center font-light">
            No events registered in secure cloud storage for this calendar coordinate.
          </div>
        ) : (
          <div className="space-y-3">
            {selectedEvents.map((e, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-[#050507]/60 px-4 py-3.5 hover:border-[rgba(59,130,246,0.15)] transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-[#f0f0f5]">{e.title}</p>
                  {e.location && (
                    <p className="text-xs text-[#7a7a8c] mt-0.5">{e.location}</p>
                  )}
                </div>
                <span className="text-xs font-mono font-medium text-[#3b82f6] bg-[rgba(59,130,246,0.06)] px-3 py-1.5 rounded-lg border border-[rgba(59,130,246,0.15)]">
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