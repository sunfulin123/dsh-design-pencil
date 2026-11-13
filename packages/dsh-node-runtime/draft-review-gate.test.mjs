import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDraftChecklist,
  clearPrototypeRuns,
  recordExecutedInspection,
  recordModifiedMasters,
  recordPrototypeRun,
  validateFinishReview,
} from './draft-review-gate.mjs';

const SHA = 'a'.repeat(64);
const DIMENSIONS = ['task_integrity', 'structure_overflow', 'hierarchy_density', 'style_consistency', 'content_states'];
const STATES = ['loading', 'empty', 'error', 'partial', 'success', 'permission'];

const DOCUMENT = JSON.stringify({
  version: '1.0.0',
  children: [
    {
      type: 'frame',
      id: 'chat',
      name: 'Chat',
      children: [
        { type: 'frame', id: 'sidebar', children: [{ type: 'ref', id: 'row-general', ref: 'row' }] },
        { type: 'frame', id: 'send', name: 'Send', children: [{ type: 'text', id: 'send-label', content: 'Send' }] },
        { type: 'frame', id: 'export', name: 'Export', children: [{ type: 'text', id: 'export-label', content: 'Export' }] },
      ],
    },
    { type: 'frame', id: 'sent', name: 'Sent', children: [{ type: 'text', id: 'sent-title', content: 'Sent' }] },
    { type: 'frame', id: 'row', reusable: true, children: [{ type: 'text', id: 'label', content: 'Channel' }] },
  ],
});

function pendingDraft(extra = {}) {
  return {
    processPath: '/tmp/chat.op',
    plannedScreens: [{ name: 'Chat' }],
    visualReviewStatus: 'image_provided',
    latestRootScreenshot: { sha256: SHA },
    ...extra,
  };
}

function passCheck(dimension, extra = {}) {
  return {
    dimension,
    status: 'pass',
    finding: 'Sidebar rows show their channel names; nothing is clipped.',
    nodeIds: ['sidebar'],
    method: 'screenshot',
    ...extra,
  };
}

function receipt(extra = {}) {
  return {
    screens: [{ name: 'Chat', nodeId: 'chat' }],
    visual: { screenshotSha256: SHA },
    checks: DIMENSIONS.map((dimension) => passCheck(dimension)),
    actions: [],
    states: STATES.map((state) => ({ state, status: 'not-applicable', reason: 'Single static state.' })),
    ...extra,
  };
}

function validate(review, pending = pendingDraft(), extra = {}) {
  return validateFinishReview({
    draftId: 'd1',
    review,
    pending,
    checkpoint: { version: 3 },
    validation: { reuseCandidateCount: 0 },
    finalizedSnapshot: { documentJson: DOCUMENT },
    userTurnCount: 1,
    ...extra,
  });
}

function replaceCheck(dimension, check) {
  return DIMENSIONS.map((name) => (name === dimension ? { dimension, ...check } : passCheck(name)));
}

test('a receipt whose passes cite inspected nodes and an executed method publishes', () => {
  const result = validate(receipt());
  assert.equal(result.ok, true);
  assert.deepEqual(result.unverifiedChecks, []);
  assert.deepEqual(result.actions, []);
});

test('filled-in prose without evidence is rejected however long it is', () => {
  const prose = 'Everything looks correct and matches the selected design in every respect.';
  const result = validate(receipt({ checks: DIMENSIONS.map((dimension) => ({ dimension, status: 'pass', finding: prose })) }));
  assert.equal(result.ok, false);
  assert.equal(result.response.stage, 'needs_review');
  assert.match(result.response.diagnostics.join('\n'), /must list the nodeIds that were inspected/);
  assert.match(result.response.diagnostics.join('\n'), /pass requires method/);
});

