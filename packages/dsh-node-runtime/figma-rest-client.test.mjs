import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'
import test from 'node:test'

import {
  DEFAULT_FIGMA_TIMEOUT_MS,
  FigmaApiError,
  figmaApiBase,
  figmaFetch,
  figmaRequestTimeoutMs,
  parseFigmaWebUrl,
} from './figma-rest-client.mjs'

async function server(handler) {
  const srv = createServer(handler)
  srv.listen(0, '127.0.0.1')
  await once(srv, 'listening')
  return { url: `http://127.0.0.1:${srv.address().port}`, close: () => new Promise(r => { srv.closeAllConnections(); srv.close(r) }) }
}

test('timeout defaults to one minute and is clamped from the environment', () => {
  assert.equal(DEFAULT_FIGMA_TIMEOUT_MS, 60_000)
  assert.equal(figmaRequestTimeoutMs({}), 60_000)
  assert.equal(figmaRequestTimeoutMs({ DSH_FIGMA_TIMEOUT_MS: '120000' }), 120_000)
  assert.equal(figmaRequestTimeoutMs({ DSH_FIGMA_TIMEOUT_MS: '5' }), 10_000)
  assert.equal(figmaRequestTimeoutMs({ DSH_FIGMA_TIMEOUT_MS: '9999999' }), 600_000)
  assert.throws(() => figmaRequestTimeoutMs({ DSH_FIGMA_TIMEOUT_MS: 'nope' }), /finite/)
})

test('api base only accepts https or loopback http', () => {
  assert.equal(figmaApiBase({}), 'https://api.figma.com')
  assert.equal(figmaApiBase({ DSH_FIGMA_API_BASE: 'http://127.0.0.1:9/' }), 'http://127.0.0.1:9')
  assert.throws(() => figmaApiBase({ DSH_FIGMA_API_BASE: 'http://evil.example' }))
})

test('parent links parse into file key and colon node id', () => {
  assert.deepEqual(
    parseFigmaWebUrl('https://www.figma.com/design/MX0Gm7qLop9l1f3NSR3hek/Live---Widgets?node-id=1817-36379&t=x'),
    { fileKey: 'MX0Gm7qLop9l1f3NSR3hek', title: 'Live Widgets', nodeId: '1817:36379' },
  )
})

test('a slow response inside the window succeeds', async t => {
  const mock = await server((req, res) => setTimeout(() => res.end('{"ok":true}'), 150))
  t.after(mock.close)
  assert.deepEqual(await figmaFetch(`${mock.url}/x`, { timeoutMs: 1000 }), { ok: true })
})

test('an unresponsive request surfaces FIGMA_TIMEOUT naming the node', async t => {
  let hits = 0
  const mock = await server(() => { hits += 1 })
  t.after(mock.close)
  await assert.rejects(
    figmaFetch(`${mock.url}/x`, { timeoutMs: 60, nodeId: '1:2', nodeName: 'Widgets' }),
    error => error instanceof FigmaApiError && error.code === 'FIGMA_TIMEOUT'
      && /1:2 \(Widgets\)/.test(error.message) && /async/.test(error.message),
  )
  assert.equal(hits, 2, 'timeouts retry exactly once')
})

test('rate limits honour Retry-After then succeed; auth errors are not retried', async t => {
  let calls = 0
  const mock = await server((req, res) => {
    calls += 1
    if (req.url === '/auth') { res.statusCode = 403; return res.end('no') }
    if (calls === 1) { res.statusCode = 429; res.setHeader('retry-after', '0'); return res.end() }
    res.end('{"n":1}')
  })
  t.after(mock.close)
  const retries = []
  assert.deepEqual(await figmaFetch(`${mock.url}/x`, { onRetry: r => retries.push(r.error.code) }), { n: 1 })
  assert.deepEqual(retries, ['FIGMA_RATE_LIMITED'])
  calls = 0
  await assert.rejects(figmaFetch(`${mock.url}/auth`), { code: 'FIGMA_AUTH' })
  assert.equal(calls, 1)
})

test('oversized responses map to FIGMA_NODE_TOO_LARGE', async t => {
  const mock = await server((req, res) => { res.statusCode = 400; res.end('Request too large') })
  t.after(mock.close)
  await assert.rejects(figmaFetch(`${mock.url}/x`, { nodeId: '9:9' }), { code: 'FIGMA_NODE_TOO_LARGE' })
})
