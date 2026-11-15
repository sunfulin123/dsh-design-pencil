/** Register business routes without replacing canonical built-in Workspace chrome. */
import { addDockApp, DEFAULT_DOCK_APPS, type DockApp } from '../workspace-shell';
interface RegisteredApp {
  id: string;
  title: string;
  iconName?: string;
  pages: { id: string; title: string }[];
}
export function createPrototypeDock(registered: RegisteredApp[]): DockApp[] {
  return registered.reduce(
    (apps, app) => {
      const sections = app.pages.map((page) => ({
        type: 'page' as const,
        id: page.id,
        title: page.title,
      }));
      const builtin = DEFAULT_DOCK_APPS.find((item) => item.id === app.id);
      if (builtin) {
        // Built-in apps retain their official SVG, metadata and drawer/no-drawer model.
        return apps.map((item) =>
          item.id === app.id
            ? { ...builtin, sections: builtin.sections ? sections : undefined }
            : item,
        );
      }
      return addDockApp(apps, {
        id: app.id,
        title: app.title,
        iconName: app.iconName as DockApp['iconName'],
        sections,
      });
    },
    [...DEFAULT_DOCK_APPS],
  );
}
