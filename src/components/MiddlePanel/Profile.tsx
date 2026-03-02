import { useState as reactUseState } from 'react';
import { useGoogleConnection } from "../../contexts/GoogleConnectionProvider";
import { useState, useEffect } from "react";


export function ProfilePanel() {

  const [user, setUser] = useState<any>(null);
  const userId = 1; // replace with auth-based user later
   useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/users/${userId}`)
      .then(res => res.json())
      .then(data => setUser(data));
  }, []);
  const [selectedModel, setSelectedModel] = useState<string>("gpt-5-mini");

  const modelInfo: Record<string, { label: string; cost: string; performance: string }> = {
    "gpt-5-mini": { label: "GPT-5 mini", cost: "$0.003", performance: "Balanced: good quality with moderate latency." },
    "gpt-5-nano": { label: "GPT-5 nano", cost: "$0.0015", performance: "Very fast with smaller context and lighter accuracy." },
    "gpt-4o-mini": { label: "GPT-4o mini", cost: "$0.02", performance: "High throughput, strong for short-form tasks." },
    "gpt-4-1-mini": { label: "GPT-4.1 mini", cost: "$0.04", performance: "Highest quality, best for complex reasoning (higher latency)." },
  };
  
  return (
    <div className="w-full max-w-3xl px-6 py-6 flex flex-col gap-6 overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-semibold text-neutral-100">Profile</h2>
          <p className="text-sm text-neutral-400">Manage your account info, identity, and connections.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95">
            Save Changes
          </button>
        </div>
      </div>

      {/* Top summary */}
      <section className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-5 shadow-lg backdrop-blur flex gap-4 items-center">

        <div className="flex-1">
          <p className="text-sm text-neutral-400">Prodigy partner</p>
          <p className="text-lg font-semibold text-neutral-50">{user?.display_name || "Unknown"}</p>
          <p className="text-xs text-neutral-400">Joined NULL</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center text-sm text-neutral-300">
          <div className="rounded-xl border border-neutral-800/70 bg-neutral-800/40 px-3 py-2">
            <p className="text-xs text-neutral-400">Tasks</p>
            <p className="text-lg font-semibold text-neutral-50">NULL</p>
          </div>
          <div className="rounded-xl border border-neutral-800/70 bg-neutral-800/40 px-3 py-2">
            <p className="text-xs text-neutral-400">Chats</p>
            <p className="text-lg font-semibold text-neutral-50">NULL</p>
          </div>
          <div className="rounded-xl border border-neutral-800/70 bg-neutral-800/40 px-3 py-2">
            <p className="text-xs text-neutral-400">PDFs</p>
            <p className="text-lg font-semibold text-neutral-50">NULL</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <section className="bg-neutral-800/60 backdrop-blur-sm rounded-xl p-5 border border-neutral-700/50 flex flex-col gap-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wide">Account</h3>
            <span className="text-[11px] text-neutral-400">Public</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">Display name</label>
              <input
                type="text"
                placeholder="Name"
                className="w-full bg-neutral-700/40 text-neutral-100 border border-neutral-600/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-neutral-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">Email</label>
              <input
                type="email"
                placeholder="example@example.com"
                className="w-full bg-neutral-700/40 text-neutral-100 border border-neutral-600/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-neutral-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">Title</label>
              <input
                type="text"
                placeholder="Role @ Example"
                className="w-full bg-neutral-700/40 text-neutral-100 border border-neutral-600/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-neutral-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">Location</label>
              <input
                type="text"
                placeholder="Location"
                className="w-full bg-neutral-700/40 text-neutral-100 border border-neutral-600/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-neutral-500"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Connections */}
      <section className="bg-neutral-800/60 backdrop-blur-sm rounded-xl p-5 border border-neutral-700/50 flex flex-col gap-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wide">Connections</h3>
          <span className="text-[11px] text-neutral-400">OAuth</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <GoogleButton />
          <AppleButton />
        </div>
      </section>

      {/* Custom System Prompt */}
      <section className="bg-neutral-800/60 backdrop-blur-sm rounded-xl p-5 border border-neutral-700/50 flex flex-col gap-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wide">LLM Settings</h3>
          <span className="text-[11px] text-neutral-400">AI Behavior</span>
        </div>
        <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">Model Selection</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-neutral-700/40 text-neutral-100 border border-neutral-600/50 rounded-xl px-4 py-3 h-12 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-neutral-500"
              >
                <option value="gpt-5-mini">{modelInfo["gpt-5-mini"].label} — {modelInfo["gpt-5-mini"].cost} /1k</option>
                <option value="gpt-5-nano">{modelInfo["gpt-5-nano"].label} — {modelInfo["gpt-5-nano"].cost} /1k</option>
                <option value="gpt-4o-mini">{modelInfo["gpt-4o-mini"].label} — {modelInfo["gpt-4o-mini"].cost} /1k</option>
                <option value="gpt-4-1-mini">{modelInfo["gpt-4-1-mini"].label} — {modelInfo["gpt-4-1-mini"].cost} /1k</option>
              </select>
              <p className="text-xs text-neutral-400 mt-1">Estimated token cost: {modelInfo[selectedModel].cost} per 1k tokens</p>
              <p className="text-xs text-neutral-400 mt-1">Performance: {modelInfo[selectedModel].performance}</p>

          </div>
        <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">Custom System Prompt</label>
        <textarea
          placeholder="E.g., You are an AI chatbot with ____ personality, specializing in _____ and _____."
          className="w-full h-32 bg-neutral-700/40 text-neutral-100 border border-neutral-600/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-neutral-500 resize-none font-mono text-sm"
        />
        </div>
      </section>
    </div>
  );
}
function GoogleButton () {
  const { connectedToGoogle } = useGoogleConnection();
  if (!connectedToGoogle) {
    return (
     <button
        className="w-full py-3 px-4 rounded-xl border border-neutral-700/60 bg-neutral-800/60 hover:bg-neutral-800/80 text-neutral-50 font-semibold transition-all duration-200 shadow-sm hover:shadow-blue-500/20 flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-neutral-900"
        type="button"
        onClick={() => {
            window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/google/login`;
        }}
      >
            <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.27 0 6.2 1.13 8.52 3.35l6.36-6.36C34.9 2.47 29.86 0 24 0 14.64 0 6.4 5.38 2.52 13.22l7.53 5.85C11.62 13.07 17.27 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24.5c0-1.57-.14-3.09-.39-4.55H24v9.02h12.7c-.55 2.97-2.2 5.49-4.69 7.18l7.36 5.71C43.78 38.24 46.5 31.88 46.5 24.5z" />
              <path fill="#FBBC05" d="M10.05 28.07A14.5 14.5 0 019.5 24c0-1.4.24-2.76.55-4.07l-7.53-5.85A23.93 23.93 0 000 24c0 3.8.9 7.38 2.52 10.92l7.53-5.85z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.92-2.13 15.89-5.79l-7.36-5.71c-2.04 1.38-4.66 2.2-8.53 2.2-6.73 0-12.38-3.57-14.95-8.92l-7.53 5.85C6.4 42.62 14.64 48 24 48z" />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
            <span>Connect Google</span>
          </button>);  }
    else {
      return (
        <button
      className="w-full py-3 px-4 rounded-xl border border-green-700/60 bg-neutral-800/60 hover:bg-neutral-800/80 text-neutral-50 font-semibold transition-all duration-200 shadow-sm hover:shadow-blue-500/20 flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-neutral-900"
      type="button"
    >
              <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#34A853" d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm0 36c-8.84 0-16-7.16-16-16s7.16-16 16-16 16 7.16 16 16-7.16 16-16 16z" />
                <path fill="#34A853" d="M34.59 15.41l-11.3 11.3-5.88-5.88a2 2 0 10-2.83 2.83l7.29 7.29a2 2 0 002.83 0l12.71-12.71a2 2 0 10-2.83-2.83z" />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
              <span>Google Connected</span>
            </button>
      )
    }
}
function AppleButton() {
  const [connectedToApple] = reactUseState(false);

  if (!connectedToApple){
    return (
    <button
            className="w-full py-3 px-4 rounded-xl border border-neutral-700/60 bg-neutral-800/60 hover:bg-neutral-800/80 text-neutral-50 font-semibold transition-all duration-200 shadow-sm hover:shadow-blue-500/20 flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-neutral-900"
            type="button"
          >
            <svg aria-hidden="true" className="w-5 h-5 self-center transform -translate-y-1" viewBox="0 0 24 24" fill="currentColor" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.365 1.43c0 1.04-.4 2.02-1.13 2.75-.78.78-1.85 1.37-3.16 1.37-.06 0-.12 0-.18-.01.05-.43.09-.86.09-1.28C12.02 2.7 13.95.5 16.36.5v.93zM12.5 6.75c1.97 0 3.4 1.03 4.2 1.03.57 0 2.03-.92 3.43-.92.22 0 .33 0 .48.02-1.13 1.7-1.7 3.68-1.7 5.79 0 4.29 2.68 6.69 2.72 6.72-.03.09-.62 2.32-1.9 4.05C17.58 24.03 16 24.5 14.96 24.5c-1.04 0-1.89-.42-2.77-.42-.88 0-1.7.43-2.78.43-1.09 0-2.6-.47-3.94-2.08-1.49-1.79-2.41-4.66-2.41-7.49 0-3.2 1.62-4.92 3.66-4.92.88 0 1.78.66 2.72.66.86 0 1.77-.68 2.97-.68 1.21 0 2.3.69 3.28.69z"/>
            </svg>
            <span>Connect Apple ID</span>
          </button>
    );
  }
  else {
    return (
      <button
      className="w-full py-3 px-4 rounded-xl border border-green-700/60 bg-neutral-800/60 hover:bg-neutral-800/80 text-neutral-50 font-semibold transition-all duration-200 shadow-sm hover:shadow-blue-500/20 flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-neutral-900"
      type="button"
    >
      <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#34A853" d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm0 36c-8.84 0-16-7.16-16-16s7.16-16 16-16 16 7.16 16 16-7.16 16-16 16z" />
                <path fill="#34A853" d="M34.59 15.41l-11.3 11.3-5.88-5.88a2 2 0 10-2.83 2.83l7.29 7.29a2 2 0 002.83 0l12.71-12.71a2 2 0 10-2.83-2.83z" />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
      <span>Apple ID Connected</span>
    </button>
    )
  }
}

