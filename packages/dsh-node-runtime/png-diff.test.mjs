import assert from 'node:assert/strict'
import test from 'node:test'
import { solidPng } from './png-fixture.test-helper.mjs'
import { diffPng } from './png-diff.mjs'

test('invalid images reject instead of returning a successful comparison', () => {
  assert.throws(() => diffPng(Buffer.from('not PNG'), Buffer.from('not PNG')), /PNG/)
})

test('pixel differences and mismatched sizes are measured exactly', () => {
  const red = solidPng(8, 8, [255, 0, 0, 255])
  assert.equal(diffPng(red, red).ratio, 0)
  assert.equal(diffPng(red, solidPng(8, 8, [0, 0, 255, 255])).ratio, 1)
  assert.equal(diffPng(red, solidPng(9, 8)).comparable, false)
  assert.equal(diffPng(solidPng(2, 2, [0, 0, 0, 0]), solidPng(2, 2, [255, 255, 255, 255])).ratio, 0)
})
