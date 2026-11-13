import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, realpathSync } from 'node:fs'
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const scripts = new URL('../../crates/op-ai-skills/skills/synapse-design-html/scripts/', import.meta.url)
function run(script, args, cwd, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [fileURLToPath(new URL(script, scripts)), ...args], {
      cwd, env: { ...process.env, SYNAPSE_DESIGN_TASK_DIR: cwd, ...extraEnv }, stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''; let stderr = ''
    child.stdout.setEncoding('utf8').on('data', value => { stdout += value })
    child.stderr.setEncoding('utf8').on('data', value => { stderr += value })
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('Browser verification timed out')) }, 60_000)
    child.on('error', error => { clearTimeout(timer); reject(error) })
    child.on('close', code => { clearTimeout(timer); resolve({ code, stdout, stderr }) })
  })
}

test('HTML verifier captures real Chromium evidence and leaves visual review pending',
  { skip: process.env.DSH_E2E_CHROME !== '1', timeout: 70_000 }, async context => {
    const root = await mkdtemp(join(tmpdir(), 'synapse-html-browser-'))
    context.after(() => rm(root, { recursive: true, force: true }))
    const guide = '# Selected style\nNeutral background and readable content.\n'
    await writeFile(join(root, 'DESIGN.md'), guide)
    await writeFile(join(root, 'index.html'), '<!doctype html><html lang="en"><head><title>Chat</title><meta name="viewport" content="width=device-width"><style>body{margin:0;font:16px system-ui}main{padding:24px}button{padding:12px}</style></head><body><main><h1>Support chat</h1><button>Send message</button></main></body></html>')
    const hash = createHash('sha256').update(guide).digest('hex')
    const style = await run('resolve-theme.mjs', ['--style-id', 'test-style', '--design-md', join(root, 'DESIGN.md'), '--sha256', hash, '--out', root], root)
    assert.equal(style.code, 0, style.stderr)
    const result = await run('verify-surface.mjs', ['--url', join(root, 'index.html'), '--source', root, '--out', root, '--quick'], root)
    assert.equal(result.code, 1, result.stderr)
    const report = JSON.parse(await readFile(join(root, 'evidence-report.json'), 'utf8'))
    assert.equal(report.visualReview.status, 'pending')
    assert.equal(report.accessibility.status, 'pending')
    assert.equal(report.renderedEvidence.length, 2, result.stderr)
    for (const item of report.renderedEvidence) {
      assert.equal(item.status, 'captured')
      assert.equal(item.renderer, 'Chromium')
      assert.ok(item.width > 0 && item.height > 0)
      const image = await readFile(join(root, item.artifact))
      assert.equal(image.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
      assert.equal(createHash('sha256').update(image).digest('hex'), item.sha256)
    }
    await writeFile(join(root, 'index.html'), '<html><body>changed</body></html>')
    const stale = await run('verify-surface.mjs', ['--check-evidence', join(root, 'evidence-report.json')], root)
    assert.equal(stale.code, 1)
    assert.match(stale.stderr, /source changed/i)
  })

test('HTML POC capture works from the core skill source directory',
  { skip: process.env.DSH_E2E_CHROME !== '1', timeout: 70_000 }, async context => {
    const root = await mkdtemp(join(tmpdir(), 'synapse-source-capture-'))
    context.after(() => rm(root, { recursive: true, force: true }))
    const page = join(root, 'index.html')
    const output = join(root, 'capture.png')
    await writeFile(page, '<!doctype html><title>Capture</title><h1>Source skill POC</h1>')
    const result = await run('capture-poc.mjs', ['--url', page, '--out', output, '--width', '800', '--height', '600'], root)
    assert.equal(result.code, 0, result.stderr)
    const metadata = JSON.parse(result.stdout)
    assert.equal(metadata.renderer, 'Chromium')
    assert.equal((await readFile(output)).subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  })

test('capture-poc enforces --timeout-ms, reports stage + Chrome stderr diagnostics, and supports --allow-unverified on browser failure', async context => {
  const root = await mkdtemp(join(tmpdir(), 'synapse-capture-timeout-'))
  context.after(() => rm(root, { recursive: true, force: true }))
  const page = join(root, 'index.html')
  await writeFile(page, '<!doctype html><title>Timeout</title><h1>Test</h1>')

  const hangChrome = join(root, 'hang-chrome.sh')
  await writeFile(
    hangChrome,
    '#!/bin/sh\n[ "$1" = "--warmup" ] && exit 0\necho "[chrome] GPU channel stalled" >&2\nexec sleep 30\n',
  )
  await chmod(hangChrome, 0o755)
  spawnSync(hangChrome, ['--warmup'])

  const startedAt = Date.now()
  const failed = await run(
    'capture-poc.mjs',
    ['--url', page, '--out', join(root, 'out.png'), '--timeout-ms', '700'],
    root,
    { OPENPENCIL_CHROME_PATH: hangChrome },
  )
  const elapsedMs = Date.now() - startedAt
  assert.equal(failed.code, 1)
  assert.ok(elapsedMs < 4000, `expected bounded timeout < 4000ms, got ${elapsedMs}ms`)
  assert.match(failed.stderr, /launch/)
  assert.match(failed.stderr, /GPU channel stalled/)

  const degraded = await run(
    'capture-poc.mjs',
    ['--url', page, '--out', join(root, 'out.png'), '--timeout-ms', '700', '--allow-unverified'],
    root,
    { OPENPENCIL_CHROME_PATH: hangChrome },
  )
  assert.equal(degraded.code, 0, degraded.stderr)
  const degradedJson = JSON.parse(degraded.stdout)
  assert.equal(degradedJson.status, 'unverified')
  assert.equal(degradedJson.renderer, 'unavailable')
  assert.match(degradedJson.uncovered, /GPU channel stalled/)

  const badPlan = join(root, 'bad-steps.json')
  await writeFile(badPlan, JSON.stringify({
    sessions: [{ width: 1440, height: 900, steps: [{ action: 'eval', code: 'window.x=1' }] }],
  }))
  const rejected = await run(
    'capture-poc.mjs',
    ['--url', page, '--steps', badPlan, '--allow-unverified'],
    root,
  )
  assert.equal(rejected.code, 1, '--allow-unverified must not mask invalid step schemas')
})

test('capture-poc --steps runs multi-viewport interactive verification in a single Chromium launch',
  { skip: process.env.DSH_E2E_CHROME !== '1', timeout: 70_000 }, async context => {
    const root = await mkdtemp(join(tmpdir(), 'synapse-steps-capture-'))
    context.after(() => rm(root, { recursive: true, force: true }))
    const page = join(root, 'index.html')
    await writeFile(
      page,
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin: 0; font: 16px system-ui; display: flex; height: 100vh; }
  .sidebar { width: 320px; padding: 16px; border-right: 1px solid #ccc; }
  .workspace { flex: 1; padding: 16px; }
  input:focus, button:focus, select:focus { outline: 2px solid #0055ff; outline-offset: 2px; }
  @media (max-width: 600px) {
    body[data-mobile-view="list"] .workspace { display: none; }
    body[data-mobile-view="chat"] .sidebar { display: none; }
  }
</style></head>
<body data-mobile-view="list">
  <aside class="sidebar">
    <input id="search" placeholder="Search" />
    <div id="convList">
      <button type="button" class="conv" data-id="alice">Alice</button>
      <button type="button" class="conv" data-id="team">Weekend Walkers</button>
    </div>
  </aside>
  <main class="workspace">
    <button type="button" id="back">Back</button>
    <h1 id="chatName">Alice</h1>
    <select id="stateSelect">
      <option value="success">Success</option>
      <option value="empty">Empty</option>
    </select>
    <div id="messages"><p>Initial hello</p></div>
    <form id="composer"><input id="msgInput" /><button type="submit">Send</button></form>
  </main>
  <script>
    const convs = [
      { id: 'alice', name: 'Alice', text: 'Initial hello' },
      { id: 'team', name: 'Weekend Walkers', text: 'Route shared in group' },
    ];
    let current = convs[0];
    const renderConvs = (q) => {
      const box = document.getElementById('convList');
      box.innerHTML = convs
        .filter(c => c.name.toLowerCase().includes(q.toLowerCase()))
        .map(c => '<button type="button" class="conv" data-id="' + c.id + '">' + c.name + '</button>')
        .join('');
      box.querySelectorAll('.conv').forEach(btn => btn.addEventListener('click', () => {
        current = convs.find(c => c.id === btn.dataset.id);
        document.getElementById('chatName').textContent = current.name;
        document.getElementById('messages').innerHTML = '<p>' + current.text + '</p>';
        document.body.dataset.mobileView = 'chat';
      }));
    };
    renderConvs('');
    document.getElementById('search').addEventListener('input', e => renderConvs(e.target.value));
    document.getElementById('back').addEventListener('click', () => { document.body.dataset.mobileView = 'list'; });
    document.getElementById('stateSelect').addEventListener('change', e => {
      document.getElementById('messages').innerHTML = e.target.value === 'empty'
        ? '<p class="empty-msg">No messages yet</p>'
        : '<p>' + current.text + '</p>';
    });
    document.getElementById('composer').addEventListener('submit', e => {
      e.preventDefault();
      const input = document.getElementById('msgInput');
      if (input.value.trim()) {
        const p = document.createElement('p');
        p.textContent = input.value.trim();
        document.getElementById('messages').appendChild(p);
        input.value = '';
      }
    });
  </script>
</body></html>`,
    )

    const planFile = join(root, 'steps.json')
    await writeFile(planFile, JSON.stringify({
      timeoutMs: 30_000,
      sessions: [
        {
          name: 'desktop',
          width: 1440,
          height: 900,
          steps: [
            { action: 'focus', selector: '#search' },
            { action: 'screenshot', out: 'shots/1440.png' },
            { action: 'fill', selector: '#search', value: 'Weekend' },
            { action: 'assertCount', selector: '.conv', equals: 1 },
            { action: 'assertText', selector: '.conv', includes: 'Weekend Walkers' },
            { action: 'fill', selector: '#search', value: '' },
            { action: 'click', selector: '[data-id="team"]' },
            { action: 'assertText', selector: '#chatName', equals: 'Weekend Walkers' },
            { action: 'fill', selector: '#msgInput', value: 'Demo reply' },
            { action: 'submit', selector: '#composer' },
            { action: 'assertText', selector: '#messages', includes: 'Demo reply' },
            { action: 'select', selector: '#stateSelect', value: 'empty' },
            { action: 'assertText', selector: '#messages', includes: 'No messages yet' },
            { action: 'screenshot', out: 'shots/state-empty.png' },
          ],
        },
        {
          name: 'mobile',
          width: 390,
          height: 844,
          steps: [
            { action: 'assertVisible', selector: '.sidebar', visible: true },
            { action: 'assertVisible', selector: '.workspace', visible: false },
            { action: 'click', selector: '[data-id="alice"]' },
            { action: 'assertVisible', selector: '.workspace', visible: true },
            { action: 'screenshot', out: 'shots/390.png' },
            { action: 'click', selector: '#back' },
            { action: 'assertVisible', selector: '.sidebar', visible: true },
          ],
        },
      ],
    }))

    const result = await run('capture-poc.mjs', ['--url', page, '--steps', planFile], root)
    assert.equal(result.code, 0, result.stderr)
    const summary = JSON.parse(result.stdout)
    assert.equal(summary.status, 'ok')
    assert.equal(summary.browserLaunches, 1)
    assert.equal(summary.screenshots.length, 3)
    assert.ok(Array.isArray(summary.stages) && summary.stages.length >= 6)

    for (const [rel, expectedW, expectedH] of [
      ['shots/1440.png', 1440, 900],
      ['shots/state-empty.png', 1440, 900],
      ['shots/390.png', 390, 844],
    ]) {
      const png = await readFile(join(root, rel))
      assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
      assert.equal(png.readUInt32BE(16), expectedW)
      assert.equal(png.readUInt32BE(20), expectedH)
    }

    // UI assertion failure must still exit non-zero even when --allow-unverified is passed.
    const failingPlan = join(root, 'failing-steps.json')
    await writeFile(failingPlan, JSON.stringify({
      sessions: [{
        name: 'desktop',
        width: 1440,
        height: 900,
        steps: [{ action: 'assertText', selector: '#chatName', equals: 'Nonexistent Contact' }],
      }],
    }))
    const failedAssert = await run('capture-poc.mjs', ['--url', page, '--steps', failingPlan, '--allow-unverified'], root)
    assert.equal(failedAssert.code, 1, 'UI assertion failure must not be downgraded to unverified')
    assert.match(failedAssert.stderr, /assertText/)
  })

test('verify-surface degrades to honest unverified renderedEvidence when Chromium times out after retry', async context => {
  const root = await mkdtemp(join(tmpdir(), 'synapse-verify-degraded-'))
  context.after(() => rm(root, { recursive: true, force: true }))
  const guide = '# Selected style\nClean neutral tokens.\n'
  await writeFile(join(root, 'DESIGN.md'), guide)
  await writeFile(
    join(root, 'index.html'),
    '<!doctype html><html lang="en"><head><title>Workspace</title><meta name="viewport" content="width=device-width"><style>:root{--bg:#fafafa;--fg:#111}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui}main{padding:24px}button{min-height:44px;padding:10px 16px}</style></head><body><main><h1>Team messages</h1><button type="button">Send</button></main></body></html>',
  )
  const hash = createHash('sha256').update(guide).digest('hex')
  const style = await run('resolve-theme.mjs', ['--style-id', 'test-style', '--design-md', join(root, 'DESIGN.md'), '--sha256', hash, '--out', root], root)
  assert.equal(style.code, 0, style.stderr)

  const hangChrome = join(root, 'hang-chrome.sh')
  await writeFile(hangChrome, '#!/bin/sh\n[ "$1" = "--warmup" ] && exit 0\necho "[chrome] GPU channel stalled" >&2\nexec sleep 30\n')
  await chmod(hangChrome, 0o755)
  spawnSync(hangChrome, ['--warmup'])

  const scan = await run(
    'verify-surface.mjs',
    ['--url', join(root, 'index.html'), '--source', root, '--out', root, '--quick', '--timeout-ms', '700'],
    root,
    { OPENPENCIL_CHROME_PATH: hangChrome },
  )
  // Initial scan exits 1 (GATE: OPEN) because review fields & actions still require explicit classification, not GATE: ERROR.
  assert.equal(scan.code, 1)
  assert.doesNotMatch(scan.stderr, /GATE: ERROR/)
  const reportPath = join(root, 'evidence-report.json')
  const report = JSON.parse(await readFile(reportPath, 'utf8'))
  assert.equal(report.renderedEvidence.length, 2)
  for (const entry of report.renderedEvidence) {
    assert.equal(entry.status, 'unverified')
    assert.match(entry.uncovered, /GPU channel stalled/)
  }

  // Still OPEN before the agent fills honest unverified review entries + actions.
  const premature = await run('verify-surface.mjs', ['--check-evidence', reportPath], root)
  assert.equal(premature.code, 1)

  // Once honest unverified entries and actions are recorded, GATE: PASS succeeds without faking screenshots.
  report.accessibility = { status: 'unverified', uncovered: 'Chromium timed out; only static semantic markup was checked.' }
  report.responsive = { status: 'unverified', uncovered: 'Chromium timed out; responsive media queries were not rendered.' }
  report.visualReview = { status: 'unverified', uncovered: 'Chromium timed out after retry; current screenshot unavailable.' }
  for (const state of ['loading', 'empty', 'error', 'partial', 'success', 'permission']) {
    report.contentStates[state] = { status: 'unverified', uncovered: 'Browser state walkthrough unavailable due to Chromium timeout.' }
  }
  report.actions = [{ screen: 'Team messages', label: 'Send', kind: 'visual-only' }]
  await writeFile(reportPath, JSON.stringify(report, null, 2))

  const verified = await run('verify-surface.mjs', ['--check-evidence', reportPath], root)
  assert.equal(verified.code, 0, verified.stderr)
  assert.match(verified.stdout, /GATE: PASS/)
})

test('capture-poc and verify-surface capture real Chromium PNGs inside macOS Seatbelt workspace-write sandbox',
  {
    skip: process.env.DSH_E2E_CHROME !== '1' || process.platform !== 'darwin' || !existsSync('/usr/bin/sandbox-exec'),
    timeout: 90_000,
  },
  async context => {
    const root = await mkdtemp(join(tmpdir(), 'synapse-seatbelt-poc-'))
    context.after(() => rm(root, { recursive: true, force: true }))
    const realRoot = realpathSync(root)
    const realTmp = realpathSync(tmpdir())
    const sbpl = [
      '(version 1)',
      '(allow default)',
      '(deny file-write*)',
      '(allow file-write* (literal "/dev/null"))',
      `(allow file-write* (subpath "${realRoot}") (subpath "/private/tmp") (subpath "${realTmp}"))`,
    ].join(' ')

    const runUnderSeatbelt = (script, args) =>
      new Promise((resolve, reject) => {
        const env = { ...process.env, SYNAPSE_DESIGN_TASK_DIR: realRoot }
        delete env.OPENPENCIL_CHROME_NO_SANDBOX
        const child = spawn(
          '/usr/bin/sandbox-exec',
          ['-p', sbpl, '--', process.execPath, fileURLToPath(new URL(script, scripts)), ...args],
          { cwd: realRoot, env, stdio: ['ignore', 'pipe', 'pipe'] },
        )
        let stdout = ''
        let stderr = ''
        child.stdout.setEncoding('utf8').on('data', v => { stdout += v })
        child.stderr.setEncoding('utf8').on('data', v => { stderr += v })
        const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('Seatbelt command timed out')) }, 60_000)
        child.on('error', err => { clearTimeout(timer); reject(err) })
        child.on('close', code => { clearTimeout(timer); resolve({ code, stdout, stderr }) })
      })

    const guide = '# Talkdesk Cobalt\nClean operational tokens.\n'
    await writeFile(join(realRoot, 'DESIGN.md'), guide)
    await writeFile(
      join(realRoot, 'index.html'),
      '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Instant Chat</title><style>:root{--bg:#f8fafc;--fg:#0f172a}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui}main{padding:24px}button{min-height:44px;padding:10px 16px}</style></head><body><main><h1 id="title">Direct Messages</h1><button type="button" id="sendBtn" onclick="document.getElementById(\'status\').textContent=\'Sent\'">Send</button><p id="status">Idle</p></main></body></html>',
    )
    const hash = createHash('sha256').update(guide).digest('hex')
    const style = await runUnderSeatbelt('resolve-theme.mjs', ['--style-id', 'talkdesk-cobalt', '--design-md', join(realRoot, 'DESIGN.md'), '--sha256', hash, '--out', realRoot])
    assert.equal(style.code, 0, style.stderr)

    const stepsPath = join(realRoot, 'steps.json')
    await writeFile(stepsPath, JSON.stringify({
      timeoutMs: 25_000,
      sessions: [
        {
          name: 'desktop',
          width: 1440,
          height: 900,
          steps: [
            { action: 'click', selector: '#sendBtn' },
            { action: 'assertText', selector: '#status', equals: 'Sent' },
            { action: 'screenshot', out: 'shots/chat-desktop.png' },
          ],
        },
        {
          name: 'mobile',
          width: 390,
          height: 844,
          steps: [{ action: 'screenshot', out: 'shots/chat-mobile.png' }],
        },
      ],
    }))

    const cap = await runUnderSeatbelt('capture-poc.mjs', ['--url', join(realRoot, 'index.html'), '--steps', stepsPath])
    assert.equal(cap.code, 0, cap.stderr)
    const capJson = JSON.parse(cap.stdout)
    assert.equal(capJson.status, 'ok')
    assert.equal(capJson.screenshots.length, 2)

    const scan = await runUnderSeatbelt('verify-surface.mjs', ['--url', join(realRoot, 'index.html'), '--source', realRoot, '--out', realRoot, '--quick', '--timeout-ms', '25000'])
    assert.equal(scan.code, 1, 'initial scan exits 1 (GATE: OPEN) awaiting human/model visual review')
    const report = JSON.parse(await readFile(join(realRoot, 'evidence-report.json'), 'utf8'))
    assert.equal(report.renderedEvidence.length, 2)
    for (const item of report.renderedEvidence) {
      assert.equal(item.status, 'captured', `expected real capture under Seatbelt, got ${JSON.stringify(item)}`)
      assert.equal(item.renderer, 'Chromium')
    }
  },
)
