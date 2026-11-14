// Port of atlas shortcuts/components/tooltip.jsx: a Marketplace Tooltip that adds a
// Cobalt Shortcut when Workspace's keyboard shortcuts are on.

import { createContext, useContext, type RefObject } from "react";
import Tooltip, {
  PositionLeftBottom,
  PositionRightBottom,
  PositionRightCenter,
  type TooltipProps,
} from "@talkdesk/cobalt-marketplace-react-tooltip";
import Shortcut from "@talkdesk/cobalt-react-shortcut";

/** origin SW, direction SE (atlas: PositionBottomLeftBottomRight). */
export const PositionBottomLeftBottomRight = PositionLeftBottom;
/** origin SE, direction SW (atlas: PositionBottomRightBottomLeft). */
export const PositionBottomRightBottomLeft = PositionRightBottom;
export { PositionRightCenter };

/** Whether shortcuts are on, and the platform for their labels. */
export const ShortcutsContext = createContext<{ enabled: boolean; platform: "mac" | "windows" }>({
  enabled: true,
  platform: "windows",
});

interface Props {
  label: string;
  triggerRef: RefObject<HTMLElement>;
  shortcut?: string;
  position?: TooltipProps["position"];
  disabled?: boolean;
}

export function ShellTooltip({ label, triggerRef, shortcut, position, disabled }: Props) {
  const { enabled, platform } = useContext(ShortcutsContext);
  if (!enabled || !shortcut) {
    return <Tooltip label={label} triggerRef={triggerRef} position={position} variation="dark" disabled={disabled} />;
  }
  return (
    <Tooltip
      triggerRef={triggerRef}
      position={position}
      variation="dark"
      disabled={disabled}
      content={
        <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          {label}
          <Shortcut platform={platform} aria-label={shortcut} variant="dark">
            {shortcut}
          </Shortcut>
        </span>
      }
    />
  );
}
