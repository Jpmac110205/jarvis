import { useMemo, useState } from "react";
import { useGoogleData } from "../../contexts/GoogleDataProvider.tsx";

export interface Task {
  id: string | number;
  title: string;
  due?: string;
  done: boolean;
  listTitle?: string;
}

export function TasksPanel() {
  const { tasks: googleTasks, connected, loading } = useGoogleData();
  
  // Convert Google tasks to our Task format
  const tasks: Task[] = useMemo(() => {
    return googleTasks.map((gt, index) => ({
      id: `google-${index}`, // Use index since Google tasks might not have IDs
      title: gt.title,
      due: gt.due,
      done: false, // Google Tasks API returns completion status - you may need to adjust this
      listTitle: gt.listTitle,
    }));
  }, [googleTasks]);

  const [filter, setFilter] = useState<"all" | "open" | "done">("all");

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filter === "open" && t.done) return false;
      if (filter === "done" && !t.done) return false;
      return true;
    });
  }, [tasks, filter]);

  const openCount = tasks.filter((t) => !t.done).length;
  const progress = tasks.length ? Math.round(((tasks.length - openCount) / tasks.length) * 100) : 0;

  function connectGoogle() {
    window.location.href = "https://prodigyaiassistant.onrender.com/auth/google/login";
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-neutral-400">Loading tasks...</p>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-4">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-neutral-100 mb-2">Tasks</h3>
          <p className="text-sm text-neutral-400 mb-4">
            Connect your Google account to view your tasks.
          </p>
        </div>
        <button
          onClick={connectGoogle}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          Connect Google
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6 overflow-y-auto scrollbar-thin">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-neutral-100">Tasks</h3>
          <p className="text-sm text-neutral-400">Your Google Tasks synced automatically.</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2 text-neutral-300">
            <span className="h-2 w-16 rounded-full bg-neutral-800 overflow-hidden">
              <span className="block h-2 bg-blue-500" style={{ width: `${progress}%` }} />
            </span>
            <span className="text-neutral-400">{progress}% done</span>
          </div>
          <div className="text-sm text-neutral-300 bg-neutral-800/40 px-3 py-1.5 rounded-full border border-neutral-700/50">
            {openCount} open
          </div>
        </div>
      </div>

      <div className="flex gap-2 text-xs">
        {["all", "open", "done"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as typeof filter)}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              filter === f
                ? "border-blue-500/50 bg-blue-500/15 text-blue-50"
                : "border-neutral-700/60 bg-neutral-800/40 text-neutral-300 hover:border-blue-500/30"
            }`}
          >
            {f === "all" ? "All" : f === "open" ? "Open" : "Done"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-neutral-500">
            {filter === "all" 
              ? "No tasks found in your Google Tasks." 
              : filter === "open"
              ? "No open tasks."
              : "No completed tasks."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <div
              key={t.id}
              className={`flex items-center justify-between p-4 rounded-xl border backdrop-blur-sm transition-all duration-200 hover:shadow-lg ${
                t.done
                  ? "bg-neutral-800/30 border-neutral-700/30 opacity-75"
                  : "bg-neutral-800/60 border-neutral-700/50 hover:border-blue-500/30"
              }`}
            >
              <div className="flex-1">
                <div
                  className={`font-medium ${
                    t.done ? "line-through text-neutral-500" : "text-neutral-100"
                  }`}
                >
                  {t.title}
                </div>
                <div className="text-xs text-neutral-400 mt-1 flex items-center gap-2">
                  {t.listTitle && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] border border-neutral-700/60 text-neutral-300">
                      {t.listTitle}
                    </span>
                  )}
                  <span>Due: {t.due ? new Date(t.due).toLocaleDateString() : "No due date"}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="px-4 py-2 rounded-lg text-xs text-neutral-400 italic">
                  Read-only
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}