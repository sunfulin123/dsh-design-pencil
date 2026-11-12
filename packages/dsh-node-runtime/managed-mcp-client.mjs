/** Loopback JSON-RPC MCP client, selection target validation, and skill metadata helpers. */

const MCP_TIMEOUT_MS = 20_000;
const MAX_MCP_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_MCP_RESPONSE_BYTES = 48 * 1024 * 1024;
const MAX_MCP_IMAGE_BYTES = 16 * 1024 * 1024;
const MAX_MCP_IMAGES = 4;

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finite(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function optionalString(value) {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export class OpenPencilMcpTransportError extends Error {
  uncertain = true;
}

function textFromContent(value) {
  if (!Array.isArray(value)) return '';
  const parts = [];
  for (const item of value) {
    if (isRecord(item) && item.type === 'text' && typeof item.text === 'string') parts.push(item.text);
  }
  return parts.join('\n');
}

function decodeImageItem(item) {
  if (typeof item.data !== 'string' || typeof item.mimeType !== 'string') {
    throw new TypeError('OpenPencil MCP returned an invalid image block');
  }
  if (!/^image\/(?:png|jpeg|webp)$/.test(item.mimeType)) {
    throw new Error('OpenPencil MCP returned an unsupported image type');
  }
  if (item.data.length === 0 || item.data.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(item.data)) {
    throw new Error('OpenPencil MCP returned invalid image data');
  }
  const bytes = Buffer.from(item.data, 'base64');
  if (bytes.length === 0 || bytes.length > MAX_MCP_IMAGE_BYTES) {
    throw new Error('OpenPencil MCP returned an image outside the size limit');
  }
  const canonical = bytes.toString('base64').replace(/=+$/, '');
  if (canonical !== item.data.replace(/=+$/, '')) {
    throw new Error('OpenPencil MCP returned invalid image data');
  }
  return { mimeType: item.mimeType, bytes };
}

function imagesFromContent(value) {
  if (!Array.isArray(value)) return [];
  const images = [];
  for (const item of value) {
    if (!isRecord(item) || item.type !== 'image') continue;
    if (images.length >= MAX_MCP_IMAGES) throw new Error('OpenPencil MCP returned too many images');
    images.push(decodeImageItem(item));
  }
  return images;
}

function stripEmbeddedBinary(value) {
  if (Array.isArray(value)) return value.map(stripEmbeddedBinary);
  if (!isRecord(value)) return value;
  const clean = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === 'image_base64' || key === 'bytes_base64') continue;
    clean[key] = stripEmbeddedBinary(item);
  }
  return clean;
}

function redactSecret(value, secret) {
  return !secret ? value : value.split(secret).join('[redacted]');
}

function redactResultSecrets(value, secret) {
  if (typeof value === 'string') return redactSecret(value, secret);
  if (Array.isArray(value)) return value.map((item) => redactResultSecrets(item, secret));
  if (!isRecord(value)) return value;
  const clean = {};
  for (const [key, item] of Object.entries(value)) {
    clean[key] = /(?:^|_)(?:token|authorization|bearer)(?:$|_)/i.test(key)
      ? '[redacted]'
      : redactResultSecrets(item, secret);
  }
  return clean;
}

async function boundedResponseBytes(response, tool) {
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_MCP_RESPONSE_BYTES) {
    throw new OpenPencilMcpTransportError(`OpenPencil MCP ${tool} response is too large`);
  }
  if (response.body === null) return Buffer.alloc(0);
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    // Stream chunks sequentially to enforce the response byte cap before buffering.
    // eslint-disable-next-line no-await-in-loop
    for (let next = await reader.read(); !next.done; next = await reader.read()) {
      const chunk = Buffer.from(next.value);
      size += chunk.length;
      if (size > MAX_MCP_RESPONSE_BYTES) {
        // eslint-disable-next-line no-await-in-loop
        await reader.cancel().catch(() => {});
        throw new OpenPencilMcpTransportError(`OpenPencil MCP ${tool} response is too large`);
      }
      chunks.push(chunk);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, size);
}

function decodeMcpTextPayload(rawText) {
  if (rawText === '') return { decoded: rawText, text: rawText };
  try {
    const parsed = JSON.parse(rawText);
    const decoded = stripEmbeddedBinary(parsed);
    const text = JSON.stringify(decoded) !== JSON.stringify(parsed) ? JSON.stringify(decoded) : rawText;
    return { decoded, text };
  } catch {
    return { decoded: rawText, text: rawText };
  }
}

