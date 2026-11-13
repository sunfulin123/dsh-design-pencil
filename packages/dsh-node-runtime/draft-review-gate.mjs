/**
 * Structured review receipt and screen/state/POC/reuse gates before draft publication.
 *
 * The host can verify that cited nodes exist, that a claimed method was really
 * executed and that a receipt belongs to the current version. It cannot verify
 * that a written finding is true, so the gate asks for checkable evidence and
 * lets a check be reported as unverified instead of rewarding a filled-in field.
 */

import { basename } from 'node:path';
import {
  CONTENT_STATES,
  REVIEW_DIMENSIONS,
  draftRootNodes,
  isRecord,
} from './draft-canvas-contract.mjs';
import {
  ACTION_KINDS,
  CHECK_METHODS,
  CHECK_STATUSES,
  DEVIATION_LEVELS,
  affectedInstancesForModifiedMasters,
  checkActions,
  checkPocDeviation,
  checkReviewChecks,
  parseDesignUpgrades,
  prototypeRunsOf,
} from './draft-review-checks.mjs';

export {
  clearPrototypeRuns,
  recordExecutedInspection,
  recordModifiedMasters,
  recordPrototypeRun,
} from './draft-review-checks.mjs';

/** Diagnostics returned in one correction response; hosts use the same bound. */
export const MAX_CORRECTION_DIAGNOSTICS = 64;

function nonEmptyText(value) {
  return typeof value === 'string' && value.trim().length > 0;
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
  const walk = (nodes, parentId) => {
    for (const node of nodes) {
      if (!isRecord(node)) continue;
      const type = typeof node.type === 'string' ? node.type : '';
      if (type === 'ref' && nonEmptyText(node.ref)) linkedRefCount += 1;
      const children = Array.isArray(node.children) ? node.children : [];
      if (nonEmptyText(node.id)) {
        nodesById.set(node.id.trim(), {
          type,
          childCount: children.length,
          ...(parentId === undefined ? {} : { parentId }),
          ...(nonEmptyText(node.name) ? { name: node.name.trim() } : {}),
          ...(type === 'ref' && nonEmptyText(node.ref) ? { ref: node.ref.trim() } : {}),
        });
      }
      walk(children, nonEmptyText(node.id) ? node.id.trim() : parentId);
    }
  };
  walk(draftRootNodes(parsed), undefined);
  return { nodesById, linkedRefCount };
}

const REVIEW_FIELDS = {
  screens: `Every planned screen as { name, nodeId } or { name, nodeIds: [...] } (one or more non-empty container frames when a screen expresses multiple independent state boards — never duplicate the same screen name) or { name, omittedReason }. For each recorded POC screen add pocScreenshot and deviation (${DEVIATION_LEVELS.join(' | ')}): use "upgrade" for visual/typography/spacing/component craft improvements within confirmed scope (list { what, why } in designUpgrades or differences — no user approval needed), "minor" for small differences, and "substantive" ONLY for scope changes (omitted screen, dropped shell, changed state expression, reduced copy/actions), which require confirmation.questionId ("synapse-design-deviation:<draftId>:<screen>") approved via options[0].`,
  checks: `One entry per dimension (${REVIEW_DIMENSIONS.join(', ')}): { dimension, status, finding, nodeIds, method, uncovered, reason }. status is ${CHECK_STATUSES.join(' | ')}. pass and fail cite the inspected nodeIds inside the reviewed screens and a finding; pass also names the executed method (${CHECK_METHODS.join(' | ')}) run on the current version, and on multi-screen designs covers every built screen. unverified states in uncovered what was not checked; not-applicable gives a reason. Never report pass for something that was not examined.`,
  visual: '{ screenshotSha256 } of the finalized screenshot that was inspected; required once a screenshot was delivered.',
  actions: `Each primary action as { screen, label, kind } with kind ${ACTION_KINDS.join(' | ')}. verifiable also needs the control nodeId inside that screen and the target nodeId it reaches (navigated screen, opened overlay, or switched variant), matching a simulate_prototype run on this version. A notice that a feature is unavailable is not-implemented.`,
  states: `Explicit status ("designed" + nodeId or "not-applicable" + reason) for ${CONTENT_STATES.join(', ')}.`,
  designUpgrades: 'Optional list of { screen?, what, why } notes recording intentional visual/layout/typography/component upgrades beyond a confirmed POC without altering scope.',
  reuseNote: 'Required when componentReuseCandidates exist and the document has zero linked { type: "ref" } instances.',
};

