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
    const codeCtx = session.callTool('get_design_code_context', { format: 'all' })
    assert.equal(codeCtx.isError, false)
    const parsedCtx = JSON.parse(codeCtx.content[0].text)
    assert.match(parsedCtx.code.designJsx, /<Frame/)
    assert.match(parsedCtx.code.tailwindJsx, /data-name="Card"/)
    assert.match(parsedCtx.code.htmlCss, /--accent:\s*#2563EB/)
    assert.ok(Array.isArray(parsedCtx.nodes) && parsedCtx.nodes.length > 0)
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

test('mapFigmaNode converts vectors, gradients, effects, rich text, and auto-layout with 100% fidelity', async () => {
  const { mapFigmaNode } = await import('./engine-session.mjs')
  const imageRefs = new Set()
  const idCounter = { count: 0 }
  const figmaFrame = {
    type: 'FRAME',
    name: 'Hero Section',
    absoluteBoundingBox: { x: 100, y: 50, width: 800, height: 400 },
    layoutMode: 'HORIZONTAL',
    primaryAxisAlignItems: 'SPACE_BETWEEN',
    counterAxisAlignItems: 'CENTER',
    itemSpacing: 24,
    paddingTop: 32,
    paddingRight: 40,
    paddingBottom: 32,
    paddingLeft: 40,
    rectangleCornerRadii: [12, 12, 0, 0],
    clipsContent: true,
    fills: [
      {
        type: 'GRADIENT_LINEAR',
        gradientHandlePositions: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
        gradientStops: [
          { position: 0, color: { r: 0.1, g: 0.2, b: 0.9, a: 1 } },
          { position: 1, color: { r: 0.5, g: 0.1, b: 0.8, a: 1 } },
        ],
      },
      {
        type: 'IMAGE',
        imageRef: 'img_hero_bg',
        scaleMode: 'FIT',
      },
    ],
    strokes: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1, a: 0.5 } }],
    individualStrokeWeights: { top: 1, right: 0, bottom: 2, left: 0 },
    effects: [
      {
        type: 'DROP_SHADOW',
        radius: 16,
        spread: 2,
        offset: { x: 0, y: 8 },
        color: { r: 0, g: 0, b: 0, a: 0.25 },
      },
    ],
    children: [
      {
        type: 'VECTOR',
        name: 'Brand Icon',
        absoluteBoundingBox: { x: 140, y: 180, width: 24, height: 24 },
        fillGeometry: [{ path: 'M0 0L24 12L0 24Z', windingRule: 'EVENODD' }],
        fills: [{ type: 'SOLID', color: { r: 1, g: 0.5, b: 0, a: 1 } }],
      },
      {
        type: 'TEXT',
        name: 'Headline',
        absoluteBoundingBox: { x: 200, y: 160, width: 360, height: 48 },
        characters: 'Hello World',
        style: {
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 36,
          fontWeight: 700,
          textAutoResize: 'WIDTH_AND_HEIGHT',
        },
        characterStyleOverrides: [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
        styleOverrideTable: {
          1: {
            fontWeight: 800,
            italic: true,
            fills: [{ type: 'SOLID', color: { r: 0.2, g: 0.8, b: 0.4, a: 1 } }],
          },
        },
      },
    ],
  }
  const mapped = mapFigmaNode(figmaFrame, null, idCounter, imageRefs)
  assert.equal(mapped.type, 'frame')
  assert.equal(mapped.layout, 'horizontal')
  assert.equal(mapped.justifyContent, 'space_between')
  assert.equal(mapped.alignItems, 'center')
  assert.deepEqual(mapped.padding, [32, 40, 32, 40])
  assert.deepEqual(mapped.cornerRadius, [12, 12, 0, 0])
  assert.equal(mapped.fill[0].type, 'linear')
  assert.equal(mapped.fill[1].type, 'image')
  assert.ok(imageRefs.has('img_hero_bg'))
  assert.deepEqual(mapped.stroke.thickness, [1, 0, 2, 0])
  assert.equal(mapped.effects[0].type, 'shadow')
  assert.equal(mapped.children[0].type, 'path')
  assert.equal(mapped.children[0].d, 'M0 0L24 12L0 24Z')
  assert.equal(mapped.children[0].fillRule, 'evenodd')
  assert.equal(mapped.children[1].type, 'text')
  assert.ok(Array.isArray(mapped.children[1].content))
  assert.equal(mapped.children[1].content[1].text, 'World')
  assert.equal(mapped.children[1].content[1].fontStyle, 'italic')
})

