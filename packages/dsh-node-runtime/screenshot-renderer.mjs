import { randomUUID } from 'node:crypto'

const DEFAULT_MAX_SIZE = 1600
const HARD_MAX_SIZE = 4096
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const ARG_KEYS = ['nodeId', 'scale', 'maxSize', 'background', 'isolate']

function failure(message) {
  return { isError: true, content: [{ type: 'text', text: message }] }
}

export function validateScreenshotArguments(args) {
  if (!args || typeof args !== 'object' || Array.isArray(args) ||
      Object.keys(args).some(key => !ARG_KEYS.includes(key))) {
    throw new TypeError(`get_screenshot accepts only ${ARG_KEYS.join(', ')}`)
  }
  const validated = { scale: 1, maxSize: DEFAULT_MAX_SIZE, background: 'canvas' }
  if (Object.hasOwn(args, 'nodeId')) {
    if (typeof args.nodeId !== 'string' || !args.nodeId.trim()) throw new TypeError('nodeId must be a nonempty string')
    validated.nodeId = args.nodeId
  }
  if (Object.hasOwn(args, 'scale')) {
    if (!Number.isFinite(args.scale) || args.scale < 0.25 || args.scale > 4) {
      throw new TypeError('scale must be a finite number between 0.25 and 4')
    }
    validated.scale = args.scale
  }
  if (Object.hasOwn(args, 'maxSize')) {
    if (!Number.isSafeInteger(args.maxSize) || args.maxSize < 64 || args.maxSize > HARD_MAX_SIZE) {
      throw new TypeError(`maxSize must be an integer between 64 and ${HARD_MAX_SIZE}`)
    }
    validated.maxSize = args.maxSize
  }
  if (Object.hasOwn(args, 'background')) {
    if (!['canvas', 'transparent'].includes(args.background)) throw new TypeError('background must be canvas or transparent')
    validated.background = args.background
  }
  if (Object.hasOwn(args, 'isolate')) {
    if (typeof args.isolate !== 'boolean') throw new TypeError('isolate must be a boolean')
    // Sent only when set, so the default request shape stays unchanged.
    if (args.isolate) validated.isolate = true
  }
  return validated
}

