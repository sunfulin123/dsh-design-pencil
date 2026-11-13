/**
 * Which typeface the exact renderer has for each font face a design specifies.
 *
 * The CanvasKit renderer is certain to draw a named family only when that
 * family is registered with it: an app-bundled face or one downloaded into the
 * host font cache. Any other family is handed to the browser's text engine,
 * which draws it if the capturing machine happens to have it installed and the
 * system UI font otherwise, silently. A design can therefore specify one font
 * and be captured in another. This reports the difference so it can be
 * corrected or recorded instead of assumed away.
 */

import { concreteFamilies, extractDesignSpecFonts } from './design-spec-fonts.mjs';
export { extractDesignSpecFonts } from './design-spec-fonts.mjs';

const NAMED_WEIGHTS = { thin: 100, light: 300, normal: 400, regular: 400, medium: 500, semibold: 600, bold: 700 };
const MAX_NODE_IDS_PER_FACE = 12;

/**
 * Families staged into the web bundle (`crates/op-host-web/src/bundled_fonts_web.rs`).
 * `weights: null` marks a variable font that covers the whole weight axis; a
 * static file provides exactly the listed weights.
 */
export const BUNDLED_FONT_FAMILIES = new Map([
  ['roboto', { family: 'Roboto', weights: [400] }],
  ['inter', { family: 'Inter', weights: null }],
  ['space grotesk', { family: 'Space Grotesk', weights: null }],
  ['manrope', { family: 'Manrope', weights: null }],
  ['outfit', { family: 'Outfit', weights: null }],
  ['dm sans', { family: 'DM Sans', weights: null }],
  ['dm serif display', { family: 'DM Serif Display', weights: [400] }],
  ['dm mono', { family: 'DM Mono', weights: [400] }],
  ['instrument serif', { family: 'Instrument Serif', weights: [400] }],
  ['jetbrains mono', { family: 'JetBrains Mono', weights: null }],
  ['cormorant garamond', { family: 'Cormorant Garamond', weights: null }],
]);

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function weightOf(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value);
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return Math.round(numeric);
    return NAMED_WEIGHTS[value.trim().toLowerCase()] ?? 400;
  }
  return 400;
}

function familyKey(family) {
  return family.trim().toLowerCase();
}

function isNodeVisible(node) {
  return node.visible !== false && node.enabled !== false;
}

function activePageNodes(document) {
  const pages = Array.isArray(document?.pages) ? document.pages : undefined;
  if (pages && pages.length > 0) {
    const rawIdx = isRecord(document.editorMeta) ? Number(document.editorMeta.activePageIndex ?? 0) : 0;
    const idx = Math.max(0, Math.min(pages.length - 1, Number.isFinite(rawIdx) ? rawIdx : 0));
    const page = pages[idx];
    if (isRecord(page) && Array.isArray(page.children)) return page.children;
  }
  return Array.isArray(document?.children) ? document.children : [];
}

function indexAllNodes(document) {
  const byId = new Map();
  const walk = (nodes) => {
    for (const node of Array.isArray(nodes) ? nodes : []) {
      if (!isRecord(node)) continue;
      if (typeof node.id === 'string' && !byId.has(node.id)) byId.set(node.id, node);
      walk(node.children);
    }
  };
  walk(document?.children);
  for (const page of Array.isArray(document?.pages) ? document.pages : []) walk(page?.children);
  return byId;
}

