import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { convertHtmlToDocument, EngineSession } from './engine-session.mjs'

test('EngineSession supports batch_design script expansion, finalize_design, and HTML file import', async context => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-engine-import-'))
  context.after(() => rm(root, { recursive: true, force: true }))
  const htmlPath = join(root, 'landing.html')
  await writeFile(htmlPath, '<!DOCTYPE html><html><head><title>Landing</title></head><body><div style="width:320px;height:120px;background:#22c55e"><h1>Hello</h1></div></body></html>')
  const converted = await convertHtmlToDocument({ htmlPath })
  assert.equal(converted.ok, true)
  assert.ok(converted.nodeCount >= 2)
  assert.equal(converted.document.children[0].type, 'frame')

  const session = new EngineSession({ version: '1.0', children: [] })
  try {
    const imported = session.callTool('import_html', { htmlPath })
    assert.equal(imported.isError, false, JSON.stringify(imported))
    assert.equal(session.snapshot().document.editorMeta?.preserveAuthoredGeometry, true)
    assert.ok(session.snapshot().document.children.length > 0)

    const scripted = session.callTool('batch_design', {
      script: 'const card = I(null, { type: "frame", name: "Scripted Card", width: 200, height: 100 });',
    })
    assert.equal(scripted.isError, false, JSON.stringify(scripted))
    const finalized = session.callTool('finalize_design', {})
    assert.equal(finalized.isError, false, JSON.stringify(finalized))
    assert.equal(typeof finalized.structuredContent.roots, 'number')

    const quality = session.callTool('get_design_quality', {})
    assert.equal(quality.isError, false, JSON.stringify(quality))
    assert.ok(Array.isArray(quality.structuredContent.geometryIssues))

    const enriched = session.callTool('enrich_images', { timeout_seconds: 5 })
    assert.equal(enriched.isError, false, JSON.stringify(enriched))
    assert.equal(typeof enriched.structuredContent.targets, 'number')

    const screenshot = session.callTool('get_screenshot', { nodeId: 'root' })
    assert.equal(screenshot.isError, false, JSON.stringify(screenshot))
    assert.equal(screenshot.content[0].type, 'image')
    assert.equal(screenshot.content[0].mimeType, 'image/png')
    const pngBytes = Buffer.from(screenshot.content[0].data, 'base64')
    assert.deepEqual([...pngBytes.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  } finally {
    session.close()
  }
})

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

test('EngineSession preserves selectedIds across document replace and metadata pushes', () => {
  const initial = {
    version: '0.8.5',
    children: [
      {
        id: 'root',
        type: 'frame',
        name: 'App Shell',
        width: 1440,
        height: 900,
        children: [
          { id: 'n3', type: 'frame', name: 'Title bar', width: 124, height: 18, children: [] },
        ],
      },
    ],
  }
  const session = new EngineSession(initial)
  try {
    session.setSelection({ selectedIds: ['n3'], activePageId: 'page-1' })
    assert.deepEqual(session.getSelection().selectedIds, ['n3'])
    const replaced = session.replace({
      ...initial,
      editorMeta: { activePageIndex: 0, preserveAuthoredGeometry: false },
    }, 0)
    assert.equal(replaced.ok, true)
    assert.deepEqual(session.getSelection().selectedIds, ['n3'])
    const metaReplaced = session.replace({
      ...initial,
      editorMeta: { activePageIndex: 0, preserveAuthoredGeometry: true },
    }, 1, { metadataOnly: true })
    assert.equal(metaReplaced.ok, true)
    assert.deepEqual(session.getSelection().selectedIds, ['n3'])
  } finally {
    session.close()
  }
})

test('EngineSession script mode supports M/D/U and finalize_design infers auto-layout on multi-child frames', () => {
  const session = new EngineSession({
    version: '0.8.5',
    children: [
      { id: 'root', type: 'frame', name: 'Sidebar', width: 320, height: 800, cornerRadius: 12, children: [] },
    ],
  })
  try {
    const batch = session.callTool('batch_design', {
      script: [
        'const a = I("root", { type: "frame", name: "Nav row A", width: 280, height: 40, cornerRadius: 16 });',
        'I(a, { type: "icon_font", name: "Tasks icon", iconFontName: "layers", width: 18, height: 18 });',
        'I(a, { type: "text", name: "Tasks label", content: "任务" });',
        'const b = I("root", { type: "frame", name: "Nav row B", width: 280, height: 40 });',
        'U(b, { cornerRadius: 8 });',
      ].join('\n'),
    })
    assert.equal(batch.isError, false)
    const fin = session.callTool('finalize_design', {})
    assert.equal(fin.isError, false)
    const doc = session.snapshot().document
    assert.equal(doc.children[0].layout, 'vertical', 'multi-child frame without layout should infer vertical auto-layout')
    const rowA = doc.children[0].children[0]
    assert.equal(rowA.layout, 'horizontal', 'nav row should infer horizontal auto-layout')
    assert.equal(rowA.alignItems, 'center', 'Impeccable /typeset should center-align horizontal row children')
    assert.equal(rowA.gap, 8, 'Impeccable /typeset should assign default 8px gap to horizontal row')
    assert.equal(rowA.cornerRadius, 10, 'Impeccable /polish should clamp child cornerRadius concentrically inside parent radius 12')
  } finally {
    session.close()
  }
})

test('EngineSession supports V()/T() variable script helpers and syncs Design.md colors into variables', () => {
  const session = new EngineSession({
    version: '0.8.5',
    children: [
      { id: 'root', type: 'frame', name: 'Page', width: 320, height: 400, layout: 'vertical', children: [] },
    ],
  })
  try {
    const batch = session.callTool('batch_design', {
      script: [
        'T("Mode", ["Light", "Dark"]);',
        'const accent = V("--accent", "#2563EB");',
        'const pad = V("--space-md", 12);',
        'I("root", { type: "frame", name: "Card", width: 280, height: 80, padding: pad, fill: [{ type: "solid", color: accent }] });',
      ].join('\n'),
    })
    assert.equal(batch.isError, false)
    const dmd = session.callTool('set_design_md', {
      markdown: '# Design System: Test\n\n## Color Palette\n- **Brand Primary** (#E86343) - Primary action\n- **Surface Warm** (#FAF8F5) - Background\n',
    })
    assert.equal(dmd.isError, false)
    const doc = session.snapshot().document
    assert.deepEqual(doc.themes?.Mode, ['Light', 'Dark'])
    assert.equal(doc.variables?.['--accent']?.value, '#2563EB')
    assert.equal(doc.variables?.['--space-md']?.value, 12)
    assert.equal(doc.variables?.['--brand-primary']?.value, '#E86343')
    assert.equal(doc.variables?.['--surface-warm']?.value, '#FAF8F5')
  } finally {
    session.close()
  }
})