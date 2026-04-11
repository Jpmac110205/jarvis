import { useLayoutEffect, useRef, useState, useEffect } from "react";
import type { Message } from "../../App";
import { PlusIcon, MicrophoneIcon } from '@heroicons/react/24/solid';
import React from "react";

export default function Chat({
  messages,
  input,
  onChange,
  onSend,
  isTyping = false,
}: {
  messages: Message[];
  input: string;
  onChange: (v: string) => void;
  onSend: () => void;
  isTyping?: boolean;
})
{

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
    // Client-side file type check
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
    <div className="flex-1 w-full max-w-3xl flex flex-col overflow-hidden">
      {uploadState === "loading" && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-neutral-700 text-white px-4 py-2 rounded shadow z-50 flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Uploading PDF...
        </div>
      )}
      {uploadState === "success" && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded shadow z-50">
          ✓ PDF uploaded successfully!
        </div>
      )}
      {uploadState === "error" && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow z-50">
          ✗ {uploadError}
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

/* --------- Internal components (not exported) --------- */

function ChatPanel({ messages, isTyping }: { messages: Message[]; isTyping: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Always stick to bottom when messages change (chat-like behavior).
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
    <div ref={containerRef} className="flex-1 px-6 py-6 overflow-y-auto space-y-6 scrollbar-thin">
      {messages.map((msg) => (
        <div key={msg.id} className="w-full animate-in fade-in slide-in-from-bottom-2 duration-200">
          {msg.author === 'user' ? (
            <div className="flex justify-center">
              <div className="max-w-2xl w-full bg-gradient-to-r from-neutral-800/40 to-neutral-800/30 border border-neutral-700/30 rounded-lg px-5 py-3 text-sm text-neutral-100 shadow-sm transform transition hover:scale-[1.01]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="px-2 py-1 rounded-md bg-blue-600 text-white text-xs font-medium shadow-sm">You</div>
                    <div className="text-xs text-neutral-400">{msg.timestamp}</div>
                  </div>
                </div>
                <div className="mt-3 whitespace-pre-wrap text-sm">{msg.content}</div>
              </div>
            </div>
          ) : (
            <div className="flex justify-start">
              <div className="relative max-w-3xl w-full">
                <div className="absolute left-0 top-0 h-full w-1 rounded-l-md bg-blue-600 shadow-md opacity-90" />
                <div className="pl-4 pr-5 pb-5 pt-4 bg-neutral-900/75 border border-neutral-800 rounded-r-lg ml-3 shadow-lg transform transition hover:scale-[1.01] hover:shadow-2xl">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-neutral-800/20 to-neutral-700/20 flex items-center justify-center ring-1 ring-neutral-800 overflow-hidden p-0">
                        <img src="/prodigyp.png" alt="Prodigy" className="h-9 w-9 object-cover" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Prodigy</div>
                        <div className="text-xs text-neutral-400">{msg.timestamp}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="text-xs text-neutral-300 hover:text-white transition px-2 py-1 rounded-md bg-neutral-800/30 hover:bg-neutral-800/40"
                      >
                        {copiedId === msg.id.toString() ? 'Copied' : 'Copy'}
                      </button>
                      <button className="text-xs text-neutral-300 hover:text-white transition px-2 py-1 rounded-md bg-neutral-800/30 hover:bg-neutral-800/40">Reply</button>
                    </div>
                  </div>
                  <div className="mt-4 text-sm leading-relaxed whitespace-pre-wrap text-neutral-100">
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

function ChatInput({ input, onChange, onSend, handleUpload, uploadState }: { input: string; onChange: (v: string) => void; onSend: () => void; handleUpload: (file: File) => void; uploadState: "idle" | "loading" | "success" | "error"; }) {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useLayoutEffect(() => {
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
    <footer className="px-6 py-3 bg-neutral-900/30 backdrop-blur-sm border-t border-neutral-800/50">
      <div className="flex items-center gap-3 bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/40 rounded-2xl px-4 py-3 shadow-lg focus-within:border-blue-600/50 focus-within:ring-2 focus-within:ring-blue-600/20 transition-all">
        {/* Input field (auto-resizing) */}
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
          placeholder="Type your message..."
          rows={1}
          style={{ height: "40px" }}
          className="flex-1 min-h-[40px] bg-transparent text-sm leading-5 outline-none placeholder:text-neutral-400 text-neutral-100 resize-none overflow-hidden py-1"
        />
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        {/* Add button */}
        <button
          type="button"
          disabled={uploadState === "loading"}
          className="p-2 rounded-xl bg-neutral-700/40 hover:bg-neutral-700/60 border border-transparent hover:border-blue-560/30 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add Attachment"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
        >
          <PlusIcon className="h-5 w-5 text-neutral-300 hover:text-blue-400 transition-colors" />
        </button>
        {/* Microphone input */}
        <button
          type="button"
          className="p-2 rounded-xl bg-neutral-700/40 hover:bg-neutral-700/60 border border-transparent hover:border-blue-600/30 transition-all duration-200 hover:scale-105"
          title="Record Voice"
        >
          <MicrophoneIcon className="h-5 w-5 text-neutral-300 hover:text-blue-400 transition-colors" />
        </button>
        {/* Send button */}
        <button
          onClick={onSend}
          disabled={!input.trim()}
          className="ml-2 px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 text-white shadow transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
        >
          Send
        </button>
      </div>
    </footer>
  );
}
function TypingIndicator() {
  return (
    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="max-w-3xl w-full bg-neutral-900/70 border border-neutral-800 rounded-lg p-5 shadow-md">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-full bg-neutral-800/30" />
          <div>
            <div className="h-3 w-32 rounded-md bg-neutral-800/40 mb-3" />
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}