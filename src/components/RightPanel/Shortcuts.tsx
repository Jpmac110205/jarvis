

export function ShortcutsPanel() {
  const baseClass = "w-16 h-16 bg-[#0c0c10] border border-white/5 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-1.5 group hover:border-[rgba(59,130,246,0.35)] hover:bg-[rgba(59,130,246,0.03)] hover:-translate-y-1 shadow-lg hover:shadow-[0_10px_20px_rgba(0,0,0,0.4)] relative";
  
  const labelClass = "text-[9px] font-bold uppercase tracking-widest text-[#7a7a8c] group-hover:text-[#3b82f6] transition-colors";

  return (
    <div className="w-full">
      <h2 className="font-['Syne'] text-[11px] font-bold uppercase tracking-[0.2em] text-[#7a7a8c] mb-4">Shortcuts</h2>
      <div className="flex gap-4 justify-start">
        <button className={baseClass} title="Knowledge Base: PDFs">
          <span className="text-lg">📄</span>
          <span className={labelClass}>PDFs</span>
          {/* Subtle hover glow accent */}
          <div className="absolute inset-0 rounded-2xl bg-[#3b82f6] opacity-0 group-hover:opacity-[0.03] transition-opacity" />
        </button>
        
        <button className={baseClass} title="Knowledge Base: Docs">
          <span className="text-lg">📑</span>
          <span className={labelClass}>Docs</span>
          <div className="absolute inset-0 rounded-2xl bg-[#3b82f6] opacity-0 group-hover:opacity-[0.03] transition-opacity" />
        </button>
        
        <button className={baseClass} title="Knowledge Base: Imagery">
          <span className="text-lg">🖼️</span>
          <span className={labelClass}>Images</span>
          <div className="absolute inset-0 rounded-2xl bg-[#3b82f6] opacity-0 group-hover:opacity-[0.03] transition-opacity" />
        </button>
      </div>
    </div>
  );
}