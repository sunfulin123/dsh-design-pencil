import { randomBytes } from 'node:crypto'
import { createServer } from 'node:http'
import { basename } from 'node:path'
import { readDocumentFile, writeDocumentFile } from './document-file.mjs'
import { EngineSession } from './engine-session.mjs'
import { serveStatic } from './static-assets.mjs'

const MAX_BODY_BYTES = 32 * 1024 * 1024

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function readJson(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers['content-type'] ?? '')) {
    throw new HttpError(415, 'Content-Type must be application/json')
  }
  let length = 0
  const chunks = []
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    length += chunk.length
    if (length > MAX_BODY_BYTES) {
      request.resume()
      throw new HttpError(413, 'Request body exceeds the size limit')
    }
    chunks.push(chunk)
  }
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)))
  } catch {
    throw new HttpError(400, 'Invalid JSON request')
  }
}

function send(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  response.end(JSON.stringify(body))
}

function snapshotReply(session) {
  const snapshot = session.snapshot()
  return {
    ...snapshot,
    activePageIndex: snapshot.document.editorMeta?.activePageIndex ?? 0,
    preserveAuthoredGeometry: snapshot.document.editorMeta?.preserveAuthoredGeometry ?? false,
    scenario: snapshot.document.editorMeta?.scenario ?? null,
  }
}

function requestDocument(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Invalid document request')
  const document = typeof body.document === 'string' ? JSON.parse(body.document) : body.document
  if (!document || typeof document !== 'object' || Array.isArray(document)) throw new HttpError(400, 'Invalid document')
  const meta = { ...document.editorMeta }
  if (body.activePageIndex !== undefined) {
    if (!Number.isSafeInteger(body.activePageIndex) || body.activePageIndex < 0) throw new HttpError(400, 'Invalid activePageIndex')
    meta.activePageIndex = body.activePageIndex
  }
  if (body.preserveAuthoredGeometry !== undefined) {
    if (typeof body.preserveAuthoredGeometry !== 'boolean') throw new HttpError(400, 'Invalid preserveAuthoredGeometry')
    meta.preserveAuthoredGeometry = body.preserveAuthoredGeometry
  }
  return { ...document, editorMeta: meta }
}

