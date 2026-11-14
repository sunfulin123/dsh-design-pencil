// Port of atlas dock/components/dock/dock.drawer (stateful + component) and
// dock/widgets/menu/components/dock.sidebar.js.

import React, { useEffect, useRef } from "react";
import Button from "@talkdesk/cobalt-react-button";
import Divider from "@talkdesk/cobalt-react-divider";
import Icon from "@talkdesk/cobalt-react-icon";
import ScrollShadow from "@talkdesk/cobalt-react-scrollable-shadow";
import { Heading, Text } from "@talkdesk/cobalt-react-typography";
import type { DrawerPage } from "../config";
import { DRAWER_HOVER_DELAY } from "../space";
import { useShell } from "./context";

function DrawerItem({ page }: { page: DrawerPage }) {
  const { state, selectPage } = useShell();
  const active = state.page === page.id;
  return (
    <li>
      <a
        href="#"
        className={`ws-drawer-item${active ? " ws-drawer-item--active" : ""}`}
        data-co-active={active || undefined}
        aria-current={active ? "page" : undefined}
        data-testid={`dock-button-${page.id}`}
        onClick={(event) => {
          event.preventDefault();
          selectPage(page.id);
        }}
      >
        <span className="ws-drawer-item__text">
          <Text
            inline
            truncated
            weight="medium"
            color={active ? "var(--primary-11, var(--primary-600))" : "var(--text-default, var(--secondary-700))"}
          >
            {page.title}
          </Text>
        </span>
      </a>
    </li>
  );
}

function DrawerContent() {
  const { currentApp, postToApp } = useDrawerApi();
  if (!currentApp?.sections) return null;
  return (
    <>
      <header className="ws-drawer__header">
        <Heading level={4}>{currentApp.title}</Heading>
      </header>
      <ScrollShadow style={{ zIndex: 0 }}>
        <div className="ws-drawer__list">
          <ul>
            {currentApp.sections.map((section, index) => {
              if (section.type === "page") return <DrawerItem key={section.id} page={section} />;
              if (section.type === "group") {
                return (
                  <li key={`${section.title}-${index}`} style={{ paddingTop: index > 0 ? "var(--base-spacing-3, 12px)" : undefined }}>
                    <div className="ws-drawer-group__title">
                      <Text
                        inline
                        weight="medium"
                        color="var(--text-description, var(--secondary-600))"
                        style={{ textTransform: "uppercase" }}
                      >
                        {section.title}
                      </Text>
                    </div>
                    <ul>
                      {section.pages.map((page) => (
                        <DrawerItem key={page.id} page={page} />
                      ))}
                    </ul>
                  </li>
                );
              }
              return (
                <li key={`actions-${index}`}>
                  <Divider style={{ width: "calc(100% + 24px)", marginLeft: -12 }} />
                  <ul className="ws-drawer-actions">
                    {section.actions.map((action) => (
                      <li key={action.id}>
                        <Button size="tiny" type="secondary" variation="transparent" onPress={() => postToApp(action.id)}>
                          <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                            {action.icon ? <Icon name={action.icon} size="micro" aria-hidden="true" /> : null}
                            {action.title}
                          </span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <Divider style={{ width: "calc(100% + 24px)", marginLeft: -12, marginBottom: 12 }} />
                </li>
              );
            })}
          </ul>
        </div>
      </ScrollShadow>
    </>
  );
}

/** The drawer reaches the app through this for actions; set by the shell. */
export const DrawerApiContext = React.createContext<{ postToApp: (actionId: string) => void }>({
  postToApp: () => undefined,
});

function useDrawerApi() {
  const { currentApp } = useShell();
  const { postToApp } = React.useContext(DrawerApiContext);
  return { currentApp, postToApp };
}

export function Drawer() {
  const { layout, dispatch, setDrawerFixed } = useShell();
  const open = layout.drawerOpen;
  const fixed = layout.drawerVisible;
  const compact = layout.small;
  const timer = useRef<number>();

  // lodash debounce(200) in dock.drawer.stateful.component.js
  const openSoon = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => dispatch({ type: "drawer-hover", open: true }), DRAWER_HOVER_DELAY);
  };
  const cancel = () => window.clearTimeout(timer.current);
  useEffect(() => cancel, []);

  const onToggle = () => {
    if (open) {
      if (fixed) {
        dispatch({ type: "drawer-hover", open: false });
        setDrawerFixed(false);
      } else {
        setDrawerFixed(true);
      }
    } else {
      dispatch({ type: "drawer-hover", open: true });
      setDrawerFixed(true);
    }
  };

  return (
    <div className="ws-drawer-wrap">
      <div
        className="ws-drawer"
        onMouseEnter={() => {
          if (compact ? !open : !open && !fixed) openSoon();
        }}
        onMouseLeave={cancel}
      >
        <div className="ws-drawer__layer" data-testid="dock-sidebar">
          <DrawerContent />
        </div>
        {compact && !open ? <span className="ws-drawer__hamburger" /> : null}
      </div>
      {!compact ? (
        <div className="ws-drawer__actions">
          <button
            type="button"
            data-testid="dock-action-button"
            className={`ws-drawer-toggle${fixed ? " ws-drawer-toggle--fixed" : ""}`}
            onClick={onToggle}
          >
            <Icon name={open ? "last_page" : "menu"} size="micro" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
