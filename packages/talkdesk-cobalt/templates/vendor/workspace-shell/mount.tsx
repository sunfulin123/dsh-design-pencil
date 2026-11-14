// mountPrototype(): the one call a prototype's entry makes. The same page runs
// three ways, picked by the `frame` query parameter:
//   (none)                       the stand-in shell, in the top window
//   ?frame=app                   the prototype's app, in the shell's primary iframe
//   ?frame=secondary&app=<id>    a secondary area app, in its own iframe
// Each gets the Cobalt root setup from the docs' Develop page.

import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import ThemeProvider from "@talkdesk/cobalt-react-theme-provider";
import ViewportProvider from "@talkdesk/cobalt-react-viewport-provider";
import PortalProvider from "@talkdesk/cobalt-react-portal-provider";
import { Heading, Text } from "@talkdesk/cobalt-react-typography";
import "@talkdesk/cobalt-theme-base/dist/styles.css";
import "./base.css";
import "./shell/shell.css";
import { resolveConfig, type ShellConfig } from "./config";
import { loadThemeStylesheet, setColorScheme, stylesheetTheme } from "./theme";
import { Shell } from "./shell/Shell";

export interface MountOptions {
  /** The prototype's app. It renders inside the shell's primary iframe. */
  app: ReactNode;
  /** Shell configuration. Every field is optional. */
  shell?: ShellConfig;
  /** Element or id to render into. Default: "root". */
  root?: HTMLElement | string;
}

function CobaltRoot({ children }: { children: ReactNode }) {
  return (
    <StrictMode>
      <ThemeProvider loader={stylesheetTheme}>
        <ViewportProvider>
          <PortalProvider>{children}</PortalProvider>
        </ViewportProvider>
      </ThemeProvider>
    </StrictMode>
  );
}

function SecondaryPlaceholder({ title }: { title: string }) {
  return (
    <div style={{ padding: 12, height: "100%", boxSizing: "border-box" }}>
      <div className="ws-placeholder" style={{ border: "1px dashed var(--secondary-6)", borderRadius: 8 }}>
        <Heading level={4}>{title}</Heading>
        <Text variant="description">This secondary area app isn't part of the prototype.</Text>
      </div>
    </div>
  );
}

export function mountPrototype({ app, shell, root = "root" }: MountOptions): void {
  const container = typeof root === "string" ? document.getElementById(root) : root;
  if (!container) throw new Error(`[workspace-shell] No element with id "${String(root)}" to render into.`);
  const params = new URLSearchParams(window.location.search);
  const frame = params.get("frame");
  const config = resolveConfig(shell);
  // Every page, shell and frames alike, starts light; the shell then sends each frame its scheme.
  loadThemeStylesheet();
  setColorScheme("light");

  if (frame === "app") {
    createRoot(container).render(<CobaltRoot>{app}</CobaltRoot>);
    return;
  }

  if (frame === "secondary") {
    const secondary = config.secondaryApps.find((item) => item.id === params.get("app"));
    createRoot(container).render(
      <CobaltRoot>{secondary?.content ?? <SecondaryPlaceholder title={secondary?.title ?? "Secondary app"} />}</CobaltRoot>,
    );
    return;
  }

  if (shell?.title) document.title = shell.title;
  document.body.style.overflow = "hidden";
  createRoot(container).render(
    <CobaltRoot>
      <Shell config={config} />
    </CobaltRoot>,
  );
}
