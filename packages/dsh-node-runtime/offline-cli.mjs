import { readFile, realpath } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { isDeepStrictEqual, parseArgs } from 'node:util'
import { readDocumentFile, writeDocumentFile } from './document-file.mjs'
import { EngineSession } from './engine-session.mjs'

const usage = 'Expected import <source.mmd|mermaid|drawio|xml> --file <existing.op>, ' +
  'tokens import <tokens.json> --file <existing.op>, or ' +
  'tokens export --file <existing.op> [--output <tokens.json>]'

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function parseCommand(args) {
  const { values, positionals } = parseArgs({
    args, allowPositionals: true,
    options: { file: { type: 'string' }, output: { type: 'string' } },
  })
  if (!values.file) throw new Error(usage)
  const [command, action, source] = positionals
  if (command === 'import' && positionals.length === 2 && !values.output) {
    const extension = extname(action).toLowerCase()
    const tool = { '.mmd': 'import_mermaid', '.mermaid': 'import_mermaid',
      '.drawio': 'import_drawio', '.xml': 'import_drawio' }[extension]
    if (!tool) throw new Error('Unsupported diagram extension; use .mmd, .mermaid, .drawio or .xml')
    return { file: values.file, source: action, tool }
  }
  if (command === 'tokens' && action === 'import' && positionals.length === 3 && !values.output) {
    return { file: values.file, source, tool: 'import_design_tokens' }
  }
  if (command === 'tokens' && action === 'export' && positionals.length === 2) {
    return { file: values.file, output: values.output, tool: 'export_design_tokens' }
  }
  throw new Error(usage)
}

function checkedResult(session, tool, args) {
  if (!session.listTools().some(entry => entry.name === tool)) {
    throw new Error(`The active engine does not expose ${tool}`)
  }
  const result = session.callTool(tool, args)
  if (result?.isError !== false) {
    const message = result?.content?.filter(item => item.type === 'text').map(item => item.text).join('\n')
    throw new Error(`${tool}: ${message || 'tool failed'}`)
  }
  const data = result.structuredContent
  if (!object(data)) throw new Error(`${tool}: invalid tool result`)
  if (tool === 'export_design_tokens') {
    const tokens = typeof data.tokens === 'string' ? JSON.parse(data.tokens) : null
    if (!object(tokens)) throw new Error(`${tool}: invalid tokens result`)
    return tokens
  }
  const count = tool === 'import_design_tokens' ? data.count : data.nodeCount
  if (!/^\d+$/.test(String(count)) || !Number.isSafeInteger(Number(count)) ||
      (tool !== 'import_design_tokens' && (data.wrote !== 'true' || Number(count) === 0))) {
    throw new Error(`${tool}: invalid import result`)
  }
  return data
}

function canonicalVariables(session) {
  const result = session.callTool('get_variables', {})
  const variables = result?.isError === false && typeof result.structuredContent?.variables === 'string'
    ? JSON.parse(result.structuredContent.variables) : null
  if (!object(variables)) throw new Error('get_variables: invalid tool result')
  return variables
}

// Only merge each bounded import's actual changes, not unrelated schema normalization.
function preserveExistingContent(original, imported, tool, beforeVariables) {
  function mergeNodes(before = [], after = []) {
    const beforeIds = new Set(before.map(node => node.id))
    const afterById = new Map(after.map(node => [node.id, node]))
    const retained = before.map(node => {
      const importedNode = afterById.get(node.id)
      if (!importedNode?.children?.length) return node
      return { ...node, children: mergeNodes(node.children, importedNode.children) }
    })
    return [...retained, ...after.filter(node => !beforeIds.has(node.id))]
  }
  const document = { ...original }
  if (tool === 'import_design_tokens') {
    const variables = { ...original.variables }
    for (const [name, value] of Object.entries(imported.variables ?? {})) {
      if (!isDeepStrictEqual(beforeVariables[name], value)) {
        variables[name] = { ...original.variables?.[name], ...value }
      }
    }
    if (original.variables || Object.keys(variables).length) document.variables = variables
  } else {
    document.children = mergeNodes(original.children, imported.children)
    if (Array.isArray(imported.pages)) document.pages = mergeNodes(original.pages, imported.pages)
  }
  return document
}

export async function runOfflineCommand(args) {
  const command = parseCommand(args)
  const file = await realpath(command.file)
  const before = await readFile(file)
  const document = JSON.parse(before.toString('utf8'))
  let output
  let outputBefore
  if (command.output) {
    output = await realpath(command.output).catch(error => {
      if (error.code !== 'ENOENT') throw error
      return resolve(command.output)
    })
    if (output === file) throw new Error('Token output must not overwrite the source document')
    outputBefore = await readDocumentFile(output)
  }
  let toolArgs = {}
  if (command.source) {
    const source = await readFile(command.source, 'utf8')
    if (command.tool === 'import_design_tokens') {
      const tokens = JSON.parse(source)
      if (!object(tokens)) throw new Error('Tokens must be a JSON object')
      toolArgs = { tokens }
    } else {
      toolArgs = command.tool === 'import_mermaid' ? { mermaid: source } : { xml: source }
    }
  }
  const session = new EngineSession(document)
  try {
    const beforeVariables = command.tool === 'import_design_tokens' ? canonicalVariables(session) : null
    const result = checkedResult(session, command.tool, toolArgs)
    if (command.tool === 'export_design_tokens') {
      if (output) {
        await writeDocumentFile(output, result, outputBefore)
        return { ok: true, output }
      }
      return result
    }
    const next = preserveExistingContent(document, session.snapshot().document, command.tool, beforeVariables)
    const validation = new EngineSession(next)
    validation.close()
    await writeDocumentFile(file, next, before)
    return { ok: true, file, tool: command.tool, ...result }
  } finally {
    session.close()
  }
}
