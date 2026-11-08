import assert from 'node:assert/strict'
import { once } from 'node:events'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { FigmaImportJobs } from './figma-import-jobs.mjs'
import { EngineSession } from './engine-session.mjs'

// Ambient credentials must not leak into these tests.
delete process.env.FIGMA_TOKEN
delete process.env.FIGMA_ACCESS_TOKEN

const KEY = 'FILEKEY123'
const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex')

const frame = (id, name, x, y, w, h, extra = {}) => ({
  id, name, type: 'FRAME',
  absoluteBoundingBox: { x, y, width: w, height: h },
  relativeTransform: [[1, 0, x], [0, 1, y]],
  size: { x: w, y: h },
  ...extra,
})

function figmaFile() {
  const b1 = frame('1:5', 'B1', 1310, 1110, 50, 50)
  const b2 = frame('1:6', 'B2', 1400, 1110, 50, 50)
  const a = frame('1:2', 'A', 1100, 1100, 100, 100)
  const big = frame('1:3', 'Big', 1300, 1100, 300, 300, { children: [b1, b2] })
  const c = frame('1:4', 'C', 1700, 1100, 100, 100, { fills: [{ type: 'IMAGE', imageRef: 'aa11' }] })
  const parent = frame('1:1', 'Board', 1000, 1000, 900, 600, { children: [a, big, c] })
  return { a, big, c, b1, b2, parent }
}

const shallow = node => {
  const { children, ...rest } = node
  return children ? { ...rest, children: children.map(({ children: _, ...child }) => child) } : rest
}

async function mockFigma({ hang = new Set(), rateLimitOnce = new Set(), versionRef = { value: 'v1' } } = {}) {
  const file = figmaFile()
  const byId = new Map([file.a, file.big, file.c, file.b1, file.b2, file.parent].map(n => [n.id, n]))
  const seen = new Map()
  const requests = []
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://x')
    requests.push(`${url.pathname}${url.search}`)
    if (url.pathname === `/v1/files/${KEY}/images`) {
      return res.end(JSON.stringify({ meta: { images: { aa11: `http://127.0.0.1:${server.address().port}/img/aa11` } } }))
    }
    if (url.pathname === '/img/aa11') return res.end(PNG)
    if (url.pathname === `/v1/files/${KEY}/nodes`) {
      if (req.headers['x-figma-token'] !== 'tok') { res.statusCode = 403; return res.end('bad token') }
      const ids = url.searchParams.get('ids').split(',')
      const depth = url.searchParams.get('depth')
      const key = `${ids}|${depth}`
      if (!depth && ids.some(id => hang.has(id))) return
      if (!depth && ids.some(id => rateLimitOnce.has(id)) && !seen.has(key)) {
        seen.set(key, true)
        res.statusCode = 429
        res.setHeader('retry-after', '0')
        return res.end()
      }
      const nodes = Object.fromEntries(ids.filter(id => byId.has(id))
        .map(id => [id, { document: depth ? shallow(byId.get(id)) : byId.get(id) }]))
      return res.end(JSON.stringify({ name: 'Live Widgets', version: versionRef.value, nodes }))
    }
    res.statusCode = 404
    res.end()
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  process.env.DSH_FIGMA_API_BASE = `http://127.0.0.1:${server.address().port}`
  return {
    requests,
    close: () => new Promise(resolve => { server.closeAllConnections(); server.close(resolve) }),
  }
}

