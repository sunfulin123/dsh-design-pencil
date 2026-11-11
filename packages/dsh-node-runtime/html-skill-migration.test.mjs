import assert from 'node:assert/strict'
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const source = new URL('../../crates/op-ai-skills/skills/synapse-design-html/', import.meta.url)
const read = path => readFile(new URL(path, source), 'utf8')

test('HTML skill packages its original review, prototype, and research resources without a separate style catalogue', async () => {
  for (const path of [
    'references/direction/surface-modes.md', 'references/review/audit-and-critique.md',
    'references/review/impeccable-critique.md', 'references/craft/impeccable-adapt-responsive.md',
    'references/webgl-3d/3dviz-subject-clarity-and-motion.md',
    'scripts/verify-surface.mjs', 'scripts/sloplint.mjs', 'scripts/sloplint-render.mjs',
    'scripts/copy-lint.mjs', 'scripts/search.py', 'scripts/capture-poc.mjs',
    'data/ux-guidelines.csv', 'data/typography.csv', 'data/sources.json',
    'templates/kits/README.md', 'templates/scaffold-vite-threejs/README.md',
    'assets/icons/index.json', 'THIRD_PARTY_NOTICES.md', 'third-party-licenses/taste.txt',
  ]) await access(new URL(path, source)).catch(() => { throw new Error(`missing migrated resource: ${path}`) })
  for (const path of ['references/direction/design-md/index.json', 'references/direction/themes/index.json', 'data/palettes.json']) {
    await assert.rejects(access(new URL(path, source)), { code: 'ENOENT' })
  }
  const skill = await read('SKILL.md')
  assert.match(skill, /three-layer/i)
  assert.match(skill, /selected DESIGN/i)
  assert.match(skill, /verify-surface\.mjs/)
  assert.match(skill, /synapse_design_poc_handoff/)
  assert.doesNotMatch(skill, /references\/direction\/(?:design-md|themes)\/index\.json/)
  const typography = await read('references/direction/palettes-and-typography.md')
  assert.doesNotMatch(typography, /No Violet\/Purple|Verified Industry Palettes/)
})

test('migrated icon resolver can search its local index without network access', () => {
  const script = fileURLToPath(new URL('scripts/icons.mjs', source))
  const result = spawnSync(process.execPath, [script, 'apps', '--tag', 'storage'], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /google-drive/)
})

test('HTML skill declares the retained migration inventory and its source', async () => {
  const inventory = JSON.parse(await read('migration-manifest.json'))
  assert.equal(inventory.schemaVersion, 1)
  assert.ok(inventory.files.length > 500)
  assert.ok(inventory.files.every(file => file.status !== 'pending'), 'every source resource must be accounted for')
  for (const file of inventory.files.filter(file => file.status === 'preserved' || file.status === 'adapted')) {
    assert.match(file.sha256, /^[a-f0-9]{64}$/)
    const bytes = await readFile(new URL(file.destination, source))
    if (file.status === 'preserved') assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, file.source)
  }
  for (const path of ['references/review/audit-and-critique.md', 'scripts/verify-surface.mjs', 'data/ux-guidelines.csv']) {
    const entry = inventory.files.find(file => file.source === path)
    assert.ok(entry, `missing inventory entry: ${path}`)
    assert.match(entry.status, /^(?:preserved|adapted)$/)
    await access(fileURLToPath(new URL(entry.destination, source)))
  }
})

test('a POC verifier binds its task-local DESIGN and rejects changed or escaped content', async context => {
  const { checkStyleContext } = await import(new URL('scripts/verify-evidence.mjs', source))
  const root = await mkdtemp(join(tmpdir(), 'synapse-style-test-'))
  context.after(() => rm(root, { recursive: true, force: true }))
  const guide = join(root, 'DESIGN.md')
  const content = '# User selected style\nA complete design guide.\n'
  await writeFile(guide, content)
  const hash = createHash('sha256').update(content).digest('hex')
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('scripts/resolve-theme.mjs', source)),
    '--style-id', 'custom-style', '--design-md', guide, '--sha256', hash, '--out', root], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(checkStyleContext(root), [])
  await writeFile(guide, content + 'changed')
  assert.match(checkStyleContext(root)[0].message, /changed or is empty/)
  const invalid = { schemaVersion: 1, styleId: 'custom-style', contentHash: hash, guidePath: '../other' }
  await writeFile(join(root, 'style-context.json'), JSON.stringify(invalid))
  assert.equal(checkStyleContext(root)[0].severity, 'P0')
})

