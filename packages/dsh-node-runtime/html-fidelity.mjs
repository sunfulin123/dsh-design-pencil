import { pageCall } from './html-capture-page.mjs';
import { clampViewport, renderPage, withBrowser } from './html-browser-capture.mjs';
import { resolveHtmlSource } from './html-import-tool.mjs';
import { cropImage, decodePng, diffImages } from './png-diff.mjs';

const BAND_HEIGHT = 200; // in screenshot pixels
const MAX_EDGE = 4096;
const PASS_RATIO = 0.05;
const PASS_TEXT = 0.98;

/** Visible text runs of the rendered page, in document order. */
function visibleTextRuns() {
  const runs = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent.replace(/\s+/g, ' ').trim();
    const parent = node.parentElement;
    if (text.length < 2 || !parent || parent.closest('script,style,noscript,template')) continue;
    const style = getComputedStyle(parent);
    const rect = parent.getBoundingClientRect();
    if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0)
      continue;
    if (rect.width < 1 || rect.height < 1) continue;
    runs.push(text);
  }
  return runs;
}

// Whitespace-insensitive: a word hyphen-broken across lines imports as
// "30-" + "day", which reads back with a space the source never had.
function normalized(text) {
  return String(text).replace(/\s+/g, '').toLowerCase();
}

function textContent(node) {
  return Array.isArray(node?.content)
    ? node.content.map((segment) => segment?.text ?? '').join('')
    : String(node?.content ?? node?.text ?? '');
}

/**
 * Imported paragraphs under `root`: a wrapped paragraph imports as sibling
 * line nodes stored front-to-back, so lines are re-read in reading order
 * (top to bottom, then left to right) and joined per parent.
 */
function importedParagraphs(document, root) {
  const byId = new Map();
  const index = (nodes) => {
    for (const node of nodes ?? []) {
      if (!node?.id) continue;
      byId.set(node.id, node);
      index(node.children);
    }
  };
  index(document?.children);
  for (const page of document?.pages ?? []) index(page.children);
  const paragraphs = [];
  const visit = (layoutNode) => {
    if (byId.get(layoutNode.id)?.visible === false) return;
    const lines = (layoutNode.children ?? [])
      .filter((child) => child.type === 'text' && byId.get(child.id)?.visible !== false)
      .sort((a, b) => (Math.abs(a.y - b.y) > 2 ? a.y - b.y : a.x - b.x));
    if (lines.length)
      paragraphs.push(lines.map((line) => textContent(byId.get(line.id))).join(' '));
    for (const child of layoutNode.children ?? []) visit(child);
  };
  visit(root);
  return paragraphs;
}

function textCoverage(sourceRuns, imported) {
  const blob = normalized(imported.join(' \u0001 '));
  const missing = sourceRuns.filter((run) => !blob.includes(normalized(run)));
  return {
    expected: sourceRuns.length,
    matched: sourceRuns.length - missing.length,
    ratio: sourceRuns.length ? (sourceRuns.length - missing.length) / sourceRuns.length : 1,
    missing: missing.slice(0, 20),
    missingCount: missing.length,
  };
}

function bandsOf(source, imported, tolerance, scale) {
  const bands = [];
  for (let top = 0; top < source.height; top += BAND_HEIGHT) {
    const height = Math.min(BAND_HEIGHT, source.height - top);
    const slice = (image) => ({
      width: image.width,
      height,
      pixels: image.pixels.subarray(top * image.width * 4, (top + height) * image.width * 4),
    });
    const diff = diffImages(slice(source), slice(imported), tolerance);
    bands.push({
      y: Math.round(top / scale),
      height: Math.round(height / scale),
      ratio: Math.round(diff.ratio * 10_000) / 10_000,
    });
  }
  return bands;
}

function layoutIndex(layout) {
  const nodes = [];
  const walk = (list, depth) => {
    for (const node of list ?? []) {
      nodes.push({ ...node, depth });
      walk(node.children, depth + 1);
    }
  };
  walk(layout, 0);
  return nodes;
}

/**
 * Compare an imported board with its HTML source rendered in a real
 * browser: pixel mismatch overall, per 200px band and per hot region (with
 * the imported layers there), plus visible-text coverage.
 */
