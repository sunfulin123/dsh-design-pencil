import { readFile } from 'node:fs/promises';
import { basename, dirname, extname, resolve } from 'node:path';
import { captureHtmlPage, clampViewport } from './html-browser-capture.mjs';
import { registerPageFonts } from './html-fonts.mjs';
import { fetchRemoteHtmlWithResources, validateExternalUrl } from './html-sources.mjs';

const BOARD_GAP = 200;
const MAX_VIEWPORTS = 4;
const NODE_ONLY_ARGS = [
  'viewports',
  'viewportWidth',
  'renderMode',
  'readyExpression',
  'waitMs',
  'timeoutMs',
  'fetchFonts',
];

function toolResult(value, isError = false) {
  return {
    isError,
    content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }],
    ...(isError ? {} : { structuredContent: value }),
  };
}

export function parseRenderMode(raw) {
  const mode = raw === undefined || raw === null || raw === '' ? 'auto' : String(raw);
  if (!['auto', 'browser', 'static'].includes(mode)) {
    throw new Error('renderMode: expected auto, browser or static');
  }
  return mode;
}

/** `viewports` accepts `[1440, 390]`, `[{width, height}]` or `"1440,768,390"`. */
export function parseViewports(args) {
  const height = Number(args.viewportHeight) || 900;
  let list = args.viewports;
  if (typeof list === 'string')
    list = list
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  if (!Array.isArray(list) || list.length === 0) list = [Number(args.viewportWidth) || 1440];
  if (list.length > MAX_VIEWPORTS) throw new Error(`viewports: at most ${MAX_VIEWPORTS} widths`);
  return list.map((item) => {
    const width = typeof item === 'object' && item ? item.width : item;
    if (!Number.isFinite(Number(width)) || Number(width) <= 0) {
      throw new Error('viewports: expected positive widths in CSS pixels');
    }
    return clampViewport(width, (typeof item === 'object' && item?.height) || height);
  });
}

