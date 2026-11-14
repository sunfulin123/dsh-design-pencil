// The Workspace SDK stand-in. An app imports `workspace` and asks for what it would
// ask the real Workspace SDK for; the stand-in shell draws it outside the app's
// frame. Requests the shell can't show log a console message instead of failing.

import { useEffect, useState } from "react";
import { ALL_FLAGS_ON } from "../flags";
import { setColorScheme } from "../theme";
import {
  CHANNEL,
  isEnvelope,
  type AppToShellMessage,
  type BannerVariation,
  type DismissDelay,
  type ErrorScreenType,
  type FrameState,
  type ShellToAppMessage,
  type ToastType,
} from "./protocol";

export interface ToastOptions {
  message: string;
  title?: string;
  /** Default: "info". */
  type?: ToastType;
  /** short 3s, medium 5s, long 7s, or infinite (the default, as in Workspace). */
  dismissDelay?: DismissDelay;
  /** Default: true. */
  dismissible?: boolean;
  /** Up to two buttons. */
  actions?: { label: string; onClick?: () => void }[];
}

export interface BannerOptions {
  message: string;
  /** Default: "info". */
  variation?: BannerVariation;
  /** Default: true. */
  dismissible?: boolean;
}

export interface PanelOptions {
  title: string;
  /** Default: "panel". */
  kind?: "panel" | "modal";
  /** Names of the apps it holds, one tab each (in Workspace each is another app). */
  tabs?: string[];
  onClose?: () => void;
}

export interface Handle {
  dismiss(): void;
}

const PREFIX = "[workspace stand-in]";
// The shell loads the app with ?frame=app (or ?frame=secondary) in its own iframe.
const inFrame =
  typeof window !== "undefined" &&
  window.parent !== window &&
  new URLSearchParams(window.location.search).has("frame");

let state: FrameState = { area: "primary", appId: "", flags: ALL_FLAGS_ON, colorScheme: "light" };
const stateListeners = new Set<(state: FrameState, reason: string) => void>();
const navigateListeners = new Set<(page: string) => void>();
const actionListeners = new Set<(actionId: string) => void>();
const toastActions = new Map<string, ToastOptions["actions"]>();
const panelCloses = new Map<string, (() => void) | undefined>();
let counter = 0;
const nextId = (kind: string) => `${kind}-${Date.now().toString(36)}-${counter++}`;

function send(message: AppToShellMessage): boolean {
  if (!inFrame) {
    console.info(`${PREFIX} ${message.type}: not running inside the stand-in shell, so nothing is drawn.`, message);
    return false;
  }
  window.parent.postMessage({ ...message, channel: CHANNEL }, "*");
  return true;
}

function notAvailable(what: string, inWorkspace: string): Promise<never> {
  console.info(`${PREFIX} ${what} has no stand-in. In Workspace, ${inWorkspace}`);
  return Promise.reject(new Error(`${what} isn't available in the stand-in shell`));
}

if (inFrame) {
  window.addEventListener("message", (event: MessageEvent) => {
    if (event.source !== window.parent || !isEnvelope<ShellToAppMessage>(event.data)) return;
    const message = event.data;
    switch (message.type) {
      case "state": {
        const pageChanged = message.state.page !== state.page;
        state = message.state;
        setColorScheme(state.colorScheme);
        stateListeners.forEach((listener) => listener(state, message.reason));
        if (message.reason === "navigate" && pageChanged && message.state.page) {
          navigateListeners.forEach((listener) => listener(message.state.page as string));
        }
        break;
      }
      case "toast-action":
        toastActions.get(message.id)?.[message.index]?.onClick?.();
        break;
      case "toast-closed":
        toastActions.delete(message.id);
        break;
      case "panel-closed":
        panelCloses.get(message.id)?.();
        panelCloses.delete(message.id);
        break;
      case "drawer-action":
        actionListeners.forEach((listener) => listener(message.id));
        break;
    }
  });
  // Workspace's shortcuts work while focus is inside an app, so pass them up.
  window.addEventListener("keydown", (event: KeyboardEvent) => {
    if (!state.flags.shortcuts) return;
    const { code, altKey, ctrlKey, metaKey, shiftKey } = event;
    const isShellShortcut =
      (altKey && (code === "KeyS" || /^Digit[1-9]$/.test(code))) ||
      (metaKey && (code === "KeyK" || code === "Slash")) ||
      (ctrlKey && shiftKey && code === "KeyF");
    if (!isShellShortcut) return;
    event.preventDefault();
    send({ type: "key", code, altKey, ctrlKey, metaKey, shiftKey });
  });
  send({ type: "ready" });
}

