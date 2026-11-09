import { createRequire } from 'node:module';
import { launchHeadlessPage } from './chrome-cdp.mjs';
import { describePage, isolateMedia, pageCall, settlePage } from './html-capture-page.mjs';
import { startLocalHtmlServer } from './html-local-server.mjs';
import { augmentSnapshot } from './html-snapshot-augment.mjs';

const require = createRequire(import.meta.url);
const { DesignEngine } = require('./wasm/op_dsh_engine.js');

export { discoverChromiumBinary } from './chrome-cdp.mjs';
export { startLocalHtmlServer } from './html-local-server.mjs';

const MAX_PAGE_HEIGHT = 16_384;
const MAX_MEDIA = 24;
const MAX_MEDIA_EDGE = 4096;
const MAX_MEDIA_BYTES = 24 * 1024 * 1024;
const NETWORK_IDLE_MS = 500;

export function clampViewport(width, height) {
  return {
    width: Math.max(320, Math.min(3840, Math.round(Number(width) || 1440))),
    height: Math.max(320, Math.min(4096, Math.round(Number(height) || 900))),
  };
}

/** Resolve once no request has been in flight for `NETWORK_IDLE_MS`, or at the deadline. */
function trackNetworkIdle(page) {
  let inflight = 0;
  let lastChange = Date.now();
  const bump = (delta) => {
    inflight = Math.max(0, inflight + delta);
    lastChange = Date.now();
  };
  const stops = [
    page.on('Network.requestWillBeSent', () => bump(1)),
    page.on('Network.loadingFinished', () => bump(-1)),
    page.on('Network.loadingFailed', () => bump(-1)),
  ];
  const reset = () => {
    inflight = 0;
    lastChange = Date.now();
  };
  const wait = async (deadline) => {
    while (Date.now() < deadline) {
      if (inflight === 0 && Date.now() - lastChange >= NETWORK_IDLE_MS) return true;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return false;
  };
  return { reset, wait, stop: () => stops.forEach((stop) => stop()) };
}

// Narrow boards emulate touch (so `hover`/`pointer` media queries match a
// phone) but not `mobile`: without a viewport meta tag mobile emulation lays
// the page out 980px wide, and the board must show the requested width.
async function setViewport(page, width, height) {
  await page.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await page.send('Emulation.setTouchEmulationEnabled', { enabled: width < 600 });
}

async function navigate(page, network, url, deadline) {
  let loaded;
  const fired = new Promise((resolve) => {
    loaded = resolve;
  });
  const stop = page.on('Page.loadEventFired', () => loaded());
  network.reset();
  try {
    await page.send('Page.navigate', { url });
    await Promise.race([
      fired,
      new Promise((resolve) => setTimeout(resolve, Math.max(0, deadline - Date.now()))),
    ]);
  } finally {
    stop();
  }
  return network.wait(Math.min(deadline, Date.now() + 8000));
}

async function captureMediaPixels(page, media, warnings) {
  const pixels = [];
  let bytes = 0;
  await page.send('Emulation.setDefaultBackgroundColorOverride', {
    color: { r: 0, g: 0, b: 0, a: 0 },
  });
  try {
    for (const item of media) {
      const { x, y, w, h } = item.rect;
      if (w < 1 || h < 1 || w > MAX_MEDIA_EDGE || h > MAX_MEDIA_EDGE) {
        warnings.push(
          `<${item.tag}> pixels skipped: ${Math.round(w)}x${Math.round(h)} exceeds limits`,
        );
        continue;
      }
      await page.evaluate(pageCall(isolateMedia, { index: item.index }));
      const shot = await page.send('Page.captureScreenshot', {
        format: 'png',
        clip: { x, y, width: w, height: h, scale: 2 },
        captureBeyondViewport: true,
        fromSurface: true,
      });
      const data = typeof shot?.data === 'string' ? shot.data : '';
      bytes += data.length;
      if (!data || bytes > MAX_MEDIA_BYTES) {
        warnings.push(`<${item.tag}> pixels skipped: capture budget exhausted`);
        break;
      }
      pixels.push({ tag: item.tag, rect: item.rect, src: `data:image/png;base64,${data}` });
    }
  } finally {
    await page.evaluate(pageCall(isolateMedia, { index: null })).catch(() => {});
    await page.send('Emulation.setDefaultBackgroundColorOverride', {}).catch(() => {});
  }
  return pixels;
}

/**
 * Load `url` at `viewport`, settle it (network, fonts, ready probe, lazy
 * media) and grow the viewport to the full document height so the whole
 * page is laid out and paintable in one surface.
 */
export async function renderPage(page, network, url, viewport, options) {
  const warnings = [];
  const deadline = Date.now() + options.timeoutMs;
  await setViewport(page, viewport.width, viewport.height);
  if (!(await navigate(page, network, url, deadline))) {
    warnings.push('network did not become idle before capture; late resources may be missing');
  }
  const settled = await page.evaluate(
    pageCall(settlePage, {
      readyExpression: options.readyExpression || null,
      waitMs: options.waitMs ?? 0,
      maxWaitMs: Math.max(1000, deadline - Date.now()),
    }),
    { awaitPromise: true, evalTimeoutMs: options.timeoutMs + 2000 },
  );
  warnings.push(...(settled?.warnings ?? []));
  const measured = Math.ceil(Number(settled?.height) || viewport.height);
  const fullHeight = Math.min(Math.max(measured, viewport.height), MAX_PAGE_HEIGHT);
  if (measured > MAX_PAGE_HEIGHT) warnings.push(`page truncated at ${MAX_PAGE_HEIGHT}px tall`);
  if (fullHeight > viewport.height) {
    await setViewport(page, viewport.width, fullHeight);
    await network.wait(Math.min(deadline + 2000, Date.now() + 3000));
    await page.evaluate('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))', {
      awaitPromise: true,
    });
  }
  return { fullHeight, warnings };
}

async function captureViewport(page, network, url, viewport, options, extractorScript) {
  const { fullHeight, warnings } = await renderPage(page, network, url, viewport, options);
  const facts = await page.evaluate(pageCall(describePage, { maxMedia: MAX_MEDIA }));
  const json = await page.evaluate(
    `(() => { globalThis.openpencilSnapshotOptions = { returnOnly: true };
      const snap = ${extractorScript}; return snap ? JSON.stringify(snap) : null; })()`,
  );
  if (typeof json !== 'string' || !json.startsWith('{'))
    throw new Error('Snapshot extraction failed');
  const snapshot = JSON.parse(json);
  const mediaPixels = options.pixelMedia
    ? await captureMediaPixels(page, facts?.media ?? [], warnings)
    : [];
  augmentSnapshot(snapshot, { controls: facts?.controls ?? [], mediaPixels });
  return {
    width: viewport.width,
    height: fullHeight,
    snapshot: JSON.stringify(snapshot),
    fonts: facts?.fonts ?? [],
    fontSources: facts?.fontSources ?? [],
    warnings,
  };
}

/**
 * Run `fn(page, network, url)` against one throwaway headless browser that
 * serves `htmlBytes` (with `baseDir` assets) or opens `targetUrl`. Returns
 * `null` when no Chromium is installed.
 */
export async function withBrowser({ htmlBytes, baseDir, targetUrl, viewport, timeoutMs }, fn) {
  const page = await launchHeadlessPage({ ...viewport, timeoutMs });
  if (!page) return null;
  let localServer = null;
  let network = null;
  try {
    const url = targetUrl ?? (localServer = await startLocalHtmlServer(htmlBytes, baseDir)).url;
    network = trackNetworkIdle(page);
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Network.enable');
    return await fn(page, network, url);
  } finally {
    network?.stop();
    await page.close();
    await localServer?.close().catch(() => {});
  }
}

/**
 * Render HTML in a real headless Chromium and capture one DOM/style snapshot
 * per viewport. Returns `null` when no Chromium is available so callers can
 * fall back to the static importer.
 */
export async function captureHtmlPage({
  htmlBytes,
  baseDir,
  targetUrl,
  viewports = [{ width: 1440, height: 900 }],
  readyExpression,
  waitMs = 0,
  timeoutMs = 20_000,
  pixelMedia = true,
} = {}) {
  const extractorScript =
    typeof DesignEngine.snapshot_extractor_script === 'function'
      ? DesignEngine.snapshot_extractor_script()
      : null;
  if (!extractorScript) return null;
  const sizes = viewports.map((viewport) => clampViewport(viewport.width, viewport.height));
  const options = { readyExpression, waitMs, timeoutMs, pixelMedia };
  const captures = await withBrowser(
    { htmlBytes, baseDir, targetUrl, viewport: sizes[0], timeoutMs },
    async (page, network, url) => {
      const list = [];
      for (const size of sizes) {
        // oxlint-disable-next-line no-await-in-loop -- one page renders each viewport in turn
        list.push(await captureViewport(page, network, url, size, options, extractorScript));
      }
      return list;
    },
  );
  return captures ? { captures } : null;
}

/** Single-viewport snapshot JSON, or `null` when the browser path is unavailable. */
export async function captureHtmlSnapshotWithBrowser({
  htmlBytes,
  baseDir,
  targetUrl,
  viewportWidth = 1440,
  viewportHeight = 900,
  timeoutMs = 15_000,
}) {
  try {
    const result = await captureHtmlPage({
      htmlBytes,
      baseDir,
      targetUrl,
      viewports: [{ width: viewportWidth, height: viewportHeight }],
      timeoutMs,
    });
    return result?.captures?.[0]?.snapshot ?? null;
  } catch {
    return null;
  }
}