export async function compareHtmlFidelity(args, { capture, layout, version, document }) {
  if (typeof args.nodeId !== 'string' || !args.nodeId) throw new Error('nodeId is required');
  const tolerance = Number(args.tolerance ?? 24);
  if (!Number.isInteger(tolerance) || tolerance < 0 || tolerance > 96) {
    throw new Error('tolerance: expected an integer from 0 to 96');
  }
  const name = typeof args.url === 'string' && args.url.trim() ? 'import_html_url' : 'import_html';
  const source = await resolveHtmlSource(name, args);
  if (!source) throw new Error('html, htmlPath or url is required');
  const before = version();
  const actual = layout();
  if (actual?.isError) throw new Error(actual.content?.[0]?.text ?? 'Layout unavailable');
  const nodes = layoutIndex(actual?.structuredContent?.layout);
  const root = nodes.find((node) => node.id === args.nodeId);
  if (!root) throw new Error('nodeId is not on the active page');
  const viewport = clampViewport(args.viewportWidth ?? root.width, args.viewportHeight ?? 900);
  // get_screenshot caps the longest edge at 4096px; render the source at the
  // same scale so tall mobile boards stay comparable.
  const scale = Math.min(1, MAX_EDGE / Math.max(root.width, root.height));
  const timeoutMs = Math.max(5000, Math.min(120_000, Number(args.timeoutMs) || 30_000));
  const rendered = await withBrowser(
    { ...source, viewport, timeoutMs },
    async (page, network, url) => {
      const { fullHeight, warnings } = await renderPage(page, network, url, viewport, {
        readyExpression: typeof args.readyExpression === 'string' ? args.readyExpression : null,
        waitMs: Math.max(0, Math.min(30_000, Number(args.waitMs) || 0)),
        timeoutMs,
      });
      const shot = await page.send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 0, width: viewport.width, height: fullHeight, scale },
        captureBeyondViewport: true,
      });
      const runs = await page.evaluate(pageCall(visibleTextRuns));
      // The import's board is the captured <body> box, which a short page does
      // not stretch to the viewport the full-page screenshot covers.
      const bodyBottom = await page.evaluate(
        'Math.ceil(document.body.getBoundingClientRect().bottom + window.scrollY)',
      );
      return { png: Buffer.from(shot.data, 'base64'), runs, warnings, bodyBottom };
    },
  );
  if (!rendered) throw new Error('compare_html_fidelity needs Chrome/Chromium (set CHROME_PATH)');
  const screenshot = await capture(
    { nodeId: args.nodeId, scale, maxSize: MAX_EDGE, background: 'canvas', isolate: true },
    before,
  );
  const image = screenshot?.content?.find((item) => item.type === 'image');
  let visual;
  if (screenshot?.isError || !image) {
    visual = {
      comparable: false,
      reason: screenshot?.content?.[0]?.text ?? 'Editor screenshot unavailable',
    };
  } else {
    const sourceImage = decodePng(rendered.png);
    const importedImage = decodePng(Buffer.from(image.data, 'base64'));
    if (Math.abs(sourceImage.width - importedImage.width) > 2) {
      visual = {
        comparable: false,
        reason: 'width-mismatch',
        source: [sourceImage.width, sourceImage.height],
        imported: [importedImage.width, importedImage.height],
      };
    } else {
      const width = Math.min(sourceImage.width, importedImage.width);
      const height = Math.min(sourceImage.height, importedImage.height);
      const a = cropImage(sourceImage, width, height);
      const b = cropImage(importedImage, width, height);
      visual = {
        ...diffImages(a, b, tolerance),
        scale,
        sourceHeight: Math.min(
          Math.round(sourceImage.height / scale),
          rendered.bodyBottom || Infinity,
        ),
        importedHeight: Math.round(importedImage.height / scale),
        bands: bandsOf(a, b, tolerance, scale),
      };
      for (const region of visual.regions ?? []) {
        region.nodes = nodes
          .filter((node) => {
            const x = (node.x - root.x) * scale;
            const y = (node.y - root.y) * scale;
            return (
              node.depth > root.depth &&
              x < region.x + region.width &&
              x + node.width * scale > region.x &&
              y < region.y + region.height &&
              y + node.height * scale > region.y
            );
          })
          .sort((left, right) => right.depth - left.depth)
          .slice(0, 5)
          .map((node) => ({ id: node.id, name: node.name }));
      }
      visual.regions = visual.regions?.slice(0, 10);
    }
  }
  if (version() !== before)
    throw new Error('Document changed while comparing; run comparison again');
  const text = textCoverage(rendered.runs, importedParagraphs(document(), root));
  const report = {
    nodeId: args.nodeId,
    viewport,
    visual,
    text,
    warnings: rendered.warnings,
    verified:
      visual.comparable === true &&
      visual.ratio <= PASS_RATIO &&
      Math.abs(visual.sourceHeight - visual.importedHeight) <=
        Math.max(2, 2 / (visual.scale ?? 1)) &&
      text.ratio >= PASS_TEXT,
    note: `Source is rendered by headless Chromium, the board by CanvasKit; antialiasing and font hinting differ, so a faithful import still shows a small ratio at tolerance ${tolerance}. Passing needs ratio <= ${PASS_RATIO}, equal heights and >= ${PASS_TEXT * 100}% visible text.`,
  };
  return {
    isError: false,
    content: [{ type: 'text', text: JSON.stringify(report) }],
    structuredContent: report,
  };
}