function fakeEngine() {
  let counter = 0
  const inserts = []
  const invoke = (name, args) => {
    if (name === 'list_pages') return { isError: false, structuredContent: { activePageIndex: 0, pages: [{id: '0'}] } }
    if (name === 'move_node') return { isError: false, structuredContent: {} }
    assert.equal(name, 'import_figma_rest')
    const body = JSON.parse(args.restJson)
    const docs = Object.values(body.nodes).map(entry => entry.document)
    const b = docs[0].absoluteBoundingBox
    const id = `n${++counter}`
    inserts.push({ id, names: docs.map(d => d.name), hasChildren: Array.isArray(docs[0].children), ...args, restJson: undefined })
    const x = args.x ?? (args.sourceOriginX !== undefined ? b.x - args.sourceOriginX + 400 : 0)
    const y = args.y ?? (args.sourceOriginY !== undefined ? b.y - args.sourceOriginY + 40 : 0)
    return {
      isError: false,
      structuredContent: {
        nodeCount: 1, rootIds: [id], bounds: [x, y, b.width, b.height], sourceBounds: [b.x, b.y, b.width, b.height],
        fonts: [{ family: 'Roboto', weight: 500, italic: false }], warnings: [], unresolvedImageRefs: [],
      },
    }
  }
  return { invoke, inserts }
}

function setup(t, options) {
  const cacheDir = mkdtempSync(join(tmpdir(), 'figma-jobs-'))
  t.after(() => rmSync(cacheDir, { recursive: true, force: true }))
  const engine = fakeEngine()
  const fonts = []
  const jobs = new FigmaImportJobs({ invoke: engine.invoke, cacheDir, requestTimeoutMs: 150, onFonts: f => { fonts.push(...f) }, ...options })
  return { jobs, engine, cacheDir, fonts }
}

const LINK = `https://www.figma.com/design/${KEY}/Live---Widgets?node-id=1-1&t=x`

test('a parent link imports as a shell plus one chunk per board, subdividing oversized boards', async t => {
  const mock = await mockFigma({ hang: new Set(['1:3']), rateLimitOnce: new Set(['1:4']) })
  t.after(mock.close)
  const { jobs, engine, cacheDir, fonts } = setup(t)
  const { job, done } = jobs.start({ url: LINK, figmaToken: 'tok' })
  assert.equal(job.status, 'queued')
  const result = await done
  assert.equal(result.status, 'succeeded', JSON.stringify(result))
  assert.equal(result.failed.length, 0)
  // Shell first, then topmost-first boards; Big is split into its children.
  assert.deepEqual(engine.inserts.map(i => i.names[0]), ['Board', 'C', 'Big', 'B2', 'B1', 'A'])
  const [shell, c, bigShell, b2] = engine.inserts
  assert.equal(shell.hasChildren, false, 'parent is inserted without children')
  assert.equal(c.parent, shell.id)
  assert.equal(JSON.parse(c.sourceParentsJson)[0].id, '1:1', 'parent transform context is preserved')
  assert.equal(b2.parent, bigShell.id)
  assert.deepEqual(JSON.parse(b2.sourceParentsJson).map(n => n.id), ['1:1', '1:3'])
  assert.match(JSON.parse(c.imageUrlsJson).aa11, /^data:image\/png;base64,/)
  assert.ok(result.warnings.some(w => /Big.*too large/.test(w)))
  assert.deepEqual(result.progress, { total: 5, done: 5, failed: 0, current: null })
  assert.ok(fonts.some(f => f.weight === 500))
  assert.ok(existsSync(join(cacheDir, KEY, 'v1', '1_2.json')), 'raw chunk cached')
  assert.equal(jobs.status(job.id).status, 'succeeded')
  assert.equal(jobs.list()[0].id, job.id)
})

test('failed boards are reported with codes and resume retries only them from cache', async t => {
  const hang = new Set(['1:4'])
  const mock = await mockFigma({ hang })
  t.after(mock.close)
  const { jobs, engine } = setup(t)
  const first = await jobs.start({ url: LINK, figmaToken: 'tok' }).done
  assert.equal(first.status, 'partial')
  assert.deepEqual(first.failed.map(f => [f.nodeId, f.code]), [['1:4', 'FIGMA_TIMEOUT']])
  hang.clear()
  const insertsBefore = engine.inserts.length
  const requestsBefore = mock.requests.length
  const resumed = await jobs.resume(first.id, { figmaToken: 'tok' }).done
  assert.equal(resumed.status, 'succeeded')
  assert.deepEqual(engine.inserts.slice(insertsBefore).map(i => i.names[0]), ['C'])
  assert.equal(engine.inserts.at(-1).parent, engine.inserts[0].id, 'resume reuses the original parent')
  const refetched = mock.requests.slice(requestsBefore).filter(r => r.includes('nodes?ids=1%3A2&'))
  assert.equal(refetched.length, 0, 'completed boards are not refetched')
})

