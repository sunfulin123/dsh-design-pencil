/** Evidence-bearing review checks, action truth, and POC deviation rules for the finish gate. */

import { REVIEW_DIMENSIONS, isRecord } from './draft-canvas-contract.mjs';

export const CHECK_STATUSES = ['pass', 'fail', 'unverified', 'not-applicable'];
export const CHECK_METHODS = ['screenshot', 'layout', 'lint', 'quality', 'node-read', 'prototype'];
export const ACTION_KINDS = ['verifiable', 'visual-only', 'not-implemented'];
export const DEVIATION_LEVELS = ['none', 'upgrade', 'minor', 'substantive'];
/** A review cannot wave these through as irrelevant: every design has scope and structure. */
const ALWAYS_APPLICABLE = new Set(['task_integrity', 'structure_overflow']);
const EXECUTED_METHODS = new Set(['layout', 'lint', 'quality', 'node-read']);
const INSTANCE_CHILD_SEPARATOR = '__';
const MAX_PROTOTYPE_RUNS = 64;

const CONTEXT_TOOL_METHOD = new Map([
  ['snapshot_layout', 'layout'],
  ['get_canvas_bounds', 'layout'],
  ['lint_document', 'lint'],
  ['get_design_quality', 'quality'],
  ['batch_get', 'node-read'],
  ['read_nodes', 'node-read'],
  ['get_node', 'node-read'],
  ['get_node_children', 'node-read'],
  ['get_editor_state', 'node-read'],
  ['get_document_info', 'node-read'],
  ['get_variables', 'node-read'],
  ['get_component', 'node-read'],
  ['simulate_prototype', 'prototype'],
]);

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function stringList(value) {
  return Array.isArray(value) ? value.map(text).filter((item) => item !== '') : [];
}

export function deviationQuestionSlug(screenName) {
  return text(screenName).toLocaleLowerCase('en-US').replace(/\s+/gu, '-');
}

/** Authored id for a node id that may address a child inside a linked instance. */
function authoredNodeId(nodeId, nodesById) {
  if (nodesById.has(nodeId)) return nodeId;
  const separator = nodeId.indexOf(INSTANCE_CHILD_SEPARATOR);
  if (separator <= 0) return undefined;
  const instanceId = nodeId.slice(0, separator);
  return nodesById.get(instanceId)?.type === 'ref' ? instanceId : undefined;
}

function isInsideAny(nodeId, containerIds, nodesById) {
  let current = authoredNodeId(nodeId, nodesById);
  const seen = new Set();
  while (current !== undefined && !seen.has(current)) {
    if (containerIds.has(current)) return true;
    seen.add(current);
    current = nodesById.get(current)?.parentId;
  }
  return false;
}

function checkEvidenceNodes(dimension, nodeIds, ctx) {
  if (nodeIds.length === 0) {
    return [`review.checks "${dimension}" must list the nodeIds that were inspected.`];
  }
  const issues = [];
  for (const nodeId of nodeIds) {
    if (authoredNodeId(nodeId, ctx.nodesById) === undefined) {
      issues.push(`review.checks "${dimension}" cites nodeId "${nodeId}", which does not exist in the draft.`);
    } else if (ctx.screenNodeIds.size > 0 && !isInsideAny(nodeId, ctx.screenNodeIds, ctx.nodesById)) {
      issues.push(`review.checks "${dimension}" cites nodeId "${nodeId}", which is outside every reviewed screen.`);
    }
  }
  return issues;
}