test('a pass must cite nodes that exist inside a reviewed screen', () => {
  const missing = validate(receipt({ checks: replaceCheck('task_integrity', passCheck('task_integrity', { nodeIds: ['ghost'] })) }));
  assert.match(missing.response.diagnostics.join('\n'), /"ghost", which does not exist/);
  const outside = validate(receipt({ checks: replaceCheck('task_integrity', passCheck('task_integrity', { nodeIds: ['sent-title'] })) }));
  assert.match(outside.response.diagnostics.join('\n'), /outside every reviewed screen/);
  const instanceChild = validate(
    receipt({ checks: replaceCheck('task_integrity', passCheck('task_integrity', { nodeIds: ['row-general__label'] })) }),
  );
  assert.equal(instanceChild.ok, true);
});

test('an honest unverified check publishes and is listed separately', () => {
  const result = validate(
    receipt({
      checks: replaceCheck('style_consistency', {
        status: 'unverified',
        uncovered: 'Rendered font family was not compared with the specified family.',
      }),
    }),
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.unverifiedChecks, [
    { dimension: 'style_consistency', uncovered: 'Rendered font family was not compared with the specified family.' },
  ]);
  const silent = validate(receipt({ checks: replaceCheck('style_consistency', { status: 'unverified' }) }));
  assert.equal(silent.ok, false);
});

test('scope and structure cannot be declared not applicable', () => {
  const result = validate(receipt({ checks: replaceCheck('structure_overflow', { status: 'not-applicable', reason: 'Static.' }) }));
  assert.equal(result.ok, false);
  assert.match(result.response.diagnostics.join('\n'), /applies to every design/);
});

test('a reported defect blocks publication without counting as an invalid receipt', () => {
  const pending = pendingDraft();
  const failing = receipt({
    checks: replaceCheck('content_states', {
      status: 'fail',
      finding: 'Channel names are missing from the sidebar rows.',
      nodeIds: ['row-general'],
    }),
  });
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const result = validate(failing, pending);
    assert.equal(result.ok, false);
    assert.equal(result.response.stage, 'needs_correction');
    assert.equal(result.response.published, false);
    assert.equal(result.response.failedChecks[0].dimension, 'content_states');
  }
  assert.equal(pending.reviewValidationFailures, undefined);
});

test('a screenshot pass needs an exact screenshot that was actually delivered', () => {
  const withoutImage = validate(
    { ...receipt(), visual: undefined },
    pendingDraft({ visualReviewStatus: 'unavailable', latestRootScreenshot: undefined }),
  );
  assert.equal(withoutImage.ok, false);
  assert.match(withoutImage.response.diagnostics.join('\n'), /cannot pass by screenshot/);

  const approximate = validate(receipt(), pendingDraft({ latestRootScreenshot: { sha256: SHA, renderer: 'approximate' } }));
  assert.equal(approximate.ok, false);

  const honest = validate(
    {
      ...receipt({
        checks: DIMENSIONS.map((dimension) => ({
          dimension,
          status: 'unverified',
          uncovered: 'No screenshot could be delivered to this model route.',
        })),
      }),
      visual: undefined,
    },
    pendingDraft({ visualReviewStatus: 'unavailable', latestRootScreenshot: undefined }),
  );
  assert.equal(honest.ok, true);
  assert.equal(honest.unverifiedChecks.length, DIMENSIONS.length);
});

