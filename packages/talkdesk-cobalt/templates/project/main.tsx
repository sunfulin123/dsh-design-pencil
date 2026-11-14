import { mountPrototype, addDockApp, DEFAULT_DOCK_APPS, type DockApp } from './workspace-shell';
import { prototypeApps } from './prototype-runtime/apps';
import App from './prototype-runtime/app';

const dock = prototypeApps.reduce((apps, app) => {
  const entry: DockApp = {
    id: app.id, title: app.title, iconName: app.iconName as DockApp['iconName'],
    sections: app.pages.map(page => ({ type: 'page', id: page.id, title: page.title })),
  };
  // Existing Workspace apps keep their Dock position; new apps are inserted before Admin.
  return apps.some(item => item.id === entry.id)
    ? apps.map(item => item.id === entry.id ? entry : item)
    : addDockApp(apps, entry);
}, DEFAULT_DOCK_APPS);

mountPrototype({ app: <App />, shell: {
  title: 'Talkdesk prototype', dock,
  app: { id: prototypeApps[0].id, page: prototypeApps[0].pages[0].id },
} });
