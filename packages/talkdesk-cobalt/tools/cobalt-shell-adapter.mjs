/** Apply owned multi-app and review-toolbar seams to a verified copy, never the upstream snapshot. */
export function adaptShell(files, chrome) {
  function replace(path, before, after) {
    const content = files.get(path);
    if (!content?.includes(before) || content.indexOf(before) !== content.lastIndexOf(before)) {
      throw new Error(`Cobalt adapter no longer matches its pinned source: ${path}`);
    }
    files.set(path, content.replace(before, after));
  }
  // Atlas used Tag v2's default export; the prototype pins v3's named export.
  replace('title.bar/primitives/title-bar-button-frame.tsx', "import Tag from '@talkdesk/cobalt-react-tag'", "import { Tag } from '@talkdesk/cobalt-react-tag'");
  // Presentation has its own maintained sources; the pinned upstream input stays pristine.
  files.set('space.ts', chrome.get('space.ts'));
  files.set('shell/TitleBar.tsx', chrome.get('title-bar.tsx'));
  files.set('shell/StatusPill.tsx', chrome.get('status-pill.tsx'));
  files.set('shell/ProfileMenu.tsx', chrome.get('profile-menu.tsx'));
  files.set('shell/Notifications.tsx', chrome.get('notifications.tsx'));
  files.set('shell/workspace-chrome.css', chrome.get('workspace-chrome.css'));
  replace('mount.tsx', 'import "./shell/shell.css";', 'import "./shell/shell.css";\nimport "./shell/workspace-chrome.css";');
  replace('shell/Drawer.tsx', 'data-testid="dock-action-button"', 'data-testid="dock-action-button"\n            aria-label={open ? "Collapse navigation" : "Open navigation"}\n            aria-expanded={open}');
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
  // A fixed phone viewport must never widen itself to fit optional Workspace areas.
  replace('config.ts', '"640" | "desktop"', '"640" | "mobile"');
  const statePath = 'shell/state.ts';
  files.set(statePath, files.get(statePath).replaceAll('DESKTOP_SIZE', 'MOBILE_SIZE').replace('{ width: 424, height: 540 }', '{ width: 390, height: 844 }').replace('preset: stored.preset ?? config.window,', 'preset: ["fill", "1920", "1440", "1280", "1024", "640", "mobile"].includes(stored.preset ?? "") ? stored.preset! : config.window,'));
  const shell = "shell/Shell.tsx";
  files.set(shell, files.get(shell).replaceAll('DESKTOP_SIZE', 'MOBILE_SIZE').replace('state.preset === "desktop" ? state.desktopWidth', 'state.preset === "mobile" ? MOBILE_SIZE.width').replace('state.preset === "desktop" ? MOBILE_SIZE.height', 'state.preset === "mobile" ? MOBILE_SIZE.height'));
  const shellSource = files.get(shell);
  const resizeStart = shellSource.indexOf('    if (stateRef.current.preset === "desktop") {');
  const resizeEnd = shellSource.indexOf('\n  };', resizeStart);
  if (resizeStart < 0 || resizeEnd < 0) throw new Error('Pinned shell phone preset seam changed');
  const resizeBlock = shellSource.slice(resizeStart, resizeEnd);
  const warning = resizeBlock.slice(resizeBlock.indexOf('      dispatch({', resizeBlock.indexOf('} else {')), resizeBlock.lastIndexOf('\n    }'));
  files.set(shell, shellSource.slice(0, resizeStart) + warning + shellSource.slice(resizeEnd));
  replace(shell, '  DOCK_WIDTH,', '  DOCK_WIDTH,\n  chromeWidth,');
  replace(shell, 'windowWidth - dockWidth - drawerSpace', 'windowWidth - dockWidth - drawerSpace - chromeWidth(windowWidth, hasDrawer)');
  replace(shell, 'className={`ws-window${framed ? "" : " ws-window--fill"}`}', 'className={`ws-window${framed ? "" : " ws-window--fill"}${small ? " ws-window--small" : ""}${hasDrawer ? " ws-window--drawer" : ""}`}');

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
