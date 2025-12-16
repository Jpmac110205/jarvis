export function SettingsPanel() {
  return (
    <div className="w-full max-w-3xl px-6 py-6 flex flex-col gap-6 overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-neutral-100">Settings</h2>
        <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-105 active:scale-95">
          Save Changes
        </button>
      </div>

      {/* Theme Selection */}
      <section className="bg-neutral-800/60 backdrop-blur-sm rounded-xl p-5 border border-neutral-700/50 shadow-lg">
        <h3 className="text-sm font-semibold text-neutral-200 mb-4 uppercase tracking-wide">Theme</h3>
        <div className="flex gap-3">
          <button className="flex-1 py-3 bg-neutral-700/40 rounded-xl border border-neutral-600/50 text-neutral-200 hover:bg-neutral-700/60 hover:border-blue-500/30 transition-all duration-200 font-medium">
            Light
          </button>
          <button className="flex-1 py-3 bg-gradient-to-r from-blue-600/20 to-blue-500/10 rounded-xl border border-blue-500/30 text-white hover:from-blue-600/30 hover:to-blue-500/20 transition-all duration-200 font-medium shadow-lg shadow-blue-500/10">
            Dark
          </button>
          <button className="flex-1 py-3 bg-neutral-700/40 rounded-xl border border-neutral-600/50 text-neutral-200 hover:bg-neutral-700/60 hover:border-blue-500/30 transition-all duration-200 font-medium">
            System
          </button>
        </div>
      </section>

      {/* Model Selection */}
      <section className="bg-neutral-800/60 backdrop-blur-sm rounded-xl p-5 border border-neutral-700/50 shadow-lg">
        <h3 className="text-sm font-semibold text-neutral-200 mb-4 uppercase tracking-wide">AI Model</h3>
        <select className="w-full bg-neutral-700/40 text-neutral-100 border border-neutral-600/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all">
          <option>GPT-4</option>
          <option>Claude</option>
          <option>Gemini</option>
        </select>
      </section>

      {/* Notifications */}
      <section className="bg-neutral-800/60 backdrop-blur-sm rounded-xl p-5 border border-neutral-700/50 shadow-lg">
        <h3 className="text-sm font-semibold text-neutral-200 mb-4 uppercase tracking-wide">Notifications</h3>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 text-neutral-200 cursor-pointer group">
            <input type="checkbox" className="w-5 h-5 accent-blue-600 rounded cursor-pointer" />
            <span className="group-hover:text-neutral-100 transition-colors">Email notifications</span>
          </label>
          <label className="flex items-center gap-3 text-neutral-200 cursor-pointer group">
            <input type="checkbox" className="w-5 h-5 accent-blue-600 rounded cursor-pointer" />
            <span className="group-hover:text-neutral-100 transition-colors">Push notifications</span>
          </label>
          <label className="flex items-center gap-3 text-neutral-200 cursor-pointer group">
            <input type="checkbox" className="w-5 h-5 accent-blue-600 rounded cursor-pointer" />
            <span className="group-hover:text-neutral-100 transition-colors">Weekly summary</span>
          </label>
        </div>
      </section>
    </div>
  );
}
