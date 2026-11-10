import { AssetStoreError } from './asset-store.mjs';

function dimensionsOf(text) {
  const match = /(?:^|\D)(\d{3,4})\s*(?:x|×|✕|\*)\s*(\d{3,5})(?:\D|$)/iu.exec(text);
  const width = match ? Number(match[1]) : undefined;
  const height = match ? Number(match[2]) : undefined;
  return width >= 240 && width <= 3840 && height >= 240 && height <= 20000
    ? { width, height } : undefined;
}

function deviceOf(text) {
  if (/\b(?:mobile|phone|iphone|ios|android)\b|移动(?:端|应用|界面)?|手机(?:端|应用|界面)?/iu.test(text)) return 'mobile';
  if (/\b(?:desktop|web|website|webapp)\b|桌面|电脑|网页|网站|官网/iu.test(text)) return 'web';
  return undefined;
}

export function planDesignCanvas({ userMessage, context = '' }) {
  if (Buffer.byteLength(userMessage, 'utf8') + Buffer.byteLength(context, 'utf8') > 64 * 1024)
    throw new AssetStoreError('asset-invalid', 'Design request exceeds 64 KiB');
  const directDevice = deviceOf(userMessage);
  const dimensions = dimensionsOf(userMessage) ?? (directDevice ? undefined : dimensionsOf(context));
  const device = directDevice ?? (dimensions ? (dimensions.width <= 500 ? 'mobile' : 'web') : deviceOf(context));
  const mobile = device === 'mobile';
  const explicit = dimensions !== undefined;
  const canvas = {
    platform: mobile ? 'mobile' : 'web',
    width: dimensions?.width ?? (mobile ? 390 : 1440),
    seedHeight: dimensions?.height ?? (mobile ? 844 : 900),
    finalHeight: dimensions?.height ?? 'fit_content',
    fixedViewport: explicit,
    rootCount: 1,
    rootType: 'frame',
  };
  const root = {
    type: 'frame', name: 'Generated Page', width: canvas.width,
    height: canvas.finalHeight,
    ...(explicit ? {} : { minHeight: canvas.seedHeight }),
    layout: 'vertical', padding: 0, gap: 0,
  };
  return { canvas, seedScript: `I(null, ${JSON.stringify(root)});` };
}