test('an action is verifiable only after a simulation reached its destination', () => {
  const action = { screen: 'Chat', label: 'Send', kind: 'verifiable', nodeId: 'send', reaches: 'sent' };
  const pending = pendingDraft();
  const unsimulated = validate(receipt({ actions: [action] }), pending);
  assert.equal(unsimulated.ok, false);
  assert.match(unsimulated.response.diagnostics.join('\n'), /no simulate_prototype run/);

  recordPrototypeRun(
    pending,
    { steps: [{ type: 'click', nodeId: 'send' }] },
    { startScreenId: 'chat', currentScreenId: 'chat', visitedScreens: ['chat'] },
  );
  assert.equal(validate(receipt({ actions: [action] }), pending).ok, false, 'a click that goes nowhere proves nothing');

  const noOpPending = pendingDraft();
  recordPrototypeRun(
    noOpPending,
    { steps: [{ type: 'click', nodeId: 'send' }] },
    { startScreenId: 'chat', currentScreenId: 'chat', visitedScreens: ['chat'] },
  );
  const sameScreenNoOp = { screen: 'Chat', label: 'Send', kind: 'verifiable', nodeId: 'send', reaches: 'chat' };
  assert.equal(
    validate(receipt({ actions: [sameScreenNoOp] }), noOpPending).ok,
    false,
    'a dead button on the starting screen cannot claim it reached the starting screen',
  );

  recordPrototypeRun(
    pending,
    { steps: [{ type: 'click', node_id: 'send' }] },
    { startScreenId: 'chat', currentScreenId: 'sent', visitedScreens: ['chat', 'sent'] },
  );
  const verified = validate(receipt({ actions: [action] }), pending);
  assert.equal(verified.ok, true);
  assert.deepEqual(verified.actions, [action]);

  const overlayPending = pendingDraft();
  const overlayAction = { screen: 'Chat', label: 'Export', kind: 'verifiable', nodeId: 'export', reaches: 'sent' };
  recordPrototypeRun(
    overlayPending,
    { steps: [{ type: 'click', nodeId: 'export' }] },
    { startScreenId: 'chat', currentScreenId: 'chat', visitedScreens: ['chat'], overlays: ['sent'] },
  );
  assert.equal(validate(receipt({ actions: [overlayAction] }), overlayPending).ok, true, 'OPEN_OVERLAY drawers/modals count as verifiable');

  clearPrototypeRuns(pending);
  assert.equal(validate(receipt({ actions: [action] }), pending).ok, false, 'a later edit invalidates earlier simulations');
});

test('a control that only announces an unavailable feature is reported as not implemented', () => {
  const result = validate(receipt({ actions: [{ screen: 'Chat', label: 'Export', kind: 'not-implemented' }] }));
  assert.equal(result.ok, true);
  assert.deepEqual(result.actions, [{ screen: 'Chat', label: 'Export', kind: 'not-implemented' }]);
  assert.equal(validate(receipt({ actions: undefined })).ok, false, 'actions must be stated, even as an empty list');
  assert.equal(validate(receipt({ actions: [{ screen: 'Chat', label: 'Export', kind: 'works' }] })).ok, false);
});

test('a substantive departure from the confirmed prototype needs the user answer, not a note', () => {
  const pending = () => pendingDraft({ pocScreens: [{ name: 'Chat', screenshots: ['/task/chat-error.png'] }] });
  const screen = (extra) => [{ name: 'Chat', nodeId: 'chat', pocScreenshot: 'chat-error.png', ...extra }];

  const unstated = validate(receipt({ screens: screen({ differences: 'Error state shown without the chat shell.' }) }), pending());
  assert.equal(unstated.ok, false);
  assert.match(unstated.response.diagnostics.join('\n'), /requires deviation/);

  const noteOnly = validate(
    receipt({ screens: screen({ deviation: 'substantive', differences: 'Error state shown without the chat shell.' }) }),
    pending(),
  );
  assert.equal(noteOnly.ok, false);
  assert.match(noteOnly.response.diagnostics.join('\n'), /a note alone does not authorize it/);

  const reusedPriorId = screen({
    deviation: 'substantive',
    differences: 'Error state shown without the chat shell.',
    confirmation: { questionId: 'synapse-design-poc:task-1' },
  });
  assert.equal(
    validate(receipt({ screens: reusedPriorId }), pending(), { approvedQuestionIds: ['synapse-design-poc:task-1'] }).ok,
    false,
    'a prior route or POC question id cannot authorize a substantive deviation',
  );

  const substantive = screen({
    deviation: 'substantive',
    differences: 'Error state shown without the chat shell.',
    confirmation: { questionId: 'synapse-design-deviation:d1:chat' },
  });
  assert.equal(validate(receipt({ screens: substantive }), pending()).ok, false, 'an unanswered question id is not consent');
  assert.equal(
    validate(receipt({ screens: substantive }), pending(), { approvedQuestionIds: [] }).ok,
    false,
    'a rejected deviation question is not in approvedQuestionIds and must not publish',
  );
  const confirmed = validate(receipt({ screens: substantive }), pending(), {
    approvedQuestionIds: ['synapse-design-deviation:d1:chat'],
  });
  assert.equal(confirmed.ok, true);

  assert.equal(validate(receipt({ screens: screen({ deviation: 'none' }) }), pending()).ok, true);
  const minor = validate(
    receipt({ screens: screen({ deviation: 'minor', differences: 'Noto Sans SC replaces the POC system font.' }) }),
    pending(),
  );
  assert.equal(minor.ok, true);

  const omitted = validate(
    receipt({ screens: [{ name: 'Chat', omittedReason: 'Deferred.' }], checks: DIMENSIONS.map((dimension) => ({
      dimension, status: 'unverified', uncovered: 'Screen was not built.',
    })) }),
    pending(),
  );
  assert.equal(omitted.ok, false, 'omitting a confirmed prototype screen is a substantive deviation');
});

