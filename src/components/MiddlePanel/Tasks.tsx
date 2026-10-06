import { useState } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { useGoogleData } from "../../contexts/useGoogleData";
import { connectGoogle } from "../../services/api";

export function TasksPanel() {
  const {
    tasks,
    user,
    loading,
    tasksError,
    error: accountError,
    refresh,
  } = useGoogleData();
  const error = tasksError || (!user ? accountError : null);
  const [filter, setFilter] = useState<"all" | "open" | "done">("open");
  const pending = tasks.filter((task) => !task.done).length;
  const progress = tasks.length
    ? Math.round(((tasks.length - pending) / tasks.length) * 100)
    : 0;
  const filtered = tasks.filter(
    (task) => filter === "all" || (filter === "done" ? task.done : !task.done),
  );
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Keep things moving</span>
          <h2>Tasks</h2>
          <p>
            Your Google Tasks, together in one place. Changes are made in Google
            Tasks.
          </p>
        </div>
        <button
          className="button"
          disabled={loading}
          onClick={() => void refresh()}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className="muted" role="status">
          Loading your tasks…
        </p>
      ) : !user ? (
        <div className="surface empty-state">
          <CheckCircleIcon />
          <h3>Bring your tasks into focus</h3>
          <p>Connect Google to see due dates, task lists and completed work.</p>
          <button className="button primary" onClick={connectGoogle}>
            Connect Google
          </button>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat">
              <span>Pending</span>
              <strong>{pending}</strong>
            </div>
            <div className="stat">
              <span>Completed</span>
              <strong>{tasks.length - pending}</strong>
            </div>
            <div className="stat">
              <span>Completion</span>
              <strong>{progress}%</strong>
              <progress
                value={progress}
                max={100}
                aria-label="Task completion"
              />
            </div>
          </div>
          <div className="list-toolbar">
            <div className="segmented" aria-label="Filter tasks" role="group">
              {(["all", "open", "done"] as const).map((value) => (
                <button
                  key={value}
                  className={filter === value ? "selected" : ""}
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                >
                  {value === "all"
                    ? "All tasks"
                    : value === "open"
                      ? "Pending"
                      : "Completed"}
                </button>
              ))}
            </div>
            <a
              className="text-link"
              href="https://tasks.google.com"
              target="_blank"
              rel="noreferrer"
            >
              Open Google Tasks ↗
            </a>
          </div>
          <section className="surface task-list">
            {filtered.length ? (
              filtered.map((task) => (
                <article
                  className={`task-row ${task.done ? "completed" : ""}`}
                  key={task.id}
                >
                  <CheckCircleIcon />
                  <div>
                    <h3>{task.title}</h3>
                    <p>
                      <span>{task.listTitle}</span>
                      {task.due && (
                        <span>
                          Due{" "}
                          {new Date(
                            `${task.due.slice(0, 10)}T00:00:00`,
                          ).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="badge">
                    {task.done ? "Completed" : "Pending"}
                  </span>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <h3>
                  {filter === "done"
                    ? "No completed tasks yet"
                    : "Nothing on this list"}
                </h3>
                <p>
                  {error
                    ? "Refresh your Google connection to load tasks."
                    : "Tasks matching this filter will appear here."}
                </p>
              </div>
            )}
          </section>
          <p className="muted small">
            Google access is read only. Task status and deadlines are synced
            from your account.
          </p>
        </>
      )}
    </div>
  );
}
