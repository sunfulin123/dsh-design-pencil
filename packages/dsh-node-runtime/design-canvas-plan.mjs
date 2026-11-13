import { AssetStoreError } from './asset-store.mjs';

function dimensionsOf(text) {
  if (typeof text !== 'string' || text.length === 0) return undefined;
  const match = /(?:^|\D)(\d{3,4})\s*(?:x|×|✕|\*)\s*(\d{3,5})(?:\D|$)/iu.exec(text);
  const width = match ? Number(match[1]) : undefined;
  const height = match ? Number(match[2]) : undefined;
  return width >= 240 && width <= 3840 && height >= 240 && height <= 20000
    ? { width, height } : undefined;
}

function validDimension(value, min, max, label) {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new AssetStoreError('asset-invalid', `${label} must be an integer between ${min} and ${max}`);
  }
  return value;
}

export function planDesignCanvas({ platform, width, height, userMessage = '', context = '' } = {}) {
  const messageText = String(userMessage ?? '');
  const contextText = String(context ?? '');
  if (Buffer.byteLength(messageText, 'utf8') + Buffer.byteLength(contextText, 'utf8') > 64 * 1024)
    throw new AssetStoreError('asset-invalid', 'Design request exceeds 64 KiB');
  if (platform !== undefined && platform !== 'web' && platform !== 'mobile')
    throw new AssetStoreError('asset-invalid', 'Canvas platform must be "web" or "mobile"');
  const explicitWidth = validDimension(width, 240, 3840, 'width');
  const explicitHeight = validDimension(height, 240, 20000, 'height');
  const parsed = explicitWidth !== undefined && explicitHeight !== undefined
    ? { width: explicitWidth, height: explicitHeight }
    : dimensionsOf(messageText) ?? (platform ? undefined : dimensionsOf(contextText));
  const resolvedWidth = explicitWidth ?? parsed?.width;
  const resolvedHeight = explicitHeight ?? parsed?.height;
  const resolvedPlatform = platform ?? (resolvedWidth !== undefined ? (resolvedWidth <= 500 ? 'mobile' : 'web') : 'web');
  const mobile = resolvedPlatform === 'mobile';
  const explicit = resolvedWidth !== undefined && resolvedHeight !== undefined;
  const canvas = {
    platform: mobile ? 'mobile' : 'web',
    width: resolvedWidth ?? (mobile ? 390 : 1440),
    seedHeight: resolvedHeight ?? (mobile ? 844 : 900),
    finalHeight: explicit ? resolvedHeight : 'fit_content',
    fixedViewport: explicit,
    rootCount: 1,
    rootType: 'frame',
  };
  const root = {
    type: 'frame', name: 'Generated Page', width: canvas.width,
    height: canvas.finalHeight,
    ...(explicit ? { clipContent: true } : { minHeight: canvas.seedHeight }),
    layout: 'vertical', padding: 0, gap: 0,
  };
  return { canvas, seedScript: `I(null, ${JSON.stringify(root)});` };
}
