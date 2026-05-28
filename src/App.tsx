import { useState, useEffect } from "react";
import Chat from "./components/MiddlePanel/Chat";
import { TasksPanel } from "./components/MiddlePanel/Tasks";
import { CalendarPanel } from "./components/MiddlePanel/Calendar";
import { SettingsPanel } from "./components/MiddlePanel/Settings";
import { LeftPanel } from "./components/LeftPanel/Left";  
import { ProfilePanel } from "./components/MiddlePanel/Profile";
import { ShortcutsPanel } from "./components/RightPanel/Shortcuts";
import { DailyCalendar } from "./components/RightPanel/DailyCalendar";
import { sendChatMessage } from "./services/api";
import PrivacyPolicy from "./components/home/privacy";

export interface Message {
  id: number;
  author: "user" | "bot";
  content: string;
  timestamp: string;
}

type LeftPanelSection =
  | "calendar"
  | "chat"
  | "profile"
  | "settings"
  | "tasks"
  | "privacy";

export default function App() {
  // Handle OAuth callback - store user_id but don't reload
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('user_id');
    const authStatus = params.get('auth');
    
    if (userId && authStatus === 'success') {
      // Store user_id in localStorage
      localStorage.setItem('user_id', userId);
      
      // Clean up URL without reloading
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      author: "bot",
      content: "Welcome back sir! How may I assist you today?",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  const [middle, setMiddle] = useState<
    | "home"
    | "privacy"
    | "chat"
    | "tasks"
    | "profile"
    | "settings"
    | "calendar"
  >("home");
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Hidden state for side panels
  const [leftHidden, setLeftHidden] = useState(false);
  const [rightHidden, setRightHidden] = useState(false);

  const leftPanelMiddle: LeftPanelSection =
    middle === "home" ? "chat" : middle;

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
          author: "bot",
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
          author: "bot",
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
        author: "bot",
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
    <div className="h-screen w-screen relative flex bg-[#050507] text-[#f0f0f5] font-sans font-light overflow-hidden selection:bg-blue-500/30
      before:content-[''] before:fixed before:inset-0 before:pointer-events-none before:z-0
      before:bg-[linear-gradient(rgba(59,130,246,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.025)_1px,transparent_1px)]
      before:bg-[size:60px_60px]"
    >
      {/* Dynamic Ambient Cyber Glow Behind the workspace */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-full max-w-[900px] h-[600px] pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06)_0%,transparent_70%)] z-0" />

      {/* Left panel + Custom High-Tech sliding toggle anchor */}
      <div className="relative flex-shrink-0 h-full z-20 flex">
        <div
          className="h-full overflow-hidden transition-all duration-300 ease-out"
          style={{ width: leftHidden ? 0 : "16rem" }}
        >
          <div className="w-64 h-full">
            <LeftPanel middle={leftPanelMiddle} onSelect={(section) => setMiddle(section)} />
          </div>
        </div>

        {/* Customized Cyber Slider handle */}
        <button
          onClick={() => setLeftHidden((s) => !s)}
          aria-label={leftHidden ? "Show left panel" : "Hide left panel"}
          className="absolute top-1/2 -translate-y-1/2 z-30 bg-[#0c0c10] hover:bg-[#0f0f15] text-[#7a7a8c] hover:text-[#3b82f6] w-[16px] h-12 flex items-center justify-center rounded-r-xl border-y border-r border-[rgba(59,130,246,0.15)] shadow-[4px_0_15px_rgba(0,0,0,0.5)] transition-all duration-300 focus:outline-none"
          style={{ left: leftHidden ? 0 : "16rem" }}
        >
          <span className="text-[11px] font-bold font-mono">
            {leftHidden ? "›" : "‹"}
          </span>
        </button>
      </div>

      {/* Main Container Area */}
      <main className="flex-1 flex flex-col items-center overflow-hidden h-full relative z-10 bg-transparent">
        <MiddleHeader middle={middle} />
        
        <div className="flex-1 w-full overflow-hidden flex flex-col items-center">
          <MiddlePanel
            middle={middle}
            messages={messages}
            input={input}
            onChange={setInput}
            onSend={sendMessage}
            isTyping={isTyping}
          />
        </div>
      </main>

      {/* Right panel + Custom High-Tech sliding toggle anchor */}
      <div className="relative flex-shrink-0 h-full z-20 flex">
        {/* Customized Cyber Slider handle */}
        <button
          onClick={() => setRightHidden((s) => !s)}
          aria-label={rightHidden ? "Show right panel" : "Hide right panel"}
          className="absolute top-1/2 -translate-y-1/2 z-30 bg-[#0c0c10] hover:bg-[#0f0f15] text-[#7a7a8c] hover:text-[#3b82f6] w-[16px] h-12 flex items-center justify-center rounded-l-xl border-y border-l border-[rgba(59,130,246,0.15)] shadow-[-4px_0_15px_rgba(0,0,0,0.5)] transition-all duration-300 focus:outline-none"
          style={{ right: rightHidden ? 0 : "16rem" }}
        >
          <span className="text-[11px] font-bold font-mono">
            {rightHidden ? "‹" : "›"}
          </span>
        </button>

        <div
          className="h-full overflow-hidden transition-all duration-300 ease-out"
          style={{ width: rightHidden ? 0 : "16rem" }}
        >
          <div className="w-64 h-full">
            <RightPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Right Panel Wrapper Component ---------------- */
