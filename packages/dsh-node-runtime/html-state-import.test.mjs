import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { HtmlImportSession, validateHtmlStatePlan } from './html-state-import.mjs';
import { htmlStateResult } from './html-state-report.mjs';
test('structured plans reject evaluated scripts', () => {
  assert.throws(
    () => validateHtmlStatePlan([{ id: 'x', steps: [{ type: 'evaluate', value: 'window.x=1' }] }]),
    /Unsupported/,
  );
});
test(
  'tab states append into one resumable document',
  { skip: process.env.DSH_E2E_CHROME !== '1' },
  async (t) => {
    const dir = await mkdtemp(join(tmpdir(), 'state-import-'));
    t.after(() => rm(dir, { recursive: true, force: true }));
    const path = join(dir, 'source.html');
    await writeFile(
      path,
      '<!doctype html><html><body><button role="tab" aria-controls="one" onclick="one.hidden=false;two.hidden=true">First</button><button role="tab" aria-controls="two" onclick="one.hidden=true;two.hidden=false">Second</button><section id="one">First contents</section><section id="two" hidden>Second contents</section></body></html>',
    );
    const session = new HtmlImportSession({ htmlPath: path });
    const analysis = await session.analyze();
    assert.equal(analysis.candidates.length, 3);
    const first = await session.capture({ maxStates: 1 });
    assert.equal(first.boards.length, 1);
    session.close();
    const resumed = new HtmlImportSession({ htmlPath: path, checkpoint: first.checkpoint });
    t.after(() => resumed.close());
    const result = await resumed.capture();
    assert.equal(result.boards.length, 2);
    assert.equal(new Set(result.boards.map((b) => b.rootId)).size, 2);
    assert.equal(result.coverage.visualComplete, false);
    assert.match(JSON.stringify(result.document), /Second contents/);
    await writeFile(path, 'changed');
    await assert.rejects(resumed.analyze(), /changed/);
  },
);
test(
  'ordinary standalone conversion discovers hidden tab content',
  { skip: process.env.DSH_E2E_CHROME !== '1' },
  async () => {
    const { convertHtmlToDocument } = await import('./html-import.mjs');
    const result = await convertHtmlToDocument({
      html: '<!doctype html><html><body><button role="tab" aria-controls="b" onclick="document.getElementById(\'b\').hidden=false">Other</button><div>Home</div><section id="b" hidden>Hidden destination</section></body></html>',
    });
    assert.ok(result.boards?.length >= 2);
    assert.match(JSON.stringify(result.document), /Hidden destination/);
  },
);

test(
  'dynamic nested controls, overlays and unknown hidden UI preserve coverage evidence',
  { skip: process.env.DSH_E2E_CHROME !== '1' },
  async (t) => {
    const session = new HtmlImportSession({
      html: '<!doctype html><html><body><button onclick="document.getElementById(\'dynamic\').innerHTML=\'<button role=tab aria-controls=inside onclick=inside.hidden=false>Nested</button><section id=inside hidden>Nested content</section>\'">Open details</button><div id="dynamic"></div><div hidden id="unexplained">Unknown workflow</div><button onclick="fetch(location.href,{method:\'POST\'});this.textContent=\'Attempted\'">View summary</button></body></html>',
    });
    t.after(() => session.close());
    let result = await session.capture();
    while (!result.done) result = await session.capture();
    assert.match(JSON.stringify(result.document), /Nested content/);
    assert.ok(result.coverage.states.some((s) => s.kind === 'hidden' && s.status === 'pending'));
    assert.equal(result.coverage.complete, false);
    assert.match(result.warnings.join('\n'), /blocked/);
    const ids = [];
    const walk = (nodes) => {
      for (const n of nodes || []) {
        ids.push(n.id);
        walk(n.children);
      }
    };
    walk(result.document.children);
    assert.equal(new Set(ids).size, ids.length);
  },
);