function checkOneDimension(dimension, entry, ctx) {
  if (entry === undefined) return { issues: [`review.checks is missing "${dimension}".`] };
  const status = text(entry.status);
  if (!CHECK_STATUSES.includes(status)) {
    return { issues: [`review.checks "${dimension}" status must be one of ${CHECK_STATUSES.join(', ')}.`] };
  }
  if (status === 'unverified') {
    return text(entry.uncovered) === ''
      ? { issues: [`review.checks "${dimension}" is unverified and must state in "uncovered" what was not checked and why.`] }
      : { issues: [], unverified: { dimension, uncovered: text(entry.uncovered) } };
  }
  if (status === 'not-applicable') {
    if (ALWAYS_APPLICABLE.has(dimension)) {
      return { issues: [`review.checks "${dimension}" applies to every design; report pass, fail or unverified.`] };
    }
    return text(entry.reason) === ''
      ? { issues: [`review.checks "${dimension}" marked not-applicable requires a reason.`] }
      : { issues: [] };
  }
  const issues = [];
  const nodeIds = stringList(entry.nodeIds);
  if (text(entry.finding) === '') {
    issues.push(`review.checks "${dimension}" requires a finding describing what was observed.`);
  }
  issues.push(...checkEvidenceNodes(dimension, nodeIds, ctx));
  if (status === 'fail') {
    return issues.length > 0 ? { issues } : { issues, failed: { dimension, finding: text(entry.finding), nodeIds } };
  }
  const method = text(entry.method);
  if (!CHECK_METHODS.includes(method)) {
    issues.push(`review.checks "${dimension}" pass requires method (one of ${CHECK_METHODS.join(', ')}).`);
  } else if (method === 'screenshot' && !ctx.screenshotInspectable) {
    issues.push(
      `review.checks "${dimension}" cannot pass by screenshot: no exact rendered screenshot was delivered for inspection. Use another executed method or report unverified.`,
    );
  } else if (method === 'prototype' && ctx.prototypeRuns.length === 0) {
    issues.push(
      `review.checks "${dimension}" cannot pass by prototype: no simulate_prototype run is recorded for this draft version.`,
    );
  } else if (EXECUTED_METHODS.has(method) && ctx.executedMethods instanceof Set && !ctx.executedMethods.has(method)) {
    issues.push(
      `review.checks "${dimension}" cannot pass by ${method}: no ${method} inspection was executed on this draft version. Run the inspection on the current version or report unverified.`,
    );
  }
  if (ALWAYS_APPLICABLE.has(dimension) && issues.length === 0) {
    const groups = ctx.screenNodesByName instanceof Map && ctx.screenNodesByName.size > 0
      ? [...ctx.screenNodesByName.entries()]
      : [...ctx.screenNodeIds].map((id) => [id, new Set([id])]);
    if (groups.length > 1) {
      for (const [screenLabel, containerSet] of groups) {
        const covered = nodeIds.some((nodeId) => isInsideAny(nodeId, containerSet, ctx.nodesById));
        if (!covered) {
          issues.push(
            `review.checks "${dimension}" is marked pass, so nodeIds must cover every built screen (missing a node inside "${screenLabel}").`,
          );
        }
      }
    }
  }
  return { issues };
}

/**
 * Validate one evidence-bearing check per rubric dimension.
 * A check proves only what it covered, so `pass` must cite inspected nodes and an
 * executed method, and anything not examined is reported as `unverified`.
 */
export function checkReviewChecks(rawChecks, ctx) {
  const byDimension = new Map();
  for (const item of Array.isArray(rawChecks) ? rawChecks : []) {
    if (isRecord(item) && text(item.dimension) !== '') byDimension.set(text(item.dimension), item);
  }
  const issues = [];
  const failed = [];
  const unverified = [];
  for (const dimension of REVIEW_DIMENSIONS) {
    const checked = checkOneDimension(dimension, byDimension.get(dimension), ctx);
    issues.push(...checked.issues);
    if (checked.failed !== undefined) failed.push(checked.failed);
    if (checked.unverified !== undefined) unverified.push(checked.unverified);
  }
  const allCheckedNodeIds = new Set();
  for (const dimension of ['style_consistency', 'structure_overflow']) {
    const entry = byDimension.get(dimension);
    if (entry !== undefined && text(entry.status) !== 'unverified') {
      for (const id of stringList(entry.nodeIds)) {
        const authored = authoredNodeId(id, ctx.nodesById);
        if (authored !== undefined) allCheckedNodeIds.add(authored);
      }
    }
  }
  const styleUnverified = text(byDimension.get('style_consistency')?.status) === 'unverified'
    && text(byDimension.get('structure_overflow')?.status) === 'unverified';
  if (!styleUnverified && Array.isArray(ctx.affectedInstancesByMaster)) {
    for (const { masterId, instanceIds } of ctx.affectedInstancesByMaster) {
      const missing = instanceIds.filter((id) => !allCheckedNodeIds.has(id));
      if (missing.length > 0) {
        issues.push(
          `Reusable component "${masterId}" was modified after instances existed; inspect and cite affected instance(s) (${missing.join(', ')}) in review.checks ("style_consistency" or "structure_overflow").`,
        );
      }
    }
  }
  return { issues, failed, unverified };
}

