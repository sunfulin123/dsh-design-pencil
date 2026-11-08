// Figma REST client shared by the synchronous importer and the chunked
// import jobs: one timeout policy, typed error codes, and bounded retries.

export const DEFAULT_FIGMA_TIMEOUT_MS = 60_000
const MIN_FIGMA_TIMEOUT_MS = 10_000
const MAX_FIGMA_TIMEOUT_MS = 600_000
const MAX_RETRY_DELAY_MS = 30_000

export class FigmaApiError extends Error {
  constructor(code, message, { status, retryable = false, nodeId, nodeName, retryAfterMs } = {}) {
    super(message)
    this.name = 'FigmaApiError'
    this.code = code
    this.status = status
    this.retryable = retryable
    this.nodeId = nodeId
    this.nodeName = nodeName
    this.retryAfterMs = retryAfterMs
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      ...(this.status !== undefined ? { status: this.status } : {}),
      ...(this.nodeId ? { nodeId: this.nodeId } : {}),
      ...(this.nodeName ? { nodeName: this.nodeName } : {}),
    }
  }
}

export function figmaApiBase(env = process.env) {
  const raw = String(env.DSH_FIGMA_API_BASE ?? '').trim()
  if (!raw) return 'https://api.figma.com'
  const parsed = new URL(raw)
  const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname)
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && loopback)) {
    throw new TypeError('DSH_FIGMA_API_BASE must be https or a loopback http URL')
  }
  return parsed.href.replace(/\/+$/, '')
}

export function figmaRequestTimeoutMs(env = process.env) {
  const raw = env.DSH_FIGMA_TIMEOUT_MS
  if (raw === undefined || String(raw).trim() === '') return DEFAULT_FIGMA_TIMEOUT_MS
  const value = Number(raw)
  if (!Number.isFinite(value)) throw new TypeError('DSH_FIGMA_TIMEOUT_MS must be a finite number')
  return Math.min(MAX_FIGMA_TIMEOUT_MS, Math.max(MIN_FIGMA_TIMEOUT_MS, Math.round(value)))
}

function describeTarget({ nodeId, nodeName }) {
  if (!nodeId) return 'the requested file'
  return nodeName ? `node ${nodeId} (${nodeName})` : `node ${nodeId}`
}

function retryAfterMs(response) {
  const header = response.headers.get('retry-after')
  if (!header) return undefined
  const seconds = Number(header)
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
  const date = Date.parse(header)
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : undefined
}

function errorForStatus(response, bodyText, target) {
  const status = response.status
  const detail = bodyText ? `: ${bodyText.slice(0, 200)}` : ''
  const where = describeTarget(target)
  if (status === 401 || status === 403) {
    return new FigmaApiError('FIGMA_AUTH', `Figma rejected the access token for ${where} (HTTP ${status}); check FIGMA_TOKEN scopes and file access${detail}`, { status, ...target })
  }
  if (status === 404) {
    return new FigmaApiError('FIGMA_NOT_FOUND', `Figma could not find ${where} (HTTP 404)${detail}`, { status, ...target })
  }
  if (status === 429) {
    return new FigmaApiError('FIGMA_RATE_LIMITED', `Figma rate limit reached while fetching ${where}`, {
      status, retryable: true, retryAfterMs: retryAfterMs(response), ...target,
    })
  }
  if (status === 413 || (status === 400 && /too large|too many|exceed/i.test(bodyText))) {
    return new FigmaApiError('FIGMA_NODE_TOO_LARGE', `Figma refused to return ${where} because the response is too large${detail}`, { status, ...target })
  }
  if (status >= 500) {
    return new FigmaApiError('FIGMA_SERVER', `Figma API returned HTTP ${status} for ${where}`, { status, retryable: true, ...target })
  }
  return new FigmaApiError('FIGMA_HTTP', `Figma API returned HTTP ${status} for ${where}${detail}`, { status, ...target })
}

const sleep = (ms, signal) => new Promise((resolve, reject) => {
  if (signal?.aborted) return reject(signal.reason)
  const abort = () => { clearTimeout(timer); reject(signal.reason) }
  const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve() }, ms)
  signal?.addEventListener('abort', abort, { once: true })
})

