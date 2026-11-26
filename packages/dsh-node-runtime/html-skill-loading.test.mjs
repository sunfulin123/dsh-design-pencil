/** The HTML POC Skill loads references only through its condition table and never installs packages from a shell. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { checkEvidenceLedger } from '../../crates/op-ai-skills/skills/synapse-design-html/scripts/verify-evidence.mjs'
import { PROTOTYPE_TOOL_TEXT } from './prototype-authoring.mjs'
import { readGuide } from './guide-text.test-helper.mjs'

const skillRoot = new URL('../../crates/op-ai-skills/skills/synapse-design-html/', import.meta.url)
// The Cobalt package exports its skill references into the same `references/` folder at staging.
const cobaltSkillRoot = new URL('../talkdesk-cobalt/skill/', import.meta.url)
const VAGUE = [/when relevant/i, /if relevant/i, /only if needed/i, /as needed/i, /if helpful/i, /where appropriate/i, /optional supporting/i]

async function skill() {
  return readFile(new URL('SKILL.md', skillRoot), 'utf8')
}

/** Parse the `## Reference Loading` table into rows of {row, condition, stage, files}. */
export function loadingTable(text) {
  const start = text.indexOf('## Reference Loading')
  assert.ok(start >= 0, 'SKILL.md has a Reference Loading section')
  const section = text.slice(start, text.indexOf('\n## ', start + 1))
  return section.split('\n').filter(line => /^\| `[a-z-]+` \|/u.test(line)).map(line => {
    const [row, condition, stage, read] = line.split('|').slice(1, -1).map(cell => cell.trim())
    return { row: row.replaceAll('`', ''), condition, stage, files: [...read.matchAll(/`(references\/[^`]+)`/gu)].map(match => match[1]) }
  })
}

async function exists(path) {
  const found = await Promise.all([skillRoot, cobaltSkillRoot].map(root => access(new URL(path, root)).then(() => true, () => false)))
  return found.includes(true)
}

test('every loading-table row names an observable condition, a stage and existing files', async () => {
  const rows = loadingTable(await skill())
  assert.ok(rows.length >= 8, `${rows.length} rows`)
  assert.equal(new Set(rows.map(row => row.row)).size, rows.length, 'row ids are unique')
  for (const row of rows) {
    assert.ok(row.stage.split(', ').every(stage => ['B', 'C', 'D'].includes(stage)), `${row.row} stage ${row.stage}`)
    assert.ok(row.condition.length > 0, `${row.row} has a condition`)
    for (const pattern of VAGUE) assert.doesNotMatch(row.condition, pattern, `${row.row} condition`)
    assert.ok(row.files.length > 0, `${row.row} reads at least one file`)
  }
  const files = rows.flatMap(row => row.files.map(file => ({ row: row.row, file })))
  const present = await Promise.all(files.map(item => exists(item.file)))
  files.forEach((item, index) => assert.ok(present[index], `${item.row}: ${item.file} exists`))
  for (const always of ['judgement', 'poc-review']) {
    assert.equal(rows.find(row => row.row === always)?.condition, 'always', always)
  }
})

test('reference paths appear only in the loading table and the Skill has no vague loading words', async () => {
  const text = await skill()
  const start = text.indexOf('## Reference Loading')
  const end = text.indexOf('\n## ', start + 1)
  const outside = text.slice(0, start) + text.slice(end)
  assert.deepEqual([...outside.matchAll(/references\/[\w./-]+\.md/gu)].map(match => match[0]), [])
  for (const pattern of VAGUE) assert.doesNotMatch(text, pattern)
})

test('the Skill, review guide and prototype tool forbid shell package installs', async () => {
  const shellBan = /never run `?pnpm`?, `?npm`? or `?yarn`? `?install`?\/`?add`?\/`?i`? in a shell/i
  assert.match(await skill(), shellBan)
  assert.match(await readGuide(new URL('references/poc-review.md', skillRoot)), shellBan)
  assert.match(PROTOTYPE_TOOL_TEXT.description, shellBan)
  assert.match(PROTOTYPE_TOOL_TEXT.description, /\.pnpm-store/)
  for (const pattern of VAGUE) assert.doesNotMatch(PROTOTYPE_TOOL_TEXT.description, pattern)
})

test('the evidence ledger accepts an optional contextSelection and rejects a malformed one', () => {
  const base = { targetViewports: [], renderedEvidence: [] }
  const contextErrors = report => checkEvidenceLedger({ ...base, ...report }, '/nonexistent').filter(error => error.startsWith('contextSelection'))
  assert.deepEqual(contextErrors({}), [], 'older ledgers omit it')
  assert.deepEqual(contextErrors({ contextSelection: [{ row: 'judgement', stage: 'B', files: ['references/judgement.md'] }] }), [])
  for (const contextSelection of [{}, [{ row: 'judgement', stage: 'A', files: [] }], [{ row: '', stage: 'B', files: [] }], [{ row: 'forms', stage: 'C' }]]) {
    assert.equal(contextErrors({ contextSelection }).length, 1, JSON.stringify(contextSelection))
  }
})

/** Bytes the model must read on the normal path: SKILL.md plus every unconditional row and the style row. */
async function forcedReadBytes(styleRow) {
  const text = await skill()
  const rows = loadingTable(text)
  const files = rows.filter(row => row.condition === 'always' || row.row === styleRow).flatMap(row => row.files)
  // Each file lives in exactly one source; the other read fails and counts zero.
  const sizes = await Promise.all(files.flatMap(file => [skillRoot, cobaltSkillRoot]
    .map(root => readFile(new URL(file, root)).then(bytes => bytes.byteLength, () => 0))))
  return { bytes: Buffer.byteLength(text) + sizes.reduce((sum, size) => sum + size, 0), files }
}

test('forced reads stay within 24 KiB for ordinary HTML and 32 KiB for Cobalt', async () => {
  const html = await forcedReadBytes('html-review')
  const cobalt = await forcedReadBytes('cobalt')
  assert.ok(html.bytes <= 24 * 1024, `ordinary HTML forced read is ${html.bytes} bytes: ${html.files.join(', ')}`)
  assert.ok(cobalt.bytes <= 32 * 1024, `Cobalt forced read is ${cobalt.bytes} bytes: ${cobalt.files.join(', ')}`)
  for (const file of [...html.files, ...cobalt.files]) assert.match(file, /summary\.md$/u, `${file} is a stage summary`)
})

test('every stage summary links existing section files and its full guide', async () => {
  const summaries = [
    [skillRoot, 'references/judgement-summary.md'], [skillRoot, 'references/direction/surface-modes-summary.md'],
    [skillRoot, 'references/poc-review/summary.md'], [skillRoot, 'references/html-review/summary.md'],
    [cobaltSkillRoot, 'references/cobalt-workspace/summary.md'],
  ]
  await Promise.all(summaries.map(async ([root, path]) => {
    const url = new URL(path, root)
    const links = [...(await readFile(url, 'utf8')).matchAll(/\]\(([^)#]+\.md)\)/gu)].map(match => match[1])
    assert.ok(links.length >= 1, `${path} links its guide`)
    await Promise.all(links.map(link => access(new URL(link, url)).catch(() => { throw new Error(`${path} links missing ${link}`) })))
  }))
})
