import {
  HttpError,
  readJson,
  send,
  snapshotReply,
  requestDocument,
  awaitsRenderer,
  validatedViewport,
} from './host-http.mjs';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { basename, dirname, join, resolve } from 'node:path';
import { FontFetcher } from './font-fetcher.mjs';
import { defaultFigmaCacheDir } from './figma-import-jobs.mjs';
import { readDocumentFile, writeDocumentFile } from './document-file.mjs';
import { EngineSession, figmaErrorResult } from './engine-session.mjs';
import { compareFigmaFidelity } from './figma-fidelity.mjs';
import { ColorSampler } from './color-sampler.mjs';
import { ScreenshotRenderer } from './screenshot-renderer.mjs';
import { HeadlessRenderer } from './headless-renderer.mjs';
import { DraftRecovery, DraftWriteError } from './draft-recovery.mjs';
import { serveStatic } from './static-assets.mjs';
import { AssetStore, AssetStoreError } from './asset-store.mjs';
import { AssetTools } from './asset-tools.mjs';
import { assetRoute } from './asset-routes.mjs';
import { EditorControl } from './editor-control.mjs';

// Routes a screenshot to a live CanvasKit renderer: the hidden headless one
// (started on demand) or an open editor tab. Without Chrome, falls back to
// the approximate server-side preview and says so in the result.
async function captureScreenshot(lifecycle, session, args, version = session.version()) {
  const shots = lifecycle.screenshots;
  const headless = lifecycle.headless;
  if (headless?.available) {
    if (shots.connected('headless')) headless.touch();
    else await headless.ensure();
  } else if (headless && !shots.connected('editor')) {
    const result = session.callTool('get_screenshot', args);
    if (!result.isError) {
      const meta = {
        ...result.structuredContent,
        renderer: 'approximate',
        note: 'No Chrome was found; this preview omits text shaping and effects. Set DSH_CHROME_PATH for exact captures.',
      };
      result.structuredContent = meta;
      result.content = result.content.map((item) =>
        item.type === 'text' ? { type: 'text', text: JSON.stringify(meta) } : item,
      );
    }
    return result;
  }
  return shots.capture(args, version);
}

