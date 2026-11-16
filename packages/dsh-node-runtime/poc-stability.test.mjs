import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normalizeCapturePlan, runPocCapturePlan } from '../../crates/op-ai-skills/skills/synapse-design-html/scripts/poc-browser-runner.mjs';

test('capture plans validate stable waits without changing ordinary visible waits', () => {
  const plan = stable => normalizeCapturePlan({ sessions: [{ name: 'panel', width: 1440, height: 900,
    steps: [{ action: 'waitFor', selector: '#panel', stable }] }] }, 'http://127.0.0.1:4173');
  assert.equal(plan(true).sessions[0].steps[0].stable, true);
  assert.throws(() => plan('true'), /stable.*boolean/);
});

test('stable capture waits for ancestor transitions in a frame and ignores infinite pulse animations',
  { skip: process.env.DSH_E2E_CHROME !== '1', timeout: 30000 }, async t => {
    const root = await mkdtemp(join(tmpdir(), 'poc-stable-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    await writeFile(join(root, 'child.html'), `<!doctype html><style>
      #panel { padding:20px; background: white; transform:translateX(250px); transition:transform .8s }
      @keyframes pulse { to { opacity:.5 } } #pulse { animation:pulse .4s infinite alternate }
      .hidden-select { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap }
      select {border:1px solid; background:white}
      </style><button id="open">Open</button><section id="panel"><div id="target">Details</div><i id="pulse">live</i></section>
      <div class="hidden-select"><select><option>Hidden helper</option></select></div>
      <select id="visible"><option>Visible native defect</option></select><output id="status">moving</output>
      <script>document.querySelector('#open').onclick=()=>{document.querySelector('#panel').style.transform='none'};
      document.querySelector('#panel').ontransitionend=()=>document.querySelector('#status').textContent='done';</script>`);
    await writeFile(join(root, 'index.html'), '<iframe id="app" src="child.html" style="width:900px;height:600px"></iframe>');
    const { startStaticServer } = await import('../../crates/op-ai-skills/skills/synapse-design-html/scripts/poc-preview-server.mjs');
    const server = await startStaticServer(root, 'index.html');
    t.after(() => new Promise(resolve => server.server.close(resolve)));
    const result = await runPocCapturePlan({ ...normalizeCapturePlan({ sessions: [{ name: 'panel', width: 1440, height: 900,
      steps: [{ action: 'click', frame: '#app', selector: '#open' },
        { action: 'waitFor', frame: '#app', selector: '#target', stable: true },
        { action: 'assertText', frame: '#app', selector: '#status', equals: 'done' },
        { action: 'screenshot', out: 'panel.png' }] }] }, server.url),
      baseDir: root, timeoutMs: 20000, inspect: true, surfaceScope: 'app' });
    assert.equal(result.screenshots.length, 1);
    const issues = result.inspections.flatMap(value => value.findings).filter(item => item.rule === 'dropdown-chevron-inset');
    assert.equal(issues.length, 1);
    assert.match(issues[0].message, /#visible/);
    assert.doesNotMatch(issues[0].message, /select:nth/);
  });

test('repeated findings deduplicate only the same rule, target, viewport and observation', async () => {
  const { deduplicateSurfaceFindings, surfaceFindings } = await import('../../crates/op-ai-skills/skills/synapse-design-html/scripts/poc-surface-inspection.mjs');
  const item = { severity: 'P1', category: 'craft-floor', rule: 'dropdown-chevron-inset', location: 'main / iframe#app', message: '#agent native arrow' };
  const differentTarget = { ...item, message: '#queue native arrow' };
  const differentViewport = { ...item, location: 'phone / iframe#app' };
  assert.deepEqual(deduplicateSurfaceFindings([item, item, differentTarget, differentViewport]), [item, differentTarget, differentViewport]);
  const geometry = { selectChevronIssues: ['#agent native arrow'] };
  const captures = [1280, 1440].flatMap(width => surfaceFindings(geometry, { label: 'same-session', width, height: 900 }, 'app'));
  assert.equal(deduplicateSurfaceFindings(captures).length, 2);
});