test('convertHtmlToDocument renders complex flex/grid/icon HTML with auto-layout, semantics, and variables', async context => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-rich-html-'))
  context.after(() => rm(root, { recursive: true, force: true }))
  const htmlPath = join(root, 'dashboard.html')
  await writeFile(
    htmlPath,
    `<!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; background: #0f172a; font-family: sans-serif; }
          header { display: flex; justify-content: space-between; align-items: center; padding: 16px 32px; background: #1e293b; }
          .card-row { display: flex; gap: 20px; padding: 32px; }
          .metric-card { display: flex; flex-direction: column; gap: 8px; padding: 20px; width: 240px; background: #1e293b; border-radius: 12px; color: #f8fafc; }
          .cta-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: #3b82f6; color: #ffffff; border: none; border-radius: 8px; }
        </style>
      </head>
      <body>
        <header class="top-navbar">
          <span style="color:#ffffff;font-size:18px;font-weight:700">Synapse Studio</span>
          <button class="cta-btn">
            <svg class="lucide lucide-sparkles" width="16" height="16" viewBox="0 0 24 24"><path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z" fill="#ffffff"/></svg>
            <span>New Design</span>
          </button>
        </header>
        <section class="card-row">
          <div class="metric-card">
            <span style="color:#94a3b8;font-size:13px">Active Users</span>
            <strong style="color:#f8fafc;font-size:28px">12,480</strong>
          </div>
          <div class="metric-card">
            <span style="color:#94a3b8;font-size:13px">Conversion</span>
            <strong style="color:#22c55e;font-size:28px">98.4%</strong>
          </div>
        </section>
      </body>
    </html>`,
  )
  const converted = await convertHtmlToDocument({ htmlPath })
  assert.equal(converted.ok, true)
  assert.ok(converted.autoLayoutFrames >= 3, `expected >=3 auto-layout frames, got ${converted.autoLayoutFrames}`)
  assert.ok(converted.variablesCount >= 2, `expected extracted color variables, got ${converted.variablesCount}`)
})

