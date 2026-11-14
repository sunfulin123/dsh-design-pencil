// The tour inside the shell: Admin's Users page, with notifications and Copilot in the secondary area.
// Importing this file mounts it. The docs site does, on its demo page; a prototype can too, to try the shell
// before writing its own app (import "./workspace-shell/example/entry" from its src/main.tsx).

import { mountPrototype, DEFAULT_SECONDARY_APPS } from "..";
import { SdkTour, CopilotStandIn } from "./SdkTour";

const minute = 60 * 1000;
const hour = 60 * minute;

mountPrototype({
  app: <SdkTour />,
  shell: {
    title: "What an app can ask Workspace for",
    app: { id: "admin", page: "users-settings" },
    user: { name: "Jordan Sample" },
    status: { current: "available" },
    secondaryArea: {
      apps: DEFAULT_SECONDARY_APPS.map((app) => (app.title === "Copilot" ? { ...app, content: <CopilotStandIn /> } : app)),
    },
    notifications: [
      {
        title: "Export ready",
        body: "Your users export finished. Download it from the Exports page.",
        origin: "Admin",
        createdAt: Date.now() - 5 * minute,
        hasLink: true,
      },
      { title: "New role assigned", body: "You were given the Supervisor role.", origin: "Admin", createdAt: Date.now() - 3 * hour },
      {
        title: "Weekly report",
        body: "The weekly quality report is available.",
        origin: "Quality Management",
        createdAt: Date.now() - 30 * hour,
        read: true,
      },
    ],
  },
});