// Reads the IHDR dimensions so a renderer cannot report a size that differs from the bytes.
export function pngDimensions(bytes) {
  if (bytes.length < 33 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE) ||
      bytes.toString('latin1', 12, 16) !== 'IHDR') {
    throw new TypeError('Renderer returned data that is not a PNG image')
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

function validateCapture(request, body) {
  if (typeof body.png !== 'string' || !body.png || !/^[A-Za-z0-9+/]+={0,2}$/.test(body.png)) {
    throw new TypeError('Renderer must return base64 PNG data')
  }
  const bytes = Buffer.from(body.png, 'base64')
  const { width, height } = pngDimensions(bytes)
  if (width !== body.width || height !== body.height || width < 1 || height < 1) {
    throw new TypeError('Renderer PNG dimensions do not match the reported size')
  }
  if (Math.max(width, height) > request.args.maxSize) {
    throw new TypeError('Renderer PNG exceeds the requested maxSize')
  }
  if (!Number.isFinite(body.scale) || body.scale <= 0 || body.scale > request.args.scale + 1e-6) {
    throw new TypeError('Renderer returned an invalid effective scale')
  }
  if ((body.nodeId ?? undefined) !== request.args.nodeId) throw new TypeError('Renderer returned a different nodeId')
  return bytes
}

const CLIENTS = ['editor', 'headless']
// A client that polled within this window is considered connected.
const CLIENT_FRESH_MS = 2000
// A claimed request is reserved for its client for this long.
const LEASE_MS = 15_000

export class ScreenshotRenderer {
  #requests = new Map()
  #closed = false
  #timeoutMs
  #coldTimeoutMs
  #lastPoll = new Map()
  #now

  constructor({ timeoutMs, coldTimeoutMs, now = Date.now } = {}) {
    const warm = timeoutMs ?? 20_000
    const cold = coldTimeoutMs ?? (timeoutMs ?? 45_000)
    for (const value of [warm, cold]) {
      if (!Number.isSafeInteger(value) || value <= 0) throw new TypeError('Invalid renderer timeout')
    }
    this.#timeoutMs = warm
    this.#coldTimeoutMs = cold
    this.#now = now
  }

  // Whether `client` ('editor' | 'headless') polled the queue recently.
  connected(client) {
    const last = this.#lastPoll.get(client)
    return last !== undefined && this.#now() - last < CLIENT_FRESH_MS
  }

  capture(args, version) {
    if (this.#closed) return Promise.resolve(failure('The rendering host is closed'))
    let validated
    try {
      validated = validateScreenshotArguments(args)
    } catch (error) {
      return Promise.resolve(failure(error.message))
    }
    if (!Number.isSafeInteger(version) || version < 0) {
      return Promise.resolve(failure('Invalid document version for screenshot'))
    }
    const request = { id: randomUUID(), version, args: validated }
    const warm = CLIENTS.some(client => this.connected(client))
    return new Promise(resolve => {
      const timer = setTimeout(() => {
        this.#finish(request.id, failure('Screenshot timed out; open a synchronized CanvasKit editor and retry, or use snapshot_layout and get_design_quality'))
      }, warm ? this.#timeoutMs : this.#coldTimeoutMs)
      this.#requests.set(request.id, { request, resolve, timer, lease: null })
    })
  }

  // Requests for `client` to render. The hidden headless renderer takes
  // precedence when connected so a visible editor never stalls on captures;
  // each claimed request stays with its client until its lease expires.
  pending({ client = 'editor' } = {}) {
    const now = this.#now()
    const tag = CLIENTS.includes(client) ? client : 'editor'
    this.#lastPoll.set(tag, now)
    const deferToHeadless = tag === 'editor' && this.connected('headless')
    const claimed = []
    for (const entry of this.#requests.values()) {
      const leased = entry.lease && entry.lease.until > now
      if (leased && entry.lease.client !== tag) continue
      if (!leased && deferToHeadless) continue
      entry.lease = { client: tag, until: leased ? entry.lease.until : now + LEASE_MS }
      claimed.push(structuredClone(entry.request))
    }
    return claimed
  }

  complete(body, currentVersion) {
    const pending = this.#requests.get(body?.id)
    if (!pending) throw new TypeError('Unknown or expired screenshot request')
    const { request, lease } = pending
    if (body.version !== request.version || currentVersion !== request.version) {
      this.#finish(request.id, failure('Document changed before the screenshot completed; retry on the current document'))
      return
    }
    if (typeof body.error === 'string' && body.error.trim()) {
      this.#finish(request.id, failure(`Screenshot failed: ${body.error}`))
      return
    }
    try {
      validateCapture(request, body)
    } catch (error) {
      this.#finish(request.id, failure(error.message))
      throw error
    }
    const meta = {
      source: 'canvaskit',
      renderer: lease?.client === 'headless' ? 'canvaskit-headless' : 'canvaskit-editor',
      version: request.version,
      nodeId: request.args.nodeId ?? null,
      targetId: typeof body.targetId === 'string' ? body.targetId : (request.args.nodeId ?? null),
      width: body.width,
      height: body.height,
      scale: body.scale,
      background: request.args.background,
    }
    this.#finish(request.id, {
      isError: false,
      content: [
        { type: 'image', mimeType: 'image/png', data: body.png },
        { type: 'text', text: JSON.stringify(meta) },
      ],
      structuredContent: meta,
    })
  }

  close() {
    this.#closed = true
    for (const id of this.#requests.keys()) this.#finish(id, failure('The rendering host closed before the screenshot completed'))
  }

  #finish(id, result) {
    const pending = this.#requests.get(id)
    if (!pending) throw new Error('Screenshot request is no longer pending')
    clearTimeout(pending.timer)
    this.#requests.delete(id)
    pending.resolve(result)
  }
}
