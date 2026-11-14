// Light and dark the way Workspace does them (atlas plugins/theme and the SDK's theme namespace): every page
// loads Cobalt's theme stylesheet from Talkdesk's CDN, which holds both colour schemes, and
// `data-co-colorscheme` on its <html> picks one. The stylesheet on npm (@talkdesk/cobalt-theme-base 2.5.0) has
// light colours only; this is the file Workspace adds to apps (theme-light 4.1.6, the version in Cobalt's
// source and the newest on the CDN, which allows cross-origin requests).

export const THEME_STYLESHEET_URL = "https://prd-cdn-talkdesk.talkdesk.com/cobalt/theme-light/4.1.6/styles.css";

/** The user's choice in the profile menu's Theme submenu. */
export type ThemeMode = "light" | "dark" | "system";
/** What a page shows: "system" resolves to the operating system's scheme. */
export type ColorScheme = "light" | "dark";

const STYLESHEET_ID = "atlas-theme";
const ATTRIBUTE = "data-co-colorscheme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Adds the theme stylesheet to this page once, after the npm one, so its colours win. */
export function loadThemeStylesheet(): void {
  if (document.getElementById(STYLESHEET_ID)) return;
  const link = document.createElement("link");
  link.id = STYLESHEET_ID;
  link.rel = "stylesheet";
  link.href = THEME_STYLESHEET_URL;
  document.head.appendChild(link);
}

export function setColorScheme(scheme: ColorScheme): void {
  document.documentElement.setAttribute(ATTRIBUTE, scheme);
}

export function systemScheme(): ColorScheme {
  return typeof window.matchMedia === "function" && window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/** Calls `listener` when the operating system switches between light and dark. Returns an unsubscribe function. */
export function onSystemSchemeChange(listener: (scheme: ColorScheme) => void): () => void {
  if (typeof window.matchMedia !== "function") return () => undefined;
  const query = window.matchMedia(DARK_QUERY);
  const sync = (event: MediaQueryListEvent) => listener(event.matches ? "dark" : "light");
  query.addEventListener("change", sync);
  return () => query.removeEventListener("change", sync);
}

/**
 * ThemeProvider's loader. Returning no theme object makes ThemeProvider set no colours on its own <div>, so the
 * stylesheet's scheme shows through, as in Workspace with its theme stylesheet on. A theme object here would
 * keep the page light whatever the attribute says.
 */
export const stylesheetTheme = (): Promise<null> => Promise.resolve(null);
