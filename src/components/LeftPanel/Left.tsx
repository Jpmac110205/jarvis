import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";


export function LeftPanel({
  middle,
  onSelect,
}: {
  middle: "chat" | "tasks" | "profile" | "settings" | "calendar" | "privacy";
  onSelect: (view: "chat" | "tasks" | "profile" | "settings" | "calendar" | "privacy") => void;
}) {
  const base = "w-full text-left px-4 py-3 rounded-xl transition-all duration-300 group relative flex items-center h-11 text-sm tracking-wide overflow-hidden";
  
  // Custom Prodigy Theme Active/Inactive States
  const inactive = "bg-[#0c0c10]/40 hover:bg-[rgba(59,130,246,0.04)] text-[#7a7a8c] hover:text-[#f0f0f5] border border-white/5 hover:border-[rgba(59,130,246,0.15)]";
  const active = "bg-[rgba(59,130,246,0.08)] text-[#f0f0f5] border border-[rgba(59,130,246,0.3)] shadow-[0_0_20px_rgba(59,130,246,0.08)] before:content-[''] before:absolute before:left-0 before:top-1/4 before:h-1/2 before:w-[2px] before:bg-[#3b82f6]";

  return (
    <aside className="min-h-screen w-64 bg-[#050507] border-r border-[rgba(59,130,246,0.15)] p-6 flex flex-col relative z-20 overflow-y-auto">
      {/* Background Decorative Mesh Pattern (Matching Prodigy style) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(59,130,246,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.2)_1px,transparent_1px)] bg-[size:20px_20px]" />
      
      {/* Sidebar Header */}
      <div className="relative z-10 mb-8">
        <h2 className="font-['Syne'] text-[11px] font-bold uppercase tracking-[0.18em] text-[#3b82f6]">
          Workspace
        </h2>
      </div>

      {/* Main navigation list */}
      <ul className="space-y-2.5 text-sm relative z-10">
        <li>
          <button
            className={`${base} ${middle === "profile" ? active : inactive}`}
            onClick={() => onSelect("profile")}
          >
            {/* Custom SVG Icon to replace default fallback */}
            <svg className="w-5 h-5 mr-3 stroke-current fill-none stroke-[1.5]" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span className="font-medium font-sans">Profile</span>
          </button>
        </li>

        <li>
          <button
            className={`${base} ${middle === "calendar" ? active : inactive}`}
            onClick={() => onSelect("calendar")}
          >
            <svg className="w-5 h-5 mr-3 stroke-current fill-none stroke-[1.5]" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
            </svg>
            <span className="font-medium font-sans">Calendar</span>
          </button>
        </li>

        <li>
          <button
            className={`${base} ${middle === "chat" ? active : inactive}`}
            onClick={() => onSelect("chat")}
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5 mr-3 stroke-[1.5]" />
            <span className="font-medium font-sans">Chat</span>
          </button>
        </li>

        <li>
          <button
            className={`${base} ${middle === "tasks" ? active : inactive}`}
            onClick={() => onSelect("tasks")}
          >
            <svg className="w-5 h-5 mr-3 stroke-current fill-none stroke-[1.5]" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 0A48.536 48.536 0 0112 3m0 0c2.917 0 5.747.294 8.5.862m-21 1.402v10.117a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 15.382V4.264m-18 0A2.25 2.25 0 015.25 2.014h.018a2.25 2.25 0 012.186 1.716L7.5 4.5" />
            </svg>
            <span className="font-medium font-sans">Tasks</span>
          </button>
        </li>
      </ul>

      {/* Bottom Legal / Setting parameters matching footer vibe */}
      <div className="mt-auto pt-5 border-t border-[rgba(59,130,246,0.15)] relative z-10">
        <button
          className={`${base} ${middle === "privacy" ? active : inactive}`}
          onClick={() => onSelect("privacy")}
          title="Privacy"
        >
          <svg
            className="w-5 h-5 mr-3 transition-transform duration-300 group-hover:scale-105 stroke-current fill-none stroke-[1.5]"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751A11.959 11.959 0 0112 2.714z"
            />
          </svg>

          <span className="font-medium font-sans">Privacy</span>
        </button>
      </div>
    </aside>
  );
}