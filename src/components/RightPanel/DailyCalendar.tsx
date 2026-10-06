import { ArrowPathIcon } from "@heroicons/react/24/outline";
import type { Section } from "../../App";
import { useGoogleData } from "../../contexts/useGoogleData";
import { connectGoogle } from "../../services/api";

export function DailyCalendar({
  onSelect,
}: {
  onSelect: (view: Section) => void;
}) {
  const {
    todayAgenda,
    tasks,
    user,
    loading,
    error,
    agendaError,
    tasksError,
    refresh,
  } = useGoogleData();
  const pending = tasks.filter((task) => !task.done);
  return (
    <div className="daily-overview">
      <div className="overview-heading">
        <div>
          <span className="eyebrow">At a glance</span>
          <h2>Your day</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Refresh daily overview"
          onClick={() => void refresh()}
          disabled={loading}
        >
          <ArrowPathIcon className={loading ? "animate-spin" : ""} />
        </button>
      </div>
      <p className="overview-date">
        {new Date().toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </p>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className="muted" role="status">
          Refreshing your overview…
        </p>
      ) : !user ? (
        <div className="overview-connect">
          <h3>Bring your day together</h3>
          <p>Sign in to see your schedule and reminders here.</p>
          <button className="button" onClick={connectGoogle}>
            Connect Google
          </button>
        </div>
      ) : (
        <>
          <section className="overview-section">
            <div className="section-heading">
              <h3>Today’s schedule</h3>
              <span>{todayAgenda.length}</span>
            </div>
            {agendaError && !todayAgenda.length ? (
              <p className="muted small">
                Schedule unavailable. Try refreshing.
              </p>
            ) : !todayAgenda.length ? (
              <p className="muted small">No events today. Room to focus.</p>
            ) : (
              todayAgenda.map((event) => (
                <div className="overview-event" key={event.id}>
                  <time>{event.time}</time>
                  <p>{event.event}</p>
                </div>
              ))
            )}
            <button
              className="text-button"
              onClick={() => onSelect("calendar")}
            >
              View calendar →
            </button>
          </section>
          <section className="overview-section">
            <div className="section-heading">
              <h3>Reminders</h3>
              <span>{pending.length}</span>
            </div>
            {tasksError && !pending.length ? (
              <p className="muted small">Tasks unavailable. Try refreshing.</p>
            ) : !pending.length ? (
              <p className="muted small">You’re caught up on pending tasks.</p>
            ) : (
              <ul className="reminder-list">
                {pending.slice(0, 4).map((task) => (
                  <li key={task.id}>
                    <span className="task-dot" />
                    <div>
                      <p>{task.title}</p>
                      <small>{task.listTitle}</small>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <button className="text-button" onClick={() => onSelect("tasks")}>
              View all tasks →
            </button>
          </section>
        </>
      )}
    </div>
  );
}
