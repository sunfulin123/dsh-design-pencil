# Workspace overview

## Guidance

Workspace is the frame every Talkdesk app runs in. It draws the title bar, the dock and drawer, and the
secondary area, and it loads each app in its own iframe inside that frame. Apps never build any of this.
This page explains how Workspace and an app fit together: what each one owns, how they talk to each other,
and how much space the app gets.

:::note
Checked against the Workspace source code in October 2026. Where the code and the
[Workspace design guidance](https://designsystem.talkdesk.com/51aaf6147/p/3163ff-workspace) disagree, this page follows the code and lists the difference under [Open questions](#open-questions). Some
behaviour depends on feature flags whose state in production isn't confirmed. It's marked **behind a
feature flag**.
:::

**Building an app for real?** Build only your app's content. Workspace provides everything around it, in
every environment your app ships to. See [Build with AI › Build an app for real](/get-started/build-with-ai/#build-an-app-for-real).

**Prototyping?** A prototype runs outside Workspace, so it has to stand in for it. The rest of this section
describes that behaviour, and a ready-made stand-in shell reproduces it: see
[Build with AI › In a stand-in shell](/get-started/build-with-ai/#in-a-stand-in-shell).

## The screen

```text
┌───────────────────────────────────────────────────────────────────┐
│ Title bar                                                         │
├──────┬─────────┬──────────────────────────────────────────────────┤
│      │         │ Banners                                          │
│      │         ├────────────────────────────┬─────────────────────┤
│ Dock │ Drawer  │ Primary area               │ Secondary area      │
│      │         │ (the current app)          │ (a second app)      │
│      │         │                            │                     │
└──────┴─────────┴────────────────────────────┴─────────────────────┘
```

| Part           | What it does                                                                                                                                                                        | Drawn by                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Title bar      | The 40px bar across the top. Holds search, notifications, the user's status and profile, and the secondary area toggle, among others; on the desktop app, also the window controls. | Workspace                                                |
| Dock           | The rail of app icons on the left: the first level of navigation.                                                                                                                   | Workspace                                                |
| Drawer         | The current app's sections: the second level of navigation.                                                                                                                         | Workspace, from the app's menu configuration             |
| Banners        | Messages across the top of both areas, from Workspace or from an app.                                                                                                               | Workspace                                                |
| Primary area   | Where the current app runs.                                                                                                                                                         | The app, in its own iframe                               |
| Secondary area | A second app next to the first, such as Copilot.                                                                                                                                    | That app, in its own iframe. Workspace draws its header. |

Toasts, the notification center and the operating system's notifications are drawn by Workspace too.

![The Workspace window with each part labelled: the title bar across the top, the dock down the left, the drawer listing an app's pages, the main app in the middle and the secondary area on the right showing a live call.](/assets/workspace/overview/components.png)
*Workspace's parts, from the Workspace design guidance*

## How an app runs inside Workspace

* **Each app loads in its own sandboxed iframe.** An app can't reach the Workspace page or another app's
  page, and if it crashes, the rest of Workspace keeps working.
* **An app talks to Workspace through the Workspace SDK** (`@atlas/sdk`, plus an SDK per Workspace
  capability). Each call is a message to Workspace, answered asynchronously. An app can use only the
  capabilities it has been granted.
* **Workspace decides where an app appears**, from the app's configuration: in the primary area (most apps),
  in the secondary area, or, on the desktop app, in a small floating window that stays on top of other
  windows.
* **The dock and drawer entries come from configuration, not from the app's code.** The app's icon, name and
  sections are defined in its menu configuration, and Workspace draws them.

## What Workspace owns and what your app owns

**Workspace owns:**

* The title bar, dock, drawer, secondary area, and the secondary area's header.
* Banners, toasts, the notification center and operating system notifications.
* How wide each part is and which ones are open. That depends on the window's width and on what the user
  last opened.
* The theme, and the user's choice between light, dark and system appearance (**behind a feature flag**).

**Your app owns:**

* Everything inside its iframe: its page header, its content, and the Cobalt modals, panels and menus it
  opens. These stay inside the app's frame.
* Adapting to the width it's given (see [What width your app gets](#what-width-your-app-gets)).
* Asking Workspace for anything outside its frame, through the SDK: a badge on its dock icon, a toast, a
  banner, a notification, a panel or modal drawn by Workspace, or closing the secondary area. An app can't
  open the secondary area or change the size of any part of the shell.

## What width your app gets

Your app's viewport is its iframe, not the browser window: the window's width minus the dock and whatever is
open beside the app, such as the drawer and the secondary area. CSS media queries and Cobalt's
ViewportProvider measure that iframe. **Design every app to work at 360px wide**, as most agents use a small
window. [Space and viewports](/workspace/space-and-viewports/) has the rules, the sizes and example widths.

## Where Workspace runs

* **Web browser, desktop app (macOS and Windows) and installed web app.** It's the same shell in all three.
* **The desktop app** shows the operating system's window controls in the title bar, opens at 424 × 540px
  the first time (also its minimum size), and reopens where the user last placed it.
* **When there isn't room** for a part the user opens, the desktop app and the installed web app make the
  window wider; in a browser tab, Workspace shows a toast asking the user to widen the window.
* **Headless mode** runs Workspace without the title bar, the dock, the secondary area or the notification
  center. A minimal title bar can be turned on.

## Theme

Workspace gives each app its Cobalt theme through the SDK, and the app passes it to ThemeProvider:

```tsx
import AtlasSdk from "@atlas/sdk";
import { ThemeProvider } from "@talkdesk/cobalt-react-theme-provider";

<ThemeProvider loader={() => AtlasSdk.theme.getConfig()}>
  <App />
</ThemeProvider>;
```

Users can choose light, dark or system appearance (**behind a feature flag**). Make sure your app works in
both light and dark. Dark mode reaches an app like this:

* **Workspace adds Cobalt's theme stylesheet to the app's page**, from Talkdesk's CDN
  (`theme-light`, which holds both colour schemes despite its name), and sets `data-co-colorscheme` on its
  `<html>` to `light` or `dark`, following the user's choice. With "system", it follows the operating system
  and changes when the operating system does.
* **The stylesheet switches the colours** for that attribute.
* **The app has to declare dark mode support** in its configuration, in its list of capabilities:

  ```json
  {
    "name": "@atlas/theme",
    "properties": { "darkMode": true }
  }
  ```

  Without it, Workspace hands the app's ThemeProvider the light theme, which ThemeProvider sets on its own
  `<div>`. Those colours override the stylesheet, so the app stays light.

The stylesheet and the attribute are **behind a feature flag** too. To check dark mode in a prototype, see
[Build with AI › In a stand-in shell](/get-started/build-with-ai/#in-a-stand-in-shell).

## Feature flags

Some Workspace behaviour is behind feature flags, and which ones are on in production isn't confirmed. The
Workspace pages mark it **behind a feature flag**:

| Behind a feature flag                                       | Described in                                                                                      |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Light, dark and system appearance, in the profile menu      | [Title bar](/workspace/title-bar/#the-profile-menu)                                               |
| Cobalt's theme stylesheet in the app, which dark mode needs | [Theme](#theme)                                                                                   |
| Notification center                                         | [Messages](/workspace/messages/#notification-center)                                              |
| Keyboard shortcuts, Workspace's and apps'                   | [Title bar](/workspace/title-bar/), [What an app can ask for](/workspace/app-requests/#shortcuts) |
| Expanded dock                                               | [Dock and drawer](/workspace/dock-and-drawer/#expanded-dock)                                      |
| AppConnect launcher under the dock                          | [Dock and drawer](/workspace/dock-and-drawer/#dock)                                               |
| Resizing the secondary area                                 | [Secondary area](/workspace/secondary-area/)                                                      |
| Update entry in the notification center (desktop app)       | [Desktop app](/workspace/desktop-app/#updates)                                                    |

A prototype in the stand-in shell turns them all on, with a switch for each.

## Open questions

Differences between the code and the Workspace design guidance, for the Workspace team to settle. Until they
do, follow the code's value, which is what users see.

* **Desktop app size.** The guidance says the desktop app first opens at 424 × 640px. The code opens it at
  424 × 540px, its minimum, and 640 appears nowhere in it.
* **Dock width.** The guidance gives 64px, and works out the 424px desktop width as a 360px app plus a 64px
  dock. The App Shell Figma component is 54px. In the web code it's 58px.
* **Headless mode.** The code supports it, but where Workspace runs headless isn't documented.
* **Feature flags.** Which of the flagged behaviours are on in production.
* **Dark mode outside Workspace.** The theme stylesheet on npm (`@talkdesk/cobalt-theme-base` 2.5.0) has light
  colours only, and the theme packages are no longer published there. The stylesheet with both colour schemes
  is only on Talkdesk's CDN (`theme-light`, whose version Workspace takes from each account's configuration;
  4.1.6 is the newest), so an app or prototype outside Workspace has to load it from there, as the stand-in
  shell does.
* **Declaring dark mode support.** The Workspace guidance asks apps to work in light and dark, and the SDK
  documentation doesn't mention that an app gets dark colours only when its configuration declares
  `darkMode`.
* **The CLI without credentials.** The Atlas CLI has an option that skips signing in, meant for testing.
  Whether prototypes could use it to run Workspace without Talkdesk ID credentials isn't documented.
