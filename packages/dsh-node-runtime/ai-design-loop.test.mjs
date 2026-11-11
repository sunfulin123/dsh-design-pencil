// End-to-end check of the loop an AI agent runs over MCP:
// create page -> design -> screenshot -> lint -> fix and adjust UI -> screenshot.
//
// Tier A (always): screenshots come from the approximate server renderer
// (no browser needed), on an empty document and on a synthetic ~20k-node
// document with per-step time budgets.
// Tier B (DSH_E2E_CHROME=1): the same loop with real CanvasKit captures from
// the hidden headless browser; DSH_E2E_OUT=<dir> keeps the PNGs.
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { startNodeHost } from './node-host.mjs'
import { decodePng, diffPng } from './png-diff.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const BRAND = [0x4f, 0x46, 0xe5]

// Per-call budgets are loose because `node --test` runs files in parallel
// on shared runners; the median read-only check below is the tight one
// (reads cost ~0.8 s each on large documents before the fingerprint cache).
const BUDGET_MS = { read: 500, write: 2000, lint: 2000 }

function syntheticDocument(nodeCount) {
  const boards = []
  let made = 0
  for (let b = 0; made < nodeCount; b++) {
    const children = []
    for (let i = 0; i < 99 && made < nodeCount; i++, made++) {
      children.push(i % 3 === 0
        ? { type: 'text', id: `t${b}_${i}`, name: `Text ${i}`, content: `Row ${i}`, x: 10, y: i * 20, fontSize: 12 }
        : { type: 'rectangle', id: `r${b}_${i}`, name: `Box ${i}`, x: (i % 10) * 30, y: i * 20, width: 24, height: 16, fill: '#d0d4dc' })
    }
    made++
    boards.push({ type: 'frame', id: `board${b}`, name: `Board ${b}`, x: (b % 20) * 400, y: Math.floor(b / 20) * 2200, width: 360, height: 2100, children })
  }
  return { version: '1.0.0', pages: [{ id: 'bulk', name: 'Bulk', children: boards }], children: [] }
}

