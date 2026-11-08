import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
const source = await readFile(new URL('../src/op_ck_bridge.js', import.meta.url), 'utf8')
const { opCkMatchFontFace, opCkResolveRegisteredTypeface } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
)
test('multiple weights and italics resolve deterministically', () => {
  const faces = [400, 500, 700].flatMap(weight => [false, true].map(italic => ({ weight, italic, tf: `${weight}/${italic}` })))
  assert.equal(opCkMatchFontFace(faces, 500, false).tf, '500/false')
  assert.equal(opCkMatchFontFace(faces, 700, true).tf, '700/true')
  assert.equal(opCkMatchFontFace(faces, 450, false).weight, 500)
  assert.equal(opCkMatchFontFace(faces, 600, false).weight, 700)
  const map = new Map([['roboto', faces]])
  const face = opCkResolveRegisteredTypeface('Roboto', new Map(), new Map(), new Map(), 500, true, map)
  assert.equal(face.tf, '500/true')
})
