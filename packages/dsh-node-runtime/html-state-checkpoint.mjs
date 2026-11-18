/** Source-bound continuation updates; successful retries replace a state atomically. */
import { hash, validateHtmlStatePlan } from './html-state-input.mjs';
const clone = (value) => JSON.parse(JSON.stringify(value));
const frameKey = ({ framePath, label }) => JSON.stringify([framePath, label]);
// JSON object order is irrelevant; every allowed action field participates in identity.
const actionKeys = (steps = []) =>
  steps.map(({ type, selector, value, x, y, framePath, locator }) =>
    hash(
      framePath?.length || locator
        ? [type, selector, value, x, y, framePath || [], locator?.role, locator?.name]
        : [type, selector, value, x, y],
    ),
  );

export function applyHtmlStatePlan(state, states) {
  for (const update of validateHtmlStatePlan(states)) {
    let candidate = state.candidates.find((c) => c.id === update.id);
    if (!candidate) {
      candidate = {
        id: update.id,
        label: update.label || update.id,
        kind: 'planned',
        status: 'pending',
        safe: true,
        steps: [],
      };
      state.candidates.push(candidate);
    }
    if (update.excludeReason) {
      candidate.status = 'excluded';
      candidate.reason = update.excludeReason;
      continue;
    }
    const changed =
      (update.steps && hash(actionKeys(candidate.steps)) !== hash(actionKeys(update.steps))) ||
      (update.expected !== undefined && update.expected !== candidate.expected) ||
      (update.expectedFramePath !== undefined &&
        hash(update.expectedFramePath) !== hash(candidate.expectedFramePath || []));
    if (update.steps) {
      candidate.sourceKind ||= candidate.kind;
      candidate.kind = 'planned';
      candidate.steps = clone(update.steps);
      candidate.safe = true;
    }
    if (update.expectedFramePath !== undefined)
      candidate.expectedFramePath = clone(update.expectedFramePath);
    if (changed || candidate.status === 'failed') candidate.status = 'pending';
    if (update.expected) candidate.expected = update.expected;
    if (update.label) candidate.label = update.label;
  }
}

/** Commit only after conversion succeeds, preserving the prior board on capture failures. */
export function commitHtmlStateCapture(state, candidate, board, document, evidenceSize) {
  const previousIndex = state.boards.findIndex((item) => item.id === candidate.id);
  const previous = state.boards[previousIndex];
  const next = clone(document);
  for (const captured of state.boards) {
    if (captured.groupId) continue;
    const origin = state.candidates.find((item) => item.id === captured.id) || {
      id: captured.id,
      kind: captured.id === 'base' ? 'page' : 'planned',
      steps: [],
    };
    associateGroup(state, captured, origin);
  }
  associateGroup(state, board, candidate, previous);
  if (previous) {
    const priorRoot = next.children.find((node) => node.id === previous.rootId);
    const newRoot = next.children.find((node) => node.id === board.rootId);
    if (priorRoot && newRoot) {
      newRoot.x = priorRoot.x;
      newRoot.y = priorRoot.y;
    }
    next.children = next.children.filter((node) => node.id !== previous.rootId);
    state.boards.splice(previousIndex, 1, board);
    for (const item of state.candidates) {
      if (item.id !== candidate.id && item.boardId === previous.rootId) {
        item.status = 'pending';
        delete item.boardId;
        delete item.reason;
      }
    }
    const stillActive = new Set(state.boards.flatMap((item) => item.warnings || []));
    const resolved = new Set(
      (previous.warnings || []).filter((warning) => !stillActive.has(warning)),
    );
    state.warnings = state.warnings.filter((warning) => !resolved.has(warning));
  } else state.boards.push(board);
  board.evidenceBytes = evidenceSize;
  state.evidenceBytes =
    Math.max(0, (state.evidenceBytes || 0) - (previous?.evidenceBytes || 0)) + evidenceSize;
  candidate.status = 'captured';
  candidate.boardId = board.rootId;
  candidate.evidence = { ...candidate.evidence, ...board.evidence };
  if (candidate.expected)
    for (const item of state.candidates)
      if (
        item.kind === 'hidden' &&
        item.status === 'pending' &&
        item.expected === candidate.expected &&
        hash(item.expectedFramePath || []) === hash(candidate.expectedFramePath || [])
      ) {
        item.status = 'captured';
        item.boardId = board.rootId;
        item.evidence = { resolvedBy: candidate.id };
      }
  for (const captured of state.boards)
    if (previous && captured.sourceRelation?.parentBoardId === previous.rootId)
      captured.sourceRelation.parentBoardId = board.rootId;
  arrangeGroups(state, next);
  state.document = next;
}

function sourceRelation(candidate) {
  return {
    candidateId: candidate.id,
    kind: candidate.sourceKind || candidate.kind,
    expected: candidate.expected,
    expectedFramePath: candidate.expectedFramePath,
    steps: (candidate.steps || []).map(({ type, selector, locator, framePath }) => ({
      type,
      selector,
      locator,
      framePath,
    })),
    stepKeys: actionKeys(candidate.steps),
  };
}

