import { createContext, useContext } from "react";
export interface Preferences {
  theme: "light" | "dark" | "system";
  compact: boolean;
  autoSave: boolean;
  retention: "7" | "30" | "90";
}
export const defaultPreferences: Preferences = {
  theme: "system",
  compact: false,
  autoSave: true,
  retention: "30",
};
export const PreferencesContext = createContext<{
  preferences: Preferences;
  save: (value: Preferences) => void;
} | null>(null);

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("PreferencesProvider is required");
  return context;
}
