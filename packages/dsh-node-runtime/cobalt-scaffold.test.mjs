import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, rm, symlink, realpath } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const script = fileURLToPath(new URL('../talkdesk-cobalt/tools/cobalt-project.mjs', import.meta.url))
const app = { id: 'routing-studio', title: 'Routing Studio', iconName: 'app_automation_flows',
  pages: [{ id: 'overview', title: 'Overview' }, { id: 'rules', title: 'Rules' }] }

async function fixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'cobalt-scaffold-')))
  t.after(() => rm(root, { recursive: true, force: true }))
  const spec = join(root, 'spec.json')
  await writeFile(spec, JSON.stringify({ apps: [app] }))
  const out = join(root, 'project')
  const run = (action, input = spec, target = out) => spawnSync(process.execPath,
    [script, action, '--out', target, '--spec', input], { encoding: 'utf8' })
  return { root, out, spec, run, read: path => readFile(join(out, path), 'utf8') }
}

test('CLI creates a self-contained Cobalt project and safely adds another real Dock app', async t => {
  const f = await fixture(t)
  let result = f.run('create')
  assert.equal(result.status, 0, result.stderr)
  const provenance = JSON.parse(await f.read('cobalt-source.json'))
  assert.match(provenance.revision, /^[a-f0-9]{40}$/)
  assert.equal(provenance.branch, 'ai-docs')
  assert.ok(Object.keys(provenance.files).length >= 29)
  assert.match(await f.read('src/workspace-shell/shell/Primary.tsx'), /prototypeApps\.some/)
  assert.match(await f.read('src/workspace-shell/shell/Shell.tsx'), /appId: current.appId/)
  assert.match(await f.read('src/workspace-shell/shell/PrototypeBar.tsx'), /prototype-runtime\/review-toolbar/)
  assert.match(await f.read('src/apps/routing-studio/pages/rules.tsx'), /Cobalt/)
  const pkg = JSON.parse(await f.read('package.json'))
  assert.equal(pkg.dependencies.react, '18.3.1')
  assert.match(pkg.scripts.build, /vite build/)
  assert.match(await f.read('vite.config.ts'), /delivery/)
  assert.match(await f.read('.npmrc'), /@talkdesk:registry=/)
  await writeFile(join(f.out, 'src/apps/routing-studio/pages/rules.tsx'), '// user business page\n')
  await writeFile(f.spec, JSON.stringify({ apps: [{ ...app, id: 'quality-center', title: 'Quality Center' }] }))
  result = f.run('add')
  assert.equal(result.status, 0, result.stderr)
  assert.equal(JSON.parse(await f.read('talkdesk-prototype.json')).apps.length, 2)
  assert.equal(await f.read('src/apps/routing-studio/pages/rules.tsx'), '// user business page\n')
  assert.equal(f.run('add').status, 1, 'duplicate app must fail')
  assert.equal(f.run('create').status, 1, 'create must not overwrite an existing project')
})

test('CLI rejects unsafe paths and incomplete specs without creating a partial project', async t => {
  const f = await fixture(t)
  for (const invalid of [
    { apps: [{ ...app, id: '../escape' }] },
    { apps: [{ ...app, pages: [] }] },
    { apps: [app, app] },
    { apps: [{ ...app, pages: [app.pages[0], app.pages[0]] }] },
  ]) {
    await writeFile(f.spec, JSON.stringify(invalid))
    assert.equal(f.run('create').status, 1)
    await assert.rejects(readFile(join(f.out, 'package.json')), { code: 'ENOENT' })
  }
  await writeFile(f.spec, JSON.stringify({ apps: [app] }))
  await symlink(f.root, join(f.root, 'link'))
  assert.equal(f.run('create', f.spec, join(f.root, 'link', 'escape')).status, 1)
})

test('add rejects a symlinked page directory and preserves the app registry', async t => {
  const f = await fixture(t)
  assert.equal(f.run('create').status, 0)
  const before = await f.read('talkdesk-prototype.json')
  await symlink(f.root, join(f.out, 'src/apps/quality-center'))
  await writeFile(f.spec, JSON.stringify({ apps: [{ ...app, id: 'quality-center' }] }))
  assert.equal(f.run('add').status, 1)
  assert.equal(await f.read('talkdesk-prototype.json'), before)
})
