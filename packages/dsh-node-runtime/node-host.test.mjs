import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { request } from 'node:http'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { startNodeHost } from './node-host.mjs'

async function fixture(context, options = {}) {
  const host = await startNodeHost({
    document: { version: '0.8.5', children: [] },
    allowOrigins: ['dsh-app://app'],
    ...options,
  })
  context.after(() => host.close())
  return host
}

function write(body, headers = {}) {
  return { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) }
}

test('MCP discovers only implemented passive tools and executes Position over HTTP', async context => {
  const host = await fixture(context, { document: { version: '0.8.5', children: [
    { type: 'rectangle', id: 'first', x: 0, y: 0, width: 20, height: 20 },
    { type: 'rectangle', id: 'second', x: 100, y: 100, width: 40, height: 40 },
  ] } })
  const rpc = async (method, params) => (await (await fetch(`${host.baseUrl}/mcp`, write({
    jsonrpc: '2.0', id: method, method, params,
  }))).json()).result
  const catalog = await rpc('tools/list')
  const names = catalog.tools.map(tool => tool.name)
  assert.equal(new Set(names).size, names.length)
  for (const name of ['batch_design', 'set_selection_set', 'align_selected', 'undo', 'redo',
    'update_node', 'replace_node', 'add_node_effect', 'set_variables', 'create_component', 'add_page']) {
    assert.ok(names.includes(name), `${name} must be discoverable`)
  }
  for (const name of ['run_design_agent', 'spawn_agents', 'get_screenshot', 'export_item']) {
    assert.ok(!names.includes(name), `${name} must not be advertised without an implementation`)
  }
  assert.ok(catalog.tools.every(tool => tool.inputSchema.type === 'object'))
  const call = (name, args = {}) => rpc('tools/call', { name, arguments: args })
  assert.equal((await call('set_selection_set', { node_ids: 'first,second' })).isError, false)
  assert.deepEqual(await (await fetch(`${host.baseUrl}/api/mcp/version`)).json(), { version: 0 })
  assert.equal((await call('align_selected', { action: 'center_v' })).isError, false)
  let snapshot = await (await fetch(`${host.baseUrl}/api/mcp/document`)).json()
  assert.deepEqual(snapshot.document.children.map(node => node.y), [60, 50])
  assert.equal(snapshot.version, 1)
  assert.equal((await call('undo')).isError, false)
  snapshot = await (await fetch(`${host.baseUrl}/api/mcp/document`)).json()
  assert.deepEqual(snapshot.document.children.map(node => node.y), [0, 100])
  assert.equal(snapshot.version, 2)
})

test('Node HTTP host drives real WASM and exposes authoritative versioned documents', async context => {
  const host = await fixture(context)
  const response = await fetch(`${host.baseUrl}/mcp`, write({
    jsonrpc: '2.0', id: 'design', method: 'tools/call',
    params: { name: 'batch_design', arguments: { operations: 'frame=I(null, {"type":"frame","name":"HTTP WASM design"})' } },
  }))
  assert.equal(response.status, 200)
  const reply = await response.json()
  assert.equal(reply.id, 'design')
  assert.equal(reply.result.isError, false)
  assert.deepEqual(await (await fetch(`${host.baseUrl}/api/mcp/version`)).json(), { version: 1 })
  const snapshot = await (await fetch(`${host.baseUrl}/api/mcp/document`)).json()
  assert.equal(snapshot.document.children[0].name, 'HTTP WASM design')
  assert.equal(snapshot.version, 1)
})

