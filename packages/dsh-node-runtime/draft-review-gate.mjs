/** Structured review receipt and screen/state/POC/reuse gates before draft publication. */

import { basename } from 'node:path';
import {
  CONTENT_STATES,
  REVIEW_DIMENSIONS,
  draftRootNodes,
  isRecord,
} from './draft-canvas-contract.mjs';

const MAX_CORRECTION_DIAGNOSTICS = 64;

function nonEmptyText(value, minLength = 1) {
  return typeof value === 'string' && value.trim().length >= minLength;
}

export function indexDocumentNodes(documentJson) {
  const nodesById = new Map();
  let linkedRefCount = 0;
  let parsed;
  try {
    parsed = JSON.parse(documentJson);
  } catch {
    return { nodesById, linkedRefCount };
  }
  if (!isRecord(parsed)) return { nodesById, linkedRefCount };
  const walk = (nodes) => {
    for (const node of nodes) {
      if (!isRecord(node)) continue;
      const type = typeof node.type === 'string' ? node.type : '';
      if (type === 'ref' && nonEmptyText(node.ref)) linkedRefCount += 1;
      const children = Array.isArray(node.children) ? node.children : [];
      if (nonEmptyText(node.id)) {
        nodesById.set(node.id.trim(), {
          type,
          childCount: children.length,
          ...(nonEmptyText(node.name) ? { name: node.name.trim() } : {}),
        });
      }
      walk(children);
    }
  };
  walk(draftRootNodes(parsed));
  return { nodesById, linkedRefCount };
}

export function buildDraftChecklist(plannedScreens = [], pocScreens = []) {
  return {
    stages: [
      'Stage C: confirm surface mode, planned screens, reusable components, token source, and 6 content states.',
      'Stage D: build Batch 1 skeleton inside rootNodeId, then populate sections with linked refs and tokens.',
      'Stage E: run paginated lint_document and get_design_quality (all touch-target pages); repair defects.',
      'Stage F: call finish to render the finalized root screenshot, then inspect it across all 5 rubric dimensions.',
      'Stage G: call finish again with the structured review receipt bound to screenshotSha256.',
    ],
    plannedScreens,
    pocScreens,
    reviewFields: {
      screens: 'Every planned screen with non-empty { name, nodeId } or { name, omittedReason } (plus pocScreenshot and differences for POC screens).',
      visual: `{ screenshotSha256, observations } covering ${REVIEW_DIMENSIONS.join(', ')}.`,
      states: `Explicit status ("designed" + nodeId or "not-applicable" + reason) for ${CONTENT_STATES.join(', ')}.`,
      reuseNote: 'Required when componentReuseCandidates exist and the document has zero linked { type: "ref" } instances.',
    },
  };
}

export function buildReviewContract(ctx) {
  const { linkedRefCount } = indexDocumentNodes(ctx.documentJson);
  const reuseRequired = (ctx.validation?.reuseCandidateCount ?? 0) > 0 && linkedRefCount === 0;
  return {
    plannedScreens: ctx.pending.plannedScreens ?? [],
    pocScreens: ctx.pending.pocScreens ?? [],
    visualRequired: ctx.visualRequired,
    screenshotSha256: ctx.screenshotSha256 ?? null,
    requiredDimensions: REVIEW_DIMENSIONS,
    requiredStates: CONTENT_STATES,
    reuseNoteRequired: reuseRequired,
  };
}

function matchesPocScreenshot(candidate, pocScreen) {
  const trimmed = candidate.trim();
  const base = basename(trimmed);
  return pocScreen.screenshots.some(
    (recorded) => recorded === trimmed || recorded.endsWith(`/${trimmed}`) || basename(recorded) === base,
  );
}

function indexNamedRecords(raw, keyField) {
  const map = new Map();
  if (!Array.isArray(raw)) return map;
  for (const item of raw) {
    if (isRecord(item) && nonEmptyText(item[keyField])) {
      map.set(String(item[keyField]).trim().toLocaleLowerCase('en-US'), item);
    }
  }
  return map;
}

function isNonEmptyContainer(node) {
  return node !== undefined && (node.type === 'frame' || node.type === 'group') && node.childCount > 0;
}

