// Port of atlas title.bar/components/profile/components/user.profile.menu.js and
// its options (theme selector, droplet items, external links, submenus, logout).

import React, { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "@talkdesk/cobalt-react-avatar";
import Divider from "@talkdesk/cobalt-react-divider";
import Icon from "@talkdesk/cobalt-react-icon";
import List, { ClickableItem, Item } from "@talkdesk/cobalt-react-list";
import Popup from "@talkdesk/cobalt-react-popup";
import usePosition from "@talkdesk/cobalt-react-position-hook";
import useOutsideClick from "@talkdesk/cobalt-react-outside-click-hook";
import Shortcut from "@talkdesk/cobalt-react-shortcut";
import Tooltip from "@talkdesk/cobalt-marketplace-react-tooltip";
import { Portal } from "@talkdesk/cobalt-react-portal-provider";
import { Text } from "@talkdesk/cobalt-react-typography";
import type { ProfileMenuItem } from "../config";
import type { ThemeMode } from "../theme";
import { clickableKeyDown, logStandIn, useMenuKeys, useNode, useShell } from "./context";

const THEME_MODES: { mode: ThemeMode; label: string }[] = [
  { mode: "light", label: "Light" },
  { mode: "dark", label: "Dark" },
  { mode: "system", label: "Match system" },
];

function ProfileDivider() {
  return (
    <li role="none" className="ws-profile-divider">
      <Divider />
    </li>
  );
}

interface HoverProps {
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

function LinkItem({
  title,
  external,
  onClick,
  ...hover
}: { title: string; external?: boolean; onClick: () => void } & HoverProps) {
  return (
    <ClickableItem role="menuitem" tabIndex={-1} onClick={onClick} onKeyDown={clickableKeyDown(onClick)} {...hover}>
      <span className="ws-menu-row">
        <span className="ws-menu-row__text">
          <Text truncated>{title}</Text>
        </span>
        {external ? <Icon name="open_in_new" size="tiny" style={{ color: "inherit" }} /> : null}
      </span>
    </ClickableItem>
  );
}

function ActionItem({
  title,
  shortcut,
  platform,
  onClick,
  ...hover
}: { title: string; shortcut?: string; platform: "mac" | "windows"; onClick: () => void } & HoverProps) {
  return (
    <Item role="none">
      <button
        type="button"
        role="menuitem"
        tabIndex={-1}
        aria-haspopup="dialog"
        aria-keyshortcuts={shortcut}
        className="ws-menu-button"
        onClick={onClick}
        {...hover}
      >
        <span className="ws-menu-row">
          <span className="ws-menu-row__text">
            <Text truncated>{title}</Text>
          </span>
          {shortcut ? (
            <Shortcut aria-hidden variant="light" platform={platform}>
              {shortcut}
            </Shortcut>
          ) : null}
        </span>
      </button>
    </Item>
  );
}

/** An item that opens a second menu beside the profile menu, on hover or with Enter / Right. */
function SubmenuItem({
  title,
  forceClose,
  children,
  onRegister,
}: {
  title: string;
  forceClose: boolean;
  children: React.ReactNode;
  onRegister: (node: HTMLDivElement | null) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [anchor, setAnchor] = useNode<HTMLButtonElement>();
  const [listNode, setListNode] = useNode<HTMLUListElement>();
  const closeTimer = useRef<number>();
  const { position, elementRef } = usePosition(anchor, { origin: "NW", direction: "SW", gapY: -8, gapX: -12 });
  const close = useCallback(() => setVisible(false), []);
  useMenuKeys(listNode, visible, close, anchor);

  useEffect(() => {
    if (forceClose && visible) setVisible(false);
  }, [forceClose, visible]);

  const enter = () => {
    window.clearTimeout(closeTimer.current);
    setVisible(true);
  };
  const leave = () => {
    closeTimer.current = window.setTimeout(() => setVisible(false), 100);
  };

  return (
    <>
      <Item role="none">
        <button
          ref={setAnchor}
          type="button"
          role="menuitem"
          tabIndex={-1}
          aria-haspopup="menu"
          aria-expanded={visible}
          data-hover={visible || undefined}
          className="ws-menu-button"
          onClick={() => setVisible(true)}
          onMouseEnter={enter}
          onMouseLeave={leave}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              setVisible(true);
            }
          }}
        >
          <span className="ws-menu-row">
            <span className="ws-menu-row__text">
              <Text truncated>{title}</Text>
            </span>
            <Icon name="chevron_right" size="tiny" />
          </span>
        </button>
      </Item>
      <Portal>
        <Popup
          visible={visible && !!position}
          style={{ ...position }}
          className="ws-popup-submenu"
          onMouseEnter={enter}
          onMouseLeave={leave}
          forwardedRef={(node) => {
            elementRef(node);
            onRegister(node);
          }}
        >
          <List forwardedRef={setListNode} role="menu" aria-label={title} style={{ marginBottom: 0 }}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                setVisible(false);
                anchor?.focus();
              }
            }}
          >
            {children}
          </List>
        </Popup>
      </Portal>
    </>
  );
}

