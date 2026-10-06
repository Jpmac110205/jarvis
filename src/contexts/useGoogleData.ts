import { createContext, useContext } from "react";
export interface AgendaItem {
  id: string;
  time: string;
  event: string;
  date: string;
  location?: string;
}
export interface TaskItem {
  id: string;
  title: string;
  due?: string;
  listTitle: string;
  done: boolean;
}
export interface UserProfile {
  id: number;
  email: string;
  display_name: string;
  picture_url?: string;
  title?: string;
  location?: string;
  system_prompt?: string;
  chats_number: number;
  pdfs_number: number;
  created_at?: string;
  selected_model: string;
}
export interface AppConfig {
  default_model: string;
  models: string[];
  max_upload_bytes: number;
  memory: {
    context_messages: number;
    summary_messages: number;
    stale_days: number;
  };
  capabilities: {
    web_search: boolean;
    task_writes: boolean;
    notifications: boolean;
    voice: boolean;
  };
}
export interface GoogleEvent {
  id?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  summary?: string;
  location?: string;
}
export interface GoogleTask {
  id: string;
  title?: string;
  due?: string;
  listTitle?: string;
  listId?: string;
  status?: string;
}
interface ContextValue {
  agenda: AgendaItem[];
  todayAgenda: AgendaItem[];
  tasks: TaskItem[];
  connected: boolean;
  loading: boolean;
  error: string | null;
  agendaError: string | null;
  tasksError: string | null;
  user: UserProfile | null;
  config: AppConfig | null;
  online: boolean | null;
  refresh: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}
export const GoogleDataContext = createContext<ContextValue | null>(null);

export function useGoogleData() {
  const context = useContext(GoogleDataContext);
  if (!context) throw new Error("GoogleDataProvider is required");
  return context;
}
