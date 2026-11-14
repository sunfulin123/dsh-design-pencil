// Port of atlas messages/components/banner (banners across the top of the areas)
// and toast/components/toaster (toasts at the bottom right of the window).

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Button from "@talkdesk/cobalt-react-button";
import Divider from "@talkdesk/cobalt-react-divider";
import Icon, { type Name as IconName } from "@talkdesk/cobalt-react-icon";
import Message, { Timer } from "@talkdesk/cobalt-react-message";
import Pagination from "@talkdesk/cobalt-marketplace-react-pagination";
import { Text } from "@talkdesk/cobalt-react-typography";
import type { BannerVariation, ToastType } from "../sdk/protocol";
import { useShell } from "./context";
import type { ShellBanner, ShellToast } from "./state";

// messages/constants.js
const BANNER_ICON: Record<BannerVariation, IconName> = {
  success: "check_circle",
  error: "error",
  warning: "warning",
  info: "info",
  feature: "star_circle",
};

// messages/components/banner/index.js getDividerColor
const DIVIDER_COLOR: Record<BannerVariation, string> = {
  info: "var(--info-contrast, var(--secondary-300))",
  error: "var(--error-contrast, var(--secondary-300))",
  success: "var(--success-contrast, var(--secondary-300))",
  warning: "var(--warning-contrast, var(--secondary-800))",
  feature: "var(--primary-contrast, var(--secondary-300))",
};

