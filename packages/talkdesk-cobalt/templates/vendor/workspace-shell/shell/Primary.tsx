// The primary area: the prototype's iframe, a placeholder for other dock apps,
// Workspace's error screen (atlas canvas/components/error-component) and the
// Workspace panel or modal an app can open over its area (extensible.panels).

import { useState } from "react";
import Button from "@talkdesk/cobalt-react-button";
import Icon from "@talkdesk/cobalt-react-icon";
import { Modal } from "@talkdesk/cobalt-react-modal";
import { ModalPanel } from "@talkdesk/cobalt-react-panel";
import { Heading, Text } from "@talkdesk/cobalt-react-typography";
import type { ErrorScreenType } from "../sdk/protocol";
import { useShell } from "./context";
import type { ShellPanel } from "./state";

// i18n/resources/en-US/resource.json
const ERRORS: Record<ErrorScreenType, { code: string; title: string; message: string }> = {
  UNAUTHORIZED: {
    code: "403",
    title: "Restricted area",
    message:
      "It looks like you don’t have permission to be here. Reach out to your administrator to gain access to this page.",
  },
  NOT_FOUND: {
    code: "404",
    title: "Page not found",
    message:
      "We can’t find the page you’re looking for. It may have been moved or it doesn’t exist. Please check if the URL is correct or if the app is installed.",
  },
};

function ErrorScreen({ type }: { type: ErrorScreenType }) {
  const { layout } = useShell();
  const error = ERRORS[type];
  const size = layout.small ? "small" : layout.windowWidth > 960 ? "large" : "medium";
  const isLarge = size === "large";
  const icon = <Icon color="var(--secondary-4, var(--gray-200))" name="close_outline" className="ws-error__icon" />;
  return (
    <div className={`ws-error ws-error--${size}`} role="alert">
      <section className="ws-error__text">
        {!isLarge ? icon : null}
        <Heading color="var(--text-description, var(--gray-500))" level={5}>
          {`ERROR ${error.code}`}
        </Heading>
        <Heading level={1} className="ws-error__title">
          {error.title}
        </Heading>
        <div className="ws-error__description">
          <Heading
            level={2}
            asLevel={size === "small" ? 4 : size === "medium" ? 3 : undefined}
            textAlign={isLarge ? undefined : "center"}
            style={{ fontWeight: "var(--font-weight-regular, 400)" as unknown as number }}
          >
            {error.message}
          </Heading>
        </div>
      </section>
      {isLarge ? <section className="ws-error__icon-column">{icon}</section> : null}
    </div>
  );
}

function WorkspacePanel({ panel, container, onClose }: { panel: ShellPanel; container: Element; onClose: () => void }) {
  const [tab, setTab] = useState(0);
  const content = (
    <div className="ws-workspace-panel">
      <header className="ws-workspace-panel__header">
        <span className="ws-workspace-panel__title" title={panel.title}>
          <Heading level={2} truncated slot="title">
            {panel.title}
          </Heading>
        </span>
        <Button type="secondary" variation="transparent" shape="compact" aria-label="Close" onPress={onClose}>
          <Icon name="close" size="small" />
        </Button>
      </header>
      {panel.tabs.length > 1 ? (
        <div className="ws-workspace-panel__tabs" role="tablist">
          {panel.tabs.map((name, index) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={index === tab}
              className={`ws-workspace-panel__tab${index === tab ? " ws-workspace-panel__tab--active" : ""}`}
              style={{ background: "none", border: 0, cursor: "pointer", font: "inherit" }}
              onClick={() => setTab(index)}
            >
              <Text weight="medium">{name}</Text>
            </button>
          ))}
        </div>
      ) : null}
      <div className="ws-workspace-panel__body">
        <Text variant="description">
          {panel.tabs.length > 0
            ? `In Workspace, ${panel.tabs[tab]} runs here in its own iframe.`
            : "In Workspace, the apps this panel holds run here, each in its own iframe."}
        </Text>
      </div>
    </div>
  );

  const onOpenChange = (open: boolean) => {
    if (!open) onClose();
  };
  if (panel.kind === "modal") {
    return (
      <Modal aria-label={panel.title} isOpen container={container} onOpenChange={onOpenChange} size="medium">
        {content}
      </Modal>
    );
  }
  return (
    <ModalPanel
      aria-label={panel.title}
      isOpen
      container={container}
      onOpenChange={onOpenChange}
      isDismissible
      hideCloseButton
      size="medium"
      position="end"
    >
      {content}
    </ModalPanel>
  );
}

export function PrimaryArea({ frameSrc, onPanelClosed }: { frameSrc: string; onPanelClosed: (id: string) => void }) {
  const { config, state, dispatch, currentApp } = useShell();
  const [layer, setLayer] = useState<HTMLDivElement | null>(null);
  const isPrototype = state.appId === config.appId;

  return (
    <main id="app-content" tabIndex={-1} className="ws-primary" data-testid="canvas">
      <iframe
        className="ws-frame"
        title={config.dock.find((app) => app.id === config.appId)?.title ?? "App"}
        src={frameSrc}
        data-primary-frame="true"
        style={{ display: isPrototype ? undefined : "none" }}
      />
      {!isPrototype ? (
        <div className="ws-placeholder">
          <Heading level={3}>{currentApp?.title ?? state.appId}</Heading>
          <Text variant="description">This app isn't part of the prototype. In Workspace it runs here, in its own frame.</Text>
        </div>
      ) : null}
      {state.errorScreen && isPrototype ? <ErrorScreen type={state.errorScreen} /> : null}
      <div className="ws-panel-layer" ref={setLayer}>
        {layer && state.panel && isPrototype ? (
          <WorkspacePanel
            panel={state.panel}
            container={layer}
            onClose={() => {
              const id = state.panel?.id;
              dispatch({ type: "panel", panel: undefined });
              if (id) onPanelClosed(id);
            }}
          />
        ) : null}
      </div>
    </main>
  );
}
