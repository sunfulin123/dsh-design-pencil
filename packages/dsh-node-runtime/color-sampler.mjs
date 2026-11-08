import { randomUUID } from 'node:crypto'

function failure(message) {
  return { isError: true, content: [{ type: 'text', text: message }] }
}

function validateArguments(args) {
  if (!args || typeof args !== 'object' || Array.isArray(args) ||
      Object.keys(args).some(key => !['x', 'y', 'nodeId'].includes(key))) {
    throw new TypeError('sample_color accepts only x/y or nodeId')
  }
  if (Object.hasOwn(args, 'nodeId')) {
    if (typeof args.nodeId !== 'string' || !args.nodeId.trim() ||
        Object.hasOwn(args, 'x') || Object.hasOwn(args, 'y')) {
      throw new TypeError('Provide a nonempty nodeId without x/y')
    }
    return { nodeId: args.nodeId }
  }
  if (!Number.isFinite(args.x) || !Number.isFinite(args.y)) {
    throw new TypeError('Provide finite document-space x and y, or a nodeId')
  }
  return { x: args.x, y: args.y }
}

function validateSample(request, body) {
  if (!Array.isArray(body.rgba) || body.rgba.length !== 4 ||
      body.rgba.some(channel => !Number.isInteger(channel) || channel < 0 || channel > 255) ||
      !Number.isFinite(body.x) || !Number.isFinite(body.y)) {
    throw new TypeError('Renderer must return finite coordinates and four RGBA8 channels')
  }
  if (request.args.nodeId !== undefined) {
    if (body.nodeId !== request.args.nodeId) throw new TypeError('Renderer returned a different nodeId')
  } else {
    for (const axis of ['x', 'y']) {
      const tolerance = Math.max(0.0001, Math.abs(request.args[axis]) * 2 ** -22)
      if (Math.abs(body[axis] - request.args[axis]) > tolerance) {
        throw new TypeError('Renderer returned a different sampling point')
      }
    }
  }
}

export class ColorSampler {
  #requests = new Map()
  #closed = false
  #timeoutMs

  constructor({ timeoutMs = 5000 } = {}) {
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) throw new TypeError('Invalid renderer timeout')
    this.#timeoutMs = timeoutMs
  }

  sample(args, version) {
    if (this.#closed) return Promise.resolve(failure('The rendering host is closed'))
    let validated
    try {
      validated = validateArguments(args)
    } catch (error) {
      return Promise.resolve(failure(error.message))
    }
    if (!Number.isSafeInteger(version) || version < 0) {
      return Promise.resolve(failure('Invalid document version for color sampling'))
    }
    const request = { id: randomUUID(), version, args: validated }
    return new Promise(resolve => {
      const timer = setTimeout(() => {
        this.#finish(request.id, failure('Color sampling timed out; open a synchronized CanvasKit editor and retry'))
      }, this.#timeoutMs)
      this.#requests.set(request.id, { request, resolve, timer })
    })
  }

  pending() {
    return [...this.#requests.values()].map(({ request }) => structuredClone(request))
  }

  complete(body, currentVersion) {
    const pending = this.#requests.get(body?.id)
    if (!pending) throw new TypeError('Unknown or expired color sampling request')
    const { request } = pending
    if (body.version !== request.version || currentVersion !== request.version) {
      this.#finish(request.id, failure('Document changed before color sampling completed; retry on the current view'))
      return
    }
    if (typeof body.error === 'string' && body.error.trim()) {
      this.#finish(request.id, failure(`Color sampling failed: ${body.error}`))
      return
    }
    try {
      validateSample(request, body)
    } catch (error) {
      this.#finish(request.id, failure(error.message))
      throw error
    }
    const channels = body.rgba[3] === 255 ? body.rgba.slice(0, 3) : body.rgba
    const result = {
      source: 'canvaskit',
      version: request.version,
      x: body.x,
      y: body.y,
      ...(request.args.nodeId === undefined ? {} : { nodeId: request.args.nodeId }),
      rgba: [...body.rgba],
      hex: `#${channels.map(channel => channel.toString(16).padStart(2, '0')).join('')}`,
    }
    this.#finish(request.id, {
      isError: false, content: [{ type: 'text', text: JSON.stringify(result) }], structuredContent: result,
    })
  }

  close() {
    this.#closed = true
    for (const id of this.#requests.keys()) this.#finish(id, failure('The rendering host closed before color sampling completed'))
  }

  #finish(id, result) {
    const pending = this.#requests.get(id)
    if (!pending) throw new Error('Color sampling request is no longer pending')
    clearTimeout(pending.timer)
    this.#requests.delete(id)
    pending.resolve(result)
  }
}
