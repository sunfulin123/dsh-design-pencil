# Dock and drawer

> This maintained page follows Atlas redesign `deb486689`. Imported screenshots retain earlier shell appearances; the generated prototype owns its updated geometry.

## Guidance

The dock is the rail of app icons Workspace draws down the left of the window, and the drawer is the panel
next to it that lists the current app's sections. Together they are Workspace's two levels of navigation.
Apps don't draw either one: both come from the Workspace menu configuration. This page describes how they
look, how they behave at different widths, and what an app can change.

:::note
Checked against the Workspace source code in October 2026. Where the code and the Workspace design guidance
disagree, this page follows the code and lists the difference under [Open questions](#open-questions).
:::

![Workspace with the dock and the drawer outlined on the left: the dock's app icons, then the drawer with the app's name and its pages, next to an app's content.](/assets/workspace/dock/navigation-levels.png)
*The dock (first level) and the drawer (second level), from the Workspace design guidance*

## Dock

The first level of navigation: one button per app.

* **Size:** 48px wide, without a rail border on its right. Background follows the shared light/dark chrome; the application frame owns the Secondary 4 border
  (`--secondary-4`).
* **App buttons:** 32 × 32px circles, 4px apart, with a 20px icon in Gray 11 (`--gray-11`). The hovered button
  turns Gray 4 (`--gray-4`). The current app's button is Primary 9 (`--primary-9`) with its icon in the primary
  contrast colour: the whole button fills, with no separate marker.
* **Spacing:** 8px of padding around the buttons. Dividers are 2px lines in Gray 4 (`--gray-4`), with 8px
  above and below.
* **Name:** each button shows the app's name in a tooltip and uses it as its accessible name.
* **Order:** Home always comes first and Admin always comes last. The apps in between are ordered in the
  Workspace configuration.
* **More apps:** when the window is too short for every button, the ones that don't fit move into a "More
  apps" menu at the bottom of the list.
* **Under the apps:** a divider, then the AppConnect launcher (**behind a feature flag**).

![The dock at three window heights: tall in a large window, shorter in a medium one and shortest in a small one, always with the same app buttons and the launcher at the bottom.](/assets/workspace/dock/height.png)
*The dock fits the window's height*

  ![A dock with too many apps for the window: the last button is a More options button that opens a menu with the remaining apps, Explore and Admin.](/assets/workspace/dock/overflow.png)
*Apps that don't fit move into a menu*

### Badges

A small red badge on an app's button tells the user something about an app they aren't looking at:

* **"•" (ongoing activity):** the app turned it on through the SDK. It shows even while the app is open.
* **"!" (error):** the app failed to load. It shows only while the user is in another app.

Both are a tiny red Cobalt [Tag](/components/core/tag/) at the top right of the icon.

![The design guidance's set of app status badges, each a small icon on the app's dock button: speaking, ringing, dialing, on hold, wrap-up, chatting, a red dot, and a red exclamation mark for a failure.](/assets/workspace/dock/app-status.png)
*App statuses in the design guidance*
The code has only the dot and the exclamation mark. See Open questions.

### Expanded dock

**Behind a feature flag.** An expand button at the top of the dock widens it to 240px and shows each app's
name next to its icon. The expanded dock scrolls instead of using "More apps", and it isn't available in a
small window (up to 640px wide). Its width animates over 300ms; the names appear as soon as it starts widening
and disappear as soon as it starts narrowing, and badges hide while it moves.

## Drawer

The second level of navigation: the current app's sections. An app whose dock entry has no sections gets no
drawer at all.

The guidance gives it one job: use it when an app has more than one level of navigation, to link to the app's
pages. Don't use it to run actions or create content, or as a tab bar or a context menu; put those in the
app's own content. The code also allows an action block, listed under [Open questions](#open-questions).

![Workspace with the Admin app's drawer open on the left, listing its sections and pages, the main area in the middle and the secondary area on the right.](/assets/workspace/drawer/overview.png)
*The drawer open beside an app*

### What's in it

From top to bottom:

* **The app's name**, as a level 4 heading, with 24px above and below it and 20px at the sides.
* **Pages:** items that open a page of the app, in medium-weight text that ends with an ellipsis when it's too
  long. Each has 8px of padding, and the list has 12px at the sides and 4px at the top and bottom. The current
  page is highlighted.
* **Groups:** a title that isn't clickable, with pages under it. The title is uppercase, medium weight, in the
  description colour (`--text-description`), with 8px at the sides and 4px above and below. Each group after
  the first has 12px more space above it.
* **Actions:** a block of buttons between two dividers, each with an icon and a label. An action runs
  something in the app instead of opening a page.

![The Admin drawer with three numbered callouts: 1 the app's name at the top, 2 the list of sections and pages, 3 the collapse button at the top right.](/assets/workspace/drawer/anatomy.png)
*Anatomy: 1 app name, 2 content, 3 collapse and expand button*

The background is Gray 2 (`--gray-2`). Items are Secondary 12 (`--secondary-12`); the hovered item is on
Secondary 4 (`--secondary-4`), and the current one on Secondary 3 (`--secondary-3`) with its text in Primary 11
(`--primary-11`).

### Open, closed and hover

* **Open:** 212px wide, beside the app. The app's area gets narrower to make room.
* **Closed:** a 16px strip with a round toggle button on its edge.
* **Hover:** resting the pointer on the closed strip for 200ms opens the drawer over the app, without moving
  it. It closes when the pointer leaves the dock and drawer.
* **The toggle button** opens the drawer and keeps it open. While the drawer is open over the app after a
  hover, the button pins it beside the app instead. Clicking it again closes the drawer.
* **Default:** open beside the app, when there's room for it (see [Space](#space)). Workspace remembers the
  user's choice in that browser.
* **The toggle button's look:** a 24px circle in Gray 2 (`--gray-2`) with a 1px Gray 5 (`--gray-5`) border and
  a 16px icon in Secondary 12 (`--secondary-12`), 8px from the top and centred on the drawer's right edge. It
  shows `menu` while the drawer is closed and `last_page` while it's open, turned around once it's pinned.
* **Animation:** opening and closing take 300ms (ease), or happen instantly when the user prefers reduced
  motion. Only the width animates: the contents keep their 212px and are uncovered as the drawer widens, not
  squeezed. Open over the app, the drawer has no shadow, only the 1px line in Secondary 6 (`--secondary-6`)
  that it always has on its right edge.

![Three drawer states side by side: open and fixed beside the dock; closed to a thin strip with its button; and, after the pointer moves onto the strip, open over the content.](/assets/workspace/drawer/states.png)
*Fixed, hidden and hover*

The guidance adds two rules for clicks: in a drawer opened by hover, clicking a page goes to it and closes the
drawer; in a fixed drawer, the drawer stays open.

### Small windows

In a small window (up to 640px wide), the strip is 10px and there's no toggle button. The drawer opens only on
hover, over the app.

![Two small Workspace windows: in the first the pointer rests on the drawer's strip; in the second the Admin drawer has opened over the content.](/assets/workspace/drawer/small-window-hover.png)
*In a small window, the drawer opens only on hover*

### The newer drawer in the guidance

The guidance describes a drawer that the code doesn't have yet (see [Open questions](#open-questions)):

* **Sections** that the user can collapse and expand. When the section holding the current page is collapsed,
  that page stays visible and its siblings are hidden.
* **Groups, for Support Suite only:** rows that expand to show the apps of a customer's account, or act as a
  page themselves when they have no chevron.
* **An account switcher, for Support Suite only:** for support users who move between customers' accounts.

![Two drawers for a support account. In the first the Admin group is collapsed and only its selected page, Preferences, shows under it. In the second Admin is expanded, with its sections Account, Service settings and Billing.](/assets/workspace/drawer/collapsed-selection.png)
*The selected page stays visible when its group is collapsed*

  ![A Support Suite drawer headed by the account's name, with expandable groups such as Studio, Guardian and Admin, and Admin open on its Account, Service settings and Billing sections.](/assets/workspace/drawer/support-suite-groups.png)
*Support Suite groups*

## Space

The dock is always there. The drawer and the secondary area are shown only when they fit next to the 360px
Workspace keeps for the app. When there isn't room for both, the one the user opened most recently wins. The
full rules are on [Space and viewports](/workspace/space-and-viewports/).

## Keyboard

* **Tab** reaches the dock as a navigation landmark ("Applications navigation menu"). **Up** and **Down**
  move between app buttons; **Enter** or **Space** opens one.
* **Alt+1 to Alt+9** open the first nine apps in the dock (**behind a feature flag**, like all Workspace
  shortcuts).

## What apps can change

* **Their entry in the dock and drawer** is set in the Workspace menu configuration, not in the app's code:
  name, icon, sections, groups and actions. Icons must be SVGs that use `fill`, so the dock can recolour
  them.
* **Which entries a user sees** can depend on a feature flag or a permission policy, also set in the
  configuration. Entries can be hidden from the dock entirely, for apps that run in the background.
* **The "•" badge** is the one thing an app sets at runtime, through the SDK.
* **Drawer actions** are handled by the app when the user clicks one.

## In Figma

The Workspace guidance points to the Workspace Library in Figma: Dock examples, Dock › DockApps for the app
buttons, and Drawer \[New]. The screenshot below is the shell as used in the [Users app Figma](https://www.figma.com/design/xx5MASNpf0DrwR9kWHHjBD/Users-app?node-id=176-107207). Where the
designs differ from the code, the difference is listed under [Open questions](#open-questions).

![The same shell with the drawer open: Admin, then its sections (Account, People, Service settings, Routing) with Users as the current page](/assets/recipes/app-shell-drawer-open.jpg)

## Open questions

Differences between the code and the Workspace design guidance, for the Workspace team to settle. Until they
do, follow the code.

* **Dock width.** The guidance gives 64px and the App Shell Figma component 54px. The pinned Atlas redesign uses 48px.
* **App buttons.** The App Shell Figma component has 40px buttons, 4px apart. The code has 32px buttons, 4px
  apart.
* **Drawer width.** The App Shell Figma component is 216px open. The code is 212px.
* **Drawer default.** The design guidance says the drawer starts hidden. In the code it starts open beside the
  app when there's room.
* **A newer drawer.** The guidance describes a drawer with sections the user can collapse and expand, the
  selected item kept visible inside a collapsed section, and, for Support Suite only, expandable groups and an
  account switcher. The code has none of these: its groups are plain titles that can't collapse.
* **Actions in the drawer.** The guidance says the drawer is for navigation only and shouldn't trigger
  actions. The code has an actions block, and the menu configuration can fill it.
* **App statuses.** The guidance shows call and chat statuses on dock buttons (speaking, ringing, dialing, on
  hold, wrap-up, chatting). The code has only the "•" and "!" badges.
* **Who sees the AppConnect launcher.** The guidance says it shows to roles with the AppConnect launch
  permission. In the code it's behind a feature flag; a permission check wasn't confirmed.
* **The drawer toggle button has no accessible name.** It's a plain icon button, so screen readers announce
  it only as "button".
