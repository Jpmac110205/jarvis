import { useEffect } from "react";
import { useGoogleData } from "../../contexts/GoogleDataProvider.tsx";
import { useGoogleConnection } from "../../contexts/GoogleConnectionProvider";

export function DailyCalendar() {
  const { setConnectedToGoogle } = useGoogleConnection();
  const { todayAgenda: agenda, tasks, connected, loading } = useGoogleData();

  useEffect(() => {
    setConnectedToGoogle(connected);
  }, [connected, setConnectedToGoogle]);

  function connectGoogle() {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/google/login`;
  }

  if (loading) {
    return <p className="text-[11px] text-[#7a7a8c] uppercase tracking-widest p-4">Syncing...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full animate-pulse" />
        <h2 className="font-['Syne'] text-[11px] font-bold uppercase tracking-[0.2em] text-[#f0f0f5]">
          Today's Overview
        </h2>
      </div>

      <Reminders 
        connected={connected} 
        tasks={tasks}
        connectGoogle={connectGoogle} 
      />
      
      <Calendar
        connected={connected}
        agenda={agenda}
        connectGoogle={connectGoogle}
      />
    </div>
  );
}

function Reminders({ connected, tasks, connectGoogle }: { connected: boolean; tasks: any[]; connectGoogle: () => void; }) {
  const CardBase = "w-full bg-[#0c0c10] rounded-[18px] p-5 border border-white/5 relative overflow-hidden transition-all duration-300 hover:border-[rgba(59,130,246,0.15)]";
  
  if (!connected) {
    return (
      <div className={CardBase}>
        <h3 className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest mb-3">Reminders</h3>
        <p className="text-xs text-[#7a7a8c] mb-4 font-light leading-relaxed">No cloud data available for local reminders node.</p>
        <button onClick={connectGoogle} className="text-[10px] font-bold text-[#f0f0f5] uppercase tracking-widest bg-white/5 border border-white/10 px-4 py-2 rounded-lg hover:bg-white/10 transition-all">Link Node</button>
      </div>
    );
  }

  return (
    <div className={CardBase}>
      <h3 className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest mb-4">Reminders ({tasks.length})</h3>
      {tasks.length === 0 ? (
        <p className="text-xs text-[#7a7a8c] italic text-center py-4 font-light">Queue empty.</p>
      ) : (
        <ul className="space-y-2.5">
          {tasks.slice(0, 3).map((task, idx) => (
            <li key={idx} className="flex gap-3 items-center group">
              <div className="w-1 h-1 rounded-full bg-[#3b82f6] group-hover:shadow-[0_0_5px_#3b82f6] transition-all" />
              <div className="flex-1">
                <span className="text-[13px] text-[#f0f0f5] font-light leading-none block">{task.title}</span>
                {task.listTitle && <span className="text-[9px] text-[#7a7a8c] uppercase font-bold tracking-widest mt-1 block opacity-60">{task.listTitle}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Calendar({ connected, agenda, connectGoogle }: { connected: boolean; agenda: any[]; connectGoogle: () => void; }) {
  const CardBase = "w-full bg-[#0c0c10] rounded-[18px] p-5 border border-white/5 relative overflow-hidden transition-all duration-300 hover:border-[rgba(59,130,246,0.15)]";

  if (!connected) {
    return (
      <div className={CardBase}>
        <h3 className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest mb-3">Today's Schedule</h3>
        <p className="text-xs text-[#7a7a8c] mb-4 font-light leading-relaxed">Calendar matrix disconnected.</p>
        <button onClick={connectGoogle} className="text-[10px] font-bold text-[#f0f0f5] uppercase tracking-widest bg-white/5 border border-white/10 px-4 py-2 rounded-lg hover:bg-white/10 transition-all">Link Node</button>
      </div>
    );
  }

  return (
    <div className={CardBase}>
      <h3 className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest mb-4">Agenda ({agenda.length})</h3>
      {agenda.length === 0 ? (
        <p className="text-xs text-[#7a7a8c] italic text-center py-4 font-light">No logged events for current cycle.</p>
      ) : (
        <ul className="space-y-3">
          {agenda.map((item, idx) => (
            <li key={idx} className="flex justify-between items-center border-b border-white/[0.03] pb-2 last:border-0 last:pb-0 group">
              <span className="text-[10px] font-mono text-[#3b82f6] font-bold">{item.time}</span>
              <span className="text-[13px] text-[#f0f0f5] font-light text-right group-hover:text-white transition-colors">{item.event}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
    )};