// Port of atlas dock/: dock.component, dock.bar, widgets/menu (app buttons,
// vertical sizer, "More apps" overflow), widgets/myApps (AppConnect launcher)
// and expand.toggle. The drawer is in Drawer.tsx.

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Button from "@talkdesk/cobalt-react-button";
import Icon from "@talkdesk/cobalt-react-icon";
import Popup from "@talkdesk/cobalt-react-popup";
import { Tag } from "@talkdesk/cobalt-react-tag";
import usePosition from "@talkdesk/cobalt-react-position-hook";
import useOutsideClick from "@talkdesk/cobalt-react-outside-click-hook";
import MarketplaceList, { Content, Item as MarketplaceItem } from "@talkdesk/cobalt-marketplace-react-list";
import { Portal } from "@talkdesk/cobalt-react-portal-provider";
import { Text } from "@talkdesk/cobalt-react-typography";
import type { DockApp } from "../config";
import { TRANSITION_MS } from "../space";
import { logStandIn, useNode, useShell } from "./context";
import { ShellTooltip, PositionRightCenter } from "./ShellTooltip";
import { SvgIcon } from "./SvgIcon";
import { Drawer } from "./Drawer";

type Phase = "collapsed" | "expanding" | "expanded" | "collapsing";

/** atlas menu.js: Transition states while the dock widens or narrows. */
function useTransitionPhase(expanded: boolean): Phase {
  const [phase, setPhase] = useState<Phase>(expanded ? "expanded" : "collapsed");
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setPhase(expanded ? "expanding" : "collapsing");
    const id = window.setTimeout(() => setPhase(expanded ? "expanded" : "collapsed"), TRANSITION_MS);
    return () => window.clearTimeout(id);
  }, [expanded]);
  return phase;
}

interface DockButtonProps {
  label: string;
  active?: boolean;
  expanded?: boolean;
  onPress: () => void;
  children: React.ReactNode;
  buttonRef?: React.Ref<HTMLButtonElement>;
  extra?: Record<string, unknown>;
}

/** atlas dock.bar.component.js DockButton. */
function DockButton({ label, active, expanded, onPress, children, buttonRef, extra }: DockButtonProps) {
  return (
    <Button
      type={active ? "primary" : "secondary"}
      variation={active ? undefined : "transparent"}
      shape={expanded ? "full-width" : "compact"}
      className={`ws-dock-button${expanded ? " ws-dock-button--expanded" : ""}${active ? " ws-dock-button--active" : ""}`}
      data-active={active || undefined}
      aria-label={label}
      onPress={onPress}
      ref={buttonRef}
      {...extra}
    >
      <span className="ws-dock-button__inner">{children}</span>
    </Button>
  );
}

function AppButton({
  app,
  index,
  active,
  expanded,
  showBadges,
}: {
  app: DockApp;
  index: number;
  active: boolean;
  expanded: boolean;
  showBadges: boolean;
}) {
  const { state, selectApp } = useShell();
  const ref = useRef<HTMLButtonElement>(null);
  const hasError = !!state.errors[app.id];
  const ongoing = !!state.badges[app.id];
  // dock.app.button.js: "!" only while the user is elsewhere; "•" always.
  const showBadge = (hasError ? !active : ongoing) && showBadges;

  return (
    <div className={`ws-dock-button-wrap${expanded ? " ws-dock-button-wrap--expanded" : ""}`}>
      <DockButton
        label={app.title}
        active={active}
        expanded={expanded}
        buttonRef={ref}
        onPress={() => selectApp(app.id)}
        extra={{ "aria-current": active ? "page" : undefined, "data-testid": `dock-button-${app.id}` }}
      >
        <span className="ws-dock-icon">
          <SvgIcon url={app.icon} iconName={app.iconName} title={app.title} className="ws-dock-icon" />
        </span>
        <Text inline truncated className={`ws-dock-label${expanded ? " ws-dock-label--expanded" : ""}`}>
          {app.title}
        </Text>
      </DockButton>
      {showBadge ? (
        <Tag color="red" size="tiny" className="ws-dock-badge" data-testid={`dock-button-${app.id}-badge`}>
          {hasError ? "!" : "•"}
        </Tag>
      ) : null}
      <ShellTooltip
        label={app.title}
        triggerRef={ref}
        position={PositionRightCenter}
        shortcut={index < 9 ? `alt+${index + 1}` : undefined}
      />
    </div>
  );
}