async function dispatch(request, response, session, file, body, lifecycle) {
  const path = new URL(request.url, 'http://127.0.0.1').pathname;
  if (path === '/api/mcp/editor-control') {
    if (request.method === 'GET')
      return send(response, 200, {
        requests: lifecycle.editorControl.pending(
          new URL(request.url, 'http://127.0.0.1').searchParams.get('client'),
        ),
      });
    if (request.method === 'POST') {
      lifecycle.editorControl.complete(body);
      return send(response, 200, { ok: true });
    }
  }
  if (path === '/api/assets' || path.startsWith('/api/assets/')) {
    const before = { revision: session.revision(), version: session.version() };
    const result = await assetRoute(
      request,
      new URL(request.url, 'http://127.0.0.1'),
      body,
      lifecycle.assets,
    );
    await lifecycle.drafts.persist(before);
    return send(response, 200, result);
  }
  if (request.method === 'GET' && path === '/api/fonts/manifest') {
    return send(response, 200, lifecycle.fonts.manifest());
  }
  if (request.method === 'GET' && /^\/api\/fonts\/[a-f0-9]{64}$/.test(path)) {
    const bytes = await lifecycle.fonts.bytes(path.split('/').at(-1));
    if (!bytes) return send(response, 404, { error: 'Font not found' });
    response.writeHead(200, {
      'content-type': 'font/ttf',
      'cache-control': 'private, max-age=3600',
    });
    return response.end(bytes);
  }
  if (request.method === 'GET' && path === '/api/mcp/server') {
    return send(response, 200, {
      running: true,
      port: Number(request.headers.host.split(':')[1]),
      localIp: '127.0.0.1',
      server: 'openpencil-mcp',
      mode: 'web-canvas',
      serveMode: 'managed',
      draftRecovery: Boolean(file.path),
    });
  }
  if (request.method === 'GET' && path === '/api/settings/credential-policy') {
    return send(response, 200, { serverPersistence: false });
  }
  if (request.method === 'GET' && path === '/api/ai/models') return send(response, 200, []);
  if (request.method === 'POST' && path === '/api/mcp/sync-reset') {
    return send(response, 200, { ok: true, skipped: true, version: session.version() });
  }
  if (request.method === 'GET' && path === '/api/mcp/version') {
    // Camera and UI-scale hint let the editor skip re-downloading an
    // unchanged document on every poll.
    return send(response, 200, {
      version: session.version(),
      assetsRevision: lifecycle.assets.store?.revision() ?? 0,
      viewport: session.peekDocument().editorMeta?.viewport ?? null,
      uiScale: session.getUiScaleHint(),
    });
  }
  if (path === '/api/mcp/color-samples') {
    if (request.method === 'GET')
      return send(response, 200, { requests: lifecycle.colorSampler.pending() });
    if (request.method === 'POST') {
      lifecycle.colorSampler.complete(body, session.version());
      return send(response, 200, { ok: true });
    }
  }
  if (path === '/api/mcp/screenshots') {
    if (request.method === 'GET') {
      const client =
        new URL(request.url, 'http://127.0.0.1').searchParams.get('client') ?? 'editor';
      return send(response, 200, { requests: lifecycle.screenshots.pending({ client }) });
    }
    if (request.method === 'POST') {
      lifecycle.screenshots.complete(body, session.version());
      return send(response, 200, { ok: true });
    }
  }
  if (request.method === 'GET' && path === '/api/mcp/selection') {
    return send(response, 200, session.getSelection());
  }
  if (request.method === 'POST' && path === '/api/mcp/selection') {
    if (!body || typeof body !== 'object' || !Array.isArray(body.selectedIds)) {
      throw new HttpError(400, 'Missing selectedIds array');
    }
    return send(response, 200, session.setSelection(body));
  }
  if (request.method === 'GET' && path === '/api/mcp/document/changes') {
    // Incremental pull: the pages changed since `since`, or `full: true`
    // when the editor must fetch the whole document.
    const since = Number(new URL(request.url, 'http://127.0.0.1').searchParams.get('since'));
    const version = session.version();
    const document = session.peekDocument();
    const change = session.changesSince(since);
    if (change.full || !Array.isArray(document.pages))
      return send(response, 200, { full: true, version });
    const { document: _omitted, ...meta } = snapshotReply(session);
    return send(response, 200, {
      ...meta,
      full: false,
      since,
      pageIds: document.pages.map((page) => page.id),
      pages: document.pages.filter((page) => change.pages.includes(page.id)),
      editorMeta: document.editorMeta ?? null,
    });
  }
  if (request.method === 'GET' && path === '/api/mcp/document') {
    return send(response, 200, snapshotReply(session));
  }
  if (request.method === 'POST' && path === '/api/mcp/document') {
    // Read-only view: camera pushes arrive often and must not copy the tree.
    const before = {
      document: session.peekDocument(),
      version: session.version(),
      revision: session.revision(),
    };
    const document = requestDocument(body, before.document.editorMeta);
    if (body.metadataOnly !== undefined && typeof body.metadataOnly !== 'boolean')
      throw new HttpError(400, 'Invalid metadataOnly');
    if (Object.hasOwn(body, 'baseViewport')) {
      const base = validatedViewport(body.baseViewport);
      const saved = before.document.editorMeta?.viewport ?? { panX: 0, panY: 0, zoom: 1 };
      if (
        ['panX', 'panY', 'zoom'].some((key) => Math.fround(base[key]) !== Math.fround(saved[key]))
      ) {
        return send(response, 409, {
          ok: false,
          error: 'version-conflict',
          conflictKind: 'viewport',
          version: before.version,
        });
      }
    }
    const result = session.replace(document, body.baseVersion, {
      metadataOnly: body.metadataOnly === true,
    });
    if (result.ok) await lifecycle.drafts.persist(before);
    return send(
      response,
      result.ok ? 200 : 409,
      result.ok ? result : { ok: false, error: 'version-conflict', version: result.version },
    );
  }
  if (request.method === 'POST' && path === '/api/file/save') {
    if (!file.path) throw new HttpError(400, 'No file path is bound to this session');
    const before = session.snapshot();
    const document = requestDocument(body, before.document.editorMeta);
    const version = before.version;
    const baseVersion = body.baseVersion === undefined ? version : body.baseVersion;
    if (!Number.isSafeInteger(baseVersion) || baseVersion < 0)
      throw new HttpError(400, 'Invalid baseVersion');
    if (baseVersion !== version)
      return send(response, 409, { ok: false, error: 'version-conflict', version });
    const candidate = new EngineSession(document);
    candidate.close();
    try {
      file.contents = await writeDocumentFile(file.path, document, file.contents);
    } catch (error) {
      if (error.code === 'file-conflict')
        return send(response, 409, { ok: false, error: 'file-conflict', version });
      throw new HttpError(500, 'Document could not be saved');
    }
    const result = session.replace(document, version);
    await lifecycle.drafts.persist(before);
    return send(response, 200, { ...result, fileName: basename(file.path) });
  }
  if (request.method === 'POST' && path === '/mcp') {
    const call = body;
    if (
      !call ||
      call.jsonrpc !== '2.0' ||
      typeof call.method !== 'string' ||
      (call.id !== undefined &&
        typeof call.id !== 'string' &&
        typeof call.id !== 'number' &&
        call.id !== null)
    ) {
      throw new HttpError(400, 'Invalid JSON-RPC request');
    }
    if (call.method === 'notifications/initialized' && call.id === undefined) {
      response.writeHead(202);
      return response.end();
    }
    const reply = (result) => send(response, 200, { jsonrpc: '2.0', id: call.id ?? null, result });
    if (call.method === 'openpencil/shutdown' && call.params?.token === lifecycle.token) {
      response.once('finish', () => setImmediate(lifecycle.stop));
      return reply({ ok: true, shuttingDown: true });
    }
    if (call.method === 'initialize') {
      return reply({
        protocolVersion: '2025-03-26',
        capabilities: { tools: {} },
        serverInfo: { name: 'dsh-design-pencil', version: '0.8.5' },
      });
    }
    if (call.method === 'ping') return reply({});
    if (call.method === 'tools/list') return reply({ tools: session.listTools() });
    if (call.method !== 'tools/call') {
      return send(response, 200, {
        jsonrpc: '2.0',
        id: call.id ?? null,
        error: { code: -32601, message: 'Method not found' },
      });
    }
    if (
      typeof call.params?.name !== 'string' ||
      !call.params.name ||
      (call.params.arguments !== undefined &&
        (!call.params.arguments ||
          typeof call.params.arguments !== 'object' ||
          Array.isArray(call.params.arguments)))
    ) {
      return send(response, 200, {
        jsonrpc: '2.0',
        id: call.id ?? null,
        error: { code: -32602, message: 'Invalid tool arguments' },
      });
    }
    if (call.params.name.replace(/^(?:synapse_|openpencil_)/, '') === 'sample_color') {
      return reply(
        await lifecycle.colorSampler.sample(call.params.arguments ?? {}, session.version()),
      );
    }
    if (call.params.name.replace(/^(?:synapse_|openpencil_)/, '') === 'get_screenshot') {
      return reply(await captureScreenshot(lifecycle, session, call.params.arguments ?? {}));
    }
    if (call.params.name.replace(/^(?:synapse_|openpencil_)/, '') === 'compare_figma_fidelity') {
      try {
        return reply(
          await compareFigmaFidelity(call.params.arguments ?? {}, {
            capture: (args, version) => captureScreenshot(lifecycle, session, args, version),
            layout: () => session.callTool('snapshot_layout', { maxDepth: 100 }),
            version: () => session.version(),
            document: () => session.snapshot().document,
          }),
        );
      } catch (error) {
        return reply(figmaErrorResult(error));
      }
    }
    const name = call.params.name.replace(/^(?:synapse_|openpencil_)/, '');
    const before = { revision: session.revision(), version: session.version() };
    try {
      let result;
      if (lifecycle.assets.handles(name)) {
        result = await lifecycle.assets.call(name, call.params.arguments ?? {});
      } else if (lifecycle.drafts.handles(name)) {
        const value = await lifecycle.drafts.call(name, call.params.arguments ?? {});
        result = {
          isError: false,
          content: [{ type: 'text', text: JSON.stringify(value) }],
          structuredContent: value,
        };
      } else {
        result = await session.callToolAsync(call.params.name, call.params.arguments ?? {});
      }
      await lifecycle.drafts.persist(before);
      return reply(result);
    } catch (error) {
      return reply({
        isError: true,
        content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }],
        ...(error instanceof DraftWriteError
          ? {
              structuredContent: {
                applied: true,
                version: error.version,
                error: 'draft-write-failed',
              },
            }
          : {}),
        ...(error instanceof AssetStoreError
          ? { structuredContent: { error: error.code, message: error.message } }
          : {}),
      });
    }
  }
  return send(response, 404, { ok: false, error: 'Not found' });
}