function checkOnePlannedScreen(plannedName, entry, nodesById, usedNodeIds) {
  if (entry === undefined) {
    return { missing: plannedName, issue: `Planned screen "${plannedName}" is missing from review.screens.` };
  }
  if (nonEmptyText(entry.omittedReason)) {
    return nonEmptyText(entry.omittedReason, 8)
      ? { omitted: { name: plannedName, reason: entry.omittedReason.trim() } }
      : { issue: `Planned screen "${plannedName}" omittedReason must be at least 8 characters.` };
  }
  const nodeId = nonEmptyText(entry.nodeId) ? entry.nodeId.trim() : '';
  if (!isNonEmptyContainer(nodeId ? nodesById.get(nodeId) : undefined)) {
    return {
      missing: plannedName,
      issue: `Planned screen "${plannedName}" must reference an existing non-empty container frame/group nodeId (got "${nodeId}").`,
    };
  }
  const prior = usedNodeIds.get(nodeId);
  if (prior !== undefined) {
    return {
      missing: plannedName,
      issue: `Planned screen "${plannedName}" reuses nodeId "${nodeId}" already claimed by "${prior}"; each screen must map to its own container.`,
    };
  }
  usedNodeIds.set(nodeId, plannedName);
  return {};
}

function checkOnePocScreen(pocScreen, entry, nodesById, omittedScreens) {
  if (entry === undefined) return [`POC screen "${pocScreen.name}" is missing from review.screens.`];
  if (nonEmptyText(entry.omittedReason, 8)) {
    const key = pocScreen.name.toLocaleLowerCase('en-US');
    if (!omittedScreens.some((item) => item.name.toLocaleLowerCase('en-US') === key)) {
      omittedScreens.push({ name: pocScreen.name, reason: entry.omittedReason.trim() });
    }
    return [];
  }
  const issues = [];
  const nodeId = nonEmptyText(entry.nodeId) ? entry.nodeId.trim() : '';
  if (!isNonEmptyContainer(nodeId ? nodesById.get(nodeId) : undefined)) {
    issues.push(`POC screen "${pocScreen.name}" must reference an existing non-empty container nodeId (got "${nodeId}").`);
  }
  if (!nonEmptyText(entry.pocScreenshot) || !matchesPocScreenshot(entry.pocScreenshot, pocScreen)) {
    issues.push(
      `POC screen "${pocScreen.name}" must cite its recorded pocScreenshot (${pocScreen.screenshots.map((s) => basename(s)).join(', ')}).`,
    );
  }
  if (!nonEmptyText(entry.differences, 8)) {
    issues.push(
      `POC screen "${pocScreen.name}" requires a substantive differences note (>= 8 chars) comparing the POC capture and Synapse screen.`,
    );
  }
  return issues;
}

function checkScreensAndPoc(rawScreens, pending, nodesById) {
  const missingScreens = [];
  const screenIssues = [];
  const pocIssues = [];
  const omittedScreens = [];
  const usedNodeIds = new Map();
  const byName = indexNamedRecords(rawScreens, 'name');
  for (const planned of pending.plannedScreens ?? []) {
    const checked = checkOnePlannedScreen(
      planned.name,
      byName.get(planned.name.toLocaleLowerCase('en-US')),
      nodesById,
      usedNodeIds,
    );
    if (checked.missing !== undefined) missingScreens.push(checked.missing);
    if (checked.issue !== undefined) screenIssues.push(checked.issue);
    if (checked.omitted !== undefined) omittedScreens.push(checked.omitted);
  }
  for (const pocScreen of pending.pocScreens ?? []) {
    pocIssues.push(
      ...checkOnePocScreen(
        pocScreen,
        byName.get(pocScreen.name.toLocaleLowerCase('en-US')),
        nodesById,
        omittedScreens,
      ),
    );
  }
  return { missingScreens, screenIssues, pocIssues, omittedScreens };
}

function checkVisualReceipt(rawVisual, visualRequired, expectedSha) {
  if (!visualRequired) {
    return isRecord(rawVisual) && expectedSha !== undefined && rawVisual.screenshotSha256 !== expectedSha
      ? [`review.visual.screenshotSha256 must match the finalized screenshot (${expectedSha}).`]
      : [];
  }
  if (!isRecord(rawVisual)) {
    return ['review.visual is required after a finalized screenshot was provided for visual inspection.'];
  }
  const issues = [];
  if (expectedSha === undefined || rawVisual.screenshotSha256 !== expectedSha) {
    issues.push(
      `review.visual.screenshotSha256 must equal the current finalized screenshot sha256 (${expectedSha ?? 'unavailable'}).`,
    );
  }
  const covered = new Set();
  if (Array.isArray(rawVisual.observations)) {
    for (const item of rawVisual.observations) {
      if (isRecord(item) && nonEmptyText(item.dimension) && nonEmptyText(item.finding, 8)) {
        covered.add(item.dimension.trim());
      }
    }
  }
  for (const dim of REVIEW_DIMENSIONS) {
    if (!covered.has(dim)) {
      issues.push(`review.visual.observations is missing a substantive finding (>= 8 chars) for "${dim}".`);
    }
  }
  return issues;
}

