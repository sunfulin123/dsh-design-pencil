import type { ReactNode } from "react";
import type { Name as IconName } from "@talkdesk/cobalt-react-icon";
import { ALL_FLAGS_ON, type FeatureFlags } from "./flags";
import { DEFAULT_DOCK_APPS, DEFAULT_SECONDARY_APPS, PROFILE_MENU_ITEMS } from "./data/menu.generated";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A page in an app's drawer. `id` is what `app.page` and `workspace.navigate()` use. */
export interface DrawerPage {
  type: "page";
  id: string;
  title: string;
}

/** A group title (not clickable) with pages under it. */
export interface DrawerGroup {
  type: "group";
  title: string;
  pages: DrawerPage[];
}

/** A block of buttons between two dividers. Clicking one runs `workspace.onAction` in the app. */
export interface DrawerActions {
  type: "actions";
  actions: { id: string; title: string; icon?: IconName }[];
}

export type DrawerSection = DrawerPage | DrawerGroup | DrawerActions;

/** A dock entry. An app without `sections` has no drawer. */
export interface DockApp {
  id: string;
  title: string;
  /** URL of an SVG that uses `fill` (the dock recolours it), or a Cobalt icon name with `iconName`. */
  icon?: string;
  iconName?: IconName;
  sections?: DrawerSection[];
  /** Show the "•" badge from the start. */
  badge?: boolean;
  /** Show the "!" badge (the app failed to load). It shows only while another app is open. */
  error?: boolean;
}

/** An app for the secondary area. */
export interface SecondaryApp {
  id: string;
  title: string;
  icon?: string;
  iconName?: IconName;
  /** Shows the "AI Powered" tag in the header. */
  ai?: boolean;
  /** What the app shows. Rendered in its own iframe, like the primary app. */
  content?: ReactNode;
}

export type StatusType = "available" | "busy" | "after_call_work" | "away" | "offline";

export interface AgentStatus {
  id: string;
  name: string;
  type: StatusType;
}

export interface ProfileMenuItem {
  type: "page" | "link" | "submenu";
  title: string;
  items?: ProfileMenuItem[];
  /** The "About" submenu, which shows the version first. */
  about?: boolean;
}

export interface NotificationItem {
  id?: string;
  title: string;
  body?: string;
  /** The app it came from, shown as a tag. */
  origin?: string;
  /** SVG or image URL. */
  icon?: string;
  /** ISO date or timestamp. Defaults to now. */
  createdAt?: string | number;
  read?: boolean;
  /** Whether clicking it opens a link (it then gets a hover state). */
  hasLink?: boolean;
}

// The window sizes of the Space and viewports page's table, one for each width an app can end up with.
export type WindowPreset = "fill" | "1920" | "1440" | "1280" | "1024" | "640" | "desktop";

