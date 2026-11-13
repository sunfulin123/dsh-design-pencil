/** Exact CanvasKit-based visual evidence renderer and glyph ink measurement for selected nodes. */

import { getCanvasKitEnvironment } from './canvaskit-scene-env.mjs';
import { measureGlyphInkInRgba } from './glyph-ink-measurement.mjs';
import { cropRgbaImage, decodePngRgba, encodePngRgba } from './png-rgba-codec.mjs';
import { canPaintSceneExactly, paintSceneNode } from './visual-evidence-painter.mjs';
import { extractPlainText, extractSolidFillRgba, parseRgbaHex } from './visual-evidence-styles.mjs';

export {
  cropRgbaImage,
  decodePngRgba,
  encodePngRgba,
  extractSolidFillRgba,
  getCanvasKitEnvironment,
  measureGlyphInkInRgba,
  parseRgbaHex,
};

function isObjectRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function activePageNodes(document) {
  const pages = Array.isArray(document.pages) ? document.pages : undefined;
  if (pages && pages.length > 0) {
    const rawIdx = isObjectRecord(document.editorMeta) ? Number(document.editorMeta.activePageIndex ?? 0) : 0;
    const idx = Math.max(0, Math.min(pages.length - 1, Number.isFinite(rawIdx) ? rawIdx : 0));
    const page = pages[idx];
    if (isObjectRecord(page) && Array.isArray(page.children)) return page.children.filter(isObjectRecord);
  }
  return Array.isArray(document.children) ? document.children.filter(isObjectRecord) : [];
}

function indexDocumentAndLayout(document, rawLayout) {
  const docNodesById = new Map();
  const walkDoc = (nodes) => {
    for (const node of nodes) {
      if (typeof node.id === 'string') docNodesById.set(node.id, node);
      if (Array.isArray(node.children)) walkDoc(node.children.filter(isObjectRecord));
    }
  };
  walkDoc(activePageNodes(document));
  const layoutRoots = Array.isArray(rawLayout)
    ? rawLayout
    : isObjectRecord(rawLayout) && Array.isArray(rawLayout.layout)
      ? rawLayout.layout
      : [];
  const layoutById = new Map();
  const parentLayoutById = new Map();
  const walkLayout = (items, parent) => {
    for (const item of items) {
      if (!isObjectRecord(item) || typeof item.id !== 'string') continue;
      layoutById.set(item.id, item);
      if (parent !== undefined) parentLayoutById.set(item.id, parent);
      if (Array.isArray(item.children)) walkLayout(item.children, item);
    }
  };
  walkLayout(layoutRoots);
  return {
    docNodesById,
    layoutById,
    parentLayoutById,
    layoutRoots,
    variables: isObjectRecord(document.variables) ? document.variables : undefined,
  };
}

function collectTextNodesForSelection(selectedIds, trees) {
  const collected = [];
  const seen = new Set();
  const visit = (rect, depth) => {
    if (collected.length >= 4 || depth > 3) return;
    const docNode = trees.docNodesById.get(rect.id);
    const kind = (typeof docNode?.type === 'string' ? docNode.type : undefined) ?? rect.type ?? '';
    if (kind === 'text' && !seen.has(rect.id)) {
      seen.add(rect.id);
      collected.push(rect);
    }
    if (Array.isArray(rect.children)) {
      for (const child of rect.children) visit(child, depth + 1);
    }
  };
  for (const id of selectedIds) {
    const rect = trees.layoutById.get(id);
    if (rect !== undefined) visit(rect, 0);
  }
  return collected;
}

function accumulateCropBoundsForSelection(selectedIds, trees) {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  const includeRect = (r) => {
    if (r === undefined || !Number.isFinite(r.x) || !Number.isFinite(r.y) || !(r.width > 0) || !(r.height > 0)) return;
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.height);
  };
  for (const id of selectedIds) {
    const rect = trees.layoutById.get(id);
    if (rect !== undefined) {
      includeRect(rect);
      const parent = trees.parentLayoutById.get(id);
      if (parent !== undefined && parent.width <= 800 && parent.height <= 240) includeRect(parent);
    }
  }
  if (!Number.isFinite(minX)) includeRect(trees.layoutRoots.at(0));
  return Number.isFinite(minX) ? { minX, minY, maxX, maxY } : undefined;
}