/** Text faces a document specifies on the active page (or `rootId` subtree), expanding `ref` instances. */
export function collectFontUsage(document, rootId) {
  const normalizedRoot = typeof rootId === 'string' && rootId.trim() !== '' ? rootId.trim() : undefined;
  const allNodes = indexAllNodes(document);
  const usage = new Map();
  const add = (stack, weight, style, nodeId) => {
    const families = concreteFamilies(stack);
    if (families.length === 0) return;
    const face = { stack: families, weight: weightOf(weight), italic: style === 'italic' };
    const key = `${families.map(familyKey).join(',')}|${face.weight}|${face.italic}`;
    const entry = usage.get(key) ?? { ...face, nodeIds: [], runs: 0 };
    entry.runs += 1;
    if (typeof nodeId === 'string' && !entry.nodeIds.includes(nodeId) && entry.nodeIds.length < MAX_NODE_IDS_PER_FACE) {
      entry.nodeIds.push(nodeId);
    }
    usage.set(key, entry);
  };
  const visitInstanceMaster = (master, overrides, attributionId, visitedMasters, consumedKeys) => {
    if (!isRecord(master) || !isNodeVisible(master)) return;
    if (typeof master.id === 'string') {
      if (visitedMasters.has(master.id)) return;
      visitedMasters.add(master.id);
    }
    const walkMaster = (nodes) => {
      for (const child of Array.isArray(nodes) ? nodes : []) {
        if (!isRecord(child) || !isNodeVisible(child)) continue;
        const ov = typeof child.id === 'string' && isRecord(overrides?.[child.id]) ? overrides[child.id] : undefined;
        if (ov?.visible === false || ov?.enabled === false) continue;
        if (typeof child.id === 'string' && ov !== undefined) consumedKeys.add(child.id);
        if (child.type === 'text') {
          const family = typeof ov?.fontFamily === 'string' ? ov.fontFamily : child.fontFamily;
          const weight = ov?.fontWeight ?? child.fontWeight;
          const style = ov?.fontStyle ?? child.fontStyle;
          add(family, weight, style, attributionId);
          const segments = Array.isArray(ov?.content) ? ov.content : Array.isArray(child.content) ? child.content : [];
          for (const segment of segments) {
            if (!isRecord(segment)) continue;
            add(segment.fontFamily ?? family, segment.fontWeight ?? weight, segment.fontStyle ?? style, attributionId);
          }
        } else if (child.type === 'ref' && typeof child.ref === 'string') {
          visitInstanceMaster(
            allNodes.get(child.ref),
            isRecord(child.descendants) ? child.descendants : undefined,
            attributionId,
            new Set(visitedMasters),
            new Set(),
          );
        }
        walkMaster(child.children);
      }
    };
    walkMaster(master.children);
  };
  const visit = (nodes, inScope) => {
    for (const node of Array.isArray(nodes) ? nodes : []) {
      if (!isRecord(node) || !isNodeVisible(node)) continue;
      const scoped = inScope || node.id === normalizedRoot;
      if (scoped && node.type === 'text') {
        add(node.fontFamily, node.fontWeight, node.fontStyle, node.id);
        for (const segment of Array.isArray(node.content) ? node.content : []) {
          if (!isRecord(segment)) continue;
          add(segment.fontFamily ?? node.fontFamily, segment.fontWeight ?? node.fontWeight, segment.fontStyle ?? node.fontStyle, node.id);
        }
      }
      if (scoped && node.type === 'ref') {
        const overrides = isRecord(node.descendants) ? node.descendants : undefined;
        const consumedKeys = new Set();
        if (typeof node.ref === 'string') {
          visitInstanceMaster(allNodes.get(node.ref), overrides, node.id, new Set(), consumedKeys);
        }
        if (overrides !== undefined) {
          for (const [key, override] of Object.entries(overrides)) {
            if (!consumedKeys.has(key) && isRecord(override) && typeof override.fontFamily === 'string') {
              add(override.fontFamily, override.fontWeight, override.fontStyle, node.id);
            }
          }
        }
      }
      visit(node.children, scoped);
    }
  };
  const everything = normalizedRoot === undefined;
  visit(activePageNodes(document), everything);
  return [...usage.values()];
}

function downloadedFaces(manifestFaces) {
  const byFamily = new Map();
  for (const face of Array.isArray(manifestFaces) ? manifestFaces : []) {
    if (!isRecord(face) || typeof face.family !== 'string') continue;
    const key = familyKey(face.family);
    byFamily.set(key, [...(byFamily.get(key) ?? []), { weight: weightOf(face.weight), italic: face.italic === true }]);
  }
  return byFamily;
}

function resolveFamily(family, face, downloaded) {
  const key = familyKey(family);
  const exact = downloaded.get(key)?.some((have) => have.weight === face.weight && have.italic === face.italic);
  if (exact) return { status: 'available', source: 'downloaded', renderedFamily: family };
  const bundled = BUNDLED_FONT_FAMILIES.get(key);
  if (bundled !== undefined) {
    const covered = !face.italic && (bundled.weights === null || bundled.weights.includes(face.weight));
    return covered
      ? { status: 'available', source: 'bundled', renderedFamily: bundled.family }
      : {
          status: 'weight-substituted',
          source: 'bundled',
          renderedFamily: bundled.family,
          note: `${bundled.family} is bundled only as ${bundled.weights === null ? 'an upright variable font' : `weight ${bundled.weights.join(', ')}`}; ${face.weight}${face.italic ? ' italic' : ''} is not available and another style is drawn.`,
        };
  }
  if (downloaded.has(key)) {
    return {
      status: 'weight-substituted',
      source: 'downloaded',
      renderedFamily: family,
      note: `${family} is registered, but not at weight ${face.weight}${face.italic ? ' italic' : ''}; another registered style is drawn.`,
    };
  }
  return undefined;
}

/**
 * Compare each specified face with what the exact renderer can draw.
 * `unregistered` means no family of the stack is registered, so what is drawn
 * depends on the fonts installed on the capturing machine.
 */