export function buildDraftChecklist(plannedScreens = [], pocScreens = []) {
  return {
    stages: [
      'Stage C: state the user, task and success criterion; confirm surface mode, planned screens, how multi-state screens map to independent frames vs in-screen variants, spacing levels, reusable components, token source, the 6 content states, and (when a POC/reference exists) whether the user wants a strict replica or a design upgrade within confirmed scope.',
      'Stage D: write DESIGN-specified font families onto text nodes, build the skeleton inside rootNodeId, then populate one region at a time; preserve confirmed scope while recording intentional visual upgrades as design-upgrade notes.',
      'Stage E: run paginated lint_document and get_design_quality (all touch-target pages + DESIGN fontResolution), simulate each primary action, and repair defects.',
      'Stage F: call finish once to render the finalized root screenshot, then review it at three scales: whole screen, groups, details. Do not call finish without review again as a status probe; use inspect(kind="status") instead.',
      'Stage G: run the receipt precheck (all cited nodeIds inside reviewed screens; all instances of modified masters listed; layout executed on the current version; no stale-version checks) and submit finish({ draftId, review }). If the same diagnostic class recurs twice, stop and ask the user.',
    ],
    plannedScreens,
    pocScreens,
    reviewFields: REVIEW_FIELDS,
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
    checkStatuses: CHECK_STATUSES,
    checkMethods: CHECK_METHODS,
    actionKinds: ACTION_KINDS,
    deviationLevels: DEVIATION_LEVELS,
    requiredStates: CONTENT_STATES,
    reuseNoteRequired: reuseRequired,
    reviewFields: REVIEW_FIELDS,
  };
}

function matchesPocScreenshot(candidate, pocScreen) {
  const trimmed = candidate.trim();
  const base = basename(trimmed);
  return pocScreen.screenshots.some(
    (recorded) => recorded === trimmed || recorded.endsWith(`/${trimmed}`) || basename(recorded) === base,
  );
}

function indexNamedRecords(raw, keyField, { rejectDuplicates = false, listLabel = 'records' } = {}) {
  const map = new Map();
  const duplicateIssues = [];
  if (!Array.isArray(raw)) return { map, duplicateIssues };
  for (const item of raw) {
    if (isRecord(item) && nonEmptyText(item[keyField])) {
      const display = String(item[keyField]).trim();
      const key = display.toLocaleLowerCase('en-US');
      if (rejectDuplicates && map.has(key)) {
        duplicateIssues.push(
          `Duplicate ${keyField} "${display}" in ${listLabel}; list multiple state frames for one screen under nodeIds: ["frame-1", "frame-2", ...] instead of repeating the same screen name.`,
        );
        continue;
      }
      map.set(key, item);
    }
  }
  return { map, duplicateIssues };
}

function extractScreenContainerIds(entry) {
  if (!isRecord(entry)) return [];
  const list = [];
  if (Array.isArray(entry.nodeIds)) {
    for (const raw of entry.nodeIds) {
      if (nonEmptyText(raw)) {
        const trimmed = raw.trim();
        if (!list.includes(trimmed)) list.push(trimmed);
      }
    }
  }
  if (nonEmptyText(entry.nodeId)) {
    const trimmed = entry.nodeId.trim();
    if (!list.includes(trimmed)) list.unshift(trimmed);
  }
  return list;
}

function isNonEmptyContainer(node) {
  return node !== undefined && (node.type === 'frame' || node.type === 'group') && node.childCount > 0;
}