test('cancel stops a running job; tokens are required and never persisted', async t => {
  const mock = await mockFigma({ hang: new Set(['1:2', '1:3', '1:4']) })
  t.after(mock.close)
  const { jobs, cacheDir } = setup(t, { requestTimeoutMs: 5_000 })
  const started = jobs.start({ url: LINK, figmaToken: 'tok' })
  await new Promise(resolve => setTimeout(resolve, 100))
  const cancelled = await jobs.cancel(started.job.id)
  assert.equal(cancelled.status, 'cancelled')
  const persisted = JSON.stringify(jobs.status(started.job.id))
  assert.ok(!persisted.includes('tok'))
  assert.throws(() => jobs.start({ url: LINK }), { code: 'FIGMA_AUTH' })
  assert.throws(() => jobs.resume(started.job.id, {}), { code: 'FIGMA_AUTH' })
  assert.throws(() => jobs.start({ url: 'https://example.com/x', figmaToken: 'tok' }), { code: 'FIGMA_BAD_URL' })
  // A fresh manager over the same cache sees the job (host restart).
  const reloaded = new FigmaImportJobs({ invoke: () => { throw new Error('unused') }, cacheDir })
  assert.equal(reloaded.status(started.job.id).status, 'cancelled')
})

test('auth failures and missing nodes fail with explicit codes', async t => {
  const mock = await mockFigma()
  t.after(mock.close)
  const { jobs } = setup(t)
  const denied = await jobs.start({ url: LINK, figmaToken: 'wrong' }).done
  assert.equal(denied.status, 'failed')
  assert.equal(denied.error.code, 'FIGMA_AUTH')
  const missing = await jobs.start({ url: `https://www.figma.com/design/${KEY}/x?node-id=9-9`, figmaToken: 'tok' }).done
  assert.equal(missing.error.code, 'FIGMA_NOT_FOUND')
})

test('nodeIds subsets land at page level around one shared drop point', async t => {
  const mock = await mockFigma()
  t.after(mock.close)
  const { jobs, engine } = setup(t)
  const result = await jobs.start({ url: LINK, figmaToken: 'tok', nodeIds: '1-2,1-4' }).done
  assert.equal(result.status, 'succeeded')
  const [first, second] = engine.inserts
  assert.deepEqual(engine.inserts.map(i => i.names[0]), ['C', 'A'])
  assert.deepEqual([first.sourceOriginX, first.sourceOriginY], [1100, 1100])
  assert.equal(first.parent, undefined)
  // The second board is placed with the translation learned from the first.
  assert.deepEqual([second.x, second.y], [400, 40])
})

test('the node limit stops an import with FIGMA_IMPORT_LIMIT', async t => {
  const mock = await mockFigma()
  t.after(mock.close)
  process.env.DSH_FIGMA_MAX_NODES = '2'
  t.after(() => { delete process.env.DSH_FIGMA_MAX_NODES })
  const { jobs } = setup(t)
  const result = await jobs.start({ url: LINK, figmaToken: 'tok' }).done
  assert.equal(result.error.code, 'FIGMA_IMPORT_LIMIT')
  assert.equal(result.status, 'partial')
})

test('inspect returns an outline for planning', async t => {
  const mock = await mockFigma()
  t.after(mock.close)
  const { jobs } = setup(t)
  const outline = await jobs.inspect({ url: LINK, figmaToken: 'tok' })
  assert.equal(outline.node.name, 'Board')
  assert.equal(outline.node.childCount, 3)
  assert.equal(outline.suggestedChunks, 3)
  assert.deepEqual(outline.node.children.map(c => c.name), ['A', 'Big', 'C'])
})