test('EngineSession snaps off-grid spacing/radius/fontSize and expands UI.* component macros', () => {
  const session = new EngineSession({
    version: '0.8.5',
    children: [
      { id: 'root', type: 'frame', name: 'Page', width: 1440, height: 900, layout: 'vertical', children: [] },
    ],
  })
  try {
    const batch = session.callTool('batch_design', {
      script: [
        'const card = UI.Card("root", { name: "Feature Card", gap: 15, padding: [13, 25], cornerRadius: 15 });',
        'UI.SectionHeader(card, { title: "Overview", subtitle: "Snapped metrics" });',
        'UI.Button(card, { label: "Get Started", variant: "primary", size: "lg", icon: "sparkles" });',
        'UI.Input(card, { placeholder: "Search items...", icon: "search" });',
        'UI.Badge(card, { label: "Pro" });',
        'UI.NavItem(card, { label: "Dashboard", icon: "layers", active: true });',
        'const custom = I(card, { type: "text", name: "Off-scale text", content: "Hello", fontSize: 17 });',
      ].join('\n'),
    })
    assert.equal(batch.isError, false, JSON.stringify(batch))
    const rootChildren = session.snapshot().document.children[0].children
    assert.equal(rootChildren.length, 1)
    const card = rootChildren[0]
    assert.equal(card.role, 'card')
    assert.equal(card.gap, 16, 'off-grid gap 15 should snap to 16')
    assert.deepEqual(card.padding, [12, 24], 'off-grid padding [13, 25] should snap to [12, 24]')
    assert.equal(card.cornerRadius, 16, 'off-grid cornerRadius 15 should snap to 16')
    const navItem = card.children.find(c => c.role === 'nav-link')
    assert.equal(navItem.height, 44, 'UI.NavItem default height must be 44px to satisfy touch-target minimum')
    const offScaleText = card.children.at(-1)
    assert.equal(offScaleText.fontSize, 16, 'off-scale fontSize 17 should snap to 16')

    const updated = session.callTool('update_node', {
      nodeId: card.id,
      data: { gap: 19, cornerRadius: 11 },
    })
    assert.equal(updated.isError, false, JSON.stringify(updated))
    const cardAfter = session.snapshot().document.children[0].children[0]
    assert.equal(cardAfter.gap, 20, 'update_node gap 19 should snap to 20')
    assert.equal(cardAfter.cornerRadius, 10, 'update_node cornerRadius 11 should snap to 10')

    const quality = session.callTool('get_design_quality', {})
    assert.equal(quality.isError, false, JSON.stringify(quality))
    assert.ok(Array.isArray(quality.structuredContent.geometryIssues))
  } finally {
    session.close()
  }
})

test('EngineSession preserves exact authored geometry when preserveAuthoredGeometry is true', () => {
  const session = new EngineSession({
    version: '0.8.5',
    children: [
      { id: 'root', type: 'frame', name: 'Page', width: 320, height: 800, layout: 'vertical', children: [] },
    ],
    editorMeta: { preserveAuthoredGeometry: true },
  })
  try {
    const batch = session.callTool('batch_design', {
      script: 'I("root", { type: "frame", name: "Replica", gap: 13, padding: 13, cornerRadius: 15 });',
    })
    assert.equal(batch.isError, false, JSON.stringify(batch))
    const replica = session.snapshot().document.children[0].children[0]
    assert.equal(replica.gap, 13, 'preserveAuthoredGeometry must retain exact gap 13')
    assert.equal(replica.padding, 13, 'preserveAuthoredGeometry must retain exact padding 13')
    assert.equal(replica.cornerRadius, 15, 'preserveAuthoredGeometry must retain exact cornerRadius 15')

    const updated = session.callTool('update_node', {
      nodeId: replica.id,
      data: { gap: 19, cornerRadius: 11 },
    })
    assert.equal(updated.isError, false, JSON.stringify(updated))
    const replicaAfter = session.snapshot().document.children[0].children[0]
    assert.equal(replicaAfter.gap, 19, 'preserveAuthoredGeometry update_node must retain exact gap 19')
    assert.equal(replicaAfter.cornerRadius, 11, 'preserveAuthoredGeometry update_node must retain exact cornerRadius 11')
  } finally {
    session.close()
  }
})
test('EngineSession lays out CJK text one em per character', () => {
  const session = new EngineSession({
    version: '1.0',
    children: [{
      id: 'f', type: 'frame', name: 'F', width: 400, height: 120, layout: 'horizontal',
      children: [{
        id: 't', type: 'text', name: 'T', content: '热卖好物推荐', fontSize: 20,
        textGrowth: 'auto', width: 'fit_content', height: 'fit_content',
      }],
    }],
  })
  try {
    const layout = session.callTool('snapshot_layout', { maxDepth: 4 })
    assert.equal(layout.isError, false, JSON.stringify(layout))
    const find = nodes => nodes?.flatMap(n => [n, ...find(n.children)]) ?? []
    const text = find(layout.structuredContent.layout ?? layout.structuredContent.nodes).find(n => n.id === 't')
    assert.ok(text, JSON.stringify(layout.structuredContent).slice(0, 400))
    assert.equal(text.width, 120)
  } finally {
    session.dispose?.()
  }
})
