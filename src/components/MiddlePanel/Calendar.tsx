import { useEffect, useState } from "react";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useGoogleData } from "../../contexts/useGoogleData";
import { dateKey, formatEvents } from "../../services/google";
import type { AgendaItem, GoogleEvent } from "../../contexts/useGoogleData";
import { apiRequest, connectGoogle } from "../../services/api";

export function CalendarPanel() {
  const { user, loading } = useGoogleData();
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const userId = user?.id;
  const [events, setEvents] = useState<AgendaItem[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!userId) return;
    let active = true;
    // These updates synchronize the requested month with remote data.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFetching(true);
    setError(null);
    setEvents([]);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    void apiRequest<{ items: GoogleEvent[] }>(
      `/events?time_min=${encodeURIComponent(month.toISOString())}&time_max=${encodeURIComponent(end.toISOString())}`,
    )
      .then((data) => {
        if (active) setEvents(formatEvents(data.items || []));
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Calendar couldn't be loaded.",
          );
      })
      .finally(() => {
        if (active) setFetching(false);
      });
    return () => {
      active = false;
    };
  }, [userId, month, revision]);
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const count = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const cells = Array.from(
    { length: Math.ceil((firstDay + count) / 7) * 7 },
    (_, index) =>
      index >= firstDay && index < count + firstDay
        ? new Date(month.getFullYear(), month.getMonth(), index - firstDay + 1)
        : null,
  );
  const selected = events.filter((event) => event.date === selectedDate);
  function moveMonth(offset: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(next);
    setSelectedDate(dateKey(next));
  }
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">A clearer view of your time</span>
          <h2>Calendar</h2>
          <p>Meetings, plans and room to think. Synced from Google Calendar.</p>
        </div>
        <a
          className="text-link"
          href="https://calendar.google.com"
          target="_blank"
          rel="noreferrer"
        >
          Open Google Calendar ↗
        </a>
      </div>
      {loading ? (
        <p className="muted" role="status">
          Loading your calendar…
        </p>
      ) : !user ? (
        <div className="surface empty-state">
          <CalendarDaysIcon />
          <h3>Your schedule, in context</h3>
          <p>
            Connect Google Calendar to see your events and ask Prodigy about
            your day.
          </p>
          <button className="button primary" onClick={connectGoogle}>
            Connect Google Calendar
          </button>
        </div>
      ) : (
        <>
          <section className="surface calendar-surface">
            <div className="calendar-toolbar">
              <h3>
                {month.toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <div className="button-group">
                <button
                  className="icon-button"
                  aria-label="Previous month"
                  onClick={() => moveMonth(-1)}
                >
                  <ChevronLeftIcon />
                </button>
                <button
                  className="button"
                  onClick={() => {
                    const today = new Date();
                    setMonth(
                      new Date(today.getFullYear(), today.getMonth(), 1),
                    );
                    setSelectedDate(dateKey(today));
                  }}
                >
                  Today
                </button>
                <button
                  className="icon-button"
                  aria-label="Next month"
                  onClick={() => moveMonth(1)}
                >
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
            {error && (
              <div className="notice error" role="alert">
                {error}
                <button
                  className="text-button"
                  onClick={() => setRevision((value) => value + 1)}
                >
                  Retry
                </button>
              </div>
            )}
            <div
              className="calendar-grid"
              aria-label="Days of the month"
              aria-busy={fetching}
            >
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <span className="day-label" key={day}>
                  {day}
                </span>
              ))}
              {cells.map((date, index) =>
                date ? (
                  <button
                    className={`calendar-day ${dateKey(date) === selectedDate ? "selected" : ""} ${dateKey(date) === dateKey(new Date()) ? "today" : ""}`}
                    key={dateKey(date)}
                    aria-pressed={dateKey(date) === selectedDate}
                    aria-label={`${date.toLocaleDateString(undefined, { dateStyle: "full" })}, ${events.filter((event) => event.date === dateKey(date)).length} events`}
                    onClick={() => setSelectedDate(dateKey(date))}
                  >
                    <span>{date.getDate()}</span>
                    {events.some((event) => event.date === dateKey(date)) && (
                      <span className="event-count">
                        {
                          events.filter((event) => event.date === dateKey(date))
                            .length
                        }
                        <span className="desktop-label"> events</span>
                      </span>
                    )}
                  </button>
                ) : (
                  <span className="calendar-blank" key={`blank-${index}`} />
                ),
              )}
            </div>
          </section>
          <section className="surface">
            <div className="calendar-toolbar">
              <h3>
                {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
                  undefined,
                  { weekday: "long", month: "long", day: "numeric" },
                )}
              </h3>
              <span className="badge">Read only</span>
            </div>
            {fetching ? (
              <p className="muted" role="status">
                Refreshing events…
              </p>
            ) : error ? (
              <p className="muted">Events are currently unavailable.</p>
            ) : selected.length === 0 ? (
              <div className="empty-state">
                <h3>A little breathing room</h3>
                <p>No events on this date.</p>
              </div>
            ) : (
              selected.map((event) => (
                <article className="agenda-row" key={event.id}>
                  <time>{event.time}</time>
                  <div>
                    <h4>{event.event}</h4>
                    {event.location && (
                      <p className="muted">{event.location}</p>
                    )}
                  </div>
                </article>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}