test(
  'representative select prerequisites use UI events and support same-document continuation',
  { skip: process.env.DSH_E2E_CHROME !== '1' },
  async (t) => {
    const session = new HtmlImportSession({
      html: '<!doctype html><html><body><select id="pick" onchange="out.textContent=this.value?\'Populated comparison\':\'No selection\'"><option value="">None</option><option value="one">One</option></select><section id="out">No selection</section></body></html>',
    });
    t.after(() => session.close());
    const first = await session.capture({ maxStates: 1 });
    const result = await session.capture({
      states: [
        {
          id: 'filled',
          label: 'Selected data',
          steps: [{ type: 'select', selector: '#pick', value: 'one' }],
          expected: '#out',
        },
      ],
    });
    assert.equal(first.boards.length, 1);
    assert.equal(result.boards.length, 2);
    assert.match(JSON.stringify(result.document), /Populated comparison/);
    assert.ok(result.coverage.pendingCount > 0, 'unreviewed select combinations remain explicit');
  },
);

test(
  'budget exhaustion, cancellation and hidden exclusions do not fabricate completion',
  { skip: process.env.DSH_E2E_CHROME !== '1' },
  async (t) => {
    const session = new HtmlImportSession({
      html: '<!doctype html><html><body><p>Base</p><aside hidden id="unused">Hidden</aside></body></html>',
    });
    t.after(() => session.close());
    await session.analyze();
    const checkpoint = session.checkpoint();
    checkpoint.actions = 120;
    const exhausted = new HtmlImportSession({
      html: '<!doctype html><html><body><p>Base</p><aside hidden id="unused">Hidden</aside></body></html>',
      checkpoint,
    });
    t.after(() => exhausted.close());
    const result = await exhausted.capture();
    assert.equal(result.done, true);
    assert.equal(result.boards.length, 0);
    assert.equal(result.coverage.complete, false);
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(session.capture({ signal: controller.signal }), /abort/i);
  },
);

test(
  'dialog, drawer and hover menu are captured with their page context',
  { skip: process.env.DSH_E2E_CHROME !== '1' },
  async (t) => {
    const session = new HtmlImportSession({
      html: '<!doctype html><html><head><style>.menu .popup{display:none}.menu:hover .popup{display:block}</style></head><body><h1>Context title</h1><button aria-controls="dialog" onclick="dialog.hidden=false">View dialog</button><div role="dialog" id="dialog" hidden>Dialog content</div><button aria-controls="drawer" onclick="drawer.hidden=false">View drawer</button><aside id="drawer" hidden>Drawer content</aside><div class="menu"><button aria-haspopup="menu">Menu</button><div class="popup">Menu content</div></div></body></html>',
    });
    t.after(() => session.close());
    let result = await session.capture();
    while (!result.done) result = await session.capture();
    const text = JSON.stringify(result.document);
    assert.match(text, /Dialog content/);
    assert.match(text, /Drawer content/);
    assert.match(text, /Menu content/);
    assert.ok(
      result.boards.every((board) => board.evidence.pageText.includes('Context title')),
      'overlays preserve context',
    );
  },
);

test('no-browser imports retain a single partial static fallback', async (t) => {
  const before = process.env.OPENPENCIL_DISABLE_HEADLESS_BROWSER;
  process.env.OPENPENCIL_DISABLE_HEADLESS_BROWSER = '1';
  t.after(() => {
    if (before === undefined) delete process.env.OPENPENCIL_DISABLE_HEADLESS_BROWSER;
    else process.env.OPENPENCIL_DISABLE_HEADLESS_BROWSER = before;
  });
  const session = new HtmlImportSession({ html: '<html><body><p>Fallback</p></body></html>' });
  t.after(() => session.close());
  const result = await session.capture();
  assert.equal(result.renderMode, 'static-css');
  assert.equal(result.boards.length, 1);
  assert.equal(result.coverage.complete, false);
  assert.equal(result.done, true);
});

test(
  'internal scrolling remains a coverage limitation rather than flattening the UI',
  { skip: process.env.DSH_E2E_CHROME !== '1' },
  async (t) => {
    const session = new HtmlImportSession({
      html: '<!doctype html><html><body><div style="height:60px;overflow:auto"><div style="height:1000px">Scrollable records</div></div></body></html>',
    });
    t.after(() => session.close());
    const result = await session.capture();
    assert.equal(result.boards.length, 1);
    assert.equal(result.coverage.complete, false);
    assert.match(result.warnings.join('\n'), /Internal scroll/);
  },
);

