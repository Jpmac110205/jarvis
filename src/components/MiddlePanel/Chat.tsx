import { useEffect, useRef, useState } from "react";
import {
  ArrowUpIcon,
  DocumentTextIcon,
  MicrophoneIcon,
  PaperClipIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { Message } from "../../App";
import { apiRequest, connectGoogle } from "../../services/api";
import type { DocumentAttachment } from "../../services/api";
import { useGoogleData } from "../../contexts/useGoogleData";
import { MarkdownMessage } from "./MarkdownMessage";

export default function Chat({
  messages,
  input,
  onChange,
  onSend,
  isTyping,
  disabled,
  historyLoading,
  error,
  attachments,
  onAttachmentsChange,
  memoryNotice,
}: {
  messages: Message[];
  input: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isTyping: boolean;
  disabled: boolean;
  historyLoading: boolean;
  error: string | null;
  attachments: DocumentAttachment[];
  onAttachmentsChange: (documents: DocumentAttachment[]) => void;
  memoryNotice: string | null;
}) {
  const { user, config, refreshProfile } = useGoogleData();
  const end = useRef<HTMLDivElement>(null);
  const messageBodies = useRef(new Map<number, HTMLDivElement>());
  const fileInput = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(
    null,
  );
  const [copied, setCopied] = useState<number | null>(null);
  const [library, setLibrary] = useState<DocumentAttachment[] | null>(null);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [preview, setPreview] = useState<{
    filename: string;
    content: string;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const lastContent = messages.at(-1)?.content;
  function attach(document: DocumentAttachment) {
    if (attachments.some((a) => a.document_key === document.document_key))
      return;
    if (attachments.length >= 5) {
      setNotice({
        text: "Attach up to five documents per question.",
        error: true,
      });
      return;
    }
    onAttachmentsChange([...attachments, document]);
  }
  async function openLibrary() {
    if (library !== null) {
      setLibrary(null);
      return;
    }
    setLibraryLoading(true);
    try {
      const data = await apiRequest<{ documents: DocumentAttachment[] }>(
        "/documents",
      );
      setLibrary(data.documents);
    } catch (cause) {
      setNotice({
        text:
          cause instanceof Error
            ? cause.message
            : "Documents could not be loaded.",
        error: true,
      });
    } finally {
      setLibraryLoading(false);
    }
  }
  async function showPreview(document: DocumentAttachment) {
    setPreviewLoading(true);
    try {
      const data = await apiRequest<{ filename: string; content: string }>(
        `/documents/${document.document_key}`,
      );
      setPreview(data);
    } catch (cause) {
      setNotice({
        text:
          cause instanceof Error
            ? cause.message
            : "Preview could not be loaded.",
        error: true,
      });
    } finally {
      setPreviewLoading(false);
    }
  }
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [messages.length, lastContent, isTyping]);
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
    if (!/\.(pdf|txt|md)$/i.test(file.name)) {
      setNotice({
        text: "Choose a PDF, text or Markdown document.",
        error: true,
      });
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
      const document = await apiRequest<DocumentAttachment>("/upload", {
        method: "POST",
        body,
      });
      attach(document);
      setLibrary(null);
      setNotice({
        text:
          document.indexed === false
            ? `${file.name} is attached in full. Search indexing failed; re-upload to retry indexing.`
            : `${file.name} is attached. Its full extracted text will be included until you remove it.`,
        error: false,
      });
      void refreshProfile().catch(() => {});
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
      await navigator.clipboard.writeText(
        message.author === "bot"
          ? (messageBodies.current.get(message.id)?.innerText ??
              message.content)
          : message.content,
      );
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
                  Attach a PDF, text or Markdown document to ask about its full
                  extracted text. Remove it from your question with ×.
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
                    disabled={message.provisional}
                    onClick={() => void copy(message)}
                  >
                    {copied === message.id ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
              <div
                ref={(element) => {
                  if (element) messageBodies.current.set(message.id, element);
                  else messageBodies.current.delete(message.id);
                }}
                className={`message-body ${message.author === "bot" ? "markdown-body" : ""}`}
              >
                {message.author === "bot" ? (
                  <MarkdownMessage content={message.content} />
                ) : (
                  message.content
                )}
              </div>
              {message.author === "bot" &&
                message.provisional &&
                message.content && (
                  <small className="muted" role="status">
                    Receiving reply…
                  </small>
                )}
              {Boolean(message.attachments?.length) && (
                <div
                  className="message-attachments"
                  aria-label="Documents included with this message"
                >
                  {message.attachments?.map((document) => (
                    <span className="badge" key={document.document_key}>
                      <DocumentTextIcon />
                      {document.filename}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
          {isTyping && (
            <div className="thinking" role="status">
              <span className="status-dot" />
              {messages.at(-1)?.content
                ? "Prodigy is responding…"
                : "Prodigy is thinking…"}
            </div>
          )}
          <div ref={end} />
        </div>
      </div>
      <div className="composer-area">
        {memoryNotice && (
          <p className="notice" role="status">
            {memoryNotice}
          </p>
        )}
        {previewLoading && <p role="status">Loading document preview…</p>}
        {preview && (
          <section
            className="document-preview surface"
            aria-label={`Preview of ${preview.filename}`}
          >
            <div className="setting-row">
              <strong>{preview.filename}</strong>
              <button className="text-button" onClick={() => setPreview(null)}>
                Close preview
              </button>
            </div>
            <pre>{preview.content}</pre>
          </section>
        )}
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
        {attachments.length > 0 && (
          <div
            className="attachment-list"
            aria-label="Documents attached to your question"
          >
            {attachments.map((document) => (
              <div className="attachment-card" key={document.document_key}>
                <DocumentTextIcon />
                <button
                  className="attachment-name"
                  onClick={() => void showPreview(document)}
                  disabled={previewLoading}
                >
                  <strong>{document.filename}</strong>
                  <small>
                    Full text · {document.characters?.toLocaleString() ?? ""}{" "}
                    characters
                  </small>
                </button>
                <button
                  className="icon-button"
                  aria-label={`Remove ${document.filename} from question`}
                  disabled={isTyping || uploading}
                  onClick={() =>
                    onAttachmentsChange(
                      attachments.filter(
                        (a) => a.document_key !== document.document_key,
                      ),
                    )
                  }
                >
                  <XMarkIcon />
                </button>
              </div>
            ))}
            <p className="muted attachment-hint">
              Included with each question until removed. Removing an attachment
              keeps the saved document.
            </p>
          </div>
        )}
        {user && (
          <button
            className="text-button library-toggle"
            disabled={isTyping || uploading || libraryLoading}
            onClick={() => void openLibrary()}
            aria-expanded={library !== null}
          >
            {libraryLoading
              ? "Loading documents…"
              : library !== null
                ? "Close saved documents"
                : "Saved documents"}
          </button>
        )}
        {library !== null && (
          <section className="document-library" aria-label="Saved documents">
            {library.length === 0 && (
              <p className="muted">Upload a document to start your library.</p>
            )}
            {library.map((document) => (
              <div className="setting-row" key={document.document_key}>
                <span>
                  {document.filename}
                  {!document.full_text_available && (
                    <small> · Re-upload to attach full text</small>
                  )}
                </span>
                <button
                  className="button"
                  disabled={
                    isTyping ||
                    uploading ||
                    !document.full_text_available ||
                    attachments.length >= 5 ||
                    attachments.some(
                      (a) => a.document_key === document.document_key,
                    )
                  }
                  onClick={() => attach(document)}
                >
                  {attachments.some(
                    (a) => a.document_key === document.document_key,
                  )
                    ? "Attached"
                    : "Attach"}
                </button>
              </div>
            ))}
          </section>
        )}
        <div className="composer">
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.txt,.md"
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
            aria-label="Upload PDF, text or Markdown document"
            disabled={
              disabled || uploading || isTyping || attachments.length >= 5
            }
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
                if (!uploading) onSend();
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
            disabled={disabled || uploading || isTyping || !input.trim()}
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
