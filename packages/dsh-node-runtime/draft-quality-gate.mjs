/** Draft batch receipts, isolated argument guards, and blocking lint/quality aggregation. */

import { draftRootNodes, isRecord } from './draft-canvas-contract.mjs';

const ISSUE_FIELD = /(?:issues$|^advisories$|^diagnostics$|^errors$|^emptyShells$|^intentQuestions$|^imageSlots$)/i;
const OBSERVATIONAL_QUALITY_FIELD = /^(?:emptyShells|imageSlots|intentQuestions)$/i;
const NON_BLOCKING_LINT_WARNINGS = new Set([
  'empty-filled-panel',
  'invisible-container',
  'mixed-sibling-corner-radius',
  'mixed-sibling-padding',
  'sibling-inconsistency',
  'text-effect',
  'text-explicit-height',
  'slop/purple-glow-gradient',
  'slop/three-card-feature-row',
  'slop/rounded-card-wall',
]);
const LINT_QUALITY_FIELDS = ['geometryIssues', 'layoutIssues', 'contrastIssues', 'iconIssues', 'structureIssues'];
const MAX_LINT_VALIDATION_PAGES = 100;
const MAX_TOUCH_TARGET_PAGES = 50;

function formatNodeDimension(value, prefix) {
  return typeof value === 'number' || typeof value === 'string' ? ` ${prefix}=${value}` : '';
}

function formatOutlineLine(node, type, name, depth) {
  const layout = typeof node.layout === 'string' ? ` layout=${node.layout}` : '';
  const w = formatNodeDimension(node.width, 'w');
  const h = formatNodeDimension(node.height, 'h');
  const label = name ? ` ${JSON.stringify(name)}` : '';
  return `${'  '.repeat(depth)}${String(node.id)} [${type}]${label}${layout}${w}${h}`;
}

function collectDocumentNodeIndex(documentJson) {
  const nameById = new Map();
  const treeOutline = [];
  if (typeof documentJson !== 'string') return { nameById, treeOutline };
  try {
    const doc = JSON.parse(documentJson);
    if (!isRecord(doc)) return { nameById, treeOutline };
    const walk = (nodes, parentId, depth = 0) => {
      for (const node of nodes) {
        if (!isRecord(node) || typeof node.id !== 'string') continue;
        const name = typeof node.name === 'string' && node.name.trim() ? node.name.trim() : undefined;
        const type = typeof node.type === 'string' ? node.type : undefined;
        nameById.set(node.id, { name, type, parentId });
        if (depth <= 3 && (type === 'frame' || type === 'group')) {
          treeOutline.push(formatOutlineLine(node, type, name, depth));
        }
        if (Array.isArray(node.children)) walk(node.children, node.id, depth + 1);
      }
    };
    walk(draftRootNodes(doc));
  } catch {
    // Ignore parse failures on synthetic test stubs
  }
  return { nameById, treeOutline };
}

export function publicBatchReceipt(value, documentJson) {
  if (!isRecord(value)) return {};
  const receipt = {};
  const { nameById, treeOutline } = collectDocumentNodeIndex(documentJson);
  if (Array.isArray(value.results)) {
    receipt.results = value.results.flatMap((entry) => {
      if (!isRecord(entry) || typeof entry.binding !== 'string' || typeof entry.nodeId !== 'string') return [];
      const info = nameById.get(entry.nodeId);
      return [{
        binding: entry.binding,
        nodeId: entry.nodeId,
        ...(info?.name === undefined ? {} : { name: info.name }),
        ...(info?.type === undefined ? {} : { type: info.type }),
        ...(info?.parentId === undefined ? {} : { parentId: info.parentId }),
      }];
    });
  }
  if (typeof value.nodeCount === 'number' && Number.isFinite(value.nodeCount)) {
    receipt.nodeCount = value.nodeCount;
  }
  if (typeof value.postProcessed === 'boolean') receipt.postProcessed = value.postProcessed;
  if (typeof value.applied === 'boolean') receipt.applied = value.applied;
  if (treeOutline.length > 0) receipt.containerOutline = treeOutline.slice(0, 48);
  return receipt;
}

export function contextFingerprint(tool, args) {
  const canonical = (value) => {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
    const keys = Object.keys(value).toSorted();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  };
  return `${tool}:${canonical(args)}`;
}

