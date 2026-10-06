import { useState } from "react";
import { useGoogleData } from "../../contexts/useGoogleData";
import type { UserProfile } from "../../contexts/useGoogleData";
import { apiRequest, connectGoogle } from "../../services/api";

export function ProfilePanel() {
  const { user, loading, error } = useGoogleData();
  if (loading)
    return (
      <p className="page muted" role="status">
        Loading your profile…
      </p>
    );
  if (!user)
    return (
      <div className="page">
        <h2>Your profile</h2>
        <p className="muted">
          Sign in to personalize your assistant and see your activity.
        </p>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <button className="button primary" onClick={connectGoogle}>
          Sign in with Google
        </button>
      </div>
    );
  return <ProfileForm key={user.id} user={user} />;
}

function ProfileForm({ user }: { user: UserProfile }) {
  const { config, tasks, tasksError, refreshProfile } = useGoogleData();
  const [form, setForm] = useState({
    name: user.display_name,
    title: user.title || "",
    location: user.location || "",
    system_prompt: user.system_prompt || "",
    selected_model: user.selected_model,
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  async function save() {
    setStatus("saving");
    setError("");
    try {
      await apiRequest(`/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      await refreshProfile();
      setStatus("saved");
    } catch (cause) {
      setStatus("error");
      setError(
        cause instanceof Error ? cause.message : "Profile couldn't be saved.",
      );
    }
  }
  const modelNames: Record<string, string> = {
    "gpt-5-mini": "GPT-5 mini",
    "gpt-5-nano": "GPT-5 nano",
    "gpt-4o-mini": "GPT-4o mini",
    "gpt-4.1-mini": "GPT-4.1 mini",
  };
  const models = [
    ...new Set([...(config?.models || []), ...Object.keys(modelNames)]),
  ];
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Personalization</span>
          <h2>Your profile</h2>
          <p>
            Your details give Prodigy useful context. Your instructions shape
            how it responds.
          </p>
        </div>
        <button
          className="button primary"
          disabled={status === "saving"}
          onClick={() => void save()}
        >
          {status === "saving" ? "Saving…" : "Save changes"}
        </button>
      </div>
      {status === "saved" && (
        <p className="notice" role="status">
          Your profile has been saved.
        </p>
      )}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <section className="surface profile-summary">
        <span className="avatar large">
          {user.picture_url ? (
            <img src={user.picture_url} alt="" referrerPolicy="no-referrer" />
          ) : (
            user.display_name.charAt(0)
          )}
        </span>
        <div>
          <span className="eyebrow">Google account</span>
          <h3>{user.display_name}</h3>
          <p className="muted">{user.email}</p>
          <small className="muted">
            {user.created_at
              ? `Joined ${new Date(user.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}`
              : "Account connected"}
          </small>
        </div>
      </section>
      <div className="stats-grid">
        {[
          { label: "Assistant replies", value: user.chats_number },
          {
            label: "Pending Google tasks",
            value: !tasksError
              ? tasks.filter((task) => !task.done).length
              : "—",
          },
          { label: "Documents indexed", value: user.pdfs_number },
        ].map((stat) => (
          <div className="stat" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </div>
      <section className="surface">
        <h3>User details</h3>
        <div className="form-grid">
          <label>
            Display name
            <input
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              maxLength={255}
            />
          </label>
          <label>
            Email address
            <input type="email" value={user.email} disabled />
            <small>Managed by your Google account.</small>
          </label>
          <label>
            Role or title
            <input
              placeholder="What do you do?"
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              maxLength={255}
            />
          </label>
          <label>
            Location
            <input
              placeholder="City, country or time zone"
              value={form.location}
              onChange={(event) =>
                setForm({ ...form, location: event.target.value })
              }
              maxLength={255}
            />
          </label>
        </div>
      </section>
      <section className="surface">
        <h3>Assistant model & instructions</h3>
        <p className="muted">
          Available models come from this deployment’s configuration. Token
          usage determines cost; this workspace does not estimate your bill.
        </p>
        <div className="model-grid" role="group" aria-label="Assistant model">
          {models.map((model) => {
            const available = config?.models.includes(model) || false;
            return (
              <button
                className={`model-option ${form.selected_model === model ? "selected" : ""}`}
                key={model}
                disabled={!available}
                aria-pressed={form.selected_model === model}
                onClick={() => setForm({ ...form, selected_model: model })}
              >
                <strong>{modelNames[model] || model}</strong>
                <small>
                  {available
                    ? "Available on this deployment"
                    : "Not enabled on this deployment"}
                </small>
              </button>
            );
          })}
        </div>
        <label>
          Custom instructions
          <textarea
            rows={5}
            value={form.system_prompt}
            maxLength={10000}
            placeholder="Tell Prodigy how you like to work: preferred tone, level of detail, or context it should know."
            onChange={(event) =>
              setForm({ ...form, system_prompt: event.target.value })
            }
          />
          <small>
            Saved to your account and applied to future assistant replies.
          </small>
        </label>
      </section>
    </div>
  );
}
