/**
 * Recipe: detail page — one record, read only: a page header with Back, the record's name and a destructive
 * action; tabs for the record's areas; in the selected tab, a section header with Edit, a summary row, then
 * the details in titled groups of label-and-value pairs, with full-width dividers between the bands.
 *
 * Matches the Users app profile in Figma (Profile tab, "Success"): the summary row with a large avatar, the
 * name and a status tag, then Role beside it with an icon; Contact information with an icon beside each
 * value; Employee and Additional information side by side, with empty values as a light-gray tag. Edit opens
 * the Form Page recipe, its edit mode.
 *
 * Copy this file and replace the record, the tabs and the groups. It needs the app setup from Get started ›
 * Develop (theme stylesheet, ThemeProvider, ViewportProvider, PortalProvider) and these packages:
 *   @talkdesk/cobalt-react-avatar @talkdesk/cobalt-react-button @talkdesk/cobalt-react-divider
 *   @talkdesk/cobalt-react-flex @talkdesk/cobalt-react-icon @talkdesk/cobalt-react-tab
 *   @talkdesk/cobalt-react-tag @talkdesk/cobalt-react-typography @talkdesk/cobalt-react-viewport-provider
 *
 * Compiled against the published packages on every docs build (scripts/check-examples.mjs).
 */
import React, { useState } from "react";
import Avatar from "@talkdesk/cobalt-react-avatar";
import Button from "@talkdesk/cobalt-react-button";
import Divider from "@talkdesk/cobalt-react-divider";
import Flex from "@talkdesk/cobalt-react-flex";
// The default export loads the icon font itself; the named `Icon` export needs an IconsProvider above it.
import Icon from "@talkdesk/cobalt-react-icon";
import Tab from "@talkdesk/cobalt-react-tab";
import { Tag } from "@talkdesk/cobalt-react-tag";
import { Heading, Text } from "@talkdesk/cobalt-react-typography";
import { useViewport } from "@talkdesk/cobalt-react-viewport-provider";

// Page padding and the space around dividers: 12px / 16px / 24px on small / medium / large viewports.
const PAGE_PADDING = { small: 12, medium: 16, large: 24 } as const;
// Groups sit in 360px columns on large and medium viewports, as in the design; one column on small ones.
const COLUMN_WIDTH = 360;
type IconName = React.ComponentProps<typeof Icon>["name"];

/* ---------- data: replace with yours --------------------------------------------------- */

export interface UserRecord {
  firstName: string;
  lastName: string;
  active: boolean;
  role: string;
  email: string;
  externalId: string | null;
  team: { name: string; parent: string | null } | null;
}

// A fictional person; @example.com addresses only.
export const SAMPLE_USER: UserRecord = {
  firstName: "Avery",
  lastName: "Example",
  active: true,
  role: "Agent",
  email: "avery.example@example.com",
  externalId: null,
  team: { name: "Team Alpha", parent: "Support" },
};

