import { useState } from "react";
import {
  usePreferences,
  defaultPreferences,
} from "../../contexts/usePreferences";
import type { Preferences } from "../../contexts/usePreferences";
import { useGoogleData } from "../../contexts/useGoogleData";
import { apiRequest } from "../../services/api";

export function SettingsPanel() {
  const { preferences, save } = usePreferences();
  const { user, config } = useGoogleData();
  const [draft, setDraft] = useState<Preferences>(preferences);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  function persist() {
    try {
      save(draft);
      setNotice("Preferences saved on this device.");
      setError(null);
    } catch {
      setError(
        "Your browser couldn't save preferences. Check storage permissions.",
      );
    }
  }
  function clearCache() {
    try {
      for (const key of Object.keys(localStorage))
        if (key.startsWith("prodigy_draft_")) localStorage.removeItem(key);
      save(defaultPreferences);
      setDraft(defaultPreferences);
      setNotice("Cached drafts cleared and device preferences reset.");
      setError(null);
    } catch {
      setError("Your browser couldn't clear cached preferences.");
    }
  }
  async function exportConversation() {
    setExporting(true);
    setError(null);
    try {
      const result = await apiRequest<{ data: unknown }>(
        "/export/conversation",
        { method: "POST" },
      );
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(result.data, null, 2)], {
          type: "application/json",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `prodigy-conversation-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("Your conversation export is ready.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Export couldn't be prepared.",
      );
    } finally {
      setExporting(false);
    }
  }
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Make it yours</span>
          <h2>Settings</h2>
          <p>Personalize your workspace and manage your data.</p>
        </div>
        <div className="button-group">
          <button
            className="button"
            onClick={() => {
              setDraft(defaultPreferences);
              setNotice("Defaults selected. Save changes to apply them.");
            }}
          >
            Reset
          </button>
          <button className="button primary" onClick={persist}>
            Save changes
          </button>
        </div>
      </div>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <section className="surface">
        <h3>Appearance</h3>
        <p className="muted">Choose how Prodigy looks on this device.</p>
        <div className="segmented" role="group" aria-label="Theme">
          {(["light", "dark", "system"] as const).map((theme) => (
            <button
              className={draft.theme === theme ? "selected" : ""}
              aria-pressed={draft.theme === theme}
              key={theme}
              onClick={() => setDraft({ ...draft, theme })}
            >
              {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </button>
          ))}
        </div>
      </section>
      <section className="surface">
        <h3>AI model</h3>
        <div className="setting-row">
          <div>
            <strong>
              {user?.selected_model ||
                config?.default_model ||
                "Configuration unavailable"}
            </strong>
            <p>
              The model is saved with your profile and used for assistant
              replies. Choose an enabled model in Profile.
            </p>
          </div>
          <span className="badge">Account setting</span>
        </div>
        <div className="two-column">
          <div>
            <strong>Quality</strong>
            <p className="muted">
              Give the assistant relevant documents and clear instructions for
              better answers.
            </p>
          </div>
          <div>
            <strong>Speed</strong>
            <p className="muted">
              Response time varies with the model and the context needed for
              your question.
            </p>
          </div>
        </div>
      </section>
      <section className="surface">
        <h3>Notifications</h3>
        <p className="muted">
          Notification delivery is not connected yet. These options will become
          available when delivery is configured.
        </p>
        {["Email alerts", "Push notifications", "Weekly digest"].map(
          (label) => (
            <div className="setting-row" key={label}>
              <span>{label}</span>
              <button
                className="switch"
                role="switch"
                aria-label={label}
                aria-checked={false}
                disabled
              >
                <span />
              </button>
            </div>
          ),
        )}
        <button
          className="button"
          disabled
          title="Notification delivery is not configured"
        >
          Send test
        </button>
      </section>
      <section className="surface">
        <h3>Productivity</h3>
        {[
          {
            key: "compact",
            label: "Compact interface",
            description: "Use closer spacing for lists and conversations.",
          },
          {
            key: "autoSave",
            label: "Auto-save drafts",
            description:
              "Keep unsent messages on this device for up to 48 hours.",
          },
        ].map((item) => (
          <div className="setting-row" key={item.key}>
            <div>
              <strong>{item.label}</strong>
              <p>{item.description}</p>
            </div>
            <button
              className={`switch ${draft[item.key as "compact" | "autoSave"] ? "on" : ""}`}
              role="switch"
              aria-label={item.label}
              aria-checked={draft[item.key as "compact" | "autoSave"]}
              onClick={() =>
                setDraft({
                  ...draft,
                  [item.key]: !draft[item.key as "compact" | "autoSave"],
                })
              }
            >
              <span />
            </button>
          </div>
        ))}
      </section>
      <section className="surface">
        <h3>Data & privacy</h3>
        <label>
          Device preference retention
          <select
            value={draft.retention}
            onChange={(event) =>
              setDraft({
                ...draft,
                retention: event.target.value as Preferences["retention"],
              })
            }
          >
            {["7", "30", "90"].map((days) => (
              <option value={days} key={days}>
                {days} days
              </option>
            ))}
          </select>
          <small>
            After this period, saved device preferences expire. This does not
            delete account conversations or memory.
          </small>
        </label>
        <div className="setting-row">
          <div>
            <strong>Clear cached data</strong>
            <p>Remove cached drafts and reset this device’s preferences.</p>
          </div>
          <button className="button" onClick={clearCache}>
            Clear now
          </button>
        </div>
        <div className="setting-row">
          <div>
            <strong>Export conversations</strong>
            <p>Download your complete saved transcript as JSON.</p>
          </div>
          <button
            className="button"
            disabled={!user || exporting}
            onClick={() => void exportConversation()}
          >
            {exporting ? "Preparing…" : "Export"}
          </button>
        </div>
      </section>
      <section className="surface">
        <h3>How memory works</h3>
        <div className="memory-explanation">
          <div>
            <span>01</span>
            <strong>Conversation</strong>
            <p>
              Your recent {config?.memory.context_messages ?? "saved"} messages
              give each reply its immediate context.
            </p>
          </div>
          <div>
            <span>02</span>
            <strong>Short term</strong>
            <p>
              Conversations are summarized after{" "}
              {config ? config.memory.summary_messages / 2 : "several"}{" "}
              exchanges. Useful summaries are retrieved by relevance.
            </p>
          </div>
          <div>
            <span>03</span>
            <strong>Long term</strong>
            <p>
              Less-used summaries move here after{" "}
              {config?.memory.stale_days ?? "a period of"} days. Relevant older
              memories can return to short term.
            </p>
          </div>
        </div>
        <p className="muted">
          Memory is account-specific. Summaries help with recall; the saved
          transcript remains the detailed record.
        </p>
      </section>
    </div>
  );
}
