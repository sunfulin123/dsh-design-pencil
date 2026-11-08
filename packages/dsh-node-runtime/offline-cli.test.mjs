import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { EngineSession } from './engine-session.mjs'
import { runOfflineCommand } from './offline-cli.mjs'

const cli = fileURLToPath(new URL('./cli.mjs', import.meta.url))
const runtime = fileURLToPath(new URL('.', import.meta.url))
const original = {
  version: '0.8.5', pluginData: { provider: { enabled: true } },
  designMd: { raw: '# Existing brief', pluginData: { keep: true } },
  editorMeta: { pluginData: { keep: ['nested metadata'] } },
  children: [{
    id: 'existing', type: 'rectangle', width: 90, height: 40,
    customNode: { nested: ['keep'] }, fill: [{ type: 'solid', color: '#123456' }],
  }],
}

async function fixture(context) {
  const root = await mkdtemp(join(runtime, '.offline-cli-test-'))
  context.after(() => rm(root, { recursive: true, force: true }))
  const file = join(root, 'design.op')
  await writeFile(file, JSON.stringify(original))
  return { root, file }
}

function run(args) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    encoding: 'utf8', timeout: 15_000,
    env: { ...process.env, OPENPENCIL_WEB_BUNDLE_DIR: '/nonexistent-offline-web-bundle' },
  })
  assert.ifError(result.error)
  return result
}

function success(args) {
  const result = run(args)
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stderr, '')
  const output = JSON.parse(result.stdout)
  assert.equal(Object.hasOwn(output, 'port'), false, 'offline commands must not start a host')
  return output
}

function nodes(document) {
  return (document.children ?? []).flatMap(node => [node, ...nodes(node)])
}

for (const extension of ['mmd', 'mermaid', 'drawio', 'xml']) {
  test(`offline CLI imports ${extension} as editable nodes and preserves existing fields`, async context => {
    const { root, file } = await fixture(context)
    const source = join(root, `source.${extension}`)
    await writeFile(source, ['mmd', 'mermaid'].includes(extension)
      ? 'flowchart LR\n A[Start] --> B[End]'
      : '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>' +
        '<mxCell id="box" value="Start" vertex="1" parent="1">' +
        '<mxGeometry x="10" y="20" width="100" height="50" as="geometry"/>' +
        '</mxCell></root></mxGraphModel>')
    success(['import', source, '--file', file])
    const saved = JSON.parse(await readFile(file, 'utf8'))
    assert.deepEqual({ ...saved, children: original.children }, original,
      'diagram import must only add nodes, not rewrite unrelated top-level fields')
    assert.deepEqual(saved.pluginData, original.pluginData)
    assert.deepEqual(saved.children[0], original.children[0])
    const text = nodes(saved).find(node => node.type === 'text' && node.content === 'Start')
    assert.ok(text, 'imported labels must be editable text')
    assert.ok(nodes(saved).some(node => node.type === 'rectangle' && node.id !== 'existing'))
    const reopened = new EngineSession(saved)
    try {
      assert.equal(reopened.callTool('set_node_text', { node_id: text.id, text: 'Edited' }).isError, false)
      assert.ok(nodes(reopened.snapshot().document).some(node => node.content === 'Edited'))
    } finally {
      reopened.close()
    }
    assert.deepEqual((await readdir(root)).sort(), ['design.op', `source.${extension}`].sort())
  })
}

test('offline CLI imports and exports DTCG tokens without rewriting the document on export', async context => {
  const { root, file } = await fixture(context)
  const source = join(root, 'tokens.json')
  await writeFile(source, JSON.stringify({
    brand: { $type: 'color', $value: '#123456' },
    spacing: { $type: 'dimension', $value: { value: 12, unit: 'px' } },
  }))
  success(['tokens', 'import', source, '--file', file])
  const before = await readFile(file)
  const saved = JSON.parse(before)
  const { variables, ...unchanged } = saved
  assert.deepEqual(unchanged, original, 'token import must only modify variables')
  assert.equal(variables.brand.value, '#123456')
  assert.equal(variables.spacing.value, 12)
  assert.deepEqual(saved.children, original.children)
  assert.deepEqual(saved.pluginData, original.pluginData)
  const exported = success(['tokens', 'export', '--file', file])
  assert.equal(exported.brand.$type, 'color')
  assert.equal(exported.spacing.$value, 12)
  const output = join(root, 'exported.json')
  success(['tokens', 'export', '--file', file, '--output', output])
  assert.deepEqual(JSON.parse(await readFile(output, 'utf8')), exported)
  assert.deepEqual(await readFile(file), before)
})

