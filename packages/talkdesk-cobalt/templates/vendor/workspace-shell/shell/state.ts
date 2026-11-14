// The shell's state: what the user has open, and what apps asked for. Slot
// preferences follow atlas ui.manager/reducers.js; they're kept in the browser's
// storage, as Workspace keeps them.

import type { ResolvedConfig, ResolvedNotification, WindowPreset } from "../config";
import type { ThemeMode } from "../theme";
import type { FeatureFlag, FeatureFlags } from "../flags";
import type { BannerMessageData, ErrorScreenType, PanelMessageData, ToastMessageData } from "../sdk/protocol";
import { bumpRecency, DEFAULT_RECENCY, type Slot } from "../space";

export interface ShellToast extends ToastMessageData {
  id: string;
  /** Milliseconds, 0 for never (atlas parse.dismiss.delay.js). */
  timeout: number;
}

export interface ShellBanner extends BannerMessageData {
  id: string;
  createdAt: number;
}

export interface ShellPanel extends PanelMessageData {
  id: string;
}

export interface ShellState {
  appId: string;
  page?: string;
  /** Drawer opened over the app by hover (atlas ui-manager drawer.open). */
  drawerHoverOpen: boolean;
  /** The user wants the drawer fixed beside the app (drawer.fixed). */
  drawerFixed: boolean;
  secondaryOpen: boolean;
  secondaryAppId?: string;
  /** Secondary apps loaded so far (Workspace keeps them loaded when switching). */
  secondaryLoaded: string[];
  /** Width chosen by dragging, when resizing is on. */
  secondaryWidth?: number;
  dockExpanded: boolean;
  recency: Slot[];
  badges: Record<string, boolean>;
  errors: Record<string, boolean>;
  toasts: ShellToast[];
  banners: ShellBanner[];
  notifications: ResolvedNotification[];
  notificationsOpen: boolean;
  flags: FeatureFlags;
  statusId: string | null;
  statusSince: number;
  errorScreen?: ErrorScreenType;
  panel?: ShellPanel;
  preset: WindowPreset;
  /** The profile menu's Theme choice. */
  themeMode: ThemeMode;
  /** The desktop app widens its window when the user opens something that doesn't fit. */
  desktopWidth: number;
}

export type Action =
  | { type: "select-app"; appId: string; page?: string }
  | { type: "select-page"; page: string }
  | { type: "drawer-hover"; open: boolean }
  | { type: "drawer-fixed"; fixed: boolean }
  | { type: "secondary-open"; open: boolean; fromUser: boolean }
  | { type: "secondary-app"; appId: string }
  | { type: "secondary-width"; width: number }
  | { type: "dock-expanded"; expanded: boolean }
  | { type: "badge"; appId: string; visible: boolean }
  | { type: "toast"; toast: ShellToast }
  | { type: "dismiss-toast"; id: string }
  | { type: "banner"; banner: ShellBanner }
  | { type: "dismiss-banner"; id: string }
  | { type: "notifications-open"; open: boolean }
  | { type: "notification-read"; id: string }
  | { type: "flag"; flag: FeatureFlag; on: boolean }
  | { type: "status"; statusId: string }
  | { type: "error-screen"; errorType?: ErrorScreenType }
  | { type: "panel"; panel?: ShellPanel }
  | { type: "preset"; preset: WindowPreset }
  | { type: "theme-mode"; mode: ThemeMode }
  | { type: "desktop-width"; width: number };

const STORAGE_KEY = "workspace-shell:preferences";
export const DESKTOP_SIZE = { width: 424, height: 540 };

interface Stored {
  drawerFixed?: boolean;
  secondaryAreaFixed?: boolean;
  dockExpanded?: boolean;
  slotRecency?: Slot[];
  secondaryApp?: string;
  secondaryWidth?: number;
  preset?: WindowPreset;
  themeMode?: ThemeMode;
}

function readStored(): Stored {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Stored;
  } catch {
    return {};
  }
}

export function writeStored(state: ShellState): void {
  const stored: Stored = {
    drawerFixed: state.drawerFixed,
    secondaryAreaFixed: state.secondaryOpen,
    dockExpanded: state.dockExpanded,
    slotRecency: state.recency,
    secondaryApp: state.secondaryAppId,
    secondaryWidth: state.secondaryWidth,
    preset: state.preset,
    themeMode: state.themeMode,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Storage can be unavailable (private windows); preferences then last for the page only.
  }
}