test('HTML evidence rejects missing captures and never equates capture with visual review', async context => {
  const { checkEvidenceLedger } = await import(new URL('scripts/verify-evidence.mjs', source))
  const root = await mkdtemp(join(tmpdir(), 'synapse-evidence-test-'))
  context.after(() => rm(root, { recursive: true, force: true }))
  const report = { contract: 'task', targetViewports: ['desktop'],
    accessibility: { status: 'pass', evidence: 'manual interaction review' },
    responsive: { status: 'pass', evidence: 'browser review' },
    visualReview: { status: 'pending', evidence: '' },
    contentStates: Object.fromEntries(['loading', 'empty', 'error', 'partial', 'success', 'permission']
      .map(state => [state, { status: 'not-applicable', reason: 'static page' }])),
    sourceFiles: [], renderedEvidence: [{ viewport: 'desktop' }],
  }
  assert.match(checkEvidenceLedger(report, root).join('\n'), /captured artifact/)
  assert.match(checkEvidenceLedger(report, root).join('\n'), /visualReview/)
  report.renderedEvidence[0] = { viewport: 'desktop', status: 'captured', artifact: 'desktop.png' }
  assert.match(checkEvidenceLedger(report, root).join('\n'), /missing or empty/)
})

test('review evidence becomes invalid when the source or capture changes', async context => {
  const { checkEvidenceLedger } = await import(new URL('scripts/verify-evidence.mjs', source))
  const root = await mkdtemp(join(tmpdir(), 'synapse-review-fingerprint-'))
  context.after(() => rm(root, { recursive: true, force: true }))
  const hash = data => createHash('sha256').update(data).digest('hex')
  const page = '<html><body>original</body></html>'
  const png = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.from('captured')])
  const pagePath = join(root, 'index.html')
  await writeFile(pagePath, page)
  await writeFile(join(root, 'desktop.png'), png)
  const report = { contract: 'task', targetViewports: ['desktop'],
    accessibility: { status: 'pass', evidence: 'tested' }, responsive: { status: 'pass', evidence: 'tested' },
    visualReview: { status: 'pass', evidence: 'inspected the actual capture' },
    contentStates: Object.fromEntries(['loading', 'empty', 'error', 'partial', 'success', 'permission']
      .map(state => [state, { status: 'not-applicable', reason: 'static page' }])),
    sourceTarget: pagePath, sourceFiles: [{ path: pagePath, sha256: hash(page) }],
    renderedEvidence: [{ viewport: 'desktop', status: 'captured', artifact: 'desktop.png', renderer: 'Chromium', sha256: hash(png) }],
  }
  assert.deepEqual(checkEvidenceLedger(report, root), [])
  report.sourceTarget = root
  report.sourceFiles.push({ path: join(root, 'desktop.png'), sha256: hash(png) })
  assert.deepEqual(checkEvidenceLedger(report, root), [])
  await writeFile(join(root, 'added.css'), 'body { color: red }')
  assert.match(checkEvidenceLedger(report, root).join('\n'), /inventory changed/i)
  await rm(join(root, 'added.css'))
  await writeFile(pagePath, page + '<!-- edit -->')
  assert.match(checkEvidenceLedger(report, root).join('\n'), /source.*changed/i)
  await writeFile(pagePath, page)
  await writeFile(join(root, 'desktop.png'), Buffer.concat([png, Buffer.from('changed')]))
  assert.match(checkEvidenceLedger(report, root).join('\n'), /artifact.*changed/i)
})

test('evidence tracks project assets without treating generated screenshots as source', async context => {
  const { collectEvidenceFiles } = await import(new URL('scripts/verify-source.mjs', source))
  const root = await mkdtemp(join(tmpdir(), 'synapse-poc-sources-'))
  context.after(() => rm(root, { recursive: true, force: true }))
  const { mkdir } = await import('node:fs/promises')
  await mkdir(join(root, 'shots'))
  await mkdir(join(root, 'assets'))
  await writeFile(join(root, 'index.html'), '<img src="assets/logo.svg">')
  await writeFile(join(root, 'assets/logo.svg'), '<svg/>')
  await writeFile(join(root, 'shots/desktop.png'), 'generated')
  const files = collectEvidenceFiles(root, root)
  assert.ok(files.includes(join(root, 'index.html')))
  assert.ok(files.includes(join(root, 'assets/logo.svg')))
  assert.ok(!files.includes(join(root, 'shots/desktop.png')))
})

