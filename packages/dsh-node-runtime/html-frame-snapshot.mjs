/** Capture each accessible document in place, then compose its editable tree at the iframe viewport. */
import { describePage } from './html-capture-page.mjs';
import { framePageCall } from './html-frame-context.mjs';
import { isIconFontGlyph } from './html-font-defaults.mjs';
import { augmentSnapshot } from './html-snapshot-augment.mjs';
import { cropRgbaImage, decodePngRgba, encodePngRgba } from './png-rgba-codec.mjs';

function readFrameSnapshots({ maxMedia }, context) {
  const captured = [];
  const warnings = [];
  const rectOf = (x, y, w, h) => ({ x, y, w, h });
  for (const entry of context.inventory()) {
    if (entry.status !== 'available') continue;
    const { doc, frames } = context.resolve(entry.framePath);
    const view = doc.defaultView;
    let x = window.scrollX;
    let y = window.scrollY;
    const viewports = [rectOf(x, y, window.innerWidth, window.innerHeight)];
    let owner;
    let transformed = false;
    for (const frame of frames) {
      const bounds = frame.getBoundingClientRect();
      // Bounds from a rotated or scaled owner cannot be merged as CSS pixels.
      if (Math.abs(bounds.width - frame.offsetWidth) > 1 ||
          Math.abs(bounds.height - frame.offsetHeight) > 1 ||
          frame.ownerDocument.defaultView.getComputedStyle(frame).transform !== 'none') {
        transformed = true;
        break;
      }
      owner = rectOf(x + bounds.left, y + bounds.top, bounds.width, bounds.height);
      x = owner.x + frame.clientLeft;
      y = owner.y + frame.clientTop;
      viewports.push(rectOf(x, y, frame.clientWidth, frame.clientHeight));
    }
    const label = entry.framePath.join(' > ');
    if (transformed) {
      warnings.push(`Frame ${label} has a transformed viewport; editable placement is unavailable`);
      continue;
    }
    const snapshot = extractFrame(view);
    if (!snapshot?.root) {
      warnings.push(`Frame ${label || 'root'} produced no editable snapshot`);
      continue;
    }
    const facts = describeFrame({ maxMedia }, view, iconGlyph);
    const background = [doc.body, doc.documentElement].map(element => view.getComputedStyle(element).backgroundColor)
      .find(color => color && color !== 'transparent' && !/, *0\)$/.test(color));
    captured.push({
      background,
      framePath: entry.framePath, snapshot, facts, owner, viewports,
      x, y, scrollX: view.scrollX, scrollY: view.scrollY,
    });
  }
  return { captured, warnings };
}

function translateNodes(node, frame, fixed = false) {
  fixed ||= node.styles?.position === 'fixed';
  if (node.rect) {
    node.rect.x += frame.x - (fixed ? 0 : frame.scrollX);
    node.rect.y += frame.y - (fixed ? 0 : frame.scrollY);
  }
  for (const child of node.children ?? []) translateNodes(child, frame, fixed);
}

function sameRect(a, b) {
  return a && b && ['x', 'y', 'w', 'h'].every(key => Math.abs(a[key] - b[key]) <= 1.5);
}

function findOwners(node, rect, out = []) {
  if (node.tag === 'iframe' && sameRect(node.rect, rect)) out.push(node);
  for (const child of node.children ?? []) findOwners(child, rect, out);
  return out;
}

function within(rect, clip) {
  return rect.x >= clip.x && rect.y >= clip.y &&
    rect.x + rect.w <= clip.x + clip.w && rect.y + rect.h <= clip.y + clip.h;
}

function projectedRect(rect, frame) {
  return {
    ...rect, x: rect.x + frame.x - frame.scrollX, y: rect.y + frame.y - frame.scrollY,
  };
}

function linkFrame(frame, attached, warnings) {
  const parent = attached.get(JSON.stringify(frame.framePath.slice(0, -1)));
  const owners = parent ? findOwners(parent.snapshot.root, frame.owner) : [];
  if (owners.length !== 1) {
    warnings.push(`Frame ${frame.framePath.join(' > ')} could not be matched to a unique snapshot owner`);
    return false;
  }
  const rect = frame.viewports.at(-1);
  owners[0].styles = { ...owners[0].styles, overflow: 'hidden' };
  owners[0].children = [{
    kind: 'element', tag: 'div', rect,
    styles: { overflow: 'hidden', ...(frame.background && { 'background-color': frame.background }) },
    children: [frame.snapshot.root],
  }];
  return true;
}

