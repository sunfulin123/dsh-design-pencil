import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FINALIZATION_NOTE,
  NEXT,
  STAGE_PROMPT_MODE,
  TOOL_TEXT,
  WORKFLOW_TEXT_VERSION,
  publicationReport,
} from './design-workflow-text.mjs';

function leafStrings(value) {
  if (typeof value === 'string') return [value];
  if (typeof value !== 'object' || value === null) return [];
  return Object.values(value).flatMap(leafStrings);
}

test('every workflow tool has a description and no empty parameter text', () => {
  assert.equal(WORKFLOW_TEXT_VERSION, 1);
  for (const [tool, text] of Object.entries(TOOL_TEXT)) {
    assert.ok(text.description.length > 20, `${tool} description`);
    for (const value of leafStrings(text.parameters ?? {})) assert.ok(value.trim().length > 0, tool);
  }
  assert.match(TOOL_TEXT.finish.parameters.review, /pass \| fail \| unverified \| not-applicable/);
  assert.match(TOOL_TEXT.finish.parameters.review, /verifiable \| visual-only \| not-implemented/);
});

test('step instructions carry the current step, not the whole guide', () => {
  const fixed = Object.values(NEXT).filter((value) => typeof value === 'string');
  const built = [
    NEXT.discoveryNeedsRoute('task-1'),
    NEXT.batchStep({ layoutIssueCount: 2, remainingScreens: ['Settings'] }),
    NEXT.batchStep({ layoutIssueCount: 0, remainingScreens: [] }),
    NEXT.inspectScreenshot({ path: '/tmp/a.png', rootScreenshot: true, matchesFinalization: true }),
    NEXT.refinalizeAfterConcurrentChange(4),
    NEXT.refinalizeAfterDrift({ version: 3, documentSha256: 'abc' }),
    NEXT.pocRecorded('task-1'),
    NEXT.pocRecorded({ taskId: 'task-1', entry: '/w/index.html' }),
    ...Object.values(FINALIZATION_NOTE).map((value) => (typeof value === 'function' ? value({ beforeVersion: 1, version: 2 }) : value)),
  ];
  for (const text of [...fixed, ...built]) {
    assert.ok(text.length > 0 && text.length < 900, text.slice(0, 60));
    assert.doesNotMatch(text, /undefined|\[object Object\]/);
  }
  assert.doesNotMatch(NEXT.pocRecorded({ taskId: 'task-1', entry: '/w/index.html' }), /<screenshot\.png>/);
  assert.match(NEXT.pocRecorded({ taskId: 'task-1', entry: '/w/index.html' }), /unverified/);
  assert.match(NEXT.batchStep({ layoutIssueCount: 1, remainingScreens: [] }), /1 reported layout issue before/);
  assert.match(NEXT.batchStep({ layoutIssueCount: 0, remainingScreens: [] }), /present and visible before adjusting its spacing/);
  assert.match(NEXT.inspectScreenshot({ path: '/tmp/a.png', rootScreenshot: false, matchesFinalization: false }), /not a completed review/);
  assert.match(NEXT.visualReviewUnavailable, /unverified/);
  assert.match(NEXT.pocResolved, /ask the user before building it/);
  assert.deepEqual(STAGE_PROMPT_MODE, { styleResolved: 'plan', draftBegun: 'build', draftResumed: 'build' });
});

test('a publication report keeps saved, verified and delivered capability apart', () => {
  const clean = publicationReport({ path: '/w/a.op', visualVerification: 'image_provided' });
  assert.match(clean.note, /changes are applied and the file is saved/);
  assert.match(clean.note, /not a production implementation/);
  assert.equal('unverifiedChecks' in clean, false);
  assert.equal('actions' in clean, false);

  const honest = publicationReport({
    path: '/w/a.op',
    visualVerification: 'unavailable',
    unverifiedChecks: [{ dimension: 'style_consistency', uncovered: 'font not compared' }],
    actions: [
      { screen: 'Chat', label: 'Send', kind: 'verifiable' },
      { screen: 'Chat', label: 'Export', kind: 'not-implemented' },
    ],
    omittedScreens: [{ name: 'Settings', reason: 'deferred' }],
  });
  assert.match(honest.note, /visual verification was not performed/);
  assert.match(honest.note, /unverified: style_consistency \(font not compared\)/);
  assert.match(honest.note, /1 action produced an observed result, 0 actions are drawn only, and 1 action is not implemented/);
  assert.match(honest.note, /omitted: Settings/);
  assert.equal(honest.actions['not-implemented'][0].label, 'Export');
  assert.equal(honest.unverifiedChecks.length, 1);
});

test('live tool wording and the loadable guidance sections are defined by the runtime', async () => {
  const { ALLOWED_PROMPT_SECTIONS, LIVE_NOTE, LIVE_TOOL_TEXT, LIVE_TOOL_TEXT_VERSION } = await import('./design-tool-text.mjs');
  assert.equal(LIVE_TOOL_TEXT_VERSION, WORKFLOW_TEXT_VERSION);
  assert.deepEqual(Object.keys(LIVE_TOOL_TEXT), ['selection', 'create', 'edit', 'new', 'import', 'render', 'codeContext', 'search', 'call']);
  for (const [tool, text] of Object.entries(LIVE_TOOL_TEXT)) {
    assert.ok(text.description.length > 20, `${tool} description`);
    for (const value of leafStrings(text.parameters ?? {})) assert.ok(value.trim().length > 0, tool);
  }
  // Every section the skill tells the model to load must be loadable.
  for (const section of ['op-design-build', 'op-design-review', 'op-design-judgement', 'op-design-craft', 'op-design-feedback']) {
    assert.ok(ALLOWED_PROMPT_SECTIONS.includes(section), section);
  }
  assert.match(LIVE_NOTE.createdDocument('/w/a.op'), /visual verification was not performed/);
  assert.equal(LIVE_NOTE.renderedDocument({ input: 'a.op', renderer: 'canvaskit', fidelity: 'exact' }), 'Rendered a.op with canvaskit (exact)');
});
