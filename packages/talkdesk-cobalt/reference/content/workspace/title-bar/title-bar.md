# Title bar

> The local scaffold follows Atlas redesign `deb486689` at revision `7014efc11`. Historical images below predate its shared light/dark chrome. The production redesign has no separate UI feature flag; existing flags control individual features.

## Guidance

The title bar is the 44px bar Workspace draws across the top of the window. It holds the controls that apply
to every app: search, the user's status, notifications, the profile menu and the secondary area toggle. Apps
don't draw it and can't add buttons to it. This page describes what's in it, when each part shows, and how
it changes between the browser and the desktop app.

:::note
Checked against the Workspace source code in October 2026. Where the code and the Workspace design guidance
disagree, this page follows the code and lists the difference under [Open questions](#open-questions).
:::

![The desktop app on Windows with its title bar outlined: the purple bar across the top holds the user's status, the profile avatar, the secondary area toggle and the window controls, above an app's activity list.](/assets/workspace/title-bar/overview.png)
*The title bar, from the Workspace design guidance*

## Layout

The order of its parts is fixed. From left to right:

| Part                                  | When it shows                                                                                           | Size and look                                                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Talkdesk logo                         | In the browser and the installed web app.                                                               | 28 × 28px, using the scheme-appropriate brand mark. An account with its own branding shows its own logo.                                                                   |
| Space for the macOS window controls   | In the desktop app on macOS.                                                                            | 70px                                                                                                                                     |
| Search                                | On by default.                                                                                          | A 360px field. In a small window (up to 640px wide), a search button instead. See [Search and notifications](#search-and-notifications). |
| Empty space                           | Always. It fills the rest of the bar.                                                                   | On the desktop app, the user drags the window from here.                                                                                 |
| Virtual desktop status                | When the account uses virtual desktops (VDI), and the window is wider than 640px.                       | An icon with a tooltip.                                                                                                                  |
| Network status                        | When the connection changes. It stays while the user is offline, and shows "back online" for 3 seconds. | Text and a Wi-Fi icon. In a small window, the icon only.                                                                                 |
| Call quality                          | When the calling app reports call quality.                                                              | An icon, with the call's statistics on hover.                                                                                            |
| User status                           | When an app turns it on, such as Conversations.                                                         | A 32px-tall secondary pill, with the status, its colour and a timer.                                                         |
| Notifications                         | **Behind a feature flag.**                                                                              | A 32px round button with the unread count. See [Search and notifications](#search-and-notifications).                                    |
| Profile menu                          | Always.                                                                                                 | A 32 × 32px avatar control.                                                                                             |
| Secondary area toggle                 | When the user has at least one app for the secondary area.                                              | A 32 × 32px round button. Primary fill while the secondary area is open.                                                         |
| Space for the Windows window controls | In the desktop app on Windows.                                                                          | 108px                                                                                                                                    |

Production Atlas sets a 414px minimum. The owned web prototype deliberately supports 360/390px through its compact search layout.

### Colour

* **Background:** shared Workspace chrome token, Primary 3 in light and Primary 2 in dark.
* **Control styling:** the pinned Atlas TitleBarButton delegates its colors, alpha fills, hover, expanded and focus states to Cobalt Button. Do not replace its alpha tokens with solid secondary ramp colors.
* **Text and icons:** the default text token; expanded/selected controls use primary fill and primary contrast text.
* **Focus:** a 2px ring in the focus colour (`--border-focus-color`).

### Search and notifications

* **Search field:** a small filled secondary Cobalt Button: 32px tall, 12px medium-weight text, with the theme's alpha background and hover tokens, with a
  search icon, the text "Search apps, actions and more..." in the default text colour, and the shortcut
  (⌘K, or Ctrl+Shift+F) at its end. The text isn't a placeholder: the field is a button that opens search.
* **Notifications button:** a 28px circle with the bell icon. Primary 11 on hover; while the notification center
  is open, the button is in the default text colour and the icon in Primary 9.
* **Unread count:** a tiny red Cobalt [Tag](/components/core/tag/) at the button's top right, with the number
  of unread notifications, up to "99+". It shows "!" when notifications fail to load.

## The profile menu

Opened from the avatar. In order:

* **Appearance:** light, dark or system (**behind a feature flag**).
* **Keyboard shortcuts** (**behind a feature flag**), and the session recorder where the account has it.
* **Items from the Workspace configuration**, such as settings and external links. Some open a submenu. An
  "About" item shows the Workspace version.
* **Sign out.**

## Browser, installed web app and desktop app

* **Browser:** the Talkdesk logo is on the left.
* **Installed web app:** the same as the browser. When the operating system puts its own window controls in
  the title bar's space, the logo is hidden.
* **Desktop app on macOS:** the window controls are on the left, where the logo would be.
* **Desktop app on Windows:** the window controls are on the right, after the secondary area toggle. They take
  the title bar's colour, with white symbols.
* **Moving and resizing the desktop window:** drag the empty part of the bar to move the window. Double-click
  the bar's background, not a button, to maximise or restore it. Dragging pauses while a title bar menu or
  search is open.
* **Desktop sign-in screen:** the sign-in page gets a plain bar instead, transparent on macOS and white on
  Windows. It can be dragged and double-clicked the same way.

### In the design guidance

The guidance shows the title bar for each platform at three window sizes: large (1440px), medium (860px) and
small (424px). Its parts differ from the code's; see [Open questions](#open-questions).

![Browser title bar in a large window: the Talkdesk logo and the notifications bell with 8 unread on the left; the Available status pill with a timer, the profile avatar and the secondary area toggle on the right.](/assets/workspace/title-bar/web-large.png)
*Browser, large*

![The same browser title bar in a medium window, with the status pill, avatar and secondary area toggle closer to the logo.](/assets/workspace/title-bar/web-medium.png)
*Browser, medium*

![The same browser title bar in a small window, 424px wide.](/assets/workspace/title-bar/web-small.png)
*Browser, small*

![macOS desktop title bar in a large window: the red, yellow and green window controls and the notifications bell on the left; the status pill, avatar and secondary area toggle on the right.](/assets/workspace/title-bar/macos-large.png)
*macOS, large*

![The same macOS title bar in a medium window.](/assets/workspace/title-bar/macos-medium.png)
*macOS, medium*

![The same macOS title bar in a small window, 424px wide.](/assets/workspace/title-bar/macos-small.png)
*macOS, small*

![Windows desktop title bar in a large window: the notifications bell on the left; the status pill, avatar, secondary area toggle and the minimise, maximise and close controls on the right.](/assets/workspace/title-bar/windows-large.png)
*Windows, large*

![The same Windows title bar in a medium window.](/assets/workspace/title-bar/windows-medium.png)
*Windows, medium*

![The same Windows title bar in a small window, 424px wide.](/assets/workspace/title-bar/windows-small.png)
*Windows, small*

![The desktop sign-in page on macOS: no visible title bar, only the window controls over the page, with the Talkdesk logo and an Account field on the left and a purple panel with three dots on the right.](/assets/workspace/title-bar/sign-in-macos.png)
*Sign-in on macOS: transparent bar*

  ![The desktop sign-in page on Windows: a white bar with the minimise, maximise and close controls above the same sign-in page.](/assets/workspace/title-bar/sign-in-windows.png)
*Sign-in on Windows: white bar*

## Keyboard

Workspace's keyboard shortcuts are **behind a feature flag**, and users can turn them off in their
preferences.

| Key                                 | Action                           |
| ----------------------------------- | -------------------------------- |
| ⌘K on macOS, Ctrl+Shift+F elsewhere | Open search                      |
| Alt+S                               | Open or close the secondary area |
| Meta+/ (⌘/ on macOS)                | List the keyboard shortcuts      |

Before the title bar, a "Skip navigation" link appears when the user presses Tab. It jumps to the main
content.

## Accessibility

* **Every button has a name:** "Current status: …" for the status pill, "Profile menu", "Secondary area"
  (which also says whether the secondary area is expanded), and the notification button's name includes the
  unread count.
* **Network changes are announced** to screen readers when the user goes offline or comes back online.
* **The status pill and the profile menu** open menus that the user can move through with the arrow keys.

## What apps can change

Apps can't add to the title bar, but some of its parts depend on them or on Workspace configuration:

* **User status** appears when an app with access to agent status turns it on.
* **The profile menu's items** come from the Workspace configuration, not from apps.
* **The secondary area toggle** appears when apps for the secondary area are set up for the user.
* **Call quality** comes from the app handling the call.

## In Figma

The Workspace guidance points to the Workspace Library in Figma: the Title Bar base component, and its parts
under Title bar. The screenshot below is the shell as used in the [Users app Figma](https://www.figma.com/design/xx5MASNpf0DrwR9kWHHjBD/Users-app?node-id=176-107207). Where the designs
differ from the code, the difference is listed under [Open questions](#open-questions).

![The shell around an app's content: purple title bar with the Talkdesk logo, search, the status pill, more options and the secondary area toggle; the dock with Admin as the current app; the drawer hidden to its 16px strip with the open-navigation button](/assets/recipes/app-shell.jpg)

## Open questions

Differences between the code and the Workspace design guidance, for the Workspace team to settle. Until they
do, follow the code.

* **Minimum width.** The guidance says 424px. The code sets 414px.
* **Parts the guidance leaves out.** The guidance lists notifications, user status, the profile and the
  secondary area toggle. The code also has search, network status, call quality and virtual desktop status,
  and puts the user status before notifications.
* **Where notifications sit.** The guidance's images put the notifications button on the left, next to the
  logo or the macOS window controls, and show no search. The code puts search on the left and notifications on
  the right, after the user status.
* **Status pill colour.** The App Shell Figma component uses Primary 11. The code uses translucent white over
  the title bar.
* **"More options."** The App Shell Figma component shows a "more options" button. In the code, that place holds the
  profile menu.
* **Search and the notifications flag.** Search is hidden only when the notifications feature flag is
  explicitly off, so the two are tied together. This looks unintended.
