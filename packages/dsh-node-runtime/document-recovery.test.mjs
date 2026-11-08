import assert from 'node:assert/strict'
import test from 'node:test'
import { EngineSession } from './engine-session.mjs'

test('whole-document recovery is one undo step including optional roots and unknown extensions', () => {
  const initial = {
    version: '0.8.5', name: 'Original', children: [{ type: 'rectangle', id: 'old', width: 20, height: 20 }],
    customExtension: { value: 'old' }, editorMeta: { customHint: 'old' },
  }
  const recovered = {
    version: '0.8.5', children: [{ type: 'rectangle', id: 'recovered', width: 60, height: 40 }],
    variables: { amount: { type: 'number', value: 12 } }, theme: { appearance: 'dark' },
    themes: { appearance: ['light', 'dark'] }, customExtension: { value: 'recovered' },
    editorMeta: { customHint: 'recovered', viewport: { panX: 12.5, panY: -9.25, zoom: 1.25 } },
  }
  const session = new EngineSession(initial)
  try {
    assert.equal(session.callTool('update_node', { node_id: 'old', data: { width: 28 } }).isError, false)
    assert.deepEqual(session.restoreDocument(recovered, 1), { ok: true, version: 2 })
    assert.equal(session.snapshot().document.customExtension.value, 'recovered')
    assert.equal(Object.hasOwn(session.snapshot().document, 'name'), false)
    assert.equal(session.callTool('undo').isError, false)
    let restored = session.snapshot().document
    assert.equal(restored.children[0].width, 28)
    assert.equal(restored.name, 'Original')
    assert.equal(restored.customExtension.value, 'old')
    assert.equal(restored.editorMeta.customHint, 'old')
    assert.equal(Object.hasOwn(restored, 'variables'), false)
    assert.equal(Object.hasOwn(restored, 'themes'), false)
    assert.equal(Object.hasOwn(restored, 'theme'), false)
    assert.equal(session.callTool('undo').isError, false)
    assert.equal(session.snapshot().document.children[0].width, 20)
    assert.equal(session.callTool('redo').isError, false)
    assert.equal(session.callTool('redo').isError, false)
    restored = session.snapshot().document
    assert.equal(restored.children[0].id, 'recovered')
    assert.equal(restored.variables.amount.value, 12)
    assert.equal(restored.customExtension.value, 'recovered')
    const before = session.snapshot()
    assert.throws(() => session.restoreDocument({ children: [{ type: 'invalid' }] }, before.version))
    assert.deepEqual(session.snapshot(), before)
    assert.deepEqual(session.restoreDocument(initial, 0), { ok: false, conflict: true, version: before.version })
  } finally {
    session.close()
  }
})

test('extension-only recovery participates in undo and redo without treating failed history reads as edits', () => {
  const original = {
    version: '0.8.5', children: [{ type: 'rectangle', id: 'box', width: 20, height: 20 }],
    extension: { value: 'original' },
  }
  const session = new EngineSession(original)
  try {
    const recovered = { ...original, extension: { value: 'recovered' } }
    session.restoreDocument(recovered, 0)
    assert.equal(session.snapshot().version, 1)
    assert.equal(session.callTool('undo').isError, false)
    assert.deepEqual(session.snapshot().document.extension, original.extension)
    assert.equal(session.callTool('redo').isError, false)
    assert.deepEqual(session.snapshot().document.extension, recovered.extension)
    const before = session.snapshot()
    assert.equal(session.callTool('redo').isError, true)
    assert.deepEqual(session.snapshot(), before)
    assert.equal(session.callTool('batch_get').isError, false)
    assert.deepEqual(session.snapshot(), before)
  } finally {
    session.close()
  }
})
