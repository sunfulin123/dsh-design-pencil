import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { basename, dirname, extname, resolve } from 'node:path';
import { captureHtmlSnapshotWithBrowser } from './html-browser-capture.mjs';
import {
  collectLocalHtmlResources,
  fetchRemoteHtmlWithResources,
  validateExternalUrl,
  VIRTUAL_PROJECT_ORIGIN,
} from './html-sources.mjs';

const require = createRequire(import.meta.url);
const { DesignEngine } = require('./wasm/op_dsh_engine.js');

function summarizeImportedDocument(document) {
  const roots = Array.isArray(document?.children)
    ? document.children
    : Array.isArray(document?.pages?.[0]?.children)
      ? document.pages[0].children
      : [];
  let autoLayoutFrames = 0;
  let semanticRoles = 0;
  let iconFontNodes = 0;
  const walk = (nodes) => {
    for (const node of nodes ?? []) {
      if (!node || typeof node !== 'object') continue;
      if (node.type === 'frame' && (node.layout === 'horizontal' || node.layout === 'vertical')) {
        autoLayoutFrames += 1;
      }
      if (typeof node.role === 'string' && node.role) {
        semanticRoles += 1;
      }
      if (node.type === 'icon_font') {
        iconFontNodes += 1;
      }
      if (Array.isArray(node.children)) walk(node.children);
    }
  };
  walk(roots);
  const variablesCount =
    document?.variables && typeof document.variables === 'object'
      ? Object.keys(document.variables).length
      : 0;
  return { autoLayoutFrames, semanticRoles, iconFontNodes, variablesCount };
}

export async function convertHtmlToDocument({
  html,
  htmlPath,
  url,
  viewportWidth,
  viewportHeight,
  documentName,
  preferBrowser = true,
  allowLocalUrl = false,
} = {}) {
  let sourceBytes;
  let resolvedName = documentName;
  let baseUrl;
  let baseDir = null;
  let remoteUrl = null;
  let resources = {};
  if (typeof html === 'string' && html.trim()) {
    sourceBytes = Buffer.from(html, 'utf8');
  } else if (typeof htmlPath === 'string' && htmlPath.trim()) {
    const fullPath = resolve(htmlPath.trim());
    sourceBytes = await readFile(fullPath);
    resolvedName ??= basename(fullPath, extname(fullPath)) || 'HTML Import';
    if (!(sourceBytes.length >= 4 && sourceBytes[0] === 0x50 && sourceBytes[1] === 0x4b)) {
      const text = new TextDecoder('utf-8').decode(sourceBytes);
      baseDir = dirname(fullPath);
      resources = collectLocalHtmlResources(text, baseDir);
      baseUrl = `${VIRTUAL_PROJECT_ORIGIN}document.html`;
    }
  } else if (typeof url === 'string' && url.trim()) {
    const validated = validateExternalUrl(url.trim(), allowLocalUrl);
    remoteUrl = validated.href;
    resolvedName ??= validated.hostname || 'HTML Import';
  } else {
    throw new Error('html, htmlPath, or url is required');
  }

  const isZip =
    sourceBytes && sourceBytes.length >= 4 && sourceBytes[0] === 0x50 && sourceBytes[1] === 0x4b;
  const height =
    viewportHeight === undefined || viewportHeight === null || viewportHeight === ''
      ? undefined
      : Number(viewportHeight);
  const width =
    viewportWidth === undefined || viewportWidth === null || viewportWidth === ''
      ? 1440
      : Number(viewportWidth);

  if (preferBrowser && !isZip) {
    const snapshotJson = await captureHtmlSnapshotWithBrowser({
      htmlBytes: sourceBytes,
      baseDir,
      targetUrl: remoteUrl,
      viewportWidth: Number.isFinite(width) && width > 0 ? width : 1440,
      viewportHeight: Number.isFinite(height) && height > 0 ? height : 900,
    });
    if (snapshotJson) {
      try {
        const parsed = JSON.parse(DesignEngine.convert_snapshot_document(snapshotJson));
        if (parsed && parsed.ok && parsed.document) {
          if (resolvedName) parsed.document.name = resolvedName;
          const summary = summarizeImportedDocument(parsed.document);
          return {
            ...parsed,
            renderMode: 'browser-snapshot',
            ...summary,
          };
        }
      } catch {
        // Fall through to static CSS importer if snapshot conversion fails
      }
    }
  }

  if (remoteUrl && !sourceBytes) {
    const fetched = await fetchRemoteHtmlWithResources(remoteUrl, { allowLocal: allowLocalUrl });
    sourceBytes = fetched.bytes;
    baseUrl = fetched.finalUrl;
    resources = fetched.resources;
    resolvedName ??= new URL(fetched.finalUrl).hostname || 'HTML Import';
  }

  const raw = DesignEngine.convert_html_document(
    sourceBytes,
    resolvedName,
    baseUrl,
    Number.isFinite(height) && height > 0 ? height : undefined,
    Object.keys(resources).length > 0 ? JSON.stringify(resources) : undefined,
  );
  const parsed = JSON.parse(raw);
  if (parsed && parsed.document) {
    const summary = summarizeImportedDocument(parsed.document);
    return {
      ...parsed,
      renderMode: 'static-css',
      ...summary,
    };
  }
  return parsed;
}
