/** Business-side state adapter. Read state before rendering; preview switches reload this page. */
(() => {
  'use strict';
  if (window.SynapsePrototypeReview?.version === 1) return;
  const states = ['success', 'loading', 'empty', 'error', 'partial', 'permission'];
  const requested = new URL(location.href).searchParams.get('prototypeState');
  const state = states.includes(requested) ? requested : 'success';
  const announce = () => window.parent.postMessage({ channel: 'synapse-html-review:ready', state }, '*');
  if (location.protocol === 'file:' && window.parent !== window) window.addEventListener('message', event => {
    if (event.source === window.parent && event.origin === 'null' && event.data?.channel === 'synapse-html-review:probe') announce();
  });
  Object.defineProperty(window, 'SynapsePrototypeReview', { value: Object.freeze({ version: 1, state }) });
  document.documentElement.dataset.prototypeCurrentState = state;
  const apply = () => {
    const style = document.createElement('style');
    style.textContent = '[data-prototype-state][hidden]{display:none!important}';
    document.head.append(style);
    for (const node of document.querySelectorAll('[data-prototype-state]')) node.hidden = !node.dataset.prototypeState.split(/\s+/).includes(state);
    window.dispatchEvent(new CustomEvent('prototype:statechange', { detail: { state } }));
    if (location.protocol === 'file:' && window.parent !== window) announce();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true });
  else apply();
})();
