// Messages between the app's iframe and the stand-in shell (window.postMessage).
// Every message carries `channel: CHANNEL` so the two sides ignore anything else.

import type { FeatureFlags } from "../flags";

export const CHANNEL = "workspace-shell";

export type ToastType = "success" | "info" | "warning" | "error" | "primary" | "secondary";
export type DismissDelay = "short" | "medium" | "long" | "infinite";
export type BannerVariation = "success" | "warning" | "info" | "error" | "feature";
export type ErrorScreenType = "UNAUTHORIZED" | "NOT_FOUND";
export type FrameArea = "primary" | "secondary";

export interface ToastMessageData {
  title?: string;
  message: string;
  type: ToastType;
  dismissDelay: DismissDelay;
  dismissible: boolean;
  actions: { label: string }[];
}

export interface BannerMessageData {
  message: string;
  variation: BannerVariation;
  dismissible: boolean;
}

export interface PanelMessageData {
  kind: "panel" | "modal";
  title: string;
  /** Names of the apps it would hold, one tab each. */
  tabs: string[];
}

/** What the shell tells a frame about itself. */
export interface FrameState {
  area: FrameArea;
  /** The dock app (primary) or secondary app the frame shows. */
  appId: string;
  /** The current drawer page (primary area only). */
  page?: string;
  flags: FeatureFlags;
  /** Light or dark, as Workspace sets data-co-colorscheme on an app's page. */
  colorScheme: "light" | "dark";
}

export type AppToShellMessage =
  | { type: "ready" }
  | { type: "toast"; id: string; toast: ToastMessageData }
  | { type: "dismiss-toast"; id: string }
  | { type: "banner"; id: string; banner: BannerMessageData }
  | { type: "dismiss-banner"; id: string }
  | { type: "badge"; visible: boolean; app?: string }
  | { type: "navigate"; page: string }
  | { type: "close-secondary-area" }
  | { type: "show-error"; errorType: ErrorScreenType }
  | { type: "open-panel"; id: string; panel: PanelMessageData }
  | { type: "close-panel"; id: string }
  | { type: "key"; code: string; altKey: boolean; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean };

export type ShellToAppMessage =
  | { type: "state"; state: FrameState; reason: "init" | "navigate" | "flags" | "theme" }
  | { type: "toast-action"; id: string; index: number }
  | { type: "toast-closed"; id: string }
  | { type: "panel-closed"; id: string }
  | { type: "drawer-action"; id: string };

export type Envelope<T> = T & { channel: typeof CHANNEL };

export function isEnvelope<T>(data: unknown): data is Envelope<T> {
  return typeof data === "object" && data !== null && (data as { channel?: unknown }).channel === CHANNEL;
}
