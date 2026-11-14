# Workspace stand-in shell

A copy of Workspace's frame for prototypes: the title bar, the dock and drawer, the secondary area, banners,
toasts and the notification center, ported from Workspace's own UI code with its real app names, icons and
drawer sections. Your app runs in an iframe as wide as Workspace would make it, so Cobalt's ViewportProvider
and CSS media queries measure the width the app really gets. A small stand-in for the Workspace SDK lets the
app ask for toasts, banners, badges and the rest, and the shell draws them outside the app's frame.

A thin bar above the window, not part of Workspace, switches the window size (fill, then the sizes of the docs'
"How much width an app gets" table: 1920, 1440, 1280, 1024, 640, and the desktop app's 424 × 540) and every feature flag (all on by default).

## Add it to a prototype

1. Copy this `workspace-shell/` folder into the prototype's `src/`.
2. Add the packages (React 18, Talkdesk registry in `.npmrc`):

   ```bash
   yarn add @talkdesk/cobalt-react-theme-provider @talkdesk/cobalt-theme-base @talkdesk/cobalt-react-viewport-provider @talkdesk/cobalt-react-portal-provider @talkdesk/cobalt-react-avatar @talkdesk/cobalt-react-button @talkdesk/cobalt-react-divider @talkdesk/cobalt-react-fake-input @talkdesk/cobalt-react-icon @talkdesk/cobalt-react-list @talkdesk/cobalt-react-message @talkdesk/cobalt-react-modal @talkdesk/cobalt-react-outside-click-hook @talkdesk/cobalt-react-panel @talkdesk/cobalt-react-popup @talkdesk/cobalt-react-position-hook @talkdesk/cobalt-react-scrollable-shadow @talkdesk/cobalt-react-shortcut @talkdesk/cobalt-react-tag @talkdesk/cobalt-react-typography @talkdesk/cobalt-marketplace-react-ai-disclaimer @talkdesk/cobalt-marketplace-react-list @talkdesk/cobalt-marketplace-react-pagination @talkdesk/cobalt-marketplace-react-tooltip
   ```

3. Make the entry call `mountPrototype`. It replaces the usual `createRoot(...).render(...)`, and sets up
   the Cobalt root (theme stylesheet, `body` rule, ThemeProvider > ViewportProvider > PortalProvider) in
   both the shell and the app's frame. Don't import the theme stylesheet or wrap the app in providers yourself.

   ```tsx
   // src/main.tsx
   import { mountPrototype } from "./workspace-shell";
   import App from "./App";

   mountPrototype({
     app: <App />,
     shell: { app: { id: "admin", page: "users-settings" } },
   });
   ```

The same page loads three ways: the shell at the plain URL, the app inside it at `?frame=app`, and each
secondary area app at `?frame=secondary&app=<id>`. Open `?frame=app` on its own to see the app without the
shell.

## Configuration

Every field of `shell` is optional.

| Field | What it sets | Default |
| --- | --- | --- |
| `app` | `{ id, page }`: which dock entry is the prototype's app, and which drawer page is current. | First dock app, its first page |
| `dock` | The dock entries, in order (`DockApp[]`). | `DEFAULT_DOCK_APPS` |
| `user` | `{ name, initials?, avatarUrl? }`. Initials are worked out from the name, as Workspace does. | Jordan Sample |
| `status` | The status pill: `{ current?, since?, statuses? }`, or `false` to hide it. | Available, timer from page load |
| `secondaryArea` | `{ apps?, current?, open? }`. `apps: []` removes the area and its toggle. | Copilot, Canvas, Smart Help; open |
| `notifications` | `NotificationItem[]`: `title`, `body`, `origin`, `icon`, `createdAt`, `read`, `hasLink`. | None |
| `profileMenu` | The configured profile menu items. | The production ones |
| `flags` | Feature flag overrides, e.g. `{ expandedDock: false }`. | All on |
| `window` | Starting window size: `"fill"`, `"1920"`, `"1440"`, `"1280"`, `"1024"`, `"640"`, `"desktop"`. | `"fill"` |
| `platform` | `"mac"` or `"windows"`, for shortcut labels. | From the browser |
| `title` | The browser tab's title. | |

A `DockApp` is `{ id, title, icon?, iconName?, sections?, badge?, error? }`. `icon` is the URL of a single-colour SVG,
recoloured as Workspace recolours its icons (its host must allow cross-origin requests, as Talkdesk's CDN does); `iconName` is a Cobalt icon name instead. `sections` is a list of pages
(`{ type: "page", id, title }`), groups (`{ type: "group", title, pages }`) and action blocks
(`{ type: "actions", actions: [{ id, title, icon? }] }`). An app without sections has no drawer.

Helpers for the dock, all exported from the folder:

* `DEFAULT_DOCK_APPS`: Home, Conversations, Voicemails, Activities, Contacts, Copilot, Workforce Management,
  Quality Management, Interaction Analytics, Explore, Admin, with their production sections.
* `addDockApp(apps, app, { before? })`: adds an app, before Admin by default (Admin stays last).
* `withSections(apps, id, sections)`: replaces an app's drawer sections.
* `pagesOf(app)`: an app's pages, flattened. Admin's page ids look like `users-settings`, `teams`, `queues-ui`.
* `DEFAULT_SECONDARY_APPS` (Copilot, Canvas, Smart Help), `DEFAULT_STATUSES`, `PROFILE_MENU_ITEMS`.

Only the default dock and secondary area apps come with the shell. For any other app, describe it yourself:
its title, an `icon` URL or a Cobalt `iconName`, and its drawer `sections`.

A prototype with its own app:

```tsx
import { mountPrototype, addDockApp, DEFAULT_DOCK_APPS, DEFAULT_SECONDARY_APPS } from "./workspace-shell";

mountPrototype({
  app: <App />,
  shell: {
    app: { id: "routing-studio", page: "overview" },
    dock: addDockApp(DEFAULT_DOCK_APPS, {
      id: "routing-studio",
      title: "Routing Studio",
      iconName: "app_automation_flows",
      sections: [
        { type: "page", id: "overview", title: "Overview" },
        { type: "group", title: "Rules", pages: [{ type: "page", id: "rules", title: "All rules" }] },
      ],
    }),
    secondaryArea: {
      apps: DEFAULT_SECONDARY_APPS.map((app) => (app.title === "Copilot" ? { ...app, content: <CopilotMock /> } : app)),
    },
  },
});
```

A secondary app's `content` renders in its own iframe; without it, the area shows a placeholder. Other dock
apps show a placeholder in the primary area when the user opens them.

## The SDK stand-in

The app imports `workspace` from the folder. Each call is a `postMessage` to the shell. Outside the shell
(for example at `?frame=app` on its own), calls log to the console and draw nothing.

| Call | What the shell draws |
| --- | --- |
| `workspace.toast({ message, title?, type?, dismissDelay?, dismissible?, actions? })` | A toast at the bottom right of the window. `type`: success, info (default), warning, error, primary, secondary. `dismissDelay`: short 3s, medium 5s, long 7s, infinite (default). Up to two `actions: [{ label, onClick }]`. Returns `{ dismiss() }`. |
| `workspace.banner({ message, variation?, dismissible? })` | A banner across the primary and secondary areas. `variation`: success, warning, info (default), error, feature. Returns `{ dismiss() }`. |
| `workspace.setBadge(visible, { app? })` | The "•" badge on the app's dock button (or another dock app's). |
| `workspace.navigate(pageId)` | Highlights that page in the drawer. |
| `workspace.onNavigate(listener)` / `useWorkspacePage()` | The user picked a page of the app in the drawer. |
| `workspace.onAction(listener)` | The user clicked one of the app's drawer actions. |
| `workspace.closeSecondaryArea()` | Closes the secondary area. Apps can't open it. |
| `workspace.showError("UNAUTHORIZED" \| "NOT_FOUND")` | Workspace's error screen over the app, until the user navigates. |
| `workspace.openPanel({ title, kind?, tabs?, onClose? })` | A Workspace panel (or `kind: "modal"`) over the app's area, with a placeholder where the other apps would run. Returns `{ close() }`. |
| `workspace.getState()` / `subscribe()` / `useWorkspaceState()` | The frame's area, app, current page and feature flags. |
| `workspace.notify()`, `triggerProtocol()`, `bringToFront()`, `registerShortcut()`, `openFloatingWindow()` | Nothing: they log what Workspace would do. |

`example/SdkTour.tsx` makes each call the shell draws, next to its line of code, and `example/entry.tsx`
mounts it in the shell. To see it before writing your own app, make your entry `import "./workspace-shell/example/entry";`.
The docs site runs the same tour on its "Build with AI" page.

Workspace's keyboard shortcuts (⌘K or Ctrl+Shift+F, Alt+S, Alt+1 to Alt+9, ⌘/) work while focus is in the
app, as they do in Workspace.

## Light and dark

Switch the theme from the profile menu (the avatar at the right of the title bar): Theme › Light, Dark or Match
system. As in Workspace, every page loads Cobalt's theme stylesheet from Talkdesk's CDN, which has both colour
schemes (npm's `@talkdesk/cobalt-theme-base` has light only), and `data-co-colorscheme` on each page's
`<html>` picks one. ThemeProvider gets a loader that returns no theme, so it doesn't force light colours.
The app is set up like a Workspace app that declares dark mode support, so check it in both.

The two feature flags behave as in Workspace: "Appearance in the profile menu" shows the Theme submenu and
themes Workspace itself, and "Theme stylesheet in the app" passes the choice on to the apps. Cobalt's dark
mode isn't finished, so a component that looks wrong in dark may need fixing in Cobalt, not in the prototype.

## What it doesn't do

* **No real data or services.** Search, AppConnect, profile menu items, logout and notification links log to
  the console instead of opening anything.
* **SDK calls with nowhere to go** (operating system notifications, protocols, background apps, app
  shortcuts, floating windows) only log.
* **Not drawn:** network status, call quality and virtual desktop status (Workspace shows them only on
  events), the desktop app's window controls, and the newer drawer from the design guidance that Workspace's
  code doesn't have yet.

## Updating the data

`data/menu.generated.ts` is generated from Workspace's production menu configuration and committed. It holds
only the default dock and the default secondary area apps, with their titles, public CDN icon URLs and drawer
structure. The generator, `scripts/generate-menu-data.mjs`, is in the cobalt-docs repository (not in the
published copy); its header says how to run it. The Cobalt team re-runs it when the menu changes.
