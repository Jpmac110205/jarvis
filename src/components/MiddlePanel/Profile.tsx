import { useState, useEffect } from "react";

export function ProfilePanel() {
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    title: "",
    location: "",
    system_prompt: "",
    chat_number: 0,
    task_number: 0,
    pdf_number: 0,
    picture_url: ""
  });
  const [nameEmailLocked, setNameEmailLocked] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/status`, {
      credentials: 'include',
      headers: userId ? { 'X-User-ID': userId } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUser(data.user);
          // Flexibly match displayName, display_name, or name from backend payload
          const userName = data.user.display_name || data.user.name || data.user.displayName || "";
          setForm({
            name: userName,
            email: data.user.email || "",
            title: data.user.title || "",
            location: data.user.location || "",
            system_prompt: data.user.system_prompt || "",
            chat_number: data.user.chats_number || data.user.chats || 0,
            task_number: data.user.tasks_number || data.user.tasks || 0,
            pdf_number: data.user.pdfs_number || data.user.pdfs || 0,
            picture_url: data.user.picture_url || ""
          });
          if (userName && data.user.email) {
            setNameEmailLocked(true);
          } else {
            setNameEmailLocked(false);
          }
        }
      });
  }, []);

  const [selectedModel, setSelectedModel] = useState<string>("gpt-5-mini");
  const [saveStatus, setSaveStatus] = useState<null | "success" | "error" | "saving">(null);

  const handleSaveChanges = async () => {
    if (!user?.id) return;
    setSaveStatus("saving");
    const userId = localStorage.getItem('user_id');
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'X-User-ID': userId } : {})
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          title: form.title,
          location: form.location,
          system_prompt: form.system_prompt,
          chats_number: form.chat_number,
          tasks_number: form.task_number,
          pdfs_number: form.pdf_number,
          picture_url: form.picture_url
        })
      });
      if (res.ok) {
        const data = await res.json();
        console.log("Saved user:", data);

        setUser(data);
        setForm({
            name: data.display_name || "",
            email: data.email || "",
            title: data.title || "",
            location: data.location || "",
            system_prompt: data.system_prompt || "",
            chat_number: data.chats_number || 0,
            task_number: data.tasks_number || 0,
            pdf_number: data.pdfs_number || 0,
            picture_url: data.picture_url || ""
          });
        setSaveStatus("success");
        setTimeout(() => setSaveStatus(null), 2000);
      } else {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus(null), 2000);
      }
    } catch (e) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 2000);
    }
  };

  const modelInfo: Record<string, { label: string; cost: string; performance: string }> = {
    "gpt-5-mini": { label: "GPT-5 mini", cost: "$0.003", performance: "Balanced: good quality with moderate latency." },
    "gpt-5-nano": { label: "GPT-5 nano", cost: "$0.0015", performance: "Very fast with smaller context and lighter accuracy." },
    "gpt-4o-mini": { label: "GPT-4o mini", cost: "$0.02", performance: "High throughput, strong for short-form tasks." },
    "gpt-4-1-mini": { label: "GPT-4.1 mini", cost: "$0.04", performance: "Highest quality, best for complex reasoning (higher latency)." },
  };

  return (
    <div className="w-full max-w-3xl px-6 py-8 flex flex-col gap-6 h-fit min-h-0">
      {/* Upper Layout Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h2 className="font-['Syne'] font-extrabold text-2xl tracking-tight text-[#f0f0f5]">Identity Panel</h2>
          <p className="text-sm text-[#7a7a8c] font-light mt-1">Configure authorization limits, profile cards, and prompt rules.</p>
        </div>
        <div className="flex gap-3 items-center">
          <button
            className={
              `px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all duration-300 hover:-translate-y-0.5 ` +
              (saveStatus === "success"
                ? "bg-emerald-600 text-white"
                : saveStatus === "error"
                ? "bg-red-600 text-white"
                : "bg-[#3b82f6] text-white shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:bg-[#2563eb]")
            }
            onClick={handleSaveChanges}
            disabled={saveStatus === "saving"}
          >
            {saveStatus === "saving"
              ? "Syncing..."
              : saveStatus === "success"
              ? "Profile Saved"
              : saveStatus === "error"
              ? "System Error"
              : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Profile Card Header Component */}
      <section className="bg-[#0c0c10] border border-[rgba(59,130,246,0.15)] rounded-2xl p-6 flex flex-col sm:flex-row gap-5 items-center shadow-xl relative overflow-hidden w-full">
        {/* Embedded mesh glow */}
        <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.06)_0%,transparent_70%)]" />

        <div className="flex items-center gap-4 w-full relative z-10">
          {form.picture_url ? (
            <img
              src={form.picture_url}
              alt="Profile"
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-xl border border-[rgba(59,130,246,0.15)] shadow-xl object-cover flex-shrink-0"
              onError={(e) => console.log("Image load exception handled natively", e)}
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-[rgba(59,130,246,0.05)] border border-[rgba(59,130,246,0.15)] flex items-center justify-center flex-shrink-0">
              <span className="text-[#3b82f6] text-xl font-bold font-['Syne']">
                {form.name?.charAt(0) || "P"}
              </span>
            </div>
          )}
          {/* Assigned flex-1 and min-w-0 to prevent text containment constraints */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest font-bold text-[#3b82f6]">Verified Partner</p>
            <p className="font-['Syne'] text-xl font-extrabold text-[#f0f0f5] mt-0.5 truncate">{form.name || "App Partner"}</p>
            <p className="text-xs text-[#7a7a8c] font-light mt-1 truncate">
              Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Active user"}
            </p>
          </div>
        </div>
      </section>

      {/* Meta counters card list */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0c0c10]/50 border border-white/5 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-[#7a7a8c] font-semibold mb-1">Conversations</p>
          <p className="font-['Syne'] text-xl font-extrabold text-[#f0f0f5]">{form.chat_number}</p>
        </div>
        <div className="bg-[#0c0c10]/50 border border-white/5 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-[#7a7a8c] font-semibold mb-1">Tasks logged</p>
          <p className="font-['Syne'] text-xl font-extrabold text-[#f0f0f5]">{form.task_number}</p>
        </div>
        <div className="bg-[#0c0c10]/50 border border-white/5 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-[#7a7a8c] font-semibold mb-1">Documents Indexed</p>
          <p className="font-['Syne'] text-xl font-extrabold text-[#f0f0f5]">{form.pdf_number}</p>
        </div>
      </section>

      {/* Primary form parameters with modern styled text boxes */}
      <section className="bg-[#0c0c10]/40 border border-white/5 rounded-2xl p-6 space-y-5">
        <h3 className="font-['Syne'] text-base font-bold text-[#f0f0f5] mb-2 border-b border-white/5 pb-2">User Details</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#7a7a8c] font-bold mb-2">Display Name</label>
            <input
              type="text"
              value={form.name}
              disabled={nameEmailLocked}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-[#050507] border border-white/5 focus:border-[rgba(59,130,246,0.25)] rounded-xl px-4 py-3 text-sm text-[#f0f0f5] placeholder-[#7a7a8c] outline-none transition-colors disabled:opacity-40"
              placeholder="E.g., Prodigy Master"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#7a7a8c] font-bold mb-2">Email Address</label>
            <input
              type="email"
              value={form.email}
              disabled={nameEmailLocked}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-[#050507] border border-white/5 focus:border-[rgba(59,130,246,0.25)] rounded-xl px-4 py-3 text-sm text-[#f0f0f5] placeholder-[#7a7a8c] outline-none transition-colors disabled:opacity-40"
              placeholder="name@example.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#7a7a8c] font-bold mb-2">Partner Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-[#050507] border border-white/5 focus:border-[rgba(59,130,246,0.25)] rounded-xl px-4 py-3 text-sm text-[#f0f0f5] placeholder-[#7a7a8c] outline-none transition-colors"
              placeholder="E.g., Lead Developer"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#7a7a8c] font-bold mb-2">Location Context</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full bg-[#050507] border border-white/5 focus:border-[rgba(59,130,246,0.25)] rounded-xl px-4 py-3 text-sm text-[#f0f0f5] placeholder-[#7a7a8c] outline-none transition-colors"
              placeholder="E.g., Berlin, DE"
            />
          </div>
        </div>
      </section>

      {/* Fully Configurable Tuning Section */}
      <section className="bg-[#0c0c10]/40 border border-white/5 rounded-2xl p-6 space-y-5">
        <h3 className="font-['Syne'] text-base font-bold text-[#f0f0f5] mb-2 border-b border-white/5 pb-2">AI Routing & System Context</h3>

        <div>
          <label className="block text-xs uppercase tracking-widest text-[#7a7a8c] font-bold mb-2">Core Router Model</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {Object.entries(modelInfo).map(([key, details]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedModel(key)}
                className={`text-left p-4 rounded-xl border transition-all duration-300 ${
                  selectedModel === key 
                    ? "border-[#3b82f6] bg-[rgba(59,130,246,0.04)] shadow-[0_0_15px_rgba(59,130,246,0.05)]" 
                    : "border-white/5 bg-[#050507]/60 hover:border-white/10"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm text-[#f0f0f5]">{details.label}</span>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#3b82f6] bg-[rgba(59,130,246,0.06)] px-2 py-0.5 rounded-md border border-[rgba(59,130,246,0.15)]">
                    {details.cost} / 1k
                  </span>
                </div>
                <p className="text-xs text-[#7a7a8c] leading-relaxed font-light">{details.performance}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-[#7a7a8c] font-bold mb-2">System Instructions Override</label>
          <textarea
            value={form.system_prompt}
            rows={4}
            onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
            className="w-full bg-[#050507] border border-white/5 focus:border-[rgba(59,130,246,0.25)] rounded-xl px-4 py-3.5 text-sm text-[#f0f0f5] placeholder-[#7a7a8c] outline-none transition-colors resize-none font-light leading-relaxed"
            placeholder="Instruct Prodigy on behavior profiles (e.g., 'You are a concise, security-first expert assistant...')"
          />
        </div>
      </section>
    </div>
  );
}