export function assertNoExternalArguments(
  value,
  location = 'arguments',
  depth = 0,
  allowDesignPaths = false,
  toolName = 'synapse_design_pipeline_context',
) {
  if (depth > 20) throw new Error(`${toolName}: arguments are too deeply nested`);
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoExternalArguments(item, `${location}[${index}]`, depth + 1, allowDesignPaths, toolName),
    );
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    const designPath = allowDesignPaths && ['path', 'screenPath', 'svgPath', 'pathData'].includes(key);
    if (
      (/(?:^|_)(?:file|source|output|preset|svg|html|snapshot)?path$/i.test(key) && !designPath)
      || /(?:url|uri|directory|outputdir|export|import|spawn)/i.test(key)
    ) {
      throw new Error(`${toolName}: ${location}.${key} is not allowed in an isolated design draft`);
    }
    assertNoExternalArguments(child, `${location}.${key}`, depth + 1, allowDesignPaths, toolName);
  }
}

function pushIssueEntries(entries, issues) {
  for (const entry of entries) {
    if (typeof entry === 'string' && entry.trim().length > 0) issues.push(entry.slice(0, 300));
    else if (isRecord(entry)) issues.push(JSON.stringify(entry).slice(0, 300));
  }
}

function visitIssueRecord(candidate, ctx) {
  for (const [childKey, child] of Object.entries(candidate)) {
    if (!ISSUE_FIELD.test(childKey)) {
      ctx.visit(child, childKey, ctx.depth + 1);
      continue;
    }
    if (!ctx.includeObservational && OBSERVATIONAL_QUALITY_FIELD.test(childKey)) continue;
    if (!ctx.includeObservational && childKey === 'navIssues' && Array.isArray(child)) {
      ctx.visit(child.filter((entry) => !isRecord(entry) || entry.priority !== 'review'), childKey, ctx.depth + 1);
      continue;
    }
    if (Array.isArray(child)) ctx.visit(child, childKey, ctx.depth + 1);
    else if (typeof child === 'string' && child.trim().length > 0) ctx.issues.push(child.slice(0, 300));
  }
}

export function issueValues(value, options = {}) {
  const includeObservational = options.includeObservational ?? true;
  const issues = [];
  const seen = new Set();
  const visit = (candidate, key = '', depth = 0) => {
    if (depth > 8 || typeof candidate !== 'object' || candidate === null || seen.has(candidate)) return;
    seen.add(candidate);
    if (Array.isArray(candidate)) {
      if (ISSUE_FIELD.test(key)) pushIssueEntries(candidate, issues);
      else for (const entry of candidate) visit(entry, key, depth + 1);
      return;
    }
    visitIssueRecord(candidate, { includeObservational, issues, visit, depth });
  };
  visit(value);
  return issues.slice(0, 30);
}

function isBlockingLintIssue(issue) {
  if (!isRecord(issue)) return true;
  const severity = typeof issue.severity === 'string' ? issue.severity.toLocaleLowerCase('en-US') : '';
  if (severity === 'info') return false;
  const categoryValue = typeof issue.category === 'string' ? issue.category : issue.code;
  const category = typeof categoryValue === 'string' ? categoryValue.toLocaleLowerCase('en-US') : '';
  return !(severity === 'warning' && NON_BLOCKING_LINT_WARNINGS.has(category));
}

export function blockingLintValue(value) {
  if (!isRecord(value) || !Array.isArray(value.issues)) return value;
  return { ...value, issues: value.issues.filter(isBlockingLintIssue) };
}

function diagnosticKey(value) {
  if (typeof value === 'string') return value;
  if (!isRecord(value) || typeof value.nodeId !== 'string' || typeof value.reason !== 'string') return undefined;
  return `${value.nodeId}: ${value.reason}`;
}

export function hasUnclassifiedQualityEvidence(value, lintIssues) {
  if (!isRecord(value)) return false;
  const known = new Set(lintIssues.map(diagnosticKey).filter((key) => key !== undefined));
  return LINT_QUALITY_FIELDS.some((field) => {
    const entries = value[field];
    return Array.isArray(entries) && entries.some((entry) => {
      const key = diagnosticKey(entry);
      return key !== undefined && !known.has(key);
    });
  });
}

export function blockingQualityValue(value, lintIssues) {
  if (!isRecord(value)) return value;
  const observed = new Map();
  for (const issue of lintIssues) {
    const key = diagnosticKey(issue);
    if (key === undefined) continue;
    observed.set(key, (observed.get(key) ?? false) || isBlockingLintIssue(issue));
  }
  const filtered = { ...value };
  for (const field of LINT_QUALITY_FIELDS) {
    const entries = filtered[field];
    if (!Array.isArray(entries)) continue;
    filtered[field] = entries.filter((entry) => {
      const key = diagnosticKey(entry);
      return key === undefined || observed.get(key) !== false;
    });
  }
  return filtered;
}

