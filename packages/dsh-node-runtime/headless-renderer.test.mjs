import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { existsSync } from 'node:fs'
import test from 'node:test'
import { HeadlessRenderer, findChrome, headlessArguments } from './headless-renderer.mjs'

test('findChrome honours DSH_CHROME_PATH, then platform locations, then PATH', () => {
  const exists = path => path === '/custom/chrome' || path.includes('Google Chrome.app')
  assert.equal(findChrome({ env: { DSH_CHROME_PATH: '/custom/chrome' }, platform: 'darwin', exists }), '/custom/chrome')
  assert.equal(findChrome({ env: { DSH_CHROME_PATH: '/missing' }, platform: 'darwin', exists }), null)
  assert.match(findChrome({ env: {}, platform: 'darwin', exists }), /Google Chrome\.app/)
  assert.equal(findChrome({ env: {}, platform: 'linux', exists, which: cmd => cmd === 'chromium' ? '/usr/bin/chromium' : null }), '/usr/bin/chromium')
  assert.equal(findChrome({ env: {}, platform: 'linux', exists, which: () => null }), null)
})

test('headless arguments open the render-only editor in an isolated profile', () => {
  const args = headlessArguments('http://127.0.0.1:9/?renderer=headless', '/tmp/profile')
  assert.ok(args.includes('--headless=new'))
  assert.ok(args.includes('--user-data-dir=/tmp/profile'))
  assert.equal(args.at(-1), 'http://127.0.0.1:9/?renderer=headless')
})

function fakeSpawn(calls) {
  return (command, args) => {
    const child = new EventEmitter()
    child.exitCode = null
    child.kill = () => { child.exitCode = 0; child.emit('exit', 0) }
    calls.push({ command, args, child })
    return child
  }
}

test('the renderer starts once, stops when idle and cleans its profile', async () => {
  const calls = []
  const renderer = new HeadlessRenderer({ baseUrl: 'http://127.0.0.1:9', chromePath: '/bin/chrome', idleMs: 30, spawnImpl: fakeSpawn(calls) })
  assert.deepEqual(await renderer.ensure(), { ok: true, started: true })
  assert.deepEqual(await renderer.ensure(), { ok: true, started: false })
  assert.equal(calls.length, 1)
  const profile = calls[0].args.find(arg => arg.startsWith('--user-data-dir=')).slice('--user-data-dir='.length)
  assert.ok(existsSync(profile))
  await new Promise(resolve => setTimeout(resolve, 80))
  assert.equal(renderer.running, false)
  assert.equal(existsSync(profile), false)
  await renderer.close()
  assert.equal((await renderer.ensure()).ok, false)
})

test('without a browser the renderer reports why', async () => {
  const renderer = new HeadlessRenderer({ baseUrl: 'http://127.0.0.1:9', chromePath: null })
  assert.equal(renderer.available, false)
  assert.match((await renderer.ensure()).reason, /DSH_CHROME_PATH/)
})
