/** Demo controls stay in the prototype toolbar; the business frame receives a separate review channel. */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { setColorScheme } from '../workspace-shell/theme';
const channel = 'synapse-cobalt-review/1';
export const scenarios = ['success', 'loading', 'empty', 'error', 'partial', 'permission'] as const;
type Scenario = typeof scenarios[number];
const ScenarioContext = createContext<Scenario>('success');
const valid = (value: unknown): value is Scenario => scenarios.some(item => item === value);

export function ReviewControls({ children }: { children: (scenario: Scenario, change: (value: Scenario) => void) => ReactNode }) {
  const [scenario, setScenario] = useState<Scenario>('success');
  useEffect(() => {
    const send = () => document.querySelector<HTMLIFrameElement>('iframe[data-primary-frame]')
      ?.contentWindow?.postMessage({ channel, scenario }, location.origin);
    const onMessage = (event: MessageEvent) => {
      const frame = document.querySelector<HTMLIFrameElement>('iframe[data-primary-frame]');
      if (event.origin === location.origin && event.source === frame?.contentWindow
        && event.data?.channel === channel && event.data?.type === 'ready') send();
    };
    window.addEventListener('message', onMessage);
    send();
    return () => window.removeEventListener('message', onMessage);
  }, [scenario]);
  return children(scenario, setScenario);
}

export function PrototypeScenarioProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState<Scenario>(() => {
    const requested = new URLSearchParams(location.search).get('scenario');
    return parent === window && valid(requested) ? requested : 'success';
  });
  useEffect(() => { document.documentElement.dataset.prototypeScenario = scenario; }, [scenario]);
  useEffect(() => {
    if (parent === window) {
      setColorScheme(new URLSearchParams(location.search).get('scheme') === 'dark' ? 'dark' : 'light');
      return;
    }
    const onMessage = (event: MessageEvent) => {
      if (event.origin === location.origin && event.source === parent
        && event.data?.channel === channel && valid(event.data.scenario)) setScenario(event.data.scenario);
    };
    window.addEventListener('message', onMessage);
    parent.postMessage({ channel, type: 'ready' }, location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, []);
  return <ScenarioContext.Provider value={scenario}>{children}</ScenarioContext.Provider>;
}

export const usePrototypeScenario = () => useContext(ScenarioContext);
