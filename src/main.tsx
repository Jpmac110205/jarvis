import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./App.css";
import App from "./App.tsx";
import { GoogleDataProvider } from "./contexts/GoogleDataProvider";
import { PreferencesProvider } from "./contexts/PreferencesProvider";

// Complete OAuth before any provider makes its first request.
const callback = new URLSearchParams(window.location.hash.slice(1));
const token = callback.get("session");
if (token) {
  localStorage.setItem("prodigy_session", token);
  window.history.replaceState({}, "", window.location.pathname);
}
localStorage.removeItem("user_id");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PreferencesProvider>
      <GoogleDataProvider>
        <App />
      </GoogleDataProvider>
    </PreferencesProvider>
  </StrictMode>,
);