function prototypeRunReaches(run, nodeId, reaches) {
  if (!run.clicked.includes(nodeId)) return false;
  // `visitedScreens` always begins with `startScreenId`; staying on the starting
  // screen with a 1-entry history proves no navigation occurred.
  const navigated = (run.currentScreenId === reaches || run.visitedScreens.includes(reaches))
    && (reaches !== run.startScreenId || run.visitedScreens.length > 1);
  if (navigated) return true;
  if (Array.isArray(run.overlays) && run.overlays.includes(reaches)) return true;
  if (Array.isArray(run.variantTargets) && run.variantTargets.includes(reaches)) return true;
  return false;
}

function checkOneAction(entry, index, ctx) {
  if (!isRecord(entry)) return { issue: `review.actions[${index}] must be an object.` };
  const label = text(entry.label);
  const screen = text(entry.screen);
  const kind = text(entry.kind);
  if (label === '' || screen === '') {
    return { issue: `review.actions[${index}] requires the screen it belongs to and its visible label.` };
  }
  if (!ACTION_KINDS.includes(kind)) {
    return { issue: `review.actions "${label}" kind must be one of ${ACTION_KINDS.join(', ')}.` };
  }
  const screenKey = screen.toLocaleLowerCase('en-US');
  const screenContainers = ctx.screenNodesByName instanceof Map && ctx.screenNodesByName.size > 0
    ? ctx.screenNodesByName.get(screenKey)
    : ctx.screenNodeByName instanceof Map && ctx.screenNodeByName.size > 0
      ? (ctx.screenNodeByName.has(screenKey) ? new Set([ctx.screenNodeByName.get(screenKey)]) : undefined)
      : null;
  if (screenContainers === undefined) {
    return { issue: `review.actions "${label}" names screen "${screen}", which is not one of the built reviewed screens.` };
  }
  if (kind !== 'verifiable') return { summary: { screen, label, kind } };
  const nodeId = text(entry.nodeId);
  const reaches = text(entry.reaches);
  if (authoredNodeId(nodeId, ctx.nodesById) === undefined || !ctx.nodesById.has(reaches)) {
    return {
      issue: `review.actions "${label}" is marked verifiable and must name an existing control nodeId and the target nodeId it reaches.`,
    };
  }
  if (screenContainers instanceof Set && screenContainers.size > 0 && !isInsideAny(nodeId, screenContainers, ctx.nodesById)) {
    return {
      issue: `review.actions "${label}" cites control nodeId "${nodeId}", which is not inside screen "${screen}" (${[...screenContainers].map((id) => `"${id}"`).join(', ')}).`,
    };
  }
  if (!ctx.prototypeRuns.some((run) => prototypeRunReaches(run, nodeId, reaches))) {
    return {
      issue: `review.actions "${label}" is marked verifiable, but no simulate_prototype run on this draft version clicked "${nodeId}" and transitioned to, opened as overlay, or switched variant "${reaches}". Simulate it, or classify the action as visual-only or not-implemented.`,
    };
  }
  return { summary: { screen, label, kind, nodeId, reaches } };
}

/**
 * Classify each primary action by what was actually delivered.
 * Only an observed transition makes an action `verifiable`; a notice saying a
 * feature is unavailable is evidence of `not-implemented`, never of success.
 */
export function checkActions(rawActions, ctx) {
  if (!Array.isArray(rawActions)) {
    return {
      issues: [
        `review.actions is required: list each primary action as ${ACTION_KINDS.join(', ')} (an empty list states that the design has no actions).`,
      ],
      summary: [],
    };
  }
  const issues = [];
  const summary = [];
  rawActions.forEach((entry, index) => {
    const checked = checkOneAction(entry, index, ctx);
    if (checked.issue !== undefined) issues.push(checked.issue);
    if (checked.summary !== undefined) summary.push(checked.summary);
  });
  return { issues, summary };
}

