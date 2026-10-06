import type { AgendaItem, GoogleEvent } from "../contexts/useGoogleData";
export const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function formatEvents(items: GoogleEvent[]): AgendaItem[] {
  return items.flatMap((event) => {
    const start = event.start?.dateTime || event.start?.date;
    if (!start) return [];
    const startDate = new Date(event.start?.dateTime || `${start}T00:00:00`);
    const endDate = new Date(
      event.end?.dateTime || `${event.end?.date || start}T00:00:00`,
    );
    if (Number.isNaN(startDate.getTime())) return [];
    const days: AgendaItem[] = [];
    const day = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
    );
    // All-day ends are exclusive. Timed events also appear on each day they overlap.
    do {
      days.push({
        id: `${event.id || start}:${dateKey(day)}`,
        date: dateKey(day),
        event: event.summary || "Untitled event",
        location: event.location,
        time: event.start?.dateTime
          ? startDate.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })
          : "All day",
      });
      day.setDate(day.getDate() + 1);
    } while (day < endDate && days.length < 366);
    return days;
  });
}
