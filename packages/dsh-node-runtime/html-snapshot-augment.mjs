// Merge page facts the DOM extractor cannot express into its snapshot JSON.
// Entries are matched to snapshot nodes by tag and page rect, because the
// extractor serializes elements without a stable handle back to the DOM.

const RECT_TOLERANCE = 1.5;

function sameRect(a, b) {
  return (
    a &&
    b &&
    Math.abs(a.x - b.x) <= RECT_TOLERANCE &&
    Math.abs(a.y - b.y) <= RECT_TOLERANCE &&
    Math.abs(a.w - b.w) <= RECT_TOLERANCE &&
    Math.abs(a.h - b.h) <= RECT_TOLERANCE
  );
}

function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  if (Array.isArray(node.children)) for (const child of node.children) walk(child, visit);
}

function takeMatch(entries, tag, rect) {
  const index = entries.findIndex((entry) => entry.tag === tag && sameRect(entry.rect, rect));
  return index < 0 ? null : entries.splice(index, 1)[0];
}

/**
 * @param {object} snapshot parsed extractor output (mutated in place)
 * @param {{controls?: Array, mediaPixels?: Array}} facts
 * @returns {{controls: number, media: number}} how many entries were applied
 */
export function augmentSnapshot(snapshot, { controls = [], mediaPixels = [] } = {}) {
  const openControls = [...controls];
  const openMedia = [...mediaPixels];
  let appliedControls = 0;
  let appliedMedia = 0;
  walk(snapshot?.root, (node) => {
    if (node.kind === 'element' && openControls.length) {
      const match = takeMatch(openControls, node.tag, node.rect);
      if (match) {
        node.control = match.control;
        appliedControls += 1;
      }
    } else if (node.kind === 'image' && openMedia.length) {
      const match = takeMatch(openMedia, node.tag, node.rect);
      if (match) {
        node.src = match.src;
        node.tainted = false;
        appliedMedia += 1;
      }
    }
  });
  return { controls: appliedControls, media: appliedMedia };
}

/** Replace the masked box with its composited pixels, keeping surrounding nodes editable. */
export function applyMaskedPixels(snapshot, masks) {
  const matched = new Map(masks.map(mask => [mask, []]));
  walk(snapshot.root, node => {
    if (node.kind !== 'element' && node.kind !== 'image') return;
    for (const mask of masks) {
      if (node.tag === mask.tag && sameRect(node.rect, mask.nodeRect) &&
          (node.kind === 'image' ||
            ((node.attrs?.id || '') === mask.id && (node.attrs?.class || '') === mask.className))) {
        matched.get(mask).push(node);
      }
    }
  });
  let applied = 0;
  for (const [mask, nodes] of matched) {
    if (nodes.length !== 1) continue;
    const [node] = nodes;
    const position = node.styles?.position;
    for (const key of ['children', 'd', 'fill', 'fillRule', 'vectorRect', 'tainted']) delete node[key];
    Object.assign(node, {
      kind: 'image', src: mask.src, styles: position ? { position } : {},
    });
    applied++;
  }
  return applied;
}

/** Match only images the browser extractor could not embed, using its selected source. */
export function remoteImageTargets(snapshot, facts) {
  const bySource = new Map();
  for (const candidate of facts) {
    if (!bySource.has(candidate.src)) bySource.set(candidate.src, []);
    bySource.get(candidate.src).push(candidate);
  }
  const targets = [];
  let count = 0;
  walk(snapshot.root, node => {
    if (node.kind !== 'image' || node.tag !== 'img' || !node.tainted || !/^https?:\/\//.test(node.src)) return;
    count++;
    const candidates = bySource.get(node.src);
    const matched = candidates?.filter(candidate => sameRect(candidate.nodeRect, node.rect));
    if (matched?.length === 1) targets.push({ rect: matched[0].rect, painted: matched[0].painted, node });
  });
  return { count, targets };
}
