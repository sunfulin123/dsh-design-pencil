/** Grouped interface/state layout survives native engine round trips and continuation. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { HtmlImportSession } from './html-state-import.mjs';
import { EngineSession } from './engine-session.mjs';
import { applyHtmlStatePlan, commitHtmlStateCapture } from './html-state-checkpoint.mjs';

const html = `<!doctype html><html><head><style>body{margin:0;background:#fff;font-family:sans-serif}section{padding:20px}#first{min-height:80px}#second{min-height:120px}.detail{height:320px;background:#eee}</style></head><body><nav><button id="first-tab" role="tab" aria-controls="first" onclick="first.hidden=false;second.hidden=true">First area</button><button id="second-tab" role="tab" aria-controls="second" onclick="first.hidden=true;second.hidden=false">Second area</button></nav><section id="first">First contents<button id="first-open" aria-controls="first-detail" onclick="document.querySelector('#first-detail').hidden=false">View first details</button><div id="first-detail" class="detail" hidden>First details</div></section><section id="second" hidden>Second contents<button id="second-open" aria-controls="second-detail" onclick="document.querySelector('#second-detail').hidden=false">View second details</button><div id="second-detail" class="detail" hidden>Second details</div></section></body></html>`;
const options = { html, viewportWidth: 800, viewportHeight: 600 };

async function captureGroups(t, verifyVisual = false) {
  const session = new HtmlImportSession({ ...options, verifyVisual });
  t.after(() => session.close());
  const analysis = await session.analyze({ signal: t.signal });
  const second = analysis.candidates.find((c) => c.label === 'Second area');
  const base = await session.capture({ maxStates: 1, signal: t.signal });
  const before = await session.capture({
    maxStates: 1,
    states: [{ id: second.id, steps: second.steps, expected: second.expected }],
    signal: t.signal,
  });
  const resumed = new HtmlImportSession({
    ...options,
    checkpoint: before.checkpoint,
    verifyVisual,
  });
  t.after(() => resumed.close());
  const after = await resumed.capture({
    maxStates: 1,
    states: [
      {
        id: 'first-details',
        label: 'First details',
        steps: [
          { type: 'click', selector: '#first-tab' },
          { type: 'click', selector: '#first-open' },
        ],
        expected: '#first-detail',
      },
    ],
    signal: t.signal,
  });
  return { base, before, after, resumed, second };
}

test(
  'business-interface rows and state columns survive resumed native imports',
  { skip: process.env.DSH_E2E_CHROME !== '1', timeout: 90000 },
  async (t) => {
    const { base, before, after, resumed, second } = await captureGroups(t);
    const initial = after.boards.find((b) => b.id === 'base');
    const detail = after.boards.find((b) => b.id === 'first-details');
    const secondary = after.boards.find((b) => b.id === second.id);
    assert.equal(initial.groupId, 'base');
    assert.equal(detail.groupId, initial.groupId);
    assert.notEqual(secondary.groupId, initial.groupId);
    assert.equal(detail.sourceRelation.parentBoardId, initial.rootId);
    const root = (result, board) => result.document.children.find((n) => n.id === board.rootId);
    assert.equal(root(after, detail).y, root(after, initial).y);
    assert.ok(root(after, detail).x >= root(after, initial).x + root(after, initial).width + 200);
    assert.ok(
      root(after, secondary).y >=
        Math.max(root(after, detail).height, root(after, initial).height) + 200,
    );
    assert.ok(
      root(after, secondary).y > root(before, secondary).y,
      'a taller state grows its group row',
    );
    const engine = new EngineSession(JSON.parse(JSON.stringify(after.document)));
    t.after(() => engine.close());
    assert.deepEqual(
      engine.snapshot().document.editorMeta.htmlImport,
      after.document.editorMeta.htmlImport,
    );
    const later = await resumed.capture({
      maxStates: 1,
      states: [
        {
          id: 'second-details',
          steps: [...second.steps, { type: 'click', selector: '#second-open' }],
          expected: '#second-detail',
        },
      ],
      signal: t.signal,
    });
    assert.equal(later.boards.find((b) => b.id === 'second-details').groupId, secondary.groupId);
    assert.equal(root(later, secondary).y, root(after, secondary).y);
    assert.equal(later.document.editorMeta.htmlImport.groups.length, 2);
    const retried = await resumed.capture({
      maxStates: 1,
      states: [{ id: 'first-details', steps: [...second.steps], expected: '#second' }],
      signal: t.signal,
    });
    assert.equal(
      retried.boards.find((b) => b.id === 'first-details').groupId,
      initial.groupId,
      'same-state retries retain interface membership',
    );
    assert.equal(retried.document.children.length, later.document.children.length);
    assert.equal(base.boards.length, 1);
  },
);

test(
  'grouped state roots retain actual CanvasKit visual verification',
  { skip: process.env.DSH_E2E_CHROME !== '1', timeout: 90000 },
  async (t) => {
    const { after } = await captureGroups(t, true);
    assert.ok(after.boards.length >= 3);
    assert.ok(
      after.boards.every((b) => b.visual.status === 'verified'),
      JSON.stringify(after.boards.map((b) => ({ label: b.label, visual: b.visual }))),
    );
  },
);

test('action property order preserves valid plans and contextual group inheritance', () => {
  const base = { id: 'base', label: 'Base', kind: 'page', status: 'captured', steps: [] };
  const queue = {
    id: 'queue',
    label: 'Queue',
    kind: 'tab',
    status: 'captured',
    steps: [{ type: 'click', selector: '#queue' }],
  };
  const overlay = {
    id: 'details',
    label: 'Details',
    kind: 'planned',
    status: 'pending',
    steps: [
      { selector: '#queue', type: 'click' },
      { selector: '#open', type: 'click' },
    ],
  };
  const state = {
    candidates: [base, queue, overlay],
    boards: [],
    warnings: [],
    document: { children: [] },
  };
  const root = (id) => ({ id, type: 'frame', width: 300, height: 100 });
  for (const candidate of [base, queue]) {
    const id = candidate.id + '-root';
    commitHtmlStateCapture(
      state,
      candidate,
      { id: candidate.id, rootId: id, label: candidate.label, warnings: [] },
      { ...state.document, children: [...state.document.children, root(id)] },
      1,
    );
  }
  applyHtmlStatePlan(state, [{ id: 'queue', steps: [{ selector: '#queue', type: 'click' }] }]);
  assert.equal(queue.status, 'captured', 'property order must not schedule a recapture');
  commitHtmlStateCapture(
    state,
    overlay,
    { id: 'details', rootId: 'detail-root', label: 'Details', warnings: [] },
    { ...state.document, children: [...state.document.children, root('detail-root')] },
    1,
  );
  assert.equal(state.boards.find((b) => b.id === 'details').groupId, 'queue');
  assert.equal(
    state.boards.find((b) => b.id === 'details').sourceRelation.parentBoardId,
    'queue-root',
  );
});
