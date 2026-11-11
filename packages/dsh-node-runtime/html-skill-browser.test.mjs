import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const scripts = new URL('../../crates/op-ai-skills/skills/synapse-design-html/scripts/', import.meta.url)
function run(script, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [fileURLToPath(new URL(script, scripts)), ...args], {
      cwd, env: { ...process.env, SYNAPSE_DESIGN_TASK_DIR: cwd }, stdio: ['ignore', 'pipe', 'pipe'],
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