export async function readPaginatedDraftLint(callDraftTool, { version, quality }) {
  const issues = [];
  const seen = new Set();
  let cursor;
  let expectedCount;
  let hasBlockingIssue = false;
  for (let page = 0; page < MAX_LINT_VALIDATION_PAGES; page += 1) {
    // Sequential cursor pagination is required by the stateful lint stream.
    // eslint-disable-next-line no-await-in-loop
    const result = await callDraftTool('lint_document', {
      limit: 500,
      ...(cursor === undefined ? {} : { cursor }),
    });
    if (result.version !== version) throw new Error('The draft changed during lint validation; retry on the latest version');
    if (!isRecord(result.value) || !Array.isArray(result.value.issues)) {
      throw new Error('The draft lint validation returned an invalid issue list');
    }
    const count = result.value.count;
    if (
      typeof count !== 'number'
      || !Number.isSafeInteger(count)
      || count < 0
      || (expectedCount !== undefined && count !== expectedCount)
    ) {
      throw new Error('The draft lint validation returned an invalid or changing issue count');
    }
    expectedCount = count;
    const pageIssues = result.value.issues;
    issues.push(...pageIssues);
    const rawNext = result.value.nextCursor;
    let next;
    if (rawNext !== undefined && rawNext !== null) {
      if (typeof rawNext !== 'string' || rawNext.length === 0 || seen.has(rawNext)) {
        throw new Error('The draft lint validation returned an invalid or repeated cursor');
      }
      if (pageIssues.length === 0) throw new Error('The draft lint validation returned an empty continuation page');
      next = rawNext;
    }
    if (issues.length > count) throw new Error('The draft lint validation returned too many issues');
    if (next === undefined) {
      if (issues.length !== count) throw new Error('The draft returned incomplete lint without a continuation cursor');
      return { issues, truncated: false };
    }
    hasBlockingIssue ||= issueValues(blockingLintValue({ issues: pageIssues }), { includeObservational: false }).length > 0;
    if (hasBlockingIssue && !hasUnclassifiedQualityEvidence(quality, issues)) {
      return { issues, truncated: true };
    }
    seen.add(next);
    cursor = next;
  }
  throw new Error('The draft lint validation exceeded its page limit; narrow the diagnostics before publishing');
}

function parseTouchTargetsNextOffset(value) {
  if (!isRecord(value)) return undefined;
  const raw = value.touchTargetsNextOffset;
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== 'number' || !Number.isSafeInteger(raw) || raw <= 0) {
    throw new Error('The draft quality validation returned an invalid touchTargetsNextOffset');
  }
  return raw;
}

function countReuseCandidates(value) {
  if (!isRecord(value)) return 0;
  const counts = isRecord(value.counts) ? value.counts : undefined;
  if (
    counts !== undefined
    && typeof counts.componentReuseCandidates === 'number'
    && Number.isSafeInteger(counts.componentReuseCandidates)
    && counts.componentReuseCandidates >= 0
  ) {
    return counts.componentReuseCandidates;
  }
  return Array.isArray(value.componentReuseCandidates) ? value.componentReuseCandidates.length : 0;
}

export async function readPaginatedDraftQuality(callDraftTool, version) {
  const first = await callDraftTool('get_design_quality', {});
  if (first.version !== version) return { value: first.value, version: first.version, reuseCandidateCount: 0 };
  const reuseCandidateCount = countReuseCandidates(first.value);
  let nextOffset = parseTouchTargetsNextOffset(first.value);
  if (nextOffset === undefined || !isRecord(first.value)) {
    return { value: first.value, version: first.version, reuseCandidateCount };
  }
  const mergedNavIssues = Array.isArray(first.value.navIssues) ? [...first.value.navIssues] : [];
  let prevOffset = 0;
  for (let page = 1; page < MAX_TOUCH_TARGET_PAGES; page += 1) {
    if (nextOffset <= prevOffset) {
      throw new Error('The draft quality validation returned a non-advancing touchTargetsNextOffset');
    }
    prevOffset = nextOffset;
    // Sequential offset pagination is required across touch-target pages.
    // eslint-disable-next-line no-await-in-loop
    const nextPage = await callDraftTool('get_design_quality', { limit: 200, touchTargetOffset: nextOffset });
    if (nextPage.version !== version) {
      throw new Error('The draft changed during touch-target validation; retry on the latest version');
    }
    if (!isRecord(nextPage.value) || !Array.isArray(nextPage.value.navIssues)) {
      throw new Error('The draft quality continuation returned an invalid navIssues list');
    }
    mergedNavIssues.push(...nextPage.value.navIssues);
    nextOffset = parseTouchTargetsNextOffset(nextPage.value);
    if (nextOffset === undefined) {
      return {
        value: { ...first.value, navIssues: mergedNavIssues, touchTargetsNextOffset: null },
        version,
        reuseCandidateCount,
      };
    }
  }
  throw new Error('The draft touch-target validation exceeded its page limit');
}
