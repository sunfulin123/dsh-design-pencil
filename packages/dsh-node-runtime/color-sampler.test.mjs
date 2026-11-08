import assert from 'node:assert/strict'
import test from 'node:test'
import { ColorSampler } from './color-sampler.mjs'

test('color sampling requires an actual renderer response and preserves RGBA8 precision', async context => {
  const sampler = new ColorSampler()
  context.after(() => sampler.close())
  const result = sampler.sample({ x: 100.5, y: -20.25 }, 7)
  const [request] = sampler.pending()
  assert.deepEqual(request.args, { x: 100.5, y: -20.25 })
  sampler.complete({ id: request.id, version: 7, x: 100.5, y: -20.25, rgba: [239, 68, 68, 255] }, 7)
  assert.deepEqual((await result).structuredContent, {
    source: 'canvaskit', version: 7, x: 100.5, y: -20.25, rgba: [239, 68, 68, 255], hex: '#ef4444',
  })
  assert.deepEqual(sampler.pending(), [])
})

test('node-center samples preserve alpha and do not expose mutable queued arguments', async context => {
  const sampler = new ColorSampler()
  context.after(() => sampler.close())
  const args = { nodeId: 'target' }
  const result = sampler.sample(args, 0)
  args.nodeId = 'different'
  const [request] = sampler.pending()
  sampler.pending()[0].args.nodeId = 'different'
  sampler.complete({ id: request.id, version: 0, nodeId: 'target', x: 10, y: 20, rgba: [0, 32, 255, 128] }, 0)
  assert.equal((await result).structuredContent.hex, '#0020ff80')
})

test('invalid sampling inputs fail explicitly without enqueuing renderer work', async context => {
  const sampler = new ColorSampler()
  context.after(() => sampler.close())
  for (const args of [
    null, [], {}, { x: 0 }, { x: '0', y: 1 }, { x: Infinity, y: 0 },
    { nodeId: '' }, { nodeId: 'a', x: 0 }, { x: 1, y: 1, extra: true },
  ]) {
    const result = await sampler.sample(args, 0)
    assert.equal(result.isError, true)
    assert.ok(result.content[0].text)
    assert.deepEqual(sampler.pending(), [])
  }
})

test('stale versions cannot report success and expired responses are rejected', async context => {
  const sampler = new ColorSampler()
  context.after(() => sampler.close())
  const result = sampler.sample({ x: 0, y: 0 }, 3)
  const [request] = sampler.pending()
  sampler.complete({ id: request.id, version: 3, x: 0, y: 0, rgba: [0, 0, 0, 255] }, 4)
  assert.equal((await result).isError, true)
  assert.throws(() => sampler.complete({ id: request.id }, 4), /Unknown or expired/)
})

test('malformed pixel data or a mismatched point fails instead of returning a guessed color', async context => {
  const sampler = new ColorSampler()
  context.after(() => sampler.close())
  for (const extra of [
    { rgba: [0, 0, 0] }, { rgba: [0, 0, 0, 256] }, { rgba: [0, 0, 0, 1.5] }, { x: 2 },
  ]) {
    const result = sampler.sample({ x: 1, y: 1 }, 0)
    const [request] = sampler.pending()
    assert.throws(() => sampler.complete({
      id: request.id, version: 0, x: 1, y: 1, rgba: [0, 0, 0, 255], ...extra,
    }, 0))
    assert.equal((await result).isError, true)
  }
})

test('renderer errors, timeouts and host shutdown surface actionable failures', async () => {
  const sampler = new ColorSampler({ timeoutMs: 20 })
  const result = sampler.sample({ nodeId: 'hidden' }, 0)
  const [request] = sampler.pending()
  sampler.complete({ id: request.id, version: 0, error: 'Point is outside the visible canvas' }, 0)
  assert.match((await result).content[0].text, /outside the visible canvas/)
  const timedOut = await sampler.sample({ x: 0, y: 0 }, 0)
  assert.equal(timedOut.isError, true)
  assert.match(timedOut.content[0].text, /open a synchronized CanvasKit editor/)
  const closed = sampler.sample({ x: 0, y: 0 }, 0)
  sampler.close()
  assert.equal((await closed).isError, true)
  assert.equal((await sampler.sample({ x: 0, y: 0 }, 0)).isError, true)
})
