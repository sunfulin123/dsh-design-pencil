import { createContext, useContext, useEffect, useState, type Dispatch, type KeyboardEvent as ReactKeyboardEvent } from "react";
import type { DockApp, ResolvedConfig } from "../config";
import type { Action, ShellState } from "./state";

export interface Layout {
  /** Width of the Workspace window (atlas: the ui-container's width). */
  windowWidth: number;
  windowHeight: number;
  small: boolean;
  drawerVisible: boolean;
  secondaryAreaVisible: boolean;
  dockExpandedVisible: boolean;
  /** The current app has drawer sections. */
  hasDrawer: boolean;
  /** Drawer open: fixed beside the app, or over it after a hover. */
  drawerOpen: boolean;
  secondaryShown: boolean;
}

export interface ShellApi {
  config: ResolvedConfig;
  state: ShellState;
  dispatch: Dispatch<Action>;
  layout: Layout;
  currentApp?: DockApp;
  selectApp(appId: string, page?: string): void;
  selectPage(page: string): void;
  setDrawerFixed(fixed: boolean): void;
  /** The user turns the secondary area on or off (title bar toggle, header close, Alt+S). */
  setSecondaryOpen(open: boolean): void;
  setDockExpanded(expanded: boolean): void;
  /** Logs what Workspace would do for something the stand-in doesn't draw. */
  log(message: string, detail?: unknown): void;
}

export const ShellContext = createContext<ShellApi | null>(null);

export function useShell(): ShellApi {
  const api = useContext(ShellContext);
  if (!api) throw new Error("[workspace-shell] useShell must be used inside the shell");
  return api;
}

export function logStandIn(message: string, detail?: unknown): void {
  if (detail === undefined) console.info(`[workspace stand-in] ${message}`);
  else console.info(`[workspace stand-in] ${message}`, detail);
}

/** A callback ref that re-renders when the node changes (like atlas' useState refs). */
export function useNode<T extends HTMLElement>(): [T | null, (node: T | null) => void] {
  const [node, setNode] = useState<T | null>(null);
  return [node, setNode];
}

/**
 * Arrow-key navigation for a menu's items, Escape to close and return focus to the
 * trigger. A small stand-in for atlas common/hooks/use.menu.keyboard.navigation.
 */
export function useMenuKeys(
  container: HTMLElement | null,
  isOpen: boolean,
  onClose: () => void,
  trigger: HTMLElement | null,
  initialIndex: (items: HTMLElement[]) => number = () => 0,
): void {
  useEffect(() => {
    if (!isOpen || !container) return;
    const items = () =>
      Array.from(container.querySelectorAll<HTMLElement>('[role="menuitem"], [role="menuitemradio"]')).filter(
        (item) => item.offsetParent !== null,
      );
    const list = items();
    const start = Math.max(0, initialIndex(list));
    const focusTimer = window.setTimeout(() => list[start]?.focus(), 0);

    const onKeyDown = (event: KeyboardEvent) => {
      const current = items();
      const index = current.indexOf(document.activeElement as HTMLElement);
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const delta = event.key === "ArrowDown" ? 1 : -1;
        current[(index + delta + current.length) % current.length]?.focus();
      } else if (event.key === "Home") {
        event.preventDefault();
        current[0]?.focus();
      } else if (event.key === "End") {
        event.preventDefault();
        current[current.length - 1]?.focus();
      } else if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        trigger?.focus();
      } else if (event.key === "Tab") {
        onClose();
      }
    };
    container.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      container.removeEventListener("keydown", onKeyDown);
    };
    // initialIndex is read once per opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container, isOpen, onClose, trigger]);
}

/** Enter and Space activate a focused item that isn't a native button. */
export function clickableKeyDown(action: () => void) {
  return (event: ReactKeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      action();
    }
  };
}
