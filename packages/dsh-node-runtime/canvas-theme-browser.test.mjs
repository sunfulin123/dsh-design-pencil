import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { launchHeadlessPage } from './chrome-cdp.mjs';
import { startNodeHost } from './node-host.mjs';
import { decodePng } from './png-diff.mjs';

function countColor(png, color) {
  let count = 0;
  for (let y = 150; y < 700; y++) {
    for (let x = 300; x < 900; x++) {
      const offset = (y * png.width + x) * 4;
      if (color.every((value, index) => png.pixels[offset + index] === value)) count++;
    }
  }
  return count;
}

function dominantColors(png) {
  const counts = new Map();
  for (let y = 150; y < 700; y += 2) for (let x = 300; x < 900; x += 2) {
    const offset = (y * png.width + x) * 4;
    const color = [...png.pixels.subarray(offset, offset + 3)].join(',');
    counts.set(color, (counts.get(color) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 8);
}

test('managed CanvasKit editor paints the requested light and dark canvas colors', {
  skip: process.env.DSH_E2E_CHROME !== '1', timeout: 90_000,
}, async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-canvas-theme-'));
  const bundle = join(dirname(fileURLToPath(import.meta.url)), 'web-bundle');
  const host = await startNodeHost({ document: { version: '1.0.0', children: [
    { type: 'frame', id: 'board', name: 'Board', width: 180, height: 160, fill: '#ffffff', children: [] },
  ] }, assetDirectory: join(directory, 'assets'), webRoot: bundle, canvaskitRoot: join(bundle, 'canvaskit'), headless: { chromePath: null } });
  const updated = await fetch(`${host.baseUrl}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'update_node', arguments: { nodeId: 'board', data: { name: 'Fixture Board', x: 100, y: 80 } } } }) });
  assert.equal((await updated.json()).result.isError, false);
  const page = await launchHeadlessPage({ width: 1200, height: 800 });
  assert.ok(page, 'Chrome is required for enabled browser acceptance');
  context.after(async () => { await page.close(); await host.close(); await rm(directory, { recursive: true, force: true }); });
  await page.send('Page.enable');
  const capture = async (scheme) => {
    await page.send('Page.navigate', { url: `${host.baseUrl}/?embed=vscode&theme=${scheme}` });
    let ready = false;
    for (let i = 0; i < 150; i++) {
      if (await page.evaluate(`location.search.includes('theme=${scheme}') && document.documentElement.dataset.opSmoke === 'ok'`)) { ready = true; break; }
      await delay(100);
    }
    assert.ok(ready, `CanvasKit ${scheme} editor did not start`);
    await delay(2500);
    const result = await page.send('Page.captureScreenshot', { format: 'png' });
    if (process.env.DSH_E2E_OUT) await writeFile(join(process.env.DSH_E2E_OUT, `canvas-${scheme}.png`), Buffer.from(result.data, 'base64'));
    return decodePng(Buffer.from(result.data, 'base64'));
  };
  const light = await capture('light');
  const dark = await capture('dark');
  assert.ok(countColor(light, [244, 244, 244]) > 10_000, `light canvas should be #F4F4F4: ${JSON.stringify(dominantColors(light))}`);
  assert.ok(countColor(dark, [255, 255, 255]) > 10_000, `dark canvas should be white: ${JSON.stringify(dominantColors(dark))}`);
});
