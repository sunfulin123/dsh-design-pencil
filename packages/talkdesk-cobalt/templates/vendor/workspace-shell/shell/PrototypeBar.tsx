// The prototype-only bar above the Workspace window: window sizes, feature flags
// and a readout of the widths. It isn't part of Workspace.

import { useEffect, useRef, useState } from "react";
import type { WindowPreset } from "../config";
import { FEATURE_FLAGS } from "../flags";
import { useShell } from "./context";

// The window sizes of the docs' "How much width an app gets" table (Space and viewports). The app widths in the
// titles are for an app with sections, as in that table.
const PRESETS: { id: WindowPreset; label: string; title: string }[] = [
  { id: "fill", label: "Fill", title: "Fill the browser window" },
  { id: "1920", label: "1920", title: "1920px wide: with the drawer and the secondary area open, the app gets 1250px (large)" },
  { id: "1440", label: "1440", title: "1440px wide: with the drawer and the secondary area open, the app gets 770px (medium)" },
  { id: "1280", label: "1280", title: "1280px wide: with the drawer and the secondary area open, the app gets 610px (small)" },
  { id: "1024", label: "1024", title: "1024px wide: the app gets 754px (medium) beside the drawer, or 354px (small) with the secondary area too" },
  { id: "640", label: "640", title: "640px wide: Workspace's small-window layout, with nothing beside the app" },
  { id: "desktop", label: "Desktop 424 × 540", title: "The desktop app's first and minimum size: the app gets 356px (small)" },
];

const viewportOf = (width: number) => (width <= 640 ? "small" : width <= 960 ? "medium" : "large");

export function PrototypeBar({ appWidth }: { appWidth: number }) {
  const { state, dispatch, layout } = useShell();
  const [flagsOpen, setFlagsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(0);
  const offCount = FEATURE_FLAGS.filter((flag) => !state.flags[flag.id]).length;

  useEffect(() => {
    if (!flagsOpen) return;
    setLeft(buttonRef.current?.getBoundingClientRect().left ?? 0);
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) setFlagsOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFlagsOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [flagsOpen]);

  return (
    <div className="ws-proto-bar" role="region" aria-label="Prototype settings (not part of Workspace)">
      <span className="ws-proto-bar__label">Prototype</span>
      <span className="ws-proto-bar__group" role="group" aria-label="Window size">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            title={preset.title}
            aria-pressed={state.preset === preset.id}
            onClick={() => dispatch({ type: "preset", preset: preset.id })}
          >
            {preset.label}
          </button>
        ))}
      </span>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={flagsOpen}
        aria-haspopup="dialog"
        onClick={() => setFlagsOpen(!flagsOpen)}
      >
        Feature flags{offCount > 0 ? ` (${offCount} off)` : ": all on"}
      </button>
      <button
        type="button"
        title="Forget the drawer, secondary area and dock choices kept in this browser"
        onClick={() => {
          try {
            window.localStorage.removeItem("workspace-shell:preferences");
          } catch {
            // Storage unavailable: nothing to forget.
          }
          window.location.reload();
        }}
      >
        Reset
      </button>
      <span className="ws-proto-bar__readout" data-testid="ws-readout">
        Window {layout.windowWidth} × {layout.windowHeight} · App {appWidth}px ({viewportOf(appWidth)})
      </span>
      {flagsOpen ? (
        <div className="ws-proto-flags" ref={panelRef} role="dialog" aria-label="Feature flags" style={{ left }}>
          {FEATURE_FLAGS.map((flag) => (
            <label key={flag.id}>
              <input
                type="checkbox"
                checked={state.flags[flag.id]}
                onChange={(event) => dispatch({ type: "flag", flag: flag.id, on: event.target.checked })}
              />
              <span>
                {flag.label}
                <small>{flag.effect}</small>
              </span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