test('three invalid receipts halt the turn and the checklist describes the evidence fields', () => {
  const pending = pendingDraft();
  assert.equal(validate({}, pending).response.stage, 'needs_generation');
  validate({}, pending);
  assert.equal(validate({}, pending).response.stage, 'blocked_review_limit');
  const checklist = buildDraftChecklist([{ name: 'Chat' }]);
  assert.match(checklist.reviewFields.checks, /pass \| fail \| unverified \| not-applicable/);
  assert.match(checklist.reviewFields.actions, /verifiable \| visual-only \| not-implemented/);
});

test('non-screenshot methods must be executed on the current version and multi-screen or shared-master edits require coverage', () => {
  const pending = pendingDraft({
    plannedScreens: [{ name: 'Chat' }, { name: 'Sent' }],
    visualReviewStatus: 'unavailable',
    latestRootScreenshot: undefined,
  });
  const layoutClaim = {
    ...receipt({
      screens: [
        { name: 'Chat', nodeId: 'chat' },
        { name: 'Sent', nodeId: 'sent' },
      ],
      checks: DIMENSIONS.map((dimension) => passCheck(dimension, { method: 'layout', nodeIds: ['sidebar', 'sent-title'] })),
    }),
    visual: undefined,
  };
  const unexecuted = validate(layoutClaim, pending);
  assert.equal(unexecuted.ok, false);
  assert.match(unexecuted.response.diagnostics.join('\n'), /no layout inspection was executed on this draft version/);

  recordExecutedInspection(pending, 'inspect:layout');
  const singleScreenOnly = {
    ...layoutClaim,
    checks: DIMENSIONS.map((dimension) => passCheck(dimension, { method: 'layout', nodeIds: ['sidebar'] })),
  };
  const missingSecondScreen = validate(singleScreenOnly, pendingDraft({
    ...pending,
    executedMethods: pending.executedMethods,
  }));
  assert.equal(missingSecondScreen.ok, false);
  assert.match(missingSecondScreen.response.diagnostics.join('\n'), /must cover every built screen \(missing a node inside "sent"\)/);

  assert.equal(validate(layoutClaim, pending).ok, true);

  clearPrototypeRuns(pending);
  assert.equal(validate(layoutClaim, pending).ok, false, 'mutating the draft invalidates earlier executed inspections');

  // Modifying a shared component master after instances already exist requires citing affected instances.
  const modifiedPending = pendingDraft({ plannedScreens: [{ name: 'Chat' }, { name: 'Sent' }] });
  const beforeMasterEdit = JSON.parse(DOCUMENT);
  const afterMasterEdit = structuredClone(beforeMasterEdit);
  afterMasterEdit.children[2].children[0].content = 'Updated Channel';
  recordModifiedMasters(modifiedPending, JSON.stringify(beforeMasterEdit), JSON.stringify(afterMasterEdit));

  const withoutInstance = validate(
    receipt({
      screens: [
        { name: 'Chat', nodeId: 'chat' },
        { name: 'Sent', nodeId: 'sent' },
      ],
      checks: DIMENSIONS.map((dimension) => passCheck(dimension, { nodeIds: ['send', 'sent-title'] })),
    }),
    modifiedPending,
  );
  assert.equal(withoutInstance.ok, false);
  assert.match(withoutInstance.response.diagnostics.join('\n'), /Reusable component "row" was modified.*row-general/);

  const withInstance = validate(
    receipt({
      screens: [
        { name: 'Chat', nodeId: 'chat' },
        { name: 'Sent', nodeId: 'sent' },
      ],
      checks: DIMENSIONS.map((dimension) => passCheck(dimension, { nodeIds: ['row-general', 'sent-title'] })),
    }),
    pendingDraft({ ...modifiedPending, modifiedMasters: modifiedPending.modifiedMasters }),
  );
  assert.equal(withInstance.ok, true);
});

