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

test('WASM lint keeps peer variants reviewable and permits a deliberate undoable repair', () => {
  const engine = new EngineSession({ version: '0.8.5', children: [
    { type: 'frame', id: 'board', children: [
      { type: 'frame', id: 'a', role: 'button', cornerRadius: 4 },
      { type: 'frame', id: 'b', role: 'button', cornerRadius: 4 },
      { type: 'frame', id: 'c', role: 'button', cornerRadius: 8 },
    ] },
  ] })
  try {
    const before = engine.snapshot().document
    const issue = call(engine, 'lint_document', { rootId: 'board' }).issues.find(item => item.nodeId === 'c')
    assert.equal(issue.severity, 'warning')
    assert.equal(issue.autoFixEligible, false)
    assert.equal(call(engine, 'fix_lint_issues', { issueIds: [issue.issueId] }).fixed, 0)
    assert.deepEqual(engine.snapshot().document, before)
    call(engine, 'update_node', { nodeId: 'c', data: { cornerRadius: 4 } })
    assert.equal(call(engine, 'lint_document', { rootId: 'board' }).issues.some(item => item.nodeId === 'c'), false)
    call(engine, 'undo', {})
    assert.deepEqual(engine.snapshot().document, before)
  } finally { engine.close() }
})

test('WASM exposes independent edge padding beside a peer advisory and can undo its fix', () => {
  const section = (id, padding) => ({ type: 'frame', id, layout: 'vertical', width: 'fill_container', height: 100,
    padding, children: [{ type: 'text', id: `${id}-label`, content: id }] })
  const engine = new EngineSession({ version: '0.8.5', children: [{ type: 'frame', id: 'screen', width: 390, height: 844,
    layout: 'vertical', children: [section('a', 24), section('b', 24), section('c', 0)] }] })
  try {
    const before = engine.snapshot().document
    const lint = call(engine, 'lint_document', { rootId: 'screen' })
    assert.ok(lint.issues.some(issue => issue.nodeId === 'c' && issue.category === 'mixed-sibling-padding' && issue.autoFixEligible === false))
    assert.ok(lint.issues.some(issue => issue.nodeId === 'c' && issue.category === 'edge-section-padding' && issue.autoFixEligible === true))
    assert.equal(call(engine, 'lint_document', { rootId: 'screen', rules: ['edge-section-padding'] }).count, 1)
    assert.equal(call(engine, 'fix_lint_issues', { all: true }).fixed, 1)
    assert.deepEqual(engine.snapshot().document.children[0].children[2].padding, [0, 24, 0, 24])
    call(engine, 'undo', {})
    assert.deepEqual(engine.snapshot().document, before)
  } finally { engine.close() }
})

test('WASM does not let locked null-suggestion advisories block a real repair', () => {
  const bar = (id, x, height, locked = false) => ({ type: 'rectangle', id, x, y: 500, width: 80, height, locked,
    fill: [{ type: 'solid', color: '#ff0000' }] })
  const engine = new EngineSession({ version: '0.8.5', children: [{ type: 'frame', id: 'chart', width: 1920, height: 1080,
    children: [bar('a', 100, 200, true), bar('b', 250, 250), bar('c', 400, 300),
      { type: 'text', id: 'title', content: 'Chart', fontSize: 16, height: 40 }] }] })
  try {
    const before = engine.snapshot().document
    const lint = call(engine, 'lint_document', { rules: ['top-anchored-bars'] })
    assert.equal(lint.issues.length, 3)
    assert.ok(lint.issues.every(issue => issue.suggestedValue === null && issue.autoFixEligible === false))
    assert.equal(call(engine, 'fix_lint_issues', { all: true }).fixed, 1)
    call(engine, 'undo', {})
    assert.deepEqual(engine.snapshot().document, before)
  } finally { engine.close() }
})

test('WASM quality reports token evidence without mutating the document', () => {
  const engine = new EngineSession({ version: '0.8.5',
    variables: { 'body-size': { type: 'number', value: 16 } },
    children: [{ type: 'frame', id: 'board', width: 200, height: 100, children: [
      { type: 'text', id: 'label', content: 'Hello', fontSize: 16 },
      { type: 'text', id: 'other', content: 'Other', fontSize: 17 },
    ] }],
  })
  try {
    const before = engine.snapshot()
    const result = call(engine, 'get_design_quality', { rootId: 'board' })
    assert.equal(result.coverage.tokens.status, 'indeterminate')
    assert.ok(result.tokenObservations.some(item => item.nodeId === 'label' && item.status === 'unbound-match' && item.candidates.includes('body-size')))
    assert.ok(result.tokenObservations.some(item => item.nodeId === 'other' && item.status === 'indeterminate'))
    assert.equal(result.tokenObservationsTruncated, false)
    const limited = call(engine, 'get_design_quality', { rootId: 'board', limit: 1 })
    assert.equal(limited.tokenObservationsTruncated, true)
    assert.equal(limited.truncated, false)
    assert.equal(limited.tokenObservations.length, 1)
    assert.equal(limited.counts.tokenObservations, 2)
    assert.deepEqual(engine.snapshot(), before)
  } finally { engine.close() }
})