export function parseOpenPencilMcpResponse(tool, value) {
  if (!isRecord(value)) throw new Error(`OpenPencil MCP ${tool} returned an invalid JSON-RPC response`);
  if (isRecord(value.error)) {
    const message = optionalString(value.error.message) ?? JSON.stringify(value.error);
    throw new Error(`OpenPencil MCP ${tool} failed: ${message}`);
  }
  if (!isRecord(value.result)) throw new Error(`OpenPencil MCP ${tool} omitted its result`);
  const rawText = textFromContent(value.result.content);
  const images = imagesFromContent(value.result.content);
  if (value.result.isError === true) {
    throw new Error(`OpenPencil MCP ${tool} failed${rawText === '' ? '' : `: ${rawText}`}`);
  }
  const { decoded, text } = decodeMcpTextPayload(rawText);
  if (isRecord(decoded) && decoded.applied === false) {
    const details = Array.isArray(decoded.errors)
      ? decoded.errors.map((err) => (typeof err === 'string' ? err : JSON.stringify(err))).join('; ')
      : text;
    throw new Error(`OpenPencil MCP ${tool} did not apply${details === '' ? '' : `: ${details}`}`);
  }
  return { tool, value: decoded, text, images };
}

function validateMcpLoopbackOrigin(baseUrl, requireRootOrigin) {
  const origin = new URL(baseUrl);
  const loopback = origin.hostname === '127.0.0.1' || origin.hostname === 'localhost' || origin.hostname === '::1';
  if (!loopback || (origin.protocol !== 'http:' && origin.protocol !== 'https:')) {
    throw new Error('OpenPencil MCP endpoint must use an HTTP loopback origin');
  }
  if (requireRootOrigin && (origin.pathname !== '/' || origin.search !== '' || origin.hash !== '')) {
    throw new Error('OpenPencil MCP base URL must be an origin');
  }
  return origin;
}

function combinedMcpSignal(signal, timeoutMs) {
  const timeout = AbortSignal.timeout(timeoutMs);
  return signal === undefined ? timeout : AbortSignal.any([signal, timeout]);
}

export async function callOpenPencilMcp(options) {
  const origin = validateMcpLoopbackOrigin(options.baseUrl, true);
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? MCP_TIMEOUT_MS;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > MAX_MCP_TIMEOUT_MS) {
    throw new Error(`OpenPencil MCP ${options.tool} timeout is invalid`);
  }
  const signal = combinedMcpSignal(options.signal, timeoutMs);
  try {
    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: `dsh-${Date.now().toString(36)}`,
      method: 'tools/call',
      params: { name: options.tool, arguments: options.arguments ?? {} },
    });
    const response = await fetcher(new URL('/mcp', origin).href, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body,
      signal,
    });
    const bytes = await boundedResponseBytes(response, options.tool);
    if (!response.ok) {
      throw new OpenPencilMcpTransportError(`OpenPencil MCP ${options.tool} request failed (${response.status})`);
    }
    let value;
    try {
      value = JSON.parse(bytes.toString('utf8'));
    } catch {
      throw new OpenPencilMcpTransportError(`OpenPencil MCP ${options.tool} returned invalid JSON`);
    }
    const parsed = parseOpenPencilMcpResponse(options.tool, value);
    return {
      ...parsed,
      value: redactResultSecrets(parsed.value, options.token),
      text: redactSecret(parsed.text, options.token),
    };
  } catch (error) {
    if (error instanceof OpenPencilMcpTransportError) throw error;
    if (
      error instanceof Error
      && (error.message.startsWith(`OpenPencil MCP ${options.tool} failed`)
        || error.message.startsWith(`OpenPencil MCP ${options.tool} did not apply`))
    ) {
      throw new Error(redactSecret(error.message, options.token));
    }
    const message = redactSecret(error instanceof Error ? error.message : String(error), options.token);
    throw new OpenPencilMcpTransportError(`OpenPencil MCP ${options.tool} request did not complete: ${message}`);
  }
}

export async function getOpenPencilMcpVersion(options) {
  const origin = validateMcpLoopbackOrigin(options.baseUrl, false);
  const signal = combinedMcpSignal(options.signal, options.timeoutMs ?? MCP_TIMEOUT_MS);
  const response = await (options.fetcher ?? fetch)(new URL('/api/mcp/version', origin).href, {
    headers: { accept: 'application/json' },
    signal,
  });
  if (!response.ok) throw new Error(`OpenPencil MCP version probe failed (${response.status})`);
  const value = await response.json();
  if (!isRecord(value) || typeof value.version !== 'number' || !Number.isSafeInteger(value.version) || value.version < 0) {
    throw new Error('OpenPencil MCP version probe returned an invalid result');
  }
  return value.version;
}

export function editorTextRangeOf(value, ids) {
  if (!isRecord(value) || typeof value.nodeId !== 'string' || ids.length !== 1 || ids[0] !== value.nodeId) {
    return undefined;
  }
  const { start, end, selectedText } = value;
  if (typeof start !== 'number' || !Number.isSafeInteger(start) || start < 0) return undefined;
  if (typeof end !== 'number' || !Number.isSafeInteger(end) || end <= start) return undefined;
  if (typeof selectedText !== 'string' || selectedText.length > 4 * 1024 * 1024) return undefined;
  if (Array.from(selectedText).length !== end - start) return undefined;
  return { nodeId: value.nodeId, start, end, selectedText };
}

