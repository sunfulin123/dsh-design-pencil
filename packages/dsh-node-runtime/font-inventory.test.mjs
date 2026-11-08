import assert from 'node:assert/strict'
import test from 'node:test'
import { collectDocumentFonts } from './font-inventory.mjs'

test('collects distinct primary font faces from text nodes and styled segments', () => {
  const document = {
    children: [],
    pages: [{ children: [{ type: 'frame', children: [
      { type: 'text', fontFamily: 'Roboto, Inter, system-ui, sans-serif', fontWeight: 500, content: 'A' },
      { type: 'text', fontFamily: '"Roboto"', fontWeight: '500', content: 'B' },
      { type: 'text', fontFamily: 'Inter', fontWeight: 'bold', fontStyle: 'italic', content: [
        { text: 'x' }, { text: 'y', fontFamily: 'Roboto Mono', fontWeight: 400 },
      ] },
      { type: 'text', fontFamily: 'system-ui, sans-serif', content: 'generic only' },
      { type: 'rectangle', fontFamily: 'Ignored' },
    ] }] }],
  }
  assert.deepEqual(collectDocumentFonts(document), [
    { family: 'Roboto', weight: 500, italic: false },
    { family: 'Inter', weight: 700, italic: true },
    { family: 'Roboto Mono', weight: 400, italic: true },
  ])
})
