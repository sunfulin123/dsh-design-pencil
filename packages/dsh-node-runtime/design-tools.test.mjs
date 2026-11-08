import assert from 'node:assert/strict'
import test from 'node:test'
import { deflateRawSync } from 'node:zlib'
import { EngineSession } from './engine-session.mjs'

function session() {
  return new EngineSession({
    version: '0.8.5',
    children: [
      { type: 'rectangle', id: 'source', width: 100, height: 50,
        fill: [{ type: 'solid', color: '#123456' }] },
      { type: 'rectangle', id: 'target', x: 200, width: 20, height: 20 },
      { type: 'text', id: 'text', content: 'Hello' },
    ],
  })
}

function call(session, name, args) {
  const result = session.callTool(name, args)
  assert.equal(result.isError, false, JSON.stringify(result))
  return result.structuredContent
}

test('property clipboard is transient and paste is reversible', () => {
  const engine = session()
  try {
    const before = engine.snapshot()
    call(engine, 'copy_properties', { sourceId: 'source' })
    assert.equal(engine.snapshot().version, before.version)
    call(engine, 'paste_properties', { nodeIds: ['target'] })
    assert.deepEqual(engine.snapshot().document.children[1].fill, before.document.children[0].fill)
    call(engine, 'undo', {})
    assert.deepEqual(engine.snapshot().document.children, before.document.children)
  } finally {
    engine.close()
  }
})

test('active Behaviour tools persist, undo and reject invalid bindings atomically', () => {
  const engine = new EngineSession({
    version: '0.8.5',
    children: [{ type: 'frame', id: 'toggle', reusable: true, width: 120, height: 40,
      children: [{ type: 'rectangle', id: 'indicator', hidden: true, width: 20, height: 20 }] }],
  })
  try {
    call(engine, 'add_component_property', {
      componentId: 'toggle', name: 'checked', kind: 'boolean', targetId: 'indicator', default: false,
    })
    const before = engine.snapshot().document
    const behaviour = {
      kind: 'checkbox', defaultValue: false, stateBindings: [{ type: 'property', propertyId: 'checked' }],
    }
    call(engine, 'set_component_behaviour', { componentId: 'toggle', behaviour })
    const inspected = call(engine, 'get_component_behaviour', { componentId: 'toggle' })
    assert.deepEqual(inspected.behaviour, behaviour)
    assert.equal(inspected.executable, true)
    const saved = engine.snapshot().document
    call(engine, 'undo', {})
    assert.deepEqual(engine.snapshot().document, before)
    call(engine, 'redo', {})
    assert.deepEqual(engine.snapshot().document, saved)
    const reopened = new EngineSession(saved)
    try {
      assert.deepEqual(call(reopened, 'get_component_behaviour', { componentId: 'toggle' }), inspected)
      const rejected = reopened.callTool('set_component_behaviour', {
        componentId: 'toggle', behaviour: {
          kind: 'checkbox', stateBindings: [{ type: 'property', propertyId: 'missing' }],
        },
      })
      assert.equal(rejected.isError, true)
      assert.deepEqual(reopened.snapshot().document, saved)
    } finally {
      reopened.close()
    }
  } finally {
    engine.close()
  }
})

test('shared styles survive reopen and deleting the last style removes its definition', () => {
  const engine = session()
  try {
    call(engine, 'create_style', { id: 'brand',
      style: { name: 'Brand', kind: 'paint', properties: { fill: [{ type: 'solid', color: '#ff0000' }] } } })
    call(engine, 'apply_style', { id: 'brand', nodeIds: ['source', 'target'] })
    const saved = engine.snapshot()
    assert.ok(saved.document.sharedStyles.brand)
    const reopened = new EngineSession(saved.document)
    try {
      call(reopened, 'update_style', { id: 'brand',
        style: { name: 'Brand', kind: 'paint', properties: { fill: [{ type: 'solid', color: '#00ff00' }] } } })
      assert.equal(reopened.snapshot().document.children[0].fill[0].color, '#00ff00')
      assert.equal(reopened.snapshot().document.children[1].fill[0].color, '#00ff00')
      call(reopened, 'delete_style', { id: 'brand' })
      assert.equal(reopened.snapshot().document.sharedStyles?.brand, undefined)
      assert.equal(reopened.snapshot().document.children[1].fill[0].color, '#00ff00')
      call(reopened, 'undo', {})
      assert.ok(reopened.snapshot().document.sharedStyles?.brand)
      call(reopened, 'redo', {})
      assert.equal(reopened.snapshot().document.sharedStyles?.brand, undefined)
    } finally {
      reopened.close()
    }
  } finally {
    engine.close()
  }
})

test('Markdown text is rendered data and invalid ranges preserve the document', () => {
  const engine = session()
  try {
    call(engine, 'set_node_text', { node_id: 'text', text: '**Bold** and plain', markdown: true })
    const saved = engine.snapshot()
    assert.ok(Array.isArray(saved.document.children[2].content))
    assert.ok(saved.document.children[2].content.some(run => run.fontWeight === 700))
    const result = engine.callTool('set_text_style', { nodeId: 'text', start: 0, end: 1000, style: { fontWeight: 700 } })
    assert.equal(result.isError, true)
    assert.deepEqual(engine.snapshot(), saved)
  } finally {
    engine.close()
  }
})