test('WASM quality exposes linked target fixes without changing shared components implicitly', () => {
  const engine = new EngineSession({ version: '0.8.5', children: [
    { type: 'frame', id: 'board', width: 400, height: 200, children: [
      { type: 'frame', id: 'master', reusable: true, role: 'button', width: 80, height: 30,
        children: [{ type: 'text', id: 'label', content: 'Save' }] },
      { type: 'ref', id: 'instance', ref: 'master', x: 120 },
    ] },
  ] })
  try {
    const before = engine.snapshot()
    const issue = call(engine, 'get_design_quality', { rootId: 'instance' }).navIssues[0]
    assert.equal(issue.nodeId, 'instance')
    assert.equal(issue.componentId, 'master')
    assert.equal(issue.patchAvailable, false)
    assert.deepEqual(engine.snapshot(), before)
    call(engine, 'update_node', { nodeId: 'master', data: { height: 44 } })
    assert.equal(call(engine, 'get_design_quality', { rootId: 'instance' }).navIssues.length, 0)
    call(engine, 'undo', {})
    assert.equal(call(engine, 'get_design_quality', { rootId: 'instance' }).navIssues.length, 1)
  } finally { engine.close() }
})

test('sandboxed draft scripts create linked reusable components with independent labels', () => {
  const engine = new EngineSession({ version: '0.8.5', children: [] })
  try {
    const result = call(engine, 'batch_design', { script: `
      const board = I(null, {type:'frame', name:'Board', width:400, height:200});
      const master = I(board, {type:'frame', name:'Button', reusable:true, role:'button', width:80, height:44,
        children:[{type:'text', name:'Label', content:'Save'}]});
      I(board, {type:'ref', name:'Linked button', ref:master});
    ` })
    const boardId = result.results[0].nodeId
    const masterId = result.results[1].nodeId
    const refId = result.results[2].nodeId
    const board = engine.snapshot().document.children.find(item => item.id === boardId)
    const master = board.children.find(item => item.id === masterId)
    assert.equal(board.children.find(item => item.id === refId).ref, masterId)
    const labelId = master.children[0].id
    call(engine, 'batch_design', { script: `I('${boardId}', {type:'ref', ref:'${masterId}', descendants:{'${labelId}':{content:'Cancel'}}});` })
    const instance = engine.snapshot().document.children[0].children.at(-1)
    assert.equal(instance.ref, masterId)
    assert.equal(instance.descendants[labelId].content, 'Cancel')
    assert.equal(engine.snapshot().document.children[0].children.find(item => item.id === masterId).children[0].content, 'Save')
  } finally { engine.close() }
})

test('sandboxed design reports a non-container parent without changing the document', () => {
  const engine = new EngineSession({ version: '0.8.5', children: [
    { type: 'text', id: 'label', content: 'Title' },
  ] })
  try {
    const before = engine.snapshot()
    const result = engine.callTool('batch_design', { script: `I('label', {type:'frame', name:'Button'});` })
    assert.equal(result.isError, true)
    assert.match(result.content[0].text, /label.*not a container/)
    assert.deepEqual(engine.snapshot(), before)
  } finally { engine.close() }
})

test('prototype simulation applies camelCase click targets and rejects targetless clicks', () => {
  const engine = new EngineSession({ version: '0.8.5', children: [
    { type: 'frame', id: 'home', width: 400, height: 300, children: [
      { type: 'frame', id: 'cta', width: 80, height: 44, reactions: [
        { trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: 'detail', navigation: 'NAVIGATE' }] },
      ] },
    ] },
    { type: 'frame', id: 'detail', x: 500, width: 400, height: 300 },
  ] })
  try {
    const result = call(engine, 'simulate_prototype', { startNodeId: 'home', steps: [{ type: 'click', nodeId: 'cta' }] })
    assert.equal(result.currentScreenId, 'detail')
    const missing = engine.callTool('simulate_prototype', { steps: [{ type: 'click' }] })
    assert.equal(missing.isError, true)
    assert.match(missing.content[0].text, /nodeId/)
  } finally { engine.close() }
})

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