function validRecency(recency: unknown): Slot[] | null {
  if (!Array.isArray(recency)) return null;
  const slots: Slot[] = ["drawer", "secondaryArea", "dock"];
  if (!recency.every((slot) => slots.includes(slot)) || new Set(recency).size !== recency.length) return null;
  if (!recency.includes("drawer") || !recency.includes("secondaryArea")) return null;
  return recency.includes("dock") ? (recency as Slot[]) : [...(recency as Slot[]), "dock"];
}

export function initialState(config: ResolvedConfig): ShellState {
  const stored = readStored();
  const secondaryAppId =
    config.secondaryApps.find((app) => app.id === stored.secondaryApp)?.id ?? config.secondaryCurrent;
  return {
    appId: config.appId,
    page: config.page,
    drawerHoverOpen: false,
    drawerFixed: stored.drawerFixed ?? true,
    secondaryOpen: stored.secondaryAreaFixed ?? config.secondaryOpen,
    secondaryAppId,
    secondaryLoaded: secondaryAppId ? [secondaryAppId] : [],
    secondaryWidth: stored.secondaryWidth,
    dockExpanded: config.flags.expandedDock && (stored.dockExpanded ?? false),
    recency: validRecency(stored.slotRecency) ?? DEFAULT_RECENCY,
    badges: Object.fromEntries(config.dock.filter((app) => app.badge).map((app) => [app.id, true])),
    errors: Object.fromEntries(config.dock.filter((app) => app.error).map((app) => [app.id, true])),
    toasts: [],
    banners: [],
    notifications: config.notifications,
    notificationsOpen: false,
    flags: config.flags,
    statusId: config.status ? config.status.current : null,
    statusSince: config.status ? config.status.since : Date.now(),
    preset: stored.preset ?? config.window,
    themeMode: stored.themeMode ?? "light",
    desktopWidth: DESKTOP_SIZE.width,
  };
}

export function reducer(state: ShellState, action: Action): ShellState {
  switch (action.type) {
    case "select-app":
      return { ...state, appId: action.appId, page: action.page, errorScreen: undefined, panel: undefined };
    case "select-page":
      return { ...state, page: action.page, errorScreen: undefined };
    case "drawer-hover":
      return { ...state, drawerHoverOpen: action.open };
    case "drawer-fixed":
      return {
        ...state,
        drawerFixed: action.fixed,
        recency: action.fixed ? bumpRecency(state.recency, "drawer") : state.recency,
      };
    case "secondary-open":
      return {
        ...state,
        secondaryOpen: action.open,
        recency: action.open && action.fromUser ? bumpRecency(state.recency, "secondaryArea") : state.recency,
      };
    case "secondary-app":
      return {
        ...state,
        secondaryAppId: action.appId,
        secondaryLoaded: state.secondaryLoaded.includes(action.appId)
          ? state.secondaryLoaded
          : [...state.secondaryLoaded, action.appId],
      };
    case "secondary-width":
      return { ...state, secondaryWidth: action.width };
    case "dock-expanded": {
      const expanded = state.flags.expandedDock && action.expanded;
      return { ...state, dockExpanded: expanded, recency: expanded ? bumpRecency(state.recency, "dock") : state.recency };
    }
    case "badge":
      return { ...state, badges: { ...state.badges, [action.appId]: action.visible } };
    case "toast":
      return { ...state, toasts: [...state.toasts, action.toast] };
    case "dismiss-toast":
      return { ...state, toasts: state.toasts.filter((toast) => toast.id !== action.id) };
    case "banner":
      return state.banners.some((banner) => banner.id === action.banner.id)
        ? state
        : { ...state, banners: [action.banner, ...state.banners] };
    case "dismiss-banner":
      return { ...state, banners: state.banners.filter((banner) => banner.id !== action.id) };
    case "notifications-open":
      return { ...state, notificationsOpen: action.open };
    case "notification-read":
      return {
        ...state,
        notifications: state.notifications.map((item) => (item.id === action.id ? { ...item, read: true } : item)),
      };
    case "flag": {
      const flags = { ...state.flags, [action.flag]: action.on };
      return {
        ...state,
        flags,
        dockExpanded: flags.expandedDock && state.dockExpanded,
        notificationsOpen: flags.notificationCenter && state.notificationsOpen,
      };
    }
    case "status":
      return { ...state, statusId: action.statusId, statusSince: Date.now() };
    case "error-screen":
      return { ...state, errorScreen: action.errorType };
    case "panel":
      return { ...state, panel: action.panel };
    case "preset":
      return { ...state, preset: action.preset, desktopWidth: DESKTOP_SIZE.width };
    case "theme-mode":
      return { ...state, themeMode: action.mode };
    case "desktop-width":
      return { ...state, desktopWidth: action.width };
  }
}
