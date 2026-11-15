/** Size presets change the real iframe viewport; state changes remount the business page. */
(() => {
  'use strict';
  const config = JSON.parse(document.getElementById('prototype-review-config').textContent);
  const names = { success:'Ready', loading:'Loading', empty:'Empty', error:'Error', partial:'Partial', permission:'No access' };
  const initialUrl = new URL(config.entry, location.href);
  const localDirectory = new URL('.', initialUrl);
  let businessUrl = initialUrl;
  let state = config.defaultState;
  let preset = 'fill';
  let open = null;
  let connected = false;
  let restoreStateFocus = false;
  const page = document.querySelector('iframe');
  const stage = document.querySelector('.prototype-stage');
  const canvas = document.querySelector('.prototype-canvas');
  const triggers = { size:document.getElementById('size-trigger'), state:document.getElementById('state-trigger') };
  const panels = { size:document.getElementById('size-panel'), state:document.getElementById('state-panel') };
  const presets = [['fill','Fill window'], ...['1920','1440','1280','1024','768','640','360'].map(value => [value,`${value} px`]), ['mobile','Phone · 390 × 844']];
  function close(restore = false) {
    if (!open) return;
    const id = open;
    panels[id].hidden = true; triggers[id].setAttribute('aria-expanded','false'); open = null;
    if (restore) triggers[id].focus();
  }
  function position() {
    if (!open) return;
    const r = triggers[open].getBoundingClientRect();
    const panel = panels[open];
    panel.style.top = `${r.bottom + 8}px`;
    panel.style.left = `${Math.max(12,Math.min(r.left,innerWidth-panel.offsetWidth-12))}px`;
  }
  function toggle(id) {
    const current = open; close();
    if (current === id) return;
    open = id; panels[id].hidden = false; triggers[id].setAttribute('aria-expanded','true'); position();
    (panels[id].querySelector('[aria-pressed="true"]') ?? panels[id].querySelector('button')).focus();
  }
  function update() {
    document.getElementById('size-value').textContent = preset === 'fill' ? 'Fill' : preset === 'mobile' ? '390 × 844' : preset;
    document.getElementById('state-value').textContent = names[state];
    document.getElementById('state-dot').dataset.state = state;
    for (const button of document.querySelectorAll('[data-preset]')) button.setAttribute('aria-pressed',String(button.dataset.preset === preset));
    for (const button of document.querySelectorAll('button[data-state]')) button.setAttribute('aria-pressed',String(button.dataset.state === state));
    triggers.state.disabled = !connected || config.states.length < 2;
  }
  function size() {
    const width = preset === 'fill' ? stage.clientWidth : preset === 'mobile' ? 390 : Number(preset);
    page.style.width = `${width}px`; page.style.height = preset === 'mobile' ? '844px' : '100%';
    canvas.style.height = preset === 'mobile' ? 'max(100%, 844px)' : '100%';
    const rect = page.getBoundingClientRect();
    document.getElementById('readout').textContent = `Page ${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    position();
  }
  function navigate() {
    const url = new URL(businessUrl); url.searchParams.set('prototypeState',state);
    connected = false; update(); page.src = url.href;
  }
  function option(parent, value, label, kind) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'prototype-option';
    button.dataset[kind] = value; button.dataset.testid = `prototype-${kind === 'preset' ? 'size' : 'state'}-${value}`;
    button.setAttribute('aria-label',`${kind === 'preset' ? 'Window size' : 'Page state'} ${label}`);
    button.textContent = label;
    button.addEventListener('click',() => {
      if (kind === 'preset') { preset = value; size(); update(); } else { state = value; restoreStateFocus = true; navigate(); }
      close(true);
    });
    parent.append(button);
  }
  for (const [value,label] of presets) option(document.getElementById('size-options'),value,label,'preset');
  for (const value of config.states) option(document.getElementById('state-options'),value,names[value],'state');
  for (const id of ['size','state']) triggers[id].addEventListener('click',() => toggle(id));
  for (const button of document.querySelectorAll('[data-close]')) button.addEventListener('click',() => close(true));
  document.addEventListener('keydown',event => { if (event.key === 'Escape' && open) { event.preventDefault(); close(true); } });
  document.addEventListener('pointerdown',event => { if (open && !panels[open].contains(event.target) && !triggers[open].contains(event.target)) close(); });
  document.addEventListener('focusin',event => { if (open && !panels[open].contains(event.target) && !triggers[open].contains(event.target)) close(); });
  // Pointer events inside the business iframe do not bubble to the toolbar document.
  window.addEventListener('blur',() => requestAnimationFrame(() => { if (open && document.activeElement === page) close(); }));
  document.querySelector('[data-testid="prototype-reset"]').addEventListener('click',() => {
    preset = 'fill'; state = config.defaultState; businessUrl = initialUrl; restoreStateFocus = false; close(); size(); navigate(); stage.scrollTo(0,0);
  });
  function ready() {
    const status = document.getElementById('review-status');
    status.hidden = connected;
    status.textContent = connected ? '' : 'Page state adapter not found. Reset to return to the local prototype.';
    update(); size();
    if (connected && restoreStateFocus) { restoreStateFocus = false; triggers.state.focus(); }
  }
  window.addEventListener('message',event => {
    if (location.protocol !== 'file:' || event.source !== page.contentWindow || event.origin !== 'null' || event.data?.channel !== 'synapse-html-review:ready' || event.data.state !== state) return;
    connected = true; ready();
  });
  page.addEventListener('load',() => {
    if (location.protocol === 'file:') {
      connected = false;
      page.contentWindow.postMessage({ channel: 'synapse-html-review:probe' }, '*');
    } else {
      try {
        const current = new URL(page.contentWindow.location.href);
        const api = page.contentWindow.SynapsePrototypeReview;
        connected = current.origin === initialUrl.origin && current.pathname.startsWith(localDirectory.pathname) && api?.version === 1 && config.states.includes(api.state);
        if (connected) { businessUrl = current; state = api.state; }
      } catch (error) { if (error.name !== 'SecurityError') throw error; connected = false; }
    }
    ready();
  });
  new ResizeObserver(size).observe(stage);
  window.addEventListener('resize',size);
  update(); navigate(); size();
})();
