import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { basename, dirname, extname, resolve } from 'node:path';
import { expandScriptWithVariables } from './script-expansion.mjs';
import { healOperationsParents, preflightDesignScript } from './design-script-preflight.mjs';
export { expandScriptWithVariables } from './script-expansion.mjs';
import { encodeRgbaPng } from './png-encode.mjs';
export { encodeRgbaPng } from './png-encode.mjs';
import { DocumentStore } from './document-store.mjs';
import { DocumentHistory, preserveTemplateExtensions } from './document-history.mjs';
import { enrichSelection } from './selection-enrichment.mjs';
import { saveTextRange, attachTextRange, clearTextRange, isSelectionSetTool } from './selection-text-context.mjs';
import { collectDocumentFonts } from './font-inventory.mjs';
import { FigmaImportJobs } from './figma-import-jobs.mjs';
import { FigmaApiError, parseFigmaWebUrl, figmaRequestTimeoutMs } from './figma-rest-client.mjs';
import { importHtmlTool } from './html-import-tool.mjs';
import { collectLocalHtmlResources, validateExternalUrl } from './html-sources.mjs';
export { convertHtmlToDocument } from './html-import.mjs';

const require = createRequire(import.meta.url);
const { DesignEngine } = require('./wasm/op_dsh_engine.js');

const SPACING_GRID = [
  0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 72, 80, 96, 112, 120, 128, 160,
];
const RADIUS_SCALE = [0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 999, 9999];
const FONT_SCALE = [10, 11, 12, 13, 14, 15, 16, 18, 20, 24, 28, 32, 36, 40, 42, 48, 56, 64, 72];

function snapToNearestScale(val, scale, stepFallback) {
  if (typeof val !== 'number' || !Number.isFinite(val)) return val;
  if (val <= 0) return 0;
  let best = scale[0];
  let bestDiff = Math.abs(val - best);
  for (let i = 1; i < scale.length; i += 1) {
    const diff = Math.abs(val - scale[i]);
    if (diff < bestDiff) {
      best = scale[i];
      bestDiff = diff;
    }
  }
  if (stepFallback > 0 && val > scale[scale.length - 1]) {
    return Math.round(val / stepFallback) * stepFallback;
  }
  return best;
}

export function normalizeNodeAestheticPayload(raw, isPatch = false, options = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  if (isPatch || options.preserveAuthoredGeometry === true) return { ...raw };
  const out = { ...raw };
  if (typeof out.gap === 'number' && Number.isFinite(out.gap)) {
    out.gap = snapToNearestScale(out.gap, SPACING_GRID, 8);
  }
  if (typeof out.padding === 'number' && Number.isFinite(out.padding)) {
    out.padding = snapToNearestScale(out.padding, SPACING_GRID, 8);
  } else if (Array.isArray(out.padding)) {
    out.padding = out.padding.map((item) =>
      typeof item === 'number' && Number.isFinite(item)
        ? snapToNearestScale(item, SPACING_GRID, 8)
        : item,
    );
  }
  if (typeof out.cornerRadius === 'number' && Number.isFinite(out.cornerRadius)) {
    out.cornerRadius =
      out.cornerRadius >= 100
        ? out.cornerRadius >= 999
          ? out.cornerRadius
          : 999
        : snapToNearestScale(out.cornerRadius, RADIUS_SCALE, 4);
  } else if (Array.isArray(out.cornerRadius)) {
    out.cornerRadius = out.cornerRadius.map((item) =>
      typeof item === 'number' && Number.isFinite(item)
        ? item >= 100
          ? item >= 999
            ? item
            : 999
          : snapToNearestScale(item, RADIUS_SCALE, 4)
        : item,
    );
  }
  if (typeof out.fontSize === 'number' && Number.isFinite(out.fontSize) && out.fontSize > 0) {
    out.fontSize = snapToNearestScale(out.fontSize, FONT_SCALE, 4);
  }
  if ((out.type === 'text' || isPatch) && out.fontFamily === 'Inter') {
    out.fontFamily = 'Inter, system-ui, sans-serif';
  }
  if (!isPatch && Array.isArray(out.children)) {
    out.children = out.children.map((child) =>
      normalizeNodeAestheticPayload(child, false, options),
    );
  }
  return out;
}

export function expandScriptToOperations(rawScript, options = {}) {
  return expandScriptWithVariables(rawScript, options).operations;
}

const FIGMA_JOB_TOOLS = new Set([
  'get_figma_import_status',
  'list_figma_import_jobs',
  'cancel_figma_import',
  'resume_figma_import',
  'inspect_figma_node',
]);

const DEFAULT_FIGMA_WAIT_MS = 25_000;

function figmaJobResult(job) {
  const failed = job.status === 'failed' || job.status === 'cancelled';
  const text =
    job.status === 'running'
      ? `Import ${job.id} is still running (${job.progress.done}/${job.progress.total} boards). Poll get_figma_import_status with jobId "${job.id}".`
      : JSON.stringify(job);
  return {
    isError: failed,
    content: [
      {
        type: 'text',
        text: failed && job.error ? `[${job.error.code}] ${job.error.message}` : text,
      },
    ],
    structuredContent: job,
  };
}

export function figmaErrorResult(error) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: error instanceof FigmaApiError ? `[${error.code}] ${message}` : message,
      },
    ],
    ...(error instanceof FigmaApiError ? { structuredContent: { error: error.toJSON() } } : {}),
  };
}

