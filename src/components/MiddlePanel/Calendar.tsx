export function CalendarPanel() {
  // Generate placeholder days
  const days = Array.from({ length: 7 }, (_, i) => ({
    day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i],
    date: 9 + i,
    events: [
      { time: "10:00 AM", title: "Meeting" },
      { time: "2:00 PM", title: "Task Review" },
    ],
  }));

  return (
    <div className="w-full max-w-3xl px-6 py-6 flex flex-col gap-6 overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-neutral-100">Calendar</h2>
        <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-105 active:scale-95">
          Add Event
        </button>
      </div>

      {/* Week overview */}
      <div className="grid grid-cols-7 gap-3">
        {days.map((d) => (
          <div
            key={d.day}
            className="bg-neutral-800/60 backdrop-blur-sm rounded-xl p-3 border border-neutral-700/50 flex flex-col gap-2 hover:border-blue-500/30 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex justify-between items-center text-sm text-neutral-300 font-semibold">
              <span className="text-neutral-400">{d.day}</span>
              <span className="text-neutral-100">{d.date}</span>
            </div>
            <div className="flex flex-col gap-1.5 mt-2">
              {d.events.map((e, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 text-white text-xs px-2 py-1.5 rounded-lg shadow-md border border-blue-400/20"
                >
                  <div className="font-medium">{e.time}</div>
                  <div className="text-blue-100">{e.title}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder for empty days or details */}
      <div className="mt-4 text-sm text-neutral-400 bg-neutral-800/30 rounded-xl p-4 border border-neutral-700/30 text-center">
        Select a day to see event details.
      </div>
    </div>
  );
}
