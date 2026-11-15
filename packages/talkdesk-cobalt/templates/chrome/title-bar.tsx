// Owned adaptation of Atlas deb486689 title bar. Preserves shell actions and
// secondary.area.button. Network, call quality and virtual desktop status appear
// only on events Workspace reacts to, so the stand-in leaves them out.

import { useRef } from "react";
import { TitleBarButton } from "../title.bar/primitives/title-bar-button";
import Icon from "@talkdesk/cobalt-react-icon";
import Shortcut from "@talkdesk/cobalt-react-shortcut";
import { useShell, logStandIn } from "./context";
import { ShellTooltip, PositionBottomRightBottomLeft } from "./ShellTooltip";
import { StatusPill } from "./StatusPill";
import { NotificationButton } from "./Notifications";
import { ProfileMenu } from "./ProfileMenu";

// atlas title.bar/constants.js
const INVERTED_LOGO_URL = "https://prd-cdn-talkdesk.talkdesk.com/cdn-assets/latest/talkdesk/brand/main_brand/icon/talkdesk_icon_white.svg";
const LOGO_URL =
  "https://prd-cdn-talkdesk.talkdesk.com/cdn-assets/latest/talkdesk/brand/main_brand/icon/talkdesk_icon.svg";

export function searchShortcut(platform: "mac" | "windows"): string {
  return platform === "mac" ? "command+k" : "ctrl+shift+f";
}

export function openSearch(): void {
  logStandIn("Search isn't part of the stand-in. In Workspace it opens a search over apps, actions and more.");
}

function Search({ small }: { small: boolean }) {
  const { config, state } = useShell();
  const shortcut = searchShortcut(config.platform);
  return (
    <TitleBarButton
      aria-label="Search apps, actions and more"
      data-testid="workspace-search"
      variation={small ? "transparent" : "filled"}
      shape={small ? "compact" : "flex"}
      icon={small ? "search" : undefined}
      prefix={small ? undefined : <Icon name="search" size="tiny" />}
      suffix={!small && state.flags.shortcuts ? <span data-testid="search-shortcut-wrapper" aria-hidden><Shortcut variant="light">{shortcut}</Shortcut></span> : undefined}
      tooltip={small ? "Search" : undefined}
      shortcut={state.flags.shortcuts ? shortcut : undefined}
      tooltipPlacement="bottom start"
      aria-haspopup="dialog"
      aria-expanded={false}
      onPress={openSearch}
    >
      {small ? undefined : "Search apps, actions and more..."}
    </TitleBarButton>
  );
}

function SecondaryAreaToggle() {
  const { layout, setSecondaryOpen } = useShell();
  const ref = useRef<HTMLButtonElement>(null);
  const open = layout.secondaryAreaVisible;
  return (
    <nav className="ws-secondary-toggle" aria-label="Secondary area">
      <ShellTooltip
        label="Secondary area"
        triggerRef={ref}
        shortcut="alt+s"
        position={PositionBottomRightBottomLeft}
      />
      <TitleBarButton
        ref={ref}
        aria-label="Secondary area"
        aria-expanded={open}
        variation="transparent"
        data-testid="workspace-secondary-toggle"
        onPress={() => setSecondaryOpen(!open)}
      >
        <Icon name="vertical_split" size="tiny" />
      </TitleBarButton>
    </nav>
  );
}

export function TitleBar() {
  const { config, state, layout } = useShell();
  // Search is hidden only when the notifications flag is explicitly off (atlas title.bar/renderer.js).
  const searchEnabled = state.flags.notificationCenter;
  return (
    <div className="ws-titlebar" id="title-bar-root">
      <header className="ws-titlebar__frame" aria-label="Workspace" data-testid="workspace-titlebar">
        <div className="ws-titlebar__logo">
          <img className="ws-logo-light" src={LOGO_URL} alt="Talkdesk" width={28} height={28} />
          <img className="ws-logo-dark" src={INVERTED_LOGO_URL} alt="Talkdesk" width={28} height={28} />
        </div>
        <div className="ws-titlebar__left">
          {searchEnabled ? (
            <div className={`ws-titlebar__search${layout.small ? " ws-titlebar__search--small" : ""}`}>
              <Search small={layout.small} />
            </div>
          ) : null}
        </div>
        <div className="ws-titlebar__drag" />
        <div className="ws-titlebar__right">
          <div className="ws-titlebar__user">
            {config.status ? <StatusPill /> : null}
            {state.flags.notificationCenter ? <NotificationButton /> : null}
            <ProfileMenu />
          </div>
          {config.secondaryApps.length > 0 ? <SecondaryAreaToggle /> : null}
        </div>
      </header>
    </div>
  );
}
