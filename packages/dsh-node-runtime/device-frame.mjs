/** Device-frame decoration and authored root identification for generated .op documents. */

export const DEVICE_FRAME_NAME_PREFIX = 'Synapse Device Frame';
export const DEVICE_FRAME_STATUSES = ['browser', 'phone', 'skipped'];
const ID_PREFIX = 'synapse-device-frame';

const BROWSER_BAR_HEIGHT = 40;
const PHONE_SIDE_BEZEL = 12;
const PHONE_TOP_BEZEL = 48;
const PHONE_BOTTOM_BEZEL = 24;
const MIN_WEB_WIDTH = 1024;
const MIN_MOBILE_WIDTH = 320;
const MAX_MOBILE_WIDTH = 500;
const MAX_SCREEN_WIDTH = 500;
const MIN_SCREEN_HEIGHT = 640;

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOwnedDeviceRoot(node) {
  return isRecord(node)
    && node.id === ID_PREFIX
    && node.type === 'frame'
    && node.locked === true
    && (node.name === `${DEVICE_FRAME_NAME_PREFIX} · Browser`
      || node.name === `${DEVICE_FRAME_NAME_PREFIX} · Phone`);
}

/** True for a decoration node owned by this module, never for authored design content. */
export function isDeviceFrameNode(node) {
  return isRecord(node) && typeof node.name === 'string' && node.name.startsWith(DEVICE_FRAME_NAME_PREFIX);
}

/** Reserved ids this module assigns to decoration nodes; authored ids never use this prefix. */
export function isDeviceFrameId(id) {
  return id === ID_PREFIX || (typeof id === 'string' && id.startsWith(`${ID_PREFIX}-`));
}

function solid(color) {
  return [{ type: 'solid', color }];
}

function browserFrame(bounds) {
  const dots = [
    ['Close', '#FF5F57'],
    ['Minimize', '#FEBC2E'],
    ['Zoom', '#28C840'],
  ].map(([name, color], index) => ({
    id: `${ID_PREFIX}-${name.toLowerCase()}`,
    type: 'ellipse',
    name: `${DEVICE_FRAME_NAME_PREFIX} · ${name}`,
    x: 16 + index * 20,
    y: 14,
    width: 12,
    height: 12,
    fill: solid(color),
  }));
  return {
    id: ID_PREFIX,
    type: 'frame',
    name: `${DEVICE_FRAME_NAME_PREFIX} · Browser`,
    locked: true,
    previewAsScreen: false,
    layout: 'none',
    x: bounds.x,
    y: bounds.y - BROWSER_BAR_HEIGHT,
    width: bounds.width,
    height: bounds.height + BROWSER_BAR_HEIGHT,
    cornerRadius: 12,
    fill: solid('#EEF0F3'),
    effects: [{ type: 'shadow', offsetX: 0, offsetY: 8, blur: 32, spread: 0, color: '#0F172A1F' }],
    children: dots,
  };
}

function phoneFrame(bounds) {
  const width = bounds.width + PHONE_SIDE_BEZEL * 2;
  return {
    id: ID_PREFIX,
    type: 'frame',
    name: `${DEVICE_FRAME_NAME_PREFIX} · Phone`,
    locked: true,
    previewAsScreen: false,
    layout: 'none',
    x: bounds.x - PHONE_SIDE_BEZEL,
    y: bounds.y - PHONE_TOP_BEZEL,
    width,
    height: bounds.height + PHONE_TOP_BEZEL + PHONE_BOTTOM_BEZEL,
    cornerRadius: 56,
    fill: solid('#EEF0F3'),
    effects: [{ type: 'shadow', offsetX: 0, offsetY: 8, blur: 32, spread: 0, color: '#0F172A1F' }],
    children: [
      {
        id: `${ID_PREFIX}-island`,
        type: 'frame',
        name: `${DEVICE_FRAME_NAME_PREFIX} · Dynamic Island`,
        layout: 'none',
        x: Math.round((width - 112) / 2),
        y: 12,
        width: 112,
        height: 26,
        cornerRadius: 13,
        fill: solid('#000000'),
        children: [],
      },
    ],
  };
}

