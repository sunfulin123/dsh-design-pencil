import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { existsSync } from 'node:fs'
import test from 'node:test'
import { HeadlessRenderer, findChrome, headlessArguments } from './headless-renderer.mjs'
import { captureScreenshot } from './host-render-tools.mjs'
import { ScreenshotRenderer } from './screenshot-renderer.mjs'

test('findChrome honours DSH_CHROME_PATH, then platform locations, then PATH', () => {
  const exists = path => path === '/custom/chrome' || path.includes('Google Chrome.app')
  assert.equal(findChrome({ env: { DSH_CHROME_PATH: '/custom/chrome' }, platform: 'darwin', exists }), '/custom/chrome')
  assert.equal(findChrome({ env: { DSH_CHROME_PATH: '/missing' }, platform: 'darwin', exists }), null)
  assert.match(findChrome({ env: {}, platform: 'darwin', exists }), /Google Chrome\.app/)
  assert.equal(findChrome({ env: {}, platform: 'linux', exists, which: cmd => cmd === 'chromium' ? '/usr/bin/chromium' : null }), '/usr/bin/chromium')
  assert.equal(findChrome({ env: {}, platform: 'linux', exists, which: () => null }), null)
})

test('headless arguments open the render-only editor in an isolated profile and avoid macOS SwiftShader unless forced', () => {
  const macArgs = headlessArguments('http://127.0.0.1:9/?renderer=headless', '/tmp/profile', { platform: 'darwin', env: {} })
  assert.ok(macArgs.includes('--headless=new'))
  assert.ok(macArgs.includes('--user-data-dir=/tmp/profile'))
  assert.equal(macArgs.includes('--use-angle=swiftshader'), false)
  assert.equal(macArgs.includes('--enable-unsafe-swiftshader'), false)
  assert.equal(macArgs.at(-1), 'http://127.0.0.1:9/?renderer=headless')

  const forcedMacArgs = headlessArguments('http://127.0.0.1:9/?renderer=headless', '/tmp/profile', {
    platform: 'darwin',
    env: { OPENPENCIL_FORCE_SWIFTSHADER: '1', OPENPENCIL_CHROME_NO_SANDBOX: '1' },
  })
  assert.ok(forcedMacArgs.includes('--use-angle=swiftshader'))
  assert.ok(forcedMacArgs.includes('--no-sandbox'))

  const linuxArgs = headlessArguments('http://127.0.0.1:9/?renderer=headless', '/tmp/profile', { platform: 'linux', env: {} })
  assert.ok(linuxArgs.includes('--use-angle=swiftshader'))
  assert.ok(linuxArgs.includes('--enable-unsafe-swiftshader'))
})

function fakeSpawn(calls) {
  return (command, args) => {
    const child = new EventEmitter()
    child.stderr = new EventEmitter()
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

test('captureScreenshot restarts an unresponsive headless Chrome after startup grace expires', async context => {
  const calls = []
  let now = 10_000
  const headless = new HeadlessRenderer({
    baseUrl: 'http://127.0.0.1:9',
    chromePath: '/bin/chrome',
    idleMs: 300_000,
    startupGraceMs: 15_000,
    now: () => now,
    spawnImpl: fakeSpawn(calls),
  })
  const screenshots = new ScreenshotRenderer({ timeoutMs: 30, coldTimeoutMs: 30, now: () => now })
  context.after(async () => {
    screenshots.close()
    await headless.close()
  })
  const session = { version: () => 1, callTool: () => { throw new Error('unexpected approximate fallback') } }

  // Initial cold start launches browser #1 (timed out because fake child never polls).
  const firstShot = await captureScreenshot({ screenshots, headless }, session, {})
  assert.equal(firstShot.isError, true)
  assert.equal(calls.length, 1)
  const firstProfile = calls[0].args.find(arg => arg.startsWith('--user-data-dir=')).slice('--user-data-dir='.length)

  // Within startupGraceMs, ensure() does not thrash-restart browser #1.
  now += 5_000
  await headless.ensure({ connected: false })
  assert.equal(calls.length, 1)

  // Once startupGraceMs has elapsed and headless still has not polled, captureScreenshot restarts Chrome with a fresh profile.
  now += 15_000
  const secondPromise = captureScreenshot({ screenshots, headless }, session, {})
  await new Promise(resolve => setTimeout(resolve, 10))
  assert.equal(calls.length, 2, 'stuck headless Chrome must be restarted')
  assert.equal(existsSync(firstProfile), false, 'stuck profile directory must be cleaned up on restart')
  await secondPromise
})

test('HeadlessRenderer immediately restarts with --no-sandbox when Chrome stderr reports nested sandbox init failure', async context => {
  const calls = []
  const headless = new HeadlessRenderer({
    baseUrl: 'http://127.0.0.1:9',
    chromePath: '/bin/chrome',
    idleMs: 300_000,
    spawnImpl: fakeSpawn(calls),
  })
  context.after(() => headless.close())

  await headless.ensure()
  assert.equal(calls.length, 1)
  assert.equal(calls[0].args.includes('--no-sandbox'), false)
  const firstProfile = calls[0].args.find(arg => arg.startsWith('--user-data-dir=')).slice('--user-data-dir='.length)

  calls[0].child.stderr.emit('data', Buffer.from('sandbox initialization failed: Operation not permitted\naperitif: Failed to initialize sandbox\n'))
  await new Promise(resolve => setTimeout(resolve, 60))

  assert.equal(calls.length, 2, 'expected immediate restart after nested sandbox stderr')
  assert.equal(calls[1].args.includes('--no-sandbox'), true, 'restarted Chrome must include --no-sandbox')
  assert.equal(existsSync(firstProfile), false, 'first profile directory must be cleaned up')
})