const TABS = [
  { key: "profile", label: "Profile" },
  { key: "classic-settings", label: "Classic settings" },
  { key: "wrap-up-settings", label: "Wrap-up settings" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

/* ---------- layout ----------------------------------------------------------------------- */

const fullName = (u: UserRecord) => `${u.firstName} ${u.lastName}`.trim();
const initials = (u: UserRecord) => `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase();

// A value that isn't set: a light-gray tag, as in the design ("N/A", "None"), so it can't be mistaken for text.
function EmptyValue({ children }: { children: string }) {
  return (
    <div>
      <Tag size="small" color="light-gray">
        {children}
      </Tag>
    </div>
  );
}

// A label above its value. Not a form Label: there's no control to name, so it's medium-weight text.
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Flex direction="column" gap={1}>
      <Text weight="medium">{label}</Text>
      {typeof children === "string" ? <Text>{children}</Text> : children}
    </Flex>
  );
}

// A field with an icon in a small gray avatar beside it (Role, Email). Avatar is hidden from screen readers,
// which is right here: the label says what the value is.
function IconField({ icon, label, children }: { icon: IconName; label: string; children: React.ReactNode }) {
  return (
    <Flex gap={4} alignY="center">
      <Avatar size="small">
        <Icon name={icon} size="tiny" />
      </Avatar>
      <Field label={label}>{children}</Field>
    </Flex>
  );
}

// A titled group of fields. Group titles are level-3 headings styled small, under the tab's level-2 header.
function Group({ title, width, children }: { title: string; width: string | number; children: React.ReactNode }) {
  return (
    <Flex direction="column" alignX="stretch" gap={4} style={{ width, boxSizing: "border-box" }}>
      <Heading level={3} asLevel={6}>
        {title}
      </Heading>
      {children}
    </Flex>
  );
}

/* ---------- page ----------------------------------------------------------------------- */

interface Props {
  user?: UserRecord;
  onBack?: () => void;
  onEdit?: (user: UserRecord) => void;
  onDelete?: (user: UserRecord) => void;
}

export default function DetailPage({ user = SAMPLE_USER, onBack, onEdit, onDelete }: Props) {
  const viewport = useViewport();
  const padding = PAGE_PADDING[viewport];
  const columnWidth = viewport === "small" ? "100%" : COLUMN_WIDTH;
  const [tab, setTab] = useState<TabKey>("profile");
  const name = fullName(user);

  return (
    <Flex direction="column" alignX="stretch">
      {/* The page header, from core parts: Back, the record's name as the page title, and the destructive
          action on the right. Tabs sit under it, then a full-width divider. */}
      <Flex alignX="space-between" alignY="center" gap={2} wrap style={{ padding }}>
        <Flex alignY="center" gap={2}>
          <Button
            variation="transparent"
            type="secondary"
            aria-label="Back to users"
            onPress={onBack}
            prefix={<Icon name="chevron_left" />}
          />
          <Heading level={1}>{name}</Heading>
        </Flex>
        <Button type="danger" variation="transparent" prefix={<Icon name="delete_outline" />} onPress={() => onDelete?.(user)}>
          Delete user
        </Button>
      </Flex>
      <nav aria-label={`${name} sections`} style={{ display: "flex", gap: 16, paddingInline: padding }}>
        {TABS.map((t) => (
          <Tab
            key={t.key}
            href={`#${t.key}`}
            active={tab === t.key}
            aria-current={tab === t.key ? "page" : undefined}
            onClick={(e) => {
              e.preventDefault();
              setTab(t.key);
            }}
          >
            {t.label}
          </Tab>
        ))}
      </nav>
      <Divider />

      {tab !== "profile" ? (
        <Flex padding={6}>
          <Text variant="description">This tab is left empty in the recipe.</Text>
        </Flex>
      ) : (
        <>
          {/* The tab's section header: its title and description, and Edit, the page's one primary action. */}
          <Flex alignX="space-between" alignY="start" gap={2} wrap style={{ padding }}>
            <Flex direction="column" gap={1}>
              <Heading level={2}>Profile</Heading>
              <Text variant="description">Identification and profile details of the user within your company</Text>
            </Flex>
            <Button type="primary" prefix={<Icon name="edit" />} onPress={() => onEdit?.(user)}>
              Edit
            </Button>
          </Flex>

          {/* The summary row: who the record is and its status, then its most important attribute. */}
          <Flex alignY="center" gap={6} wrap style={{ paddingInline: padding, paddingBottom: padding }}>
            <Flex alignY="center" gap={4} style={{ width: columnWidth, boxSizing: "border-box" }}>
              <Avatar size="large" color="light-theme">
                {initials(user)}
              </Avatar>
              <Flex direction="column" gap={3}>
                <Text elementType="span" style={{ fontSize: "var(--font-size-xmega)" }}>
                  {name}
                </Text>
                <div>
                  <Tag size="small" color={user.active ? "light-green" : "light-gray"}>
                    {user.active ? "Active" : "Inactive"}
                  </Tag>
                </div>
              </Flex>
            </Flex>
            <IconField icon="work" label="Role">
              {user.role}
            </IconField>
          </Flex>
          <Divider />

          <Flex direction="column" gap={6} style={{ padding }}>
            <Group title="Contact information" width={columnWidth}>
              <IconField icon="mail" label="Email">
                {user.email}
              </IconField>
            </Group>
            <Flex gap={6} wrap alignY="start">
              <Group title="Employee information" width={columnWidth}>
                <Field label="External ID">
                  {user.externalId ?? <EmptyValue>N/A</EmptyValue>}
                </Field>
              </Group>
              <Group title="Additional information" width={columnWidth}>
                <Field label="Team">
                  {user.team ? (
                    // A team with a parent shows the parent before the tag, as in the design.
                    <Flex alignY="center" gap={1}>
                      {user.team.parent && (
                        <Text size="small" variant="description" elementType="span">
                          {`${user.team.parent}:`}
                        </Text>
                      )}
                      <Tag size="small" color="light-gray">
                        {user.team.name}
                      </Tag>
                    </Flex>
                  ) : (
                    <EmptyValue>None</EmptyValue>
                  )}
                </Field>
              </Group>
            </Flex>
          </Flex>
          <Divider />
        </>
      )}
    </Flex>
  );
}