test('offline CLI rejects invalid input and unsafe output without changing the source', async context => {
  const { root, file } = await fixture(context)
  const before = await readFile(file)
  for (const [name, content, args] of [
    ['broken.mmd', 'sequenceDiagram\nAlice->>Bob: Hello', ['import']],
    ['broken.xml', '<not-a-diagram/>', ['import']],
    ['broken.json', '{invalid', ['tokens', 'import']],
    ['unsupported.json', '{"x":{"$type":"duration","$value":"2s"}}', ['tokens', 'import']],
    ['broken.svg', '<svg/>', ['import']],
  ]) {
    const source = join(root, name)
    await writeFile(source, content)
    const result = run([...args, source, '--file', file])
    assert.notEqual(result.status, 0, name)
    assert.ok(result.stderr.trim(), name)
    assert.equal(result.stdout, '')
    assert.deepEqual(await readFile(file), before)
  }
  for (const args of [
    ['import', '--file', file],
    ['tokens', 'export', '--file', file, '--output', file],
    ['tokens', 'export', '--file', file, '--serve-web', '--managed'],
    ['tokens', 'export', '--file', file, '--output', join(root, 'missing', 'out.json')],
    ['tool', 'delete_node', '--args', '{"node_id":"existing"}', '--file', file],
  ]) {
    const result = run(args)
    assert.notEqual(result.status, 0, JSON.stringify(args))
    assert.ok(result.stderr.trim())
    assert.deepEqual(await readFile(file), before)
  }
})

test('offline imports retain page, nested node and variable extensions', async context => {
  const { root, file } = await fixture(context)
  const document = {
    ...original,
    pages: [{
      id: 'page', name: 'Page', pageExtension: { keep: true },
      children: [{ id: 'frame', type: 'frame', width: 100, height: 100, frameExtension: 42,
        children: original.children }],
    }],
    themes: { Mode: ['Light'] },
    variables: {
      old: { type: 'number', value: 1, variableExtension: 'keep' },
      unchanged: { type: 'number', value: [
        { value: 8, theme: { Mode: 'Light' }, pluginData: { keep: true } },
      ] },
    },
  }
  await writeFile(file, JSON.stringify(document))
  const source = join(root, 'tokens.json')
  await writeFile(source, '{"old":{"$type":"number","$value":2}}')
  success(['tokens', 'import', source, '--file', file])
  const saved = JSON.parse(await readFile(file, 'utf8'))
  assert.deepEqual(saved.pages, document.pages)
  assert.equal(saved.variables.old.value, 2)
  assert.equal(saved.variables.old.variableExtension, 'keep')
  assert.deepEqual(saved.variables.unchanged, document.variables.unchanged)
  assert.deepEqual({ ...saved, variables: document.variables }, document)
})

test('offline imports use atomic replacement and reject malformed tool replies', async context => {
  const { root, file } = await fixture(context)
  const source = join(root, 'source.mmd')
  await writeFile(source, 'flowchart LR\n A[Start] --> B[End]')
  const before = await readFile(file)
  const oldCall = EngineSession.prototype.callTool
  for (const result of [
    { isError: false },
    { isError: false, structuredContent: { wrote: 'false', nodeCount: '0' } },
    { isError: true, content: [{ type: 'text', text: 'Tool rejected import' }] },
  ]) {
    EngineSession.prototype.callTool = () => result
    try {
      await assert.rejects(runOfflineCommand(['import', source, '--file', file]), /import_mermaid:/)
      assert.deepEqual(await readFile(file), before)
    } finally {
      EngineSession.prototype.callTool = oldCall
    }
  }
  const oldInode = (await stat(file)).ino
  success(['import', source, '--file', file])
  assert.notEqual((await stat(file)).ino, oldInode, 'save must replace via atomic rename')
  assert.deepEqual((await readdir(root)).sort(), ['design.op', 'source.mmd'])
})

test('offline saves reject external changes and remove the adjacent temporary file', async context => {
  const { root, file } = await fixture(context)
  const source = join(root, 'source.mmd')
  await writeFile(source, 'flowchart LR\n A[Start] --> B[End]')
  const external = JSON.stringify({ ...original, externalWriter: true })
  const oldCall = EngineSession.prototype.callTool
  EngineSession.prototype.callTool = function (...args) {
    const result = oldCall.apply(this, args)
    writeFileSync(file, external)
    return result
  }
  try {
    await assert.rejects(runOfflineCommand(['import', source, '--file', file]), /changed on disk/)
    assert.equal(await readFile(file, 'utf8'), external)
    assert.deepEqual((await readdir(root)).sort(), ['design.op', 'source.mmd'])
  } finally {
    EngineSession.prototype.callTool = oldCall
  }
})
