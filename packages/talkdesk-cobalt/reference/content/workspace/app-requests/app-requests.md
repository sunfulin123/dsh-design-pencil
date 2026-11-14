# What an app can ask Workspace for

## Guidance

An app runs in its own iframe and can't draw anything outside it. For everything around it, such as a toast, a
badge on its dock button or a panel over its content, it asks Workspace through the Workspace SDK, and Workspace
draws it. This page lists what an app can ask for, what each request looks like on screen, and what an app
can't ask for.

:::note
Checked against the Workspace source code in October 2026. Where the code and the Workspace documentation
disagree, this page follows the code and lists the difference under [Open questions](#open-questions).
:::

## How requests work

* **Each request needs a capability.** An app lists its capabilities in its Workspace configuration. A call
  for a capability the app doesn't have fails.
* **Some requests need an SDK plugin.** The core `@atlas/sdk` covers toasts, badges, navigation, theme and
  language. Banners, notifications, panels and the secondary area each come in their own package, added with
  `Atlas.with()` before connecting.
* **Every call is asynchronous.** It's a message to Workspace, answered when Workspace has done it.

```js
import Atlas from "@atlas/sdk";
import Messages from "@atlas/sdk-plugin-messages";

Atlas.with(Messages);
await Atlas.connect();
```

## What an app can ask for

| Request                                                    | Capability                                        | Details                                                                             |
| ---------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Show a toast                                               | `toast`                                           | [Messages](/workspace/messages/#toasts)                                             |
| Show a banner                                              | `@atlas/messages`                                 | [Messages](/workspace/messages/#banners)                                            |
| Show an operating system notification                      | `@atlas/notification`                             | [Messages](/workspace/messages/#operating-system-notifications)                     |
| Show or hide the "•" badge on its dock button              | `badge`                                           | [Badge](#badge)                                                                     |
| Open a panel or modal holding other apps                   | `@atlas/panels`, `@atlas/menus`, `@atlas/context` | [Panels and modals](#panels-and-modals)                                             |
| Close the secondary area                                   | `@atlas/secondary-area`                           | [Secondary area](/workspace/secondary-area/#building-an-app-for-the-secondary-area) |
| Keep Workspace's address and drawer in step with its pages | `navigation`                                      | [Navigation](#navigation)                                                           |
| Replace its content with Workspace's error screen          | None                                              | [Error screen](#error-screen)                                                       |
| Run in the background and come to the front when needed    | `background`                                      | [Background apps](#background-apps)                                                 |
| Ask another app to do something, or be asked               | `protocol`                                        | [Protocols](#protocols)                                                             |
| Add keyboard shortcuts                                     | `@atlas/shortcuts`                                | [Shortcuts](#shortcuts)                                                             |
| Get the theme and the user's language                      | None                                              | [Overview](/workspace/overview/#theme)                                              |
| Use browser features blocked in the iframe                 | One per feature                                   | [Browser features](#browser-features)                                               |

Other capabilities give an app data or services, such as access tokens, feature flags, storage or logging.
They don't change what the user sees around the app, so they aren't covered here.

## Badge

`Atlas.badge.set(true)` shows a red "•" on the app's dock button; `set(false)` hides it. It shows even while the
app is open. When the app has more than one dock entry, a `path` option picks which one. Use it for something
ongoing that the user should come back to, such as a conversation waiting for an answer.

The "!" badge for an app that failed to load is set by Workspace, not by the app. See
[Dock and drawer](/workspace/dock-and-drawer/#badges).

## Panels and modals

An app can ask Workspace to open a panel or a modal holding one or more other apps, for example a side panel
with details for the record the user is looking at.

* **Where:** over the app that opened it, inside the primary area. It doesn't cover the dock, the drawer or the
  secondary area. Apps in the secondary area can't open one.
* **Panel:** a Cobalt [Panel](/components/core/panel/) on the right, sized for the app's viewport.
* **Modal:** a Cobalt [Modal](/components/core/modal/), sized for the app's viewport, over a backdrop that covers
  only the app's area.
* **Header:** the title the app gives (cut to one line, with the full title in a tooltip), a close button, and
  tabs when it holds more than one app. Built with Cobalt Marketplace [Header](/components/marketplace/header/).
* **Content:** each tab is another app in its own iframe. Which apps it holds is set in a menu definition, the
  same kind that describes dock and drawer entries. The app that opened it passes data to them through a shared
  context.

The app that opened it can show and hide it and is told when its state changes. The user closes it with the
close button.

Use a Workspace panel when its content is another app. For your app's own content, use Cobalt's Panel or Modal
inside your app.

## Navigation

With the `navigation` capability, Workspace and the app keep each other informed about the current page:

* **When the app changes page,** it tells Workspace the new path. Workspace updates the browser's address and
  history, and highlights the matching page in the drawer. Only the app on screen can do this.
* **When the user moves through Workspace,** with the drawer, a link, or the browser's back and forward buttons,
  Workspace tells the app the path to show.

Without it, the drawer and the browser's address don't follow the app's pages.

## Error screen

`Atlas.lifecycle.showError()` replaces the app's content with Workspace's full-area error screen. It accepts
two types:

| Type           | Title           | Message                                                                                    |
| -------------- | --------------- | ------------------------------------------------------------------------------------------ |
| `UNAUTHORIZED` | Restricted area | The user doesn't have permission and should ask their administrator.                       |
| `NOT_FOUND`    | Page not found  | The page may have moved or doesn't exist; check the address and that the app is installed. |

Any other type is rejected. Workspace shows the same screen when it can't find a page itself. Use it for a whole
page the user can't see; for a part of a page, show the problem inside your app.

## Background apps

An app with the `background` capability starts when Workspace starts, before the user opens it, and keeps
running out of sight. If its configuration allows it, the app can bring itself to the front, for example for an
incoming call, and later return the user to where they were. It can only return them if they haven't moved on
to another app in the meantime.

## Protocols

A protocol is a named action one app offers and others can ask for, such as "open this contact". An app
declares the protocols it handles in its configuration; another app checks that one is available and triggers
it with parameters. Workspace brings the handling app to the front and passes the parameters on. An app can
trigger a protocol only while it's on screen. Toast buttons and notification links use protocols too.

An app can also handle system links, such as `tel:`, the same way.

## Shortcuts

An app declares its shortcuts in its configuration, each with keys, a name and a scope, and then binds a handler
to each one. Workspace lists them, translated, in its shortcuts list.

* **App scope:** the shortcut works while the app is in focus.
* **Global scope:** it works anywhere in Workspace.

Like all Workspace shortcuts, app shortcuts work only while shortcuts are on: they're **behind a feature
flag**, and users can turn them off. The SDK tells the app whether they're on, so it can hide shortcut hints
when they aren't.

## Browser features

The app's iframe blocks some browser features unless the app has the matching capability:

| Feature                                                 | Capability   |
| ------------------------------------------------------- | ------------ |
| Submitting a `<form>`                                   | `form`       |
| Opening a popup, new tab or window                      | `popup`      |
| `alert`, `confirm`, `prompt` and `print`                | `modal`      |
| Starting a download                                     | `download`   |
| Going full screen                                       | `fullscreen` |
| Writing to the clipboard                                | `clipboard`  |
| Microphone and speaker, and playing media automatically | `audio`      |
| Camera                                                  | `video`      |
| Security keys and passkeys                              | `webauthn`   |

`alert` and `confirm` draw the browser's own dialog, not Cobalt's. Prefer a Cobalt Modal inside the app.

## What an app can't ask for

* **Opening the secondary area,** or choosing which app it shows. Only the user opens it.
* **Opening, closing or resizing** the drawer, the secondary area or the dock, or making the window bigger.
* **Changing the title bar** or the dock and drawer entries at runtime. Entries come from configuration.
* **Knowing the window's size** or what's open around it. The app sees only its own iframe's width.
* **Adding to the notification center.** See [Messages](/workspace/messages/#notification-center).
* **Drawing outside its iframe.** Cobalt modals, panels, menus and tooltips the app opens itself stay inside
  its own area.

## In a prototype

A prototype runs outside Workspace, so these calls have nowhere to go. The stand-in shell accepts the same
requests and draws what Workspace would: see [Build with AI › In a stand-in shell](/get-started/build-with-ai/#in-a-stand-in-shell), where you can try
them.

## Open questions

Differences between the code and the Workspace documentation, for the Workspace team to settle. Until they do,
follow the code.

* **Minimum viewport.** The SDK documentation describes a `viewport` capability that sets an app's minimum
  viewport, with a warning screen asking the user to resize the window when the app is narrower. The code
  stores the setting, but nothing reads it: no warning screen is shown.
* **Shortcut configuration.** The SDK documentation lists shortcuts as keys and descriptions and says they should
  start with Meta+Shift and are checked against common shortcuts. The code expects a list with an id, keys, a
  name and a scope, and no such check was found.
* **Workspace modals don't trap focus.** Keyboard focus can leave a Workspace modal while it's open.
* **Untranslated label.** The panel and modal close button's "Close" is hard-coded in English.
* **Panels from the secondary area.** Only apps in the primary area can open a Workspace panel or modal.
  Whether apps in the secondary area should isn't documented.
