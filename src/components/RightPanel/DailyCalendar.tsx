export function DailyCalendar() {
  const reminders = [
    { title: "Finish OS assignment", done: false },
    { title: "Team meeting", done: true },
    { title: "Email client", done: false },
  ];

  const agenda = [
    { time: "09:00 AM", event: "Operating Systems" },
    { time: "11:00 AM", event: "Code Review" },
    { time: "02:00 PM", event: "Project Update" },
  ];

  return (
    <>
      <h2 className="text-base font-semibold mb-5 text-neutral-100 tracking-tight">Today's Overview</h2>

      {/* Reminders */}
      <div className="w-full max-w-md bg-neutral-800/60 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-neutral-700/50 mb-4">
        <h3 className="text-sm font-semibold text-neutral-200 mb-3 uppercase tracking-wide">Reminders</h3>
        <ul className="space-y-2">
          {reminders.map((reminder, idx) => (
            <li
              key={idx}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 ${
                reminder.done 
                  ? "bg-neutral-700/30 text-neutral-500 line-through border-l-4 border-green-500/50" 
                  : "bg-neutral-700/40 text-neutral-100 border-l-4 border-yellow-500/70 hover:bg-neutral-700/50"
              }`}
            >
              <span className="font-medium text-sm">{reminder.title}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                reminder.done 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-yellow-500/20 text-yellow-400"
              }`}>
                {reminder.done ? "Done" : "Pending"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Schedule for Today */}
      <div className="w-full max-w-md bg-neutral-800/60 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-neutral-700/50">
        <h3 className="text-sm font-semibold text-neutral-200 mb-3 uppercase tracking-wide">Schedule for Today</h3>
        <ul className="space-y-2">
          {agenda.map((item, idx) => (
            <li 
              key={idx} 
              className="flex justify-between items-center px-3 py-2.5 rounded-lg bg-gradient-to-r from-blue-600/20 to-blue-500/10 text-neutral-100 border-l-4 border-blue-500/70 hover:from-blue-600/30 hover:to-blue-500/20 transition-all duration-200"
            >
              <span className="text-sm font-medium text-blue-300">{item.time}</span>
              <span className="text-sm font-medium">{item.event}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