test('migrated HTML diagnostics retain representative original checks and task-local baselines', async context => {
  const root = await mkdtemp(join(tmpdir(), 'synapse-sloplint-'))
  context.after(() => rm(root, { recursive: true, force: true }))
  const page = join(root, 'index.html')
  await writeFile(page, '<!DOCTYPE html><html><head><title>Workspace</title><style>:root{--bg:#ffffff;--font-body:Arial} body{background:var(--bg)} h1{color:#888;font-family:Arial} button{padding:2px}</style></head><body><main><h1>Workspace</h1><button>Save</button><a href="/help">Help</a></main></body></html>')
  const script = fileURLToPath(new URL('scripts/sloplint.mjs', source))
  const options = { cwd: root, encoding: 'utf8', env: { ...process.env, SYNAPSE_DESIGN_TASK_DIR: root } }
  const scan = spawnSync(process.execPath, [script, page, '--json', '--scope', 'app'], options)
  assert.equal(scan.status, 1, scan.stderr)
  assert.equal(scan.stderr, '')
  const findings = JSON.parse(scan.stdout).findings
  for (const gate of ['20', '26a', '34', '48']) assert.ok(findings.some(item => item.gate === gate), gate)
  const baseline = spawnSync(process.execPath, [script, page, '--before', '--scope', 'app', '--json'], options)
  assert.equal(baseline.status, 0, baseline.stderr)
  await access(join(root, 'review/before.json'))
  await assert.rejects(access(join(root, '.hallmark')), { code: 'ENOENT' })
})

test('legacy design-system generation requires the selected catalogue guide and never substitutes a palette', async context => {
  const root = await mkdtemp(join(tmpdir(), 'synapse-design-guide-'))
  context.after(() => rm(root, { recursive: true, force: true }))
  const script = fileURLToPath(new URL('scripts/search.py', source))
  const without = spawnSync('python3', [script, 'support chat', '--design-system'],
    { encoding: 'utf8', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1', SYNAPSE_DESIGN_TASK_DIR: root } })
  assert.notEqual(without.status, 0)
  assert.match(without.stderr, /selected|style|DESIGN/i)
  const guide = '# Selected guide\nUse the project-owned colors and type.\n'
  await writeFile(join(root, 'DESIGN.md'), guide)
  await writeFile(join(root, 'style-context.json'), JSON.stringify({ schemaVersion: 1, styleId: 'my-style',
    contentHash: createHash('sha256').update(guide).digest('hex'), guidePath: 'DESIGN.md' }))
  const withGuide = spawnSync('python3', [script, 'support chat', '--design-system', '--format', 'markdown'],
    { encoding: 'utf8', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1', SYNAPSE_DESIGN_TASK_DIR: root } })
  assert.equal(withGuide.status, 0, withGuide.stderr)
  assert.match(withGuide.stdout, /Selected guide/)
  assert.doesNotMatch(withGuide.stdout, /#2563EB|#F97316/)
  const ux = spawnSync('python3', [script, 'keyboard accessibility', '--domain', 'ux', '--json'],
    { encoding: 'utf8', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } })
  assert.equal(ux.status, 0, ux.stderr)
  assert.ok(JSON.parse(ux.stdout).count > 0)
})

test('HTML diagnostics resolve scripts from installation paths containing spaces', async context => {
  const { cp } = await import('node:fs/promises')
  const { pathToFileURL } = await import('node:url')
  const root = await mkdtemp(join(tmpdir(), 'synapse skill space '))
  context.after(() => rm(root, { recursive: true, force: true }))
  await cp(new URL('scripts/', source), join(root, 'scripts'), { recursive: true })
  const page = join(root, 'index.html')
  await writeFile(page, '<!doctype html><html lang="en"><title>Example</title><h1>Example</h1></html>')
  const { runCopyLint, runSloplint } = await import(pathToFileURL(join(root, 'scripts/verify-source.mjs')))
  for (const finding of [...runCopyLint([page]), ...runSloplint([page])]) {
    assert.notEqual(finding.category, 'verification-unavailable', finding.message)
  }
})
