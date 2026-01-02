import { useState } from "react";

export function SettingsPanel() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark");
  const [model, setModel] = useState("gpt-4");
  const [email, setEmail] = useState(true);
  const [push, setPush] = useState(true);
  const [weekly, setWeekly] = useState(false);
  const [compact, setCompact] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [retention, setRetention] = useState<"7" | "30" | "90">("30");

  const ThemeButton = ({ value, label }: { value: typeof theme; label: string }) => {
    const isActive = theme === value;
    return (
      <button
        onClick={() => setTheme(value)}
        className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all duration-200
          ${isActive
            ? "bg-gradient-to-r from-blue-600/30 to-blue-500/20 text-white border-blue-500/40 shadow-lg shadow-blue-500/15"
            : "bg-neutral-700/40 text-neutral-200 border-neutral-600/60 hover:border-blue-500/30 hover:bg-neutral-700/60"}
        `}
      >
        {label}
      </button>
    );
  };

  const Toggle = ({
    label,
    checked,
    onChange,
    description,
  }: {
    label: string;
    checked: boolean;
    onChange: () => void;
    description?: string;
  }) => (
    <button
      type="button"
      onClick={onChange}
      className="flex items-center justify-between w-full rounded-xl border border-neutral-700/60 bg-neutral-800/50 px-4 py-3 transition-all hover:border-blue-500/30 hover:-translate-y-[1px]"
    >
      <div className="text-left">
        <p className="text-sm font-semibold text-neutral-50">{label}</p>
        {description ? <p className="text-xs text-neutral-400">{description}</p> : null}
      </div>
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-blue-500" : "bg-neutral-600"
        }`}
        aria-label={label}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );

  return (
    <div className="w-full max-w-3xl px-6 py-6 flex flex-col gap-6 overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-semibold text-neutral-100">Settings</h2>
          <p className="text-sm text-neutral-400">Personalize your workspace and assistant behavior.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-xl border border-neutral-700/60 text-neutral-200 hover:border-blue-500/30 hover:text-white transition-all">
            Reset
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-105 active:scale-95">
            Save Changes
          </button>
        </div>
      </div>

      {/* Theme */}
      <section className="bg-neutral-800/60 backdrop-blur-sm rounded-xl p-5 border border-neutral-700/50 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wide">Appearance</h3>
            <p className="text-xs text-neutral-400">Choose how Prodigy looks on your device.</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-neutral-700/70 text-neutral-200 border border-neutral-600/60">
            Current: {theme}
          </span>
        </div>
        <div className="flex gap-3">
          <ThemeButton value="light" label="Light" />
          <ThemeButton value="dark" label="Dark" />
          <ThemeButton value="system" label="System" />
        </div>
      </section>

      {/* Model & quality */}
      <section className="bg-neutral-800/60 backdrop-blur-sm rounded-xl p-5 border border-neutral-700/50 shadow-lg flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wide">AI Model</h3>
            <p className="text-xs text-neutral-400">Balance quality and speed.</p>
          </div>
          <span className="text-[11px] text-neutral-400">Labs</span>
        </div>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full bg-neutral-700/40 text-neutral-100 border border-neutral-600/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
        >
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-4o">GPT-4o</option>
          <option value="claude">Claude 3</option>
          <option value="gemini">Gemini 1.5</option>
        </select>
        <div className="grid grid-cols-2 gap-3 text-xs text-neutral-400">
          <div className="rounded-lg border border-neutral-700/60 bg-neutral-800/50 p-3">
            <p className="text-neutral-200 font-semibold text-sm">Quality</p>
            <p>Better reasoning, slightly slower.</p>
          </div>
          <div className="rounded-lg border border-neutral-700/60 bg-neutral-800/50 p-3">
            <p className="text-neutral-200 font-semibold text-sm">Speed</p>
            <p>Use for rapid drafts and iteration.</p>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-neutral-800/60 backdrop-blur-sm rounded-xl p-5 border border-neutral-700/50 shadow-lg flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wide">Notifications</h3>
            <p className="text-xs text-neutral-400">Stay in the loop about updates and tasks.</p>
          </div>
          <button className="text-xs text-blue-200 hover:text-white underline underline-offset-4 transition-colors">
            Send test
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <Toggle
            label="Email alerts"
            description="Mentions, assignments, and weekly summaries."
            checked={email}
            onChange={() => setEmail((v) => !v)}
          />
          <Toggle
            label="Push notifications"
            description="Realtime updates to your device."
            checked={push}
            onChange={() => setPush((v) => !v)}
          />
          <Toggle
            label="Weekly digest"
            description="Curated highlights delivered every Monday."
            checked={weekly}
            onChange={() => setWeekly((v) => !v)}
          />
        </div>
      </section>

      {/* Productivity */}
      <section className="bg-neutral-800/60 backdrop-blur-sm rounded-xl p-5 border border-neutral-700/50 shadow-lg flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wide">Productivity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Toggle
            label="Compact UI"
            description="Tighter spacing for dense information."
            checked={compact}
            onChange={() => setCompact((v) => !v)}
          />
          <Toggle
            label="Auto-save drafts"
            description="Keep unsent messages and edits for 48 hours."
            checked={autoSave}
            onChange={() => setAutoSave((v) => !v)}
          />
        </div>
      </section>

      {/* Data & privacy */}
      <section className="bg-neutral-800/60 backdrop-blur-sm rounded-xl p-5 border border-neutral-700/50 shadow-lg flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wide">Data & Privacy</h3>
            <p className="text-xs text-neutral-400">Control retention and local cache.</p>
          </div>
          <span className="text-[11px] text-neutral-400">Client-side</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          {["7", "30", "90"].map((v) => (
            <button
              key={v}
              onClick={() => setRetention(v as "7" | "30" | "90")}
              className={`rounded-lg border px-3 py-2 transition-all ${
                retention === v
                  ? "border-blue-500/50 bg-blue-500/15 text-blue-50 shadow-blue-500/10 shadow"
                  : "border-neutral-700/60 bg-neutral-800/40 text-neutral-200 hover:border-blue-500/30"
              }`}
            >
              {v} days
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-red-100">Clear cached data</p>
            <p className="text-xs text-red-200/80">Removes local history and preferences.</p>
          </div>
          <button className="px-3 py-1.5 text-xs rounded-lg border border-red-400/60 text-red-100 hover:bg-red-500/20 transition-all">
            Clear now
          </button>
        </div>
      </section>
    </div>
  );
}