export function resolveFonts(document, manifestFaces, rootId) {
  const downloaded = downloadedFaces(manifestFaces);
  const faces = collectFontUsage(document, rootId).map((face) => {
    const specified = { family: face.stack[0], weight: face.weight, italic: face.italic };
    const shared = { ...specified, ...(face.stack.length > 1 ? { stack: face.stack } : {}), runs: face.runs, nodeIds: face.nodeIds };
    for (const family of face.stack) {
      const resolved = resolveFamily(family, face, downloaded);
      if (resolved === undefined) continue;
      const fellThrough = familyKey(family) !== familyKey(face.stack[0]);
      return {
        ...shared,
        ...resolved,
        ...(fellThrough
          ? { status: 'unregistered', note: `${face.stack[0]} is not registered with the renderer; unless the capturing machine has it installed, the stack falls through to ${resolved.renderedFamily}.` }
          : {}),
      };
    }
    return {
      ...shared,
      status: 'unregistered',
      source: null,
      renderedFamily: null,
      note: `${face.stack[0]} is not registered with the renderer; it is drawn only if the capturing machine has it installed, otherwise the system UI font is used.`,
    };
  });
  const count = (status) => faces.filter((face) => face.status === status).length;
  const specFonts = extractDesignSpecFonts(document);
  const authoredSet = new Set(
    faces.flatMap((face) => [
      familyKey(face.family),
      ...(Array.isArray(face.stack) ? face.stack.map(familyKey) : []),
    ]),
  );
  const renderedSet = new Set(
    faces
      .filter((face) => face.status === 'available' && typeof face.renderedFamily === 'string')
      .map((face) => familyKey(face.renderedFamily)),
  );
  const designSpec = specFonts.families.length === 0
    ? undefined
    : {
        specifiedFamilies: specFonts.families,
        ...(specFonts.bodyFont ? { bodyFont: specFonts.bodyFont } : {}),
        ...(specFonts.headingFont ? { headingFont: specFonts.headingFont } : {}),
        missingFromCanvas: specFonts.families.filter((family) => !authoredSet.has(familyKey(family))),
        unmatchedRendererFamilies: specFonts.families.filter(
          (family) => authoredSet.has(familyKey(family)) && !renderedSet.has(familyKey(family)),
        ),
        specMatched: specFonts.families.every(
          (family) => authoredSet.has(familyKey(family)) && renderedSet.has(familyKey(family)),
        ),
      };
  return {
    faces,
    counts: { available: count('available'), weightSubstituted: count('weight-substituted'), unregistered: count('unregistered') },
    ...(designSpec === undefined ? {} : { designSpec }),
    coverage: {
      status: 'checked',
      reason:
        'Compares specified text faces with the families registered for the exact headless renderer (bundled faces and the host font cache). It does not inspect rendered glyphs, fonts installed on the capturing machine, per-script fallback for characters a registered family lacks, or system fonts an editor tab may load with local-font permission.',
    },
  };
}

function facesToFetch(resolution) {
  return resolution.faces
    .filter((face) => face.status !== 'available')
    .map(({ family, weight, italic }) => ({ family, weight, italic }));
}

/**
 * Attach `fontResolution` to a quality result. With `fetchFonts`, first try to
 * download the faces that are not registered, then report the outcome of that
 * attempt alongside the re-evaluated resolution.
 */
export async function attachFontResolution(result, { document, fonts, rootId, fetchFonts, signal }) {
  if (result?.isError || !isRecord(result?.structuredContent)) return result;
  let resolution = resolveFonts(document, fonts?.manifest().faces, rootId);
  let fetched;
  const wanted = facesToFetch(resolution);
  if (fetchFonts === true && wanted.length > 0 && typeof fonts?.ensure === 'function') {
    const outcomes = await fonts.ensure(wanted, signal === undefined ? undefined : { signal });
    fetched = outcomes.map((face) => ({
      family: face.family,
      weight: face.weight,
      italic: face.italic,
      available: face.available === true,
      ...(typeof face.error === 'string' ? { reason: face.error } : {}),
      ...(typeof face.warning === 'string' ? { warning: face.warning } : {}),
    }));
    resolution = resolveFonts(document, fonts.manifest().faces, rootId);
  }
  const structuredContent = {
    ...result.structuredContent,
    fontResolution: {
      ...resolution,
      ...(fetched === undefined
        ? {}
        : {
            fetched,
            // The renderer polls the host font cache, so a face downloaded just now is not in an earlier capture.
            note: 'Downloaded faces reach the renderer within a few seconds. Capture a fresh screenshot before judging typography.',
          }),
    },
  };
  return {
    ...result,
    structuredContent,
    content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
  };
}
