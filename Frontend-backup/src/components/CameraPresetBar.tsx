import { useEffect, useSyncExternalStore } from "react";
import { PRESETS, PRESET_ORDER, earthBus } from "@/lib/earth-bus";

export function CameraPresetBar() {
  const snap = useSyncExternalStore(earthBus.subscribe, earthBus.getSnapshot, earthBus.getSnapshot);
  const activeIndex = PRESET_ORDER.indexOf(snap.preset);

  // 1 / 2 / 3 jump between viewpoints (ignored while typing in the form).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)))
        return;
      const preset = PRESET_ORDER[Number(event.key) - 1];
      if (preset) earthBus.setPreset(preset);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <nav
      className="preset-bar"
      aria-label="Camera viewpoints"
      style={{ "--i": activeIndex } as React.CSSProperties}
    >
      <i className="preset-indicator" aria-hidden="true" />
      {PRESET_ORDER.map((id, index) => (
        <button
          key={id}
          type="button"
          aria-pressed={snap.preset === id}
          onClick={() => earthBus.setPreset(id)}
        >
          <kbd aria-hidden="true">{index + 1}</kbd>
          <span className="long">{PRESETS[id].label}</span>
          <span className="short">{PRESETS[id].short}</span>
        </button>
      ))}
    </nav>
  );
}
