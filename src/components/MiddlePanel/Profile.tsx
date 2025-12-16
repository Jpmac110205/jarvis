export function ProfilePanel() {
  return (
    <div className="w-full max-w-3xl px-6 py-6 flex flex-col gap-6 overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-neutral-100">Profile</h2>
        <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-105 active:scale-95">
          Save Changes
        </button>
      </div>

      {/* Profile Info */}
      <section className="bg-neutral-800/60 backdrop-blur-sm rounded-xl p-6 border border-neutral-700/50 flex flex-col gap-5 shadow-lg">
        <div>
          <label className="text-sm font-medium text-neutral-300 mb-2 block">Name</label>
          <input
            type="text"
            placeholder="Your Name"
            className="w-full bg-neutral-700/40 text-neutral-100 border border-neutral-600/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-neutral-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-300 mb-2 block">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full bg-neutral-700/40 text-neutral-100 border border-neutral-600/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-neutral-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-300 mb-2 block">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full bg-neutral-700/40 text-neutral-100 border border-neutral-600/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-neutral-500"
          />
        </div>

        {/* Account actions */}
        <div className="flex flex-col gap-3 mt-2 pt-4 border-t border-neutral-700/50">
          <button className="w-full py-3 px-4 bg-neutral-700/40 rounded-xl hover:bg-neutral-700/60 border border-neutral-600/50 hover:border-blue-500/30 transition-all duration-200 text-left text-neutral-100 font-medium">
            API Keys
          </button>
          <button className="w-full py-3 px-4 bg-gradient-to-r from-red-600/20 to-red-500/10 rounded-xl hover:from-red-600/30 hover:to-red-500/20 border border-red-500/30 hover:border-red-500/50 transition-all duration-200 text-left text-red-400 font-medium shadow-lg shadow-red-500/10">
            Delete Account
          </button>
        </div>
      </section>
    </div>
  );
}
