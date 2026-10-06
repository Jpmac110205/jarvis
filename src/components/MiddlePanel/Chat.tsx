import { useEffect, useRef, useState } from "react";
import {
  ArrowUpIcon,
  DocumentTextIcon,
  MicrophoneIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import type { Message } from "../../App";
import { apiRequest, connectGoogle } from "../../services/api";
import { useGoogleData } from "../../contexts/useGoogleData";

export default function Chat({
  messages,
  input,
  onChange,
  onSend,
  isTyping,
  disabled,
  historyLoading,
  error,
}: {
  messages: Message[];
  input: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isTyping: boolean;
  disabled: boolean;
  historyLoading: boolean;
  error: string | null;
}) {
  const { user, config, refreshProfile } = useGoogleData();
  const end = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(
    null,
  );
  const [copied, setCopied] = useState<number | null>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [messages.length, isTyping]);
  useEffect(() => {
    const element = textarea.current;
    if (element) {
      element.style.height = "auto";
      element.style.height = `${Math.min(element.scrollHeight, 180)}px`;
    }
  }, [input]);
  useEffect(() => {
    if (copied === null) return;
    const timer = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  async function upload(file: File) {
    if (!/\.(pdf|txt)$/i.test(file.name)) {
      setNotice({ text: "Choose a PDF or text document.", error: true });
      return;
    }
    if (config && file.size > config.max_upload_bytes) {
      setNotice({
        text: `Choose a file under ${Math.round(config.max_upload_bytes / 1048576)} MB.`,
        error: true,
      });
      return;
    }
    setUploading(true);
    setNotice(null);
    const body = new FormData();
    body.append("file", file);
    try {
      await apiRequest("/upload", { method: "POST", body });
      setNotice({
        text: `${file.name} is ready. Ask a question about it whenever you need.`,
        error: false,
      });
      await refreshProfile();
    } catch (cause) {
      setNotice({
        text:
          cause instanceof Error
            ? cause.message
            : "Upload failed. Please try again.",
        error: true,
      });
    } finally {
      setUploading(false);
    }
  }
  async function copy(message: Message) {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(message.id);
    } catch {
      setNotice({
        text: "Your browser couldn't copy this message. Select the text to copy it.",
        error: true,
      });
    }
  }
  return (
    <div className="chat">
      <div
        className="chat-scroll"
        aria-label="Conversation"
        aria-busy={historyLoading}
      >
        {historyLoading ? (
          <p className="muted loading-message" role="status">
            Loading your conversation…
          </p>
        ) : (
          messages.length === 0 && (
            <div className="chat-welcome">
              <span className="eyebrow">Your personal assistant</span>
              <h2>
                {user
                  ? `Good to see you, ${user.display_name.split(" ")[0]}.`
                  : "Make room for what matters."}
              </h2>
              <p>
                Think through an idea, find something in your documents, or get
                a clearer view of your day. Prodigy keeps useful context close.
              </p>
              {!user && (
                <button className="button primary" onClick={connectGoogle}>
                  Sign in with Google
                </button>
              )}
              <div className="prompt-grid">
                {[
                  {
                    title: "Plan your day",
                    prompt:
                      "What's on my calendar today, and which tasks should I focus on?",
                    icon: "01",
                  },
                  {
                    title: "Ask your documents",
                    prompt:
                      "Summarize the key points from my uploaded documents.",
                    icon: "02",
                  },
                  {
                    title: "Pick up a thought",
                    prompt:
                      "What have we discussed recently? Help me decide the next steps.",
                    icon: "03",
                  },
                ].map((item) => (
                  <button
                    key={item.title}
                    className="prompt-card"
                    onClick={() => {
                      onChange(item.prompt);
                      textarea.current?.focus();
                    }}
                    disabled={disabled}
                  >
                    <span className="prompt-number">{item.icon}</span>
                    <strong>{item.title}</strong>
                    <span>{item.prompt}</span>
                  </button>
                ))}
              </div>
              <div className="welcome-note">
                <DocumentTextIcon />
                <span>
                  Upload a PDF or text document with the attachment button. Your
                  document knowledge stays linked to your account.
                </span>
              </div>
            </div>
          )
        )}
        <div className="message-list">
          {messages.map((message) => (
            <article key={message.id} className={`message ${message.author}`}>
              <div className="message-heading">
                <span
                  className={`message-avatar ${message.author === "bot" ? "assistant-avatar" : ""}`}
                >
                  {message.author === "bot"
                    ? "p"
                    : user?.display_name.charAt(0) || "You"}
                </span>
                <strong>{message.author === "bot" ? "Prodigy" : "You"}</strong>
                <time>{message.timestamp}</time>
                {message.author === "bot" && (
                  <button
                    className="text-button copy-message"
                    onClick={() => void copy(message)}
                  >
                    {copied === message.id ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
              <div className="message-body">{message.content}</div>
            </article>
          ))}
          {isTyping && (
            <div className="thinking" role="status">
              <span className="status-dot" />
              Prodigy is thinking…
            </div>
          )}
          <div ref={end} />
        </div>
      </div>
      <div className="composer-area">
        {error && (
          <div className="notice error" role="alert">
            {error} Your draft is still here.
          </div>
        )}
        {notice && (
          <div
            className={`notice ${notice.error ? "error" : ""}`}
            role={notice.error ? "alert" : "status"}
          >
            {notice.text}
            <button
              className="text-button"
              onClick={() => setNotice(null)}
              aria-label="Dismiss upload notice"
            >
              Dismiss
            </button>
          </div>
        )}
        {uploading && (
          <p className="muted" role="status">
            Preparing your document…
          </p>
        )}
        <div className="composer">
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.txt"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.target.value = "";
            }}
          />
          <button
            className="icon-button"
            onClick={() => fileInput.current?.click()}
            aria-label="Upload PDF or text document"
            disabled={disabled || uploading}
          >
            <PaperClipIcon />
          </button>
          <textarea
            ref={textarea}
            value={input}
            rows={1}
            aria-label="Message Prodigy"
            placeholder={
              user
                ? "Ask a question or share a thought…"
                : "Sign in to start a conversation"
            }
            disabled={disabled || isTyping}
            maxLength={20000}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                onSend();
              }
            }}
          />
          <button
            className="icon-button voice-control"
            disabled
            title="Voice input is not available yet"
            aria-label="Voice input unavailable"
          >
            <MicrophoneIcon />
          </button>
          <button
            className="send-button"
            aria-label="Send message"
            onClick={onSend}
            disabled={disabled || isTyping || !input.trim()}
          >
            <ArrowUpIcon />
          </button>
        </div>
        <div className="composer-caption">
          <span>Enter to send · Shift + Enter for a new line</span>
          <span>Check important details in the original source.</span>
        </div>
      </div>
    </div>
  );
}
