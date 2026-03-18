import { useState as reactUseState } from 'react';
import { useGoogleConnection } from "../../contexts/GoogleConnectionProvider";
import { useState, useEffect } from "react";


export function ProfilePanel() {

  // With this — add a separate editable form state:
const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", title: "", location: "", system_prompt: "", chat_number: 0, task_number: 0, pdf_number: 0, picture_url: "" });
  const [nameEmailLocked, setNameEmailLocked] = useState(false);

useEffect(() => {
  const userId = localStorage.getItem('user_id');
  fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/status`, {
    credentials: 'include',
    headers: userId ? { 'X-User-ID': userId } : {}
  })
    .then(res => res.json())
    .then(data => {
  if (data.authenticated) {
    setUser(data.user);
    setForm({
      name: data.user.name || "",
      email: data.user.email || "",
      title: data.user.title || "",
      location: data.user.location || "",
      system_prompt: data.user.system_prompt || "",
      chat_number: data.user.chats_number || 0,
      task_number: data.user.tasks_number || 0,
      pdf_number: data.user.pdfs_number || 0,
      picture_url: data.user.picture_url || ""
    });
    // Lock name/email if both are present in DB
    if (data.user.name && data.user.email) {
      setNameEmailLocked(true);
    } else {
      setNameEmailLocked(false);
    }
  }
});
}, []);

  const [selectedModel, setSelectedModel] = useState<string>("gpt-5-mini");
  const [saveStatus, setSaveStatus] = useState<null | "success" | "error" | "saving">(null);

  const handleSaveChanges = async () => {
    if (!user?.id) return;
    setSaveStatus("saving");
    const userId = localStorage.getItem('user_id');
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'X-User-ID': userId } : {})
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setForm({
          name: data.display_name || "",
          email: data.email || "",
          title: data.title || "",
          location: data.location || "",
          system_prompt: data.system_prompt || "",
          chat_number: data.chats || 0,
          task_number: data.tasks || 0,
          pdf_number: data.pdfs || 0,
          picture_url: data.picture_url || ""
        });
        setSaveStatus("success");
        setTimeout(() => setSaveStatus(null), 2000);
      } else {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus(null), 2000);
      }
    } catch (e) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 2000);
    }
  };

  const modelInfo: Record<string, { label: string; cost: string; performance: string }>
 = {
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
        <div className="flex gap-2 items-center">
          <button
            className={
              `px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95 ` +
              (saveStatus === "success"
                ? "bg-green-600 text-white"
                : saveStatus === "error"
                ? "bg-red-600 text-white"
                : "bg-blue-600 hover:from-blue-500 hover:to-blue-400 text-white")
            }
            onClick={handleSaveChanges}
            disabled={saveStatus === "saving"}
          >
            {saveStatus === "saving"
              ? "Saving..."
              : saveStatus === "success"
              ? "Saved!"
              : saveStatus === "error"
              ? "Error"
              : "Save Changes"}
          </button>
          {saveStatus === "success" && (
            <span className="ml-2 text-green-400 text-sm">✓ Changes saved</span>
          )}
          {saveStatus === "error" && (
            <span className="ml-2 text-red-400 text-sm">Failed to save</span>
          )}
        </div>
      </div>

      {/* Top summary */}
      <section className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-5 shadow-lg backdrop-blur flex gap-4 items-center">

        <div className="flex-1 flex items-center gap-3">
          {user?.picture_url ? (
            <img
  src={user.picture_url}
  alt="Profile"
  referrerPolicy="no-referrer"
  className="w-12 h-12 rounded-full border border-neutral-700 shadow-md flex-shrink-0 object-cover"
  onError={(e) => console.log("Image failed:", user.picture, e)}
/>
          ) : (
            <div className="w-12 h-12 rounded-full bg-neutral-700 border border-neutral-600 flex items-center justify-center flex-shrink-0">
              <span className="text-neutral-300 text-lg font-semibold">
                {form.name?.charAt(0) || "?"}
              </span>
            </div>
          )}
          <div>
            <p className="text-sm text-neutral-400">Prodigy partner</p>
            <p className="text-lg font-semibold text-neutral-50">{form.name}</p>
            <p className="text-xs text-neutral-400">Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown"}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center text-sm text-neutral-300">
          <div className="rounded-xl border border-neutral-800/70 bg-neutral-800/40 px-3 py-2">
            <p className="text-xs text-neutral-400">Tasks</p>
            <p className="text-lg font-semibold text-neutral-50">{form.task_number}</p>
          </div>
          <div className="rounded-xl border border-neutral-800/70 bg-neutral-800/40 px-3 py-2">
            <p className="text-xs text-neutral-400">Chats</p>
            <p className="text-lg font-semibold text-neutral-50">{form.chat_number}</p>
          </div>
          <div className="rounded-xl border border-neutral-800/70 bg-neutral-800/40 px-3 py-2">
            <p className="text-xs text-neutral-400">PDFs</p>
            <p className="text-lg font-semibold text-neutral-50">{form.pdf_number}</p>
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
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Name"
                className="w-full bg-neutral-700/40 text-neutral-100 border border-neutral-600/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-neutral-500"
                disabled={nameEmailLocked}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="example@example.com"
                className="w-full bg-neutral-700/40 text-neutral-100 border border-neutral-600/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-neutral-500"
                disabled={nameEmailLocked}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">Role</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Role @ Example"
                className="w-full bg-neutral-700/40 text-neutral-100 border border-neutral-600/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-neutral-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
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
          onChange={(e) => setForm(f => ({ ...f, system_prompt: e.target.value }))}
          value={form.system_prompt}
          placeholder="E.g., You are an AI chatbot with ____ personality, specializing in _____ and _____."
          className="w-full h-32 bg-neutral-700/40 text-neutral-100 border border-neutal-600/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-neutral-500 resize-none font-mono text-sm"
        />
        </div>
        <ResetDataButton />
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
              <path fill="#EA4335" d="M24 9.5c3.27 0 6.2 1.13 8.52 3.35l6.36-6.36C34.9 2.47 29.86 0 24 0 14.64 0 6.4 5.38 2.52 13.22l7.53 5.85C11.62 13.07 17.27 9.5 24 9.5z" 
/>
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
                <path fill="#34A853" d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm0 36c-8.84 0-16-7.16-16-16s7.16-16 16-16 16 7.16 16 16-7.16 16-1616z" />
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
      <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 48 48" xmlns="http://www
.w3.org/2000/svg">
                <path fill="#34A853" d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.9
5 20-20S35.05 4 24 4zm0 36c-8.84 0-16-7.16-16-16s7.16-16 16-16 16 7.16 16 16-7.16 16-16
 16z" />
                <path fill="#34A853" d="M34.59 15.41l-11.3 11.3-5.88-5.88a2 2 0 10-2.83
 2.83l7.29 7.29a2 2 0 002.83 0l12.71-12.71a2 2 0 10-2.83-2.83z" />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
      <span>Apple ID Connected</span>
    </button>
    )
  }
}
function ResetDataButton() {

  async function handleReset() {
    const confirmed = window.confirm(
      "WARNING: Are you sure you want to delete your chat history? This will remove chat history, personality as well as stored PDF documents. This is irreversible."
    );
    if (!confirmed) return;

  }

  return (
    <button
      className="w-full py-3 px-4 rounded-xl border border-red-700/60 bg-neutral-800/60 hover:bg-neutral-800/80 text-red-500 font-semibold transition-all duration-200 shadow-sm hover:shadow-red-500/20 flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-neutral-900"
      type="button"
      onClick={handleReset}
    >
      <span>Reset All Data</span>
    </button>
  );
}

