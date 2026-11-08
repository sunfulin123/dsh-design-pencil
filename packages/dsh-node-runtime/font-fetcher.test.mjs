import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { FontFetcher, parseGoogleFontCss } from './font-fetcher.mjs'

test('only approved font hosts are accepted from CSS', () => {
  const faces = parseGoogleFontCss(`@font-face { src:url(https://fonts.gstatic.com/font.ttf) }`)
  assert.equal(faces.length, 1)
  assert.deepEqual(parseGoogleFontCss(`@font-face { src:url(https://attacker.example/font.ttf) }`), [])
})

test('faces are cached individually and failures are explicit', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-fonts-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  let requests = 0
  const fetchImpl = async url => {
    requests++
    if (url.includes('Missing')) return new Response('not found', { status: 400 })
    if (url.includes('googleapis')) return new Response('@font-face { src:url(https://fonts.gstatic.com/font.ttf) }')
    return new Response(new Uint8Array([0, 1, 0, 0, 1, 2, 3]))
  }
  const cache = new FontFetcher(directory, { fetchImpl })
  const fonts = [{ family: 'Roboto', weight: 500 }, { family: 'Roboto', weight: 700 }]
  const outcomes = await cache.ensure(fonts)
  assert.ok(outcomes.every(face => face.available))
  assert.equal(cache.manifest().faces.length, 2)
  await cache.ensure(fonts)
  assert.equal(requests, 4)
  const restarted = new FontFetcher(directory, { fetchImpl })
  assert.equal(restarted.manifest().faces.length, 2)
  assert.ok(await restarted.bytes(outcomes[0].id))
  await restarted.ensure(fonts)
  assert.equal(requests, 4, 'disk cache survives restart')
  const [missing] = await cache.ensure([{ family: 'Missing', weight: 400 }])
  assert.equal(missing.available, false)
  assert.match(missing.error, /400/)
})

test('Fontsource provides an explicit subset fallback when Google is unavailable', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-font-fallback-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const fetcher = new FontFetcher(directory, {
    fetchImpl: async url => {
      if (url.includes('googleapis')) return new Response('', { status: 503 })
      if (url.includes('api.fontsource.org')) return Response.json({
        family: 'Roboto', defSubset: 'latin', variants: { 500: { normal: { latin: {
          url: { ttf: 'https://cdn.jsdelivr.net/fontsource/fonts/roboto@5/latin-500-normal.ttf' },
        } } } },
      })
      return new Response(new Uint8Array([0, 1, 0, 0, 1]))
    },
  })
  const [out] = await fetcher.ensure([{ family: 'Roboto', weight: 500 }])
  assert.equal(out.available, true)
  assert.match(out.warning, /Fontsource latin subset/)
})
