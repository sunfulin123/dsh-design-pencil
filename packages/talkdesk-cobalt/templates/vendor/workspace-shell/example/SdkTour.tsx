// A tour of what an app can ask Workspace for: each request with the line of code that makes it and a
// button that makes it, so the shell draws the answer. The docs site shows it on "What an app can ask for";
// a prototype doesn't mount it unless it imports it. See entry.tsx for the shell around it.

import { useState } from "react";
import Button from "@talkdesk/cobalt-react-button";
import Divider from "@talkdesk/cobalt-react-divider";
import { Heading, Text } from "@talkdesk/cobalt-react-typography";
import { useViewport } from "@talkdesk/cobalt-react-viewport-provider";
import { workspace, useWorkspacePage, pagesOf, DEFAULT_DOCK_APPS } from "..";

interface Request {
  name: string;
  what: string;
  code: string;
  run: () => void;
}

const adminPages = pagesOf(DEFAULT_DOCK_APPS.find((app) => app.id === "admin"));

function Row({ request }: { request: Request }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "12px 0" }}>
      <div style={{ flex: "1 1 260px", minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <Text weight="medium">{request.name}</Text>
        <Text variant="description">{request.what}</Text>
        <code style={{ fontSize: 12, overflowWrap: "anywhere", color: "var(--text-description)" }}>{request.code}</code>
      </div>
      <Button type="secondary" variation="outline" size="small" onPress={request.run}>
        Try it
      </Button>
    </div>
  );
}

function Group({ title, requests }: { title: string; requests: Request[] }) {
  return (
    <section style={{ display: "flex", flexDirection: "column" }}>
      <Heading level={3}>{title}</Heading>
      {requests.map((request, i) => (
        <div key={request.name}>
          {i > 0 ? <Divider /> : null}
          <Row request={request} />
        </div>
      ))}
    </section>
  );
}

export function SdkTour() {
  const page = useWorkspacePage();
  const viewport = useViewport();
  const [badge, setBadge] = useState(false);
  const pageTitle = adminPages.find((item) => item.id === page)?.title ?? "Users";
  const padding = viewport === "small" ? 12 : viewport === "medium" ? 16 : 24;

  const messages: Request[] = [
    {
      name: "Toast",
      what: "A short message at the bottom right of the window, about something the user just did.",
      code: `workspace.toast({ title: "User invited", message: "…", type: "success", dismissDelay: "medium" })`,
      run: () =>
        void workspace.toast({
          title: "User invited",
          message: "We sent an invitation to blake.sample@example.com.",
          type: "success",
          dismissDelay: "medium",
        }),
    },
    {
      name: "Toast with actions",
      what: "Up to two buttons, such as Undo. The toast stays until the user closes it.",
      code: `workspace.toast({ message: "3 users were deactivated.", actions: [{ label: "Undo", onClick }] })`,
      run: () =>
        void workspace.toast({
          message: "3 users were deactivated.",
          actions: [{ label: "Undo", onClick: () => console.log("Undo clicked") }, { label: "View" }],
        }),
    },
    {
      name: "Banner",
      what: "A message across the top of the content, about something that affects the whole session.",
      code: `workspace.banner({ message: "…", variation: "warning" })`,
      run: () =>
        void workspace.banner({
          message: "We're having connectivity issues that may affect some features",
          variation: "warning",
        }),
    },
  ];

  const around: Request[] = [
    {
      name: badge ? "Hide the badge" : "Show the badge",
      what: "The “•” on the app's dock button, for ongoing activity the user should come back to.",
      code: `workspace.setBadge(${!badge})`,
      run: () => {
        void workspace.setBadge(!badge);
        setBadge(!badge);
      },
    },
    {
      name: "Move to another page",
      what: "Tells Workspace the app changed page, so the drawer highlights it. Here: Teams.",
      code: `workspace.navigate("teams")`,
      run: () => void workspace.navigate("teams"),
    },
    {
      name: "Close the secondary area",
      what: "Apps can close it, but only the user opens it.",
      code: `workspace.closeSecondaryArea()`,
      run: () => void workspace.closeSecondaryArea(),
    },
  ];

  const over: Request[] = [
    {
      name: "Error screen",
      what: "Replaces the app's content with Workspace's own error screen, until the user picks a page in the drawer.",
      code: `workspace.showError("NOT_FOUND")`,
      run: () => void workspace.showError("NOT_FOUND"),
    },
    {
      name: "Workspace panel",
      what: "A panel over the app's area. In Workspace its tabs hold other apps.",
      code: `workspace.openPanel({ title: "Contact details", tabs: ["Contact", "Activity"] })`,
      run: () => void workspace.openPanel({ title: "Contact details", tabs: ["Contact", "Activity"] }),
    },
    {
      name: "Workspace modal",
      what: "The same, as a modal over the app's area.",
      code: `workspace.openPanel({ title: "Transfer call", kind: "modal" })`,
      run: () => void workspace.openPanel({ title: "Transfer call", kind: "modal" }),
    },
  ];

  return (
    <div style={{ padding, display: "flex", flexDirection: "column", gap: 24 }}>
      <header style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Heading level={1}>{pageTitle}</Heading>
        <Text variant="description">
          This app runs inside Workspace. Each request below is one line of code; Workspace draws the answer
          outside the app, around it or over it.
        </Text>
      </header>
      <Group title="Messages" requests={messages} />
      <Group title="Around the app" requests={around} />
      <Group title="Over the app" requests={over} />
    </div>
  );
}

/** What the secondary area shows for Copilot in the tour: a stand-in, with the one request it can make. */
export function CopilotStandIn() {
  return (
    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
      <Text>Copilot's suggestions for the current conversation appear here.</Text>
      <div>
        <Button type="secondary" variation="outline" size="small" onPress={() => void workspace.closeSecondaryArea()}>
          Close secondary area
        </Button>
      </div>
    </div>
  );
}
