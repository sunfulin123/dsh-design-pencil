const MAX_BODY_BYTES = 32 * 1024 * 1024;

// Client waits must release the queue needed by their own bootstrap and acknowledgement.
const RENDER_WAIT_TOOLS = new Set([
  'get_screenshot',
  'sample_color',
  'compare_figma_fidelity',
  'get_editor_theme',
  'set_editor_theme',
]);

export function awaitsRenderer(path, body) {
  if (path === '/api/assets/tools')
    return ['get_editor_theme', 'set_editor_theme'].includes(body?.name);
  if (path !== '/mcp' || body?.method !== 'tools/call' || typeof body.params?.name !== 'string')
    return false;
  return RENDER_WAIT_TOOLS.has(body.params.name.replace(/^(?:synapse_|openpencil_)/, ''));
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function readJson(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers['content-type'] ?? '')) {
    throw new HttpError(415, 'Content-Type must be application/json');
  }
  let length = 0;
  const chunks = [];
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    length += chunk.length;
    if (length > MAX_BODY_BYTES) {
      request.resume();
      throw new HttpError(413, 'Request body exceeds the size limit');
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)));
  } catch {
    throw new HttpError(400, 'Invalid JSON request');
  }
}

export function send(response, status, body) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(JSON.stringify(body));
}

export function snapshotReply(session) {
  // Serialized right away, so the live document needs no defensive copy.
  const snapshot = { document: session.peekDocument(), version: session.version() };
  return {
    ...snapshot,
    activePageIndex: snapshot.document.editorMeta?.activePageIndex ?? 0,
    preserveAuthoredGeometry: snapshot.document.editorMeta?.preserveAuthoredGeometry ?? false,
    scenario: snapshot.document.editorMeta?.scenario ?? null,
    viewport: snapshot.document.editorMeta?.viewport ?? null,
    metadataOnlyPush: true,
    uiScale: session.getUiScaleHint(),
  };
}

export function validatedViewport(viewport) {
  if (
    !viewport ||
    typeof viewport !== 'object' ||
    Array.isArray(viewport) ||
    !['panX', 'panY', 'zoom'].every(
      (key) => Number.isFinite(viewport[key]) && Number.isFinite(Math.fround(viewport[key])),
    ) ||
    viewport.zoom < 0.1 ||
    viewport.zoom > 8
  ) {
    throw new HttpError(
      400,
      'Invalid viewport: finite panX/panY and zoom between 0.1 and 8 are required',
    );
  }
  return { panX: viewport.panX, panY: viewport.panY, zoom: viewport.zoom };
}

export function requestDocument(body, savedEditorMeta) {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw new HttpError(400, 'Invalid document request');
  const document = typeof body.document === 'string' ? JSON.parse(body.document) : body.document;
  if (!document || typeof document !== 'object' || Array.isArray(document))
    throw new HttpError(400, 'Invalid document');
  const meta = { ...document.editorMeta };
  if (!Object.hasOwn(document, 'editorMeta') && savedEditorMeta?.viewport) {
    meta.viewport = savedEditorMeta.viewport;
  }
  if (Object.hasOwn(body, 'viewport')) meta.viewport = body.viewport;
  if (meta.viewport === null) delete meta.viewport;
  else if (meta.viewport !== undefined) {
    meta.viewport = validatedViewport(meta.viewport);
    if (meta.viewport.panX === 0 && meta.viewport.panY === 0 && meta.viewport.zoom === 1)
      delete meta.viewport;
  }
  if (body.activePageIndex !== undefined) {
    if (!Number.isSafeInteger(body.activePageIndex) || body.activePageIndex < 0)
      throw new HttpError(400, 'Invalid activePageIndex');
    meta.activePageIndex = body.activePageIndex;
  }
  if (body.preserveAuthoredGeometry !== undefined) {
    if (typeof body.preserveAuthoredGeometry !== 'boolean')
      throw new HttpError(400, 'Invalid preserveAuthoredGeometry');
    meta.preserveAuthoredGeometry = body.preserveAuthoredGeometry;
  }
  return { ...document, editorMeta: meta };
}
