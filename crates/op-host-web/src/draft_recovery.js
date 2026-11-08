let activeDialog = null;

export function openDraftRecovery(raw, syncedVersion) {
  if (activeDialog) {
    activeDialog.focus();
    return;
  }
  const { base, token, locale, scale, colors, labels: t } = JSON.parse(raw);
  const previousFocus = document.activeElement;
  const dialog = document.createElement('dialog');
  dialog.className = 'op-recovery-dialog';
  dialog.setAttribute('aria-labelledby', 'op-recovery-heading');
  dialog.setAttribute('aria-describedby', 'op-recovery-notice');
  dialog.lang = locale;
  dialog.style.cssText = `--s:${scale};margin:auto;padding:0;width:min(${640 * scale}px,calc(100vw - 24px));max-width:none;max-height:calc(100dvh - 24px);border:1px solid ${colors.border};border-radius:8px;color:${colors.text};background:${colors.surface};font:${13 * scale}px/1.5 system-ui;box-shadow:0 12px 40px #0005;`;
  const style = document.createElement('style');
  style.textContent = `
    .op-recovery-dialog::backdrop{background:#0007}
    .op-recovery{padding:calc(20px * var(--s));color-scheme:light dark}
    .op-recovery *{box-sizing:border-box}
    .op-recovery h2{margin:0;font-size:1.35em;line-height:1.4}
    .op-recovery p{margin:0 0 1.2em;color:${colors.muted}}
    .op-recovery header,.op-recovery footer,.op-recovery form,.op-recovery-actions{display:flex;align-items:center;gap:.6em;flex-wrap:wrap}
    .op-recovery header{justify-content:space-between;margin-bottom:.65em}
    .op-recovery footer{justify-content:flex-end;margin-top:1.2em}
    .op-recovery button,.op-recovery input{font:inherit;color:inherit;background:${colors.input};border:1px solid ${colors.border};border-radius:5px;min-height:max(36px,2.7em);padding:.4em .8em;caret-color:${colors.text}}
    .op-recovery button{cursor:pointer;white-space:normal;overflow-wrap:anywhere}
    .op-recovery button:hover:not(:disabled){background:${colors.hover}}
    .op-recovery button:disabled{opacity:.5;cursor:default}
    .op-recovery :focus-visible{outline:2px solid ${colors.ring};outline-offset:2px}
    .op-recovery ::selection{background:${colors.accent};color:${colors.accentText}}
    .op-recovery label{display:block;width:100%}
    .op-recovery input{flex:1;min-width:9em;width:100%}
    .op-recovery form{margin:1.2em 0}
    .op-recovery-list{list-style:none;padding:0;margin:0;max-height:45dvh;overflow:auto;scrollbar-color:${colors.border} ${colors.surface};scrollbar-width:thin}
    .op-recovery-list li{padding:1em 0;border-top:1px solid ${colors.border};display:flex;gap:.8em;justify-content:space-between;align-items:center;flex-wrap:wrap}
    .op-recovery-info{min-width:0;flex:1 1 12em;overflow-wrap:anywhere}
    .op-recovery-info strong{display:block;font-weight:600}
    .op-recovery-info time{display:block;color:${colors.muted};font-variant-numeric:tabular-nums}
    .op-recovery-status{white-space:pre-wrap;overflow-wrap:anywhere;margin:.5em 0;min-height:1.5em}
    .op-recovery-status[data-error]{color:${colors.error}}
    .op-recovery-confirm{margin-top:1em;padding-top:1em;border-top:1px solid ${colors.border}}
    .op-recovery-confirm p{color:${colors.text};margin-bottom:.7em}
    @media(max-width:480px){.op-recovery{padding:14px}.op-recovery-actions{width:100%}.op-recovery input{min-width:0;flex-basis:100%}}
  `;
  const root = document.createElement('section');
  root.className = 'op-recovery';
  dialog.append(style, root);
  const el = (tag, text, parent = root) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    parent.append(node);
    return node;
  };
  const header = el('header');
  el('h2', t.title, header).id = 'op-recovery-heading';
  const close = el('button', t.close, header);
  close.type = 'button';
  const notice = el('p', t.notice);
  notice.id = 'op-recovery-notice';
  const form = el('form');
  const label = el('label', t.label, form);
  label.htmlFor = 'op-recovery-label';
  const input = el('input', undefined, form);
  input.id = label.htmlFor;
  input.maxLength = 160;
  input.autocomplete = 'off';
  const create = el('button', t.create, form);
  create.type = 'submit';
  const status = el('div');
  status.className = 'op-recovery-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const list = el('ul');
  list.className = 'op-recovery-list';
  list.setAttribute('aria-label', t.title);
  const confirmation = el('div');
  confirmation.className = 'op-recovery-confirm';
  confirmation.hidden = true;
  const footer = el('footer');
  const refresh = el('button', t.refresh, footer);
  refresh.type = 'button';
  let busy = false;
  let requestId = 0;
  const message = (text, error = false) => {
    status.textContent = text;
    status.toggleAttribute('data-error', error);
    status.setAttribute('role', error ? 'alert' : 'status');
  };
  const fail = error => message(t.failed.replace('{{message}}', error.message), true);
  const run = async action => {
    if (busy) return;
    busy = true;
    root.setAttribute('aria-busy', 'true');
    root.querySelectorAll('button,input').forEach(node => { node.disabled = true; });
    message(t.loading);
    let focusAfter;
    try {
      focusAfter = await action();
    } catch (error) {
      fail(error);
    } finally {
      busy = false;
      root.removeAttribute('aria-busy');
      root.querySelectorAll('button,input').forEach(node => { node.disabled = false; });
      if (dialog.open) {
        if (focusAfter?.isConnected) focusAfter.focus();
        else if (!dialog.contains(document.activeElement)) input.focus();
      }
    }
  };
  const call = async (name, args) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${base}/mcp`, {
      method: 'POST', headers,
      body: JSON.stringify({ jsonrpc: '2.0', id: ++requestId, method: 'tools/call',
        params: { name, arguments: args } }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const reply = await response.json();
    if (reply.error) throw new Error(reply.error.message);
    if (!reply.result || reply.result.isError) {
      throw new Error(reply.result?.content?.map(item => item.text ?? '').join('\n') || 'Invalid MCP result');
    }
    return reply.result.structuredContent ?? JSON.parse(reply.result.content[0].text);
  };
  const version = () => {
    const value = syncedVersion();
    if (!Number.isSafeInteger(value) || value < 0) throw new Error(t.syncError);
    return value;
  };
  const dismissConfirmation = () => {
    confirmation.replaceChildren();
    confirmation.hidden = true;
  };
  const ask = (draft, remove, trigger) => {
    dismissConfirmation();
    confirmation.hidden = false;
    el('p', `${remove ? t.deleteConfirm : t.restoreConfirm} ${draft.label || draft.documentName}`, confirmation);
    const actions = el('div', undefined, confirmation);
    actions.className = 'op-recovery-actions';
    const cancel = el('button', t.cancel, actions);
    cancel.type = 'button';
    cancel.onclick = () => { dismissConfirmation(); trigger.focus(); };
    const confirm = el('button', remove ? t.delete : t.restore, actions);
    confirm.type = 'button';
    confirm.onclick = () => run(async () => {
      if (remove) {
        await call('delete_draft', { id: draft.id });
        dismissConfirmation();
        await load();
        return refresh;
      } else {
        const restored = await call('restore_draft', { id: draft.id, baseVersion: version() });
        dismissConfirmation();
        if (!Number.isSafeInteger(restored.version)) throw new Error('Invalid restoration receipt');
        const deadline = performance.now() + 15000;
        while (!(syncedVersion() >= restored.version)) {
          if (performance.now() >= deadline) {
            throw new Error(`Recovery applied at version ${restored.version}. Close this dialog and wait for synchronization; do not restore again.`);
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        dialog.close();
      }
    });
    cancel.focus();
  };
  const dates = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });
  const load = async () => {
    const result = await call('list_drafts', {});
    if (!Array.isArray(result.drafts)) throw new Error('Invalid recovery list');
    list.replaceChildren();
    for (const draft of result.drafts) {
      if (typeof draft.id !== 'string' || typeof draft.documentName !== 'string' ||
          !['autosave', 'checkpoint', 'pre-restore'].includes(draft.kind) ||
          !Number.isFinite(Date.parse(draft.updatedAt))) throw new Error('Invalid recovery metadata');
      const row = el('li', undefined, list);
      const info = el('div', undefined, row);
      info.className = 'op-recovery-info';
      el('strong', draft.label || t[draft.kind], info);
      const time = el('time', `${t[draft.kind]} · ${dates.format(new Date(draft.updatedAt))}`, info);
      time.dateTime = draft.updatedAt;
      const actions = el('div', undefined, row);
      actions.className = 'op-recovery-actions';
      const restore = el('button', t.restore, actions);
      restore.type = 'button';
      restore.onclick = () => ask(draft, false, restore);
      const remove = el('button', t.delete, actions);
      remove.type = 'button';
      remove.onclick = () => ask(draft, true, remove);
    }
    message(result.drafts.length ? '' : t.empty);
  };
  form.onsubmit = event => {
    event.preventDefault();
    run(async () => {
      version();
      const name = input.value.trim();
      await call('create_draft', name ? { label: name } : {});
      input.value = '';
      dismissConfirmation();
      await load();
      return input;
    });
  };
  refresh.onclick = () => run(async () => { dismissConfirmation(); await load(); });
  close.onclick = () => dialog.close();
  dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  const stopKeyboard = event => event.stopPropagation();
  for (const name of ['wheel', 'drop', 'dragover']) {
    dialog.addEventListener(name, event => event.stopPropagation());
  }
  dialog.addEventListener('close', () => {
    dialog.remove();
    activeDialog = null;
    for (const name of ['keydown', 'keyup']) {
      window.removeEventListener(name, stopKeyboard, true);
    }
    if (previousFocus?.isConnected) previousFocus.focus();
  }, { once: true });
  document.body.append(dialog);
  try {
    dialog.showModal();
  } catch (error) {
    dialog.remove();
    throw error;
  }
  activeDialog = dialog;
  for (const name of ['keydown', 'keyup']) {
    window.addEventListener(name, stopKeyboard, true);
  }
  input.focus();
  run(load);
}
