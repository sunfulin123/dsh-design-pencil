// Workspace stand-in shell for prototypes. See README.md.

export { mountPrototype, type MountOptions } from "./mount";
export {
  addDockApp,
  pagesOf,
  withSections,
  DEFAULT_DOCK_APPS,
  DEFAULT_SECONDARY_APPS,
  DEFAULT_STATUSES,
  PROFILE_MENU_ITEMS,
  type AgentStatus,
  type DockApp,
  type DrawerActions,
  type DrawerGroup,
  type DrawerPage,
  type DrawerSection,
  type NotificationItem,
  type ProfileMenuItem,
  type SecondaryApp,
  type ShellConfig,
  type StatusType,
  type WindowPreset,
} from "./config";
export { FEATURE_FLAGS, type FeatureFlag, type FeatureFlags } from "./flags";
export {
  workspace,
  useWorkspacePage,
  useWorkspaceState,
  type BannerOptions,
  type Handle,
  type PanelOptions,
  type ToastOptions,
  type Workspace,
} from "./sdk/workspace";
export type { FrameState, ToastType, DismissDelay, BannerVariation, ErrorScreenType } from "./sdk/protocol";
