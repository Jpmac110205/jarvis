import {
  DocumentTextIcon,
  PhotoIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import type { Section } from "../../App";

export function ShortcutsPanel({
  onSelect,
}: {
  onSelect: (view: Section) => void;
}) {
  return (
    <section className="shortcuts">
      <h3 className="eyebrow">Quick access</h3>
      <button className="shortcut" onClick={() => onSelect("chat")}>
        <DocumentTextIcon />
        <span>
          PDFs & documents<small>Attach files in your conversation</small>
        </span>
      </button>
      <button
        className="shortcut"
        disabled
        title="Image understanding is not available"
      >
        <PhotoIcon />
        <span>
          Images<small>Not available yet</small>
        </span>
      </button>
      <button className="shortcut" onClick={() => onSelect("settings")}>
        <Cog6ToothIcon />
        <span>
          Memory & data<small>Preferences and conversation export</small>
        </span>
      </button>
    </section>
  );
}
