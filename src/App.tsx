import { useEffect, useRef, useState } from "react";
import {
  Bars3Icon,
  XMarkIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import Chat from "./components/MiddlePanel/Chat";
import { TasksPanel } from "./components/MiddlePanel/Tasks";
import { CalendarPanel } from "./components/MiddlePanel/Calendar";
import { SettingsPanel } from "./components/MiddlePanel/Settings";
import { LeftPanel } from "./components/LeftPanel/Left";
import { ProfilePanel } from "./components/MiddlePanel/Profile";
import { ShortcutsPanel } from "./components/RightPanel/Shortcuts";
import { DailyCalendar } from "./components/RightPanel/DailyCalendar";
import { apiRequest, sendChatMessage } from "./services/api";
import { useGoogleData } from "./contexts/useGoogleData";
import { usePreferences } from "./contexts/usePreferences";
import PrivacyPolicy from "./components/home/privacy";

export interface Message {
  id: number;
  author: "user" | "bot";
  content: string;
  timestamp: string;
}
export type Section =
  "chat" | "calendar" | "tasks" | "profile" | "settings" | "privacy";
const titles: Record<Section, string> = {
  chat: "Assistant",
  calendar: "Calendar",
  tasks: "Tasks",
  profile: "Your profile",
  settings: "Settings",
  privacy: "Privacy policy",
};

export default function App() {
  const { user } = useGoogleData();
  return <Workspace key={user?.id ?? "guest"} />;
}

function Workspace() {
  const { user, loading, online, refreshProfile } = useGoogleData();
  const { preferences } = usePreferences();
  const [section, setSection] = useState<Section>("chat");
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(Boolean(user));
  const sending = useRef(false);
  const pendingRequest = useRef<{ text: string; id: string } | null>(null);
  const owner = useRef(user?.id);
  owner.current = user?.id;
  const userId = user?.id;
  const draftKey = user ? `prodigy_draft_${user.id}` : null;

  useEffect(() => {
    let active = true;
    if (!userId) return;
    setHistoryLoading(true);
    void apiRequest<{
      messages: {
        id: number;
        role: string;
        content: string;
        created_at: string;
      }[];
    }>("/conversation")
      .then((data) => {
        if (active)
          setMessages(
            data.messages.map((m) => ({
              id: m.id,
              author: m.role === "user" ? "user" : "bot",
              content: m.content,
              timestamp: new Date(
                m.created_at.includes("Z") ||
                  /[+-]\d\d:\d\d$/.test(m.created_at)
                  ? m.created_at
                  : `${m.created_at.replace(" ", "T")}Z`,
              ).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
            })),
          );
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Conversation couldn't be loaded.",
          );
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!draftKey || !preferences.autoSave) return;
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) || "null");
      if (saved && Date.now() - saved.savedAt < 48 * 3600000) {
        setInput(saved.text || "");
        if (saved.requestId)
          pendingRequest.current = { text: saved.text, id: saved.requestId };
      } else localStorage.removeItem(draftKey);
    } catch {
      localStorage.removeItem(draftKey);
    }
  }, [draftKey, preferences.autoSave]);

  function changeInput(value: string) {
    setInput(value);
    if (pendingRequest.current?.text !== value.trim())
      pendingRequest.current = null;
    if (draftKey && preferences.autoSave)
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          text: value,
          savedAt: Date.now(),
          requestId: pendingRequest.current?.id,
        }),
      );
  }

  async function sendMessage() {
    if (!input.trim() || sending.current || !user || historyLoading) return;
    const account = user.id;
    const text = input.trim();
    sending.current = true;
    setBusy(true);
    setError(null);
    try {
      if (pendingRequest.current?.text !== text)
        pendingRequest.current = { text, id: crypto.randomUUID() };
      if (draftKey && preferences.autoSave)
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            text,
            savedAt: Date.now(),
            requestId: pendingRequest.current.id,
          }),
        );
      const response = await sendChatMessage(text, pendingRequest.current.id);
      if (owner.current !== account) return;
      if (response.error) throw new Error(response.error);
      const timestamp = new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
      setMessages((previous) => [
        ...previous,
        { id: Date.now(), author: "user", content: text, timestamp },
        {
          id: Date.now() + 1,
          author: "bot",
          content: response.reply,
          timestamp,
        },
      ]);
      changeInput("");
      pendingRequest.current = null;
      void refreshProfile().catch(() => {});
    } catch (cause) {
      if (owner.current === account)
        setError(
          cause instanceof Error
            ? cause.message
            : "Message couldn't be sent. Please try again.",
        );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  function navigate(view: Section) {
    setSection(view);
    setNavigationOpen(false);
    setOverviewOpen(false);
  }
  return (
    <div className="workspace">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {(navigationOpen || overviewOpen) && (
        <button
          className="mobile-backdrop"
          aria-label="Close panels"
          onClick={() => {
            setNavigationOpen(false);
            setOverviewOpen(false);
          }}
        />
      )}
      <div className={`navigation-shell ${navigationOpen ? "is-open" : ""}`}>
        <button
          className="mobile-close icon-button"
          onClick={() => setNavigationOpen(false)}
          aria-label="Close navigation"
        >
          <XMarkIcon />
        </button>
        <LeftPanel middle={section} onSelect={navigate} />
      </div>
      <main id="main-content" className="workspace-main">
        <header className="workspace-header">
          <div className="header-title">
            <button
              className="mobile-menu icon-button"
              onClick={() => setNavigationOpen(true)}
              aria-label="Open navigation"
              aria-expanded={navigationOpen}
            >
              <Bars3Icon />
            </button>
            <span className="breadcrumb">
              Workspace <span>/</span>
            </span>
            <h1>{titles[section]}</h1>
          </div>
          <div className="header-actions">
            <span
              className={`service-status ${online === false ? "offline" : ""}`}
            >
              <i />
              {online === null
                ? "Checking service"
                : online
                  ? "Service available"
                  : "Service unavailable"}
            </span>
            <button
              className="overview-toggle icon-button"
              onClick={() => setOverviewOpen((value) => !value)}
              aria-label="Toggle daily overview"
              aria-expanded={overviewOpen}
            >
              <CalendarDaysIcon />
            </button>
          </div>
        </header>
        <div
          className={`workspace-content ${section === "chat" ? "chat-content" : ""}`}
        >
          {section === "chat" && (
            <Chat
              messages={messages}
              input={input}
              onChange={changeInput}
              onSend={() => void sendMessage()}
              isTyping={busy}
              disabled={!user || loading || historyLoading}
              historyLoading={historyLoading}
              error={error}
            />
          )}
          {section === "calendar" && <CalendarPanel />}
          {section === "tasks" && <TasksPanel />}
          {section === "profile" && <ProfilePanel />}
          {section === "settings" && <SettingsPanel />}
          {section === "privacy" && (
            <div className="privacy-content">
              <PrivacyPolicy />
            </div>
          )}
        </div>
      </main>
      <aside className={`overview-shell ${overviewOpen ? "is-open" : ""}`}>
        <button
          className="mobile-close icon-button"
          onClick={() => setOverviewOpen(false)}
          aria-label="Close overview"
        >
          <XMarkIcon />
        </button>
        <DailyCalendar onSelect={navigate} />
        <ShortcutsPanel onSelect={navigate} />
      </aside>
    </div>
  );
}
