import { useState } from "react";
import Chat from "./components/MiddlePanel/Chat";
import { TasksPanel } from "./components/MiddlePanel/Tasks";
import { CalendarPanel } from "./components/MiddlePanel/Calendar";
import {SettingsPanel} from "./components/MiddlePanel/Settings";
import {LeftPanel} from "./components/LeftPanel/Left";  
import { ProfilePanel } from "./components/MiddlePanel/Profile";
import { ShortcutsPanel } from "./components/RightPanel/Shortcuts";
import { DailyCalendar } from "./components/RightPanel/DailyCalendar";

export interface Message {
  id: number;
  author: "user" | "jarvis";
  content: string;
  timestamp: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      author: "jarvis",
      content: "Welcome back sir! How may I assist you today?",
      timestamp:new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
  ]);

  const [middle, setMiddle] = useState<
    "chat" | "tasks" | "profile" | "settings" | "calendar"
  >("chat");
  const [input, setInput] = useState("");

  function sendMessage() {
    if (!input.trim()) return;

    setMessages((m) => [
      ...m,
      {
        id: Date.now(),
        author: "user",
        content: input,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setInput("");
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100 overflow-hidden">
      <LeftPanel middle={middle} onSelect={setMiddle} />

      <main className="flex-1 flex flex-col items-center overflow-hidden">
        <MiddleHeader middle={middle} />
        <MiddlePanel
          middle={middle}
          messages={messages}
          input={input}
          onChange={setInput}
          onSend={sendMessage}
        />
      </main>

      <RightPanel />
    </div>
  );
}



/* ---------------- Right Panel ---------------- */

function RightPanel() {
  return (
    <aside className="w-64 bg-neutral-900/40 backdrop-blur-xl border-l border-neutral-800/50 p-4 flex flex-col h-screen shadow-2xl">
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <DailyCalendar />
      </div>
      <div className="mt-auto border-t border-neutral-800/50 pt-4">
        {ShortcutsPanel()}
      </div>
    </aside>
  );
}

/* ---------------- Middle Header ---------------- */

function MiddleHeader({ middle }: { middle: string }) {
  const titleMap: Record<string, string> = {
    chat: "Jarvis Chat",
    tasks: "Tasks",
    profile: "Profile",
    settings: "Settings",
    calendar: "Calendar",
  };

  return (
    <header className="w-full max-w-3xl px-6 py-4 border-b border-neutral-800/50 bg-neutral-900/30 backdrop-blur-sm">
      <h1 className="text-lg font-semibold text-neutral-100 tracking-tight">
        {titleMap[middle] ?? "Jarvis"}
      </h1>
    </header>
  );
}

/* ---------------- Middle Panel ---------------- */

function MiddlePanel({
  middle,
  messages,
  input,
  onChange,
  onSend,
}: {
  middle: "chat" | "tasks" | "profile" | "settings" | "calendar";
  messages: Message[];
  input: string;
  onChange: (v: string) => void;
  onSend: () => void;
}) {
  switch (middle) {
    case "chat":
      return <Chat messages={messages} input={input} onChange={onChange} onSend={onSend} />;
    case "tasks":
      return <TasksPanel />;
    case "profile":
      return <ProfilePanel />;
    case "settings":
      return <SettingsPanel />;
    case "calendar":
      return <CalendarPanel />;
    default:
      return <Chat messages={messages} input={input} onChange={onChange} onSend={onSend} />;
  }
}