async function loopHost(context, { document, headless, webRoot }) {
  const host = await startNodeHost({ document, headless, webRoot, canvaskitRoot: webRoot && join(webRoot, 'canvaskit') })
  context.after(() => host.close())
  let id = 0
  const timings = []
  const call = async (name, args = {}, budget) => {
    const started = performance.now()
    const response = await fetch(`${host.baseUrl}/mcp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method: 'tools/call', params: { name, arguments: args } }),
    })
    const result = (await response.json()).result
    const ms = performance.now() - started
    timings.push({ name, ms: Math.round(ms) })
    assert.equal(result.isError, false, `${name} failed: ${result.content?.[0]?.text}`)
    if (budget !== undefined) assert.ok(ms <= budget, `${name} took ${Math.round(ms)} ms (budget ${budget} ms)`)
    return result
  }
  return { host, call, timings }
}

function screenshotPng(result) {
  const image = result.content.find(item => item.type === 'image')
  assert.ok(image, 'screenshot returns an image')
  const bytes = Buffer.from(image.data, 'base64')
  return { bytes, ...decodePng(bytes) }
}

function assertNotBlank(png) {
  const first = png.pixels.subarray(0, 4)
  let differing = 0
  for (let i = 0; i < png.pixels.length; i += 4) {
    if (Math.abs(png.pixels[i] - first[0]) + Math.abs(png.pixels[i + 1] - first[1]) + Math.abs(png.pixels[i + 2] - first[2]) > 24) differing++
  }
  assert.ok(differing > png.width * png.height * 0.01, 'the capture shows the design, not a blank canvas')
}

function findLayout(items, id) {
  for (const item of items ?? []) {
    if (item.id === id) return item
    const found = findLayout(item.children, id)
    if (found) return found
  }
  return null
}

function pixelAt(png, x, y) {
  const index = (Math.round(y) * png.width + Math.round(x)) * 4
  return [...png.pixels.subarray(index, index + 3)]
}

async function runDesignLoop({ call }, { minRendered = 0, save } = {}) {
  // 1. Create the page.
  await call('add_page', { name: 'AI Login' }, BUDGET_MS.write)
  const pages = (await call('list_pages', {}, BUDGET_MS.read)).structuredContent
  const page = pages.pages.find(item => item.name === 'AI Login')
  assert.ok(page, 'the new page is listed')
  assert.equal(pages.pages[pages.activePageIndex].id, page.id, 'the new page is active')

  // 2. Design a login screen; two lint findings are planted on purpose.
  const prompt = await call('get_design_prompt', {}, BUDGET_MS.read)
  assert.ok(prompt.content[0].text.length > 200, 'the agent receives design guidance')
  const operations = [
    'board=I(null, {"type":"frame","name":"Login","width":390,"height":844,"layout":"vertical","gap":12,"padding":24,"fill":"#ffffff"})',
    'title=I(board, {"type":"text","name":"Title","content":"Welcome back","fontSize":24,"fontWeight":700,"height":40})',
    'email=I(board, {"type":"frame","role":"form-field","name":"Email","width":"fill_container","height":48,"cornerRadius":8,"fill":"#e4e6eb"})',
    'password=I(board, {"type":"frame","role":"form-field","name":"Password","width":"fill_container","height":48,"cornerRadius":8,"fill":"#e4e6eb"})',
    'confirmation=I(board, {"type":"frame","role":"form-field","name":"Confirm password","width":"fill_container","height":48,"cornerRadius":20,"fill":"#e4e6eb"})',
    'button=I(board, {"type":"frame","name":"Sign in","width":"fill_container","height":48,"cornerRadius":20,"fill":"#888888","layout":"horizontal","justifyContent":"center","alignItems":"center","children":[{"type":"text","name":"Label","content":"Sign in","fontSize":16,"fill":"#ffffff"}]})',
    'forgot=I(board, {"type":"text","name":"Forgot","content":"Forgot password?","fontSize":14})',
  ].join('\n')
  const design = (await call('batch_design', { operations }, BUDGET_MS.write)).structuredContent
  const ids = Object.fromEntries(design.results.map(item => [item.binding, item.nodeId]))
  for (const binding of ['board', 'title', 'email', 'password', 'confirmation', 'button', 'forgot']) {
    assert.ok(ids[binding], `${binding} was created`)
  }
  const children = (await call('get_node_children', { node_id: ids.board }, BUDGET_MS.read)).structuredContent
  assert.equal(Number(children.count), 6, 'the board holds the designed controls')

  // 3. First screenshot.
  const before = screenshotPng(await call('get_screenshot', { nodeId: ids.board, maxSize: 800 }))
  assertNotBlank(before)
  assert.ok(Math.abs(before.width / before.height - 390 / 844) < 0.02, 'the capture keeps the board aspect ratio')
  save?.('1-designed.png', before.bytes)

  // 4. Lint the board: summary first, then the issues to fix.
  const summary = (await call('lint_document', { rootId: ids.board, summaryOnly: true }, BUDGET_MS.lint)).structuredContent
  assert.equal(summary.byCategory['text-explicit-height'], 1)
  assert.equal(summary.byCategory['sibling-inconsistency'], 1)
  const lint = (await call('lint_document', { rootId: ids.board, limit: 20 }, BUDGET_MS.lint)).structuredContent
  assert.ok(JSON.stringify(lint).length < 64 * 1024, 'the lint reply stays small')
  assert.ok(lint.count >= minRendered)

  // 5. The automatic fixer handles the title but leaves peer comparison for review.
  const peerIssue = lint.issues.find(issue => issue.nodeId === ids.confirmation && issue.category === 'sibling-inconsistency')
  assert.equal(peerIssue?.autoFixEligible, false, 'a similar role is not proof that the differing radius is accidental')
  const fixed = await call('fix_lint_issues', { issueIds: lint.issues.map(issue => issue.issueId) }, BUDGET_MS.write)
  assert.equal(fixed.structuredContent.fixed, 1, 'only the eligible clipped-title fix is applied')
  const remaining = (await call('lint_document', { rootId: ids.board, limit: 20 }, BUDGET_MS.lint)).structuredContent
  assert.ok(remaining.issues.some(issue => issue.issueId === peerIssue.issueId), 'the peer candidate remains for review')
  // After comparing the three form fields, explicitly repair the confirmed variant.
  await call('update_node', { nodeId: ids.confirmation, data: { cornerRadius: 8 } }, BUDGET_MS.write)
  await call('set_node_fill_hex', { node_id: ids.button, hex: '#4F46E5' }, BUDGET_MS.write)
  await call('update_node', { nodeId: ids.title, data: { fontSize: 28 } }, BUDGET_MS.write)
  await call('update_node', { nodeId: ids.board, data: { gap: 16 } }, BUDGET_MS.write)
  const relint = (await call('lint_document', { rootId: ids.board, summaryOnly: true }, BUDGET_MS.lint)).structuredContent
  assert.equal(relint.byCategory['text-explicit-height'] ?? 0, 0, 'the clipped title is fixed')
  assert.equal(relint.byCategory['sibling-inconsistency'] ?? 0, 0, 'corner radii are consistent')
  assert.equal(relint.bySeverity.error ?? 0, 0, 'no errors were introduced')

  // Every agent edit stays undoable.
  const boardLayout = async () => findLayout(
    (await call('snapshot_layout', { maxDepth: 4 }, BUDGET_MS.lint)).structuredContent.layout, ids.board)
  const adjusted = await boardLayout()
  await call('undo', {}, BUDGET_MS.write)
  assert.notDeepEqual(await boardLayout(), adjusted, 'undo reverts the last adjustment (gap)')
  await call('redo', {}, BUDGET_MS.write)
  assert.deepEqual(await boardLayout(), adjusted, 'redo restores it')

  // 6. Second screenshot shows the adjusted design.
  const after = screenshotPng(await call('get_screenshot', { nodeId: ids.board, maxSize: 800 }))
  assertNotBlank(after)
  save?.('2-adjusted.png', after.bytes)
  const diff = diffPng(before.bytes, after.bytes)
  assert.ok(diff.comparable, 'both captures frame the same board')
  assert.ok(diff.differentPixels > 0, 'the adjustments are visible')
  const layout = (await call('snapshot_layout', { maxDepth: 4 }, BUDGET_MS.lint)).structuredContent.layout
  const boardBox = findLayout(layout, ids.board)
  const buttonBox = findLayout(layout, ids.button)
  assert.ok(boardBox && buttonBox, 'layout reports the board and the button')
  const scale = after.width / boardBox.width
  const [r, g, b] = pixelAt(after, (buttonBox.x - boardBox.x + 12) * scale, (buttonBox.y - boardBox.y + buttonBox.height / 2) * scale)
  assert.ok(Math.abs(r - BRAND[0]) + Math.abs(g - BRAND[1]) + Math.abs(b - BRAND[2]) < 40, `the button shows the brand colour (got ${r},${g},${b})`)
  return { ids, before, after }
}

test('an agent designs, captures, lints, fixes and re-captures a screen over MCP', async context => {
  const loop = await loopHost(context, { document: { version: '1.0.0', children: [] }, headless: { chromePath: null } })
  await runDesignLoop(loop)
})

test('the same loop stays within budget on a ~20k-node document', async context => {
  const loop = await loopHost(context, { document: syntheticDocument(20_000), headless: { chromePath: null } })
  const info = (await loop.call('get_document_info', {})).structuredContent
  assert.ok(Number(info.total_nodes) >= 20_000, `fixture has ${info.total_nodes} nodes`)
  await runDesignLoop(loop)
  const reads = loop.timings.filter(item => /^(get_|list_)/.test(item.name) && item.name !== 'get_screenshot')
  const median = reads.map(item => item.ms).sort((a, b) => a - b)[Math.floor(reads.length / 2)]
  // ~3 ms when run alone; the bound leaves room for parallel test files.
  // Verify mode re-serializes the document on every call by design.
  if (process.env.DSH_VERIFY_FINGERPRINT !== '1') assert.ok(median <= 100, `median read-only call ${median} ms`)
})

const webRoot = join(root, 'web-bundle')
test('the loop renders through the headless CanvasKit browser', {
  skip: process.env.DSH_E2E_CHROME === '1' && existsSync(join(webRoot, 'op_host_web_bg.wasm'))
    ? false : 'set DSH_E2E_CHROME=1 with a built web-bundle',
  timeout: 180_000,
}, async context => {
  const out = process.env.DSH_E2E_OUT
  if (out) mkdirSync(out, { recursive: true })
  const loop = await loopHost(context, { document: { version: '1.0.0', children: [] }, headless: true, webRoot })
  const save = out ? (name, bytes) => writeFileSync(join(out, name), bytes) : undefined
  await runDesignLoop(loop, { save })
  const capture = await loop.call('get_screenshot', { maxSize: 400 })
  assert.equal(capture.structuredContent.renderer, 'canvaskit-headless')
  if (out) writeFileSync(join(out, 'timings.json'), JSON.stringify(loop.timings, null, 2))
})

test('default CanvasKit capture prefers the screen over a reusable master', {
  skip: process.env.DSH_E2E_CHROME === '1' && existsSync(join(webRoot, 'op_host_web_bg.wasm'))
    ? false : 'set DSH_E2E_CHROME=1 with a built web-bundle',
  timeout: 90_000,
}, async context => {
  const loop = await loopHost(context, { document: { version: '1.0.0', children: [
    { type: 'frame', id: 'master', reusable: true, width: 160, height: 48, fill: '#ff0000' },
    { type: 'frame', id: 'screen', x: 220, width: 400, height: 300, fill: '#0000ff' },
  ] }, headless: true, webRoot })
  const implicit = await loop.call('get_screenshot', {})
  assert.equal(implicit.structuredContent.renderer, 'canvaskit-headless')
  assert.equal(implicit.structuredContent.targetId, 'screen')
  assert.equal(screenshotPng(implicit).width, 400)
  const explicit = await loop.call('get_screenshot', { nodeId: 'master' })
  assert.equal(explicit.structuredContent.targetId, 'master')
  assert.equal(screenshotPng(explicit).width, 160)
})
