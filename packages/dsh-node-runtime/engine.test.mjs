import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const { DesignEngine } = require('./wasm/op_dsh_engine.js')

for (const [action, axis, expected] of [
  ['left', 'x', [0, 0, 0]],
  ['center_h', 'x', [60, 65, 50]],
  ['right', 'x', [120, 130, 100]],
  ['top', 'y', [0, 0, 0]],
  ['center_v', 'y', [55, 50, 60]],
  ['bottom', 'y', [110, 100, 120]],
  ['distribute_h', 'x', [0, 60, 100]],
  ['distribute_v', 'y', [0, 52.5, 120]],
]) {
  test(`MCP ${action} moves eligible nodes and is reversible`, () => {
    const engine = new DesignEngine()
    const call = (name, args = {}) => JSON.parse(engine.call_tool(name, JSON.stringify(args)))
    try {
      engine.load_document(JSON.stringify({ version: '0.8.5', children: [
        { type: 'rectangle', id: 'first', x: 0, y: 0, width: 20, height: 20 },
        { type: 'rectangle', id: 'second', x: 20, y: 40, width: 10, height: 30 },
        { type: 'rectangle', id: 'third', x: 100, y: 120, width: 40, height: 10 },
      ] }))
      assert.equal(call('set_selection_set', { node_ids: 'first,second,third' }).isError, false)
      const before = engine.document_json()
      assert.equal(call('align_selected', { action }).isError, false)
      assert.deepEqual(JSON.parse(engine.document_json()).children.map(node => node[axis]), expected)
      assert.equal(call('get_history_depth').structuredContent.past, '1')
      assert.equal(call('undo').isError, false)
      assert.equal(engine.document_json(), before)
      assert.equal(call('redo').isError, false)
      assert.deepEqual(JSON.parse(engine.document_json()).children.map(node => node[axis]), expected)
    } finally {
      engine.free()
    }
  })
}

test('WASM engine restores the active page and persists editor metadata', () => {
  const engine = new DesignEngine()
  const document = {
    version: '0.8.5', children: [],
    pages: [
      { id: 'one', name: 'One', children: [] },
      { id: 'two', name: 'Two', children: [] },
    ],
    editorMeta: { activePageIndex: 1, preserveAuthoredGeometry: true },
  }
  try {
    engine.load_document(JSON.stringify(document))
    const result = JSON.parse(engine.call_tool('batch_design', JSON.stringify({
      operations: 'frame=I(null, {"type":"frame","name":"active page design"})',
    })))
    assert.equal(result.isError, false)
    const saved = JSON.parse(engine.document_json())
    assert.equal(saved.pages[0].children.length, 0)
    assert.equal(saved.pages[1].children[0].name, 'active page design')
    assert.deepEqual(saved.editorMeta, document.editorMeta)
  } finally {
    engine.free()
  }
})

test('MCP catalog entries all resolve to implemented tools', () => {
  const engine = new DesignEngine()
  try {
    const tools = JSON.parse(engine.tools_json())
    for (const tool of tools) {
      assert.ok(tool.inputSchema.required.every(key => key in tool.inputSchema.properties), tool.name)
      const response = JSON.parse(engine.call_tool(tool.name, '{}'))
      assert.ok(!response.content.some(block => /Unknown tool:/.test(block.text ?? '')), tool.name)
    }
  } finally {
    engine.free()
  }
})

test('MCP patches layout, sizing, stacked fills and effects atomically', () => {
  const engine = new DesignEngine()
  const call = (name, args = {}) => JSON.parse(engine.call_tool(name, JSON.stringify(args)))
  try {
    engine.load_document(JSON.stringify({ version: '0.8.5', children: [
      { type: 'frame', id: 'layout', width: 320, height: 100, layout: 'horizontal', children: [] },
    ] }))
    const before = engine.document_json()
    const patch = {
      layout: 'vertical', gap: 16, padding: [24, 18, 12, 6],
      alignItems: 'center', justifyContent: 'space_between', clipContent: true,
      width: 'fit_content', height: 'fill_container',
      fill: [{ type: 'solid', color: '#123456' }, { type: 'solid', color: '#abcdef', opacity: 0.5 }],
      effects: [{ type: 'blur', radius: 8 }, {
        type: 'shadow', offsetX: 0, offsetY: 4, blur: 12, spread: 2, color: '#00000040',
      }],
    }
    const result = call('update_node', { nodeId: 'layout', data: patch })
    assert.equal(result.isError, false, JSON.stringify(result))
    const node = JSON.parse(engine.document_json()).children[0]
    for (const [key, value] of Object.entries(patch)) assert.deepEqual(node[key], value, key)
    assert.equal(call('get_history_depth').structuredContent.past, '1')
    assert.equal(call('undo').isError, false)
    assert.equal(engine.document_json(), before)
  } finally {
    engine.free()
  }
})

