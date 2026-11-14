// Workspace behaviour that is behind a feature flag. A stand-in shell turns every
// flag on (see the docs' "Build with AI" page); the prototype bar
// lets you switch each one off. Workspace's own names for the flags aren't published:
// ask the Workspace team for them when you need them, as with the Atlas CLI.

export type FeatureFlag =
  | "appearance"
  | "themeStylesheet"
  | "notificationCenter"
  | "shortcuts"
  | "expandedDock"
  | "appConnect"
  | "secondaryAreaResize"
  | "desktopUpdateEntry";

export type FeatureFlags = Record<FeatureFlag, boolean>;

export interface FeatureFlagInfo {
  id: FeatureFlag;
  label: string;
  /** What switching it changes in the stand-in. */
  effect: string;
}

export const FEATURE_FLAGS: FeatureFlagInfo[] = [
  {
    id: "notificationCenter",
    label: "Notification center",
    effect: "The notifications button and center. Off also hides search, as in Workspace's code.",
  },
  {
    id: "appearance",
    label: "Appearance in the profile menu",
    effect: "The Theme submenu (Light, Dark, Match system), which themes Workspace itself.",
  },
  {
    id: "themeStylesheet",
    label: "Theme stylesheet in the app",
    effect: "The Theme choice reaches the apps too. Off, they stay light.",
  },
  {
    id: "shortcuts",
    label: "Keyboard shortcuts",
    effect: "⌘K / Ctrl+Shift+F, Alt+S, Alt+1–9, shortcut hints, and the profile menu item.",
  },
  {
    id: "expandedDock",
    label: "Expanded dock",
    effect: "The expand button at the top of the dock.",
  },
  {
    id: "appConnect",
    label: "AppConnect launcher",
    effect: "The launcher at the bottom of the dock.",
  },
  {
    id: "secondaryAreaResize",
    label: "Resizing the secondary area",
    effect: "Drag the secondary area's left border (360px to half the space).",
  },
  {
    id: "desktopUpdateEntry",
    label: "Desktop update entry",
    effect: "An update entry at the top of the notification center.",
  },
];

export const ALL_FLAGS_ON: FeatureFlags = Object.fromEntries(
  FEATURE_FLAGS.map((flag) => [flag.id, true]),
) as FeatureFlags;
