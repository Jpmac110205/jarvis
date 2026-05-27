import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { PlusIcon, MicrophoneIcon } from "@heroicons/react/24/solid";


export type ChatMessage = {
  id: number;
  author: "user" | "bot";
  content: string;
  timestamp: string;
};

export default function Chat({
  messages,
  input,
  onChange,
  onSend,
  isTyping = false,
}: {
  messages: ChatMessage[];
  input: string;
  onChange: (v: string) => void;
  onSend: () => void;
  isTyping?: boolean;
}) {
  const [uploadState, setUploadState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [uploadError, setUploadError] = useState<string>("");

  useEffect(() => {
    if (uploadState === "success" || uploadState === "error") {
      const timer = setTimeout(() => {
        setUploadState("idle");
        setUploadError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [uploadState]);

  const handleUpload = async (file: File) => {
    if (!file.name.endsWith(".pdf")) {
      setUploadError("Only PDF files are supported.");
      setUploadState("error");
      return;
    }

    setUploadState("loading");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Unknown error" }));
        setUploadError(errorData.detail || `Upload failed (${res.status})`);
        setUploadState("error");
      } else {
        setUploadState("success");
      }
    } catch (e) {
      setUploadError("Network error — could not reach server.");
      setUploadState("error");
    }
  };

  return (
    <div className="flex-1 w-full max-w-3xl flex flex-col overflow-hidden relative">
      {/* Toast notifications restyled to match Prodigy premium notifications */}
      {uploadState === "loading" && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-[#0c0c10] border border-[rgba(59,130,246,0.3)] text-[#f0f0f5] px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-slide-down">
          <div className="w-4 h-4 rounded-full border-2 border-[rgba(59,130,246,0.15)] border-t-[#3b82f6] animate-spin" />
          <span className="text-xs font-medium tracking-wide">Syncing vector embeddings...</span>
        </div>
      )}
      {uploadState === "success" && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-[#0c0c10] border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 animate-slide-down">
          <span className="text-sm font-semibold">✓</span>
          <span className="text-xs font-medium tracking-wide">PDF registered in knowledge base permanently.</span>
        </div>
      )}
      {uploadState === "error" && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-[#0c0c10] border border-red-500/30 text-red-400 px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 animate-slide-down">
          <span className="text-sm font-semibold">✗</span>
          <span className="text-xs font-medium tracking-wide">{uploadError}</span>
        </div>
      )}
      
      <ChatPanel messages={messages} isTyping={isTyping} />
      <ChatInput
        input={input}
        onChange={onChange}
        onSend={onSend}
        handleUpload={handleUpload}
        uploadState={uploadState}
      />
    </div>
  );
}

/* --------- Chat Panel Frame (Internal) --------- */
function ChatPanel({ messages, isTyping }: { messages: ChatMessage[]; isTyping: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [messages.length, isTyping]);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!copiedId) return;
    const t = setTimeout(() => setCopiedId(null), 1500);
    return () => clearTimeout(t);
  }, [copiedId]);

  const handleCopy = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id.toString());
    } catch (e) {
      console.warn('copy failed', e);
    }
  };

  return (
    <div ref={containerRef} className="flex-1 px-6 py-8 overflow-y-auto space-y-6 scrollbar-thin">
      {messages.map((msg) => (
        <div key={msg.id} className="w-full animate-[fadeUp_0.4s_ease_both]">
          {msg.author === 'user' ? (
            <div className="flex justify-end">
              <div className="max-w-[85%] bg-[rgba(59,130,246,0.06)] border border-[rgba(59,130,246,0.18)] rounded-2xl px-5 py-3.5 text-sm text-[#f0f0f5] shadow-sm font-light leading-relaxed">
                <div className="flex items-center gap-3 mb-2 opacity-50">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[#3b82f6]">Secure Node</div>
                  <div className="text-[9px] font-mono">{msg.timestamp}</div>
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ) : (
            <div className="flex justify-start">
              <div className="relative max-w-[90%] w-full">
                {/* Visual anchor line to match Prodigy cyber look */}
                <div className="absolute left-0 top-0 h-full w-[1.5px] bg-gradient-to-b from-[#3b82f6] to-transparent opacity-60" />
                
                <div className="pl-6 pr-5 pb-5 pt-4 bg-[#0c0c10]/40 border border-white/5 rounded-r-2xl ml-3 shadow-xl transition-all hover:bg-[#0c0c10]/60 hover:border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="h-9 w-9 rounded-xl bg-[rgba(59,130,246,0.06)] border border-[rgba(59,130,246,0.15)] flex items-center justify-center p-0.5">
                        <img src="/prodigyp.png" alt="Prodigy Logo" className="h-full w-full object-contain rounded-lg" onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }} />
                        <span className="font-['Syne'] font-extrabold text-[#3b82f6] text-sm">P</span>
                      </div>
                      <div>
                        <div className="text-sm font-['Syne'] font-bold text-[#f0f0f5]">PRODIGY.</div>
                        <div className="text-[9px] text-[#7a7a8c] font-mono">{msg.timestamp}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="text-[10px] tracking-wide text-[#7a7a8c] hover:text-[#f0f0f5] transition px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/5"
                      >
                        {copiedId === msg.id.toString() ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 text-sm leading-relaxed whitespace-pre-wrap text-[#c8c8d4] font-light">
                    {msg.content}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
      {isTyping && <TypingIndicator />}
    </div>
  );
}

/* --------- Chat Input Bar (Internal) --------- */
function ChatInput({
  input,
  onChange,
  onSend,
  handleUpload,
  uploadState,
}: {
  input: string;
  onChange: (v: string) => void;
  onSend: () => void;
  handleUpload: (file: File) => void;
  uploadState: "idle" | "loading" | "success" | "error";
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useLayoutEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.max(ta.scrollHeight, 40)}px`;
  }, [input]);

  function handleInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const ta = e.currentTarget;
    ta.style.height = "auto";
    ta.style.height = `${Math.max(ta.scrollHeight, 40)}px`;
    onChange(ta.value);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUpload(files[0]);
      e.target.value = "";
    }
  }

  return (
    <footer className="px-6 py-4 bg-[#050507]/80 backdrop-blur-md border-t border-[rgba(59,130,246,0.15)]">
      <div className="flex items-center gap-3 bg-[#0c0c10] border border-[rgba(59,130,246,0.15)] rounded-2xl px-4 py-3 shadow-2xl focus-within:border-[rgba(59,130,246,0.45)] focus-within:shadow-[0_0_20px_rgba(59,130,246,0.06)] transition-all duration-300">
        
        {/* Attachment input hidden */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        
        {/* Content insertion button */}
        <button
          type="button"
          disabled={uploadState === "loading"}
          className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-[rgba(59,130,246,0.15)] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
          title="Add PDF context permanent memory"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
        >
          <PlusIcon className="h-4 w-4 text-[#7a7a8c] hover:text-[#3b82f6] transition-colors" />
        </button>

        {/* Dynamic growing text input container */}
        <textarea
          ref={textareaRef}
          value={input}
          onInput={handleInput}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Ask Prodigy about your calendar, tasks or memory..."
          rows={1}
          style={{ height: "40px" }}
          className="flex-1 min-h-[40px] max-h-[160px] bg-transparent text-sm leading-6 outline-none placeholder:text-[#7a7a8c] text-[#f0f0f5] font-light resize-none overflow-y-auto py-1 scrollbar-none"
        />

        {/* Custom Dictation controls */}
        <button
          type="button"
          className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-[rgba(59,130,246,0.15)] transition-all duration-200 flex-shrink-0"
          title="Transcribe interface"
        >
          <MicrophoneIcon className="h-4 w-4 text-[#7a7a8c] hover:text-[#3b82f6] transition-colors" />
        </button>

        {/* Submission module */}
        <button
          onClick={onSend}
          disabled={!input.trim()}
          className="ml-1 px-5 py-2.5 text-xs tracking-wide uppercase font-semibold rounded-xl bg-[#3b82f6] text-white shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all duration-200 disabled:opacity-30 disabled:shadow-none hover:bg-[#2563eb] disabled:cursor-not-allowed flex-shrink-0"
        >
          Send
        </button>
      </div>
    </footer>
  );
}

/* --------- Loading Indicator (Internal) --------- */
function TypingIndicator() {
  return (
    <div className="flex justify-start animate-pulse">
      <div className="max-w-[400px] w-full bg-[#0c0c10]/40 border border-white/5 rounded-2xl p-4 ml-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 rounded-lg bg-white/5 animate-pulse" />
          <div className="flex gap-1.5 items-center">
            <span className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}