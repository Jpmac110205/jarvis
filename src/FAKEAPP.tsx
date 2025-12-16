import React, { useEffect, useRef, useState, type JSX } from "react";

export type Role = "system" | "assistant" | "user";

export interface Message {
  id: string | number;
  role: Role;
  text: string;
  time?: string;
}

export interface SourceItem {
  id: string;
  title: string;
  page?: number;
  highlight?: string;
}

export interface Task {
  id: string | number;
  title: string;
  due?: string;
  done: boolean;
}

export interface KBItem {
  id: string;
  title: string;
  type?: string;
}

export interface User {
  name: string;
  persona?: string;
}

export default function JarvisUI(): JSX.Element {
  const [activeTab, setActiveTab] = useState<"chat" | "kb" | "tasks" | "calendar" | "web" | "settings">("chat");
  const [messages, setMessages] = useState<Message[]>([
    { id: "sys-1", role: "system", text: "Good morning, sir. How can I assist you today?", time: getTimeNow() },
  ]);

  const [input, setInput] = useState<string>("");
  const [sourcesOpen, setSourcesOpen] = useState<boolean>(false);
  const [sources, setSources] = useState<SourceItem[]>([]);

  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: "Finish OS assignment", due: "2026-01-09", done: false },
  ]);

  const [kbItems, setKbItems] = useState<KBItem[]>([
    { id: "life-1", title: "LifeLens - Auth Design", type: "doc" },
  ]);

  const [uploading, setUploading] = useState<boolean>(false);
  const [user] = useState<User>({ name: "Sir", persona: "sarcastic" });

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessageToBackend(text: string): Promise<{ reply: string; sources?: SourceItem[] }> {
    await new Promise((r) => setTimeout(r, 600));
    return {
      reply: `Certainly, sir. Quick sketch for: 
${text}

(Replace this mocked reply with the real LLM + RAG result.)`,
      sources: [
        { id: "doc-123", title: "OS Lecture - Process Scheduling", page: 4, highlight: "round-robin details" },
      ],
    };
  }

  async function handleUpload(file: File) {
    setUploading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setKbItems((k) => [{ id: `doc-${Date.now()}`, title: file.name, type: file.type }, ...k]);
    setUploading(false);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { id: Date.now(), role: "user", text, time: getTimeNow() };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    const typingId = `typing-${Date.now()}`;
    setMessages((m) => [...m, { id: typingId, role: "assistant", text: "…", time: getTimeNow() }]);

    try {
      const resp = await sendMessageToBackend(text);
      setMessages((m) => m.filter((x) => x.id !== typingId));
      setMessages((m) => [...m, { id: Date.now() + 1, role: "assistant", text: resp.reply, time: getTimeNow() }]);
      if (resp.sources) setSources(resp.sources);
      setSourcesOpen(true);
    } catch (err) {
      setMessages((m) => m.filter((x) => x.id !== typingId));
      setMessages((m) => [...m, { id: Date.now() + 2, role: "assistant", text: "Sorry, I couldn't reach the backend.", time: getTimeNow() }]);
    }
  }

  function addTask(title: string, due?: string) {
    setTasks((t) => [...t, { id: Date.now(), title, due, done: false }]);
  }

  function toggleTask(id: string | number) {
    setTasks((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  }

  function Sidebar() {
    return (
      <aside className="w-72 bg-gray-900 text-gray-100 p-4 flex flex-col gap-4 border-r border-gray-800">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-xl font-bold">J</div>
          <div>
            <div className="text-sm font-semibold">PROJECT: JARVIS</div>
            <div className="text-xs text-gray-400">Personal AI assistant</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 mt-2">
          <SidebarButton label="Chat" active={activeTab === "chat"} onClick={() => setActiveTab("chat")} />
          <SidebarButton label="Knowledge Base" active={activeTab === "kb"} onClick={() => setActiveTab("kb")} />
          <SidebarButton label="Tasks" active={activeTab === "tasks"} onClick={() => setActiveTab("tasks")} badge={tasks.filter((t) => !t.done).length} />
          <SidebarButton label="Calendar" active={activeTab === "calendar"} onClick={() => setActiveTab("calendar")} />
          <SidebarButton label="Web Search" active={activeTab === "web"} onClick={() => setActiveTab("web")} />
          <SidebarButton label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
        </nav>

        <div className="mt-auto">
          <button className="w-full py-2 rounded-md bg-indigo-600 text-white">Upload Documents</button>
          <div className="text-xs text-gray-500 mt-2">Winter Break — 6 weeks</div>
        </div>
      </aside>
    );
  }

  function SidebarButton({ label, active, onClick, badge }: { label: string; active?: boolean; onClick?: () => void; badge?: number }) {
    return (
      <button
        onClick={onClick}
        className={`w-full text-left px-3 py-2 rounded-md transition flex items-center justify-between ${
          active ? "bg-gray-800" : "hover:bg-gray-800/50"
        }`}
      >
        <span>{label}</span>
        {badge !== undefined && <span className="text-xs text-gray-400">{badge}</span>}
      </button>
    );
  }

  function ChatPanel() {
    return (
      <div className="flex-1 flex flex-col bg-gray-950">
        <header className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chat with JARVIS</h2>
          <div className="text-sm text-gray-400">Connected as {user.name}</div>
        </header>

        <main className="p-6 flex-1 overflow-auto" aria-live="polite">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} onSourcesClick={() => setSourcesOpen(true)} />
            ))}
            <div ref={bottomRef} />
          </div>
        </main>

        <div className="p-4 border-t border-gray-800 bg-gray-900">
          <div className="flex gap-3 max-w-3xl mx-auto">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={`Ask anything about your notes, tasks, or schedule — sir.`}
              className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100"
            />
            <button onClick={handleSend} className="px-4 py-2 rounded-md bg-indigo-600 text-white">Send</button>
            <label className="px-3 py-2 rounded-md bg-gray-800 border border-gray-700 cursor-pointer">
              Upload
              <input type="file" className="hidden" onChange={(e) => e.target.files && handleUpload(e.target.files[0])} />
            </label>
          </div>
        </div>
      </div>
    );
  }

  function MessageBubble({ message, onSourcesClick }: { message: Message; onSourcesClick?: () => void }) {
    const isAssistant = message.role !== "user";
    return (
      <div className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
        <div className={`max-w-3/4 p-4 rounded-lg ${isAssistant ? "bg-gray-800 text-gray-100" : "bg-indigo-600 text-white"}`}>
          <div className="text-sm whitespace-pre-wrap">{message.text}</div>
          <div className="text-xs text-gray-500 mt-2">{message.time}</div>
          {isAssistant && (
            <div className="mt-2 text-xs text-indigo-300 cursor-pointer" onClick={onSourcesClick}>
              Show sources
            </div>
          )}
        </div>
      </div>
    );
  }

  function KBPanel() {
    return (
      <div className="p-4 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Knowledge Base</h3>
          <div className="text-sm text-gray-400">{kbItems.length} documents</div>
        </div>

        <div className="grid gap-3">
          {kbItems.map((k) => (
            <div key={k.id} className="p-3 border rounded-md bg-gray-900 border-gray-800 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-100">{k.title}</div>
                <div className="text-xs text-gray-400">{k.type}</div>
              </div>
              <div className="text-sm text-indigo-400 cursor-pointer">Open</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function TasksPanel() {
    const [newTask, setNewTask] = useState<string>("");
    const [newDue, setNewDue] = useState<string>("");

    const handleAddTask = () => {
      if (!newTask) return;
      addTask(newTask, newDue || undefined);
      setNewTask("");
      setNewDue("");
    };

    return (
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Tasks</h3>
          <div className="text-sm text-gray-400">{tasks.filter((t) => !t.done).length} open</div>
        </div>

        <div className="flex gap-2">
          <input 
            value={newTask} 
            onChange={(e) => setNewTask(e.target.value)} 
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            placeholder="New task" 
            className="flex-1 rounded-md border border-gray-700 bg-gray-900 px-2 py-1 text-gray-100" 
          />
          <input 
            value={newDue} 
            onChange={(e) => setNewDue(e.target.value)} 
            type="date" 
            className="rounded-md border border-gray-700 bg-gray-900 px-2 py-1 text-gray-100" 
          />
          <button onClick={handleAddTask} className="px-3 py-1 rounded-md bg-indigo-600 text-white">Add</button>
        </div>

        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-2 border rounded-md bg-gray-900 border-gray-800">
              <div>
                <div className={`font-medium ${t.done ? "line-through text-gray-500" : "text-gray-100"}`}>{t.title}</div>
                <div className="text-xs text-gray-400">Due: {t.due ?? "—"}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleTask(t.id)} className="px-2 py-1 rounded-md bg-gray-800 text-gray-100">{t.done ? "Undo" : "Done"}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function CalendarPanel() {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Calendar</h3>
          <div className="text-sm text-gray-400">Google Calendar • Connected</div>
        </div>
        <div className="p-4 border rounded-md bg-gray-900 border-gray-800">Replace with react-big-calendar or fullcalendar connected to Google OAuth.</div>
      </div>
    );
  }

  function SourcesDrawer() {
    if (!sourcesOpen) return null;
    return (
      <div className="absolute right-0 top-0 h-full w-96 bg-gray-900 border-l border-gray-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">Sources & Citations</h4>
          <button onClick={() => setSourcesOpen(false)} className="text-sm text-gray-400">Close</button>
        </div>
        <div className="space-y-3 overflow-auto h-[80vh]">
          {sources.length === 0 && <div className="text-sm text-gray-500">No sources yet. JARVIS will show document excerpts and links here.</div>}
          {sources.map((s) => (
            <div key={s.id} className="p-3 border rounded-md bg-gray-800 border-gray-700">
              <div className="font-medium text-gray-100">{s.title}</div>
              <div className="text-xs text-gray-400">page {s.page ?? "—"}</div>
              {s.highlight && <div className="mt-2 text-sm text-gray-200">"{s.highlight}"</div>}
              <div className="mt-2 text-xs text-indigo-300 cursor-pointer">Open document</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const mainContent = () => {
    switch (activeTab) {
      case "chat":
        return <ChatPanel />;
      case "kb":
        return <KBPanel />;
      case "tasks":
        return <TasksPanel />;
      case "calendar":
        return <CalendarPanel />;
      case "web":
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold">Web Search</h3>
            <p className="text-sm text-gray-400 mt-2">This tab will send queries to your web-search connector and combine results with your KB.</p>
          </div>
        );
      case "settings":
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold">Settings</h3>
            <div className="mt-4 space-y-3 text-sm text-gray-400">
              <div>Google Calendar: connected</div>
              <div>ChromaDB: local</div>
              <div>Model: GPT-4</div>
              <div>Personality: Sarcastic — says "sir"</div>
            </div>
          </div>
        );
      default:
        return <div />;
    }
  };

  return (
    <div className="h-screen flex bg-gray-950 text-gray-100">
      <Sidebar />

      <main className="flex-1 relative flex flex-col">{mainContent()}</main>

      <aside className="w-96 border-l border-gray-800 bg-gray-900 p-4 flex flex-col gap-4">
        <div>
          <div className="text-sm text-gray-400">Quick Glance</div>
          <div className="mt-2 font-semibold">Next: Interview — Jan 9, 2:00 PM</div>
        </div>

        <div>
          <div className="text-sm text-gray-400">Today</div>
          <ul className="mt-2 space-y-2 text-sm text-gray-200">
            <li>10:00 AM — Operating Systems</li>
            <li>2:00 PM — Interview</li>
            <li>6:00 PM — Lacrosse practice</li>
          </ul>
        </div>

        <div className="mt-auto">
          <div className="text-sm text-gray-400">Shortcuts</div>
          <div className="mt-2 flex gap-2">
            <button className="px-3 py-1 rounded-md bg-gray-800">New Task</button>
            <button className="px-3 py-1 rounded-md bg-gray-800">Upload Doc</button>
            <button className="px-3 py-1 rounded-md bg-gray-800">Voice</button>
          </div>
        </div>
      </aside>

      <SourcesDrawer />
    </div>
  );
}

function getTimeNow(): string {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}