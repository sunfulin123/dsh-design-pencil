# Desktop app

## Guidance

The Talkdesk desktop app for macOS and Windows runs the same Workspace as the browser, inside its own window.
Apps don't need a separate build for it. What changes is around them: the window's size, floating windows,
links from the operating system, and how the app closes and updates. This page describes those differences
and what they mean for an app.

:::note
Checked against the Workspace and desktop app source code in October 2026. Where the code and the Workspace
design guidance disagree, this page follows the code and lists the difference under
[Open questions](#open-questions).
:::

## How it differs from the browser

|                                                            | Browser                                   | Desktop app                                                                              |
| ---------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Window**                                                 | Any size                                  | At least 424 × 540px                                                                     |
| **Title bar**                                              | Workspace's title bar only                | Workspace's title bar, with the operating system's window controls in it                 |
| **Not enough room for a part the user opens**              | A toast asks the user to widen the window | The window widens                                                                        |
| **Floating windows**                                       | Not available                             | Available                                                                                |
| **Links from other programs** (`tel:` and Workspace links) | Not handled                               | Open in Workspace                                                                        |
| **Links that open a new tab**                              | A new browser tab                         | The default browser                                                                      |
| **Closing the window**                                     | Closes Workspace                          | Hides or minimizes it on most setups (see [Closing and quitting](#closing-and-quitting)) |
| **Updates to Workspace**                                   | When the page reloads                     | Downloaded in the background, installed when the user agrees                             |

An app can tell where it's running from `Atlas.environment.getConfig()`, whose `engineType` is `web`,
`desktop` or `pwa` (the installed web app).

## The window

* **Size:** 424 × 540px when it first opens, which is also its minimum. Users can make it bigger but not
  smaller, and it can't go full screen.
* **Position:** it reopens where the user last placed it. If the screens have changed and that place is gone,
  it opens in the top-left corner of the nearest screen.
* **Growing for the shell:** when the user opens the drawer or the secondary area and there isn't room, the
  window widens to fit and keeps its height. See [Space and viewports](/workspace/space-and-viewports/).
* **Title bar:** the operating system's window controls sit inside Workspace's title bar, and the title bar
  drags the window. See [Title bar](/workspace/title-bar/).
* **Zoom:** users can zoom in and out, which leaves fewer CSS pixels for every app.

![The desktop app as a narrow window on a desktop background, measured at 424px wide and 640px tall.](/assets/workspace/overview/desktop-default-size.png)
*First size in the guidance: 424 × 640px*
The code opens the window at 424 × 540px. See Open questions.

  ![The desktop app as a narrow window on a desktop background, measured at 424px wide and 540px tall.](/assets/workspace/overview/desktop-minimum-size.png)
*Minimum size: 424 × 540px*

At its minimum size, an app with sections gets about 356px. Design for it: the Workspace guidance expects over
80% of agents to use the desktop app in a small window next to their CRM.

### Coming to the front

Workspace brings the desktop window to the front when the user clicks one of its operating system
notifications, when a background app asks to come to the front (for example for an incoming call), and when a
link from another program opens in Workspace.

### Staying on top

Users can keep the Workspace window above all other windows with an **always on top** preference. Floating
windows sit above it.

## Floating windows

A floating window is a small, separate window that shows one app and stays on top of every other window,
including Workspace. It's meant for something the user needs to see or act on while working elsewhere, such as
the controls of an ongoing call.

* **Size:** 420 × 74px. It can't be resized, by the user or by the app.
* **Look:** no frame and no title bar: the app draws all of it. The user moves it by dragging.
* **Place:** near the top-right corner of the main screen, 38px from the right edge and 60px from the top.
* **Opened by** an app in the primary area, with the `floating-window` capability. That app launches and closes
  it, and the two apps can send each other messages.
* **Desktop only.** In a browser or the installed web app, the request does nothing and no error is returned.
  Check `engineType` and offer the same controls another way.

Design a floating window as a single row at exactly 420 × 74px: there's no room for a header, scrolling or
wrapping text. Give it a clear way back to the full app, since it has no window controls.

## Links from other programs

The desktop app can open links from other programs, such as a phone number clicked in a web page or a CRM:

* **Phone links** (`tel:`, `td+tel:` and `tel+atlas:`) go to the app that handles phone links, usually to start
  a call.
* **Workspace links** (`td+workspace:/<name>?<parameters>`) go to the app that handles `<name>`. An app handles
  one by registering a `system:<name>` protocol. See [Protocols](/workspace/app-requests/#protocols).

Workspace brings its window to the front and passes the link to the app.

## Links and sign-in

* **Links that would open a new tab** open in the user's default browser instead, apart from a few services
  that need to stay signed in.
* **Signing in with Talkdesk ID** happens in the default browser. While it does, the desktop app shows an "Action required" page
  asking the user to authorize it there.

## Closing and quitting

* **Closing the window on macOS** hides it. Workspace keeps running until the user quits.
* **Closing the window on Windows** quits, unless the account has **minimize to tray** turned on: then it
  minimizes. Minimize to tray is off by default. With it on, a Talkdesk icon in the notification area has
  "Show Window" and "Quit".
* **Quitting** asks first: "Quit Talkdesk app?", "You'll lose any unsaved changes", with Cancel and Quit.

Quitting doesn't wait for apps. If your app holds work the user hasn't saved, save it as a draft as they go.

## Updates

The desktop app downloads updates in the background. When one is ready, Workspace:

* shows an operating system notification, "Update available!", with the new and current versions;
* adds an update entry to the top of the [notification center](/workspace/messages/#notification-center)
  (**behind a feature flag**).

Clicking either opens a dialog, "Update available", with **Not now**, **See release notes** and **Update**.
Update restarts the app on the new version. If a release has to be withdrawn, the same dialog asks the user to
revert to the previous version instead.

## Starting up and going offline

* **While it starts,** a small 240 × 320px window shows that Workspace is loading.
* **With no connection,** a 424 × 540px window says "No internet connection" and asks the user to check it.
* **If Workspace can't load,** the app tries three times, 10 seconds apart, then shows "Error Launching
  Application".

## In a prototype

Pick "Desktop 424 × 540" in the [stand-in shell](/get-started/build-with-ai/#in-a-stand-in-shell)'s bar to see the app at the desktop app's size. The
shell doesn't draw floating windows; if the prototype needs one, show it as a 420 × 74px frame above the
rest.

## Open questions

Differences between the code and the Workspace design guidance, for the Workspace team to settle. Until they do,
follow the code.

* **First size.** The guidance says the desktop app first opens at 424 × 640px. The code opens it at
  424 × 540px, its minimum.
* **Dock width.** The desktop app's code defines a 54px dock width, matching the App Shell Figma component, but
  doesn't use it. Workspace draws the dock at 58px.
* **Where users set "always on top".** Workspace applies and remembers the preference, but no control for it was
  found in Workspace's own screens.
* **Floating windows outside the desktop app.** The request silently does nothing in a browser. Whether it
  should return an error, or fall back to something else, isn't documented.
* **Untranslated text.** The quit and update dialogs, the tray menu, and the loading, offline and launch error
  windows are in English only.