export function editorAiTargetOf(value) {
  if (!isRecord(value) || typeof value.activePageId !== 'string' || value.activePageId.length > 1024) return undefined;
  if (
    !Array.isArray(value.selectedIds)
    || value.selectedIds.length === 0
    || value.selectedIds.length > 256
    || !value.selectedIds.every((id) => typeof id === 'string' && id.length > 0 && id.length <= 1024)
  ) {
    return undefined;
  }
  const target = { activePageId: value.activePageId, selectedIds: [...value.selectedIds] };
  if (value.textRange === undefined) return target;
  const textRange = editorTextRangeOf(value.textRange, target.selectedIds);
  return textRange === undefined ? undefined : { ...target, textRange };
}

export function selectionMatchesTarget(selection, target) {
  return selection.activePageId === target.activePageId
    && JSON.stringify(selection.selectedIds) === JSON.stringify(target.selectedIds)
    && JSON.stringify(selection.textRange ?? null) === JSON.stringify(target.textRange ?? null);
}

export function textFromNode(value) {
  const content = isRecord(value) ? value.content : undefined;
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return undefined;
  const parts = content.map((run) => (isRecord(run) ? run.text : undefined));
  return parts.every((part) => typeof part === 'string') ? parts.join('') : undefined;
}

function nodeSummary(value) {
  if (!isRecord(value) || typeof value.id !== 'string' || value.id.length === 0) return undefined;
  return {
    id: value.id,
    ...(optionalString(value.type) === undefined ? {} : { type: optionalString(value.type) }),
    ...(optionalString(value.name) === undefined ? {} : { name: optionalString(value.name) }),
    ...(finite(value.x) === undefined ? {} : { x: finite(value.x) }),
    ...(finite(value.y) === undefined ? {} : { y: finite(value.y) }),
    ...(finite(value.width) === undefined ? {} : { width: finite(value.width) }),
    ...(finite(value.height) === undefined ? {} : { height: finite(value.height) }),
  };
}

export function selectionSnapshotFromMcp(sourcePath, value, updatedAt = Date.now()) {
  if (!isRecord(value)) throw new Error('OpenPencil get_selection returned an invalid result');
  const selectedIds = Array.isArray(value.selectedIds)
    ? value.selectedIds.filter((id) => typeof id === 'string' && id.length > 0)
    : [];
  const nodes = Array.isArray(value.nodes)
    ? value.nodes.map(nodeSummary).filter((node) => node !== undefined)
    : [];
  const textRange = editorTextRangeOf(value.textRange, selectedIds);
  return {
    sourcePath,
    activePageId: optionalString(value.activePageId) ?? '',
    selectedIds,
    nodes,
    ...(textRange === undefined ? {} : { textRange }),
    updatedAt,
  };
}

export async function readRuntimeCapabilities(options) {
  const result = await callOpenPencilMcp({ ...options, tool: 'get_design_capabilities', arguments: {} });
  const value = result.value;
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.tools)) {
    throw new Error('The design runtime capability manifest is unavailable or incompatible');
  }
  const names = new Set();
  return value.tools.map((item) => {
    if (
      !isRecord(item)
      || typeof item.name !== 'string'
      || !['document-read', 'document-write', 'session', 'sensitive'].includes(String(item.access))
      || names.has(item.name)
    ) {
      throw new Error('The design runtime capability manifest is invalid');
    }
    names.add(item.name);
    return item;
  });
}

export function allowedRuntimeTool(tools, name, allowWrite) {
  const tool = tools.find((entry) => entry.name === name);
  if (tool === undefined || tool.access === 'sensitive' || (tool.access === 'document-write' && !allowWrite)) {
    return undefined;
  }
  return tool;
}

export function runtimeSkillVersion(content) {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(content)?.[1];
  return /^(?: {2})?version:[ \t]*([^\r\n]+)$/mu.exec(frontmatter ?? '')?.[1]?.trim();
}

export function runtimeSkillDescription(content) {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(content)?.[1];
  const raw = /^description:[ \t]*([^\r\n]+)$/mu.exec(frontmatter ?? '')?.[1]?.trim();
  if (raw === undefined || raw === '') return undefined;
  return raw.replace(/^(['"])([\s\S]*)\1$/u, '$2').trim() || undefined;
}

export function documentNeedsInitialStyle(json) {
  const document = JSON.parse(json);
  if (!isRecord(document)) throw new Error('Unable to inspect the active design document');
  const present = (value) => (Array.isArray(value)
    ? value.length > 0
    : isRecord(value)
      ? Object.keys(value).length > 0
      : value !== undefined && value !== null);
  if (document.designMd !== undefined && document.designMd !== null) return false;
  if (
    present(document.children)
    || ['variables', 'themes', 'variableCollections', 'sharedStyles'].some((key) => present(document[key]))
  ) {
    return false;
  }
  return !Array.isArray(document.pages) || document.pages.every((page) => isRecord(page) && !present(page.children));
}
