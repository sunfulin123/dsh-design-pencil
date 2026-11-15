# Space and viewports

## Guidance

Workspace shares the window's width between the dock, the drawer, the secondary area and the current app. It
doesn't switch layouts at fixed breakpoints: it adds the drawer and the secondary area only while they fit
next to a minimum width for the app, and it decides between them by what the user opened last. This page
gives the rules, the window widths they lead to, and how much width an app ends up with.

:::note
Checked against the Workspace source code in Atlas revision 7014efc11 (November 2026). Where the code and the Workspace design guidance
disagree, this page follows the code and lists the difference under [Open questions](#open-questions).
:::

## Two kinds of viewport

* **The window:** Workspace's rules below use the width of the whole Workspace window.
* **The app's frame:** inside an app, CSS media queries and Cobalt's ViewportProvider measure the app's own
  frame, which is narrower. Cobalt's breakpoints are small up to 640px, medium from 641px to 960px and large
  from 961px.

So a large window can still give an app a small viewport. Design the app for the width it gets, not for the
window.

## How Workspace shares the width

1. **It starts from the window's width** and sets aside 422px: 360px for the app, 48px for the dock and 14px for the main-area borders and gap.
2. **It goes through the parts the user wants open**, most recently opened first: the drawer (212px), the
   secondary area (360px) and, **behind a feature flag**, the expanded dock (192px more).
3. **It shows each part while the remaining width covers it**, and stops at the first one that doesn't fit.
   The parts after it stay hidden too, even if they would have fitted.

A part the user turned on stays on. If the window gets narrower, Workspace hides it; when the window is wide
enough again, it comes back. Workspace never turns a part off for the user.

When the user turns something on, it moves to the front of the order. Before the user has chosen, the order is
the secondary area, then the drawer, then the expanded dock. Both the drawer and the secondary area are on by
default.

### What fits at each window width

| Window width    | What can show beside the app                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Up to 640px     | Neither the drawer nor the secondary area. The drawer opens only on hover, over the app.                                              |
| 641px to 781px  | The drawer, unless the secondary area is on and comes first in the order: then nothing shows (see [Open questions](#open-questions)). |
| 782px to 993px  | The drawer or the secondary area: the one the user opened last.                                                                       |
| 994px and wider | Both.                                                                                                                                 |

The expanded dock needs 192px on top of these, and is never shown up to 640px.

In practice, this means that between 782px and 993px wide, opening one of the drawer and the secondary area
hides the other, and closing it brings the other back.

### What the user sees

The guidance describes these cases. With the rules above, the code does the same, except where the last
column says otherwise.

| Case                                                      | In the guidance                                              | In the code                                                                             |
| --------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| First sign-in, large window                               | The drawer and the secondary area are open                   | Both open from 994px                                                                    |
| First sign-in, medium window                              | The secondary area is open and the drawer closed             | The same from 782px to 993px; from 641px to 781px, neither shows                        |
| First sign-in, small window                               | Both are closed; the drawer opens on hover                   | The same                                                                                |
| Moving to another app                                     | The drawer and the secondary area stay as they were          | The same; an app without sections has no drawer                                         |
| Both kept open, widening from small to large              | The secondary area opens first, then the drawer              | The one the user opened last comes first; the secondary area, if the user hasn't chosen |
| Both kept open, narrowing to medium                       | The drawer closes and the secondary area stays               | The one the user opened last stays                                                      |
| Both kept open, narrowing to small                        | Both close                                                   | The same                                                                                |
| Both kept closed, any size                                | Both stay closed                                             | The same                                                                                |
| Medium window, drawer open, user opens the secondary area | The drawer closes. Closing the secondary area brings it back | The same                                                                                |
| Medium window, secondary area open, user opens the drawer | The secondary area closes. Closing the drawer brings it back | The same                                                                                |

![Workspace with its three areas numbered by priority: 1 the main app in the middle, 2 the secondary area on the right, 3 the drawer on the left, under the heading Priority levels.](/assets/workspace/space/priorities.png)
*The guidance's fixed priority*
The code orders the drawer and the secondary area by what the user opened last. See Open questions.

### When the user opens something that doesn't fit

* **Desktop app and installed web app:** the window grows to the width needed for everything the user has
  turned on.
* **Browser:** Workspace shows a toast: "Resize window. This screen can't be displayed in the current size.
  Resize your window to open."

This happens only when the user opens something. When the window shrinks, Workspace hides parts without a
message.

Preferences are kept in the browser's storage, so they don't follow the user to another browser or computer.

## How much width an app gets

The app's width is the window's width minus:

* **48px** for the dock (240px when expanded);
* **212px** when the drawer is open beside the app, or **16px** for the drawer's closed strip (10px up to 640px)
  when the app has sections. An app without sections has no strip;
* the secondary area's width when it's open: **400px** by default, plus the **2px** resize separator when enabled;
* the main-area chrome: **13px** with a drawer strip, or **14px** without one, above 640px. At smaller widths the end/bottom gap and end border disappear, leaving a **1px** start border with a drawer or **2px** without one.

Some examples, for an app with sections:

| Window                           | Open beside the app       | App width | Cobalt viewport in the app |
| -------------------------------- | ------------------------- | --------- | -------------------------- |
| 424px, desktop app on first open | Nothing (strip only)      | 365px     | Small                      |
| 1024px                           | Drawer                    | 751px     | Medium                     |
| 1024px                           | Drawer and secondary area | 349px     | Small                      |
| 1280px                           | Drawer and secondary area | 605px     | Small                      |
| 1440px                           | Drawer and secondary area | 765px     | Medium                     |
| 1920px                           | Drawer and secondary area | 1245px    | Large                      |

**Design every app to work at 360px wide, and to stay usable a little below it.** The Workspace guidance
expects over 80% of agents to use the desktop app in a small window next to their CRM, and on many common
screens the drawer and secondary area together leave the app in its small viewport. It expects admin and
supervisor apps to be used full screen most of the time.

An app in the secondary area gets the secondary area's width, 400px by default, which is always Cobalt's
small viewport.

## Open questions

Differences between the code and the Workspace design guidance, for the Workspace team to settle. Until they
do, follow the code.

* **Priority.** The guidance gives a fixed priority: the app, then the secondary area, then the drawer. The
  code uses the order in which the user last opened them.
* **Everything open from large.** The guidance says everything can be open at a large viewport. The code needs
  a 994px window for the drawer and the secondary area together, and more for the expanded dock.
* **First sign-in.** The guidance says that in a medium viewport, the secondary area starts open and the drawer
  closed. In the code that's what the default order produces between 782px and 993px; from 994px both start
  open, and up to 781px neither shows (next point).
* **Nothing shown between 641px and 781px.** When both the secondary area and the drawer are on and the
  secondary area comes first in the order, which is the default, neither shows: the secondary area doesn't
  fit, and Workspace stops before the drawer, which would.
* **The app gets less than 360px.** Workspace checks the space with a 360px secondary area and leaves out the
  drawer's 16px strip, but draws the secondary area at 400px and the strip beside the app. So the app can end
  up at about 320px to 359px, as in the examples above.