/** atlas dock.nav.overflow.js: the "More apps" button and its menu. */
function MoreApps({ apps, currentId }: { apps: DockApp[]; currentId: string }) {
  const { state, selectApp } = useShell();
  const [visible, setVisible] = useState(false);
  const [overButton, setOverButton] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useNode<HTMLButtonElement>();
  const { position, elementRef } = usePosition(anchor, { origin: "E", direction: "NE", autoGap: 8 });
  const close = useCallback(() => setVisible(false), []);
  useOutsideClick({ handler: close, shouldExecute: !overButton && visible, refs: [anchor] });

  if (apps.length === 0) return null;
  const active = apps.some((app) => app.id === currentId);

  return (
    <div className="ws-dock-button-wrap">
      <DockButton
        label="More apps"
        active={active}
        buttonRef={(node) => {
          (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
          setAnchor(node);
        }}
        onPress={() => setVisible((value) => !value)}
        extra={{
          "aria-haspopup": "menu",
          "aria-expanded": visible,
          "data-testid": "dock-button-other",
          onMouseEnter: () => setOverButton(true),
          onMouseLeave: () => setOverButton(false),
        }}
      >
        <Icon name="dots" />
      </DockButton>
      <ShellTooltip label="More apps" triggerRef={ref} position={PositionRightCenter} />
      <Portal>
        <Popup
          className="ws-overflow-popup"
          visible={visible && !!position}
          style={{ ...position }}
          forwardedRef={elementRef}
          data-testid="dock-nav-overflow-items"
        >
          <div role="menu" aria-label="More apps">
            <MarketplaceList>
              {apps.map((app) => {
                const isActive = app.id === currentId;
                const hasError = !!state.errors[app.id];
                const showBadge = hasError ? !isActive : !!state.badges[app.id];
                return (
                  <MarketplaceItem
                    key={app.id}
                    active={isActive}
                    onClick={(event) => {
                      event.preventDefault();
                      selectApp(app.id);
                      setVisible(false);
                    }}
                  >
                    <Content minimal>
                      <SvgIcon url={app.icon} iconName={app.iconName} title={app.title} size="tiny" />
                    </Content>
                    <Content>
                      <span style={{ display: "flex", alignItems: "center" }}>
                        <Text style={{ lineHeight: "16px" }}>{app.title}</Text>
                        {showBadge ? (
                          <span style={{ paddingLeft: 8, display: "inline-flex" }}>
                            <Tag className="ws-overflow-tag" color="red" size="tiny">
                              {hasError ? "!" : "•"}
                            </Tag>
                          </span>
                        ) : null}
                      </span>
                    </Content>
                  </MarketplaceItem>
                );
              })}
            </MarketplaceList>
          </div>
        </Popup>
      </Portal>
    </div>
  );
}

/** atlas widgets/myApps: the AppConnect launcher under the dock (behind a feature flag). */
function AppConnectButton({ expanded }: { expanded: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <div className="ws-dock-button-wrap">
      <DockButton
        label="AppConnect"
        expanded={expanded}
        buttonRef={ref}
        onPress={() => logStandIn("AppConnect: Workspace loads the AppConnect launcher, which lists the account's apps.")}
        extra={{ "data-testid": "my-apps-button" }}
      >
        <Icon name="apps" size="small" />
        <Text inline truncated className={`ws-dock-label${expanded ? " ws-dock-label--expanded" : ""}`}>
          AppConnect
        </Text>
      </DockButton>
      <ShellTooltip label="AppConnect" triggerRef={ref} position={PositionRightCenter} />
    </div>
  );
}

function ExpandToggle({ toggled, onToggle }: { toggled: boolean; onToggle: (value: boolean) => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const label = toggled ? "Collapse" : "Expand";
  return (
    <>
      <Button
        type="secondary"
        variation="transparent"
        shape="compact"
        size="tiny"
        aria-label={label}
        aria-expanded={toggled}
        aria-controls="dock-nav"
        className={`ws-dock-expand${toggled ? " ws-dock-expand--expanded" : ""}`}
        ref={ref}
        onPress={() => onToggle(!toggled)}
      >
        <Icon name={toggled ? "first_page" : "menu"} size="micro" />
      </Button>
      <ShellTooltip label={label} triggerRef={ref} position={PositionRightCenter} />
    </>
  );
}

const ITEM_HEIGHT = 36;
const ITEM_GAP = 2;

export function Dock() {
  const { config, state, layout, dispatch, setDockExpanded } = useShell();
  const expanded = layout.dockExpandedVisible;
  const phase = useTransitionPhase(expanded);
  const scrollable = phase !== "collapsed";
  const showLabels = scrollable && phase !== "collapsing";
  const transitioning = phase === "expanding" || phase === "collapsing";
  const [height, setHeight] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // react-virtualized-auto-sizer in atlas: the height the app buttons can use.
  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const observer = new ResizeObserver(() => setHeight(node.clientHeight));
    observer.observe(node);
    setHeight(node.clientHeight);
    return () => observer.disconnect();
  }, []);

  // vertical-sizer: how many buttons fit; the rest go into "More apps".
  const apps = config.dock;
  let content = apps;
  let overflow: DockApp[] = [];
  if (!scrollable && apps.length > 1 && height > 0) {
    const maxItems = Math.max(Math.floor((height + ITEM_GAP) / (ITEM_HEIGHT + ITEM_GAP)), 1);
    const overflowIndex = maxItems >= apps.length ? apps.length : maxItems - 1;
    content = apps.slice(0, overflowIndex);
    overflow = apps.slice(overflowIndex);
  }

  const onNavKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(".ws-dock__scroll .ws-dock-button"));
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (index < 0) return;
    event.preventDefault();
    items[(index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus();
  };

  const drawerOpen = layout.drawerOpen;
  const classes = [
    "ws-dock",
    layout.hasDrawer ? "ws-dock--has-drawer" : "",
    drawerOpen ? "ws-dock--drawer-open" : "",
    layout.drawerVisible ? "ws-dock--drawer-fixed" : "",
    expanded ? "ws-dock--expanded" : "",
    layout.small ? "ws-dock--small" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="ws-dock-root">
      <div
        className={classes}
        data-testid="dock"
        onMouseLeave={() => {
          if (state.drawerHoverOpen && !layout.drawerVisible) dispatch({ type: "drawer-hover", open: false });
        }}
      >
        <div className="ws-dock__bar">
          {state.flags.expandedDock && !layout.small ? (
            <>
              <ExpandToggle toggled={expanded} onToggle={setDockExpanded} />
              <div className="ws-dock__divider" />
            </>
          ) : null}
          <div className="ws-dock__container ws-dock__container--maximal">
            <nav id="dock-nav" className="ws-dock__nav" aria-label="Applications navigation menu" onKeyDown={onNavKeyDown}>
              <div
                ref={scrollRef}
                role="toolbar"
                aria-label="Applications"
                aria-orientation="vertical"
                tabIndex={-1}
                className={`ws-dock__scroll${scrollable ? " ws-dock__scroll--scrollable" : ""}`}
              >
                {content.map((app, index) => (
                  <AppButton
                    key={app.id}
                    app={app}
                    index={index}
                    active={app.id === state.appId}
                    expanded={showLabels}
                    showBadges={!transitioning}
                  />
                ))}
                <MoreApps apps={overflow} currentId={state.appId} />
              </div>
              <div className="ws-dock__divider" />
            </nav>
          </div>
          {state.flags.appConnect ? (
            <div className="ws-dock__container">
              <AppConnectButton expanded={showLabels} />
            </div>
          ) : null}
        </div>
        {layout.hasDrawer ? <Drawer /> : null}
      </div>
    </div>
  );
}
