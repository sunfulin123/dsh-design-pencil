/** Draft script helpers, unresolved image checks, and root canvas contract diagnostics. */

import { createHash, randomBytes } from 'node:crypto';
import { draftRootNodeId, draftRootNodes } from './device-frame.mjs';

export { draftRootNodeId, draftRootNodes };

export const CONTENT_STATES = ['loading', 'empty', 'error', 'partial', 'success', 'permission'];
export const REVIEW_DIMENSIONS = [
  'task_integrity',
  'structure_overflow',
  'hierarchy_density',
  'style_consistency',
  'content_states',
];

export function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function findMatchingClosingBrace(script, braceStart) {
  let depth = 0;
  let inString;
  for (let index = braceStart; index < script.length; index += 1) {
    const ch = script[index];
    if (inString !== undefined) {
      if (ch === '\\') index += 1;
      else if (ch === inString) inString = undefined;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') inString = ch;
    else if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

export function healRootWrapperScript(script, rootNodeId) {
  const assignment = /(const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*I\s*\(\s*null\s*,\s*\{/u.exec(script);
  if (assignment === null) return undefined;
  const firstCreation = script.search(/\bI\s*\(/u);
  if (firstCreation === -1 || firstCreation < assignment.index) return undefined;
  const callStart = script.indexOf('I', assignment.index + assignment[1].length);
  const braceEnd = findMatchingClosingBrace(script, script.indexOf('{', callStart));
  if (braceEnd === -1) return undefined;
  const close = script.indexOf(')', braceEnd);
  if (close === -1) return undefined;
  return script.slice(0, callStart) + JSON.stringify(rootNodeId) + script.slice(close + 1);
}

export function creationCallCount(script) {
  return [...script.matchAll(/\b[IK]\s*\(/gu)].length;
}

export function hasMemberMutation(script) {
  return /(?:^|[;{}\n])\s*[A-Za-z_$][\w$]*\s*(?:\.[A-Za-z_$][\w$]*|\[[^\]\n]+\])\s*(?:=(?!=)|\+=|-=|\*=|\/=|%=|\+\+|--)/mu.test(script);
}

export function defaultDraftPath() {
  return `.synapse/op-design/outputs/synapse-design-${Date.now().toString(36)}-${randomBytes(2).toString('hex')}.op`;
}

export function documentSha256(documentJson) {
  return createHash('sha256').update(documentJson).digest('hex');
}

function usableImageSource(source) {
  return typeof source === 'string' && source.trim() !== '' && !/^placeholder:\/\//iu.test(source.trim());
}

function isUnresolvedImageNode(value) {
  if (value.type !== 'image' && value.type !== 'frame') return false;
  const intent = [value.imageSearchQuery, value.imagePrompt].some(
    (item) => typeof item === 'string' && item.trim() !== '',
  );
  if (!intent || usableImageSource(value.src)) return false;
  const fills = Array.isArray(value.fill) ? value.fill : [value.fill];
  return !fills.some((fill) => isRecord(fill) && fill.type === 'image' && usableImageSource(fill.url));
}

export function unresolvedImageNodes(documentJson) {
  let document;
  try {
    document = JSON.parse(documentJson);
  } catch {
    return { nodes: [], count: 0 };
  }
  const pending = [document];
  const nodes = [];
  let count = 0;
  while (pending.length > 0) {
    const value = pending.pop();
    if (Array.isArray(value)) {
      for (const item of value) pending.push(item);
      continue;
    }
    if (!isRecord(value)) continue;
    if (isUnresolvedImageNode(value)) {
      count += 1;
      if (nodes.length < 30) nodes.push(typeof value.id === 'string' ? value.id : '(unnamed image)');
    }
    for (const child of Object.values(value)) pending.push(child);
  }
  return { nodes, count };
}

export function hasUnresolvedImageSearchQuery(documentJson) {
  return unresolvedImageNodes(documentJson).count > 0;
}

function checkRootFrameDimensions(root, canvas, requireFinalHeight) {
  if (root.width !== canvas.width) {
    return [`Canvas contract requires root width ${canvas.width}px; current root width is ${String(root.width)}.`];
  }
  if (canvas.fixedViewport && root.height !== canvas.seedHeight) {
    return [`Canvas contract requires the explicit root height ${canvas.seedHeight}px; current root height is ${String(root.height)}.`];
  }
  if (requireFinalHeight && !canvas.fixedViewport && root.height !== canvas.finalHeight) {
    return [`Canvas contract requires the completed root height ${String(canvas.finalHeight)}; current root height is ${String(root.height)}.`];
  }
  return [];
}

export function canvasContractDiagnostics(documentJson, canvas, options = {}) {
  let document;
  try {
    document = JSON.parse(documentJson);
  } catch {
    return ['The native draft document is not valid JSON.'];
  }
  if (!isRecord(document)) return ['The native draft document root is invalid.'];
  const roots = draftRootNodes(document);
  if (options.rootId === undefined && roots.length !== canvas.rootCount) {
    return [`Canvas contract requires exactly one root frame; current root count is ${roots.length}.`];
  }
  const root = options.rootId === undefined
    ? roots[0]
    : roots.find((node) => isRecord(node) && node.id === options.rootId);
  if (!isRecord(root) || root.type !== canvas.rootType) {
    return ['Canvas contract requires the single root node to be a frame.'];
  }
  return checkRootFrameDimensions(root, canvas, options.requireFinalHeight === true);
}
