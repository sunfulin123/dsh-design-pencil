# Secondary area

## Guidance

The secondary area is a second app that Workspace shows beside the current one, on the right of the window,
so the user can keep complementary information in view while working, for example Copilot next to a
conversation. Workspace draws its header and decides when it fits; the app inside it draws only its own
content. This page describes how it opens, what its header holds, how wide it is, and what an app can do
with it.

:::note
Checked against the Workspace source code in October 2026. Where the code and the Workspace design guidance
disagree, this page follows the code and lists the difference under [Open questions](#open-questions).
:::

![Workspace during a call: the Conversations app in the primary area, and an agent assistance app in the secondary area on the right, outlined, with its header and a knowledge suggestion.](/assets/workspace/secondary-area/overview.png)
*The secondary area beside the primary area, from the Workspace design guidance*

## Opening and closing

* **The toggle** is the secondary area button at the right of the [title bar](/workspace/title-bar/). It shows
  only when the user has at least one app for the secondary area.
* **Close** with the same toggle, or the close button in the secondary area's header.
* **Following a link** to an app that belongs in the secondary area opens it too.
* **Alt+S** opens or closes it, where Workspace's keyboard shortcuts are on (**behind a feature flag**).
* **Default:** open, when it fits. It needs a window at least 778px wide (see [Width](#width)).
* **Remembered:** whether it's open and which app it shows, in that browser.

## Header

Workspace draws the header; the app can't change it. From left to right:

* **The app's icon** (24px) and **name**.
* **App switcher:** a 32px button that lists the other secondary area apps, in the order of the Workspace
  configuration. It shows only when the user has more than one.
* **AI tag:** an "AI Powered" tag, with the tooltip "AI Content should always be reviewed", when the app is
  marked as AI-powered in the Workspace configuration. It's Cobalt Marketplace's
  [AI Disclaimer](/components/marketplace/ai-disclaimer/).
* **Close button**, on the right.

![The secondary area's header with the app switcher open: a menu titled App Center listing Copilot, selected, then Canvas and Smart Help.](/assets/workspace/secondary-area/app-selection.png)
*The app switcher*

### Which app it shows

When the secondary area opens, it shows the app the user last had open in it. If there isn't one, it shows
the first app in the configuration. Switching apps keeps the previous one loaded, so it's where the user left
it when they switch back.

## Width

* **400px by default**, with a 2px border on its left.
* **It fits** only when the window leaves room for the dock, the secondary area at its 360px minimum and
  Workspace's 360px minimum for the main app: at least 778px wide. With the drawer open as well, at least
  990px. Without resizing (below), the secondary area is 400px, so in a window between 778px and 817px wide
  the main app gets less than 360px.
* **When both the drawer and the secondary area want to show** and there's room for only one, the one the
  user opened most recently wins.
* **When the user opens it and there isn't room**, the desktop app and the installed web app make the window
  wider. In a browser tab, Workspace shows a toast asking the user to widen the window.

![A narrow browser window showing a call, with the cursor on the secondary area toggle and a yellow toast saying: Resize window. This screen can't be displayed in the current size. Resize your window to open.](/assets/workspace/secondary-area/browser-toast.png)
*In a browser: a toast asks the user to resize*

  ![The desktop app widened to the right, with an arrow under it, so that the secondary area now shows next to the call.](/assets/workspace/secondary-area/desktop-resize.png)
*In the desktop app: the window widens*

* **Resizing** is **behind a feature flag**. With it on, the user drags the border between the two areas,
  from 360px up to half of the space, and Workspace remembers the size. With it off, the width stays at
  400px.
* **When the window narrows,** the guidance says the secondary area keeps the size the user chose until it
  would be wider than the primary area. Then it gets narrower, and closes when there's no room left.

## Building an app for the secondary area

* **Design for 360px to 400px wide.** The secondary area is narrow even on a large screen. Cobalt's
  ViewportProvider measures the app's own frame, so it reports a small viewport there.
* **Don't draw a header with the app's name or a close button.** Workspace already shows both.
* **Add your own padding.** The guidance leaves the padding of the content area to each app; its example
  uses 12px on each side.

![A live monitoring card inside the secondary area, with 12px marked between the card and each side of the area.](/assets/workspace/secondary-area/specs.png)
*12px side padding in the guidance's example*

* **An app can close the secondary area** through the SDK, for example when its task is done. It can't open
  it, switch to another app or change its width.
* **Which apps appear here**, their order, icon and AI tag are set in the Workspace configuration, not in the
  app's code.

## Accessibility

* **The app switcher** is named "Switch secondary app, … selected", opens a menu, and can be opened with the
  Up and Down keys.
* **Two labels are always in English:** the app switcher's name and the close button's ("Close") aren't
  translated.

## In Figma

The Workspace guidance points to the Secondary area base component in the Workspace Library.

## Open questions

Differences between the code and the Workspace design guidance, for the Workspace team to settle. Until they
do, follow the code.

* **When it fits.** The guidance says from 786px. The code needs 778px (360px app + 58px dock + 360px secondary
  area).
* **App switcher order.** The guidance says apps are listed alphabetically. The code uses the configuration's
  order.
* **Copilot first.** The guidance says Copilot opens first by default. The code has no such rule: it opens the
  last app used, or else the first in the configuration.
* **Unsupported apps.** The guidance says the secondary area closes when the user switches to an app that
  doesn't support the current width. The code has no such behaviour.
* **Long app names.** The guidance asks for a long name in the header to be cut, with the full name in a
  tooltip. This wasn't checked in the code.
* **Untranslated labels.** The app switcher's and close button's names are hard-coded in English.
* **Main app narrower than 360px.** Workspace decides whether the secondary area fits using its 360px
  minimum, but without resizing it's drawn at 400px. In a window between 778px and 817px wide, the main app
  gets 320px to 359px.
