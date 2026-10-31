import { useEffect, useState } from "react";
import { apiRequest } from "../../services/api";
import type { UserMemory } from "../../services/api";

export function UserMemoryPanel() {
  const [memory, setMemory] = useState<UserMemory | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void apiRequest<UserMemory>("/memory/user", { signal: controller.signal })
      .then(setMemory)
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Memory could not be loaded.",
          );
      });
    return () => controller.abort();
  }, []);
  async function reload() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      setMemory(await apiRequest<UserMemory>("/memory/user"));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Memory could not be loaded.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!memory) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      setMemory(
        await apiRequest<UserMemory>("/memory/user", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(memory),
        }),
      );
      setNotice("Your user.md memory has been saved.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Memory could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }
  function download() {
    if (!memory) return;
    const url = URL.createObjectURL(
      new Blob([memory.markdown], { type: "text/markdown;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "user.md";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="surface user-memory">
      <h3>Your memory · user.md</h3>
      <p className="muted">
        A living Markdown file of facts, preferences and projects you share in
        chat. It accompanies your questions alongside the three memory tiers.
        Attached documents are reference material and do not automatically
        become personal facts.
      </p>
      <p className="muted">
        Memory updates run separately from replies. Use Reload saved memory to
        see the latest update.
      </p>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {!memory && !error && <p role="status">Loading your memory…</p>}
      {memory && (
        <>
          <div className="setting-row">
            <div>
              <strong>Update from conversations</strong>
              <p>
                Save changes to apply. Turning this off keeps your existing
                Markdown available as context.
              </p>
            </div>
            <button
              className={`switch ${memory.auto_update ? "on" : ""}`}
              role="switch"
              aria-label="Update user memory from conversations"
              aria-checked={memory.auto_update}
              disabled={busy}
              onClick={() =>
                setMemory({ ...memory, auto_update: !memory.auto_update })
              }
            >
              <span />
            </button>
          </div>
          <label htmlFor="user-memory-markdown">Edit user.md</label>
          <textarea
            id="user-memory-markdown"
            rows={12}
            maxLength={100000}
            disabled={busy}
            value={memory.markdown}
            placeholder={
              "# About me\n\nFacts and preferences will appear as you chat."
            }
            onChange={(event) =>
              setMemory({ ...memory, markdown: event.target.value })
            }
          />
          <p className="muted">
            Correct or remove details here, then save. To clear this file,
            remove its text and save. Your conversation and tier memories are
            managed separately.
          </p>
        </>
      )}
      <div className="button-group">
        <button
          className="button primary"
          disabled={!memory || busy}
          onClick={() => void save()}
        >
          {busy ? "Working…" : "Save memory"}
        </button>
        <button
          className="button"
          disabled={!memory || busy}
          onClick={download}
        >
          Download user.md
        </button>
        <button
          className="button"
          disabled={busy}
          onClick={() => void reload()}
        >
          Reload saved memory
        </button>
      </div>
    </section>
  );
}
