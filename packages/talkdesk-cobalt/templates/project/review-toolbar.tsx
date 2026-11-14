/** Prototype-only controls, separate from Workspace navigation and business content. */
import type { WindowPreset } from '../workspace-shell/config';
import { FEATURE_FLAGS } from '../workspace-shell/flags';
import { useShell } from '../workspace-shell/shell/context';
import { ReviewControls, scenarios } from './scenarios';
import { ReviewDropdown } from './review-dropdown';
import './review-toolbar.css';
const presets: { id: WindowPreset; text: string }[] = [
  { id: 'fill', text: 'Fill window' }, ...(['1920', '1440', '1280', '1024', '640'] as const).map(id => ({ id, text: `${id} px` })),
  { id: 'desktop', text: 'Desktop app · 424 × 540' },
];
const names = { success: 'Ready', loading: 'Loading', empty: 'Empty', error: 'Error', partial: 'Partial', permission: 'No access' };
function Monitor() { return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="4" width="18" height="13" rx="1"/><path d="M12 17v4m-5 0h10"/></svg>; }
function Sliders() { return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 6h18M3 12h18M3 18h18"/><path strokeWidth="4" d="M8 3v6m8 0v6M8 15v6"/></svg>; }
export function PrototypeBar({ appWidth }: { appWidth: number }) {
  const { state, dispatch, layout } = useShell();
  const enabled = FEATURE_FLAGS.filter(flag => state.flags[flag.id]).length;
  const size = state.preset === 'fill' ? 'Fill' : state.preset === 'desktop' ? '424 × 540' : state.preset;
  const breakpoint = appWidth <= 640 ? 'Small' : appWidth <= 960 ? 'Medium' : 'Large';
  return <div className="review-toolbar" role="region" aria-label="Prototype controls" data-testid="prototype-toolbar">
    <ReviewDropdown id="size" label="Window size" trigger={<><Monitor/><span className="review-label">Size</span><span id="prototype-size-value" data-testid="prototype-size-value">{size}</span></>}>
      {close => <>{presets.map(preset => <button type="button" className="review-option" key={preset.id}
        data-testid={`prototype-size-${preset.id}`} aria-label={`Window size ${preset.text}`} aria-pressed={state.preset === preset.id}
        onClick={() => { dispatch({ type: 'preset', preset: preset.id }); close(); }}><span>{preset.text}</span><span aria-hidden="true">{state.preset === preset.id ? '✓' : ''}</span></button>)}
        <footer data-testid="prototype-window-readout">Window {layout.windowWidth} × {layout.windowHeight}<br/>App {appWidth}px · {breakpoint}</footer></>}
    </ReviewDropdown>
    <ReviewControls>{(scenario, setScenario) => <ReviewDropdown id="state" label="Page state" trigger={<><span className={`review-dot review-dot--${scenario}`} aria-hidden="true"/><span className="review-label">Page state</span><span id="prototype-state-value" data-testid="prototype-state-value">{names[scenario]}</span></>}>
      {close => scenarios.map(value => <button type="button" className="review-option" key={value}
        data-testid={`prototype-state-${value}`} aria-label={`Page state ${names[value]}`} aria-pressed={scenario === value}
        onClick={() => { setScenario(value); close(); }}><span><span className={`review-dot review-dot--${value}`} aria-hidden="true"/>{names[value]}</span><span aria-hidden="true">{scenario === value ? '✓' : ''}</span></button>)}
    </ReviewDropdown>}</ReviewControls>
    <ReviewDropdown id="flags" label="Feature flags" trigger={<><Sliders/><span className="review-label">Feature flags</span><span id="prototype-flags-value" data-testid="prototype-flags-value">{enabled} on</span></>}>
      {() => <><div className="review-flags-heading"><span>{enabled} enabled</span><button type="button" data-testid="prototype-flags-reset" aria-label="Reset feature flags" onClick={() => FEATURE_FLAGS.forEach(flag => dispatch({ type: 'flag', flag: flag.id, on: true }))}>Reset flags</button></div>
        {FEATURE_FLAGS.map((flag, index) => <label className="review-flag" key={flag.id}><span>{flag.label}{index < 2 && <small>{flag.effect}</small>}</span>
          <input type="checkbox" role="switch" aria-label={flag.label} data-testid={`prototype-flag-${flag.id}`} checked={state.flags[flag.id]}
            onChange={event => dispatch({ type: 'flag', flag: flag.id, on: event.target.checked })}/></label>)}</>}
    </ReviewDropdown>
    <span className="review-readout" data-testid="ws-readout">App {appWidth}px · {breakpoint}</span>
    <button type="button" className="review-reset" aria-label="Reset prototype settings" data-testid="prototype-reset" onClick={() => {
      try { localStorage.removeItem('workspace-shell:preferences'); } catch { /* Storage may be unavailable. */ }
      location.reload();
    }}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20 7v5h-5"/><path d="M20 12a8 8 0 1 0-2.3 5.7M20 7l-3-3"/></svg><span className="review-label">Reset</span></button>
  </div>;
}