async function captureCrops(page, frames, warnings) {
  const eligible = (frame, item, limit) => {
    const rect = projectedRect(item.rect, frame);
    return rect.w >= 1 && rect.h >= 1 && rect.w <= limit && rect.h <= limit &&
      frame.viewports.every(clip => within(rect, clip));
  };
  const visibleIcons = frames.flatMap(frame => frame.facts.icons
    .filter(icon => icon.loaded && eligible(frame, icon, 256))
    .map(icon => ({ ...icon, rect: projectedRect(icon.rect, frame) }))).slice(0, 64);
  const visibleMedia = frames.flatMap(frame => frame.facts.media
    .filter(item => eligible(frame, item, 4096))
    .map(item => ({ frame, item }))).slice(0, 24);
  if (!visibleIcons.length && !visibleMedia.length) return [];
  const viewport = frames[0].viewports[0];
  const { data } = await page.send('Page.captureScreenshot', {
    format: 'png', fromSurface: true, captureBeyondViewport: false,
  });
  if (!data) {
    warnings.push('The rendered viewport was unavailable for media and icon fallbacks');
    return [];
  }
  const image = decodePngRgba(Buffer.from(data, 'base64'));
  const crop = rect => {
    const pixels = cropRgbaImage(image, {
      x: rect.x - viewport.x, y: rect.y - viewport.y, width: rect.w, height: rect.h,
    });
    const bytes = encodePngRgba(pixels.width, pixels.height, pixels.rgba);
    return `data:image/png;base64,${Buffer.from(bytes).toString('base64')}`;
  };
  let bytes = 0;
  for (const { frame, item } of visibleMedia) {
    const src = crop(projectedRect(item.rect, frame));
    bytes += src.length;
    if (bytes > 24 * 1024 * 1024) {
      warnings.push('Frame media raster evidence reached the capture budget');
      break;
    }
    frame.mediaPixels.push({ tag: item.tag, rect: item.rect, src });
  }
  return visibleIcons.map(icon => ({ ...icon, src: crop(icon.rect) }));
}

/** Reuse the browser extractor in each actual document realm without modifying the source DOM. */
export async function captureFrameSnapshots(page, extractorScript, { maxMedia, pixelMedia, warnings }) {
  const script = `(() => {
    const describeFrame = ${describePage.toString()};
    const iconGlyph = ${isIconFontGlyph.toString()};
    const extractFrame = window => {
      const { document, Node, NodeFilter, XMLSerializer } = window;
      const globalThis = { openpencilSnapshotOptions: { returnOnly: true } };
      return (${extractorScript.trim().replace(/;$/u, '')});
    };
    return ${framePageCall(readFrameSnapshots, { maxMedia })};
  })()`;
  const result = await page.evaluate(script);
  warnings.push(...result.warnings);
  const [root] = result.captured;
  if (!root || root.framePath.length !== 0) throw new Error('Root snapshot extraction failed');
  for (const frame of result.captured) frame.mediaPixels = [];
  const iconPixels = pixelMedia ? await captureCrops(page, result.captured, warnings) : [];
  const attached = new Map();
  const iconFonts = [];
  const fontSources = [];
  const fontStylesheets = [];
  const fonts = [];
  for (const frame of result.captured) {
    augmentSnapshot(frame.snapshot, { controls: frame.facts.controls, mediaPixels: frame.mediaPixels });
    translateNodes(frame.snapshot.root, frame);
    if (frame.framePath.length && !linkFrame(frame, attached, warnings)) continue;
    attached.set(JSON.stringify(frame.framePath), frame);
    fonts.push(...frame.facts.fonts);
    iconFonts.push(...frame.facts.icons.map(({ family, weight, style }) => ({ family, weight, style })));
    fontSources.push(...frame.facts.fontSources);
    fontStylesheets.push(...frame.facts.fontStylesheets);
    if (frame.snapshot.truncated) root.snapshot.truncated = true;
  }
  return { snapshot: JSON.stringify(root.snapshot), fonts, fontSources, fontStylesheets, iconFonts, iconPixels };
}