test('multi-node state boards map via nodeIds, duplicate screen names fail loudly, upgrade needs no user approval, and finish without review is non-destructive', () => {
  const pending = pendingDraft({
    plannedScreens: [{ name: 'Chat' }],
    pocScreens: [{ name: 'Chat', screenshots: ['/task/chat.png'] }],
  });

  // Calling finish without review does not increment strikes, does not return path, and preserves state
  const probe = validate(undefined, pending);
  assert.equal(probe.ok, false);
  assert.equal(probe.response.statusOnly, true);
  assert.equal(probe.response.stage, 'needs_review');
  assert.equal(probe.response.path, undefined);
  assert.equal(pending.reviewValidationFailures ?? 0, 0);

  // Duplicate screen names in review.screens fail explicitly instead of silently overwriting
  const duplicateNames = validate(
    receipt({
      screens: [
        { name: 'Chat', nodeId: 'chat', pocScreenshot: 'chat.png', deviation: 'none' },
        { name: 'Chat', nodeId: 'sent', pocScreenshot: 'chat.png', deviation: 'none' },
      ],
    }),
    pendingDraft(pending),
  );
  assert.equal(duplicateNames.ok, false);
  assert.match(duplicateNames.response.diagnostics.join('\n'), /Duplicate name "Chat" in review\.screens/);

  // Same diagnostic class twice flags repeatedDiagnostics and instructs stopping to ask the user
  const repeatPending = pendingDraft(pending);
  const firstFail = validate(receipt({ screens: [] }), repeatPending);
  assert.equal(firstFail.response.repeatedDiagnostics, undefined);
  const secondFail = validate(receipt({ screens: [] }), repeatPending);
  assert.equal(secondFail.response.repeatedDiagnostics, true);
  assert.match(secondFail.response.next, /Stop submitting approximate receipts and ask the user/);
  assert.equal(secondFail.response.path, undefined);

  // Multi-frame state boards (`nodeIds: ['chat', 'sent']`) + `deviation: "upgrade"` succeed without deviation question approval
  const multiFrameUpgrade = validate(
    receipt({
      screens: [{
        name: 'Chat',
        nodeIds: ['chat', 'sent'],
        pocScreenshot: 'chat.png',
        deviation: 'upgrade',
        designUpgrades: [{ what: 'Upgraded message rhythm and per-side hairline dividers', why: 'Establish 3-tier spacing within confirmed scope' }],
      }],
      checks: DIMENSIONS.map((dimension) => passCheck(dimension, { nodeIds: ['send', 'sent-title'] })),
    }),
    pendingDraft(pending),
  );
  assert.equal(multiFrameUpgrade.ok, true);
  assert.equal(multiFrameUpgrade.designUpgrades.length, 1);
  assert.equal(multiFrameUpgrade.designUpgrades[0].screen, 'Chat');
});