test('real WASM engine imports a parent without replacing content; fractional offsets and undo survive', async t => {
  const mock = await mockFigma()
  t.after(mock.close)
  const cacheDir = mkdtempSync(join(tmpdir(), 'figma-wasm-'))
  t.after(() => rmSync(cacheDir, { recursive: true, force: true }))
  const session = new EngineSession({
    version: '1', children: [{ id: 'existing', name: 'Existing', type: 'frame', x: 0, y: 0, width: 100, height: 100 }],
  })
  t.after(() => session.close())
  const jobs = new FigmaImportJobs({ invoke: (name, args) => session.callTool(name, args), cacheDir })
  const result = await jobs.start({ url: LINK, figmaToken: 'tok', x: 250.25, y: 12.5 }).done
  assert.equal(result.status, 'succeeded', JSON.stringify(result))
  const roots = session.snapshot().document.children
  assert.ok(roots.some(n => n.id === 'existing'))
  const board = roots.find(n => n.name === 'Board')
  assert.equal(board.x, 250.25)
  assert.equal(board.y, 12.5)
  assert.deepEqual(board.children.map(n => n.name), ['C', 'Big', 'A'])
  assert.equal(board.children.find(n => n.name === 'C').x, 700)
  const undone = session.callTool('undo', {})
  assert.equal(undone.isError, false)
  assert.equal(session.snapshot().document.children.find(n => n.name === 'Board').children.length, 2)
})

  test('a rejected version change stays rejected on repeated resume', async t => {
    const hang = new Set(['1:4'])
    const versionRef = { value: 'v1' }
    const mock = await mockFigma({ hang, versionRef })
    t.after(mock.close)
    const { jobs } = setup(t)
    const first = await jobs.start({ url: LINK, figmaToken: 'tok' }).done
    assert.equal(first.status, 'partial')
    versionRef.value = 'v2'
    hang.clear()
    for (let attempt = 0; attempt < 2; attempt++) {
      const out = await jobs.resume(first.id, { figmaToken: 'tok' }).done
      assert.equal(out.error.code, 'FIGMA_FILE_CHANGED')
      assert.equal(out.version, 'v1')
    }
  })

  test('resumed chunks retain source stacking order in the real engine', async t => {
    const hang = new Set(['1:4'])
    const mock = await mockFigma({ hang })
    t.after(mock.close)
    const cacheDir = mkdtempSync(join(tmpdir(), 'figma-stack-'))
    t.after(() => rmSync(cacheDir, { recursive: true, force: true }))
    const session = new EngineSession({ version: '1', children: [] })
    t.after(() => session.close())
    const jobs = new FigmaImportJobs({
      invoke: (name, args) => session.callTool(name, args), cacheDir, requestTimeoutMs: 100,
    })
    const first = await jobs.start({ url: LINK, figmaToken: 'tok' }).done
    assert.equal(first.status, 'partial')
    hang.clear()
    assert.equal((await jobs.resume(first.id, { figmaToken: 'tok' }).done).status, 'succeeded')
    assert.deepEqual(session.snapshot().document.children[0].children.map(n => n.name), ['C', 'Big', 'A'])
  })

  test('a committed shell is not duplicated after recovery persistence fails', async t => {
    const mock = await mockFigma()
    t.after(mock.close)
    const { jobs, engine } = setup(t, {
      invoke: (() => {
        const fixture = fakeEngine()
        return (name, args) => {
          const out = fixture.invoke(name, args)
          if (name === 'import_figma_rest') out.structuredContent.persistenceError = 'disk full'
          return out
        }
      })(),
    })
    const first = await jobs.start({ url: LINK, figmaToken: 'tok' }).done
    assert.equal(first.error.code, 'FIGMA_DRAFT_WRITE')
    assert.ok(first.rootIds.length > 0, 'applied shell identity is checkpointed')
    assert.equal(first.status, 'failed')
    assert.equal(engine.inserts.length, 0)
  })