export const workspace = {
  /** True when the app runs inside the stand-in shell's frame. */
  get connected(): boolean {
    return inFrame;
  },

  /** Which area the frame is in, its app, the current drawer page and the feature flags. */
  getState(): FrameState {
    return state;
  },

  /** Called whenever the shell sends new state (navigation, flag switches). Returns an unsubscribe function. */
  subscribe(listener: (state: FrameState) => void): () => void {
    stateListeners.add(listener);
    return () => stateListeners.delete(listener);
  },

  // ---- Messages --------------------------------------------------------------

  /** A toast at the bottom right of the Workspace window (Atlas.toast.show). */
  toast(options: ToastOptions): Promise<Handle> {
    const id = nextId("toast");
    const actions = (options.actions ?? []).slice(0, 2);
    if ((options.actions?.length ?? 0) > 2) console.warn(`${PREFIX} A toast takes up to two buttons; the rest are left out.`);
    toastActions.set(id, actions);
    send({
      type: "toast",
      id,
      toast: {
        title: options.title,
        message: options.message,
        type: options.type ?? "info",
        dismissDelay: options.dismissDelay ?? "infinite",
        dismissible: options.dismissible ?? true,
        actions: actions.map((action) => ({ label: action.label })),
      },
    });
    return Promise.resolve({ dismiss: () => void send({ type: "dismiss-toast", id }) });
  },

  /** A banner across the top of the primary and secondary areas (Messages plugin). */
  banner(options: BannerOptions): Promise<Handle> {
    const id = nextId("banner");
    send({
      type: "banner",
      id,
      banner: {
        message: options.message,
        variation: options.variation ?? "info",
        dismissible: options.dismissible ?? true,
      },
    });
    return Promise.resolve({ dismiss: () => void send({ type: "dismiss-banner", id }) });
  },

  /** An operating system notification. The stand-in only logs it. */
  notify(options: { title: string; body?: string; link?: string; requireInteraction?: boolean }): Promise<void> {
    console.info(
      `${PREFIX} Operating system notification (not drawn: it would appear in the operating system's notification area).`,
      options,
    );
    return Promise.resolve();
  },

  // ---- Dock and drawer -------------------------------------------------------

  /** Shows or hides the "•" badge on the app's dock button (Atlas.badge.set). `app` picks another dock entry. */
  setBadge(visible: boolean, options: { app?: string } = {}): Promise<void> {
    send({ type: "badge", visible, app: options.app });
    return Promise.resolve();
  },

  /** Tells Workspace the app moved to another page, so the drawer highlights it. Takes a drawer page id. */
  navigate(page: string): Promise<void> {
    state = { ...state, page };
    stateListeners.forEach((listener) => listener(state, "app"));
    send({ type: "navigate", page });
    return Promise.resolve();
  },

  /** Called when the user picks one of the app's pages in the drawer. Returns an unsubscribe function. */
  onNavigate(listener: (page: string) => void): () => void {
    navigateListeners.add(listener);
    return () => navigateListeners.delete(listener);
  },

  /** Called when the user clicks one of the app's drawer actions. */
  onAction(listener: (actionId: string) => void): () => void {
    actionListeners.add(listener);
    return () => actionListeners.delete(listener);
  },

  // ---- Areas -----------------------------------------------------------------

  /** Closes the secondary area (secondary area plugin). Apps can't open it. */
  closeSecondaryArea(): Promise<void> {
    send({ type: "close-secondary-area" });
    return Promise.resolve();
  },

  /** Replaces the app's content with Workspace's error screen (Atlas.lifecycle.showError). */
  showError(type: ErrorScreenType): Promise<void> {
    if (type !== "UNAUTHORIZED" && type !== "NOT_FOUND") {
      return Promise.reject(new Error(`showError accepts UNAUTHORIZED or NOT_FOUND, not ${String(type)}`));
    }
    send({ type: "show-error", errorType: type });
    return Promise.resolve();
  },

  /** A Workspace panel or modal over the app's area. Its content would be other apps; the stand-in draws a placeholder. */
  openPanel(options: PanelOptions): Promise<{ close(): void }> {
    if (state.area === "secondary") {
      return notAvailable("Opening a panel from the secondary area", "only apps in the primary area can open one.");
    }
    const id = nextId("panel");
    panelCloses.set(id, options.onClose);
    send({ type: "open-panel", id, panel: { kind: options.kind ?? "panel", title: options.title, tabs: options.tabs ?? [] } });
    return Promise.resolve({ close: () => void send({ type: "close-panel", id }) });
  },

  // ---- Theme and environment -------------------------------------------------

  theme: {
    /**
     * In Workspace this returns the theme for the app's ThemeProvider. Here it's none: the stand-in has already
     * set the app up like an app with dark mode support, its colours coming from the theme stylesheet.
     */
    getConfig(): Promise<undefined> {
      return Promise.resolve(undefined);
    },
  },

  // ---- Requests with no stand-in ---------------------------------------------

  /** Protocols ("open this contact"): logged. */
  triggerProtocol(name: string, params?: Record<string, unknown>): Promise<never> {
    console.info(`${PREFIX} protocol "${name}"`, params ?? {});
    return notAvailable("Triggering a protocol", "Workspace brings the app that handles it to the front.");
  },

  /** Background apps coming to the front: logged. */
  bringToFront(): Promise<never> {
    return notAvailable("Bringing an app to the front", "a background app with the `background` capability can do this.");
  },

  /** App keyboard shortcuts: logged. They're declared in the app's configuration. */
  registerShortcut(shortcut: { keys: string; name: string; scope?: "app" | "global" }): Promise<never> {
    return notAvailable(
      `Shortcut "${shortcut.keys}" (${shortcut.name})`,
      "shortcuts are declared in the app's configuration and listed in Workspace's shortcuts list.",
    );
  },

  /** Floating windows (desktop app only): logged. */
  openFloatingWindow(): Promise<never> {
    return notAvailable("A floating window", "the desktop app shows a 420 × 74px window above every other window.");
  },
};

export type Workspace = typeof workspace;

/** React hook: the frame's current state (area, app, page, flags). */
export function useWorkspaceState(): FrameState {
  const [current, setCurrent] = useState(state);
  useEffect(() => workspace.subscribe(setCurrent), []);
  return current;
}

/** React hook: the current drawer page id, kept in step with the drawer. */
export function useWorkspacePage(): string | undefined {
  return useWorkspaceState().page;
}
