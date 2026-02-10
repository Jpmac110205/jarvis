import { createContext, useContext, useEffect, useState } from "react";

type AgendaItem = {
  time: string;
  event: string;
  date: string;
};

type TaskItem = {
  title: string;
  due?: string;
  listTitle?: string;
};

type GoogleDataContextType = {
  agenda: AgendaItem[];
  todayAgenda: AgendaItem[];
  tasks: TaskItem[];
  connected: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
};

interface GoogleEvent {
  start?: {
    dateTime?: string;
    date?: string;
  };
  summary?: string;
}

const GoogleDataContext = createContext<GoogleDataContextType | null>(null);

export function GoogleDataProvider({ children }: { children: React.ReactNode }) {
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [todayAgenda, setTodayAgenda] = useState<AgendaItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchAll() {
    setLoading(true);
    try {
      // Get user_id from localStorage
      const userId = localStorage.getItem('user_id');
      
      const headers: HeadersInit = {};
      
      // Add user_id header if available
      if (userId) {
        headers['X-User-ID'] = userId;
      }

      const [eventsRes, tasksRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_URL}/events`, { 
          credentials: "include",
          headers 
        }),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/tasks`, { 
          credentials: "include",
          headers 
        }),
      ]);

      if (eventsRes.status === 401 || tasksRes.status === 401) {
        setConnected(false);
        setAgenda([]);
        setTodayAgenda([]);
        setTasks([]);
        // Clear stored user_id if unauthorized
        localStorage.removeItem('user_id');
        return;
      }

      const eventsData = await eventsRes.json();
      const tasksData = await tasksRes.json();

      const { allEvents, todayEvents } = formatEvents(eventsData.items || []);
      setAgenda(allEvents);
      setTodayAgenda(todayEvents);
      setTasks(formatTasks(tasksData.items || []));
      setConnected(true);
    } catch (err) {
      console.error("❌ Google data fetch failed:", err);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  return (
    <GoogleDataContext.Provider
      value={{ agenda, todayAgenda, tasks, connected, loading, refresh: fetchAll }}
    >
      {children}
    </GoogleDataContext.Provider>
  );
}

export function useGoogleData() {
  const ctx = useContext(GoogleDataContext);
  if (!ctx) {
    throw new Error("useGoogleData must be used within GoogleDataProvider");
  }
  return ctx;
}

function formatEvents(items: GoogleEvent[]): { allEvents: AgendaItem[]; todayEvents: AgendaItem[] } {
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const allEvents: AgendaItem[] = items.map((event) => {
    const eventDate = event.start?.dateTime 
      ? new Date(event.start.dateTime)
      : event.start?.date
      ? new Date(event.start.date + 'T00:00:00')
      : new Date();

    const dateKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;

    return {
      time: event.start?.dateTime
        ? new Date(event.start.dateTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "All Day",
      event: event.summary || "Untitled Event",
      date: dateKey,
    };
  });

  const todayEvents = allEvents.filter((item) => item.date === todayString);
  return { allEvents, todayEvents };
}

function formatTasks(items: any[]): TaskItem[] {
  return items.map((item) => ({
    title: item.title || "Untitled Task",
    due: item.due,
    listTitle: item.listTitle || "My Tasks",
  }));
}