function associateGroup(state, board, candidate, previous) {
  board.sourceRelation = sourceRelation(candidate);
  if (previous?.groupId) {
    board.groupId = previous.groupId;
    board.groupLabel = previous.groupLabel;
    board.sourceRelation.parentBoardId = previous.sourceRelation?.parentBoardId;
    return;
  }
  if (['page', 'tab'].includes(board.sourceRelation.kind)) {
    board.groupId = board.id;
    board.groupLabel = board.label;
    return;
  }
  const peers = state.boards.filter((item) => item.id !== board.id && item.groupId);
  const keys = board.sourceRelation.stepKeys;
  const ancestors = peers
    .filter((item) => {
      const route = item.sourceRelation?.stepKeys || [];
      return (
        route.length > 0 && route.length <= keys.length && route.every((key, i) => key === keys[i])
      );
    })
    .sort((a, b) => b.sourceRelation.stepKeys.length - a.sourceRelation.stepKeys.length);
  const expected = board.sourceRelation.expected;
  const framePath = hash(board.sourceRelation.expectedFramePath || []);
  const sharesExpected = (item) =>
    item?.expected === expected && hash(item.expectedFramePath || []) === framePath;
  const related =
    expected &&
    peers.filter(
      (item) =>
        sharesExpected(item.sourceRelation) ||
        state.candidates.some((c) => c.boardId === item.rootId && sharesExpected(c)),
    );
  const parent =
    ancestors[0] ||
    (related && new Set(related.map((b) => b.groupId)).size === 1 && related[0]) ||
    peers.find((item) => item.id === 'base') ||
    peers[0];
  board.groupId = parent?.groupId || 'base';
  board.groupLabel = parent?.groupLabel || 'Initial page';
  if (parent) board.sourceRelation.parentBoardId = parent.rootId;
}

/** Row heights and column widths come from converted roots; later batches can grow earlier rows. */
function arrangeGroups(state, document) {
  const groups = new Map();
  for (const board of state.boards) {
    if (!groups.has(board.groupId))
      groups.set(board.groupId, { id: board.groupId, label: board.groupLabel, boards: [] });
    groups.get(board.groupId).boards.push(board);
  }
  let y = 0;
  for (const group of groups.values()) {
    let x = 0,
      height = 0;
    for (const board of group.boards) {
      const root = document.children.find((node) => node.id === board.rootId);
      if (!root) continue;
      root.x = x;
      root.y = y;
      x += (Number(root.width) || board.sourceScreenshot?.clip?.width || 1) + 200;
      height = Math.max(height, Number(root.height) || board.sourceScreenshot?.clip?.height || 1);
    }
    y += height + 200;
  }
  document.editorMeta = {
    ...document.editorMeta,
    htmlImport: {
      version: 1,
      sourceFingerprint: state.sourceFingerprint,
      groups: [...groups.values()].map(({ id, label }) => ({ id, label })),
      boards: state.boards.map(({ id, rootId, groupId, groupLabel, sourceRelation }) => ({
        id,
        rootId,
        groupId,
        groupLabel,
        sourceRelation,
      })),
    },
  };
}

/** Keep the canonical snapshot palette without rebinding names used by earlier states. */
export function mergeHtmlImportVariables(document, variables = {}) {
  const merged = { ...document.variables };
  for (const [name, definition] of Object.entries(variables || {})) {
    let target = name,
      suffix = 2;
    while (Object.hasOwn(merged, target) && hash(merged[target]) !== hash(definition))
      target = name + '-' + suffix++;
    merged[target] = definition;
  }
  if (Object.keys(merged).length) document.variables = merged;
}

/** Merge replay scopes and observations without using transient content as candidate identity. */
export function recordHtmlDiscovery(state, discovered, prefix = []) {
  const ids = new Set(state.candidates.map(({ id }) => id));
  for (const item of discovered.candidates) {
    const { framePath, selector, locator, expected, route } = item;
    const id = hash([
      route,
      framePath,
      selector,
      locator,
      expected,
      !selector && !locator ? item.label : undefined,
    ]).slice(0, 24);
    if (ids.has(id)) continue;
    ids.add(id);
    state.candidates.push({
      id,
      label: item.label,
      kind: item.kind,
      steps:
        selector || locator ? [...prefix, { type: 'click', selector, locator, framePath }] : [],
      expected,
      expectedFramePath: expected && framePath.length ? framePath : undefined,
      status: 'pending',
      safe: item.safe,
      reason: item.reason,
      evidence: { framePath, selector, locator, options: item.options },
    });
  }
  for (const hidden of discovered.hidden) {
    const scope = JSON.stringify(hidden.framePath);
    if (
      hidden.selector &&
      state.candidates.some(
        (candidate) =>
          candidate.expected === hidden.selector &&
          JSON.stringify(candidate.expectedFramePath || []) === scope,
      )
    )
      continue;
    const id = hash([
      'hidden',
      hidden.framePath,
      hidden.selector || [hidden.label, hidden.role, hidden.index],
    ]).slice(0, 24);
    if (ids.has(id)) continue;
    ids.add(id);
    state.candidates.push({
      id,
      label: hidden.label,
      kind: 'hidden',
      steps: [],
      expected: hidden.selector,
      expectedFramePath: hidden.framePath,
      status: 'pending',
      safe: false,
      reason: 'Hidden interface has no verified activation route',
    });
  }
  const frames = new Map((state.frames || []).map((frame) => [frameKey(frame), frame]));
  for (const frame of discovered.frames) {
    const key = frameKey(frame);
    if (!frames.has(key) || frame.status === 'available') frames.set(key, frame);
  }
  state.frames = [...frames.values()];
  state.resources = discovered.resources;
  state.hidden = discovered.hidden;
  state.scrollContainers = discovered.scrollContainers;
}