/** Decoration nodes for a measured page root; undefined when not a single web or mobile page. */
export function deviceFrameFor(bounds) {
  if (!isRecord(bounds)) return undefined;
  if (![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite) || bounds.height <= 0) {
    return undefined;
  }
  if (bounds.width >= MIN_WEB_WIDTH) return { status: 'browser', node: browserFrame(bounds) };
  if (bounds.width >= MIN_MOBILE_WIDTH && bounds.width <= MAX_MOBILE_WIDTH) {
    return { status: 'phone', node: phoneFrame(bounds) };
  }
  return undefined;
}

function knownScreenHeight(child) {
  const floor = typeof child.minHeight === 'number' ? child.minHeight : undefined;
  if (typeof child.height !== 'number') return floor;
  return floor === undefined ? child.height : Math.max(child.height, floor);
}

function isPhoneScreen(child) {
  if (!isRecord(child) || child.type !== 'frame' || typeof child.width !== 'number') return false;
  const height = knownScreenHeight(child);
  return child.width >= MIN_MOBILE_WIDTH
    && child.width <= MAX_SCREEN_WIDTH
    && height !== undefined
    && height >= MIN_SCREEN_HEIGHT
    && height >= child.width * 1.6;
}

function isMultiScreenBoard(root) {
  return root.layout === 'horizontal'
    && Array.isArray(root.children)
    && root.children.filter(isPhoneScreen).length >= 2;
}

function rootContainer(document) {
  if (Array.isArray(document.children) && document.children.length > 0) return document.children;
  if (!Array.isArray(document.pages) || document.pages.length !== 1 || !isRecord(document.pages[0])) {
    return undefined;
  }
  return Array.isArray(document.pages[0].children) ? document.pages[0].children : undefined;
}

/** Add or replace the device frame behind the single page root of a generated document. */
export async function applyDeviceFrame(documentJson, measure = measureRootWithRuntime) {
  const skipped = { documentJson, deviceFrame: 'skipped' };
  let document;
  try {
    document = JSON.parse(documentJson);
  } catch {
    return skipped;
  }
  if (!isRecord(document)) return skipped;
  const container = rootContainer(document);
  if (container === undefined) return skipped;
  const authored = container.filter((node) => !isOwnedDeviceRoot(node));
  const root = authored[0];
  if (
    authored.length !== 1
    || !isRecord(root)
    || root.type !== 'frame'
    || typeof root.id !== 'string'
    || isMultiScreenBoard(root)
  ) {
    return skipped;
  }
  let bounds;
  try {
    bounds = await measure(document, root.id);
  } catch {
    return skipped;
  }
  const frame = bounds === undefined ? undefined : deviceFrameFor(bounds);
  if (frame === undefined) return skipped;
  container.splice(0, container.length, root, frame.node);
  return { documentJson: JSON.stringify(document), deviceFrame: frame.status };
}

let cachedEngineSession;

/** Measure a root directly with EngineSession's layout pass so fit_content heights are exact. */
export async function measureRootWithRuntime(document, rootId) {
  cachedEngineSession ??= import('./engine-session.mjs');
  const { EngineSession } = await cachedEngineSession;
  const session = new EngineSession(document);
  try {
    const reply = session.callTool('snapshot_layout', { maxDepth: 1 });
    const entry = reply.isError === true
      ? undefined
      : reply.structuredContent?.layout?.find((item) => item.id === rootId);
    if (entry === undefined) return undefined;
    const { x, y, width, height } = entry;
    return typeof x === 'number' && typeof y === 'number' && typeof width === 'number' && typeof height === 'number'
      ? { x, y, width, height }
      : undefined;
  } finally {
    session.close();
  }
}

export function draftRootNodes(document) {
  if (!isRecord(document)) return [];
  const pageRoots = (Array.isArray(document.pages) ? document.pages : []).flatMap((page) =>
    isRecord(page) && Array.isArray(page.children) ? page.children : [],
  );
  const candidates = Array.isArray(document.children) && document.children.length > 0
    ? document.children
    : pageRoots;
  return candidates.filter((node) => !isDeviceFrameNode(node));
}

export function draftRootNodeId(documentJson, expectedRootId) {
  let document;
  try {
    document = JSON.parse(documentJson);
  } catch {
    return undefined;
  }
  if (!isRecord(document)) return undefined;
  const roots = draftRootNodes(document);
  const root = expectedRootId === undefined
    ? (roots.length === 1 ? roots[0] : undefined)
    : roots.find((node) => isRecord(node) && node.id === expectedRootId);
  if (!isRecord(root)) return undefined;
  const id = root.id;
  return typeof id === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(id) ? id : undefined;
}