export function parseDesignUpgrades(rawUpgrades, defaultScreen) {
  if (!Array.isArray(rawUpgrades)) return { upgrades: [], issues: [] };
  const upgrades = [];
  const issues = [];
  rawUpgrades.forEach((item, index) => {
    if (!isRecord(item) || text(item.what) === '' || text(item.why) === '') {
      issues.push(`designUpgrades[${index}] requires non-empty "what" and "why" fields.`);
      return;
    }
    const screen = text(item.screen) || (typeof defaultScreen === 'string' ? text(defaultScreen) : '');
    upgrades.push({ ...(screen === '' ? {} : { screen }), what: text(item.what), why: text(item.why) });
  });
  return { upgrades, issues };
}

/**
 * A confirmed prototype fixes scope, while visual/craft upgrades within that
 * confirmed scope are encouraged and recorded as `upgrade` (no user approval
 * needed). Dropping a shell, changing how a state is expressed, or reducing
 * copy/actions is a `substantive` scope deviation requiring user confirmation.
 */
export function checkPocDeviation(pocScreen, entry, ctx, omitted) {
  const level = omitted ? 'substantive' : text(entry.deviation);
  if (!DEVIATION_LEVELS.includes(level)) {
    return [`POC screen "${pocScreen.name}" requires deviation (one of ${DEVIATION_LEVELS.join(', ')}) against its recorded capture.`];
  }
  const issues = [];
  const parsedUpgrades = parseDesignUpgrades(entry.designUpgrades, pocScreen.name);
  issues.push(...parsedUpgrades.issues);
  if (Array.isArray(ctx.collectedUpgrades) && parsedUpgrades.upgrades.length > 0) {
    ctx.collectedUpgrades.push(...parsedUpgrades.upgrades);
  }
  if (level === 'upgrade') {
    if (parsedUpgrades.upgrades.length === 0 && text(entry.differences) === '') {
      issues.push(
        `POC screen "${pocScreen.name}" reports deviation="upgrade" and must record what was upgraded and why in designUpgrades ([{ what, why }]) or differences.`,
      );
    }
    return issues;
  }
  if (level !== 'none' && !omitted && text(entry.differences) === '') {
    issues.push(`POC screen "${pocScreen.name}" reports a ${level} deviation and must describe it in differences.`);
  }
  if (level !== 'substantive') return issues;
  const questionId = isRecord(entry.confirmation) ? text(entry.confirmation.questionId) : '';
  const expectedPrefix = ctx.draftId ? `synapse-design-deviation:${ctx.draftId}:` : 'synapse-design-deviation:';
  const expectedId = `${expectedPrefix}${deviationQuestionSlug(pocScreen.name)}`;
  const validQuestionId = questionId.startsWith(expectedPrefix)
    && deviationQuestionSlug(questionId.slice(expectedPrefix.length)) === deviationQuestionSlug(pocScreen.name);
  if (!validQuestionId || !ctx.approvedQuestionIds.has(questionId) || ctx.usedConfirmationIds.has(questionId)) {
    issues.push(
      `POC screen "${pocScreen.name}" ${omitted ? 'is omitted' : 'deviates substantively'} from the confirmed prototype. Ask the user via ask_user_question with id "${expectedId}" (options[0] = approve this deviation, options[1] = keep the confirmed POC scope) and wait for options[0] to be selected before citing confirmation.questionId; a prior question, a rejection, or a note alone does not authorize it.`,
    );
  } else {
    ctx.usedConfirmationIds.add(questionId);
  }
  return issues;
}

/** Record what a `simulate_prototype` call observed so action claims can be checked against it. */
export function recordPrototypeRun(pending, args, value) {
  if (!isRecord(pending) || !isRecord(value)) return;
  const steps = isRecord(args) && Array.isArray(args.steps) ? args.steps : [];
  const clicked = steps.flatMap((step) => {
    if (!isRecord(step) || step.type !== 'click') return [];
    const nodeId = text(step.nodeId) || text(step.node_id);
    return nodeId === '' ? [] : [nodeId];
  });
  const variantOverrides = isRecord(value.variantOverrides) ? value.variantOverrides : {};
  const run = {
    clicked,
    startScreenId: text(value.startScreenId),
    currentScreenId: text(value.currentScreenId),
    visitedScreens: stringList(value.visitedScreens),
    overlays: stringList(value.overlays),
    variantTargets: [
      ...Object.keys(variantOverrides).map(text),
      ...Object.values(variantOverrides).map(text),
    ].filter((item) => item !== ''),
  };
  pending.prototypeRuns = [...(Array.isArray(pending.prototypeRuns) ? pending.prototypeRuns : []), run].slice(-MAX_PROTOTYPE_RUNS);
}