test(
  'graphics carry root-relative bounds for localized rendering checks',
  { skip: process.env.DSH_E2E_CHROME !== '1' },
  async (t) => {
    const s = new HtmlImportSession({
      html: '<!doctype html><html><body><svg width="200" height="100"><rect width="200" height="100" fill="red"/></svg></body></html>',
    });
    t.after(() => s.close());
    const r = await s.capture();
    assert.equal(r.boards[0].evidence.chartCandidates[0].rect.width, 200);
    assert.equal(r.boards[0].evidence.chartCandidates[0].rect.height, 100);
    assert.equal(r.boards[0].sourceScreenshot.fullBoard, true);
  },
);

test(
  'CSS-only state changes remain distinct boards',
  { skip: process.env.DSH_E2E_CHROME !== '1' },
  async (t) => {
    const session = new HtmlImportSession({
      html: `<html><body><button aria-controls="area" onclick="document.querySelector('#area').style.background='green'">View color</button><div id="area" style="background:red;width:200px;height:100px">Same content</div></body></html>`,
    });
    t.after(() => session.close());
    let result = await session.capture();
    while (!result.done) result = await session.capture();
    assert.equal(result.boards.length, 2);
    assert.notEqual(
      result.boards[0].sourceScreenshot.sha256,
      result.boards[1].sourceScreenshot.sha256,
    );
  },
);

test(
  'structured root scroll survives post-action settling',
  { skip: process.env.DSH_E2E_CHROME !== '1' },
  async (t) => {
    const session = new HtmlImportSession({
      html: '<html><body style="height:2500px"><p>Long page</p></body></html>',
    });
    t.after(() => session.close());
    const result = await session.capture({
      maxStates: 1,
      states: [{ id: 'scrolled', steps: [{ type: 'scroll', y: 1000 }] }],
    });
    assert.equal(result.boards[0].evidence.viewport.scrollY, 1000);
  },
);

test(
  'structured selector wait supports delayed visible controls',
  { skip: process.env.DSH_E2E_CHROME !== '1' },
  async (t) => {
    const session = new HtmlImportSession({
      html: `<html><body><button id="open" onclick="setTimeout(()=>document.querySelector('#late').hidden=false,450)">Open details</button><button id="late" hidden onclick="document.querySelector('#result').hidden=false">View result</button><div id="result" hidden>Delayed result</div></body></html>`,
    });
    t.after(() => session.close());
    const result = await session.capture({
      maxStates: 1,
      states: [
        {
          id: 'delayed',
          expected: '#result',
          steps: [
            { type: 'click', selector: '#open' },
            { type: 'wait', selector: '#late' },
            { type: 'click', selector: '#late' },
          ],
        },
      ],
    });
    assert.equal(result.boards.length, 1);
    assert.match(result.boards[0].evidence.pageText, /Delayed result/);
  },
);

test(
  'shared action IDs retain separate observed navigation contexts',
  { skip: process.env.DSH_E2E_CHROME !== '1' },
  async (t) => {
    const session = new HtmlImportSession({
      html: `<html><body><button role="tab" aria-controls="main" onclick="switchPage('One')">One</button><button role="tab" aria-controls="main" onclick="switchPage('Two')">Two</button><main id="main"></main><script>function switchPage(name){document.querySelector('main').innerHTML='<h1>'+name+'</h1><button id="details" aria-controls="detail">View details</button><div id="detail" hidden>'+name+' detail</div>';document.querySelector('#details').onclick=()=>document.querySelector('#detail').hidden=false}switchPage('One')</script></body></html>`,
    });
    t.after(() => session.close());
    let result = await session.capture();
    while (!result.done) result = await session.capture();
    assert.ok(result.boards.some((b) => b.evidence.pageText.includes('One detail')));
    assert.ok(result.boards.some((b) => b.evidence.pageText.includes('Two detail')));
  },
);

test(
  'empty layout mounts are not unexplained hidden interfaces',
  { skip: process.env.DSH_E2E_CHROME !== '1' },
  async (t) => {
    const session = new HtmlImportSession({
      html: '<html><body><h1>Simple page</h1><div id="output"></div></body></html>',
    });
    t.after(() => session.close());
    const result = await session.capture();
    assert.equal(result.coverage.pendingCount, 0);
  },
);