function BannerContent({ banner, expanded, onToggle }: { banner: ShellBanner; expanded: boolean; onToggle: () => void }) {
  const textRef = useRef<HTMLElement>(null);
  const [truncated, setTruncated] = useState(false);

  useLayoutEffect(() => {
    const node = textRef.current;
    if (!node || expanded) return;
    const check = () => setTruncated(node.offsetWidth < node.scrollWidth);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(node);
    return () => observer.disconnect();
  }, [expanded, banner.message]);

  const buttonType = banner.variation === "warning" ? "mono-dark" : "mono-light";
  return (
    <div className="ws-banner__content">
      <Icon size="small" name={BANNER_ICON[banner.variation]} />
      <div className="ws-banner__text">
        <Text ref={textRef} truncated={!expanded}>
          {banner.message}
        </Text>
      </div>
      {truncated || expanded ? (
        <div style={{ paddingRight: 4 }}>
          <Button variation="transparent" size="tiny" type={buttonType} onPress={onToggle}>
            {expanded ? "Read less" : "Read more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function Banners() {
  const { state, dispatch, layout } = useShell();
  // atlas getBanners: newest first.
  const banners = [...state.banners].sort((a, z) => z.createdAt - a.createdAt);
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const previousLength = useRef(banners.length);

  useEffect(() => {
    if (banners.length > previousLength.current) {
      setIndex(0);
      setExpanded(false);
    }
    previousLength.current = banners.length;
  }, [banners.length]);

  const current = banners[Math.min(index, banners.length - 1)];
  const height = banners.length === 0 ? 0 : layout.small && banners.length > 1 ? 76 : 48;
  const padding = layout.small ? 12 : layout.windowWidth > 960 ? 24 : 16;
  const color = current?.variation === "warning" ? "black" : "white";
  const pager = (
    <span style={{ whiteSpace: "nowrap" }}>
      <Pagination
        currentPage={index + 1}
        totalPages={banners.length}
        maxPagesCount={1}
        onPageClick={(page) => {
          setIndex(page - 1);
          setExpanded(false);
        }}
        variation="pages"
        arrowsDirection="vertical"
        color={color}
      />
    </span>
  );

  return (
    <div className="ws-banners" style={{ height, overflow: expanded ? undefined : "hidden" }}>
      {current ? (
        <Message
          key={current.id}
          type="banner"
          variation={current.variation}
          role="alert"
          className="ws-banner"
          style={{ height: expanded ? "auto" : undefined, zIndex: expanded ? 100 : undefined }}
        >
          <div className="ws-banner__body" style={{ padding: `12px ${padding}px` }}>
            <div className="ws-banner__row">
              <BannerContent banner={current} expanded={expanded} onToggle={() => setExpanded(!expanded)} />
              {current.dismissible ? (
                <div>
                  <Button
                    shape="compact"
                    variation="transparent"
                    size="tiny"
                    type={current.variation === "warning" ? "mono-dark" : "mono-light"}
                    onPress={() => {
                      setIndex(index > 0 ? index - 1 : 0);
                      setExpanded(false);
                      dispatch({ type: "dismiss-banner", id: current.id });
                    }}
                    aria-label="Dismiss"
                  >
                    <Icon name="clear" size="tiny" />
                  </Button>
                </div>
              ) : null}
              {!layout.small && banners.length > 1 ? (
                <>
                  <div className="ws-banner__divider">
                    <Divider vertical color={DIVIDER_COLOR[current.variation]} />
                  </div>
                  {pager}
                </>
              ) : null}
            </div>
            {layout.small && banners.length > 1 ? (
              <div style={{ display: "flex", justifyContent: "flex-end", width: "100%", paddingTop: 4 }}>{pager}</div>
            ) : null}
          </div>
        </Message>
      ) : null}
    </div>
  );
}

/**
 * The layout of Cobalt Marketplace Toaster (bottom-right, 328 / 416 / 500px wide,
 * at most two toasts, a Timer bar for timed ones), rebuilt here: the published
 * Toaster uses react-transition-group's findDOMNode, which React 18.3 reports as a
 * console error on every toast.
 */
function ToastItem({
  toast,
  margin,
  onDismiss,
  children,
}: {
  toast: ShellToast;
  margin: number;
  onDismiss: (id: string) => void;
  children: React.ReactNode;
}) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setEntered(true), 16);
    return () => window.clearTimeout(id);
  }, []);
  useEffect(() => {
    if (!toast.timeout) return;
    const id = window.setTimeout(() => onDismiss(toast.id), toast.timeout);
    return () => window.clearTimeout(id);
    // The timer starts once, when the toast appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.id]);
  return (
    <Message
      type="floating"
      variation={toast.type}
      style={{
        transition: "all 0.5s ease-in-out",
        opacity: entered ? 1 : 0,
        transform: entered ? undefined : "translate3d(0, 200%, 0)",
        marginBottom: margin,
      }}
    >
      {children}
      {toast.timeout ? <Timer active duration={toast.timeout / 1000} elapsed={0} /> : null}
    </Message>
  );
}

// toast/components/toaster/index.js
const TOAST_ICON: Record<ToastType, IconName> = {
  success: "check_circle",
  warning: "warning",
  info: "info",
  error: "error",
  primary: "stars",
  secondary: "stars",
};

export function Toasts({ onAction, onClosed }: { onAction: (toast: ShellToast, index: number) => void; onClosed: (id: string) => void }) {
  const { state, dispatch, layout } = useShell();
  const paddingX = layout.small ? 12 : layout.windowWidth > 960 ? 24 : 16;
  const dismiss = (id: string) => {
    dispatch({ type: "dismiss-toast", id });
    onClosed(id);
  };

  const spacing = layout.small ? 12 : layout.windowWidth > 960 ? 24 : 16;
  const width = layout.small ? 328 : layout.windowWidth > 960 ? 500 : 416;

  return (
    <div data-testid="toaster" className="ws-toaster">
      <div style={{ position: "absolute", right: spacing, display: "flex", flexDirection: "column", width, zIndex: 1600 }}>
        {state.toasts.slice(-2).map((toast) => {
          const dismissToast = () => dismiss(toast.id);
          const isBlack = toast.type === "warning";
          const hasTitle = !!toast.title?.trim();
          return (
            <ToastItem key={toast.id} toast={toast} margin={spacing} onDismiss={dismiss}>
            <div className="ws-toast" style={{ paddingLeft: paddingX, paddingRight: paddingX }} data-testid={`toast-${toast.id}`}>
              <div>
                <Icon name={TOAST_ICON[toast.type]} size="small" />
              </div>
              <div className="ws-toast__body">
                <div className="ws-toast__texts">
                  {hasTitle ? <Text weight="medium">{toast.title}</Text> : null}
                  <Text>{toast.message}</Text>
                </div>
                {toast.actions.length > 0 ? (
                  <div className="ws-toast__buttons">
                    {toast.actions
                      .map((action, actionIndex) => ({ action, actionIndex }))
                      .reverse()
                      .map(({ action, actionIndex }) => (
                        <Button
                          key={actionIndex}
                          size="small"
                          variation="outline"
                          type={isBlack ? "mono-dark" : "mono-light"}
                          onPress={() => onAction(toast, actionIndex)}
                        >
                          <Text truncated>{action.label}</Text>
                        </Button>
                      ))}
                  </div>
                ) : null}
              </div>
              {toast.dismissible ? (
                <div>
                  <Icon name="close" size="small" onClick={dismissToast} accessibilityLabel="Dismiss" />
                </div>
              ) : null}
            </div>
            </ToastItem>
          );
        })}
      </div>
    </div>
  );
}
