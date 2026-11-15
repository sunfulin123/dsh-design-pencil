import { mountPrototype } from './workspace-shell';
import { createPrototypeDock } from './prototype-runtime/dock-registry';
import { prototypeApps } from './prototype-runtime/apps';
import App from './prototype-runtime/app';

const dock = createPrototypeDock(prototypeApps);

mountPrototype({ app: <App />, shell: {
  title: 'Talkdesk prototype', dock,
  // Local sample history; replace with target-specific prototype notifications.
  notifications: Array.from({ length: 7 }, (_, index) => ({
    id: `sample-alert-${index}`, title: 'Adherence Alert - Team',
    body: `1 agent in WFM OOA ${[2, 2, 2, 15, 10, 5, 5][index]} min`, origin: 'WFM',
    createdAt: Date.now() - (25 + index) * 60 * 60 * 1000, read: false,
  })),
  app: { id: prototypeApps[0].id, page: prototypeApps[0].pages[0].id },
} });
