import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'
import { stageRuntime } from '../../scripts/stage-dsh-runtime.mjs'

test('stages only the Node/WASM runtime and required browser assets', async context => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-node-package-'))
  context.after(() => rm(root, { recursive: true, force: true }))
  const runtime = join(root, 'packages/dsh-node-runtime')
  const files = [
    'package.json', 'cli.mjs', 'offline-cli.mjs', 'document-file.mjs', 'document-store.mjs',
    'engine-session.mjs', 'node-host.mjs', 'static-assets.mjs', 'color-sampler.mjs', 'screenshot-renderer.mjs',
    'draft-recovery.mjs', 'document-history.mjs',
    'figma-rest-client.mjs', 'figma-images.mjs', 'figma-import-jobs.mjs', 'font-fetcher.mjs', 'font-inventory.mjs', 'headless-renderer.mjs',
    'figma-fidelity.mjs', 'png-diff.mjs', 'asset-directory.mjs', 'asset-store.mjs', 'host-http.mjs',
    'png-fixture.test-helper.mjs',
    'wasm/op_dsh_engine.js', 'wasm/op_dsh_engine_bg.wasm',
    'web-bundle/index.html', 'web-bundle/op_host_web.js',
    'web-bundle/op_host_web_bg.wasm', 'web-bundle/snippets/bridge.js',
    'web-bundle/canvaskit/canvaskit.js', 'web-bundle/canvaskit/canvaskit.wasm',
    'web-bundle/canvaskit/LICENSE', 'web-bundle/assets/fonts/Roboto-Regular.ttf',
    'web-bundle/assets/iconify-catalog-core.json',
    'web-bundle/assets/iconify-catalog-brands.json',
    'web-bundle/assets/scene_templates/example.op',
    'web-bundle/assets/i18n/ja.json',
    'web-bundle/assets/prompt_center_previews/unused.jpg',
    'node-host.test.mjs', 'build-web.sh', 'wasm/op_dsh_engine.d.ts',
    'web-bundle/op_host_web.d.ts', 'web-bundle/vendor/agent/source.rs',
    'web-bundle/node_modules/sdk/index.js', 'web-bundle/target/cache',
  ]
  for (const file of files) {
    const path = join(runtime, file)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, file === 'package.json' ? JSON.stringify({
      name: '@sunfulin123/dsh-design-pencil-runtime', version: '0.8.5-synapse.4',
      type: 'commonjs', engines: { node: '>=24' },
    }) : file)
  }
  await writeFile(join(root, 'LICENSE'), 'fixture license')
  const destination = join(root, 'output')
  const manifest = await stageRuntime({ root, destination, revision: '1'.repeat(40) })
  assert.equal(manifest.runtime, 'node-wasm')
  assert.equal(manifest.entrypoint, 'cli.mjs')
  assert.ok(manifest.files['offline-cli.mjs'])
  assert.equal(manifest.node, '>=24')
  assert.equal(manifest.openPencilVersion, '0.8.5-synapse.4')
  assert.ok(manifest.files['wasm/op_dsh_engine_bg.wasm'])
  assert.ok(manifest.files['color-sampler.mjs'])
  assert.ok(manifest.files['screenshot-renderer.mjs'])
  assert.ok(manifest.files['draft-recovery.mjs'])
  assert.ok(manifest.files['document-history.mjs'])
  for (const module of ['asset-directory.mjs', 'asset-store.mjs', 'host-http.mjs']) {
    assert.ok(manifest.files[module], `${module} is imported by the host and must be staged`)
  }
  assert.equal(manifest.files['png-fixture.test-helper.mjs'], undefined)
  assert.ok(manifest.files['web-bundle/op_host_web_bg.wasm'])
  assert.ok(manifest.files['web-bundle/assets/i18n/ja.json'])
  assert.ok(manifest.files['web-bundle/snippets/bridge.js'])
  for (const path of Object.keys(manifest.files)) {
    assert.doesNotMatch(path, /vendor|node_modules|target|\.test\.|\.d\.ts|build-web|prompt_center|op-host-web-server/)
  }
  const persisted = JSON.parse(await readFile(join(destination, 'openpencil-runtime.json')))
  assert.deepEqual(persisted, manifest)
})
test('the staged real runtime starts a managed host with every imported module', async context => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-node-staged-'))
  context.after(() => rm(root, { recursive: true, force: true }))
  const repo = fileURLToPath(new URL('../..', import.meta.url))
  const destination = join(root, 'runtime')
  await stageRuntime({ root: repo, destination, revision: '1'.repeat(40) })
  const document = join(root, 'design.op')
  await writeFile(document, JSON.stringify({ version: '0.8.5', children: [] }))
  const child = spawn(process.execPath, [
    join(destination, 'cli.mjs'), '--serve-web', '--managed', '--port', '0', '--file', document,
    '--draft-dir', join(root, 'drafts'),
  ], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, DSH_ASSET_DIR: join(root, 'assets'), DSH_HEADLESS: '0' } })
  const exited = once(child, 'exit')
  context.after(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
    await exited
  })
  let diagnostics = ''
  child.stderr.setEncoding('utf8').on('data', message => { diagnostics += message })
  const [line] = await Promise.race([
    once(createInterface({ input: child.stdout }), 'line', { signal: AbortSignal.timeout(10_000) }),
    exited.then(() => { throw new Error(`staged CLI exited: ${diagnostics}`) }),
  ])
  assert.equal(JSON.parse(line).ok, true)
  child.stdin.end()
  assert.equal((await exited)[0], 0, diagnostics)
})
