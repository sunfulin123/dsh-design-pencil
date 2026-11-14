import type { ComponentType } from 'react';
import { useWorkspaceState } from '../workspace-shell';
import { prototypeApps } from './apps';
import { PrototypeScenarioProvider } from './scenarios';

const pages = import.meta.glob<{ default: ComponentType }>('../apps/*/pages/*.tsx', { eager: true });

/** One real business frame, with app identity/page supplied by the official shell SDK. */
export default function App() {
  const state = useWorkspaceState();
  const params = new URLSearchParams(location.search);
  const app = prototypeApps.find(app => app.id === (state.appId || params.get('app'))) ?? prototypeApps[0];
  const page = app.pages.find(page => page.id === (state.page || params.get('page'))) ?? app.pages[0];
  const Page = pages[`../apps/${app.id}/pages/${page.id}.tsx`]?.default;
  if (!Page) throw new Error(`Missing prototype page: ${app.id}/${page.id}`);
  return <PrototypeScenarioProvider key={app.id}><Page key={page.id} /></PrototypeScenarioProvider>;
}
