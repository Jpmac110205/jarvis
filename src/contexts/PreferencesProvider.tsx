import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { PreferencesContext, defaultPreferences } from "./usePreferences";
import type { Preferences } from "./usePreferences";

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("prodigy_preferences") || "null",
      );
      if (
        !stored ||
        Date.now() - stored.savedAt >
          Number(stored.value?.retention || 30) * 86400000
      )
        return defaultPreferences;
      return {
        theme: ["light", "dark", "system"].includes(stored.value?.theme)
          ? stored.value.theme
          : "system",
        compact: stored.value?.compact === true,
        autoSave: stored.value?.autoSave !== false,
        retention: ["7", "30", "90"].includes(stored.value?.retention)
          ? stored.value.retention
          : "30",
      };
    } catch {
      return defaultPreferences;
    }
  });
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme =
        preferences.theme === "system"
          ? media.matches
            ? "dark"
            : "light"
          : preferences.theme;
      document.documentElement.dataset.compact = String(preferences.compact);
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [preferences]);
  const save = (value: Preferences) => {
    localStorage.setItem(
      "prodigy_preferences",
      JSON.stringify({ value, savedAt: Date.now() }),
    );
    setPreferences(value);
  };
  return (
    <PreferencesContext.Provider value={{ preferences, save }}>
      {children}
    </PreferencesContext.Provider>
  );
}
