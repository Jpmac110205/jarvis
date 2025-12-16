export function ShortcutsPanel() {
    const baseClass = "w-14 h-14 bg-neutral-800/60 backdrop-blur-sm rounded-xl hover:bg-neutral-700/60 transition-all duration-200 text-neutral-100 flex items-center justify-center text-xs font-medium border border-neutral-700/50 hover:border-blue-500/50 hover:scale-105 active:scale-95 shadow-lg hover:shadow-blue-500/20";
    return (
        <div className="w-full">
            <h2 className="text-xs uppercase tracking-wider text-neutral-500 mb-3 font-semibold">Shortcuts</h2>
            <div className="flex gap-3 justify-center">
                <button className={baseClass} title="PDFs">
                    PDFs
                </button>
                <button className={baseClass} title="Docs">
                    Docs
                </button>
                <button className={baseClass} title="Images">
                    Images
                </button>
            </div>
        </div>
    );
}