/** Record an executed inspection method on the current draft version. */
export function recordExecutedInspection(pending, source) {
  if (!isRecord(pending)) return;
  const current = pending.executedMethods instanceof Set ? pending.executedMethods : new Set();
  if (source === 'inspect:layout') current.add('layout');
  else if (source === 'inspect:quality') {
    current.add('quality');
    current.add('lint');
  } else if (typeof source === 'string' && CONTEXT_TOOL_METHOD.has(source)) {
    current.add(CONTEXT_TOOL_METHOD.get(source));
  } else if (typeof source === 'string' && EXECUTED_METHODS.has(source)) {
    current.add(source);
  }
  pending.executedMethods = current;
}

/** Inspections and simulations describe one document version; any mutation invalidates them. */
export function clearPrototypeRuns(pending) {
  if (!isRecord(pending)) return;
  pending.prototypeRuns = [];
  if (pending.executedMethods instanceof Set) pending.executedMethods.clear();
  if (pending.contextCalls instanceof Set) pending.contextCalls.clear();
  pending.lastReviewDiagnosticSignature = undefined;
  pending.sameDiagnosticRepeats = 0;
}

export function prototypeRunsOf(pending) {
  const runs = isRecord(pending) && Array.isArray(pending.prototypeRuns) ? pending.prototypeRuns : [];
  return runs.filter((run) => isRecord(run) && Array.isArray(run.clicked) && Array.isArray(run.visitedScreens));
}

function collectReusableMastersAndRefs(documentJson) {
  const masters = new Map();
  const refsWithMaster = new Set();
  let parsed;
  try {
    parsed = JSON.parse(documentJson);
  } catch {
    return { masters, refsWithMaster };
  }
  const walk = (nodes) => {
    for (const node of Array.isArray(nodes) ? nodes : []) {
      if (!isRecord(node)) continue;
      if (node.reusable === true && text(node.id) !== '') {
        masters.set(text(node.id), JSON.stringify(node));
      }
      if (node.type === 'ref' && text(node.ref) !== '') {
        refsWithMaster.add(text(node.ref));
      }
      walk(node.children);
    }
  };
  walk(parsed?.children);
  for (const page of Array.isArray(parsed?.pages) ? parsed.pages : []) walk(page?.children);
  return { masters, refsWithMaster };
}

/** Track reusable masters mutated after instances already referenced them. */
export function recordModifiedMasters(pending, beforeDocumentJson, afterDocumentJson) {
  if (!isRecord(pending) || typeof beforeDocumentJson !== 'string' || typeof afterDocumentJson !== 'string') return;
  const before = collectReusableMastersAndRefs(beforeDocumentJson);
  const after = collectReusableMastersAndRefs(afterDocumentJson);
  const tracked = pending.modifiedMasters instanceof Set ? pending.modifiedMasters : new Set();
  for (const [masterId, serialized] of before.masters.entries()) {
    if (!before.refsWithMaster.has(masterId)) continue;
    const updated = after.masters.get(masterId);
    if (updated !== undefined && updated !== serialized) tracked.add(masterId);
  }
  pending.modifiedMasters = tracked;
}

export function affectedInstancesForModifiedMasters(pending, documentJson, screenNodeIds, nodesById) {
  if (!isRecord(pending) || !(pending.modifiedMasters instanceof Set) || pending.modifiedMasters.size === 0) {
    return [];
  }
  const byMaster = new Map();
  for (const [id, info] of nodesById.entries()) {
    if (info.type !== 'ref' || !info.ref || !pending.modifiedMasters.has(info.ref)) continue;
    if (screenNodeIds.size > 0 && !isInsideAny(id, screenNodeIds, nodesById)) continue;
    byMaster.set(info.ref, [...(byMaster.get(info.ref) ?? []), id]);
  }
  return [...byMaster.entries()].map(([masterId, instanceIds]) => ({ masterId, instanceIds }));
}