test('MCP rejects ineligible Position actions without document or history changes', () => {
  const engine = new DesignEngine()
  const call = (name, args = {}) => JSON.parse(engine.call_tool(name, JSON.stringify(args)))
  try {
    engine.load_document(JSON.stringify({ version: '0.8.5', children: [
      { type: 'frame', id: 'layout', width: 320, height: 100, layout: 'horizontal', children: [
        { type: 'rectangle', id: 'flow', width: 80, height: 60 },
      ] },
      { type: 'rectangle', id: 'root', x: 100, y: 100, width: 40, height: 40 },
    ] }))
    for (const [node_ids, action] of [
      ['root', 'center_v'], ['root,layout', 'distribute_h'], ['flow', 'center_h'],
    ]) {
      assert.equal(call('set_selection_set', { node_ids }).isError, false)
      const before = engine.document_json()
      assert.equal(call('align_selected', { action }).isError, true)
      assert.equal(engine.document_json(), before)
      assert.equal(call('get_history_depth').structuredContent.past, '0')
    }
    assert.equal(call('align_selected', { action: 'not-an-action' }).isError, true)
  } finally {
    engine.free()
  }
})

test('WASM engine applies original batch design operations without a browser', () => {
  const engine = new DesignEngine()
  try {
    const result = JSON.parse(engine.call_tool('batch_design', JSON.stringify({
      operations: 'frame=I(null, {"type":"frame","name":"DSH WASM smoke","width":96,"height":64})',
    })))
    assert.equal(result.isError, false)
    assert.match(engine.document_json(), /DSH WASM smoke/)
    const snapshot = JSON.parse(engine.call_tool('batch_get', '{}'))
    assert.equal(snapshot.isError, false)
    assert.match(JSON.stringify(snapshot), /DSH WASM smoke/)
  } finally {
    engine.free()
  }
})

test('WASM engine rolls back a rejected batch', () => {
  const engine = new DesignEngine()
  try {
    const before = engine.document_json()
    const result = JSON.parse(engine.call_tool('batch_design', JSON.stringify({
      operations: 'frame=I(null, {"type":"frame","name":"must roll back"})\nX("invalid")',
    })))
    assert.equal(result.structuredContent.applied, false)
    assert.equal(result.structuredContent.errors.length, 1)
    assert.equal(engine.document_json(), before)
  } finally {
    engine.free()
  }
})

test('WASM engine commits mixed commands and keeps their reported ids', () => {
  const engine = new DesignEngine()
  try {
    const result = JSON.parse(engine.call_tool('batch_design', JSON.stringify({
      operations: 'frame=I(null, {"type":"frame","name":"initial","width":96,"height":64})\nU(frame, {"name":"updated"})',
    })))
    assert.equal(result.isError, false)
    assert.equal(result.structuredContent.errors, undefined)
    const document = JSON.parse(engine.document_json())
    assert.equal(document.children.length, 1)
    assert.equal(document.children[0].name, 'updated')
    assert.equal(document.children[0].id, result.structuredContent.results[0].nodeId)
  } finally {
    engine.free()
  }
})

test('WASM engine rejects invalid documents and unknown tools without mutation', () => {
  const engine = new DesignEngine()
  try {
    const before = engine.document_json()
    assert.throws(() => engine.load_document('{"children":"invalid"}'))
    assert.equal(engine.document_json(), before)
    const result = JSON.parse(engine.call_tool('not_a_tool', '{}'))
    assert.equal(result.isError, true)
    assert.equal(engine.document_json(), before)
  } finally {
    engine.free()
  }
})