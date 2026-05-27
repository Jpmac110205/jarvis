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
  
  const tasks: Task[] = useMemo(() => {
    return googleTasks.map((gt, index) => ({
      id: `google-${index}`,
      title: gt.title,
      due: gt.due,
      done: false, 
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
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    window.location.href = `${BACKEND_URL}/auth/google/login`;
  }

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-6 h-6 rounded-full border-2 border-[rgba(59,130,246,0.15)] border-t-[#3b82f6] animate-spin" />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center gap-6 border border-[rgba(59,130,246,0.15)] bg-[#0c0c10] rounded-[20px] m-6">
        <div className="w-12 h-12 bg-[rgba(59,130,246,0.05)] border border-[rgba(59,130,246,0.15)] rounded-2xl flex items-center justify-center text-xl">
          ✅
        </div>
        <div>
          <h3 className="font-['Syne'] font-extrabold text-xl text-[#f0f0f5] mb-2">Secure Task Sync</h3>
          <p className="text-sm text-[#7a7a8c] leading-relaxed max-w-xs font-light">
            Connect to Google Tasks to manage your trajectory and daily objectives within the Prodigy engine.
          </p>
        </div>
        <button
          onClick={connectGoogle}
          className="bg-[#3b82f6] text-white px-6 py-2.5 rounded-lg text-sm font-normal transition-all hover:bg-[#2563eb] shadow-[0_0_15px_rgba(59,130,246,0.2)]"
        >
          Connect Google
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 flex flex-col gap-6 overflow-y-auto scrollbar-thin max-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-['Syne'] font-extrabold text-2xl text-[#f0f0f5] tracking-tight">Tasks</h3>
          <p className="text-sm text-[#7a7a8c] font-light mt-0.5">Automated sync with Cloud Node.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold text-[#3b82f6] tracking-widest uppercase">{progress}% Complete</span>
            </div>
            <div className="h-[3px] w-24 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full bg-[#3b82f6] shadow-[0_0_8px_#3b82f6]" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="text-[10px] font-bold tracking-widest text-[#f0f0f5] bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg uppercase">
            {openCount} Pending
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-[#0c0c10] border border-white/5 rounded-xl w-fit">
        {["all", "open", "done"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as typeof filter)}
            className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
              filter === f
                ? "bg-[rgba(59,130,246,0.1)] text-[#3b82f6] border border-[rgba(59,130,246,0.2)]"
                : "text-[#7a7a8c] hover:text-[#f0f0f5]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Task List Container */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/5 rounded-2xl">
          <p className="text-sm text-[#7a7a8c] font-light italic">
            Zero logs found for current criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((t) => (
            <div
              key={t.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 group ${
                t.done
                  ? "bg-[#050507]/40 border-white/5 opacity-50"
                  : "bg-[#0c0c10] border-white/5 hover:border-[rgba(59,130,246,0.15)] shadow-xl"
              }`}
            >
              <div className="flex-1">
                <div
                  className={`text-sm font-medium tracking-wide transition-colors ${
                    t.done ? "line-through text-[#7a7a8c]" : "text-[#f0f0f5] group-hover:text-white"
                  }`}
                >
                  {t.title}
                </div>
                <div className="text-[10px] text-[#7a7a8c] mt-2 flex items-center gap-3">
                  {t.listTitle && (
                    <span className="font-bold tracking-widest uppercase text-[#3b82f6] bg-[rgba(59,130,246,0.05)] px-2 py-0.5 rounded border border-[rgba(59,130,246,0.1)]">
                      {t.listTitle}
                    </span>
                  )}
                  <span className="font-mono">Due: {t.due ? new Date(t.due).toLocaleDateString() : "unspecified"}</span>
                </div>
              </div>
              <div className="text-[10px] uppercase font-bold tracking-tighter text-white/20 italic rotate-90 sm:rotate-0">
                LOCKED
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}