function checkOnePlannedScreen(plannedName, entry, nodesById, usedNodeIds) {
  if (entry === undefined) {
    return { missing: plannedName, issues: [`Planned screen "${plannedName}" is missing from review.screens.`] };
  }
  if (nonEmptyText(entry.omittedReason)) {
    return { omitted: { name: plannedName, reason: entry.omittedReason.trim() }, issues: [] };
  }
  const containerIds = extractScreenContainerIds(entry);
  if (containerIds.length === 0) {
    return {
      missing: plannedName,
      issues: [`Planned screen "${plannedName}" must reference an existing non-empty container via nodeId or nodeIds.`],
    };
  }
  const issues = [];
  for (const nodeId of containerIds) {
    if (!isNonEmptyContainer(nodesById.get(nodeId))) {
      issues.push(
        `Planned screen "${plannedName}" must reference existing non-empty container frame/group nodeIds (invalid "${nodeId}").`,
      );
      continue;
    }
    const prior = usedNodeIds.get(nodeId);
    if (prior !== undefined && prior.toLocaleLowerCase('en-US') !== plannedName.toLocaleLowerCase('en-US')) {
      issues.push(
        `Planned screen "${plannedName}" reuses nodeId "${nodeId}" already claimed by "${prior}"; each screen must map to its own container(s).`,
      );
      continue;
    }
    usedNodeIds.set(nodeId, plannedName);
  }
  return issues.length > 0 ? { missing: plannedName, issues } : { issues: [], containerIds };
}

function checkOnePocScreen(pocScreen, entry, nodesById, omittedScreens, deviationCtx) {
  if (entry === undefined) return [`POC screen "${pocScreen.name}" is missing from review.screens.`];
  if (nonEmptyText(entry.omittedReason)) {
    const key = pocScreen.name.toLocaleLowerCase('en-US');
    if (!omittedScreens.some((item) => item.name.toLocaleLowerCase('en-US') === key)) {
      omittedScreens.push({ name: pocScreen.name, reason: entry.omittedReason.trim() });
    }
    return checkPocDeviation(pocScreen, entry, deviationCtx, true);
  }
  const issues = [];
  const containerIds = extractScreenContainerIds(entry);
  if (containerIds.length === 0 || containerIds.some((id) => !isNonEmptyContainer(nodesById.get(id)))) {
    issues.push(
      `POC screen "${pocScreen.name}" must reference existing non-empty container nodeId/nodeIds (got ${JSON.stringify(containerIds)}).`,
    );
  }
  if (!nonEmptyText(entry.pocScreenshot) || !matchesPocScreenshot(entry.pocScreenshot, pocScreen)) {
    issues.push(
      `POC screen "${pocScreen.name}" must cite its recorded pocScreenshot (${pocScreen.screenshots.map((s) => basename(s)).join(', ')}).`,
    );
  }
  issues.push(...checkPocDeviation(pocScreen, entry, deviationCtx, false));
  return issues;
}

function checkScreensAndPoc(rawScreens, pending, nodesById, deviationCtx) {
  const missingScreens = [];
  const omittedScreens = [];
  const usedNodeIds = new Map();
  const { map: byName, duplicateIssues } = indexNamedRecords(rawScreens, 'name', {
    rejectDuplicates: true,
    listLabel: 'review.screens',
  });
  const screenIssues = [...duplicateIssues];
  const pocIssues = [];
  const screenNodesByName = new Map();
  const addScreenIds = (screenName, ids) => {
    const key = screenName.toLocaleLowerCase('en-US');
    const set = screenNodesByName.get(key) ?? new Set();
    for (const id of ids) set.add(id);
    if (set.size > 0) screenNodesByName.set(key, set);
  };
  for (const planned of pending.plannedScreens ?? []) {
    const checked = checkOnePlannedScreen(
      planned.name,
      byName.get(planned.name.toLocaleLowerCase('en-US')),
      nodesById,
      usedNodeIds,
    );
    if (checked.missing !== undefined) missingScreens.push(checked.missing);
    screenIssues.push(...checked.issues);
    if (checked.omitted !== undefined) omittedScreens.push(checked.omitted);
    if (checked.containerIds !== undefined) addScreenIds(planned.name, checked.containerIds);
  }
  for (const pocScreen of pending.pocScreens ?? []) {
    const entry = byName.get(pocScreen.name.toLocaleLowerCase('en-US'));
    pocIssues.push(...checkOnePocScreen(pocScreen, entry, nodesById, omittedScreens, deviationCtx));
    const validIds = extractScreenContainerIds(entry).filter((id) => isNonEmptyContainer(nodesById.get(id)));
    if (validIds.length > 0) addScreenIds(pocScreen.name, validIds);
  }
  const screenNodeIds = new Set(usedNodeIds.keys());
  for (const set of screenNodesByName.values()) {
    for (const id of set) screenNodeIds.add(id);
  }
  const screenNodeByName = new Map();
  for (const [key, set] of screenNodesByName.entries()) {
    const first = set.values().next().value;
    if (first !== undefined) screenNodeByName.set(key, first);
  }
  return {
    missingScreens,
    screenIssues,
    pocIssues,
    omittedScreens,
    screenNodeIds,
    screenNodeByName,
    screenNodesByName,
  };
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
  return expectedSha === undefined || rawVisual.screenshotSha256 !== expectedSha
    ? [`review.visual.screenshotSha256 must equal the current finalized screenshot sha256 (${expectedSha ?? 'unavailable'}).`]
    : [];
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
    return nonEmptyText(entry.reason)
      ? undefined
      : `review.states "${state}" marked not-applicable requires a reason.`;
  }
  return `review.states "${state}" status must be "designed" or "not-applicable".`;
}

