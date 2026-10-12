import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execute = promisify(execFile)
const script = fileURLToPath(new URL('./check-dsh-runtime.mjs', import.meta.url))
const version = '0.8.5-synapse.2'
const hash = value => createHash('sha256').update(value).digest('hex')

async function fixture(context, options = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-runtime-check-test-'))
  context.after(() => rm(directory, { recursive: true, force: true }))
  const root = join(directory, 'runtime')
  const daemon = `#!/usr/bin/env node
const { createServer } = require('node:http')
const server = createServer(async (request, response) => {
  let result = {}
  if (request.headers.origin === 'https://invalid.example') response.statusCode = 403
  else if (request.url === '/mcp') {
    let input = ''
    for await (const chunk of request) input += chunk
    const body = JSON.parse(input)
    result = { jsonrpc: '2.0', id: body.id, result: body.method === 'tools/list'
      ? { tools: [{ name: 'get_document_info' }${options.aiTool ? ", { name: 'run_design_agent' }" : ''}] }
      : { content: [{ type: 'text', text: 'document' }] } }
  } else response.statusCode = 404
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(result))
})
server.listen(0, '127.0.0.1', () => console.log(JSON.stringify({
  ok: true, port: server.address().port, token: 'a'.repeat(32),
  version: ${JSON.stringify(options.version ?? version)}
})))
process.stdin.resume()
process.stdin.on('end', () => server.close(() => process.exit(0)))
`
  const payload = {
    'bin/op-host-web-server': daemon,
    'bin/web-bundle/editor.wasm': 'wasm-fixture',
    'bin/web-bundle/editor.js': 'editor-fixture',
    'viewer-assets/viewer.wasm': 'wasm-fixture',
    'viewer-assets/viewer.js': 'viewer-fixture',
    'resources/skill.json': '{}',
    LICENSE: 'license-fixture',
  }
  for (const [path, content] of Object.entries(payload)) {
    await mkdir(dirname(join(root, path)), { recursive: true })
    await writeFile(join(root, path), content)
  }
  await chmod(join(root, 'bin/op-host-web-server'), 0o755)
  await writeFile(join(root, 'openpencil-runtime.json'), JSON.stringify({
    schemaVersion: 1, platform: 'darwin-arm64',
    packageName: '@sunfulin123/dsh-design-pencil-darwin-arm64',
    accountPolicy: 'disabled', openPencilVersion: version, openPencilRevision: 'a'.repeat(40),
    files: Object.fromEntries(Object.entries(payload).map(([path, content]) => [path, hash(content)])),
  }))
  await writeFile(root + '.tar.gz', 'archive-fixture')
  await writeFile(root + '.tar.gz.sha256', hash('archive-fixture') + '  runtime.tar.gz\n')
  return { root, run: () => execute(process.execPath, [script, root], {
    env: { ...process.env, OPENPENCIL_DSH_RUNTIME_VERSION: version }, timeout: 90_000,
  }) }
}

test('verifies payload, Node daemon invocation, MCP and normal lease shutdown', async context => {
  const runtime = await fixture(context)
  assert.match((await runtime.run()).stdout, /Node runtime smoke passed/)
})

test('rejects a corrupted payload before starting the daemon', async context => {
  const runtime = await fixture(context)
  await writeFile(join(runtime.root, 'LICENSE'), 'corrupted')
  await assert.rejects(runtime.run(), /Payload checksum: LICENSE/)
})

test('rejects a corrupted archive', async context => {
  const runtime = await fixture(context)
  await writeFile(runtime.root + '.tar.gz', 'corrupted')
  await assert.rejects(runtime.run(), /Archive checksum/)
})

test('rejects an incorrect daemon version and cleans up the child', async context => {
  const runtime = await fixture(context, { version: 'wrong-version' })
  await assert.rejects(runtime.run(), /wrong-version/)
})

test('rejects standalone AI tools in managed discovery', async context => {
  const runtime = await fixture(context, { aiTool: true })
  await assert.rejects(runtime.run(), /run_design_agent/)
})