function RightPanel() {
  return (
    <aside className="w-64 bg-[#050507] border-l border-[rgba(59,130,246,0.15)] p-5 flex flex-col h-screen relative z-10 overflow-hidden">
      {/* Decorative background grid matrix strictly for sidebar depth */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015] bg-[linear-gradient(rgba(59,130,246,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.2)_1px,transparent_1px)] bg-[size:15px_15px]" />
      
      <div className="flex-1 overflow-y-auto scrollbar-none relative z-10">
        <DailyCalendar />
      </div>
      
      <div className="mt-auto border-t border-[rgba(59,130,246,0.15)] pt-5 relative z-10">
        <ShortcutsPanel />
      </div>
    </aside>
  );
}

/* ---------------- Middle Header Component ---------------- */
function MiddleHeader({ middle }: { middle: string }) {
  const titleMap: Record<string, string> = {
    home: "Home",
    privacy: "Privacy Policy",
    chat: "PRODIGY.",
    tasks: "Tasks Management",
    profile: "Partner Profile",
    settings: "System Settings",
    calendar: "Calendar Matrix",
  };

  return (
    <header className="w-full max-w-3xl px-6 py-4 border-b border-[rgba(59,130,246,0.15)] bg-[#050507]/60 backdrop-blur-md flex items-center justify-between z-10">
      <h1 className="text-sm font-['Syne'] font-extrabold tracking-[0.15em] text-[#f0f0f5] uppercase">
        {titleMap[middle] ?? "Prodigy"}
      </h1>
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
        <span className="text-[9px] font-mono tracking-widest text-[#7a7a8c] uppercase">System Online</span>
      </div>
    </header>
  );
}

/* ---------------- Middle Panel router switch ---------------- */
function MiddlePanel({
  middle,
  messages,
  input,
  onChange,
  onSend,
  isTyping,
}: {
  middle: "home" | "privacy" | "chat" | "tasks" | "profile" | "settings" | "calendar";
  messages: Message[];
  input: string;
  onChange: (v: string) => void;
  onSend: () => void;
  isTyping: boolean;
}) {
  switch (middle) {

    case "privacy":
      return (
        <div className="w-full h-full overflow-y-auto scrollbar-thin">
          <PrivacyPolicy />
        </div>
      );

    case "chat":
      return (
        <Chat
          messages={messages}
          input={input}
          onChange={onChange}
          onSend={onSend}
          isTyping={isTyping}
        />
      );

    case "tasks":
      return (
        <div className="w-full h-full overflow-y-auto flex justify-center">
          <TasksPanel />
        </div>
      );

    case "profile":
      return (
        <div className="w-full h-full overflow-y-auto flex justify-center">
          <ProfilePanel />
        </div>
      );

    case "settings":
      return (
        <div className="w-full h-full overflow-y-auto flex justify-center">
          <SettingsPanel />
        </div>
      );

    case "calendar":
      return (
        <div className="w-full h-full overflow-y-auto flex justify-center">
          <CalendarPanel />
        </div>
      );

    default:
      return (
        <Chat
          messages={messages}
          input={input}
          onChange={onChange}
          onSend={onSend}
          isTyping={isTyping}
        />
      );
  }
}