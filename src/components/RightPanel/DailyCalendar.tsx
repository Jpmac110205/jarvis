import { useEffect, useState } from "react";

type AgendaItem = {
  time: string;
  event: string;
};

type TaskItem = {
  title: string;
  due?: string;
  listTitle?: string;
};

interface GoogleEvent {
  start?: {
    dateTime?: string;
    date?: string;
  };
  summary?: string;
}

export function DailyCalendar() {
  const [connectedToGoogle, setConnectedToGoogle] = useState<boolean | null>(null);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Check authentication + load calendar and tasks
  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("http://localhost:8080/events", {
          credentials: "include", // 🔴 REQUIRED to send cookies
        });

        if (res.status === 401) {
          setConnectedToGoogle(false);
          setLoading(false);
          return;
        }

        const data = await res.json();

        // Filter for today's events only
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const formattedAgenda: AgendaItem[] = (data.items || [])
          .map((event: GoogleEvent) => {
            const eventDate = event.start?.dateTime 
              ? new Date(event.start.dateTime)
              : event.start?.date
              ? new Date(event.start.date)
              : null;

            return {
              time: event.start?.dateTime
                ? new Date(event.start.dateTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "All Day",
              event: event.summary || "Untitled Event",
              eventDate,
            };
          })
          .filter((item: any) => {
            // Filter to only today's events
            if (!item.eventDate) return false;
            return item.eventDate >= today && item.eventDate < tomorrow;
          })
          .map(({ time, event }: { time: string; event: string }) => ({ time, event })); // Remove eventDate from final output

        setAgenda(formattedAgenda);
        setConnectedToGoogle(true);
      } catch (err) {
        console.error("❌ Error fetching events:", err);
        setConnectedToGoogle(false);
      } finally {
        console.log("✅ fetchEvents completed");
        setLoading(false);
      }
    }

    async function fetchTasks() {
      console.log("📥 fetchTasks called");
      try {
        console.log("📡 Fetching from http://localhost:8080/tasks");
        const res = await fetch("http://localhost:8080/tasks", {
          credentials: "include",
        });

        console.log("📡 Tasks response status:", res.status);

        if (res.status === 401) {
          console.log("❌ Not authenticated for tasks (401)");
          return; // Already handled by fetchEvents
        }

        const data = await res.json();
        
        console.log("📋 Raw tasks data:", data);
        console.log("📋 Number of tasks:", data.items?.length || 0);
        
        const formattedTasks: TaskItem[] = (data.items || []).map((task: any) => ({
          title: task.title || "Untitled Task",
          due: task.due,
          listTitle: task.listTitle || "My Tasks"
        }));

        console.log("📋 Formatted tasks:", formattedTasks);
        setTasks(formattedTasks);
      } catch (err) {
        console.error("❌ Error fetching tasks:", err);
      }
    }

    console.log("🔄 Starting fetchEvents and fetchTasks");
    fetchEvents();
    fetchTasks();

    // 🔹 Handle OAuth redirect
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth');
    const authError = urlParams.get('error');
    const userId = urlParams.get('user_id');
    
    if (authSuccess === 'success') {
      console.log('OAuth successful! Refreshing calendar...');
      
      // Manually set cookie as backup (in case redirect cookie didn't work)
      if (userId) {
        document.cookie = `user_id=${userId}; path=/; max-age=${60*60*24*7}; SameSite=Lax`;
        console.log('Set user_id cookie manually:', userId);
      }
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Small delay to ensure cookie is set
      setTimeout(() => {
        fetchEvents();
        fetchTasks();
      }, 100);
    } else if (authError) {
      console.error('OAuth failed:', authError);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // 🔹 OAuth redirect - FIXED TO USE CORRECT ENDPOINT
  function connectGoogle() {
    window.location.href = "http://localhost:8080/auth/google/login";
  }

  if (loading) {
    return <p className="text-neutral-400">Loading calendar…</p>;
  }

  return (
    <>
      <h2 className="text-base font-semibold mb-5 text-neutral-100 tracking-tight">
        Today's Overview
      </h2>

      <Reminders 
        connected={connectedToGoogle} 
        tasks={tasks}
        connectGoogle={connectGoogle} 
      />
      <br />
      <Calendar
        connected={connectedToGoogle}
        agenda={agenda}
        connectGoogle={connectGoogle}
      />
    </>
  );
}


function Reminders({
  connected,
  tasks,
  connectGoogle,
}: {
  connected: boolean | null;
  tasks: TaskItem[];
  connectGoogle: () => void;
}) {
  if (!connected) {
    return (
      <div className="w-full max-w-md bg-neutral-800/60 rounded-xl p-4 border border-neutral-700/50">
        <h3 className="text-sm font-semibold text-neutral-200 mb-3 uppercase">
          Reminders
        </h3>
        <p className="text-sm text-neutral-400 mb-4">
          Connect your Google account to view reminders.
        </p>
        <button
          onClick={connectGoogle}
          className="text-sm px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Connect Google
        </button>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="w-full max-w-md bg-neutral-800/60 rounded-xl p-4 border border-neutral-700/50">
        <h3 className="text-sm font-semibold text-neutral-200 mb-3 uppercase">
          Reminders
        </h3>
        <p className="text-sm text-neutral-400 text-center">No tasks found.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-neutral-800/60 rounded-xl p-4 border border-neutral-700/50">
      <h3 className="text-sm font-semibold text-neutral-200 mb-3 uppercase">
        Reminders ({tasks.length})
      </h3>
      <ul className="space-y-2">
        {tasks.map((task, idx) => (
          <li
            key={idx}
            className="flex items-start px-3 py-2.5 rounded-lg bg-neutral-700/40 border-l-4 border-blue-500/70"
          >
            <div className="flex-1">
              <span className="text-sm font-medium text-neutral-100 block">
                {task.title}
              </span>
              {task.listTitle && (
                <span className="text-xs text-neutral-400 mt-1 block">
                  {task.listTitle}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}


function Calendar({
  connected,
  agenda,
  connectGoogle,
}: {
  connected: boolean | null;
  agenda: AgendaItem[];
  connectGoogle: () => void;
}) {
  if (!connected) {
    return (
      <div className="w-full max-w-md bg-neutral-800/60 rounded-xl p-4 border border-neutral-700/50">
        <h3 className="text-sm font-semibold text-neutral-200 mb-3 uppercase">
          Calendar
        </h3>
        <p className="text-sm text-neutral-400 mb-4">
          Connect your Google account to view your calendar.
        </p>
        <button
          onClick={connectGoogle}
          className="text-sm px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Connect Google
        </button>
      </div>
    );
  }

  if (agenda.length === 0) {
    return (
      <div className="w-full max-w-md bg-neutral-800/60 rounded-xl p-4 border border-neutral-700/50">
        <h3 className="text-sm font-semibold text-neutral-200 mb-3 uppercase">
          Schedule for Today
        </h3>
        <p className="text-sm text-neutral-400 text-center">
          No events scheduled today.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-neutral-800/60 rounded-xl p-4 border border-neutral-700/50">
      <h3 className="text-sm font-semibold text-neutral-200 mb-3 uppercase">
        Schedule for Today
      </h3>
      <ul className="space-y-2">
        {agenda.map((item, idx) => (
          <li
            key={idx}
            className="flex justify-between items-center px-3 py-2.5 rounded-lg bg-neutral-700/40 border-l-4 border-blue-500/70"
          >
            <span className="text-sm font-medium text-blue-300">
              {item.time}
            </span>
            <span className="text-sm font-medium">{item.event}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}