import type { Message } from "../../App";
import { PlusIcon, MicrophoneIcon } from '@heroicons/react/24/solid';

export default function Chat({
  messages,
  input,
  onChange,
  onSend,
}: {
  messages: Message[];
  input: string;
  onChange: (v: string) => void;
  onSend: () => void;
}) {
  return (
    <div className="flex-1 w-full max-w-3xl flex flex-col overflow-hidden">
      <ChatPanel messages={messages} />
      <ChatInput input={input} onChange={onChange} onSend={onSend} />
    </div>
  );
}

/* --------- Internal components (not exported) --------- */
function ChatPanel({ messages }: { messages: Message[] }) {
  return (
    <div className="flex-1 px-4 py-2 overflow-y-auto space-y-6 scrollbar-thin">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex animate-in fade-in slide-in-from-bottom-2 duration-300 ${
            msg.author === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`rounded-2xl px-3 py-2 text-sm leading-relaxed max-w-[75%] shadow-lg backdrop-blur-sm ${
              msg.author === "user"
                ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white border border-blue-400/20"
                : "bg-neutral-800/60 border border-neutral-700/50 text-neutral-100"
            }`}
          >
            <p className="whitespace-pre-wrap">{msg.content}</p>
            <div className={`mt-2 text-[10px] ${
              msg.author === "user" ? "text-blue-100" : "text-neutral-400"
            } ${msg.author === "user" ? "text-right" : "text-left"}`}>
              {msg.timestamp}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatInput({
  input,
  onChange,
  onSend,
}: {
  input: string;
  onChange: (v: string) => void;
  onSend: () => void;
}) {
  return (
    <footer className="px-6 py-3 bg-neutral-900/30 backdrop-blur-sm border-t border-neutral-800/50">
      <div className="flex items-center gap-3 bg-neutral-800/60 backdrop-blur-sm border border-neutral-700/50 rounded-2xl px-4 py-3 shadow-xl focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
        {/* Input field */}
        <input
          value={input}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
          placeholder="Type your message..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-500 text-neutral-100"
        />
        {/* Add button */}
        <button
          type="button"
          className="p-2 rounded-xl bg-neutral-700/40 hover:bg-neutral-700/60 border border-transparent hover:border-blue-500/30 transition-all duration-200 hover:scale-105"
          title="Add Attachment"
        >
          <PlusIcon className="h-5 w-5 text-neutral-300 hover:text-blue-400 transition-colors" />
        </button>
        {/* Microphone input */}
        <button
          type="button"
          className="p-2 rounded-xl bg-neutral-700/40 hover:bg-neutral-700/60 border border-transparent hover:border-blue-500/30 transition-all duration-200 hover:scale-105"
          title="Record Voice"
        >
          <MicrophoneIcon className="h-5 w-5 text-neutral-300 hover:text-blue-400 transition-colors" />
        </button>
        {/* Send button */}
        <button
          onClick={onSend}
          disabled={!input.trim()}
          className="px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
        >
          Send
        </button>
      </div>
    </footer>
  );
}