export async function convertFigmaToDocument({
  figPath,
  url,
  bytes,
  bytesBase64,
  fileName,
  allowLocalUrl = false,
} = {}) {
  let rawBytes = bytes;
  let resolvedName = fileName;
  if (!rawBytes && typeof bytesBase64 === 'string' && bytesBase64.trim()) {
    rawBytes = Buffer.from(bytesBase64.trim(), 'base64');
  }
  if (!rawBytes && typeof figPath === 'string' && figPath.trim()) {
    const fullPath = resolve(figPath.trim());
    rawBytes = await readFile(fullPath);
    resolvedName ??= basename(fullPath, extname(fullPath)) || 'Figma Import';
  }
  if (!rawBytes && typeof url === 'string' && url.trim()) {
    if (parseFigmaWebUrl(url.trim())) {
      throw new Error(
        'figma.com links are imported by the chunked REST importer (EngineSession.callToolAsync)',
      );
    }
    const validated = validateExternalUrl(url.trim(), allowLocalUrl);
    const response = await fetch(validated, {
      redirect: 'follow',
      signal: AbortSignal.timeout(figmaRequestTimeoutMs()),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${validated.href}`);
    rawBytes = Buffer.from(await response.arrayBuffer());
    resolvedName ??= basename(validated.pathname, extname(validated.pathname)) || 'Figma Import';
  }
  if (!rawBytes) {
    throw new Error('figPath, url, or bytesBase64 is required');
  }
  const textSample = Buffer.from(rawBytes.subarray(0, Math.min(rawBytes.length, 2048)))
    .toString('utf8')
    .trimStart();
  if (
    textSample.startsWith('{') &&
    !textSample.includes('FIGMA_DOCUMENT') &&
    !textSample.includes('"type":"FIGMA"')
  ) {
    const parsed = JSON.parse(Buffer.from(rawBytes).toString('utf8'));
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.children)) {
      return {
        ok: true,
        document: {
          ...parsed,
          editorMeta: { activePageIndex: 0, preserveAuthoredGeometry: true, ...parsed.editorMeta },
        },
        pageCount: Array.isArray(parsed.pages) ? parsed.pages.length : 1,
        nodeCount: parsed.children.length,
        warnings: [],
      };
    }
  }
  if (typeof url === 'string' && url.trim()) {
    // Remote .fig bytes go through the engine's import_figma so they insert
    // into a non-empty document instead of replacing it.
    return {
      bytesBase64: Buffer.from(rawBytes).toString('base64'),
      fileName: resolvedName || 'Figma Import',
    };
  }
  const raw = DesignEngine.convert_figma_document(rawBytes, resolvedName || 'Figma Import');
  return JSON.parse(raw);
}

export async function convertSnapshotToDocument({ snapshot, snapshotPath } = {}) {
  let content = snapshot;
  if (
    (typeof content !== 'string' || !content.trim()) &&
    typeof snapshotPath === 'string' &&
    snapshotPath.trim()
  ) {
    content = await readFile(resolve(snapshotPath.trim()), 'utf8');
  }
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('snapshot or snapshotPath is required');
  }
  return JSON.parse(DesignEngine.convert_snapshot_document(content));
}

function parseHexColor(raw) {
  if (typeof raw !== 'string') return null;
  const hex = raw.trim().replace(/^#/, '');
  if (hex.length === 3) {
    return [
      Number.parseInt(hex[0] + hex[0], 16),
      Number.parseInt(hex[1] + hex[1], 16),
      Number.parseInt(hex[2] + hex[2], 16),
      255,
    ];
  }
  if (hex.length === 6) {
    return [
      Number.parseInt(hex.slice(0, 2), 16),
      Number.parseInt(hex.slice(2, 4), 16),
      Number.parseInt(hex.slice(4, 6), 16),
      255,
    ];
  }
  if (hex.length === 8) {
    return [
      Number.parseInt(hex.slice(0, 2), 16),
      Number.parseInt(hex.slice(2, 4), 16),
      Number.parseInt(hex.slice(4, 6), 16),
      Number.parseInt(hex.slice(6, 8), 16),
    ];
  }
  return null;
}

function resolveVariableColorString(raw, variables) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('$')) return trimmed;
  const varName = trimmed.slice(1);
  const def = variables && typeof variables === 'object' ? variables[varName] : undefined;
  if (def && typeof def === 'object') {
    if (typeof def.value === 'string') return def.value;
    if (
      Array.isArray(def.value) &&
      def.value.length > 0 &&
      typeof def.value[0]?.value === 'string'
    ) {
      return def.value[0].value;
    }
  }
  return null;
}

function firstSolidColor(fill, variables) {
  if (typeof fill === 'string') return parseHexColor(resolveVariableColorString(fill, variables));
  if (Array.isArray(fill)) {
    for (const item of fill) {
      if (
        item &&
        typeof item === 'object' &&
        item.visible !== false &&
        item.enabled !== false &&
        typeof item.color === 'string'
      ) {
        const parsed = parseHexColor(resolveVariableColorString(item.color, variables));
        if (parsed) return parsed;
      }
    }
  } else if (fill && typeof fill === 'object' && typeof fill.color === 'string') {
    return parseHexColor(resolveVariableColorString(fill.color, variables));
  }
  return null;
}

function activePageNodes(document) {
  if (!document || typeof document !== 'object') return [];
  const pages = Array.isArray(document.pages) ? document.pages : null;
  if (pages && pages.length > 0) {
    const idx = Math.max(
      0,
      Math.min(pages.length - 1, Number(document.editorMeta?.activePageIndex ?? 0) || 0),
    );
    const page = pages[idx];
    if (page && Array.isArray(page.children)) return page.children;
  }
  return Array.isArray(document.children) ? document.children : [];
}

function renderDocumentPreviewPng(document, layoutTree, requestedNodeId) {
  const styleById = new Map();
  const collectStyles = (nodes) => {
    for (const node of nodes ?? []) {
      if (!node || typeof node !== 'object') continue;
      if (typeof node.id === 'string') styleById.set(node.id, node);
      if (Array.isArray(node.children)) collectStyles(node.children);
    }
  };
  const roots = activePageNodes(document);
  collectStyles(roots);

  const layoutRoots = Array.isArray(layoutTree)
    ? layoutTree
    : Array.isArray(layoutTree?.layout)
      ? layoutTree.layout
      : layoutTree && typeof layoutTree === 'object' && typeof layoutTree.id === 'string'
        ? [layoutTree]
        : [];

  const findLayoutNode = (items, id) => {
    for (const item of items ?? []) {
      if (!item || typeof item !== 'object') continue;
      if (item.id === id) return item;
      const child = findLayoutNode(item.children, id);
      if (child) return child;
    }
    return null;
  };

  const targetLayout =
    !requestedNodeId || requestedNodeId === 'root'
      ? layoutRoots[0]
      : (findLayoutNode(layoutRoots, requestedNodeId) ?? layoutRoots[0]);
  const targetDocNode = targetLayout?.id ? styleById.get(targetLayout.id) : roots[0];
  const nodeId = targetLayout?.id ?? targetDocNode?.id ?? 'root';
  const rawW = Number(targetLayout?.width ?? targetDocNode?.width ?? 1440);
  const rawH = Number(targetLayout?.height ?? targetDocNode?.height ?? 900);
  const logicalWidth =
    Number.isFinite(rawW) && rawW > 0 ? Math.min(3840, Math.max(64, Math.round(rawW))) : 1440;
  const logicalHeight =
    Number.isFinite(rawH) && rawH > 0 ? Math.min(3840, Math.max(64, Math.round(rawH))) : 900;
  const scale = Math.min(1, 720 / Math.max(logicalWidth, logicalHeight));
  const bmpW = Math.max(64, Math.round(logicalWidth * scale));
  const bmpH = Math.max(64, Math.round(logicalHeight * scale));
  const rgba = Buffer.alloc(bmpW * bmpH * 4);

  const docVariables =
    document &&
    typeof document === 'object' &&
    document.variables &&
    typeof document.variables === 'object'
      ? document.variables
      : null;
  const bg = firstSolidColor(targetDocNode?.fill, docVariables) ?? [244, 240, 232, 255];
  for (let i = 0; i < bmpW * bmpH * 4; i += 4) {
    rgba[i] = bg[0];
    rgba[i + 1] = bg[1];
    rgba[i + 2] = bg[2];
    rgba[i + 3] = 255;
  }

  const fillRect = (x, y, w, h, color) => {
    if (!color) return;
    const x0 = Math.max(0, Math.min(bmpW, Math.round(x * scale)));
    const y0 = Math.max(0, Math.min(bmpH, Math.round(y * scale)));
    const x1 = Math.max(x0, Math.min(bmpW, Math.round((x + w) * scale)));
    const y1 = Math.max(y0, Math.min(bmpH, Math.round((y + h) * scale)));
    const alpha = (color[3] ?? 255) / 255;
    for (let py = y0; py < y1; py += 1) {
      for (let px = x0; px < x1; px += 1) {
        const idx = (py * bmpW + px) * 4;
        rgba[idx] = Math.round(color[0] * alpha + rgba[idx] * (1 - alpha));
        rgba[idx + 1] = Math.round(color[1] * alpha + rgba[idx + 1] * (1 - alpha));
        rgba[idx + 2] = Math.round(color[2] * alpha + rgba[idx + 2] * (1 - alpha));
        rgba[idx + 3] = 255;
      }
    }
  };

  const originX = Number(targetLayout?.x ?? 0) || 0;
  const originY = Number(targetLayout?.y ?? 0) || 0;
  const paintLayoutTree = (item, parentX = 0, parentY = 0) => {
    if (!item || typeof item !== 'object') return;
    const docNode = styleById.get(item.id);
    if (docNode?.visible === false) return;
    const relX = Number(item.x ?? docNode?.x ?? 0) || 0;
    const relY = Number(item.y ?? docNode?.y ?? 0) || 0;
    const absX = item === targetLayout ? 0 : relX - originX + parentX * 0;
    const absY = item === targetLayout ? 0 : relY - originY + parentY * 0;
    const w = Number(item.width ?? docNode?.width ?? 0) || 0;
    const h = Number(item.height ?? docNode?.height ?? 0) || 0;
    const fill = firstSolidColor(docNode?.fill, docVariables);
    if (w > 0 && h > 0) {
      if (docNode?.type === 'text' || item.type === 'text') {
        const textColor = fill ?? [23, 25, 29, 255];
        const barH = Math.max(4, Math.min(h, Number(docNode?.fontSize ?? 16) * 0.65));
        fillRect(absX, absY + Math.max(0, (h - barH) / 2), w * 0.85, barH, [
          textColor[0],
          textColor[1],
          textColor[2],
          190,
        ]);
      } else if (fill) {
        fillRect(absX, absY, w, h, fill);
      } else if (docNode?.type === 'image' || item.type === 'image') {
        fillRect(absX, absY, w, h, [214, 211, 209, 255]);
      }
    }
    if (Array.isArray(item.children)) {
      for (const child of item.children) paintLayoutTree(child, absX, absY);
    }
  };

  if (targetLayout) paintLayoutTree(targetLayout);
  return {
    nodeId,
    width: bmpW,
    height: bmpH,
    bytes: encodeRgbaPng(bmpW, bmpH, rgba),
  };
}


function withCanonicalSavedViewport(document, canonicalMeta) {
  if (!Object.hasOwn(document.editorMeta ?? {}, 'viewport')) return document;
  const editorMeta = { ...document.editorMeta };
  if (canonicalMeta?.viewport === undefined) delete editorMeta.viewport;
  else editorMeta.viewport = canonicalMeta.viewport;
  return { ...document, editorMeta };
}

export class EngineSession {
  #store;
  #engine;
  #documentHistory = new DocumentHistory();
  // Serialized engine document keyed by `document_fingerprint()`, plus the
  // previous entry, so unchanged documents are never re-serialized or
  // re-parsed between tool calls.
  #docCache = null;
  #prevDocCache = null;
  #rememberedKey = null;
  // Store version -> pages changed by that version, for incremental pulls.
  #changeLog = new Map();
  #selectedIds = [];
  #activePageId = null;
  #uiScale = null;
  #pendingUiScale = null;
  #closed = false;
  #figmaJobs = null;
  #figmaJobScope;
  /** Optional hook: called with each imported chunk's font faces. */
  onFigmaFonts = null;
  fontFetcher = null;
  /** Optional hook: a background job (Figma import) changed the document. */
  onBackgroundWrite = null;

  constructor(document, { figmaJobScope = randomUUID() } = {}) {
    this.#figmaJobScope = figmaJobScope;
    this.#store = new DocumentStore(document);
    this.#engine = this.#loadEngine(document);
    if (Object.hasOwn(document.editorMeta ?? {}, 'viewport')) {
      const normalized = withCanonicalSavedViewport(
        document,
        JSON.parse(this.#engine.document_json()).editorMeta,
      );
      this.#store.replace(normalized, 0, { metadataOnly: true });
    }
  }

  snapshot() {
    return this.#store.snapshot();
  }

  version() {
    return this.#store.version();
  }

  revision() {
    return this.#store.revision();
  }

  // Live document without a copy; callers must not mutate it.
  peekDocument() {
    return this.#store.peek();
  }

  // Pages changed after `version` up to the current one. `full` when any
  // step is unknown (whole-document replacement, imports, non-page edits).
  changesSince(version) {
    const current = this.#store.version();
    if (!Number.isSafeInteger(version) || version < 0 || version > current)
      return { full: true, pages: [] };
    const pages = new Set();
    for (let v = version + 1; v <= current; v++) {
      const step = this.#changeLog.get(v);
      if (!step || step.full) return { full: true, pages: [] };
      for (const id of step.pages) pages.add(id);
    }
    return { full: false, pages: [...pages] };
  }

  #recordChanges(version, changes) {
    this.#changeLog.set(version, changes);
    for (const key of this.#changeLog.keys()) {
      if (key <= version - 256) this.#changeLog.delete(key);
      else break;
    }
  }

  #verifyChanges(before, after, changes) {
    if (process.env.DSH_VERIFY_FINGERPRINT !== '1' || changes.full) return;
    const pages = new Map((before.pages ?? []).map((page) => [page.id, JSON.stringify(page)]));
    for (const page of after.pages ?? []) {
      if (!changes.pages.includes(page.id) && pages.get(page.id) !== JSON.stringify(page)) {
        throw new Error(`take_document_changes missed page ${page.id}`);
      }
    }
  }

  #invalidateDocCache() {
    this.#docCache = null;
    this.#prevDocCache = null;
    this.#rememberedKey = null;
  }

  #engineDocJson() {
    const fp = this.#engine.document_fingerprint();
    if (this.#docCache?.fp !== fp) {
      this.#prevDocCache = this.#docCache;
      this.#docCache = { fp, json: this.#engine.document_json(), parsed: undefined };
    }
    return this.#docCache.json;
  }

  #parseDoc(json) {
    for (const entry of [this.#docCache, this.#prevDocCache]) {
      if (entry && entry.json === json) return (entry.parsed ??= JSON.parse(json));
    }
    return JSON.parse(json);
  }

  replace(document, baseVersion, { metadataOnly = false } = {}) {
    this.#assertOpen();
    if (baseVersion !== this.#store.version()) {
      return this.#store.replace(document, baseVersion, { metadataOnly });
    }
    if (metadataOnly && document.editorMeta && typeof document.editorMeta === 'object') {
      const fast = this.#replaceMetadataInPlace(document.editorMeta, baseVersion);
      if (fast) return fast;
    }
    const next = metadataOnly
      ? { ...this.#store.snapshot().document, editorMeta: document.editorMeta }
      : document;
    const engine = this.#loadEngine(next);
    try {
      const canonicalMeta =
        metadataOnly || Object.hasOwn(next.editorMeta ?? {}, 'viewport')
          ? JSON.parse(engine.document_json()).editorMeta
          : undefined;
      const normalized = withCanonicalSavedViewport(next, canonicalMeta);
      const result = this.#store.replace(normalized, baseVersion, { metadataOnly });
      if (result.ok && metadataOnly) {
        this.#engine.update_editor_meta(JSON.stringify(canonicalMeta));
        this.#applySelectionToEngine(this.#engine, normalized);
        engine.free();
      } else if (result.ok) {
        this.#engine.free();
        this.#engine = engine;
        this.#invalidateDocCache();
        this.#documentHistory = new DocumentHistory();
      } else {
        engine.free();
      }
      return result;
    } catch (error) {
      engine.free();
      throw error;
    }
  }

  // Camera / page metadata pushed by the editor: normalize it on the live
  // engine instead of reloading the whole document into a fresh one.
  #replaceMetadataInPlace(editorMeta, baseVersion) {
    const previous = this.#engine.editor_meta_json();
    try {
      this.#engine.update_editor_meta(JSON.stringify(editorMeta));
      const canonicalMeta = JSON.parse(this.#engine.editor_meta_json());
      const normalized = withCanonicalSavedViewport(
        { ...this.#store.peek(), editorMeta },
        canonicalMeta,
      );
      const result = this.#store.replace(normalized, baseVersion, { metadataOnly: true });
      if (!result.ok) {
        this.#engine.update_editor_meta(previous);
        return result;
      }
      this.#engine.update_editor_meta(JSON.stringify(canonicalMeta));
      this.#applySelectionToEngine(this.#engine, this.#store.peek());
      return result;
    } catch {
      try {
        this.#engine.update_editor_meta(previous);
      } catch {}
      return null;
    }
  }

  restoreDocument(document, baseVersion) {
    this.#assertOpen();
    const snapshot = this.#store.snapshot();
    if (baseVersion !== snapshot.version) return this.#store.replace(document, baseVersion);
    const before = JSON.parse(this.#engine.document_json());
    this.#documentHistory.remember(
      snapshot.document,
      before,
      JSON.parse(this.#engine.document_history_json()),
    );
    this.#engine.restore_document(JSON.stringify(document));
    const after = JSON.parse(this.#engine.document_json());
    const history = JSON.parse(this.#engine.document_history_json());
    const restored = this.#documentHistory.merge(document, after, after, history);
    this.#documentHistory.remember(restored, after, history);
    this.#engine.take_document_changes();
    this.#selectedIds = [];
    this.#activePageId = null;
    return this.#store.replace(restored, baseVersion);
  }

  callTool(rawName, args = {}) {
    this.#assertOpen();
    const name = String(rawName ?? '').replace(/^(?:synapse_|openpencil_)/, '');
    let normalizedArgs = { ...args };
    try {
      const rememberKey = `${this.#engine.document_fingerprint()}|${this.#store.revision()}`;
      if (rememberKey !== this.#rememberedKey) {
        this.#documentHistory.remember(
          this.#store.peek(),
          this.#parseDoc(this.#engineDocJson()),
          JSON.parse(this.#engine.document_history_json()),
        );
        this.#rememberedKey = rememberKey;
      }
      if (name === 'get_screenshot') {
        const layoutReply = JSON.parse(
          this.#engine.call_tool('snapshot_layout', JSON.stringify({ maxDepth: 12 })),
        );
        const layoutTree = layoutReply?.structuredContent ?? {};
        const rendered = renderDocumentPreviewPng(
          this.#store.peek(),
          layoutTree,
          typeof normalizedArgs.nodeId === 'string' ? normalizedArgs.nodeId.trim() : 'root',
        );
        const base64 = rendered.bytes.toString('base64');
        const metadata = {
          nodeId: rendered.nodeId,
          format: 'png',
          width: rendered.width,
          height: rendered.height,
        };
        return {
          isError: false,
          content: [
            { type: 'image', data: base64, mimeType: 'image/png' },
            { type: 'text', text: JSON.stringify(metadata) },
          ],
          structuredContent: metadata,
        };
      }
      let batchVariables =
        normalizedArgs.variables && typeof normalizedArgs.variables === 'object'
          ? { ...normalizedArgs.variables }
          : {};
      let batchThemes =
        normalizedArgs.themes && typeof normalizedArgs.themes === 'object'
          ? { ...normalizedArgs.themes }
          : {};
      if (name === 'batch_design') delete normalizedArgs.variables;
      if (name === 'batch_design') delete normalizedArgs.themes;
      const preserveAuthoredGeometry = Boolean(
        this.#store.peek()?.editorMeta?.preserveAuthoredGeometry,
      );
      const healParents = operations => healOperationsParents(operations, activePageNodes(this.#store.peek()), {
        strict: normalizedArgs.strictParent === true,
      });
      if (
        name === 'batch_design' &&
        typeof normalizedArgs.script === 'string' &&
        normalizedArgs.script.trim() !== ''
      ) {
        if (
          (typeof normalizedArgs.operations === 'string' &&
            normalizedArgs.operations.trim() !== '') ||
          (typeof normalizedArgs.nodes_json === 'string' && normalizedArgs.nodes_json.trim() !== '')
        ) {
          return {
            isError: true,
            content: [
              { type: 'text', text: 'Provide only one of script, operations, or nodes_json' },
            ],
          };
        }
        const expanded = expandScriptWithVariables(normalizedArgs.script, {
          preserveAuthoredGeometry,
        });
        delete normalizedArgs.script;
        normalizedArgs.operations = expanded.operations;
        batchVariables = { ...batchVariables, ...expanded.variables };
        batchThemes = { ...batchThemes, ...expanded.themes };
        const checked = preflightDesignScript({
          expanded,
          args: normalizedArgs,
          variables: batchVariables,
          themes: batchThemes,
          createEngine: () => new DesignEngine(),
          document: () => this.#engineDocJson(),
          heal: healParents,
        });
        if (checked?.isError) return checked;
      }
      if (name === 'batch_design') {
        const hasVars = Object.keys(batchVariables).length > 0;
        const hasThemes = Object.keys(batchThemes).length > 0;
        const beforeVarsDoc = hasVars || hasThemes ? this.#engineDocJson() : null;
        if (hasThemes) {
          this.#engine.call_tool(
            'set_themes',
            JSON.stringify({ themes: batchThemes, replace: false }),
          );
        }
        if (hasVars) {
          this.#engine.call_tool(
            'set_variables',
            JSON.stringify({ variables: batchVariables, replace: false }),
          );
        }
        if (
          (hasVars || hasThemes) &&
          (!normalizedArgs.operations || normalizedArgs.operations.trim() === '')
        ) {
          const afterVarsDoc = this.#engineDocJson();
          if (beforeVarsDoc !== afterVarsDoc) {
            this.#syncEngineDocument(beforeVarsDoc, afterVarsDoc, name);
          }
          const value = {
            results: [],
            variablesUpdated: Object.keys(batchVariables).length,
            themesUpdated: Object.keys(batchThemes).length,
          };
          return {
            isError: false,
            content: [{ type: 'text', text: JSON.stringify(value) }],
            structuredContent: value,
          };
        }
      }
      if (
        name === 'batch_design' &&
        typeof normalizedArgs.operations === 'string' &&
        normalizedArgs.operations.trim() !== ''
      ) {
        if (
          /\bUI\s*\.\s*(?:Button|IconButton|Card|Input|Badge|NavItem|SectionHeader)\s*\(/u.test(
            normalizedArgs.operations,
          )
        ) {
          const expanded = expandScriptWithVariables(normalizedArgs.operations, {
            preserveAuthoredGeometry,
          });
          normalizedArgs.operations = expanded.operations;
        }
        normalizedArgs.operations = healParents(normalizedArgs.operations);
      } else if (name === 'update_node' && normalizedArgs.data !== undefined) {
        const parsedData =
          typeof normalizedArgs.data === 'string'
            ? JSON.parse(normalizedArgs.data)
            : normalizedArgs.data;
        normalizedArgs.data = normalizeNodeAestheticPayload(parsedData, true, {
          preserveAuthoredGeometry,
        });
      } else if (name === 'insert_node' && normalizedArgs.data !== undefined) {
        const parsedData =
          typeof normalizedArgs.data === 'string'
            ? JSON.parse(normalizedArgs.data)
            : normalizedArgs.data;
        normalizedArgs.data = normalizeNodeAestheticPayload(parsedData, false, {
          preserveAuthoredGeometry,
        });
      } else if (
        name === 'import_svg' &&
        !normalizedArgs.svg &&
        (normalizedArgs.svgPath || normalizedArgs.svg_path)
      ) {
        const svgPath = resolve(String(normalizedArgs.svgPath ?? normalizedArgs.svg_path));
        normalizedArgs.svg = readFileSync(svgPath, 'utf8');
      } else if (
        name === 'import_web_snapshot' &&
        !normalizedArgs.snapshot &&
        (normalizedArgs.snapshotPath || normalizedArgs.snapshot_path)
      ) {
        const snapshotPath = resolve(
          String(normalizedArgs.snapshotPath ?? normalizedArgs.snapshot_path),
        );
        normalizedArgs.snapshot = readFileSync(snapshotPath, 'utf8');
      } else if (
        name === 'import_html' &&
        !normalizedArgs.html &&
        (normalizedArgs.htmlPath || normalizedArgs.html_path)
      ) {
        const htmlPath = resolve(String(normalizedArgs.htmlPath ?? normalizedArgs.html_path));
        const rawBytes = readFileSync(htmlPath);
        const docName = normalizedArgs.documentName || basename(htmlPath, extname(htmlPath));
        if (rawBytes.length >= 4 && rawBytes[0] === 0x50 && rawBytes[1] === 0x4b) {
          const height =
            normalizedArgs.viewportHeight === undefined
              ? undefined
              : Number(normalizedArgs.viewportHeight);
          const converted = JSON.parse(
            DesignEngine.convert_html_document(
              rawBytes,
              docName,
              undefined,
              Number.isFinite(height) && height > 0 ? height : undefined,
              undefined,
            ),
          );
          const current = this.#store.snapshot();
          const replaced = this.replace(converted.document, current.version);
          if (!replaced.ok) {
            return {
              isError: true,
              content: [{ type: 'text', text: 'Failed to apply imported HTML zip document' }],
            };
          }
          const value = {
            wrote: 'true',
            nodeCount: String(converted.nodeCount),
            warnings: converted.warnings ?? [],
          };
          return {
            isError: false,
            content: [{ type: 'text', text: JSON.stringify(value) }],
            structuredContent: value,
          };
        }
        const html = new TextDecoder('utf-8').decode(rawBytes);
        const resources = collectLocalHtmlResources(html, dirname(htmlPath));
        normalizedArgs.html = html;
        normalizedArgs.documentName ??= docName;
        if (Object.keys(resources).length > 0) {
          normalizedArgs.resourcesJson = JSON.stringify(resources);
        }
      } else if (
        name === 'import_figma' &&
        !normalizedArgs.bytesBase64 &&
        (normalizedArgs.figPath || normalizedArgs.filePath || normalizedArgs.fig_path)
      ) {
        const figPath = resolve(
          String(normalizedArgs.figPath ?? normalizedArgs.filePath ?? normalizedArgs.fig_path),
        );
        normalizedArgs.bytesBase64 = readFileSync(figPath).toString('base64');
        normalizedArgs.fileName ??= basename(figPath, extname(figPath));
      }
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }],
      };
    }
    return this.#invokeEngineTool(name, normalizedArgs);
  }

  async callToolAsync(rawName, args = {}) {
    this.#assertOpen();
    const name = String(rawName ?? '').replace(/^(?:synapse_|openpencil_)/, '');
    if (name === 'import_html' || name === 'import_html_url') {
      const imported = await importHtmlTool(name, args, {
        invoke: (tool, toolArgs) => this.#invokeEngineTool(tool, toolArgs),
        callTool: (tool, toolArgs) => this.callTool(tool, toolArgs),
        document: () => this.snapshot().document,
        fonts: this.fontFetcher,
      });
      if (imported) return imported;
    }
    if (
      name === 'import_figma' &&
      typeof args.url === 'string' &&
      args.url.trim() &&
      !args.bytesBase64
    ) {
      try {
        if (parseFigmaWebUrl(args.url)) return await this.#importFigmaLink(args);
        const converted = await convertFigmaToDocument({
          url: args.url.trim(),
          fileName: args.fileName,
        });
        if (!converted.bytesBase64) {
          const current = this.#store.snapshot();
          const replaced = this.replace(converted.document, current.version);
          if (!replaced.ok)
            return {
              isError: true,
              content: [{ type: 'text', text: 'Failed to apply imported document' }],
            };
          const value = {
            wrote: 'true',
            pageCount: converted.pageCount,
            nodeCount: converted.nodeCount,
            warnings: converted.warnings ?? [],
          };
          return {
            isError: false,
            content: [{ type: 'text', text: JSON.stringify(value) }],
            structuredContent: value,
          };
        }
        const { url: _, ...rest } = args;
        return this.callTool('import_figma', {
          ...rest,
          bytesBase64: converted.bytesBase64,
          fileName: converted.fileName,
        });
      } catch (error) {
        return figmaErrorResult(error);
      }
    }
    if (
      name === 'import_figma' &&
      (args.figPath || args.filePath || args.fig_path || args.bytesBase64)
    ) {
      const result = this.callTool(name, args);
      if (result.isError || args.fetchFonts === false || !this.onFigmaFonts) return result;
      return this.#withFigFonts(result);
    }
    if (FIGMA_JOB_TOOLS.has(name)) {
      try {
        return await this.#figmaJobTool(name, args);
      } catch (error) {
        return figmaErrorResult(error);
      }
    }
    return this.callTool(name, args);
  }

  /** Fetch and register the fonts a local `.fig` import uses, like REST jobs do. */
  async #withFigFonts(result) {
    const fonts = collectDocumentFonts(this.snapshot().document);
    const warnings = [];
    try {
      for (const face of (await this.onFigmaFonts(fonts)) ?? []) {
        if (!face.available)
          warnings.push(`Missing font ${face.family} ${face.weight}: ${face.error}`);
        if (face.warning) warnings.push(face.warning);
      }
    } catch (error) {
      warnings.push(
        `Font download failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    const value = {
      ...result.structuredContent,
      fonts,
      warnings: [...(result.structuredContent?.warnings ?? []), ...warnings],
    };
    return {
      ...result,
      content: [{ type: 'text', text: JSON.stringify(value) }],
      structuredContent: value,
    };
  }

  get figmaJobs() {
    this.#figmaJobs ??= new FigmaImportJobs({
      scope: this.#figmaJobScope,
      siblingCount: (anchor) => {
        const doc = this.snapshot().document;
        let nodes =
          doc.pages?.find((p, index) => p.id === anchor.pageId || String(index) === anchor.pageId)
            ?.children ?? doc.children;
        if (anchor.parent) {
          const pending = [...nodes];
          while (pending.length) {
            const node = pending.pop();
            if (node.id === anchor.parent) return node.children?.length ?? 0;
            pending.push(...(node.children ?? []));
          }
          throw new FigmaApiError('ENGINE_REJECTED', 'Import parent was removed');
        }
        return nodes.length;
      },
      invoke: async (name, args) => {
        const before = { revision: this.revision() };
        const result = this.callTool(name, args);
        if (!result.isError) {
          try {
            await this.onBackgroundWrite?.(before);
          } catch (error) {
            result.structuredContent.persistenceError = String(error.message ?? error);
          }
        }
        return result;
      },
      onFonts: (fonts, signal) => this.onFigmaFonts?.(fonts, signal),
    });
    return this.#figmaJobs;
  }

  /** Wait for `done` up to `waitMs`; `Infinity` waits for completion. */
  async #awaitJob(started, waitMs) {
    if (waitMs === 0) return started.job;
    if (!Number.isFinite(waitMs)) return started.done;
    let timer;
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => resolve(null), waitMs);
    });
    const finished = await Promise.race([started.done, timeout]);
    clearTimeout(timer);
    return finished ?? this.figmaJobs.status(started.job.id);
  }

  async #importFigmaLink(args) {
    const mode = args.mode === 'async' || args.mode === 'sync' ? args.mode : 'auto';
    const started = this.figmaJobs.start(args);
    const wait =
      mode === 'async'
        ? 0
        : mode === 'sync'
          ? Infinity
          : Math.max(0, Math.min(55_000, Number(args.waitMs) || DEFAULT_FIGMA_WAIT_MS));
    return figmaJobResult(await this.#awaitJob(started, wait));
  }

  async #figmaJobTool(name, args) {
    const jobs = this.figmaJobs;
    if (name === 'inspect_figma_node') {
      const value = await jobs.inspect(args);
      return {
        isError: false,
        content: [{ type: 'text', text: JSON.stringify(value) }],
        structuredContent: value,
      };
    }
    if (name === 'list_figma_import_jobs') {
      const value = { jobs: jobs.list().slice(0, 20) };
      return {
        isError: false,
        content: [{ type: 'text', text: JSON.stringify(value) }],
        structuredContent: value,
      };
    }
    const jobId = String(args.jobId ?? '').trim();
    if (!jobId) throw new FigmaApiError('FIGMA_JOB_NOT_FOUND', 'jobId is required');
    if (name === 'get_figma_import_status') {
      const job = jobs.status(jobId);
      if (!job) throw new FigmaApiError('FIGMA_JOB_NOT_FOUND', `No Figma import job ${jobId}`);
      const waitMs = Math.max(0, Math.min(55_000, Number(args.waitMs) || 0));
      if (job.status === 'running' && waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        return figmaJobResult(jobs.status(jobId));
      }
      return figmaJobResult(job);
    }
    if (name === 'cancel_figma_import') return figmaJobResult(await jobs.cancel(jobId));
    const started = jobs.resume(jobId, {
      figmaToken: args.figmaToken,
      force: args.force === true || args.force === 'true',
    });
    const mode =
      args.mode === 'async' ? 0 : args.mode === 'sync' ? Infinity : DEFAULT_FIGMA_WAIT_MS;
    return figmaJobResult(await this.#awaitJob(started, mode));
  }

  builtinAssets(kind) {
    return JSON.parse(this.#engine.builtin_assets_json(kind));
  }
  validateAsset(kind, payload) {
    return JSON.parse(this.#engine.validate_asset_json(kind, JSON.stringify(payload)));
  }
  assetDocument() {
    const canonical = JSON.parse(this.#engine.document_json());
    return this.#documentHistory.merge(
      this.#store.peek(),
      canonical,
      canonical,
      JSON.parse(this.#engine.document_history_json()),
    );
  }
  applyAsset(kind, payload, args) {
    this.#documentHistory.remember(
      this.#store.peek(),
      JSON.parse(this.#engine.document_json()),
      JSON.parse(this.#engine.document_history_json()),
    );
    return this.#invokeEngineTool(
      'apply_asset',
      args,
      () => this.#engine.apply_asset_json(kind, JSON.stringify(payload), JSON.stringify(args)),
    );
  }

  #invokeEngineTool(
    name,
    args,
    invoke = () => this.#engine.call_tool(name, JSON.stringify(args)),
    templateSource,
  ) {
    const before = this.#engineDocJson();
    const beforeFp = this.#docCache.fp;
    const result = JSON.parse(invoke());
    const changed = this.#engine.document_fingerprint() !== beforeFp;
    const after = changed ? this.#engineDocJson() : before;
    if (
      !changed &&
      process.env.DSH_VERIFY_FINGERPRINT === '1' &&
      this.#engine.document_json() !== before
    ) {
      throw new Error(`document_fingerprint missed a document change made by ${name}`);
    }
    if (name === 'set_ui_scale' && !result.isError) {
      this.#pendingUiScale = result.structuredContent.scale;
    }
    if (name === 'clear_selection') {
      clearTextRange(this);
      this.#selectedIds = [];
    } else if (isSelectionSetTool(name)) {
      clearTextRange(this);
      const sel = JSON.parse(
        this.#engine.call_tool('get_selection', JSON.stringify({ readDepth: 0 })),
      )?.structuredContent;
      if (Array.isArray(sel?.selectedIds)) this.#selectedIds = sel.selectedIds;
    }
    if (!result.isError)
      this.#syncEngineDocument(
        before,
        after,
        name,
        templateSource
          ? { source: templateSource, ids: result.structuredContent.nodeIds }
          : undefined,
      );
    if (
      name === 'get_selection' &&
      !result.isError &&
      Array.isArray(result.structuredContent?.nodes) &&
      result.structuredContent.nodes.length > 0
    ) {
      try {
        const layoutReply = JSON.parse(
          this.#engine.call_tool('snapshot_layout', JSON.stringify({ maxDepth: 16 })),
        );
        enrichSelection(result, layoutReply);
      } catch {
        // Keep un-enriched selection if layout snapshot fails
      }
    }
    if (name === 'get_selection' && !result.isError) {
      attachTextRange(this, result.structuredContent, result.structuredContent);
      if (result.structuredContent?.textRange) result.content = [{ type: 'text', text: JSON.stringify(result.structuredContent) }];
    }
    return result;
  }

  #syncEngineDocument(before, after, name, template) {
    if (before === after && name !== 'undo' && name !== 'redo') return;
    const current = this.#store.peek();
    const version = this.#store.version();
    const canonical = this.#parseDoc(after);
    const history = JSON.parse(this.#engine.document_history_json());
    let merged = this.#documentHistory.merge(
      current,
      this.#parseDoc(before),
      canonical,
      history,
      name === 'undo' || name === 'redo',
    );
    if (template) merged = preserveTemplateExtensions(merged, template.source, template.ids);
    this.#documentHistory.remember(merged, canonical, history);
    const changes = JSON.parse(this.#engine.take_document_changes());
    if (before !== after || JSON.stringify(current) !== JSON.stringify(merged)) {
      this.#verifyChanges(this.#parseDoc(before), canonical, changes);
      const result = this.#store.replace(merged, version, {
        metadataOnly: name === 'set_viewport',
        owned: true,
      });
      if (result.ok && result.version !== version) this.#recordChanges(result.version, changes);
      if (this.#selectedIds.length > 0 && name !== 'clear_selection') {
        this.#applySelectionToEngine(this.#engine, merged);
      }
    }
  }

  listTools() {
    this.#assertOpen();
    return JSON.parse(this.#engine.tools_json());
  }

  getSelection() {
    this.#assertOpen();
    const result = JSON.parse(
      this.#engine.call_tool('get_selection', JSON.stringify({ readDepth: 0 })),
    );
    const content = result.structuredContent ?? {};
    return attachTextRange(this, {
      selectedIds: Array.isArray(content.selectedIds) ? content.selectedIds : [],
      activePageId: typeof content.activePageId === 'string' ? content.activePageId : null,
    }, content);
  }

  getUiScaleHint() {
    this.#assertOpen();
    return this.#pendingUiScale;
  }

  setSelection(body) {
    this.#assertOpen();
    if (!body || typeof body !== 'object' || !Array.isArray(body.selectedIds)) {
      throw new Error('Missing selectedIds array');
    }
    if (body.uiScale !== undefined) {
      if (![100, 110, 125, 150].includes(body.uiScale)) throw new Error('Invalid uiScale');
      if (this.#pendingUiScale === null || this.#pendingUiScale === body.uiScale) {
        this.#setEngineUiScale(this.#engine, body.uiScale);
        this.#uiScale = body.uiScale;
        this.#pendingUiScale = null;
      }
    }
    const ids = body.selectedIds
      .filter((id) => typeof id === 'string' && id.trim() !== '')
      .map((id) => id.trim());
    const pageId =
      typeof body.activePageId === 'string' && body.activePageId.trim() !== ''
        ? body.activePageId.trim()
        : undefined;
    this.#selectedIds = ids;
    if (pageId !== undefined) this.#activePageId = pageId;
    this.#applySelectionToEngine(this.#engine, this.#store.snapshot().document);
    saveTextRange(this, body);
    return { ok: true };
  }

  #applySelectionToEngine(engine, document) {
    if (this.#activePageId !== null) {
      const pages = document?.pages;
      if (Array.isArray(pages)) {
        const index = pages.findIndex((page) => page && page.id === this.#activePageId);
        if (index >= 0) {
          engine.call_tool('set_active_page', JSON.stringify({ index: String(index) }));
        }
      }
    }
    engine.call_tool(
      'set_selection_set',
      JSON.stringify({ node_ids: this.#selectedIds.join(',') }),
    );
    const sel = JSON.parse(
      engine.call_tool('get_selection', JSON.stringify({ readDepth: 0 })),
    )?.structuredContent;
    if (Array.isArray(sel?.selectedIds)) {
      this.#selectedIds = sel.selectedIds;
    }
  }

  close() {
    this.#figmaJobs?.close();
    if (!this.#closed) {
      this.#closed = true;
      this.#engine.free();
    }
  }

  #loadEngine(document) {
    const engine = new DesignEngine();
    try {
      engine.load_document(JSON.stringify(document));
      const uiScale = this.#pendingUiScale ?? this.#uiScale;
      if (uiScale !== null) this.#setEngineUiScale(engine, uiScale);
      if (this.#selectedIds.length > 0 || this.#activePageId !== null) {
        this.#applySelectionToEngine(engine, document);
      }
      // The loaded document is the baseline for page-change tracking.
      engine.take_document_changes();
      return engine;
    } catch (error) {
      engine.free();
      throw error;
    }
  }

  #setEngineUiScale(engine, scale) {
    const result = JSON.parse(engine.call_tool('set_ui_scale', JSON.stringify({ scale })));
    if (result.isError)
      throw new Error(result.content?.[0]?.text ?? 'UI scale could not be applied');
  }

  #assertOpen() {
    if (this.#closed) throw new Error('Design session is closed');
  }
}
