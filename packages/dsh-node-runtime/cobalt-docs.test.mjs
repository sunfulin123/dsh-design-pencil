import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, access } from 'node:fs/promises'
import { test } from 'node:test'
import { EngineSession } from './engine-session.mjs'
import { readGuide } from './guide-text.test-helper.mjs'

const base = new URL('../talkdesk-cobalt/skill/', import.meta.url)
const read = path => readFile(new URL(path, base), 'utf8')

test('the production WASM returns the migrated Cobalt design contract as the selected style', () => {
  const engine = new EngineSession({ version: '0.8.5', children: [] })
  try {
    const result = engine.callTool('get_style_guide', { id: 'talkdesk-cobalt' })
    assert.equal(result.isError, false)
    assert.match(result.structuredContent.content, /Talkdesk Product Design Contract/)
    assert.match(result.structuredContent.content, /Never install `@openpencil\/cobalt-extensions`/)
    assert.match(result.structuredContent.content, /generated pnpm project/)
    assert.match(result.structuredContent.content, /square edges/)
    assert.match(result.structuredContent.content, /src\/components\/cobalt-extensions/)
    assert.match(result.structuredContent.content, /references\/cobalt\/INDEX.md/)
    assert.match(result.structuredContent.content, /24px on large, 16px on medium and 12px on small/)
  } finally { engine.close() }
})

test('Cobalt Design uses bundled component guidance without a docs checkout workflow', async () => {
  const guide = await readGuide(new URL('references/cobalt-workspace.md', base))
  assert.doesNotMatch(guide, /git clone|git -C|pull --ff-only|cobalt-ai-docs\/SKILL/)
  assert.match(guide, /references\/cobalt\/INDEX.md/)
  assert.match(await read('references/cobalt/INDEX.md'), /registry.json/)
})

test('bundled Cobalt registry resolves every component and provider to a local verified document', async () => {
  const root = new URL('../talkdesk-cobalt/reference/content/', import.meta.url)
  const manifest = JSON.parse(await readFile(new URL('../talkdesk-cobalt/reference/source.json', import.meta.url), 'utf8'))
  const registry = JSON.parse(await readFile(new URL('registry.json', root), 'utf8'))
  assert.ok(registry.length > 90)
  for (const entry of registry) {
    const path = entry.docs?.markdown
    if (!path) continue
    assert.ok(manifest.files[path], path)
    await access(new URL(path, root))
  }
  for (const [path, hash] of Object.entries(manifest.files)) {
    const bytes = await readFile(new URL(path, root))
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, path)
  }
  assert.ok(manifest.files['layout-templates/list-view/list-view.md'])
  assert.ok(manifest.files['foundations/tokens/overview/overview.md'])
  assert.ok(manifest.files['get-started/develop/develop.md'])
  assert.ok(manifest.files['providers/core/theme-provider/theme-provider.md'])
})

test('documentation images referenced by bundled guidance are local assets or explicitly recorded gaps', async () => {
  const manifest = JSON.parse(await readFile(new URL('../talkdesk-cobalt/reference/source.json', import.meta.url), 'utf8'))
  for (const path of Object.keys(manifest.files).filter(path => path.endsWith('.md'))) {
    const content = await readFile(new URL('../talkdesk-cobalt/reference/content/' + path, import.meta.url), 'utf8')
    for (const match of content.matchAll(/(?:\]\(|["'])(\/assets\/[^\s)"']+)/g)) {
      const asset = decodeURI(match[1]).split(/[?#]/)[0].slice(1)
      assert.ok(manifest.files[asset] || manifest.missingAssets.includes(asset), `${path}: ${asset}`)
    }
  }
})