function checkOneStateEntry(state, entry, nodesById) {
  if (entry === undefined) return `review.states is missing "${state}".`;
  if (entry.status === 'designed') {
    const nodeId = nonEmptyText(entry.nodeId) ? entry.nodeId.trim() : '';
    return nodeId && nodesById.has(nodeId)
      ? undefined
      : `review.states "${state}" is marked designed but nodeId "${nodeId}" does not exist in the draft.`;
  }
  if (entry.status === 'not-applicable') {
    return nonEmptyText(entry.reason, 4)
      ? undefined
      : `review.states "${state}" marked not-applicable requires a reason (>= 4 chars).`;
  }
  return `review.states "${state}" status must be "designed" or "not-applicable".`;
}

function checkStatesAndReuse(review, nodesById, reuseRequired) {
  const issues = [];
  const byState = indexNamedRecords(review?.states, 'state');
  for (const state of CONTENT_STATES) {
    const err = checkOneStateEntry(state, byState.get(state), nodesById);
    if (err !== undefined) issues.push(err);
  }
  if (reuseRequired && !nonEmptyText(review?.reuseNote, 8)) {
    issues.push(
      'review.reuseNote (>= 8 chars) is required when componentReuseCandidates exist and the document has zero linked { type: "ref" } instances.',
    );
  }
  return issues;
}

function blockedReviewLimitResponse(draftId, pending, checkpoint, diagnostics) {
  return {
    draftId,
    path: pending.processPath,
    published: false,
    stage: 'blocked_review_limit',
    version: checkpoint.version,
    diagnostics,
    canContinue: false,
    next: 'Review receipt validation failed three consecutive times; stop and report the unresolved review gaps honestly.',
  };
}

export function validateFinishReview(ctx) {
  const { draftId, pending, checkpoint, validation, finalizedSnapshot, userTurnCount } = ctx;
  if (pending.reviewBlockedUserCount !== undefined && userTurnCount <= pending.reviewBlockedUserCount) {
    return {
      ok: false,
      response: blockedReviewLimitResponse(draftId, pending, checkpoint, [
        'Three consecutive invalid review receipts already halted publication in this turn.',
      ]),
    };
  }
  if (pending.reviewBlockedUserCount !== undefined && userTurnCount > pending.reviewBlockedUserCount) {
    pending.reviewBlockedUserCount = undefined;
    pending.reviewValidationFailures = 0;
  }
  const review = isRecord(ctx.review) ? ctx.review : undefined;
  const { nodesById, linkedRefCount } = indexDocumentNodes(finalizedSnapshot.documentJson);
  const visualRequired = pending.visualReviewStatus === 'image_provided';
  const expectedSha = pending.latestRootScreenshot?.sha256;
  const reuseRequired = validation.reuseCandidateCount > 0 && linkedRefCount === 0;
  const { missingScreens, screenIssues, pocIssues, omittedScreens } = checkScreensAndPoc(
    review?.screens,
    pending,
    nodesById,
  );
  const visualIssues = checkVisualReceipt(review?.visual, visualRequired, expectedSha);
  const stateAndReuseIssues = checkStatesAndReuse(review, nodesById, reuseRequired);
  const allIssues = [...screenIssues, ...visualIssues, ...pocIssues, ...stateAndReuseIssues];
  if (allIssues.length === 0) return { ok: true, omittedScreens };

  const failures = (pending.reviewValidationFailures ?? 0) + 1;
  pending.reviewValidationFailures = failures;
  const diagnostics = allIssues.slice(0, MAX_CORRECTION_DIAGNOSTICS);
  if (failures >= 3) {
    pending.reviewBlockedUserCount = userTurnCount;
    return {
      ok: false,
      response: blockedReviewLimitResponse(draftId, pending, checkpoint, diagnostics),
    };
  }
  const stage = missingScreens.length > 0
    ? 'needs_generation'
    : visualIssues.length > 0
      ? 'needs_visual_review'
      : 'needs_review';
  return {
    ok: false,
    response: {
      draftId,
      path: pending.processPath,
      published: false,
      stage,
      version: checkpoint.version,
      visualVerification: pending.visualReviewStatus ?? 'unverified',
      ...(expectedSha === undefined ? {} : { screenshotSha256: expectedSha }),
      ...(missingScreens.length === 0 ? {} : { missingScreens }),
      diagnostics,
      reviewContract: buildReviewContract({
        pending,
        validation,
        documentJson: finalizedSnapshot.documentJson,
        screenshotSha256: expectedSha,
        visualRequired,
      }),
      canContinue: true,
      next: stage === 'needs_generation'
        ? `Build or supply valid non-empty nodeIds (or omittedReason) for missing planned screen(s): ${missingScreens.join(', ')}.`
        : 'Complete every required field in review (screens, visual, states, and reuseNote when applicable) and call finish again.',
    },
  };
}
