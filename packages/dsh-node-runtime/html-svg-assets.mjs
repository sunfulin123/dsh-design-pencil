/** Read SVG bytes that Chromium fetched as images in the authorized capture. */
const pages = new WeakMap();
const MAX_TRACKED_REQUESTS = 512;
const MAX_SVG_BYTES = 2 * 1024 * 1024;
const MAX_PNG_BYTES = 24 * 1024 * 1024;

export function observeSvgDownloads(page) {
  const requested = new Map();
  const downloaded = new Map();
  pages.set(page, downloaded);
  const stops = [
    page.on('Network.requestWillBeSent', event => {
      if (event.type !== 'Image' || requested.has(event.requestId)) return;
      if (requested.size >= MAX_TRACKED_REQUESTS) requested.delete(requested.keys().next().value);
      requested.set(event.requestId, event.request.url);
    }),
    page.on('Network.responseReceived', event => {
      const { mimeType, status, url } = event.response;
      if (event.type !== 'Image' || mimeType !== 'image/svg+xml' || status < 200 || status >= 400) return;
      const original = requested.get(event.requestId);
      for (const source of new Set([original, url])) {
        if (!source) continue;
        if (downloaded.size >= MAX_TRACKED_REQUESTS) downloaded.delete(downloaded.keys().next().value);
        downloaded.set(source, event.requestId);
      }
    }),
  ];
  return () => stops.forEach(stop => stop());
}

async function rasterizeDownloadedSvg({ source, displayEdge }) {
  const image = new Image();
  image.src = source;
  await image.decode();
  const { naturalWidth, naturalHeight } = image;
  if (!naturalWidth || !naturalHeight) return null;
  const naturalEdge = Math.max(naturalWidth, naturalHeight);
  const scale = Math.min(2048, Math.max(naturalEdge, displayEdge) * 2) / naturalEdge;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(naturalHeight * scale));
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

/** Embed a transparent bitmap of the downloaded SVG before attempting a compositor crop. */
export async function embedDownloadedSvgImages(page, images, budget) {
  const downloads = pages.get(page);
  if (!downloads?.size) return;
  const groups = new Map();
  for (const { node, rect } of images) {
    if (!downloads.has(node.src)) continue;
    if (!groups.has(node.src)) groups.set(node.src, []);
    groups.get(node.src).push({ node, rect });
  }
  const deadline = Date.now() + 5000;
  for (const [url, targets] of [...groups].slice(0, 64)) {
    if (Date.now() >= deadline) break;
    try {
      // The browser may evict a response or reject rendering it as a data URL.
      // In either case the caller retains the original visible paint fallback.
      const { body, base64Encoded } = await page.send(
        'Network.getResponseBody', { requestId: downloads.get(url) }, Math.min(2500, deadline - Date.now()),
      );
      const bytes = Buffer.from(body, base64Encoded ? 'base64' : 'utf8');
      if (!bytes.length || bytes.length > MAX_SVG_BYTES || Date.now() >= deadline) continue;
      const source = `data:image/svg+xml;base64,${bytes.toString('base64')}`;
      const displayEdge = Math.max(...targets.map(({ rect }) => Math.max(rect.w, rect.h)));
      const png = await page.evaluate(
        `(${rasterizeDownloadedSvg})(${JSON.stringify({ source, displayEdge })})`,
        { awaitPromise: true, evalTimeoutMs: Math.min(2500, deadline - Date.now()) },
      );
      if (!png?.startsWith('data:image/png;base64,')) continue;
      const size = png.length * targets.length;
      if (budget.bytes + size > MAX_PNG_BYTES) continue;
      budget.bytes += size;
      for (const { node } of targets) Object.assign(node, { src: png, tainted: false });
    } catch {
      // A screenshot can preserve visible images when the response bytes are unavailable.
    }
  }
}
