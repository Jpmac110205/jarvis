/* Shared account and Google data; one session bootstrap, explicit failures. */
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { GoogleDataContext } from "./useGoogleData";
import type {
  AgendaItem,
  AppConfig,
  GoogleEvent,
  GoogleTask,
  TaskItem,
  UserProfile,
} from "./useGoogleData";
import { dateKey, formatEvents } from "../services/google";
import { ApiError, apiRequest } from "../services/api";

export function GoogleDataProvider({ children }: { children: ReactNode }) {
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agendaError, setAgendaError] = useState<string | null>(null);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const generation = useRef(0);

  const refreshProfile = useCallback(async () => {
    const current = generation.current;
    const data = await apiRequest<{
      authenticated: boolean;
      user?: UserProfile;
    }>("/auth/status");
    if (current !== generation.current) return;
    setUser(data.authenticated && data.user ? data.user : null);
  }, []);

  const refresh = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);
    setError(null);
    try {
      const status = await apiRequest<{
        authenticated: boolean;
        user?: UserProfile;
      }>("/auth/status");
      if (current !== generation.current) return;
      setUser(status.authenticated && status.user ? status.user : null);
      if (!status.authenticated) {
        setConnected(false);
        setAgenda([]);
        setTasks([]);
        localStorage.removeItem("prodigy_session");
        return;
      }
      // Include all of today, so earlier meetings do not disappear from the overview.
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const [eventsResult, tasksResult] = await Promise.allSettled([
        apiRequest<{ items: GoogleEvent[] }>(
          `/events?time_min=${encodeURIComponent(start.toISOString())}`,
        ),
        apiRequest<{ items: GoogleTask[] }>("/tasks"),
      ]);
      if (current !== generation.current) return;
      setAgenda(
        eventsResult.status === "fulfilled"
          ? formatEvents(eventsResult.value.items || [])
          : [],
      );
      setTasks(
        tasksResult.status === "fulfilled"
          ? (tasksResult.value.items || []).map((task) => ({
              id: `${task.listId}:${task.id}`,
              title: task.title || "Untitled task",
              due: task.due,
              listTitle: task.listTitle || "My Tasks",
              done: task.status === "completed",
            }))
          : [],
      );
      setAgendaError(
        eventsResult.status === "rejected"
          ? eventsResult.reason instanceof Error
            ? eventsResult.reason.message
            : "Calendar couldn't be refreshed."
          : null,
      );
      setTasksError(
        tasksResult.status === "rejected"
          ? tasksResult.reason instanceof Error
            ? tasksResult.reason.message
            : "Tasks couldn't be refreshed."
          : null,
      );
      const failure =
        eventsResult.status === "rejected"
          ? eventsResult.reason
          : tasksResult.status === "rejected"
            ? tasksResult.reason
            : null;
      setConnected(!failure);
      if (failure)
        setError(
          failure instanceof Error
            ? failure.message
            : "Google data couldn't be refreshed.",
        );
    } catch (cause) {
      if (current !== generation.current) return;
      const message =
        cause instanceof Error ? cause.message : "Unable to load your account.";
      setError(message);
      setAgendaError(message);
      setTasksError(message);
      if (cause instanceof ApiError && cause.status === 401) {
        setUser(null);
        setAgenda([]);
        setTasks([]);
        setConnected(false);
      }
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    void apiRequest<AppConfig>("/config")
      .then(setConfig)
      .catch(() => setConfig(null));
    const checkHealth = () => {
      void apiRequest<{ status: string }>("/health")
        .then((data) => setOnline(data.status === "ok"))
        .catch(() => setOnline(false));
    };
    checkHealth();
    const timer = window.setInterval(checkHealth, 60000);
    return () => {
      window.clearInterval(timer);
    };
  }, [refresh]);

  const logout = async () => {
    await apiRequest("/auth/logout", { method: "POST" });
    ++generation.current;
    localStorage.removeItem("prodigy_session");
    localStorage.removeItem("user_id");
    setUser(null);
    setAgendaError(null);
    setTasksError(null);
    setConnected(false);
    setTasks([]);
    setAgenda([]);
  };

  return (
    <GoogleDataContext.Provider
      value={{
        agenda,
        todayAgenda: agenda.filter((item) => item.date === dateKey(new Date())),
        tasks,
        user,
        config,
        connected,
        loading,
        error,
        agendaError,
        tasksError,
        online,
        refresh,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </GoogleDataContext.Provider>
  );
}
