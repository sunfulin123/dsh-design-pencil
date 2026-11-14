/** Apply owned multi-app and review-toolbar seams to a verified copy, never the upstream snapshot. */
export function adaptShell(files) {
  function replace(path, before, after) {
    const content = files.get(path);
    if (!content?.includes(before) || content.indexOf(before) !== content.lastIndexOf(before)) {
      throw new Error(`Cobalt adapter no longer matches its pinned source: ${path}`);
    }
    files.set(path, content.replace(before, after));
  }
  // The 24px icon exceeds the button's 22px content box. Center that overflow symmetrically.
  // Hidden labels must not participate in collapsed button layout.
  const css = 'shell/shell.css';
  files.set(css, files.get(css) + `
.ws-dock-button:not(.ws-dock-button--expanded) .ws-dock-button__inner {
  justify-content: center;
}
.ws-dock-button:not(.ws-dock-button--expanded) .ws-dock-label {
  display: none;
}
`);
  const primary = "shell/Primary.tsx";
  files.set(
    primary,
    'import { prototypeApps } from "../../prototype-runtime/apps";\n' + files.get(primary),
  );
  replace(
    primary,
    "state.appId === config.appId",
    "prototypeApps.some((app) => app.id === state.appId)",
  );
  replace(
    primary,
    "config.dock.find((app) => app.id === config.appId)?.title",
    "currentApp?.title",
  );
  const shell = "shell/Shell.tsx";
  replace(shell, "appId: config.appId,", "appId: current.appId,");
  replace(
    shell,
    "page: current.appId === config.appId ? current.page : undefined,",
    "page: current.page,",
  );
  replace(
    shell,
    'area === "primary" ? config.appId : undefined',
    'area === "primary" ? current.appId : undefined',
  );
  replace(
    shell,
    "config.dock.find((app) => app.id === config.appId)",
    "config.dock.find((app) => app.id === current.appId)",
  );
  replace(shell, 'of "${config.appId}"', 'of "${current.appId}"');
  replace(
    shell,
    "if (current.appId === config.appId) dispatch",
    "if (pages.some((page) => page.id === message.page)) dispatch",
  );
  files.set('shell/PrototypeBar.tsx', 'export { PrototypeBar } from "../../prototype-runtime/review-toolbar";\n');
}
