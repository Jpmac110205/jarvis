import { useMemo, useState } from "react";

export interface Task {
  id: string | number;
  title: string;
  due?: string;
  done: boolean;
}

export function TasksPanel() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: "Finish OS assignment", due: "2026-01-09", done: false },
  ]);

  const [newTask, setNewTask] = useState<string>("");
  const [newDue, setNewDue] = useState<string>("");
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const [priority, setPriority] = useState<"medium" | "high" | "low">("medium");

  function addTask(title: string, due?: string) {
    setTasks((t) => [...t, { id: Date.now(), title, due, done: false }]);
  }

  function toggleTask(id: string | number) {
    setTasks((t) =>
      t.map((x) => (x.id === id ? { ...x, done: !x.done } : x))
    );
  }

  const handleAddTask = () => {
    if (!newTask) return;
    addTask(newTask, newDue || undefined);
    setNewTask("");
    setNewDue("");
  };

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filter === "open" && t.done) return false;
      if (filter === "done" && !t.done) return false;
      return true;
    });
  }, [tasks, filter]);

  const openCount = tasks.filter((t) => !t.done).length;
  const progress = tasks.length ? Math.round(((tasks.length - openCount) / tasks.length) * 100) : 0;

  return (
    <div className="p-6 flex flex-col gap-6 overflow-y-auto scrollbar-thin">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-neutral-100">Tasks</h3>
          <p className="text-sm text-neutral-400">Track what's next and mark progress.</p>
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

      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
          placeholder="New task..."
          className="flex-1 rounded-xl border border-neutral-700/50 bg-neutral-800/40 backdrop-blur-sm px-4 py-2.5 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
        />
        <input
          value={newDue}
          onChange={(e) => setNewDue(e.target.value)}
          type="date"
          className="rounded-xl border border-neutral-700/50 bg-neutral-800/40 backdrop-blur-sm px-4 py-2.5 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as typeof priority)}
          className="rounded-xl border border-neutral-700/50 bg-neutral-800/40 backdrop-blur-sm px-3 py-2.5 text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button
          onClick={handleAddTask}
          disabled={!newTask.trim()}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium shadow-lg shadow-blue-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
        >
          Add
        </button>
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
                <span className="px-2 py-0.5 rounded-full text-[11px] border border-neutral-700/60 text-neutral-300">
                  {priority === "high" ? "High" : priority === "low" ? "Low" : "Medium"}
                </span>
                <span>Due: {t.due ?? "No due date"}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toggleTask(t.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-105 active:scale-95 ${
                  t.done
                    ? "bg-neutral-700/50 hover:bg-neutral-700 text-neutral-300"
                    : "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg shadow-green-500/25"
                }`}
              >
                {t.done ? "Undo" : "Done"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