function computeSelectionCropBounds(selectedIds, trees) {
  const box = accumulateCropBoundsForSelection(selectedIds, trees);
  if (box === undefined) return undefined;
  const pad = 16;
  const root = trees.layoutRoots.at(0);
  const rootX = root === undefined ? 0 : root.x;
  const rootY = root === undefined ? 0 : root.y;
  const rootMaxX = root === undefined ? box.maxX + pad : root.x + root.width;
  const rootMaxY = root === undefined ? box.maxY + pad : root.y + root.height;
  const x0 = Math.max(rootX, Math.floor(box.minX - pad));
  const y0 = Math.max(rootY, Math.floor(box.minY - pad));
  const x1 = Math.min(rootMaxX, Math.ceil(box.maxX + pad));
  const y1 = Math.min(rootMaxY, Math.ceil(box.maxY + pad));
  return { x: x0, y: y0, width: Math.max(32, x1 - x0), height: Math.max(24, y1 - y0) };
}

function buildEvidenceSummary(fidelity, scale, cropBounds, textMeasurements) {
  if (fidelity === 'runtime-preview') {
    return 'Visual evidence fidelity: runtime-preview (synthetic color bars, NOT real font glyphs). Do NOT judge glyph baseline or CJK vertical centering from this preview; rely on geometric bounds only.';
  }
  const lines = [
    `Visual evidence fidelity: exact CanvasKit Skia glyph render (@${scale}x, crop=(${cropBounds.x}, ${cropBounds.y}, ${cropBounds.width}×${cropBounds.height})).`,
  ];
  for (const m of textMeasurements) {
    const parentDesc = m.parentBox
      ? ` inside parent ${JSON.stringify(m.parentBox.id)} (${m.parentBox.width}×${m.parentBox.height} at y=${m.parentBox.y})`
      : '';
    if (m.reliable && m.ink) {
      lines.push(
        `- Text node ${JSON.stringify(m.nodeId)} (${JSON.stringify(m.content)}, fontSize=${m.fontSize}px, box=${m.box.width}×${m.box.height} at y=${m.box.y}${parentDesc}): `
        + `inkTop=${m.ink.topInTextBoxPx}px, inkBottom=${m.ink.bottomInTextBoxPx}px, inkHeight=${m.ink.inkHeightPx}px, inkCenterOffsetInTextBox=${m.ink.inkCenterOffsetInTextBoxPx}px`
        + (m.ink.inkCenterOffsetInParentPx !== undefined ? `, inkCenterOffsetInParent=${m.ink.inkCenterOffsetInParentPx}px` : '')
        + `. ${m.ink.diagnosis}`,
      );
    } else {
      lines.push(
        `- Text node ${JSON.stringify(m.nodeId)} (${JSON.stringify(m.content)}): ink measurement unreliable (${m.unreliableReason ?? 'non-uniform background'}).`,
      );
    }
  }
  return lines.join('\n');
}

/** True when a sibling sits entirely above or below `rect`, so the parent holds a vertical stack. */
function isStackedInParent(rect, parentRect) {
  const siblings = Array.isArray(parentRect?.children) ? parentRect.children : [];
  return siblings.some((sibling) =>
    isObjectRecord(sibling)
    && sibling.id !== rect.id
    && typeof sibling.y === 'number'
    && typeof sibling.height === 'number'
    && sibling.height > 0
    && (sibling.y + sibling.height <= rect.y || sibling.y >= rect.y + rect.height));
}

