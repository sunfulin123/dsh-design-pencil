/** Pure design-to-code context extraction and device-frame sanitization for .op documents. */

import { isDeviceFrameId, isDeviceFrameNode } from './device-frame.mjs';

function isObjectRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function findNodeInTree(nodes, targetId) {
  for (const node of nodes) {
    if (node.id === targetId) return node;
    if (Array.isArray(node.children)) {
      const hit = findNodeInTree(node.children.filter(isObjectRecord), targetId);
      if (hit !== undefined) return hit;
    }
  }
  return undefined;
}

export function extractRawDocumentRoots(doc, pageId) {
  const pages = Array.isArray(doc.pages) ? doc.pages.filter(isObjectRecord) : [];
  const activePage = pages.find((p) => p.id === pageId) ?? pages.at(0);
  const activePageId = typeof activePage?.id === 'string' ? activePage.id : '0';
  const authored = (nodes) => nodes.filter(isObjectRecord).filter((node) => !isDeviceFrameNode(node));
  if (activePage !== undefined && Array.isArray(activePage.children)) {
    return { activePageId, roots: authored(activePage.children) };
  }
  return { activePageId, roots: Array.isArray(doc.children) ? authored(doc.children) : [] };
}

export function buildFallbackFromRawDocument(doc, requestedIds, pageId) {
  const { activePageId, roots } = extractRawDocumentRoots(doc, pageId);
  const matchedNodes = requestedIds
    .map((id) => findNodeInTree(roots, id))
    .filter((n) => n !== undefined);
  const finalNodes = matchedNodes.length > 0 ? matchedNodes : roots;
  const targetNodeIds = finalNodes
    .map((n) => (typeof n.id === 'string' ? n.id : ''))
    .filter(Boolean);
  return {
    activePageId,
    targetNodeIds,
    selectionActive: requestedIds.length > 0,
    code: {
      designJsx: null,
      tailwindJsx: null,
      htmlCss: null,
      cssVariables: '',
    },
    variables: isObjectRecord(doc.variables) ? doc.variables : {},
    themes: doc.themes ?? null,
    designMd: isObjectRecord(doc.designMd) ? doc.designMd : null,
    nodes: finalNodes,
  };
}

export function parseCodeContextNodeIds(raw) {
  const text = raw?.trim() ?? '';
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.map((id) => String(id).trim()).filter(Boolean);
    } catch {
      // Fall back to comma splitting
    }
  }
  return text.split(',').map((id) => id.trim()).filter(Boolean);
}

export function buildMcpCodeContextArgs(args) {
  const mcpArgs = { format: args.format ?? 'all' };
  const nodeIds = args.nodeIds?.trim();
  if (nodeIds) mcpArgs.nodeIds = nodeIds;
  const pageId = args.pageId?.trim();
  if (pageId) mcpArgs.pageId = pageId;
  return mcpArgs;
}

export function resolveLiveCodeContextTargets({ layoutEntries, requestedNodeIds, selectedIds, toolName }) {
  const authoredRoots = (Array.isArray(layoutEntries) ? layoutEntries : [])
    .filter(isObjectRecord)
    .filter((entry) => !isDeviceFrameNode(entry));
  const requested = parseCodeContextNodeIds(requestedNodeIds);
  const targets = requested.length > 0 ? requested : selectedIds;
  const authoredTargets = targets.filter((id) => !isDeviceFrameId(id));
  if (targets.length > 0 && authoredTargets.length === 0) {
    throw new Error(`${toolName}: the target is device-frame decoration, not design content; select or request an authored node`);
  }
  const nodeIds = authoredTargets.length > 0
    ? authoredTargets
    : authoredRoots.map((entry) => entry.id).filter((id) => typeof id === 'string');
  return { authoredRoots, nodeIds, hasTargets: targets.length > 0 };
}

export function formatLiveCodeContextResult(sourcePath, selection, val, layout) {
  const accessibilityTree = Array.isArray(val.accessibilityTree)
    ? val.accessibilityTree.filter(isObjectRecord)
    : [];
  return {
    sourcePath,
    activePageId: typeof val.activePageId === 'string' ? val.activePageId : selection.activePageId,
    targetNodeIds: Array.isArray(val.targetNodeIds) ? val.targetNodeIds : selection.selectedIds,
    selectionActive: layout.hasTargets,
    code: isObjectRecord(val.code) ? val.code : {},
    accessibilityTree,
    layoutBounds: layout.bounds,
    ...(isObjectRecord(val.variables) ? { variables: val.variables } : {}),
    ...(isObjectRecord(val.designMd) ? { designMd: val.designMd } : {}),
    nodes: Array.isArray(val.nodes) ? val.nodes : [],
    restorationGuide:
      'Use `code.tailwindJsx`, `code.htmlCss`, `code.designJsx`, `accessibilityTree` (roles, ariaLabels, explain notes, events, textContent), `layoutBounds`, and `nodes` together as your 100%-fidelity specification. '
      + 'Preserve every exact hex color / CSS variable (`var(--...)`), pixel dimension, flex direction, gap, padding, border-radius, box-shadow, font-size, font-weight, SVG/icon element, accessibility attribute, and design note/interaction without approximation.',
  };
}

export function formatDiskFallbackCodeContextResult(sourcePath, rawText, args, toolName) {
  const parsedDoc = JSON.parse(rawText);
  const requestedIds = parseCodeContextNodeIds(args.nodeIds);
  if (requestedIds.length > 0 && requestedIds.every((id) => isDeviceFrameId(id))) {
    throw new Error(`${toolName}: the target is device-frame decoration, not design content; select or request an authored node`);
  }
  const fallback = buildFallbackFromRawDocument(parsedDoc, requestedIds, args.pageId);
  return {
    sourcePath,
    activePageId: typeof fallback.activePageId === 'string' ? fallback.activePageId : '0',
    targetNodeIds: fallback.targetNodeIds,
    selectionActive: Boolean(fallback.selectionActive),
    code: fallback.code,
    layoutBounds: [],
    variables: fallback.variables ?? {},
    ...(isObjectRecord(fallback.designMd) ? { designMd: fallback.designMd } : {}),
    nodes: fallback.nodes,
    restorationGuide:
      'Loaded canonical `.op` node tree from disk. Follow every exact layout, spacing, color, typography, and SVG/icon property in `nodes` and `variables` for 100%-fidelity React / Tailwind / HTML+CSS restoration.',
  };
}