test('Node host refuses foreign origins, rebinding hosts and simple content types', async context => {
  const host = await fixture(context)
  const route = `${host.baseUrl}/api/mcp/document`
  assert.equal((await fetch(route, { headers: { origin: 'https://evil.example' } })).status, 403)
  const reboundStatus = await new Promise((resolve, reject) => {
    const connection = request(route, { headers: { host: 'evil.example' } }, response => {
      response.resume()
      response.once('end', () => resolve(response.statusCode))
      response.once('error', reject)
    })
    connection.once('error', reject)
    connection.end()
  })
  assert.equal(reboundStatus, 403)
  assert.equal((await fetch(route, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{}' })).status, 415)
  const trusted = await fetch(route, { headers: { origin: 'dsh-app://app' } })
  assert.equal(trusted.status, 200)
  assert.equal(trusted.headers.get('access-control-allow-origin'), 'dsh-app://app')
  assert.equal((await (await fetch(`${host.baseUrl}/api/mcp/version`)).json()).version, 0)
})

test('concurrent browser writes at one baseline cannot overwrite each other', async context => {
  const host = await fixture(context)
  const writes = ['first', 'second'].map(name => fetch(`${host.baseUrl}/api/mcp/document`, write({
    document: { version: '0.8.5', children: [], name }, baseVersion: 0,
    activePageIndex: 0, preserveAuthoredGeometry: true,
  })))
  const responses = await Promise.all(writes)
  assert.deepEqual(responses.map(response => response.status).sort(), [200, 409])
  const conflict = responses.find(response => response.status === 409)
  assert.deepEqual(await conflict.json(), { ok: false, error: 'version-conflict', version: 1 })
  const snapshot = await (await fetch(`${host.baseUrl}/api/mcp/document`)).json()
  assert.equal(snapshot.version, 1)
  assert.equal(snapshot.preserveAuthoredGeometry, true)
})

test('metadata-only browser pushes keep design content and its revision', async context => {
  const host = await fixture(context)
  await fetch(`${host.baseUrl}/mcp`, write({
    jsonrpc: '2.0', id: 1, method: 'tools/call',
    params: { name: 'batch_design', arguments: { operations: 'frame=I(null, {"type":"frame","name":"keep AI design"})' } },
  }))
  const response = await fetch(`${host.baseUrl}/api/mcp/document`, write({
    document: { version: '0.8.5', children: [] }, baseVersion: 1,
    metadataOnly: true, activePageIndex: 0, preserveAuthoredGeometry: true,
  }))
  assert.deepEqual(await response.json(), { ok: true, version: 1 })
  const snapshot = await (await fetch(`${host.baseUrl}/api/mcp/document`)).json()
  assert.equal(snapshot.document.children[0].name, 'keep AI design')
  assert.equal(snapshot.preserveAuthoredGeometry, true)
})

test('invalid JSON and account routes do not change the design', async context => {
  const host = await fixture(context)
  const malformed = await fetch(`${host.baseUrl}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' })
  assert.equal(malformed.status, 400)
  assert.equal((await fetch(`${host.baseUrl}/api/auth/login`)).status, 404)
  assert.equal((await (await fetch(`${host.baseUrl}/api/mcp/version`)).json()).version, 0)
})

test('document responses expose the scenario used by the browser preview', async context => {
  const host = await fixture(context)
  const response = await fetch(`${host.baseUrl}/api/mcp/document`, write({
    document: { version: '0.8.5', children: [], editorMeta: { scenario: 'slides' } },
    baseVersion: 0,
  }))
  assert.equal(response.status, 200)
  const snapshot = await (await fetch(`${host.baseUrl}/api/mcp/document`)).json()
  assert.equal(snapshot.scenario, 'slides')
})

test('save writes only the bound file and rejects a stale content baseline', async context => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-node-save-'))
  context.after(() => rm(root, { recursive: true, force: true }))
  const sourcePath = join(root, 'design.op')
  const foreignPath = join(root, 'foreign.op')
  const initial = { version: '0.8.5', children: [] }
  await writeFile(sourcePath, JSON.stringify(initial))
  await writeFile(foreignPath, 'untouched')
  const host = await fixture(context, { sourcePath })
  const document = { ...initial, children: [{ type: 'frame', id: 'f1', name: 'saved design', children: [] }] }
  const response = await fetch(`${host.baseUrl}/api/file/save`, write({
    document, baseVersion: 0, path: foreignPath, activePageIndex: 0,
  }))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: true, version: 1, fileName: 'design.op' })
  assert.equal(JSON.parse(await readFile(sourcePath, 'utf8')).children[0].name, 'saved design')
  assert.equal(await readFile(foreignPath, 'utf8'), 'untouched')
  const rejected = await fetch(`${host.baseUrl}/api/file/save`, write({ document: initial, baseVersion: 0 }))
  assert.equal(rejected.status, 409)
  assert.equal(JSON.parse(await readFile(sourcePath, 'utf8')).children[0].name, 'saved design')
})

test('a failed save retains the current in-memory document', async context => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-node-save-failure-'))
  context.after(() => rm(root, { recursive: true, force: true }))
  const host = await fixture(context, { sourcePath: join(root, 'missing', 'design.op') })
  const response = await fetch(`${host.baseUrl}/api/file/save`, write({
    document: { version: '0.8.5', children: [{ type: 'frame', id: 'f1', name: 'must not commit', children: [] }] },
    baseVersion: 0,
  }))
  assert.equal(response.status, 500)
  const snapshot = await (await fetch(`${host.baseUrl}/api/mcp/document`)).json()
  assert.equal(snapshot.version, 0)
  assert.deepEqual(snapshot.document.children, [])
})

test('save refuses an externally edited file without changing the memory baseline', async context => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-node-save-conflict-'))
  context.after(() => rm(root, { recursive: true, force: true }))
  const sourcePath = join(root, 'design.op')
  await writeFile(sourcePath, JSON.stringify({ version: '0.8.5', children: [] }))
  const host = await fixture(context, { sourcePath })
  const external = JSON.stringify({ version: '0.8.5', children: [], name: 'external edit' })
  await writeFile(sourcePath, external)
  const response = await fetch(`${host.baseUrl}/api/file/save`, write({
    document: { version: '0.8.5', children: [] }, baseVersion: 0,
  }))
  assert.equal(response.status, 409)
  assert.equal((await response.json()).error, 'file-conflict')
  assert.equal(await readFile(sourcePath, 'utf8'), external)
  assert.equal((await (await fetch(`${host.baseUrl}/api/mcp/version`)).json()).version, 0)
})

for (const shutdownMethod of ['stdin', 'rpc']) {
test(`managed CLI loads the selected file, emits a handshake and exits on ${shutdownMethod}`, async context => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-node-cli-'))
  context.after(() => rm(root, { recursive: true, force: true }))
  const sourcePath = join(root, 'design.op')
  await writeFile(sourcePath, JSON.stringify({ version: '0.8.5', children: [], name: 'opened document' }))
  const child = spawn(process.execPath, [
    fileURLToPath(new URL('./cli.mjs', import.meta.url)),
    '--serve-web', '--managed', '--port', '0', '--file', sourcePath, '--allow-origin', 'dsh-app://app',
  ], { stdio: ['pipe', 'pipe', 'pipe'] })
  const exited = once(child, 'exit')
  const lines = createInterface({ input: child.stdout })
  let diagnostics = ''
  child.stderr.setEncoding('utf8').on('data', message => { diagnostics += message })
  context.after(async () => {
    lines.close()
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
    await exited
  })
  const first = await Promise.race([
    once(lines, 'line', { signal: AbortSignal.timeout(5000) }),
    exited.then(() => { throw new Error(`CLI exited without a handshake: ${diagnostics}`) }),
  ])
  const handshake = JSON.parse(first[0])
  assert.equal(handshake.ok, true)
  assert.ok(handshake.port > 0)
  assert.ok(handshake.token.length >= 16)
  assert.equal(handshake.version, 0)
  const baseUrl = `http://127.0.0.1:${handshake.port}`
  const snapshot = await (await fetch(`${baseUrl}/api/mcp/document`, { headers: { origin: 'dsh-app://app' } })).json()
  assert.equal(snapshot.document.name, 'opened document')
  const refused = await fetch(`${baseUrl}/mcp`, write({ jsonrpc: '2.0', id: 1, method: 'openpencil/shutdown', params: { token: 'wrong-token' } }))
  assert.equal((await refused.json()).error.code, -32601)
  if (shutdownMethod === 'stdin') child.stdin.end()
  else {
    const response = await fetch(`${baseUrl}/mcp`, write({ jsonrpc: '2.0', id: 2, method: 'openpencil/shutdown', params: { token: handshake.token } }))
    assert.deepEqual(await response.json(), { jsonrpc: '2.0', id: 2, result: { ok: true, shuttingDown: true } })
  }
  const [exitCode] = await Promise.race([
    exited,
    once(child, 'error', { signal: AbortSignal.timeout(5000) }),
  ])
  assert.equal(exitCode, 0, diagnostics)
  await assert.rejects(fetch(`${baseUrl}/api/mcp/version`))
})
}

test('static serving supports editor probes and WASM MIME without exposing outside paths', async context => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-node-static-'))
  context.after(() => rm(root, { recursive: true, force: true }))
  const webRoot = join(root, 'web-bundle')
  const canvaskitRoot = join(webRoot, 'canvaskit')
  await mkdir(canvaskitRoot, { recursive: true })
  await mkdir(join(webRoot, 'assets'))
  await writeFile(join(webRoot, 'assets', 'iconify-catalog-brands.json'), '{"icons":[]}')
  await writeFile(join(webRoot, 'index.html'), '<html><body>editor fixture</body></html>')
  await writeFile(join(webRoot, 'op_host_web.js'), 'export const testFixture = true')
  await writeFile(join(webRoot, 'op_host_web_bg.wasm'), Buffer.from([0, 97, 115, 109, 1, 0, 0, 0]))
  await writeFile(join(canvaskitRoot, 'canvaskit.js'), 'canvas fixture')
  await writeFile(join(root, 'secret.txt'), 'not public')
  await symlink(join(root, 'secret.txt'), join(webRoot, 'leak.txt'))
  const host = await fixture(context, { webRoot, canvaskitRoot })
  assert.equal((await fetch(`${host.baseUrl}/?embed=vscode`)).status, 200)
  assert.equal((await fetch(`${host.baseUrl}/pkg/op_host_web.js`)).headers.get('content-type'), 'text/javascript; charset=utf-8')
  const wasm = await fetch(`${host.baseUrl}/pkg/op_host_web_bg.wasm`)
  assert.equal(wasm.headers.get('content-type'), 'application/wasm')
  assert.equal(WebAssembly.validate(await wasm.arrayBuffer()), true)
  assert.equal(await (await fetch(`${host.baseUrl}/canvaskit/canvaskit.js`)).text(), 'canvas fixture')
  assert.equal((await fetch(`${host.baseUrl}/assets/iconify-catalog-brands.json`)).status, 200)
  for (const path of ['/pkg/..%2fsecret.txt', '/pkg/%2e%2e%2fsecret.txt', '/pkg/leak.txt', '/pkg/%00.js']) {
    const response = await fetch(`${host.baseUrl}${path}`)
    assert.ok(response.status >= 400, path)
    assert.ok(!(await response.text()).includes('not public'), path)
  }
})

test('browser bootstrap preserves the bound document and refuses credential persistence', async context => {
  const document = { version: '0.8.5', children: [], name: 'bound document' }
  const host = await fixture(context, { document })
  const health = await (await fetch(`${host.baseUrl}/api/mcp/server`)).json()
  assert.equal(health.running, true)
  assert.equal(health.serveMode, 'managed')
  assert.equal(health.port, Number(new URL(host.baseUrl).port))
  const reset = await fetch(`${host.baseUrl}/api/mcp/sync-reset`, write({}))
  assert.equal(reset.status, 200)
  assert.deepEqual(await reset.json(), { ok: true, skipped: true, version: 0 })
  assert.deepEqual((await (await fetch(`${host.baseUrl}/api/mcp/document`)).json()).document, document)
  assert.deepEqual(await (await fetch(`${host.baseUrl}/api/settings/credential-policy`)).json(), { serverPersistence: false })
  assert.deepEqual(await (await fetch(`${host.baseUrl}/api/ai/models`)).json(), [])
  assert.equal((await fetch(`${host.baseUrl}/api/settings/credentials`, write({ apiKey: 'test-value' }))).status, 404)
})