function checkStatesAndReuse(review, nodesById, reuseRequired) {
  const issues = [];
  const { map: byState, duplicateIssues } = indexNamedRecords(review?.states, 'state', {
    rejectDuplicates: true,
    listLabel: 'review.states',
  });
  issues.push(...duplicateIssues);
  for (const state of CONTENT_STATES) {
    const err = checkOneStateEntry(state, byState.get(state), nodesById);
    if (err !== undefined) issues.push(err);
  }
  if (reuseRequired && !nonEmptyText(review?.reuseNote)) {
    issues.push(
      'review.reuseNote is required when componentReuseCandidates exist and the document has zero linked { type: "ref" } instances.',
    );
  }
  return issues;
}

function blockedReviewLimitResponse(draftId, _pending, checkpoint, diagnostics) {
  return {
    draftId,
    published: false,
    stage: 'blocked_review_limit',
    version: checkpoint.version,
    diagnostics,
    canContinue: false,
    next: 'Review receipt validation failed three consecutive times; stop and report the unresolved review gaps honestly.',
  };
}

function failedChecksResponse(base, failed) {
  return {
    ...base,
    stage: 'needs_correction',
    failedChecks: failed,
    canContinue: true,
    next: 'The review reports defects, so this version cannot be published as complete. Repair them, re-run the affected checks on the new version and call finish again. If a defect cannot be repaired, stop and tell the user exactly which scope is unfinished instead of changing the status.',
  };
}

