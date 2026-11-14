// How Workspace shares the window's width, ported from atlas
// packages/ui/src/ui.manager/selectors.ts and reducers.js.

export const TITLE_BAR_HEIGHT = 40;
export const DOCK_WIDTH = 58;
export const DOCK_EXPANDED_WIDTH = 240;
export const DRAWER_OPEN_WIDTH = 212;
export const DRAWER_CLOSED_WIDTH = 16;
export const DRAWER_CLOSED_WIDTH_SMALL = 10;
export const MINIMUM_APP_CONTENT_WIDTH = 360;
export const SECONDARY_AREA_DEFAULT_WIDTH = 400;
export const SECONDARY_AREA_MIN_WIDTH = 360;
/** Cobalt's small viewport ends here (BREAKPOINTS.small.max). */
export const SMALL_MAX = 640;
export const DRAWER_HOVER_DELAY = 200;
export const TRANSITION_MS = 300;

export type Slot = "drawer" | "secondaryArea" | "dock";

/** Before the user has chosen: the secondary area, then the drawer, then the expanded dock. */
export const DEFAULT_RECENCY: Slot[] = ["secondaryArea", "drawer", "dock"];

const SLOT_WIDTHS: Record<Slot, number> = {
  drawer: DRAWER_OPEN_WIDTH,
  secondaryArea: SECONDARY_AREA_MIN_WIDTH,
  dock: DOCK_EXPANDED_WIDTH - DOCK_WIDTH,
};

export const isSmall = (width: number) => width <= SMALL_MAX;

export interface SlotWants {
  /** The user wants the drawer fixed open (Workspace counts it even for an app without sections). */
  drawer: boolean;
  secondaryArea: boolean;
  dock: boolean;
}

export interface SlotVisibility {
  drawerVisible: boolean;
  secondaryAreaVisible: boolean;
  dockExpandedVisible: boolean;
}

/**
 * Sets aside 418px (360px for the app and the 58px dock), then goes through the
 * parts the user wants open, most recently opened first, and shows each one while
 * the remaining width covers it. It stops at the first one that doesn't fit.
 */
export function slotVisibility(width: number, wants: SlotWants, recency: Slot[]): SlotVisibility {
  let available = width - (MINIMUM_APP_CONTENT_WIDTH + DOCK_WIDTH);
  const visible: Record<Slot, boolean> = { drawer: false, secondaryArea: false, dock: false };
  const small = isSmall(width);

  for (const slot of recency) {
    if (!wants[slot]) continue;
    const cost = SLOT_WIDTHS[slot];
    const fits = cost <= available && (slot === "secondaryArea" || !small);
    if (!fits) break;
    visible[slot] = true;
    available -= cost;
  }

  return {
    drawerVisible: visible.drawer,
    secondaryAreaVisible: visible.secondaryArea,
    dockExpandedVisible: visible.dock,
  };
}

/** Moves a slot to the front when the user turns it on. */
export function bumpRecency(recency: Slot[], slot: Slot): Slot[] {
  return recency[0] === slot ? recency : [slot, ...recency.filter((item) => item !== slot)];
}

/** The window width needed for everything the user has turned on (what the desktop app grows to). */
export function requiredWidth(wants: SlotWants): number {
  const width = (Object.keys(SLOT_WIDTHS) as Slot[])
    .filter((slot) => wants[slot])
    .reduce((total, slot) => total + SLOT_WIDTHS[slot], MINIMUM_APP_CONTENT_WIDTH + DOCK_WIDTH);
  return wants.drawer || wants.dock ? Math.max(width, SMALL_MAX + 1) : width;
}
