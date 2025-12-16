export function LeftPanel({
  middle,
  onSelect,
}: {
  middle: "chat" | "tasks" | "profile" | "settings" | "calendar";
  onSelect: (view: "chat" | "tasks" | "profile" | "settings" | "calendar") => void;
}) {
  const base = "w-full text-left px-4 py-3 rounded-xl transition-all duration-200 group relative";
  const inactive = "bg-neutral-800/40 hover:bg-neutral-800/60 text-neutral-300 hover:text-neutral-100 border border-transparent hover:border-neutral-700";
  const active = "bg-gradient-to-r from-blue-600/20 to-blue-500/10 text-white border border-blue-500/30 shadow-lg shadow-blue-500/10";

  return (
    <aside className="w-64 bg-neutral-900/40 backdrop-blur-xl border-r border-neutral-800/50 p-5 shadow-2xl">
      <h2 className="text-xs uppercase tracking-wider text-neutral-500 mb-6 font-semibold">
        Workspace
      </h2>
      <ul className="space-y-2 text-sm">
        <button
          className={`${base} ${middle === "profile" ? active : inactive} flex items-center h-11`}
          onClick={() => onSelect("profile")}
          title="Profile"
        >
          <svg
            className="w-5 h-5 mr-3 transition-transform group-hover:scale-110"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Profile</span>
        </button>
        <button
          className={`${base} ${middle === "calendar" ? active : inactive} flex items-center h-11`}
          onClick={() => onSelect("calendar")}
          title="Calendar"
        >
          <svg
            className="w-5 h-5 mr-3 transition-transform group-hover:scale-110"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Calendar</span>
        </button>
        <button
          className={`${base} ${middle === "chat" ? active : inactive} flex items-center h-11`}
          onClick={() => onSelect("chat")}
          title="Chat"
        >
          <svg
            className="w-5 h-5 mr-3 transition-transform group-hover:scale-110"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
            <path d="M15 0H4a1 1 0 000 2h11a1 1 0 100-2z" />
          </svg>
          <span className="font-medium">Chat</span>
        </button>
        <button
          className={`${base} ${middle === "tasks" ? active : inactive} flex items-center h-11`}
          onClick={() => onSelect("tasks")}
          title="Tasks"
        >
          <svg
            className="w-5 h-5 mr-3 transition-transform group-hover:scale-110"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span className="font-medium">Tasks</span>
        </button>
        <button
          className={`${base} ${middle === "settings" ? active : inactive} flex items-center h-11`}
          onClick={() => onSelect("settings")}
          title="Settings"
        >
          <svg
            className="w-5 h-5 mr-3 transition-transform group-hover:scale-110"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Settings</span>
        </button>
      </ul>
    </aside>
  );
}
