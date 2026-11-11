#!/usr/bin/env node
/** Capture a local POC using the runtime's real Chromium renderer. */
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const renderer = [
  new URL('../../../chrome-cdp.mjs', import.meta.url),
  new URL('../../../../../packages/dsh-node-runtime/chrome-cdp.mjs', import.meta.url),
].find(candidate => existsSync(fileURLToPath(candidate)));
if (!renderer) throw new Error('The Synapse Chromium renderer is unavailable');
const { launchHeadlessPage } = await import(renderer.href);

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  if (!process.argv[i].startsWith('--') || process.argv[i + 1] === undefined) throw new Error('Use --url <local page> --out <png> [--width <px>] [--height <px>]');
  args.set(process.argv[i], process.argv[i + 1]);
}
const source = args.get('--url');
const output = args.get('--out');
const width = Number(args.get('--width') ?? 1440);
const height = Number(args.get('--height') ?? 900);
if (!source || !output || !/\.png$/i.test(output) || !Number.isInteger(width) || !Number.isInteger(height)
  || width < 200 || width > 4096 || height < 200 || height > 4096) throw new Error('A local URL, PNG output, and viewport between 200 and 4096 pixels are required');
let url;
if (/^https?:/i.test(source)) {
  url = new URL(source);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('Only local POC servers may be captured');
} else url = pathToFileURL(resolve(source));
const page = await launchHeadlessPage({ width, height });
if (!page) throw new Error('Chrome or Chromium is unavailable; the POC screenshot was not captured');
try {
  await page.send('Page.enable');
  await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  const navigation = await page.send('Page.navigate', { url: url.href });
  if (navigation.errorText) throw new Error(`POC navigation failed: ${navigation.errorText}`);
  let ready = false;
  for (let attempt = 0; attempt < 150; attempt += 1) {
    try { ready = await page.evaluate("document.readyState === 'complete' && location.href !== 'about:blank'"); } catch { /* Navigation may still be in progress. */ }
    if (ready) break;
    await delay(100);
  }
  if (!ready) throw new Error('The POC did not finish loading');
  await page.evaluate('document.fonts ? document.fonts.ready.then(() => true) : true', { awaitPromise: true });
  const result = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const png = Buffer.from(result.data, 'base64');
  if (png.length < 24) throw new Error('The browser returned an empty screenshot');
  const path = resolve(output);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, png);
  console.log(JSON.stringify({ path, renderer: 'Chromium', url: url.href, width, height,
    sha256: createHash('sha256').update(png).digest('hex'), capturedAt: new Date().toISOString() }));
} finally {
  await page.close();
}
