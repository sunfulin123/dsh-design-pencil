import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { launchHeadlessPage } from './chrome-cdp.mjs';
import { startNodeHost } from './node-host.mjs';

async function until(read, predicate, message) {
  for (let i = 0; i < 150; i++) {
    const value = await read();
    if (predicate(value)) return value;
    await delay(100);
  }
  throw new Error(message);
}

async function click(page, x, y, clickCount = 1) {
  await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount });
  await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount });
}

async function key(page, key, code, windowsVirtualKeyCode, modifiers = 0) {
  const params = { key, code, windowsVirtualKeyCode, modifiers };
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', ...params });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', ...params });
}

test('real canvas selection reaches the host and survives inspector edits', {
  skip: process.env.DSH_E2E_CHROME !== '1',
  timeout: 90_000,
}, async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-property-browser-'));
  const bundle = join(dirname(fileURLToPath(import.meta.url)), 'web-bundle');
  const host = await startNodeHost({
    document: {
      version: '1.0.0', children: [{
        type: 'frame', id: 'board', name: 'Fixture', width: 650, height: 400,
        fill: '#ffffff', children: [{
          type: 'text', id: 'title', name: 'Title', x: 40, y: 80,
          width: 460, height: 80, fontSize: 36, content: 'A中🙂Z',
        }],
      }],
    },
    assetDirectory: join(directory, 'assets'),
    webRoot: bundle,
    canvaskitRoot: join(bundle, 'canvaskit'),
    headless: { chromePath: null },
  });
  const page = await launchHeadlessPage({ width: 1200, height: 800 });
  assert.ok(page, 'Chrome is required for enabled browser acceptance');
  context.after(async () => {
    await page.close();
    await host.close();
    await rm(directory, { recursive: true, force: true });
  });
  const call = async (name, args) => {
    const response = await fetch(`${host.baseUrl}/mcp`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: name, method: 'tools/call',
        params: { name, arguments: args } }),
    });
    const result = (await response.json()).result;
    assert.equal(result.isError, false, JSON.stringify(result));
    return result;
  };
  // An actual engine write advances the initial version, so the editor pulls
  // this isolated fixture instead of showing its local startup document.
  await call('update_node', { nodeId: 'board', data: { name: 'Fixture Board', x: 100, y: 80 } });
  await page.send('Page.enable');
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: 1200, height: 800, deviceScaleFactor: 1, mobile: false,
  });
  await page.send('Page.navigate', { url: `${host.baseUrl}/?embed=vscode` });
  await until(() => page.evaluate('document.documentElement.dataset.opSmoke'),
    value => value === 'ok', 'CanvasKit editor did not start');
  await delay(2500);
  await click(page, 65, 230); // Select the fixture text layer.
  await click(page, 420, 240);
  await click(page, 420, 240, 2); // Enter inline text editing.
  await delay(500);
  await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 405, y: 240, button: 'left', clickCount: 1 });
  await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 475, y: 240, button: 'left', buttons: 1 });
  await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 475, y: 240, button: 'left', clickCount: 1 });
  const selection = await until(
    async () => (await fetch(`${host.baseUrl}/api/mcp/selection`)).json(),
    value => value.textRange?.selectedText === '中🙂',
    'Unicode canvas selection did not reach MCP',
  );
  assert.deepEqual(selection.textRange, { nodeId: 'title', start: 1, end: 3, selectedText: '中🙂' });

  await click(page, 1120, 527); // Size field.
  // Canvas focus installs the hidden input asynchronously in the browser.
  await delay(300);
  await key(page, 'a', 'KeyA', 65, 4);
  await page.send('Input.insertText', { text: '22' });
  await delay(300);
  await key(page, 'Enter', 'Enter', 13);
  const getRuns = async () => {
    const snapshot = await (await fetch(`${host.baseUrl}/api/mcp/document`)).json();
    return snapshot.document.children[0].children[0].content;
  };
  const runs = await until(getRuns, value => Array.isArray(value) && value.some(run => run.fontSize === 22),
    'inspector edit did not synchronize');
  assert.equal(runs.map(run => run.text).join(''), 'A中🙂Z');
  assert.equal(runs.find(run => run.text === '中🙂')?.fontSize, 22);
  assert.equal(runs.find(run => run.text === 'A')?.fontSize, undefined);
  assert.equal(runs.find(run => run.text === 'Z')?.fontSize, undefined);
  assert.equal((await (await fetch(`${host.baseUrl}/api/mcp/selection`)).json()).textRange.selectedText, '中🙂');
});
