// The stand-in shell: the prototype bar, the Workspace window and everything in
// it, the width sharing, and the messages from the app's frames.
// Layout follows atlas packages/ui/src/ui.container.jsx.

import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import ViewportProvider from "@talkdesk/cobalt-react-viewport-provider";
import { pagesOf, type ResolvedConfig } from "../config";
import {
  CHANNEL,
  isEnvelope,
  type AppToShellMessage,
  type FrameState,
  type ShellToAppMessage,
} from "../sdk/protocol";
import { onSystemSchemeChange, setColorScheme, systemScheme, type ColorScheme } from "../theme";
import {
  DOCK_EXPANDED_WIDTH,
  DOCK_WIDTH,
  DRAWER_CLOSED_WIDTH,
  DRAWER_CLOSED_WIDTH_SMALL,
  DRAWER_OPEN_WIDTH,
  isSmall,
  requiredWidth,
  SECONDARY_AREA_DEFAULT_WIDTH,
  SECONDARY_AREA_MIN_WIDTH,
  slotVisibility,
  bumpRecency,
  type SlotWants,
} from "../space";
import { ShellContext, logStandIn, type Layout, type ShellApi } from "./context";
import { DrawerApiContext } from "./Drawer";
import { Dock } from "./Dock";
import { Banners, Toasts } from "./Messages";
import { NotificationCenter } from "./Notifications";
import { PrimaryArea } from "./Primary";
import { PrototypeBar } from "./PrototypeBar";
import { SecondaryArea } from "./SecondaryArea";
import { ShortcutsContext } from "./ShellTooltip";
import { DESKTOP_SIZE, initialState, reducer, writeStored, type ShellState, type ShellToast } from "./state";
import { openSearch, TitleBar } from "./TitleBar";

const DISMISS_DELAY_MS = { short: 3000, medium: 5000, long: 7000, infinite: 0 } as const;