export function ProfileMenu() {
  const { config, state, dispatch, layout } = useShell();
  const [open, setOpen] = useState(false);
  const [trigger, setTrigger] = useNode<HTMLButtonElement>();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [popupNode, setPopupNode] = useNode<HTMLDivElement>();
  const submenuNodes = useRef(new Set<HTMLDivElement>());
  const [forceCloseSubmenus, setForceCloseSubmenus] = useState(false);
  const { position, elementRef } = usePosition(trigger, { origin: "SE", direction: "SW", autoGap: 8 });
  const close = useCallback(() => setOpen(false), []);

  useOutsideClick({
    handler: close,
    refs: [popupNode, trigger, ...Array.from(submenuNodes.current)],
    shouldExecute: open,
  });
  useMenuKeys(popupNode, open, close, trigger);

  const register = (node: HTMLDivElement | null) => {
    if (node) submenuNodes.current.add(node);
  };
  const pick = (what: string) => {
    setOpen(false);
    logStandIn(what);
  };
  const chooseTheme = (mode: ThemeMode) => {
    setOpen(false);
    dispatch({ type: "theme-mode", mode });
  };
  const plainItemProps = {
    onMouseEnter: () => setForceCloseSubmenus(true),
    onMouseLeave: () => setForceCloseSubmenus(false),
  };

  const items = config.profileMenu;
  const pages = items.filter((item) => item.type === "page");
  const links = items.filter((item) => item.type === "link");
  const submenus = items.filter((item) => item.type === "submenu");

  const renderSubmenuChildren = (item: ProfileMenuItem) => (
    <>
      {item.about ? (
        <>
          <li role="none">
            <div className="ws-menu-about" role="group" aria-live="polite" aria-atomic="true">
              <Text inline>Current version: stand-in (WEB)</Text>
              <span style={{ height: 4 }} />
              <Text inline size="small" color="var(--text-description, var(--gray-600))">
                {`Copyright © ${new Date().getFullYear()} Talkdesk`}
              </Text>
            </div>
          </li>
          <ProfileDivider />
        </>
      ) : null}
      {(item.items ?? []).map((child) => (
        <LinkItem
          key={child.title}
          title={child.title}
          external={child.type === "link"}
          onClick={() => pick(`"${child.title}" opens ${child.type === "link" ? "a page outside Workspace" : "a page in Workspace"}.`)}
        />
      ))}
    </>
  );

  return (
    <div className="ws-profile" id="profile-widget" data-testid="profile">
      <button
        ref={(node) => {
          triggerRef.current = node;
          setTrigger(node);
        }}
        type="button"
        className={`ws-avatar-button${layout.small ? " ws-avatar-button--small" : ""}`}
        aria-label="Profile menu"
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="user-avatar"
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {config.user.avatarUrl ? (
          <Avatar size="tiny">
            <img src={config.user.avatarUrl} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
          </Avatar>
        ) : (
          <Avatar size="tiny">{config.user.initials}</Avatar>
        )}
      </button>
      <Tooltip label="Profile menu" variation="dark" triggerRef={triggerRef} />
      <Portal>
        <Popup
          visible={open && !!position}
          className="ws-popup-profile"
          style={{ ...position }}
          forwardedRef={(node) => {
            elementRef(node);
            setPopupNode(node);
          }}
        >
          <List role="menu" aria-label="Profile menu">
            {state.flags.appearance ? (
              <SubmenuItem title="Theme" forceClose={forceCloseSubmenus} onRegister={register}>
                {THEME_MODES.map(({ mode, label }) => {
                  const selected = state.themeMode === mode;
                  const color = selected ? "var(--text-primary, var(--primary-600))" : undefined;
                  return (
                    <ClickableItem
                      key={mode}
                      role="menuitemradio"
                      aria-checked={selected}
                      tabIndex={-1}
                      onClick={() => chooseTheme(mode)}
                      onKeyDown={clickableKeyDown(() => chooseTheme(mode))}
                    >
                      <span className="ws-menu-row">
                        <span className="ws-menu-row__text">
                          <Text color={color}>{label}</Text>
                        </span>
                        {selected ? <Icon name="check" size="tiny" color={color} /> : null}
                      </span>
                    </ClickableItem>
                  );
                })}
              </SubmenuItem>
            ) : null}
            {pages.map((item) => (
              <LinkItem
                key={item.title}
                title={item.title}
                onClick={() => pick(`"${item.title}" opens a page in Workspace.`)}
                {...plainItemProps}
              />
            ))}
            {state.flags.shortcuts ? (
              <ActionItem
                title="Keyboard shortcuts"
                shortcut="meta+/"
                platform={config.platform}
                onClick={() => pick("Keyboard shortcuts: Workspace lists every shortcut in a dialog.")}
                {...plainItemProps}
              />
            ) : null}
            {links.length > 0 ? (
              <>
                {pages.length > 0 ? <ProfileDivider /> : null}
                {links.map((item) => (
                  <LinkItem
                    key={item.title}
                    title={item.title}
                    external
                    onClick={() => pick(`"${item.title}" opens outside Workspace.`)}
                    {...plainItemProps}
                  />
                ))}
              </>
            ) : null}
            {submenus.length > 0 ? (
              <>
                {pages.length > 0 || links.length > 0 ? <ProfileDivider /> : null}
                {submenus.map((item) => (
                  <SubmenuItem key={item.title} title={item.title} forceClose={forceCloseSubmenus} onRegister={register}>
                    {renderSubmenuChildren(item)}
                  </SubmenuItem>
                ))}
              </>
            ) : null}
            <ProfileDivider />
            <ClickableItem
              role="menuitem"
              tabIndex={-1}
              onClick={() => pick("Logout: Workspace signs the user out.")}
              onKeyDown={clickableKeyDown(() => pick("Logout"))}
              {...plainItemProps}
            >
              <span className="ws-menu-row" style={{ height: 36 }}>
                <Text>Logout</Text>
              </span>
            </ClickableItem>
          </List>
        </Popup>
      </Portal>
    </div>
  );
}
