import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DocumentStore } from './document-store.mjs'

const document = name => ({ version: '0.8.0', children: [{ type: 'frame', id: 'frame', name, children: [] }] })

test('document replacement increments its version and returns isolated snapshots', () => {
  const store = new DocumentStore(document('Original'))
  const snapshot = store.snapshot()
  snapshot.document.children[0].name = 'Modified snapshot'
  assert.equal(store.snapshot().document.children[0].name, 'Original')
  assert.deepEqual(store.replace(document('Updated'), 0), { ok: true, version: 1 })
  assert.equal(store.snapshot().document.children[0].name, 'Updated')
})

test('a stale browser write cannot overwrite a newer design operation', () => {
  const store = new DocumentStore(document('Original'))
  store.replace(document('AI update'), 0)
  assert.deepEqual(store.replace(document('Stale browser'), 0), { ok: false, conflict: true, version: 1 })
  assert.equal(store.snapshot().document.children[0].name, 'AI update')
})

test('invalid documents and versions leave the current document intact', () => {
  const store = new DocumentStore(document('Original'))
  for (const invalid of [null, {}, { children: 'invalid' }]) {
    assert.throws(() => store.replace(invalid, 0))
  }
  for (const version of [undefined, -1, 0.5, '0']) {
    assert.throws(() => store.replace(document('Rejected'), version))
  }
  assert.equal(store.snapshot().version, 0)
  assert.equal(store.snapshot().document.children[0].name, 'Original')
})