test('deterministic code export is discoverable, scoped and read-only', () => {
  const engine = session()
  try {
    const before = engine.snapshot()
    const tools = call(engine, 'tool_search', { query: 'export_code' }).tools
    assert.ok(tools.some(tool => tool.name === 'export_code'))
    const exported = call(engine, 'export_code', { format: 'html-css', nodeIds: ['text'] })
    assert.equal(exported.format, 'html-css')
    assert.deepEqual(exported.nodeIds, ['text'])
    assert.ok(exported.code.includes('Hello'))
    assert.ok(!exported.code.includes('123456'))
    assert.deepEqual(engine.snapshot(), before)
    for (const args of [
      { format: 'missing' },
      { format: 'html-css', nodeIds: ['missing'] },
      { format: 'html-css', nodeIds: [] },
      { format: 'html-css', nodeIds: 'text' },
      { format: 'html-css', nodeIds: ['text', 'text'] },
      { format: 'html-css', nodeIds: ['', 'text'] },
    ]) {
      assert.equal(engine.callTool('export_code', args).isError, true)
      assert.deepEqual(engine.snapshot(), before)
    }
  } finally {
    engine.close()
  }
})

test('saved viewport reopens without adding content revisions or resurrecting a reset view', () => {
  const engine = session()
  try {
    const before = engine.snapshot()
    call(engine, 'set_viewport', { pan_x: '123', pan_y: '-45', zoom_percent: '125' })
    const view = call(engine, 'get_viewport', {})
    assert.equal(view.zoom_percent, '125')
    assert.equal(engine.snapshot().version, before.version)
    const saved = engine.snapshot().document
    assert.ok(saved.editorMeta.viewport)
    const reopened = new EngineSession(saved)
    try {
      assert.deepEqual(call(reopened, 'get_viewport', {}), view)
      call(reopened, 'set_viewport', { pan_x: '0', pan_y: '0', zoom_percent: '100' })
      const reset = new EngineSession(reopened.snapshot().document)
      try {
        assert.deepEqual(call(reset, 'get_viewport', {}), {
          pan_x: '0', pan_y: '0', zoom_percent: '100',
        })
      } finally {
        reset.close()
      }
    } finally {
      reopened.close()
    }
  } finally {
    engine.close()
  }
})

test('extended bindings and global/page modes persist without resurrecting cleared global overrides', () => {
  const engine = new EngineSession({
    version: '0.8.5', children: [],
    pages: [{ id: 'p1', name: 'Page', children: [
      { type: 'text', id: 'label', content: 'Initial' },
    ] }],
    themes: { Mode: ['Light', 'Dark'] },
    variables: {
      show: { type: 'boolean', value: true },
      size: { type: 'number', value: 32 },
    },
  })
  try {
    call(engine, 'bind_variable', { nodeIds: ['label'], property: 'visible', variable: 'show' })
    call(engine, 'bind_variable', { nodeIds: ['label'], property: 'fontSize', variable: 'size' })
    call(engine, 'set_variable_mode', { scope: 'global', modes: { Mode: 'Dark' } })
    assert.equal(call(engine, 'get_variable_mode', { scope: 'node', nodeId: 'label' }).resolved.Mode, 'Dark')
    call(engine, 'set_variable_mode', { scope: 'page', pageId: 'p1', modes: { Mode: 'Light' } })
    const light = engine.snapshot().document
    call(engine, 'set_variable_mode', { scope: 'page', pageId: 'p1', modes: { Mode: 'auto' } })
    assert.equal(call(engine, 'get_variable_mode', { scope: 'node', nodeId: 'label' }).resolved.Mode, 'Dark')
    call(engine, 'undo', {})
    assert.deepEqual(engine.snapshot().document, light)
    call(engine, 'redo', {})
    call(engine, 'set_variable_mode', { scope: 'global', modes: {} })
    assert.equal(Object.hasOwn(engine.snapshot().document, 'theme'), false)
    const reopened = new EngineSession(engine.snapshot().document)
    try {
      assert.equal(call(reopened, 'get_variable_mode', { scope: 'node', nodeId: 'label' }).resolved.Mode, 'Light')
      assert.ok(reopened.snapshot().document.pages[0].children[0].variableBindings)
    } finally {
      reopened.close()
    }
  } finally {
    engine.close()
  }
})

test('deleting styled nodes updates memberships in the same undo transaction', () => {
  const engine = session()
  try {
    call(engine, 'create_style', { id: 'brand',
      style: { name: 'Brand', kind: 'paint', properties: { fill: [{ type: 'solid', color: '#ff0000' }] } } })
    call(engine, 'apply_style', { id: 'brand', nodeIds: ['source', 'target'] })
    const before = engine.snapshot().document
    call(engine, 'delete_node', { node_id: 'source' })
    assert.deepEqual(engine.snapshot().document.sharedStyles.brand.nodeIds, ['target'])
    call(engine, 'undo', {})
    assert.deepEqual(engine.snapshot().document, before)
    call(engine, 'redo', {})
    call(engine, 'update_style', { id: 'brand',
      style: { name: 'Brand', kind: 'paint', properties: { fill: [{ type: 'solid', color: '#00ff00' }] } } })
    assert.equal(engine.snapshot().document.children[0].fill[0].color, '#00ff00')
  } finally {
    engine.close()
  }
})

test('compressed draw.io imports editable geometry and undoes once', () => {
  const engine = session()
  try {
    const graph = '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>' +
      '<mxCell id="box" value="Compressed input" vertex="1" parent="1">' +
      '<mxGeometry x="0" y="0" width="100" height="50" as="geometry"/>' +
      '</mxCell></root></mxGraphModel>'
    const payload = deflateRawSync(Buffer.from(encodeURIComponent(graph))).toString('base64')
    const before = engine.snapshot().document
    call(engine, 'import_drawio', { xml: `<mxfile><diagram id="one">${payload}</diagram></mxfile>` })
    const imported = JSON.stringify(engine.snapshot().document)
    assert.ok(imported.includes('Compressed input'))
    assert.ok(imported.includes('"type":"text"'))
    call(engine, 'undo', {})
    assert.deepEqual(engine.snapshot().document.children, before.children)
  } finally {
    engine.close()
  }
})
