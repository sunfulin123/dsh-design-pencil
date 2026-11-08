import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'
import test from 'node:test'
import { compareFigmaFidelity } from './figma-fidelity.mjs'
import { solidPng } from './png-fixture.test-helper.mjs'

test('fidelity comparison measures actual PNG differences and never passes unavailable screenshots', async t => {
  const png = solidPng(8, 8)
  const server = createServer((req, res) => {
    if (req.url.startsWith('/v1/files/')) {
      return res.end(JSON.stringify({ nodes: { '1:1': { document: {
        id: '1:1', name: 'Root', absoluteBoundingBox: { x: 5568, y: 11947, width: 8, height: 8 },
      } } } }))
    }
    if (req.url.startsWith('/v1/images/')) return res.end(JSON.stringify({ images: {
      '1:1': `http://127.0.0.1:${server.address().port}/image.png`,
    } }))
    res.end(png)
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  process.env.DSH_FIGMA_API_BASE = `http://127.0.0.1:${server.address().port}`
  t.after(() => { server.closeAllConnections(); server.close(); delete process.env.DSH_FIGMA_API_BASE })
  const args = { url: 'https://www.figma.com/design/KEY/x?node-id=1-1', nodeId: 'n1', figmaToken: 'mock' }
  const helpers = {
    capture: async () => ({ isError: false, content: [{ type: 'image', data: png.toString('base64') }] }),
    layout: () => ({ structuredContent: { layout: [{ id: 'n1', name: 'Root', x: 0, y: 0, width: 8, height: 8 }] } }),
    version: () => 10,
  }
  const result = await compareFigmaFidelity(args, helpers)
  assert.equal(result.structuredContent.visual.ratio, 0)
  assert.equal(result.structuredContent.verified, true)
  const unavailable = await compareFigmaFidelity(args, {
    ...helpers, capture: async () => ({ isError: true, content: [{ type: 'text', text: 'Editor is closed' }] }),
  })
  assert.equal(unavailable.structuredContent.verified, false)
  assert.match(unavailable.structuredContent.visual.reason, /closed/)
  const wrong = await compareFigmaFidelity(args, {
    ...helpers,
    capture: async () => ({ isError: false, content: [{ type: 'image', data: solidPng(8, 8, [0, 0, 0, 255]).toString('base64') }] }),
  })
  assert.equal(wrong.structuredContent.visual.ratio, 1)
  assert.equal(wrong.structuredContent.verified, false)
})

test('fidelity matches layers by preserved Figma id and reports text parity', async t => {
  const png = solidPng(8, 8)
  const box = (x, y, w, h) => ({ x: 100 + x, y: 100 + y, width: w, height: h })
  const server = createServer((req, res) => {
    if (req.url.startsWith('/v1/files/')) {
      return res.end(JSON.stringify({ nodes: { '1:1': { document: {
        id: '1:1', name: 'Root', type: 'FRAME', absoluteBoundingBox: box(0, 0, 8, 8),
        children: [
          // Same names in a different order: name matching would cross-wire them.
          { id: 'I2:1;3:1', name: 'Label', type: 'TEXT', characters: 'Second', absoluteBoundingBox: box(0, 4, 8, 2) },
          { id: 'I2:1;3:2', name: 'Label', type: 'TEXT', characters: 'First', absoluteBoundingBox: box(0, 0, 8, 2) },
          { id: '4:1', name: 'Icon', type: 'BOOLEAN_OPERATION', absoluteBoundingBox: box(6, 6, 2, 2),
            children: [{ id: '4:2', name: 'Part', type: 'VECTOR', absoluteBoundingBox: box(6, 6, 1, 1) }] },
          { id: '5:1', name: 'Hidden', type: 'TEXT', characters: 'Nope', visible: false, absoluteBoundingBox: box(0, 0, 1, 1) },
        ],
      } } } }))
    }
    if (req.url.startsWith('/v1/images/')) return res.end(JSON.stringify({ images: {
      '1:1': `http://127.0.0.1:${server.address().port}/image.png`,
    } }))
    res.end(png)
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  process.env.DSH_FIGMA_API_BASE = `http://127.0.0.1:${server.address().port}`
  t.after(() => { server.closeAllConnections(); server.close(); delete process.env.DSH_FIGMA_API_BASE })
  const layout = [{ id: 'n1', name: 'Root', x: 0, y: 0, width: 8, height: 8, children: [
    { id: 'a', name: 'Label', x: 0, y: 0, width: 8, height: 2 },
    { id: 'b', name: 'Label', x: 0, y: 4, width: 8, height: 2 },
    { id: 'c', name: 'Icon', x: 6, y: 6, width: 2, height: 2 },
  ] }]
  const document = { children: [{ id: 'n1', type: 'frame', figmaNodeId: '1:1', children: [
    { id: 'a', type: 'text', content: 'First', figmaNodeId: 'I2:1;3:2' },
    { id: 'b', type: 'text', content: 'Second', figmaNodeId: 'I2:1;3:1' },
    { id: 'c', type: 'path', figmaNodeId: '4:1' },
  ] }] }
  const helpers = {
    capture: async () => ({ isError: false, content: [{ type: 'image', data: png.toString('base64') }] }),
    layout: () => ({ structuredContent: { layout } }),
    version: () => 1,
    document: () => document,
  }
  const args = { url: 'https://www.figma.com/design/KEY/x?node-id=1-1', nodeId: 'n1', figmaToken: 'mock' }
  const result = (await compareFigmaFidelity(args, helpers)).structuredContent
  assert.equal(result.matchedBy, 'figmaNodeId')
  assert.deepEqual(result.structural, [], 'id matching avoids name cross-wiring; merged vector parts are not missing')
  assert.equal(result.text.expected, 2, 'hidden source text is excluded')
  assert.equal(result.text.missingCount, 0)
  assert.equal(result.verified, true)

  document.children[0].children[1].content = 'Heading Title'
  const drifted = (await compareFigmaFidelity(args, helpers)).structuredContent
  assert.deepEqual(drifted.text.missing, ['Second'])
  assert.deepEqual(drifted.text.extra, ['Heading Title'])
  assert.equal(drifted.verified, false, 'text drift fails verification even with identical pixels')
})

test('fidelity resolves linked component instances to their Figma layers and texts', async t => {
  const png = solidPng(8, 8)
  const box = (x, y, w, h) => ({ x: 100 + x, y: 100 + y, width: w, height: h })
  const server = createServer((req, res) => {
    if (req.url.startsWith('/v1/files/')) {
      return res.end(JSON.stringify({ nodes: { '2:1': { document: {
        id: '2:1', name: 'Card', type: 'INSTANCE', absoluteBoundingBox: box(0, 0, 8, 8),
        children: [{ id: 'I2:1;8:2', name: 'Title', type: 'TEXT', characters: 'Linked', style: { textCase: 'UPPER' }, absoluteBoundingBox: box(0, 0, 8, 2) }],
      } } } }))
    }
    if (req.url.startsWith('/v1/images/')) return res.end(JSON.stringify({ images: {
      '2:1': `http://127.0.0.1:${server.address().port}/image.png`,
    } }))
    res.end(png)
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  process.env.DSH_FIGMA_API_BASE = `http://127.0.0.1:${server.address().port}`
  t.after(() => { server.closeAllConnections(); server.close(); delete process.env.DSH_FIGMA_API_BASE })
  const document = { children: [], pages: [
    { id: 'p', children: [{ id: 'r', type: 'ref', ref: 'comp', figmaNodeId: '2:1',
      descendants: { title: { content: 'LINKED' } } }] },
    { id: 'components', children: [{ id: 'comp', type: 'frame', reusable: true, figmaNodeId: '1:1', children: [
      { id: 'title', type: 'text', content: 'Default', figmaNodeId: 'I1:1;8:2' },
    ] }] },
  ] }
  const layout = [{ id: 'r', name: 'Card', x: 0, y: 0, width: 8, height: 8, children: [
    { id: 'r__title', name: 'Title', x: 0, y: 0, width: 8, height: 2 },
  ] }]
  const result = (await compareFigmaFidelity(
    { url: 'https://www.figma.com/design/KEY/x?node-id=2-1', nodeId: 'r', figmaToken: 'mock' },
    {
      capture: async () => ({ isError: false, content: [{ type: 'image', data: png.toString('base64') }] }),
      layout: () => ({ structuredContent: { layout } }),
      version: () => 1,
      document: () => document,
    },
  )).structuredContent
  assert.equal(result.matchedBy, 'figmaNodeId')
  assert.deepEqual(result.structural, [])
  assert.equal(result.text.missingCount, 0, 'override text (with Figma textCase applied), not the component default, is compared')
  assert.equal(result.verified, true)
})
