import assert from 'node:assert/strict'
import { basename } from 'node:path'
import test from 'node:test'

import { designTaskDirectory, generatedOpPath } from './document-file.mjs'

test('HTML and OP use the same slug and task hash inside their respective workspace roots', () => {
  const name = 'Coverage / Staffing Overview'
  assert.equal(designTaskDirectory('html-design', name, 'task-a'), '.synapse/html-design/tasks/coverage-staffing-overview-37bbbbed5fd8')
  assert.equal(generatedOpPath(name, 'task-a'), '.synapse/op-design/tasks/coverage-staffing-overview-37bbbbed5fd8/coverage-staffing-overview.op')
})

test('new output normalizes its basename, while the immutable task ID distinguishes duplicates', () => {
  const name = '/arbitrary/directory/Team Request.OP'
  assert.equal(generatedOpPath(name, 'task-a'), '.synapse/op-design/tasks/team-request-37bbbbed5fd8/team-request.op')
  assert.equal(generatedOpPath(name, 'task-b'), '.synapse/op-design/tasks/team-request-b977da3c7aa3/team-request.op')
  assert.equal(generatedOpPath(generatedOpPath(name, 'task-a'), 'task-a'), generatedOpPath(name, 'task-a'))
})

test('task directories handle multilingual, empty, and long business descriptions safely', () => {
  assert.match(designTaskDirectory('html-design', '/synapse-design 工单详情', 'task-a'), /\/工单详情-37bbbbed5fd8$/)
  assert.equal(generatedOpPath('...', 'task-a'), '.synapse/op-design/tasks/design-37bbbbed5fd8/design.op')
  const long = basename(designTaskDirectory('html-design', '𐐀'.repeat(255), 'task-a'))
  assert.ok(Buffer.byteLength(long) <= 255)
  assert.throws(() => designTaskDirectory('../other', 'Coverage', 'task-a'), /design task kind/i)
  assert.throws(() => generatedOpPath('Coverage', ''), /task identity/i)
})