async function dispatch(request, response, session, file, body, lifecycle) {
  const path = new URL(request.url, 'http://127.0.0.1').pathname
  if (request.method === 'GET' && path === '/api/mcp/server') {
    return send(response, 200, {
      running: true, port: Number(request.headers.host.split(':')[1]), localIp: '127.0.0.1',
      server: 'openpencil-mcp', mode: 'web-canvas', serveMode: 'managed',
    })
  }
  if (request.method === 'GET' && path === '/api/settings/credential-policy') {
    return send(response, 200, { serverPersistence: false })
  }
  if (request.method === 'GET' && path === '/api/ai/models') return send(response, 200, [])
  if (request.method === 'POST' && path === '/api/mcp/sync-reset') {
    return send(response, 200, { ok: true, skipped: true, version: session.snapshot().version })
  }
  if (request.method === 'GET' && path === '/api/mcp/version') {
    return send(response, 200, { version: session.snapshot().version })
  }
  if (request.method === 'GET' && path === '/api/mcp/selection') {
    return send(response, 200, session.getSelection())
  }
  if (request.method === 'POST' && path === '/api/mcp/selection') {
    if (!body || typeof body !== 'object' || !Array.isArray(body.selectedIds)) {
      throw new HttpError(400, 'Missing selectedIds array')
    }
    return send(response, 200, session.setSelection(body))
  }
  if (request.method === 'GET' && path === '/api/mcp/document') {
    return send(response, 200, snapshotReply(session))
  }
  if (request.method === 'POST' && path === '/api/mcp/document') {
    const document = requestDocument(body)
    if (body.metadataOnly !== undefined && typeof body.metadataOnly !== 'boolean') throw new HttpError(400, 'Invalid metadataOnly')
    const result = session.replace(document, body.baseVersion, { metadataOnly: body.metadataOnly === true })
    return send(response, result.ok ? 200 : 409, result.ok ? result : { ok: false, error: 'version-conflict', version: result.version })
  }
  if (request.method === 'POST' && path === '/api/file/save') {
    if (!file.path) throw new HttpError(400, 'No file path is bound to this session')
    const document = requestDocument(body)
    const version = session.snapshot().version
    const baseVersion = body.baseVersion === undefined ? version : body.baseVersion
    if (!Number.isSafeInteger(baseVersion) || baseVersion < 0) throw new HttpError(400, 'Invalid baseVersion')
    if (baseVersion !== version) return send(response, 409, { ok: false, error: 'version-conflict', version })
    const candidate = new EngineSession(document)
    candidate.close()
    try {
      file.contents = await writeDocumentFile(file.path, document, file.contents)
    } catch (error) {
      if (error.code === 'file-conflict') return send(response, 409, { ok: false, error: 'file-conflict', version })
      throw new HttpError(500, 'Document could not be saved')
    }
    const result = session.replace(document, version)
    return send(response, 200, { ...result, fileName: basename(file.path) })
  }
  if (request.method === 'POST' && path === '/mcp') {
    const call = body
    if (!call || call.jsonrpc !== '2.0' || typeof call.method !== 'string' ||
        (call.id !== undefined && typeof call.id !== 'string' && typeof call.id !== 'number' && call.id !== null)) {
      throw new HttpError(400, 'Invalid JSON-RPC request')
    }
    if (call.method === 'notifications/initialized' && call.id === undefined) {
      response.writeHead(202)
      return response.end()
    }
    const reply = result => send(response, 200, { jsonrpc: '2.0', id: call.id ?? null, result })
    if (call.method === 'openpencil/shutdown' && call.params?.token === lifecycle.token) {
      response.once('finish', () => setImmediate(lifecycle.stop))
      return reply({ ok: true, shuttingDown: true })
    }
    if (call.method === 'initialize') {
      return reply({ protocolVersion: '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'dsh-design-pencil', version: '0.8.5' } })
    }
    if (call.method === 'ping') return reply({})
    if (call.method === 'tools/list') return reply({ tools: session.listTools() })
    if (call.method !== 'tools/call') {
      return send(response, 200, { jsonrpc: '2.0', id: call.id ?? null, error: { code: -32601, message: 'Method not found' } })
    }
    if (typeof call.params?.name !== 'string' || !call.params.name ||
        (call.params.arguments !== undefined && (!call.params.arguments || typeof call.params.arguments !== 'object' || Array.isArray(call.params.arguments)))) {
      return send(response, 200, { jsonrpc: '2.0', id: call.id ?? null, error: { code: -32602, message: 'Invalid tool arguments' } })
    }
    return reply(await session.callToolAsync(call.params.name, call.params.arguments ?? {}))
  }
  return send(response, 404, { ok: false, error: 'Not found' })
}

export async function startNodeHost({ document, allowOrigins = [], sourcePath, webRoot, canvaskitRoot, onShutdown }) {
  const file = { path: sourcePath, contents: sourcePath ? await readDocumentFile(sourcePath) : null }
  const session = new EngineSession(document)
  const origins = new Set(allowOrigins)
  const lifecycle = { token: randomBytes(32).toString('hex'), stop: () => host.close().then(() => onShutdown?.()) }
  let mutations = Promise.resolve()
  const server = createServer(async (request, response) => {
    const port = server.address()?.port
    const origin = request.headers.origin
    if (request.headers.host !== `127.0.0.1:${port}` ||
        (origin !== undefined && origin !== `http://127.0.0.1:${port}` && !origins.has(origin))) {
      request.resume()
      return send(response, 403, { ok: false, error: 'Request origin is not allowed' })
    }
    if (origin !== undefined) {
      response.setHeader('access-control-allow-origin', origin)
      response.setHeader('vary', 'Origin')
    }
    response.setHeader('x-content-type-options', 'nosniff')
    if (request.method === 'OPTIONS') {
      response.setHeader('access-control-allow-methods', 'GET, HEAD, POST, OPTIONS')
      response.setHeader('access-control-allow-headers', 'Content-Type, X-OpenPencil-Token')
      response.writeHead(204)
      return response.end()
    }
    try {
      if (await serveStatic(request, response, { webRoot, canvaskitRoot })) return
      const path = new URL(request.url, 'http://127.0.0.1').pathname
      const mutating = request.method === 'POST' && ['/mcp', '/api/mcp/document', '/api/mcp/selection', '/api/mcp/sync-reset', '/api/file/save'].includes(path)
      const body = mutating ? await readJson(request) : undefined
      const execute = () => dispatch(request, response, session, file, body, lifecycle)
      if (mutating) {
        const operation = mutations.then(execute)
        mutations = operation.catch(() => {})
        await operation
      } else {
        await execute()
      }
    } catch (error) {
      request.resume()
      if (!response.headersSent) send(response, error instanceof HttpError ? error.status : 400, { ok: false, error: 'Request was rejected' })
      else response.end()
    }
  })
  server.requestTimeout = 15_000
  server.headersTimeout = 10_000
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
  } catch (error) {
    session.close()
    throw error
  }
  let closing
  const host = {
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    token: lifecycle.token,
    close() {
      if (!closing) {
        closing = new Promise((resolve, reject) => {
          server.close(async error => {
            await mutations
            session.close()
            if (error) reject(error)
            else resolve()
          })
          server.closeAllConnections()
        })
      }
      return closing
    },
  }
  return host
}