test('known unresolved resource failures block coverage and visual approval', () => {
  for (const warning of [
    'Font download failed: offline',
    'Page font Custom 400 was rejected: invalid',
    'Page font Custom 400 could not be loaded: denied',
    'Linked font stylesheet could not be loaded: denied',
    'Linked font stylesheet discovery reached its 8-sheet limit',
  ]) {
    const result = htmlStateResult(
      {
        candidates: [{ status: 'captured' }],
        warnings: [warning],
        boards: [{ structure: { status: 'verified' }, visual: { status: 'verified' } }],
        document: { children: [] },
      },
      {},
    );
    assert.equal(result.coverage.complete, false, warning);
    assert.equal(result.verification.visualComplete, false, warning);
    assert.ok(result.coverage.limitations.includes(warning));
  }
});

test(
  'retrying one invalid captured state replaces its board and remains idempotent',
  {
    skip: process.env.DSH_E2E_CHROME !== '1',
  },
  async (t) => {
    const html = `<html><body><button id="one" onclick="document.querySelector('#content').textContent='First result'">Alpha</button><button id="two" onclick="document.querySelector('#content').textContent='Corrected result'">Beta</button><p id="content">Initial</p></body></html>`;
    const session = new HtmlImportSession({ html });
    t.after(() => session.close());
    const first = await session.capture({
      maxStates: 1,
      states: [{ id: 'base', steps: [{ type: 'click', selector: '#one' }], expected: '#content' }],
    });
    const checkpoint = first.checkpoint;
    checkpoint.boards[0].structure = { status: 'unverified' };
    checkpoint.boards[0].warnings = ['Font download failed: temporary offline'];
    checkpoint.warnings.push('Font download failed: temporary offline');
    checkpoint.evidenceBytes = 32 * 1024 * 1024;
    checkpoint.boards[0].evidenceBytes = 20 * 1024 * 1024;
    const resumed = new HtmlImportSession({ html, checkpoint });
    t.after(() => resumed.close());
    const plan = [
      { id: 'base', steps: [{ type: 'click', selector: '#two' }], expected: '#content' },
    ];
    const failed = await resumed.capture({
      maxStates: 1,
      states: [
        { id: 'base', steps: [{ type: 'click', selector: '#not-present' }], expected: '#content' },
      ],
    });
    assert.equal(failed.boards.length, 1, 'failed retries retain the last captured board');
    assert.equal(failed.boards[0].rootId, first.boards[0].rootId);
    const corrected = await resumed.capture({ maxStates: 1, states: plan });
    assert.equal(corrected.boards.length, 1);
    assert.equal(corrected.document.children.length, 1);
    assert.match(corrected.boards[0].evidence.pageText, /Corrected result/);
    assert.equal(
      corrected.coverage.limitations.some((w) => /temporary offline/.test(w)),
      false,
    );
    const repeated = await resumed.capture({ maxStates: 1, states: plan });
    assert.equal(repeated.boards.length, 1);
    assert.equal(repeated.boards[0].rootId, corrected.boards[0].rootId);
  },
);

test('excluding every candidate cannot complete an empty design', () => {
  const result = htmlStateResult(
    {
      candidates: [{ status: 'excluded', reason: 'No safe activation' }],
      warnings: [],
      boards: [],
      document: { children: [] },
    },
    {},
  );
  assert.equal(result.coverage.complete, false);
  assert.equal(result.verification.visualComplete, false);
});

test(
  'native state imports retain first and later board color variables without rebinding',
  { skip: process.env.DSH_E2E_CHROME !== '1' },
  async (t) => {
    const session = new HtmlImportSession({
      html: '<html><body style="margin:0;background:#ff0000;color:#ffffff"><button id="blue" role="tab" onclick="document.body.style.background=\'#0000ff\'">Blue</button><p>Repeated text</p><p>Repeated text</p></body></html>',
    });
    t.after(() => session.close());
    const first = await session.capture({ maxStates: 1 });
    assert.ok(Object.keys(first.document.variables || {}).length >= 2);
    const prior = JSON.parse(JSON.stringify(first.document.variables));
    const second = await session.capture({
      maxStates: 1,
      states: [{ id: 'blue-state', steps: [{ type: 'click', selector: '#blue' }] }],
    });
    for (const [name, value] of Object.entries(prior))
      assert.deepEqual(
        second.document.variables[name],
        value,
        'existing variable names retain their original values',
      );
    const values = Object.values(second.document.variables).map((v) => v.value);
    assert.ok(values.includes('#ff0000'));
    assert.ok(values.includes('#0000ff'));
    assert.equal(second.boards.length, 2);
  },
);
