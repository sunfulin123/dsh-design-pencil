// Port of atlas title.bar/components/title.bar, title-bar-frame, logo, search and
// secondary.area.button. Network, call quality and virtual desktop status appear
// only on events Workspace reacts to, so the stand-in leaves them out.

import { useRef } from "react";
import Button from "@talkdesk/cobalt-react-button";
import FakeInput from "@talkdesk/cobalt-react-fake-input";
import Icon from "@talkdesk/cobalt-react-icon";
import Shortcut from "@talkdesk/cobalt-react-shortcut";
import { Text } from "@talkdesk/cobalt-react-typography";
import { useShell, logStandIn } from "./context";
import { ShellTooltip, PositionBottomLeftBottomRight, PositionBottomRightBottomLeft } from "./ShellTooltip";
import { StatusPill } from "./StatusPill";
import { NotificationButton } from "./Notifications";
import { ProfileMenu } from "./ProfileMenu";

// atlas title.bar/constants.js
const LOGO_URL =
  "https://prd-cdn-talkdesk.talkdesk.com/cdn-assets/latest/talkdesk/brand/main_brand/icon/talkdesk_icon_white.svg";

export function searchShortcut(platform: "mac" | "windows"): string {
  return platform === "mac" ? "command+k" : "ctrl+shift+f";
}

export function openSearch(): void {
  logStandIn("Search isn't part of the stand-in. In Workspace it opens a search over apps, actions and more.");
}

function Search({ small }: { small: boolean }) {
  const { config, state } = useShell();
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const shortcut = searchShortcut(config.platform);

  if (small) {
    return (
      <div className="ws-round-button-wrap">
        <ShellTooltip
          label="Search"
          triggerRef={buttonRef}
          shortcut={shortcut}
          position={PositionBottomLeftBottomRight}
        />
        <Button
          ref={buttonRef}
          aria-label="Search Button"
          className="ws-round-button"
          variation="transparent"
          type="secondary"
          onPress={openSearch}
        >
          <Icon name="search" size="tiny" />
        </Button>
      </div>
    );
  }

  return (
    <FakeInput
      role="button"
      aria-label="Search apps, actions and more..."
      aria-haspopup="dialog"
      tabIndex={0}
      forwardedRef={ref}
      className="ws-search-input"
      onClick={openSearch}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openSearch();
        }
      }}
    >
      <span className="ws-search-input__row">
        <span className="ws-search-input__icon">
          <Icon name="search" size="tiny" color="var(--primary-contrast, var(--primary-400))" />
        </span>
        <span style={{ flex: 1, minWidth: 0, display: "flex" }}>
          <Text color="var(--primary-contrast, var(--primary-400))" className="ws-search-input__text" truncated>
            Search apps, actions and more...
          </Text>
        </span>
        {state.flags.shortcuts ? (
          <span className="ws-search-input__shortcut">
            <Shortcut aria-label={shortcut} variant="light" platform={config.platform === "mac" ? "mac" : "windows"}>
              {shortcut}
            </Shortcut>
          </span>
        ) : null}
      </span>
    </FakeInput>
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
      <Button
        ref={ref}
        aria-label="Secondary area"
        aria-expanded={open}
        variation="transparent"
        type="secondary"
        className={`ws-secondary-toggle__button${open ? " ws-active" : ""}`}
        onPress={() => setSecondaryOpen(!open)}
      >
        <Icon name="vertical_split" size="small" />
      </Button>
    </nav>
  );
}

export function TitleBar() {
  const { config, state, layout } = useShell();
  // Search is hidden only when the notifications flag is explicitly off (atlas title.bar/renderer.js).
  const searchEnabled = state.flags.notificationCenter;
  return (
    <div className="ws-titlebar" id="title-bar-root">
      <header className="ws-titlebar__frame">
        <div className="ws-titlebar__logo">
          <img src={LOGO_URL} alt="Talkdesk" width={28} height={28} />
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
