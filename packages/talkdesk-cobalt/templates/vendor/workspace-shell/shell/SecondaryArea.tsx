// Port of atlas secondary.canvas/components: the area, its header (icon, title,
// app switcher, AI tag, close) and the app switcher menu. Each app runs in its own
// iframe and stays loaded when the user switches.

import { useCallback, useEffect, useRef, useState } from "react";
import AiDisclaimer, { PositionRightBottom } from "@talkdesk/cobalt-marketplace-react-ai-disclaimer";
import Button from "@talkdesk/cobalt-react-button";
import Icon from "@talkdesk/cobalt-react-icon";
import List, { ClickableItem } from "@talkdesk/cobalt-react-list";
import Popup from "@talkdesk/cobalt-react-popup";
import usePosition from "@talkdesk/cobalt-react-position-hook";
import useOutsideClick from "@talkdesk/cobalt-react-outside-click-hook";
import { Portal } from "@talkdesk/cobalt-react-portal-provider";
import { Heading, Text } from "@talkdesk/cobalt-react-typography";
import { SECONDARY_AREA_MIN_WIDTH } from "../space";
import { clickableKeyDown, useMenuKeys, useNode, useShell } from "./context";
import { SvgIcon } from "./SvgIcon";

function AppSelector({ onPick }: { onPick: (id: string) => void }) {
  const { config, state } = useShell();
  return (
    <div className="ws-app-selector">
      <div className="ws-app-selector__heading">
        <Text id="secondary-app-switcher-heading" color="var(--text-default, var(--gray-800))" size="medium" inline weight="medium">
          App Center
        </Text>
        <Text color="var(--text-description, var(--gray-600))" size="small">
          Select a secondary app
        </Text>
      </div>
      <List
        id="secondary-app-switcher-menu"
        role="menu"
        style={{ marginBottom: 0, paddingBottom: 8 }}
        aria-labelledby="secondary-app-switcher-heading"
      >
        {config.secondaryApps.map((app) => {
          const selected = app.id === state.secondaryAppId;
          return (
            <ClickableItem
              key={app.id}
              role="menuitemradio"
              aria-checked={selected}
              tabIndex={-1}
              selected={selected}
              onClick={() => onPick(app.id)}
              onKeyDown={clickableKeyDown(() => onPick(app.id))}
            >
              <span className="ws-app-selector__item-row">
                <span className={`ws-app-selector__icon${selected ? " ws-app-selector__icon--active" : ""}`}>
                  <SvgIcon url={app.icon} iconName={app.iconName} title={app.title} size="tiny" />
                </span>
                <Text weight="medium" className={selected ? "ws-app-selector__title--active" : undefined}>
                  {app.title}
                </Text>
              </span>
            </ClickableItem>
          );
        })}
      </List>
    </div>
  );
}

