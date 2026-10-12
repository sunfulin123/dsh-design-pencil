import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { lstat, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import { createInterface } from 'node:readline'
import { pathToFileURL } from 'node:url'

async function digest(path) {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(path)) hash.update(chunk)
  return hash.digest('hex')
}

export async function checkRuntime(directory) {
  const root = resolve(directory)
  const manifest = JSON.parse(await readFile(join(root, 'openpencil-runtime.json'), 'utf8'))
  assert.equal(manifest.schemaVersion, 1)
  assert.equal(manifest.platform, 'darwin-arm64')
  assert.equal(manifest.packageName, '@sunfulin123/dsh-design-pencil-darwin-arm64')
  assert.equal(manifest.accountPolicy, 'disabled')
  assert.equal(manifest.openPencilVersion, process.env.OPENPENCIL_DSH_RUNTIME_VERSION)
  assert.match(manifest.openPencilRevision, /^[a-f0-9]{40}$/)
  const paths = Object.keys(manifest.files)
  assert(paths.includes('bin/op-host-web-server'))
  for (const prefix of ['bin/web-bundle/', 'viewer-assets/']) {
    assert(paths.some(path => path.startsWith(prefix) && path.endsWith('.wasm')), `Missing ${prefix}WASM`)
    assert(paths.some(path => path.startsWith(prefix) && path.endsWith('.js')), `Missing ${prefix}JavaScript`)
  }
  assert(paths.some(path => path.startsWith('resources/')))
  assert(paths.includes('LICENSE'))
  for (const [path, expected] of Object.entries(manifest.files)) {
    const full = resolve(root, path)
    assert(full.startsWith(root + sep), `Unsafe manifest path: ${path}`)
    assert((await lstat(full)).isFile(), `Not a regular payload file: ${path}`)
    assert.equal(await digest(full), expected, `Payload checksum: ${path}`)
  }
  const archive = root + '.tar.gz'
  const checksum = (await readFile(archive + '.sha256', 'utf8')).trim().split(/\s+/)[0]
  assert.equal(await digest(archive), checksum, 'Archive checksum')

  const home = await mkdtemp(join(tmpdir(), 'dsh-pencil-smoke-'))
  const origin = 'http://localhost:3000'
  let child
  let exited
  let lines
  let stderr = ''
  const deadline = setTimeout(() => child?.kill('SIGKILL'), 60_000)
  try {
    child = spawn(join(root, 'bin/op-host-web-server'), [
      '--serve-web', '--managed', '--port', '0',
      '--config-root', home, '--allow-origin', origin,
    ], { cwd: root, env: { ...process.env, HOME: home }, stdio: ['pipe', 'pipe', 'pipe'] })
    exited = new Promise((fulfill, reject) => {
      child.once('error', reject)
      child.once('exit', (code, signal) => fulfill({ code, signal }))
    })
    exited.catch(() => {})
    child.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-16_384) })
    lines = createInterface({ input: child.stdout })
    const handshakeLine = new Promise((fulfill, reject) => {
      lines.once('line', fulfill)
      lines.once('close', () => reject(new Error('Daemon exited before handshake')))
    })
    const handshake = JSON.parse(await Promise.race([
      handshakeLine,
      exited.then(() => { throw new Error('Daemon exited before handshake') }),
    ]))
    assert.equal(handshake.ok, true)
    assert.equal(handshake.version, manifest.openPencilVersion)
    assert(Number.isInteger(handshake.port) && handshake.port > 0 && handshake.port <= 65535)
    assert.match(handshake.token, /^[a-f0-9]{32}$/)
    const base = `http://127.0.0.1:${handshake.port}`
    async function request(path, options = {}) {
      return fetch(base + path, {
        ...options,
        headers: { Origin: origin, 'Content-Type': 'application/json', ...options.headers },
        signal: AbortSignal.timeout(15_000),
      })
    }
    async function rpc(method, params = {}) {
      const response = await request('/mcp', {
        method: 'POST', body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      })
      assert.equal(response.status, 200)
      const body = await response.json()
      assert.equal(body.error, undefined, JSON.stringify(body))
      return body.result
    }
    const catalog = await rpc('tools/list')
    const names = catalog.tools.map(tool => tool.name)
    assert(names.includes('get_document_info'))
    for (const name of ['run_design_agent', 'spawn_agents']) assert(!names.includes(name), name)
    const result = await rpc('tools/call', { name: 'get_document_info', arguments: {} })
    assert.notEqual(result.isError, true, JSON.stringify(result))
    assert(result.content.length > 0)
    assert(names.includes('batch_design'))
    const before = await (await request('/api/mcp/document')).json()
    const design = await rpc('tools/call', {
      name: 'batch_design', arguments: {
        script: 'I(null, {type: "frame", name: "DSH runtime smoke", x: 0, y: 0, width: 96, height: 64, fill: "#12a678"});',
      },
    })
    assert.notEqual(design.isError, true, JSON.stringify(design))
    const after = await (await request('/api/mcp/document')).json()
    assert(after.version > before.version, 'Design write must advance document version')
    assert(JSON.stringify(after.document).includes('DSH runtime smoke'), 'Design write must create the frame')
    for (const format of ['png', 'pdf']) {
      const label = format.toUpperCase() + ' export'
      const response = await request('/api/export/' + (format === 'pdf' ? 'pdf' : 'raster'), {
        method: 'POST', body: JSON.stringify({ format, scale: 1 }),
      })
      assert.equal(response.status, 200, label)
      const exported = await response.json()
      assert.equal(exported.ok, true, label)
      assert.equal(exported.mime, format === 'pdf' ? 'application/pdf' : 'image/png', label)
      const bytes = Buffer.from(exported.dataBase64, 'base64')
      if (format === 'png') {
        assert(bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')), label)
        assert(bytes.readUInt32BE(16) > 0 && bytes.readUInt32BE(20) > 0, label)
      } else assert(bytes.length > 100 && bytes.subarray(0, 5).toString() === '%PDF-', label)
    }
    for (const path of ['/api/auth/status', '/api/settings/credential-policy', '/api/ai/models']) {
      const response = await request(path)
      assert.equal(response.status, 404, path)
      await response.arrayBuffer()
    }
    const rejected = await request('/api/mcp/document', { headers: { Origin: 'https://invalid.example' } })
    assert.equal(rejected.status, 403, 'Foreign browser origin must be rejected')
    await rejected.arrayBuffer()
    child.stdin.end()
    const ending = await exited
    assert.equal(ending.signal, null, 'Daemon must exit without a signal')
    assert.equal(ending.code, 0, 'Daemon must exit normally after stdin EOF')
    console.log(`Node runtime smoke passed: ${manifest.openPencilVersion}`)
  } catch (error) {
    throw new Error(`${error.message}\n${stderr}`, { cause: error })
  } finally {
    clearTimeout(deadline)
    lines?.close()
    if (child && child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
    if (exited) await exited.catch(() => {})
    await rm(home, { recursive: true, force: true })
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  assert(process.argv[2], 'Usage: node scripts/check-dsh-runtime.mjs <staged-runtime-directory>')
  await checkRuntime(process.argv[2])
}