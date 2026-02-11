import { useEffect } from "react";
import { useGoogleConnection } from "../../contexts/GoogleConnectionProvider";
import { useGoogleData } from "../../contexts/GoogleDataProvider";

type AgendaItem = {
  time: string;
  event: string;
};

type TaskItem = {
  title: string;
  due?: string;
  listTitle?: string;
};

export function DailyCalendar() {
  const { setConnectedToGoogle } = useGoogleConnection();
  const { todayAgenda: agenda, tasks, connected, loading } = useGoogleData();

  // Sync the connected state to the old context
  useEffect(() => {
    setConnectedToGoogle(connected);
  }, [connected, setConnectedToGoogle]);

  // OAuth redirect
  function connectGoogle() {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/google/login`;
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
        connected={connected} 
        tasks={tasks}
        connectGoogle={connectGoogle} 
      />
      <br />
      <Calendar
        connected={connected}
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
  connected: boolean;
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
  connected: boolean;
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
        Schedule for Today ({agenda.length})
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