function measureSelectedTextNodes(decoded, cropBounds, scale, ctx) {
  const { selectedIds, trees } = ctx;
  return collectTextNodesForSelection(selectedIds, trees).map((rect) => {
    const docNode = trees.docNodesById.get(rect.id) ?? {};
    const parentRect = trees.parentLayoutById.get(rect.id);
    const textBoxInImagePx = {
      x: (rect.x - cropBounds.x) * scale,
      y: (rect.y - cropBounds.y) * scale,
      width: rect.width * scale,
      height: rect.height * scale,
    };
    const measured = measureGlyphInkInRgba(
      decoded,
      textBoxInImagePx,
      scale,
      parentRect,
      { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      isStackedInParent(rect, parentRect),
    );
    return {
      nodeId: rect.id,
      name: typeof docNode.name === 'string' ? docNode.name : (rect.name ?? ''),
      content: extractPlainText(docNode),
      fontFamily: typeof docNode.fontFamily === 'string' ? docNode.fontFamily : 'Inter, system-ui, sans-serif',
      fontSize: typeof docNode.fontSize === 'number' ? docNode.fontSize : 16,
      ...(typeof docNode.lineHeight === 'number' ? { lineHeight: docNode.lineHeight } : {}),
      box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      ...(parentRect === undefined ? {} : {
        parentBox: {
          id: parentRect.id,
          ...(parentRect.name === undefined ? {} : { name: parentRect.name }),
          x: parentRect.x,
          y: parentRect.y,
          width: parentRect.width,
          height: parentRect.height,
        },
      }),
      ...measured,
    };
  });
}

async function tryRenderExactEvidence(cropBounds, selectedIds, trees, webBundleDir) {
  if (!trees.layoutRoots.every((root) => canPaintSceneExactly(root, trees))) return undefined;
  const env = await getCanvasKitEnvironment(webBundleDir);
  if (env === null) return undefined;
  const scale = Math.max(cropBounds.width, cropBounds.height) <= 600 ? 2 : 1;
  const surfaceW = Math.max(1, Math.min(2048, Math.round(cropBounds.width * scale)));
  const surfaceH = Math.max(1, Math.min(2048, Math.round(cropBounds.height * scale)));
  const surface = env.CK.MakeSurface(surfaceW, surfaceH);
  if (surface === null) return undefined;
  try {
    const canvas = surface.getCanvas();
    canvas.clear(env.CK.Color4f(1, 1, 1, 1));
    canvas.save();
    canvas.scale(scale, scale);
    canvas.translate(-cropBounds.x, -cropBounds.y);
    for (const root of trees.layoutRoots) paintSceneNode(env, canvas, root, trees);
    canvas.restore();
    surface.flush();
    const pixels = canvas.readPixels(0, 0, {
      width: surfaceW,
      height: surfaceH,
      colorType: env.CK.ColorType.RGBA_8888,
      alphaType: env.CK.AlphaType.Unpremul,
      colorSpace: env.CK.ColorSpace.SRGB,
    });
    if (pixels === null) return undefined;
    const decoded = { width: surfaceW, height: surfaceH, rgba: pixels };
    const pngBytes = encodePngRgba(surfaceW, surfaceH, pixels);
    const textMeasurements = measureSelectedTextNodes(decoded, cropBounds, scale, { selectedIds, trees });
    return {
      fidelity: 'exact',
      scale,
      cropBoundsDocPx: cropBounds,
      imageWidthPx: surfaceW,
      imageHeightPx: surfaceH,
      pngBytes,
      textMeasurements,
      summary: buildEvidenceSummary('exact', scale, cropBounds, textMeasurements),
    };
  } finally {
    surface.delete();
  }
}

/** Render selected nodes with exact CanvasKit glyph metrics (or fallback preview) and measure ink bounds. */
export async function renderSelectionVisualEvidence(options) {
  let document;
  try {
    document = JSON.parse(options.documentJson);
  } catch {
    return undefined;
  }
  if (!isObjectRecord(document)) return undefined;
  const trees = indexDocumentAndLayout(document, options.layoutTree);
  const cropBounds = computeSelectionCropBounds(options.selectedIds, trees);
  if (cropBounds === undefined) return undefined;
  const exact = await tryRenderExactEvidence(cropBounds, options.selectedIds, trees, options.webBundleDir);
  if (exact !== undefined) return exact;
  if (options.fallbackPreviewPng !== undefined && options.fallbackPreviewPng.length > 0) {
    try {
      const decoded = decodePngRgba(options.fallbackPreviewPng);
      const cropped = cropRgbaImage(decoded, { x: 0, y: 0, width: decoded.width, height: decoded.height });
      const pngBytes = encodePngRgba(cropped.width, cropped.height, cropped.rgba);
      return {
        fidelity: 'runtime-preview',
        scale: 1,
        cropBoundsDocPx: cropBounds,
        imageWidthPx: cropped.width,
        imageHeightPx: cropped.height,
        pngBytes,
        textMeasurements: [],
        summary: buildEvidenceSummary('runtime-preview', 1, cropBounds, []),
      };
    } catch {
      return undefined;
    }
  }
  return undefined;
}
