import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { findChrome, headlessArguments } from './headless-renderer.mjs';
import { startNodeHost } from './node-host.mjs';

async function browser(cleanups, url, profile) {
  const chrome = findChrome();
  assert.ok(chrome, 'Chrome is required for enabled asset acceptance');
  const child = spawn(chrome, [...headlessArguments(url, profile), '--remote-debugging-pipe'], {
    stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'],
  });
  const waiting = new Map();
  const events = [];
  let sequence = 0;
  let buffer = '';
  child.stdio[4].on('data', (data) => {
    buffer += data.toString();
    let end;
    while ((end = buffer.indexOf('\0')) !== -1) {
      const message = JSON.parse(buffer.slice(0, end));
      buffer = buffer.slice(end + 1);
      if (message.method === 'Network.responseReceived') events.push(message.params);
      const item = waiting.get(message.id);
      if (!item) continue;
      waiting.delete(message.id);
      clearTimeout(item.timer);
      if (message.error) item.reject(new Error(JSON.stringify(message.error)));
      else item.resolve(message.result);
    }
  });
  cleanups.push(async () => {
    const exited = new Promise((resolve) => child.once('exit', resolve));
    if (child.exitCode === null) {
      child.kill('SIGTERM');
      await exited;
    }
    for (const item of waiting.values()) {
      clearTimeout(item.timer);
      item.reject(new Error('Test browser closed'));
    }
  });
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => {
        waiting.delete(id);
        reject(new Error(`Chrome timeout: ${method}`));
      }, 15_000);
      waiting.set(id, { resolve, reject, timer });
      child.stdio[3].write(
        JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0',
      );
    });
  let target;
  for (let i = 0; i < 100 && !target; i++) {
    target = (await send('Target.getTargets')).targetInfos.find(
      (t) => t.type === 'page' && t.url.startsWith(url),
    );
    if (!target) await delay(100);
  }
  assert.ok(target, 'isolated editor page opened');
  const { sessionId } = await send('Target.attachToTarget', {
    targetId: target.targetId,
    flatten: true,
  });
  await send('Network.enable', {}, sessionId);
  const evaluate = async (expression) => {
    const result = await send(
      'Runtime.evaluate',
      { expression, returnByValue: true, awaitPromise: true },
      sessionId,
    );
    assert.equal(result.exceptionDetails, undefined, JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  for (let i = 0; i < 300; i++) {
    const state = await evaluate('document.documentElement?.dataset.opSmoke ?? ""');
    if (state === 'ok') break;
    if (state === 'error') {
      assert.fail(await evaluate('document.getElementById("op-error")?.textContent ?? "Editor startup failed"'));
    }
    await delay(100);
  }
  assert.equal(await evaluate('document.documentElement?.dataset.opSmoke ?? ""'), 'ok');
  return { evaluate, events, send: (method, params) => send(method, params, sessionId) };
}

test(
  'real managed editor acknowledges temporary and persistent themes across reload',
  {
    skip: process.env.DSH_E2E_CHROME !== '1',
    timeout: 120_000,
  },
  async (context) => {
    const directory = await mkdtemp(join(tmpdir(), 'dsh-assets-browser-'));
    const cleanups = [() => rm(directory, { recursive: true })];
    context.after(async () => {
      for (const cleanup of cleanups.reverse()) await cleanup();
    });
    const bundle = join(dirname(fileURLToPath(import.meta.url)), 'web-bundle');
    const host = await startNodeHost({
      document: { version: '1.0.0', children: [] },
      assetDirectory: join(directory, 'assets'),
      webRoot: bundle,
      canvaskitRoot: join(bundle, 'canvaskit'),
    });
    cleanups.push(() => host.close());
    const page = await browser(cleanups, host.baseUrl, join(directory, 'chrome'));
    const call = async (name, args = {}) => {
      const response = await fetch(`${host.baseUrl}/mcp`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: name,
          method: 'tools/call',
          params: { name, arguments: args },
        }),
      });
      return (await response.json()).result;
    };
    let original;
    for (let i = 0; i < 100; i++) {
      original = await call('get_editor_theme');
      if (!original.isError) break;
      await delay(100);
    }
    assert.equal(original.isError, false, JSON.stringify(original));
    const preference = original.structuredContent.preference;
    const other = preference === 'dark' ? 'light' : 'dark';
    const temporary = await call('set_editor_theme', { theme: other });
    assert.equal(temporary.isError, false, JSON.stringify(temporary));
    assert.equal(temporary.structuredContent.effective, other);
    assert.equal(temporary.structuredContent.preference, preference);
    const persistent = await call('set_editor_theme', { theme: other, persist: true });
    assert.equal(persistent.isError, false, JSON.stringify(persistent));
    assert.equal(persistent.structuredContent.preference, other);
    const controlUrl = `${host.baseUrl}/api/mcp/editor-control?client=`;
    const previousClient = page.events
      .filter((item) => item.response.url.startsWith(controlUrl))
      .at(-1)?.response.url;
    assert.ok(previousClient, 'the initial editor registered its control heartbeat');
    page.events.length = 0;
    await page.send('Page.reload', {});
    let ready = false;
    for (let i = 0; i < 300 && !ready; i++) {
      ready =
        page.events.some(
          (item) =>
            item.response.url.startsWith(controlUrl) &&
            item.response.url !== previousClient &&
            item.response.status === 200,
        ) && (await page.evaluate('document.documentElement?.dataset.opSmoke ?? ""')) === 'ok';
      if (!ready) await delay(100);
    }
    assert.ok(ready, 'the reloaded editor registered a new live control client');
    const reloaded = await call('get_editor_theme');
    assert.equal(reloaded.isError, false, JSON.stringify(reloaded));
    assert.equal(reloaded.structuredContent.preference, other);
    assert.equal(reloaded.structuredContent.effective, other);
    const saved = await call('import_design_md', { markdown: '# Browser Brand\nAccent #123456.' });
    assert.equal(saved.isError, false, JSON.stringify(saved));
    let hydrated = false;
    for (let i = 0; i < 100 && !hydrated; i++) {
      const responses = page.events.filter(
        (item) => item.response.url === `${host.baseUrl}/api/assets`,
      );
      for (const response of responses.reverse()) {
        const body = await page.send('Network.getResponseBody', { requestId: response.requestId });
        const view = JSON.parse(body.body);
        if (view.assets.some((a) => a.id === saved.structuredContent.asset.id)) {
          hydrated = true;
          break;
        }
      }
      if (!hydrated) await delay(100);
    }
    assert.ok(hydrated, 'the managed UI refreshes its catalogue after the MCP import');
    const view = await page.evaluate('fetch("/api/assets").then(r => r.json())');
    assert.ok(view.assets.some((a) => a.id === saved.structuredContent.asset.id));
    const builtins = view.assets.filter((a) => a.kind === 'style-guide' && !a.isUser);
    assert.equal(builtins.length, 85);
    assert.equal(builtins[0].id, 'talkdesk-cobalt');
    assert.ok(view.assets.every((a) => a.kind !== 'scene-template'));
    const apple = await call('get_style_guide', { id: 'design-md:apple' });
    assert.equal(apple.isError, false, JSON.stringify(apple));
    assert.ok(apple.structuredContent.content.includes('name: Apple-design-analysis'));
    assert.equal(
      (await call('get_style_guide', { id: saved.structuredContent.asset.id })).structuredContent
        .content,
      '# Browser Brand\nAccent #123456.',
    );
    assert.equal((await (await fetch(`${host.baseUrl}/api/mcp/document`)).json()).version, 0);
  },
);
