import assert from 'node:assert/strict'
import test from 'node:test'
import { EngineSession } from './engine-session.mjs'

test('AI design advances the version and rejects an older browser snapshot', () => {
  const session = new EngineSession({ version: '0.8.5', children: [], customExtension: { retained: true } })
  try {
    const browser = session.snapshot()
    const result = session.callTool('batch_design', {
      operations: 'frame=I(null, {"type":"frame","name":"AI design"})',
    })
    assert.equal(result.isError, false)
    const next = session.snapshot()
    assert.equal(next.version, 1)
    assert.equal(next.document.children[0].name, 'AI design')
    assert.deepEqual(next.document.customExtension, { retained: true })
    assert.deepEqual(session.replace(browser.document, browser.version), {
      ok: false, conflict: true, version: 1,
    })
    assert.deepEqual(session.snapshot(), next)
  } finally {
    session.close()
  }
})

test('reads and rejected transactions do not advance document versions', () => {
  const session = new EngineSession({ version: '0.8.5', children: [] })
  try {
    assert.equal(session.callTool('batch_get', {}).isError, false)
    const result = session.callTool('batch_design', {
      operations: 'frame=I(null, {"type":"frame","name":"rolled back"})\nX("invalid")',
    })
    assert.equal(result.structuredContent.applied, false)
    assert.deepEqual(session.snapshot(), { document: { version: '0.8.5', children: [] }, version: 0 })
  } finally {
    session.close()
  }
})

test('browser replacement is validated before changing the authoritative document', () => {
  const session = new EngineSession({ version: '0.8.5', children: [] })
  try {
    assert.throws(() => session.replace({ children: [{ type: 'not_a_node' }] }, 0))
    assert.equal(session.snapshot().version, 0)
    const browser = { version: '0.8.5', children: [], editorMeta: { activePageIndex: 0, preserveAuthoredGeometry: true } }
    assert.deepEqual(session.replace(browser, 0), { ok: true, version: 1 })
    assert.deepEqual(session.snapshot().document, browser)
    session.close()
    session.close()
    assert.throws(() => session.callTool('batch_get', {}), /closed/)
  } finally {
    session.close()
  }
})