function Header() {
  const { config, state, dispatch, setSecondaryOpen } = useShell();
  const [visible, setVisible] = useState(false);
  const [trigger, setTrigger] = useNode<HTMLButtonElement>();
  const [popupNode, setPopupNode] = useNode<HTMLDivElement>();
  const [titleNode, setTitleNode] = useNode<HTMLHeadingElement>();
  const [titleHover, setTitleHover] = useState(false);
  const { position, elementRef } = usePosition(trigger, { origin: "SE", direction: "SW", autoGap: 10 });
  const { position: titlePosition, elementRef: titleTipRef } = usePosition(titleNode, {
    origin: "S",
    direction: "SE",
    autoGap: 5,
  });
  const close = useCallback(() => setVisible(false), []);
  useOutsideClick({ handler: close, shouldExecute: visible, refs: [trigger, popupNode] });
  useMenuKeys(popupNode, visible, close, trigger, (items) =>
    items.findIndex((item) => item.getAttribute("aria-checked") === "true"),
  );
  useEffect(() => {
    if (!state.secondaryOpen) setVisible(false);
  }, [state.secondaryOpen]);

  const app = config.secondaryApps.find((item) => item.id === state.secondaryAppId);
  if (!app) return null;

  return (
    <header className="ws-secondary__header" data-testid="secondary-area-header" id="header-container">
      <div className="ws-secondary__title-row">
        <span className="ws-secondary__icon">
          <SvgIcon url={app.icon} iconName={app.iconName} title={app.title} />
        </span>
        <div style={{ minWidth: 0 }}>
          <Heading
            ref={setTitleNode}
            level={2}
            truncated
            className="ws-secondary__title"
            onMouseEnter={() => setTitleHover(true)}
            onMouseLeave={() => setTitleHover(false)}
            data-testid="secondary-area-selected-app-title"
          >
            {app.title}
          </Heading>
        </div>
        {config.secondaryApps.length > 1 ? (
          <Button
            ref={setTrigger}
            className={`ws-secondary__switcher${visible ? " ws-active" : ""}`}
            size="small"
            type="secondary"
            variation="transparent"
            onPress={() => setVisible(!visible)}
            onKeyDown={(event) => {
              if (!visible && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
                event.preventDefault();
                setVisible(true);
              }
            }}
            data-testid="dropdown-button"
            aria-label={`Switch secondary app, ${app.title} selected`}
            aria-haspopup="menu"
            aria-expanded={visible}
            aria-controls="secondary-app-switcher-menu"
          >
            <Icon aria-hidden="true" size="small" name={visible ? "expand_less" : "expand_more"} />
          </Button>
        ) : null}
        {app.ai ? (
          <AiDisclaimer
            label="AI Powered"
            tooltipContent="AI Content should always be reviewed"
            tooltipPosition={PositionRightBottom}
          />
        ) : null}
      </div>
      <Portal>
        <Popup
          visible={visible && !!position}
          style={{ ...position, width: `${SECONDARY_AREA_MIN_WIDTH - 32}px` }}
          forwardedRef={(node) => {
            elementRef(node);
            setPopupNode(node);
          }}
        >
          <AppSelector
            onPick={(id) => {
              dispatch({ type: "secondary-app", appId: id });
              setVisible(false);
            }}
          />
        </Popup>
        <Popup
          variation="dark"
          shape="compact"
          visible={titleHover && !!titlePosition}
          forwardedRef={titleTipRef}
          style={{ ...titlePosition, padding: 8, pointerEvents: "none" }}
        >
          <Text role="tooltip">{app.title}</Text>
        </Popup>
      </Portal>
      <div className="ws-secondary__close">
        <Button
          size="small"
          type="secondary"
          variation="transparent"
          shape="compact"
          onPress={() => setSecondaryOpen(false)}
          aria-label="Close"
        >
          <Icon size="tiny" name="close" />
        </Button>
      </div>
    </header>
  );
}

/** The 2px border the user drags when resizing is on (react-resizable-panels Separator in atlas). */
function Separator({ onResize, max }: { onResize: (width: number) => void; max: number }) {
  const [active, setActive] = useState(false);
  const start = useRef<{ x: number; width: number } | null>(null);
  const areaRef = useRef<HTMLElement | null>(null);

  return (
    <div
      className={`ws-separator${active ? " ws-separator--active" : ""}`}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize secondary area"
      tabIndex={0}
      ref={(node) => {
        areaRef.current = (node?.nextElementSibling as HTMLElement | null) ?? null;
      }}
      onPointerDown={(event) => {
        const area = areaRef.current;
        if (!area) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        start.current = { x: event.clientX, width: area.getBoundingClientRect().width };
        setActive(true);
      }}
      onPointerMove={(event) => {
        if (!start.current) return;
        const width = start.current.width + (start.current.x - event.clientX);
        onResize(Math.round(Math.min(Math.max(width, SECONDARY_AREA_MIN_WIDTH), max)));
      }}
      onPointerUp={() => {
        start.current = null;
        setActive(false);
      }}
      onKeyDown={(event) => {
        const area = areaRef.current;
        if (!area || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
        event.preventDefault();
        const width = area.getBoundingClientRect().width + (event.key === "ArrowLeft" ? 16 : -16);
        onResize(Math.round(Math.min(Math.max(width, SECONDARY_AREA_MIN_WIDTH), max)));
      }}
    />
  );
}

export function SecondaryArea({ frameSrc, width, groupWidth }: { frameSrc: (appId: string) => string; width: number; groupWidth: number }) {
  const { config, state, dispatch, layout } = useShell();
  const shown = layout.secondaryShown;
  const resizable = state.flags.secondaryAreaResize;

  return (
    <>
      {resizable && shown ? (
        <Separator max={Math.max(SECONDARY_AREA_MIN_WIDTH, groupWidth / 2)} onResize={(w) => dispatch({ type: "secondary-width", width: w })} />
      ) : null}
      <aside
        id="secondary-canvas"
        className={`ws-secondary${resizable ? " ws-secondary--resizable" : ""}`}
        aria-label="Secondary area"
        style={{ width, display: shown ? undefined : "none" }}
      >
        <Header />
        <div className="ws-secondary__frames">
          {config.secondaryApps
            .filter((app) => state.secondaryLoaded.includes(app.id))
            .map((app) => (
              <iframe
                key={app.id}
                className="ws-frame"
                title={app.title}
                src={frameSrc(app.id)}
                data-secondary-app={app.id}
                style={{ display: app.id === state.secondaryAppId ? undefined : "none", position: "absolute", inset: 0 }}
              />
            ))}
        </div>
      </aside>
    </>
  );
}
