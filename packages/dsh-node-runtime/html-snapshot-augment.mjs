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
