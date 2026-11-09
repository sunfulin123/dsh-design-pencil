import assert from 'node:assert/strict'
import test from 'node:test'
import { solidPng } from './png-fixture.test-helper.mjs'
import { ScreenshotRenderer, pngDimensions, validateScreenshotArguments } from './screenshot-renderer.mjs'

test('screenshots return actual renderer PNG bytes as MCP image content', async context => {
  const renderer = new ScreenshotRenderer()
  context.after(() => renderer.close())
  const result = renderer.capture({ nodeId: 'screen', scale: 2 }, 3)
  const [request] = renderer.pending()
  assert.deepEqual(request.args, { nodeId: 'screen', scale: 2, maxSize: 1600, background: 'canvas' })
  const png = solidPng(4, 2).toString('base64')
  renderer.complete({ id: request.id, version: 3, nodeId: 'screen', width: 4, height: 2, scale: 2, png }, 3)
  const reply = await result
  assert.equal(reply.isError, false)
  assert.deepEqual(reply.content[0], { type: 'image', mimeType: 'image/png', data: png })
  assert.deepEqual(reply.structuredContent, {
    source: 'canvaskit', renderer: 'canvaskit-editor', version: 3, nodeId: 'screen', targetId: 'screen', width: 4, height: 2, scale: 2, background: 'canvas',
  })
  assert.deepEqual(JSON.parse(reply.content[1].text), reply.structuredContent)
  assert.deepEqual(renderer.pending(), [])
})

test('invalid screenshot arguments fail without enqueuing renderer work', async context => {
  const renderer = new ScreenshotRenderer()
  context.after(() => renderer.close())
  for (const args of [
    null, [], { unknown: 1 }, { nodeId: '' }, { nodeId: 3 }, { scale: 0.1 }, { scale: 5 },
    { scale: Number.NaN }, { maxSize: 32 }, { maxSize: 5000 }, { maxSize: 100.5 }, { background: 'white' }, { isolate: 'yes' },
  ]) {
    assert.equal((await renderer.capture(args, 0)).isError, true, JSON.stringify(args))
  }
  assert.equal((await renderer.capture({}, -1)).isError, true)
  assert.deepEqual(renderer.pending(), [])
  assert.deepEqual(validateScreenshotArguments({}), { scale: 1, maxSize: 1600, background: 'canvas' })
  assert.deepEqual(validateScreenshotArguments({ isolate: false }), { scale: 1, maxSize: 1600, background: 'canvas' })
  assert.deepEqual(
    validateScreenshotArguments({ nodeId: 'card', isolate: true }),
    { nodeId: 'card', scale: 1, maxSize: 1600, background: 'canvas', isolate: true },
  )
})

test('stale versions, renderer errors and mismatched PNG data never report success', async context => {
  const renderer = new ScreenshotRenderer()
  context.after(() => renderer.close())
  const stale = renderer.capture({}, 1)
  renderer.complete({ id: renderer.pending()[0].id, version: 1 }, 2)
  assert.match((await stale).content[0].text, /Document changed/)
  assert.throws(() => renderer.complete({ id: 'missing', version: 1 }, 1), /Unknown or expired/)

  const failed = renderer.capture({}, 1)
  renderer.complete({ id: renderer.pending()[0].id, version: 1, error: 'Node is hidden' }, 1)
  assert.match((await failed).content[0].text, /Screenshot failed: Node is hidden/)

  const png = solidPng(4, 2).toString('base64')
  for (const body of [
    { width: 4, height: 2, scale: 1, png: 'not base64!' },
    { width: 4, height: 2, scale: 1, png: Buffer.from('plain text data here, not an image at all').toString('base64') },
    { width: 5, height: 2, scale: 1, png },
    { width: 4, height: 2, scale: 3, png },
    { width: 4, height: 2, scale: 1, png, nodeId: 'other' },
  ]) {
    const result = renderer.capture({}, 1)
    assert.throws(() => renderer.complete({ id: renderer.pending()[0].id, version: 1, ...body }, 1))
    assert.equal((await result).isError, true, JSON.stringify(body))
  }

  const oversized = renderer.capture({ maxSize: 64 }, 1)
  assert.throws(() => renderer.complete({
    id: renderer.pending()[0].id, version: 1, width: 65, height: 1, scale: 1, png: solidPng(65, 1).toString('base64'),
  }, 1), /maxSize/)
  assert.equal((await oversized).isError, true)
})

test('timeouts and host shutdown surface actionable failures', async () => {
  const timed = new ScreenshotRenderer({ timeoutMs: 5 })
  assert.match((await timed.capture({}, 0)).content[0].text, /timed out.*snapshot_layout/)
  timed.close()
  const closing = new ScreenshotRenderer()
  const pending = closing.capture({}, 0)
  closing.close()
  assert.match((await pending).content[0].text, /closed before/)
  assert.match((await closing.capture({}, 0)).content[0].text, /closed/)
  assert.throws(() => new ScreenshotRenderer({ timeoutMs: 0 }))
})

test('PNG header parsing reads IHDR dimensions and rejects other data', () => {
  assert.deepEqual(pngDimensions(solidPng(7, 3)), { width: 7, height: 3 })
  assert.throws(() => pngDimensions(Buffer.from('GIF89a')), /not a PNG/)
})

test('a connected headless renderer takes captures and leases keep them with one client', async () => {
  let now = 1_000
  const renderer = new ScreenshotRenderer({ timeoutMs: 50, now: () => now })
  assert.equal(renderer.connected('headless'), false)
  renderer.pending({ client: 'headless' })
  const capture = renderer.capture({ nodeId: 'screen' }, 3)
  assert.deepEqual(renderer.pending({ client: 'editor' }), [], 'the editor defers to the headless renderer')
  const [request] = renderer.pending({ client: 'headless' })
  assert.equal(request.args.nodeId, 'screen')
  renderer.complete({
    id: request.id, version: 3, nodeId: 'screen', width: 4, height: 2, scale: 1, png: solidPng(4, 2).toString('base64'),
  }, 3)
  assert.equal((await capture).structuredContent.renderer, 'canvaskit-headless')

  const second = renderer.capture({ nodeId: 'screen' }, 3)
  const [claimed] = renderer.pending({ client: 'headless' })
  now += 3_000
  assert.equal(renderer.connected('headless'), false)
  assert.deepEqual(renderer.pending({ client: 'editor' }), [], 'a live lease stays with its client')
  now += 15_000
  const [handedOver] = renderer.pending({ client: 'editor' })
  assert.equal(handedOver.id, claimed.id, 'an expired lease is handed to another client')
  assert.equal((await second).isError, true)
})