function diagnosticClassSignature(diagnostics) {
  return diagnostics
    .map((line) => String(line).replace(/"[^"]*"/gu, '"*"').trim())
    .sort()
    .join('|');
}

function nextForInvalidReceipt(stage, missingScreens, repeatedDiagnostics) {
  if (repeatedDiagnostics) {
    return 'The same review diagnostic class appeared twice in a row. Stop submitting approximate receipts and ask the user how to resolve the scope, state mapping, or evidence gap before calling finish again.';
  }
  if (stage === 'needs_generation') {
    return `Build the missing planned screen(s) or give an omittedReason: ${missingScreens.join(', ')}.`;
  }
  return 'Correct the review so that each entry states what was actually done: cite inspected nodes and the executed method for pass, and use unverified for anything not examined. Then call finish again.';
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
    pending.lastReviewDiagnosticSignature = undefined;
    pending.sameDiagnosticRepeats = 0;
  }
  const visualRequired = pending.visualReviewStatus === 'image_provided';
  const expectedSha = pending.latestRootScreenshot?.sha256;
  const base = {
    draftId,
    published: false,
    version: checkpoint.version,
    visualVerification: pending.visualReviewStatus ?? 'unverified',
    ...(expectedSha === undefined ? {} : { screenshotSha256: expectedSha }),
  };
  if (ctx.review === undefined) {
    return {
      ok: false,
      response: {
        ...base,
        stage: 'needs_review',
        statusOnly: true,
        diagnostics: [],
        reviewContract: buildReviewContract({
          pending,
          validation,
          documentJson: finalizedSnapshot.documentJson,
          screenshotSha256: expectedSha,
          visualRequired,
        }),
        canContinue: true,
        next: 'No review receipt was passed; finalized checkpoint and prior verified receipts are preserved without incrementing review strikes. Use inspect(kind="status") to check readiness without finalizing, or submit finish({ draftId, review }) with the completed receipt to publish.',
      },
    };
  }
  const review = isRecord(ctx.review) ? ctx.review : undefined;
  const { nodesById, linkedRefCount } = indexDocumentNodes(finalizedSnapshot.documentJson);
  const reuseRequired = validation.reuseCandidateCount > 0 && linkedRefCount === 0;
  const approvedQuestionIds = new Set(ctx.approvedQuestionIds ?? ctx.answeredQuestionIds ?? []);
  const collectedUpgrades = [];
  const topUpgrades = parseDesignUpgrades(review?.designUpgrades);
  collectedUpgrades.push(...topUpgrades.upgrades);
  const {
    missingScreens,
    screenIssues,
    pocIssues,
    omittedScreens,
    screenNodeIds,
    screenNodeByName,
    screenNodesByName,
  } = checkScreensAndPoc(review?.screens, pending, nodesById, {
    draftId,
    approvedQuestionIds,
    usedConfirmationIds: new Set(),
    collectedUpgrades,
  });
  const visualIssues = checkVisualReceipt(review?.visual, visualRequired, expectedSha);
  const executedMethods = pending.executedMethods instanceof Set ? pending.executedMethods : new Set();
  const evidenceCtx = {
    nodesById,
    screenNodeIds,
    screenNodeByName,
    screenNodesByName,
    executedMethods,
    affectedInstancesByMaster: affectedInstancesForModifiedMasters(
      pending,
      finalizedSnapshot.documentJson,
      screenNodeIds,
      nodesById,
    ),
    // An approximate preview shows roughly what the canvas contains; it cannot
    // support a claim about exact rendering.
    screenshotInspectable: visualRequired && visualIssues.length === 0 && pending.latestRootScreenshot?.renderer !== 'approximate',
    prototypeRuns: prototypeRunsOf(pending),
  };
  const checks = checkReviewChecks(review?.checks, evidenceCtx);
  const actions = checkActions(review?.actions, evidenceCtx);
  const stateAndReuseIssues = checkStatesAndReuse(review, nodesById, reuseRequired);
  const allIssues = [
    ...screenIssues,
    ...visualIssues,
    ...checks.issues,
    ...actions.issues,
    ...pocIssues,
    ...topUpgrades.issues,
    ...stateAndReuseIssues,
  ];
  if (allIssues.length === 0) {
    // An honest failing receipt is valid, so it never counts toward the invalid-receipt limit.
    if (checks.failed.length > 0) return { ok: false, response: failedChecksResponse(base, checks.failed) };
    pending.lastReviewDiagnosticSignature = undefined;
    pending.sameDiagnosticRepeats = 0;
    return {
      ok: true,
      omittedScreens,
      unverifiedChecks: checks.unverified,
      actions: actions.summary,
      designUpgrades: collectedUpgrades,
    };
  }

  const failures = (pending.reviewValidationFailures ?? 0) + 1;
  pending.reviewValidationFailures = failures;
  const diagnostics = allIssues.slice(0, MAX_CORRECTION_DIAGNOSTICS);
  const signature = diagnosticClassSignature(diagnostics);
  const sameRepeats = signature !== '' && pending.lastReviewDiagnosticSignature === signature
    ? (pending.sameDiagnosticRepeats ?? 1) + 1
    : 1;
  pending.lastReviewDiagnosticSignature = signature;
  pending.sameDiagnosticRepeats = sameRepeats;
  const repeatedDiagnostics = sameRepeats >= 2;
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
      ...base,
      stage,
      ...(repeatedDiagnostics ? { repeatedDiagnostics: true } : {}),
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
      next: nextForInvalidReceipt(stage, missingScreens, repeatedDiagnostics),
    },
  };
}