async function fetchOnce(url, { headers, timeoutMs, signal, target, fetchImpl, kind }) {
  const timeout = AbortSignal.timeout(timeoutMs)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout
  try {
    const response = await fetchImpl(url, { headers, redirect: 'follow', signal: combined })
    if (!response.ok) throw errorForStatus(response, await response.text(), target)
    const limit = 64 * 1024 * 1024
    const reader = response.body.getReader()
    const chunks = []
    let length = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > limit) {
        await reader.cancel()
        throw new FigmaApiError('FIGMA_NODE_TOO_LARGE', `Response for ${describeTarget(target)} exceeded 64 MiB`, target)
      }
      chunks.push(Buffer.from(value))
    }
    const bytes = Buffer.concat(chunks)
    if (kind === 'bytes') return bytes
    try { return JSON.parse(bytes.toString('utf8')) } catch {
      throw new FigmaApiError('FIGMA_INVALID_RESPONSE', `Figma returned invalid JSON for ${describeTarget(target)}`, target)
    }
  } catch (error) {
    if (signal?.aborted) throw signal.reason ?? error
    if (error instanceof FigmaApiError) throw error
    if (timeout.aborted) {
      throw new FigmaApiError(
        'FIGMA_TIMEOUT',
        `Figma API did not respond within ${Math.round(timeoutMs / 1000)}s for ${describeTarget(target)}. ` +
          'Import it as an async chunked job (import_figma mode:"async"), import a smaller nodeIds subset, ' +
          'or copy the frames in Figma and paste them into the editor.',
        { retryable: true, ...target },
      )
    }
    throw new FigmaApiError('FIGMA_NETWORK', `Could not reach Figma for ${describeTarget(target)}: ${error?.message ?? error}`, { retryable: true, ...target })
  }
}

/**
 * Fetch a Figma resource with the shared timeout and bounded retry policy.
 * `kind` is `json` for API calls and `bytes` for image downloads.
 */
export async function figmaFetch(url, {
  token,
  kind = 'json',
  timeoutMs = figmaRequestTimeoutMs(),
  retries = 3,
  signal,
  nodeId,
  nodeName,
  fetchImpl = globalThis.fetch,
  onRetry,
} = {}) {
  const target = { nodeId, nodeName }
  const headers = token ? { 'X-Figma-Token': token } : {}
  let attempt = 0
  for (;;) {
    let failure
    try {
      return await fetchOnce(url, { headers, timeoutMs, signal, target, fetchImpl, kind })
    } catch (error) {
      if (!(error instanceof FigmaApiError)) throw error
      failure = error
    }
    // A timed-out request is retried once at most: repeating a 60s wait
    // three times would hide the real fix (chunking) behind minutes of delay.
    const limit = failure.code === 'FIGMA_TIMEOUT' ? Math.min(retries, 1) : retries
    if (!failure.retryable || attempt >= limit) throw failure
    attempt += 1
    const backoff = failure.retryAfterMs ?? Math.min(MAX_RETRY_DELAY_MS, 500 * 2 ** (attempt - 1))
    onRetry?.({ attempt, delayMs: backoff, error: failure })
    await sleep(backoff, signal)
  }
}

export function figmaNodesUrl(fileKey, ids, { geometry = true, depth, version } = {}) {
  const params = new URLSearchParams({ ids: ids.join(',') })
  if (geometry) params.set('geometry', 'paths')
  if (depth !== undefined) params.set('depth', String(depth))
  if (version !== undefined) params.set('version', String(version))
  return `${figmaApiBase()}/v1/files/${encodeURIComponent(fileKey)}/nodes?${params}`
}

export function figmaFileUrl(fileKey, { geometry = true, depth } = {}) {
  const params = new URLSearchParams()
  if (geometry) params.set('geometry', 'paths')
  if (depth !== undefined) params.set('depth', String(depth))
  const query = params.toString()
  return `${figmaApiBase()}/v1/files/${encodeURIComponent(fileKey)}${query ? `?${query}` : ''}`
}

export function figmaImageFillsUrl(fileKey) {
  return `${figmaApiBase()}/v1/files/${encodeURIComponent(fileKey)}/images`
}

export function figmaRenderUrl(fileKey, ids, { scale = 1, format = 'png' } = {}) {
  const params = new URLSearchParams({ ids: ids.join(','), scale: String(scale), format })
  return `${figmaApiBase()}/v1/images/${encodeURIComponent(fileKey)}?${params}`
}

export function parseFigmaWebUrl(rawUrl) {
  try {
    const parsed = new URL(String(rawUrl ?? '').trim())
    if (!/(?:^|\.)figma\.com$/i.test(parsed.hostname)) return null
    const match = /^\/(?:design|file|proto|board)\/([A-Za-z0-9]+)(?:\/([^/?#]+))?/i.exec(parsed.pathname)
    if (!match) return null
    const rawNodeId = parsed.searchParams.get('node-id')
    return {
      fileKey: match[1],
      title: match[2] ? decodeURIComponent(match[2]).replace(/[-_]+/g, ' ') : undefined,
      nodeId: rawNodeId ? rawNodeId.replace(/-/g, ':') : undefined,
    }
  } catch {
    return null
  }
}

export function resolveFigmaToken(explicit, env = process.env) {
  return String(explicit || env.FIGMA_TOKEN || env.FIGMA_ACCESS_TOKEN || '').trim()
}