function isZip(bytes) {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

export async function resolveHtmlSource(name, args) {
  if (name === 'import_html_url') {
    if (typeof args.url !== 'string' || !args.url.trim()) return null;
    return { targetUrl: validateExternalUrl(args.url.trim()).href };
  }
  if (typeof args.html === 'string' && args.html.trim()) {
    return { htmlBytes: Buffer.from(args.html, 'utf8'), baseDir: null };
  }
  const rawPath = args.htmlPath ?? args.html_path;
  if (typeof rawPath !== 'string' || !rawPath.trim()) return null;
  const fullPath = resolve(rawPath.trim());
  const htmlBytes = await readFile(fullPath);
  if (isZip(htmlBytes)) return null;
  return { htmlBytes, baseDir: dirname(fullPath), name: basename(fullPath, extname(fullPath)) };
}

function collectIds(document) {
  const parents = new Map();
  const walk = (nodes, parent) => {
    for (const node of nodes ?? []) {
      if (!node?.id) continue;
      parents.set(node.id, parent);
      walk(node.children, node.id);
    }
  };
  walk(document?.children, null);
  for (const page of document?.pages ?? []) walk(page.children, null);
  return parents;
}

function insertedRoots(before, after) {
  return [...after.entries()]
    .filter(([id, parent]) => !before.has(id) && (parent === null || before.has(parent)))
    .map(([id]) => id);
}

function stripNodeArgs(args) {
  const rest = { ...args };
  for (const key of NODE_ONLY_ARGS) delete rest[key];
  return rest;
}

async function staticFallback(name, args, deps, warning) {
  let result;
  if (name === 'import_html_url') {
    const fetched = await fetchRemoteHtmlWithResources(args.url.trim());
    result = deps.invoke('import_html_url', {
      ...stripNodeArgs(args),
      html: fetched.html,
      baseUrl: fetched.finalUrl,
      sourceUrl: fetched.finalUrl,
      ...(Object.keys(fetched.resources).length
        ? { resourcesJson: JSON.stringify(fetched.resources) }
        : {}),
    });
  } else {
    result = deps.callTool('import_html', stripNodeArgs(args));
  }
  if (result?.isError || !result?.structuredContent) return result;
  const warnings = [result.structuredContent.warnings, warning].filter(Boolean).join('\n');
  return toolResult({ ...result.structuredContent, renderMode: 'static-css', warnings });
}

async function importCaptures(captures, args, deps, sourceName) {
  const boards = [];
  const warnings = [];
  let nodeCount = 0;
  let x = Number(args.x) || 0;
  const y = Number(args.y) || 0;
  for (const capture of captures) {
    const snapshot = JSON.parse(capture.snapshot);
    if (sourceName && !snapshot.title) snapshot.title = sourceName;
    if (captures.length > 1)
      snapshot.title = `${snapshot.title || 'HTML Import'} · ${capture.width}px`;
    const before = collectIds(deps.document());
    const result = deps.invoke('import_web_snapshot', {
      snapshot: JSON.stringify(snapshot),
      x: String(Math.round(x)),
      y: String(Math.round(y)),
      ...(args.parent ? { parent: args.parent } : {}),
      ...(args.pageId ? { pageId: args.pageId } : {}),
    });
    if (result?.isError) return { error: result };
    const value = result?.structuredContent ?? {};
    nodeCount += Number(value.nodeCount) || 0;
    if (value.warnings) warnings.push(...String(value.warnings).split('\n'));
    warnings.push(...capture.warnings);
    const rootIds = insertedRoots(before, collectIds(deps.document()));
    boards.push({ rootId: rootIds[0] ?? null, width: capture.width, height: capture.height });
    x += capture.width + BOARD_GAP;
  }
  return { boards, warnings, nodeCount };
}

/**
 * Import HTML by rendering it in a real browser and importing the computed
 * snapshot, so layout, fonts and script-built DOM match what the page shows.
 * Falls back to the static CSS importer when no Chromium is available.
 */
export async function importHtmlTool(name, args, deps) {
  try {
    return await runImport(name, args, deps);
  } catch (error) {
    return toolResult(error instanceof Error ? error.message : String(error), true);
  }
}

async function runImport(name, args, deps) {
  let mode;
  let source;
  let viewports;
  try {
    mode = parseRenderMode(args.renderMode);
    viewports = parseViewports(args);
    source = await resolveHtmlSource(name, args);
  } catch (error) {
    return toolResult(error instanceof Error ? error.message : String(error), true);
  }
  if (!source) return null;
  if (mode === 'static') return staticFallback(name, args, deps, null);
  let capture = null;
  let failure = null;
  try {
    capture = await captureHtmlPage({
      ...source,
      viewports,
      readyExpression: typeof args.readyExpression === 'string' ? args.readyExpression : null,
      waitMs: Math.max(0, Math.min(30_000, Number(args.waitMs) || 0)),
      timeoutMs: Math.max(5000, Math.min(120_000, Number(args.timeoutMs) || 30_000)),
    });
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
  }
  if (!capture) {
    const reason = failure ?? 'no Chrome/Chromium found (set CHROME_PATH)';
    if (mode === 'browser') return toolResult(`Browser render failed: ${reason}`, true);
    return staticFallback(
      name,
      args,
      deps,
      `Browser render unavailable (${reason}); used the static CSS importer, which cannot run scripts and approximates layout`,
    );
  }
  const imported = await importCaptures(capture.captures, args, deps, source.name);
  if (imported.error) return imported.error;
  const fonts =
    args.fetchFonts === false || args.fetchFonts === 'false' || !deps.fonts
      ? { faces: [], warnings: [] }
      : await registerPageFonts(capture.captures, { fetcher: deps.fonts, baseDir: source.baseDir });
  const warnings = [...new Set([...imported.warnings, ...fonts.warnings].filter(Boolean))];
  return toolResult({
    wrote: 'true',
    nodeCount: String(imported.nodeCount),
    renderMode: 'browser-snapshot',
    boards: imported.boards,
    rootIds: imported.boards.map((board) => board.rootId).filter(Boolean),
    fonts: fonts.faces,
    warnings: warnings.join('\n'),
  });
}
