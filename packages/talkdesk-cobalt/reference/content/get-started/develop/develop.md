# Develop

## Guidance

How to set up a React app that uses Cobalt components: what to install, what goes at the root, and how to
make sure menus, tooltips and other popups get the Cobalt theme. Each component's own install line, import
and props are on its page.

Everything here was checked against the published packages in October 2026.

## Requirements

* **React 18.** Cobalt core packages support React 16.9 to 18. Cobalt Marketplace packages declare React
  16.9 as their peer, so pnpm warns on React 18, but they work with it. No package supports React 19 yet.
* **The Talkdesk npm registry.** `@talkdesk/*` packages are published there, not on the public npm registry.
  Use the registry mapping in this bundled library's `.npmrc`. Add only the missing
  `@talkdesk:registry` setting to an existing project configuration, and connect to the VPN:
  the registry only answers there. No external documentation checkout is required.
* **Talkdesk's CDN at runtime.** Cobalt loads the Roboto font and the icon font from
  `prd-cdn-talkdesk.talkdesk.com`. If your app sets a Content Security Policy, allow that origin for styles
  and fonts.

## 1. Install the root packages

```bash
pnpm add @talkdesk/cobalt-react-theme-provider @talkdesk/cobalt-theme-base @talkdesk/cobalt-react-viewport-provider @talkdesk/cobalt-react-portal-provider
```

Then add each component you use by its own package, for example `pnpm add @talkdesk/cobalt-react-button`.
Component styles come with the package: importing a component adds its CSS to the page, so there is no
stylesheet to import per component.

Yarn 1 doesn't install peer dependencies. The only Cobalt packages that other Cobalt packages need as peers
are the three providers above, so installing them now covers every component. If a build fails with
"failed to resolve import `@talkdesk/cobalt-react-…`", a peer dependency is missing: add that package.

## 2. Add the theme stylesheet and base styles

Import the theme once, at the entry of your app, and give the page the Cobalt font and colours:

```tsx
// src/main.tsx
import "@talkdesk/cobalt-theme-base/dist/styles.css";
import "./global.css";
```

```css
/* src/global.css */
body {
  margin: 0;
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--text-default);
  background-color: var(--background-color);
}
```

Without these two, popups lose the theme. ThemeProvider sets the theme's CSS variables on its own `<div>`,
but Menu, Dropdown, Tooltip, Popover, Panel and Modal open in a layer at the end of `<body>`, outside that
`<div>`. Their text then falls back to the browser's serif font. The stylesheet defines the same variables on
the whole page, and the `body` rule gives those layers the Cobalt font.

Use `@talkdesk/cobalt-theme-base`. `@talkdesk/cobalt-theme-light` holds only the colours: on its own it
leaves out the font, size and spacing variables.

## 3. Wrap the app in the providers

```tsx
// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import ThemeProvider from "@talkdesk/cobalt-react-theme-provider";
import ViewportProvider from "@talkdesk/cobalt-react-viewport-provider";
import PortalProvider from "@talkdesk/cobalt-react-portal-provider";
import "@talkdesk/cobalt-theme-base/dist/styles.css";
import "./global.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ViewportProvider>
        <PortalProvider>
          <App />
        </PortalProvider>
      </ViewportProvider>
    </ThemeProvider>
  </React.StrictMode>
);
```

| Provider         | What it does                                                                                                                                                                               | Without it                                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ThemeProvider    | Loads the Cobalt fonts and sets the theme's variables, font and colours on a wrapping `<div>`. Renders nothing until the theme has loaded; pass `placeholder` to show something meanwhile. | Most Cobalt Marketplace packages list it as a required peer.                                                                                                                        |
| ViewportProvider | Tracks the viewport size (small up to 640px, medium up to 960px, large above) for responsive components.                                                                                   | Components that read it stop with "You must use a ViewportProvider to get a viewport": core Tooltip and the responsive-value hook; Marketplace Toolbar, Pagination and EmptyWidget. |
| PortalProvider   | Adds the container that Cobalt Marketplace popups open into. Inside ThemeProvider, they get the theme.                                                                                     | Marketplace Tooltip, StatefulPopup and Toolbar have no container to open into.                                                                                                      |

The order matters only for PortalProvider: keep it inside ThemeProvider.

Icon needs no provider of its own. The default `Icon` export loads the icon font itself; `IconsProvider` is
optional.

## Check that it works

Open any Menu or Tooltip. Its text should be in Roboto, like the rest of the page. If it is in a serif font,
the theme stylesheet or the `body` rule is missing.

## Known limits

* **Cobalt Marketplace types predate React 18.** Some components don't declare `children` in their props
  types, and some require props their examples leave out. Their component pages mark those examples
  "Doesn't compile" with the reason.
* **Cobalt's styles come after yours.** Each component adds its CSS to the end of `<head>` when it first
  loads, after your app's stylesheet in a production build. So a class of yours on a Cobalt component loses
  to Cobalt's own when both are equally specific, and a style that works in development can stop working once
  built. Make your selector more specific (for example `.my-dock .my-button`), or use a component prop or an
  inline `style`.
* **Other themes and dark mode** aren't covered here yet.