export function frameUrl(params: Record<string, string>): string {
  const url = new URL(window.location.href);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

function useSize(node: HTMLElement | null): { width: number; height: number } {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    if (!node) return;
    const update = () => setSize({ width: node.offsetWidth, height: node.offsetHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);
  return size;
}

export function Shell({ config }: { config: ResolvedConfig }) {
  const [state, dispatch] = useReducer(reducer, config, initialState);
  const [stageNode, setStageNode] = useState<HTMLDivElement | null>(null);
  const [windowNode, setWindowNode] = useState<HTMLDivElement | null>(null);
  const stage = useSize(stageNode);
  const windowSize = useSize(windowNode);
  const toastSources = useRef(new Map<string, MessageEventSource>());
  const panelSource = useRef<MessageEventSource | null>(null);

  useEffect(() => writeStored(state), [state]);

  const currentApp = config.dock.find((app) => app.id === state.appId);
  const windowWidth = windowSize.width;
  const wants: SlotWants = { drawer: state.drawerFixed, secondaryArea: state.secondaryOpen, dock: state.dockExpanded };
  const visibility = slotVisibility(windowWidth, wants, state.recency);
  const small = isSmall(windowWidth);
  const hasDrawer = !!currentApp?.sections?.length;
  const secondaryShown =
    visibility.secondaryAreaVisible && config.secondaryApps.length > 0 && !!state.secondaryAppId;

  const layout: Layout = {
    windowWidth,
    windowHeight: windowSize.height,
    small,
    ...visibility,
    hasDrawer,
    drawerOpen: hasDrawer && (visibility.drawerVisible || state.drawerHoverOpen),
    secondaryShown,
  };

  // Widths, as space-and-viewports describes them.
  const dockWidth = visibility.dockExpandedVisible ? DOCK_EXPANDED_WIDTH : DOCK_WIDTH;
  const drawerSpace = !hasDrawer ? 0 : visibility.drawerVisible ? DRAWER_OPEN_WIDTH : small ? DRAWER_CLOSED_WIDTH_SMALL : DRAWER_CLOSED_WIDTH;
  const resizable = state.flags.secondaryAreaResize;
  const groupWidth = Math.max(0, windowWidth - dockWidth - drawerSpace);
  const secondaryWidth =
    resizable && state.secondaryWidth
      ? Math.round(Math.min(Math.max(state.secondaryWidth, SECONDARY_AREA_MIN_WIDTH), Math.max(SECONDARY_AREA_MIN_WIDTH, groupWidth / 2)))
      : SECONDARY_AREA_DEFAULT_WIDTH;
  const appWidth = Math.max(0, groupWidth - (secondaryShown ? secondaryWidth + (resizable ? 2 : 0) : 0));

  // ---- Frames ---------------------------------------------------------------

  const primarySrc = useMemo(() => frameUrl({ frame: "app" }), []);
  const secondarySrc = useCallback((appId: string) => frameUrl({ frame: "secondary", app: appId }), []);

  const frames = () =>
    Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe[data-primary-frame], iframe[data-secondary-app]"));
  const primaryWindow = () =>
    document.querySelector<HTMLIFrameElement>("iframe[data-primary-frame]")?.contentWindow ?? null;

  const post = (target: MessageEventSource | Window | null | undefined, message: ShellToAppMessage) => {
    (target as Window | null | undefined)?.postMessage({ ...message, channel: CHANNEL }, "*");
  };

  // Light and dark, as in Workspace: the Theme choice (behind the dark mode flag) themes Workspace itself, and
  // reaches the apps only with the theme stylesheet flag on too. Apps are taken to declare dark mode support.
  // Worked out from the state passed in, so handlers registered once still send the current scheme.
  const [osScheme, setOsScheme] = useState<ColorScheme>(systemScheme);
  useEffect(() => onSystemSchemeChange(setOsScheme), []);
  const osSchemeRef = useRef(osScheme);
  osSchemeRef.current = osScheme;
  const schemesOf = (current: ShellState) => {
    const chosen: ColorScheme = current.themeMode === "system" ? osSchemeRef.current : current.themeMode;
    const shell: ColorScheme = current.flags.appearance ? chosen : "light";
    return { shell, app: current.flags.themeStylesheet ? shell : ("light" as ColorScheme) };
  };
  const { shell: shellScheme, app: appScheme } = schemesOf(state);
  useEffect(() => setColorScheme(shellScheme), [shellScheme]);

  const frameState = (frame: HTMLIFrameElement, current: ShellState): FrameState =>
    frame.dataset.primaryFrame
      ? {
          area: "primary",
          appId: config.appId,
          page: current.appId === config.appId ? current.page : undefined,
          flags: current.flags,
          colorScheme: schemesOf(current).app,
        }
      : { area: "secondary", appId: frame.dataset.secondaryApp ?? "", flags: current.flags, colorScheme: schemesOf(current).app };

  const stateRef = useRef(state);
  stateRef.current = state;
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  // Keep the frames in step with the page, the flags and the colour scheme.
  const lastSent = useRef<{ page?: string; flags?: unknown; colorScheme?: ColorScheme }>({});
  useEffect(() => {
    const changedPage = lastSent.current.page !== state.page;
    const changedScheme = lastSent.current.colorScheme !== undefined && lastSent.current.colorScheme !== appScheme;
    lastSent.current = { page: state.page, flags: state.flags, colorScheme: appScheme };
    frames().forEach((frame) =>
      post(frame.contentWindow, {
        type: "state",
        state: frameState(frame, state),
        reason: changedPage && frame.dataset.primaryFrame ? "navigate" : changedScheme ? "theme" : "flags",
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.page, state.appId, state.flags, state.secondaryLoaded, appScheme]);

  // ---- User actions with space checks (atlas ui.manager middlewares) --------

  const checkSpace = (next: SlotWants, recency = stateRef.current.recency, slot: keyof SlotWants) => {
    const visible = slotVisibility(layoutRef.current.windowWidth, next, recency);
    const key = slot === "drawer" ? "drawerVisible" : slot === "secondaryArea" ? "secondaryAreaVisible" : "dockExpandedVisible";
    if (visible[key]) return;
    if (stateRef.current.preset === "desktop") {
      // The desktop app widens its window and keeps its height.
      dispatch({ type: "desktop-width", width: Math.max(stateRef.current.desktopWidth, requiredWidth(next)) });
    } else {
      dispatch({
        type: "toast",
        toast: {
          id: `resize-${Date.now()}`,
          type: "warning",
          title: "Resize window",
          message: "This screen can’t be displayed in the current size. Resize your window to open.",
          dismissDelay: "long",
          timeout: DISMISS_DELAY_MS.long,
          dismissible: true,
          actions: [],
        },
      });
    }
  };

  const currentWants = (): SlotWants => ({
    drawer: stateRef.current.drawerFixed,
    secondaryArea: stateRef.current.secondaryOpen,
    dock: stateRef.current.dockExpanded,
  });

  const setDrawerFixed = (fixed: boolean) => {
    dispatch({ type: "drawer-fixed", fixed });
    if (fixed) checkSpace({ ...currentWants(), drawer: true }, bumpRecency(stateRef.current.recency, "drawer"), "drawer");
  };

  const setSecondaryOpen = (open: boolean) => {
    dispatch({ type: "secondary-open", open, fromUser: true });
    if (open) {
      checkSpace(
        { ...currentWants(), secondaryArea: true },
        bumpRecency(stateRef.current.recency, "secondaryArea"),
        "secondaryArea",
      );
    }
  };

  const setDockExpanded = (expanded: boolean) => {
    dispatch({ type: "dock-expanded", expanded });
    if (expanded) checkSpace({ ...currentWants(), dock: true }, bumpRecency(stateRef.current.recency, "dock"), "dock");
  };

  const selectApp = (appId: string, page?: string) => {
    const app = config.dock.find((item) => item.id === appId);
    const target = page ?? (appId === stateRef.current.appId ? stateRef.current.page : pagesOf(app)[0]?.id);
    dispatch({ type: "select-app", appId, page: target });
  };

  const selectPage = (page: string) => dispatch({ type: "select-page", page });

  // atlas createDrawerHoverResetMiddleware: when the fixed drawer stops showing, drop the hover state.
  const wasDrawerVisible = useRef(visibility.drawerVisible);
  useEffect(() => {
    if (wasDrawerVisible.current && !visibility.drawerVisible && state.drawerHoverOpen) {
      dispatch({ type: "drawer-hover", open: false });
    }
    wasDrawerVisible.current = visibility.drawerVisible;
  }, [visibility.drawerVisible, state.drawerHoverOpen]);

  const api: ShellApi = {
    config,
    state,
    dispatch,
    layout,
    currentApp,
    selectApp,
    selectPage,
    setDrawerFixed,
    setSecondaryOpen,
    setDockExpanded,
    log: logStandIn,
  };
  const apiRef = useRef(api);
  apiRef.current = api;

  // ---- Keyboard shortcuts (behind a feature flag) ----------------------------

  const handleShortcut = (event: { code: string; altKey: boolean; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }) => {
    const { state: current, layout: currentLayout } = apiRef.current;
    if (!current.flags.shortcuts) return false;
    if (event.altKey && event.code === "KeyS") {
      if (config.secondaryApps.length > 0) apiRef.current.setSecondaryOpen(!currentLayout.secondaryAreaVisible);
      return true;
    }
    const digit = /^Digit([1-9])$/.exec(event.code);
    if (event.altKey && digit) {
      const app = config.dock[Number(digit[1]) - 1];
      if (app) apiRef.current.selectApp(app.id);
      return true;
    }
    const isMac = config.platform === "mac";
    if ((isMac && event.metaKey && event.code === "KeyK") || (!isMac && event.ctrlKey && event.shiftKey && event.code === "KeyF")) {
      openSearch();
      return true;
    }
    if (event.metaKey && event.code === "Slash") {
      logStandIn("Keyboard shortcuts: Workspace lists every shortcut in a dialog.");
      return true;
    }
    return false;
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (handleShortcut(event)) event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Messages from the frames -----------------------------------------------

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!isEnvelope<AppToShellMessage>(event.data)) return;
      const frame = frames().find((item) => item.contentWindow === event.source);
      if (!frame || !event.source) return;
      const source = event.source;
      const area = frame.dataset.primaryFrame ? "primary" : "secondary";
      const message = event.data;
      const current = stateRef.current;

      switch (message.type) {
        case "ready":
          post(source, { type: "state", state: frameState(frame, current), reason: "init" });
          break;
        case "toast":
          toastSources.current.set(message.id, source);
          dispatch({ type: "toast", toast: { ...message.toast, id: message.id, timeout: DISMISS_DELAY_MS[message.toast.dismissDelay] } });
          break;
        case "dismiss-toast":
          dispatch({ type: "dismiss-toast", id: message.id });
          break;
        case "banner":
          dispatch({ type: "banner", banner: { ...message.banner, id: message.id, createdAt: Date.now() } });
          break;
        case "dismiss-banner":
          dispatch({ type: "dismiss-banner", id: message.id });
          break;
        case "badge": {
          const appId = message.app ?? (area === "primary" ? config.appId : undefined);
          if (!appId || !config.dock.some((app) => app.id === appId)) {
            logStandIn(`setBadge: no dock entry "${appId ?? "(secondary area app)"}". Pass { app: "<dock app id>" }.`);
            break;
          }
          dispatch({ type: "badge", appId, visible: message.visible });
          break;
        }
        case "navigate": {
          if (area !== "primary") {
            logStandIn("navigate: only the app in the primary area keeps the drawer in step.");
            break;
          }
          const pages = pagesOf(config.dock.find((app) => app.id === config.appId));
          if (!pages.some((page) => page.id === message.page)) {
            console.warn(`[workspace stand-in] navigate("${message.page}"): not a drawer page of "${config.appId}". Pages: ${pages.map((page) => page.id).join(", ")}`);
          }
          if (current.appId === config.appId) dispatch({ type: "select-page", page: message.page });
          break;
        }
        case "close-secondary-area":
          dispatch({ type: "secondary-open", open: false, fromUser: false });
          break;
        case "show-error":
          if (area === "primary") dispatch({ type: "error-screen", errorType: message.errorType });
          else logStandIn("showError: the stand-in draws the error screen for the primary area only.");
          break;
        case "open-panel":
          panelSource.current = source;
          dispatch({ type: "panel", panel: { ...message.panel, id: message.id } });
          break;
        case "close-panel":
          if (current.panel?.id === message.id) {
            dispatch({ type: "panel", panel: undefined });
            post(source, { type: "panel-closed", id: message.id });
          }
          break;
        case "key":
          handleShortcut(message);
          break;
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onToastAction = (toast: ShellToast, index: number) => post(toastSources.current.get(toast.id), { type: "toast-action", id: toast.id, index });
  const onToastClosed = (id: string) => {
    post(toastSources.current.get(id), { type: "toast-closed", id });
    toastSources.current.delete(id);
  };
  const drawerApi = useMemo(
    () => ({ postToApp: (actionId: string) => post(primaryWindow(), { type: "drawer-action", id: actionId }) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ---- Window size ---------------------------------------------------------------

  const framed = state.preset !== "fill";
  const presetWidth =
    state.preset === "desktop" ? state.desktopWidth : state.preset === "fill" ? undefined : Number(state.preset);
  // A preset wider than the browser drops the stage's padding and scrolls sideways.
  const tight = framed && (presetWidth ?? 0) + 32 > stage.width;
  const presetHeight =
    state.preset === "desktop" ? DESKTOP_SIZE.height : framed ? Math.max(0, stage.height - (tight ? 0 : 32)) : undefined;

  return (
    <ShellContext.Provider value={api}>
      <ShortcutsContext.Provider value={{ enabled: state.flags.shortcuts, platform: config.platform }}>
        <DrawerApiContext.Provider value={drawerApi}>
          <div className="ws-page">
            <PrototypeBar appWidth={appWidth} />
            <div
              className={`ws-stage${framed ? " ws-stage--framed" : ""}${tight ? " ws-stage--tight" : ""}`}
              ref={setStageNode}
            >
              <div
                ref={setWindowNode}
                className={`ws-window${framed ? "" : " ws-window--fill"}`}
                style={framed ? { width: presetWidth, height: presetHeight } : undefined}
                data-testid="workspace-window"
              >
                {windowNode ? (
                  <ViewportProvider target={windowNode}>
                    <a className="ws-skip-nav" href="#app-content" onClick={(event) => {
                      event.preventDefault();
                      document.getElementById("app-content")?.focus();
                    }}>
                      Skip navigation
                    </a>
                    <TitleBar />
                    <div className="ws-container" data-testid="ui-container">
                      <Dock />
                      <div className="ws-areas">
                        <Banners />
                        <div className="ws-group">
                          <PrimaryArea
                            frameSrc={primarySrc}
                            onPanelClosed={(id) => post(panelSource.current, { type: "panel-closed", id })}
                          />
                          {config.secondaryApps.length > 0 ? (
                            <SecondaryArea frameSrc={secondarySrc} width={secondaryWidth} groupWidth={groupWidth} />
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <NotificationCenter />
                    <Toasts onAction={onToastAction} onClosed={onToastClosed} />
                  </ViewportProvider>
                ) : null}
              </div>
            </div>
          </div>
        </DrawerApiContext.Provider>
      </ShortcutsContext.Provider>
    </ShellContext.Provider>
  );
}
