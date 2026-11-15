import Flex from "@talkdesk/cobalt-react-flex";
import { TitleBarButton } from "../title.bar/primitives/title-bar-button";
import statusStyles from "../title.bar/components/profile/components/profile-status/status.button.module.css";
import timerStyles from "../title.bar/components/profile/components/profile-timer/profile.timer.module.css";
// Port of atlas title.bar/components/profile/components/profile-status: the
// status pill, its menu and its hover tooltip.

import { useCallback, useEffect, useState } from "react";
import Avatar from "@talkdesk/cobalt-react-avatar";
import Divider from "@talkdesk/cobalt-react-divider";
import Icon, { type Name as IconName } from "@talkdesk/cobalt-react-icon";
import List, { ClickableItem } from "@talkdesk/cobalt-react-list";
import Popup from "@talkdesk/cobalt-react-popup";
import usePosition from "@talkdesk/cobalt-react-position-hook";
import useOutsideClick from "@talkdesk/cobalt-react-outside-click-hook";
import { Portal } from "@talkdesk/cobalt-react-portal-provider";
import { Text } from "@talkdesk/cobalt-react-typography";
import type { StatusType } from "../config";
import { clickableKeyDown, useMenuKeys, useNode, useShell } from "./context";

// atlas profile/constants.js and profile.status.badge.js
const STATUS_RENDER: Record<StatusType, { color: string; icon: IconName }> = {
  available: { color: "var(--green-9, var(--green-600))", icon: "available" },
  busy: { color: "var(--red-9, var(--red-700))", icon: "busy" },
  after_call_work: { color: "var(--red-9, var(--red-700))", icon: "wrap_up" },
  away: { color: "var(--yellow-9, var(--yellow-700))", icon: "away" },
  offline: { color: "var(--gray-4, var(--gray-500))", icon: "offline" },
};

export function StatusBadge({ type }: { type: StatusType }) {
  const { color, icon } = STATUS_RENDER[type];
  return (
    <Avatar size="tiny" className="ws-status-badge" style={{ backgroundColor: color }}>
      <Icon color="white" name={icon} size="micro" />
    </Avatar>
  );
}

// profile-timer/utils.js
function formatDuration(total: number): string {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total / 60) - hours * 60;
  const seconds = total - minutes * 60 - hours * 3600;
  return [hours, minutes, seconds].map((n) => (n < 10 ? `0${n}` : `${n}`)).join(":");
}

function Timer({ since }: { since: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <Text size="small" inline className={timerStyles.timer}>
      {formatDuration(Math.max(0, Math.floor((now - since) / 1000)))}
    </Text>
  );
}

function StatusRow({ name, type, weight }: { name: string; type: StatusType; weight?: "medium" | "regular" }) {
  return (
    <div className="ws-status-row">
      <StatusBadge type={type} />
      <span className="ws-status-row__name">
        <Text size="medium" weight={weight ?? "regular"} truncated title={name}>
          {name}
        </Text>
      </span>
    </div>
  );
}

export function StatusPill() {
  const { config, state, dispatch, layout } = useShell();
  const [open, setOpen] = useState(false);
  const [trigger, setTrigger] = useNode<HTMLButtonElement>();
  const [popupNode, setPopupNode] = useNode<HTMLDivElement>();
  const statuses = config.status ? config.status.statuses : [];
  const current = statuses.find((status) => status.id === state.statusId) ?? statuses[0];

  const [origin, direction] = layout.small ? (["S", "S"] as const) : (["SE", "SW"] as const);
  const { position, elementRef } = usePosition(trigger, { origin, direction, autoGap: 12 });
  const close = useCallback(() => setOpen(false), []);

  useOutsideClick({ handler: close, refs: [popupNode, trigger], shouldExecute: open });
  useMenuKeys(popupNode, open, close, trigger);

  if (!current) return null;

  const choose = (id: string) => {
    dispatch({ type: "status", statusId: id });
    setOpen(false);
  };

  return (
    <div data-testid="profile">
      <TitleBarButton
        ref={setTrigger}
        aria-label={`Current status: ${current.name}`}
        data-testid="current-status"
        variation="filled"
        shape="flex"
        noPadding
        tooltip={current.name}
        tooltipPlacement="bottom end"
        className={statusStyles.button}
        aria-haspopup="menu"
        aria-expanded={open}
        onPress={() => setOpen(!open)}
        prefix={<span className={statusStyles.badge}><StatusBadge type={current.type} /></span>}
        suffix={<Icon name="chevron_down" size="tiny" />}
        onKeyDown={(event) => {
          if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <Flex as="span" direction="column">
          <Text inline truncated className={statusStyles.name}>{current.name}</Text>
          <Timer since={state.statusSince} />
        </Flex>
      </TitleBarButton>
      <Portal>
        <Popup
          visible={open && !!position}
          className="ws-popup-status"
          style={{ ...position }}
          forwardedRef={(node) => {
            elementRef(node);
            setPopupNode(node);
          }}
        >
          <div style={{ maxHeight: 480, display: "flex", flexDirection: "column" }}>
            <div className="ws-status-section-title">
              <Text weight="medium" color="var(--text-description, var(--gray-600))">
                STATUS
              </Text>
            </div>
            <div style={{ padding: 8 }}>
              <StatusRow name={current.name} type={current.type} weight="medium" />
            </div>
            <Divider />
            <div style={{ maxHeight: 380, overflow: "auto", padding: 8 }}>
              <List aria-label="Status" role="menu">
                {statuses
                  .filter((status) => status.id !== current.id)
                  .map((status) => (
                    <ClickableItem
                      key={status.id}
                      role="menuitemradio"
                      aria-checked={false}
                      tabIndex={-1}
                      onClick={() => choose(status.id)}
                      onKeyDown={clickableKeyDown(() => choose(status.id))}
                    >
                      <StatusRow name={status.name} type={status.type} />
                    </ClickableItem>
                  ))}
              </List>
            </div>
          </div>
        </Popup>
      </Portal>
    </div>
  );
}