/** Everything a prototype can set. All fields are optional. */
export interface ShellConfig {
  /** The prototype's own app: which dock entry it is and which drawer page is current. */
  app?: {
    /** A dock app id (default: the first dock app). */
    id?: string;
    /** A page id from that app's sections. */
    page?: string;
  };
  /** The dock entries, in order. Default: `DEFAULT_DOCK_APPS`. Use `addDockApp()` and `withSections()` to change it. */
  dock?: DockApp[];
  user?: {
    name?: string;
    /** Default: worked out from `name`, as Workspace does. */
    initials?: string;
    /** Not drawn by Workspace's title bar (it shows initials); kept for prototypes that need it elsewhere. */
    avatarUrl?: string;
  };
  /** The status pill. `false` hides it (an app turns it on in Workspace, such as Conversations). */
  status?:
    | false
    | {
        /** Id of the current status, from `statuses`. Default: "available". */
        current?: string;
        /** When the current status started (timestamp in ms). Default: page load. */
        since?: number;
        statuses?: AgentStatus[];
      };
  secondaryArea?: {
    /** Default: Copilot, Canvas and Smart Help. `[]` removes the area and its toggle. */
    apps?: SecondaryApp[];
    /** Id of the app shown first. Default: the first. */
    current?: string;
    /** Whether the user wants it open (it shows only where it fits). Default: true. */
    open?: boolean;
  };
  /** Notifications in the notification center. Unread ones count on the button. */
  notifications?: NotificationItem[];
  /** Profile menu items between the theme selector and "Logout". Default: the production ones. */
  profileMenu?: ProfileMenuItem[];
  /** Feature flag overrides. Every flag is on by default. */
  flags?: Partial<FeatureFlags>;
  /** The Workspace window size to start with. Default: "fill". */
  window?: WindowPreset;
  /** Shortcut style in tooltips. Default: from the browser. */
  platform?: "mac" | "windows";
  /** Text of the browser tab. */
  title?: string;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------


export const DEFAULT_STATUSES: AgentStatus[] = [
  { id: "available", name: "Available", type: "available" },
  { id: "away", name: "Away", type: "away" },
  { id: "busy", name: "Busy", type: "busy" },
  { id: "after_call_work", name: "After call work", type: "after_call_work" },
  { id: "offline", name: "Offline", type: "offline" },
];

/** Default dock: Home, Conversations, … Explore, Admin, with their real sections. Default secondary area apps:
 * Copilot, Canvas and Smart Help. Only these are published: the rest of Workspace's menu stays out of the
 * public docs, so a prototype describes any other app itself (see addDockApp). */
export { DEFAULT_DOCK_APPS, DEFAULT_SECONDARY_APPS, PROFILE_MENU_ITEMS };

// ---------------------------------------------------------------------------
// Helpers for changing the dock
// ---------------------------------------------------------------------------

/** Adds an app to the dock, before `before` (default: before Admin, which stays last). */
export function addDockApp(apps: DockApp[], app: DockApp, options: { before?: string } = {}): DockApp[] {
  const before = options.before ?? "admin";
  const index = apps.findIndex((item) => item.id === before);
  const rest = apps.filter((item) => item.id !== app.id);
  if (index < 0) return [...rest, app];
  const at = rest.findIndex((item) => item.id === before);
  return [...rest.slice(0, at), app, ...rest.slice(at)];
}

/** Replaces the drawer sections of one dock app. */
export function withSections(apps: DockApp[], id: string, sections: DrawerSection[] | undefined): DockApp[] {
  return apps.map((app) => (app.id === id ? { ...app, sections } : app));
}


/** Every page of an app's sections, flattened. */
export function pagesOf(app: DockApp | undefined): DrawerPage[] {
  return (app?.sections ?? []).flatMap((section) =>
    section.type === "page" ? [section] : section.type === "group" ? section.pages : [],
  );
}

// ---------------------------------------------------------------------------
// Resolved config
// ---------------------------------------------------------------------------

export type ResolvedNotification = NotificationItem & { id: string; read: boolean; createdAt: string | number };

export interface ResolvedConfig {
  appId: string;
  page?: string;
  dock: DockApp[];
  user: { name: string; initials: string; avatarUrl?: string };
  status: false | { current: string; since: number; statuses: AgentStatus[] };
  secondaryApps: SecondaryApp[];
  secondaryCurrent?: string;
  secondaryOpen: boolean;
  notifications: ResolvedNotification[];
  profileMenu: ProfileMenuItem[];
  flags: FeatureFlags;
  window: WindowPreset;
  platform: "mac" | "windows";
}

/** Initials the way Workspace's title bar works them out: first letters of the first and last words. */
export function initialsOf(name: string): string {
  const words = name.split(" ").filter((word) => word.length > 0 && word[0].toLowerCase() !== word[0].toUpperCase());
  const first = words.shift()?.[0] ?? "";
  const last = words.pop()?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

const loadTime = Date.now();

export function resolveConfig(config: ShellConfig = {}): ResolvedConfig {
  const dock = config.dock ?? DEFAULT_DOCK_APPS;
  const appId = config.app?.id ?? dock[0]?.id ?? "home";
  const app = dock.find((item) => item.id === appId);
  if (!app) console.warn(`[workspace-shell] app.id "${appId}" isn't in the dock.`);
  const pages = pagesOf(app);
  const page = config.app?.page ?? pages[0]?.id;
  if (config.app?.page && !pages.some((item) => item.id === config.app?.page)) {
    console.warn(`[workspace-shell] app.page "${config.app.page}" isn't a page of "${appId}".`);
  }
  const name = config.user?.name ?? "Jordan Sample";
  const status = config.status;
  const statuses = (status && status.statuses) || DEFAULT_STATUSES;
  const secondaryApps = config.secondaryArea?.apps ?? DEFAULT_SECONDARY_APPS;
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  return {
    appId,
    page,
    dock,
    user: { name, initials: config.user?.initials ?? initialsOf(name), avatarUrl: config.user?.avatarUrl },
    status:
      status === false
        ? false
        : { current: (status && status.current) || statuses[0].id, since: (status && status.since) || loadTime, statuses },
    secondaryApps,
    secondaryCurrent: config.secondaryArea?.current ?? secondaryApps[0]?.id,
    secondaryOpen: config.secondaryArea?.open ?? true,
    notifications: (config.notifications ?? []).map((item, index) => ({
      ...item,
      id: item.id ?? `notification-${index}`,
      read: item.read ?? false,
      createdAt: item.createdAt ?? loadTime,
    })),
    profileMenu: config.profileMenu ?? PROFILE_MENU_ITEMS,
    flags: { ...ALL_FLAGS_ON, ...config.flags },
    window: config.window ?? "fill",
    platform: config.platform ?? (isMac ? "mac" : "windows"),
  };
}