export async function startNodeHost({
  document,
  allowOrigins = [],
  sourcePath,
  draftDirectory,
  assetDirectory,
  webRoot,
  canvaskitRoot,
  onShutdown,
  headless = false,
}) {
  const file = {
    path: sourcePath,
    contents: sourcePath ? await readDocumentFile(sourcePath) : null,
  };
  const assetsDirectory =
    assetDirectory ??
    (sourcePath && file.contents
      ? join(dirname(resolve(sourcePath)), '.dsh-design', 'assets')
      : undefined);
  const assetStore = assetsDirectory
    ? await AssetStore.open({ directory: assetsDirectory })
    : undefined;
  let session;
  try {
    session = new EngineSession(document, sourcePath ? { figmaJobScope: resolve(sourcePath) } : {});
  } catch (error) {
    assetStore?.close();
    throw error;
  }
  const origins = new Set(allowOrigins);
  const lifecycle = {
    token: randomBytes(32).toString('hex'),
    colorSampler: new ColorSampler(),
    screenshots: new ScreenshotRenderer(),
    drafts: new DraftRecovery(session, { sourcePath, draftDirectory }),
    fonts: new FontFetcher(join(defaultFigmaCacheDir(), 'fonts')),
    stop: () => host.close().then(() => onShutdown?.()),
  };
  lifecycle.editorControl = new EditorControl();
  lifecycle.assets = new AssetTools(session, {
    store: assetStore,
    webRoot,
    editorControl: lifecycle.editorControl,
  });
  // Chunked Figma imports insert between MCP calls; autosave each chunk.
  session.onBackgroundWrite = (before) => lifecycle.drafts.persist(before);
  session.onFigmaFonts = (fonts, signal) => lifecycle.fonts.ensure(fonts, { signal });
  let mutations = Promise.resolve();
  const server = createServer(async (request, response) => {
    const port = server.address()?.port;
    const origin = request.headers.origin;
    if (
      request.headers.host !== `127.0.0.1:${port}` ||
      (origin !== undefined && origin !== `http://127.0.0.1:${port}` && !origins.has(origin))
    ) {
      request.resume();
      return send(response, 403, { ok: false, error: 'Request origin is not allowed' });
    }
    if (origin !== undefined) {
      response.setHeader('access-control-allow-origin', origin);
      response.setHeader('vary', 'Origin');
    }
    response.setHeader('x-content-type-options', 'nosniff');
    if (request.method === 'OPTIONS') {
      response.setHeader('access-control-allow-methods', 'GET, HEAD, POST, OPTIONS');
      response.setHeader('access-control-allow-headers', 'Content-Type, X-OpenPencil-Token');
      response.writeHead(204);
      return response.end();
    }
    try {
      if (await serveStatic(request, response, { webRoot, canvaskitRoot })) return;
      const path = new URL(request.url, 'http://127.0.0.1').pathname;
      const mutating =
        request.method === 'POST' &&
        [
          '/mcp',
          '/api/assets/tools',
          '/api/mcp/document',
          '/api/mcp/selection',
          '/api/mcp/sync-reset',
          '/api/file/save',
        ].includes(path);
      const renderReply =
        request.method === 'POST' &&
        ['/api/mcp/color-samples', '/api/mcp/screenshots', '/api/mcp/editor-control'].includes(
          path,
        );
      const body = mutating || renderReply ? await readJson(request) : undefined;
      const execute = () => dispatch(request, response, session, file, body, lifecycle);
      if (mutating && !awaitsRenderer(path, body)) {
        const operation = mutations.then(execute);
        mutations = operation.catch(() => {});
        await operation;
      } else {
        await execute();
      }
    } catch (error) {
      request.resume();
      if (!response.headersSent && error instanceof DraftWriteError) {
        send(response, 507, {
          ok: false,
          error: 'draft-write-failed',
          message: error.message,
          applied: true,
          version: error.version,
        });
      } else if (!response.headersSent && error instanceof AssetStoreError) {
        const status =
          {
            'asset-conflict': 409,
            'asset-busy': 503,
            'asset-not-found': 404,
            'asset-too-large': 413,
            'asset-storage': 500,
            'editor-unavailable': 503,
          }[error.code] ?? 400;
        send(response, status, { ok: false, error: error.code, message: error.message });
      } else if (!response.headersSent)
        send(response, error instanceof HttpError ? error.status : 400, {
          ok: false,
          error: 'Request was rejected',
        });
      else response.end();
    }
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
  } catch (error) {
    session.close();
    assetStore?.close();
    throw error;
  }
  if (headless) {
    // `headless` is `true` or HeadlessRenderer options (tests inject chromePath).
    const options = typeof headless === 'object' ? headless : {};
    lifecycle.headless = new HeadlessRenderer({
      ...options,
      baseUrl: `http://127.0.0.1:${server.address().port}`,
    });
  }
  let closing;
  const host = {
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    token: lifecycle.token,
    close() {
      if (!closing) {
        lifecycle.colorSampler.close();
        lifecycle.screenshots.close();
        lifecycle.editorControl.close();
        const headlessClosed = lifecycle.headless?.close();
        closing = new Promise((resolve, reject) => {
          server.close(async (error) => {
            await mutations;
            await headlessClosed;
            session.close();
            assetStore?.close();
            if (error) reject(error);
            else resolve();
          });
          server.closeAllConnections();
        });
      }
      return closing;
    },
  };
  return host;
}
