import React from 'react';
import { createRoot } from 'react-dom/client';
import ThemeProvider from '@talkdesk/cobalt-react-theme-provider';
import ViewportProvider from '@talkdesk/cobalt-react-viewport-provider';
import PortalProvider from '@talkdesk/cobalt-react-portal-provider';
import {
  loadThemeStylesheet,
  setColorScheme,
  stylesheetTheme,
} from '../templates/vendor/workspace-shell/theme';
const examples = import.meta.glob<{ default: React.ComponentType }>('../examples/**/*.tsx');
const recipes = import.meta.glob<{ default: React.ComponentType<{ scenario?: string }> }>(
  '../recipes/**/*.tsx',
);
const params = new URLSearchParams(location.search);
const path = params.get('entry') ?? 'recipes/card-widgets.tsx';
const load = { ...examples, ...recipes }['../' + path];
loadThemeStylesheet();
setColorScheme(params.get('scheme') === 'dark' ? 'dark' : 'light');
if (!load) throw new Error(`Unknown demo entry: ${path}`);
// Fetch only the selected example; the catalog contains hundreds of independent demos.
async function mount() {
  const { default: Demo } = await load();
  // Exercise host failure without a backend in the isolated ListPage review demo.
  const rejectHostAction = async () => { await new Promise(resolve => setTimeout(resolve, 250)); throw new Error('Demo host failure'); };
  const hostActions = path === 'recipes/list-page.tsx' && params.get('host') === 'error'
    ? { onCreate: rejectHostAction, onImport: rejectHostAction }
    : {};
  createRoot(document.getElementById('root')!).render(
    <ThemeProvider loader={stylesheetTheme}>
      <ViewportProvider>
        <PortalProvider>
          <Demo scenario={params.get('state') ?? 'success'} {...hostActions} />
        </PortalProvider>
      </ViewportProvider>
    </ThemeProvider>,
  );
}
void mount();
