import { useState, useEffect } from "react";
import Chat from "./components/MiddlePanel/Chat";
import { TasksPanel } from "./components/MiddlePanel/Tasks";
import { CalendarPanel } from "./components/MiddlePanel/Calendar";
import {SettingsPanel} from "./components/MiddlePanel/Settings";
import {LeftPanel} from "./components/LeftPanel/Left";  
import { ProfilePanel } from "./components/MiddlePanel/Profile";
import { ShortcutsPanel } from "./components/RightPanel/Shortcuts";
import { DailyCalendar } from "./components/RightPanel/DailyCalendar";
import { sendChatMessage } from "./services/api";

export interface Message {
  id: number;
  author: "user" | "prodigy";
  content: string;
  timestamp: string;
}

export default function App() {
  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('user_id');
    const authStatus = params.get('auth');
    
    if (userId && authStatus === 'success') {
      // Store user_id in localStorage
      localStorage.setItem('user_id', userId);
      
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      
      // Optionally reload to fetch data
      window.location.reload();
    }
  }, []);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      author: "prodigy",
      content: "Welcome back sir! How may I assist you today?",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  const [middle, setMiddle] = useState<
    "chat" | "tasks" | "profile" | "settings" | "calendar"
  >("chat");
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMessageText = input.trim();
    setInput(""); // Clear input immediately

    // Create user message
    const userMessage: Message = {
      id: Date.now(),
      author: "user",
      content: userMessageText,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Add user message to the UI immediately (optimistic update)
    setMessages((m) => [...m, userMessage]);

    // Show typing indicator
    setIsTyping(true);

    // Get current history (excluding the welcome message for API call, or include all)
    const currentHistory = messages;

    try {
      // Send message to backend
      const response = await sendChatMessage(userMessageText, currentHistory);

      if (response.error) {
        // If there's an error, add an error message
        const errorMessage: Message = {
          id: Date.now() + 1,
          author: "prodigy",
          content: response.reply,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((m) => [...m, errorMessage]);
      } else {
        // Add AI response to the UI
        const aiMessage: Message = {
          id: Date.now() + 1,
          author: "prodigy",
          content: response.reply,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((m) => [...m, aiMessage]);
      }
    } catch (error) {
      // Handle unexpected errors
      const errorMessage: Message = {
        id: Date.now() + 1,
        author: "prodigy",
        content: "Sorry, an unexpected error occurred. Please try again.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((m) => [...m, errorMessage]);
    } finally {
      // Hide typing indicator
      setIsTyping(false);
    }
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
          isTyping={isTyping}
        />
      </main>

      <RightPanel/>
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
    chat: "Prodigy",
    tasks: "Tasks",
    profile: "Profile",
    settings: "Settings",
    calendar: "Calendar",
  };

  return (
    <header className="w-full max-w-3xl px-6 py-4 border-b border-neutral-800/50 bg-neutral-900/30 backdrop-blur-sm">
      <h1 className="text-lg font-semibold text-neutral-100 tracking-tight">
        {titleMap[middle] ?? "Prodigy"}
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
  isTyping,
}: {
  middle: "chat" | "tasks" | "profile" | "settings" | "calendar";
  messages: Message[];
  input: string;
  onChange: (v: string) => void;
  onSend: () => void;
  isTyping: boolean;
}) {
  switch (middle) {
    case "chat":
      return <Chat messages={messages} input={input} onChange={onChange} onSend={onSend} isTyping={isTyping} />;
    case "tasks":
      return <TasksPanel />;
    case "profile":
      return <ProfilePanel />;
    case "settings":
      return <SettingsPanel />;
    case "calendar":
      return <CalendarPanel />;
    default:
      return <Chat messages={messages} input={input} onChange={onChange} onSend={onSend} isTyping={isTyping} />;
  }
}