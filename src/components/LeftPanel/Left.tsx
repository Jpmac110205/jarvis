import {
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import type { Section } from "../../App";
import { useGoogleData } from "../../contexts/useGoogleData";
import { connectGoogle } from "../../services/api";
const navigation = [
  { id: "chat", label: "Assistant", icon: ChatBubbleLeftRightIcon },
  { id: "calendar", label: "Calendar", icon: CalendarDaysIcon },
  { id: "tasks", label: "Tasks", icon: CheckCircleIcon },
  { id: "profile", label: "Profile", icon: UserCircleIcon },
] as const;

export function LeftPanel({
  middle,
  onSelect,
}: {
  middle: Section;
  onSelect: (view: Section) => void;
}) {
  const { user, loading, logout } = useGoogleData();
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  async function signOut() {
    setLoggingOut(true);
    setError(null);
    try {
      await logout();
    } catch {
      setError("Sign-out failed. Try again.");
    } finally {
      setLoggingOut(false);
    }
  }
  return (
    <aside className="navigation-panel">
      <a href="/" className="brand">
        <span className="brand-mark">p</span>
        <span>
          Prodigy<span className="brand-caption">Personal workspace</span>
        </span>
      </a>
      <p className="eyebrow nav-label">Workspace</p>
      <nav aria-label="Main navigation" className="nav-list">
        {navigation.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${middle === item.id ? "active" : ""}`}
            aria-current={middle === item.id ? "page" : undefined}
            onClick={() => onSelect(item.id)}
          >
            <item.icon />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-note">
        <span className="eyebrow">A little less to remember</span>
        <p>
          Your conversations, documents and schedule, together in one place.
        </p>
      </div>
      <nav
        aria-label="Workspace preferences"
        className="nav-list nav-secondary"
      >
        {[
          { id: "settings", label: "Settings", icon: Cog6ToothIcon },
          { id: "privacy", label: "Privacy policy", icon: ShieldCheckIcon },
        ].map((item) => (
          <button
            key={item.id}
            className={`nav-item ${middle === item.id ? "active" : ""}`}
            aria-current={middle === item.id ? "page" : undefined}
            onClick={() => onSelect(item.id as Section)}
          >
            <item.icon />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="account-card">
        {user ? (
          <>
            <button
              className="account-details"
              onClick={() => onSelect("profile")}
            >
              <span className="avatar">{user.display_name.charAt(0)}</span>
              <span>
                <strong>{user.display_name}</strong>
                <small>{user.email}</small>
              </span>
            </button>
            <button
              className="icon-button"
              aria-label="Sign out"
              onClick={() => void signOut()}
              disabled={loggingOut}
            >
              <ArrowRightOnRectangleIcon />
            </button>
          </>
        ) : (
          <button
            className="button primary full-width"
            onClick={connectGoogle}
            disabled={loading}
          >
            {loading ? "Loading account…" : "Sign in with Google"}
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
    </aside>
  );
}
