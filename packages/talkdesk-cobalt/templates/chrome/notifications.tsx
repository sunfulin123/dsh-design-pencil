import { TitleBarButton } from "../title.bar/primitives/title-bar-button";
// Port of atlas notifications/components: the title bar button with its unread
// count, and the notification center panel (history grouped Today / Older).

import { useRef, useState } from "react";
import Button from "@talkdesk/cobalt-react-button";
import Divider from "@talkdesk/cobalt-react-divider";
import Icon from "@talkdesk/cobalt-react-icon";
import List, { Item } from "@talkdesk/cobalt-react-list";
import { Tag } from "@talkdesk/cobalt-react-tag";
import { ModalPanel } from "@talkdesk/cobalt-react-panel";
import { Heading, Text } from "@talkdesk/cobalt-react-typography";
import type { ResolvedNotification } from "../config";
import { logStandIn, useShell } from "./context";
import { SvgIcon } from "./SvgIcon";

export function NotificationButton() {
  const { state, dispatch } = useShell();
  const ref = useRef<HTMLButtonElement>(null);
  const unread = state.notifications.filter((item) => !item.read).length + (state.flags.desktopUpdateEntry ? 1 : 0);
  const open = state.notificationsOpen;
  const label = unread > 0 ? `Notifications, ${unread} unread` : "Notifications";

  return (
    <TitleBarButton
      id="atlas-notification-center-button"
      data-testid="workspace-notifications"
      aria-label={label}
      aria-expanded={open}
      aria-haspopup="dialog"
      icon="app_notifications"
      tooltip="Notifications"
      badge={unread > 0 ? (unread > 99 ? "99+" : String(unread)) : undefined}
      onPress={() => dispatch({ type: "notifications-open", open: !open })}
      ref={ref}
    />
  );
}

// notifications/utils/index.ts formatNotificationDate
function formatDate(value: string | number): string {
  const date = new Date(value);
  const now = new Date();
  const MINUTE = 60_000;
  const HOUR = 60 * MINUTE;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(date)) / (24 * HOUR));
  const diff = now.getTime() - date.getTime();
  if (days === 1) return "Yesterday";
  if (days > 1) return `${days} d`;
  if (diff <= MINUTE) return "Now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min`;
  return `${Math.floor(diff / HOUR)} h`;
}

const isToday = (value: string | number) => new Date(value).toDateString() === new Date().toDateString();

function ellipsis(text: string | undefined, length: number) {
  if (!text || text.length <= length) return text;
  return `${text.substring(0, length).trim()}...`;
}

function NotificationCard({ item }: { item: ResolvedNotification }) {
  const { dispatch } = useShell();
  const markRead = () => dispatch({ type: "notification-read", id: item.id });
  const onCardClick = item.hasLink
    ? () => {
        logStandIn(`Notification "${item.title}" opens its link in Workspace.`);
        if (!item.read) markRead();
      }
    : undefined;

  return (
    <div className={`ws-notification-card${onCardClick ? " ws-notification-card--link" : ""}`} onClick={onCardClick}>
      <div className="ws-notification-card__icon">
        {item.icon ? (
          item.icon.endsWith(".svg") ? (
            <SvgIcon url={item.icon} title={item.title} />
          ) : (
            <img src={item.icon} alt="" />
          )
        ) : <Icon name="calendar_today" size="tiny" />}
      </div>
      <div className="ws-notification-card__main">
        <div className="ws-notification-card__title-row">
          <Text truncated inline className="ws-notification-card__title">
            {item.title}
          </Text>
          <Text size="small" color="var(--text-description, var(--gray-600))" className="ws-notification-card__date">
            {` • ${formatDate(item.createdAt)}`}
          </Text>
        </div>
        {item.body ? (
          <Text size="small" color="var(--text-description, var(--gray-600))">
            {ellipsis(item.body, 135)}
          </Text>
        ) : null}
        {item.origin ? (
          <div style={{ paddingTop: 8 }}>
            <Tag size="tiny">{item.origin}</Tag>
          </div>
        ) : null}
      </div>
      {!item.read ? (
        <Button className="ws-notification-card__unread" size="small" shape="compact"
          variation="transparent" type="secondary" aria-label={`Mark ${item.title} as read`}
          onPress={markRead} data-testid={`notification-read-${item.id}`}>
          <Icon name="bullet" size="tiny" color="var(--info-11)" />
        </Button>
      ) : null}
    </div>
  );
}

function NotificationsList({ title, items }: { title: string; items: ResolvedNotification[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <header className="ws-notifications__list-title">
        <Heading level={4}>{title}</Heading>
      </header>
      <List role="list">
        {items.map((item) => (
          <Item noPadding key={item.id}>
            <NotificationCard item={item} />
          </Item>
        ))}
      </List>
    </div>
  );
}

/** The desktop update flag adds an ordinary history row, never a promotional banner. */
function SystemNotification() {
  return <div className="ws-notification-card" data-testid="notification-desktop-update">
    <Icon name="star_circle" size="tiny" />
    <div className="ws-notification-card__main">
      <Text>Workspace update available</Text>
      <Text size="small" variant="description">A sample update is ready to install.</Text>
      <Button size="small" variation="transparent" onPress={() => logStandIn('Open desktop update dialog')}>View update</Button>
    </div>
  </div>;
}

export function NotificationCenter() {
  const { state, dispatch } = useShell();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const close = () => dispatch({ type: "notifications-open", open: false });
  const today = state.notifications.filter((item) => isToday(item.createdAt));
  const older = state.notifications.filter((item) => !isToday(item.createdAt));


  return (
    <div className="ws-notifications-layer" ref={setContainer}>
      {container && state.flags.notificationCenter ? (
        <ModalPanel
          aria-labelledby="notification-history-title"
          container={container}
          isOpen={state.notificationsOpen}
          onOpenChange={(open) => {
            if (!open) close();
          }}
          isDismissible
          hideCloseButton
          size="small"
          position="end"
        >
          <div className="ws-notifications" data-testid="notification-history-panel">
            <header className="ws-notifications__header" >
              <span className="ws-notifications__title">
                <Heading level={3} id="notification-history-title" slot="title">
                  Notifications
                </Heading>
              </span>
              <Button
                onPress={close}
                type="secondary"
                variation="transparent"
                shape="compact"
                aria-label="Close notifications panel"
              >
                <Icon name="close" size="small" />
              </Button>
            </header>
            <div style={{ width: "100%" }}>
              <Divider />
            </div>
            {state.notifications.length > 0 || state.flags.desktopUpdateEntry ? (
              <div className="ws-notifications__scroll" data-testid="notification-history-list">
                <NotificationsList title="Today" items={today} />
                <NotificationsList title="Older" items={older} />
                {state.flags.desktopUpdateEntry ? <SystemNotification /> : null}
              </div>
            ) : !state.flags.desktopUpdateEntry ? (
              <div className="ws-notifications__empty" data-testid="history-empty-list">
                <Icon size="large" name="all_inbox" color="var(--gray-8, var(--gray-500))" />
                <Heading level={2}>No notifications</Heading>
              </div>
            ) : null}
          </div>
        </ModalPanel>
      ) : null}
    </div>
  );
}
