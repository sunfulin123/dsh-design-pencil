// Image resolution for Figma REST imports. Each import asks Figma for the
// file's image-fill URL map once, then downloads each referenced image at
// most once and inlines it as a data URL (large images stay remote).

import { FigmaApiError, figmaFetch, figmaImageFillsUrl } from './figma-rest-client.mjs'

export const MAX_INLINE_IMAGE_BYTES = 6 * 1024 * 1024
const DOWNLOAD_CONCURRENCY = 6

/** Every `imageRef` in a REST payload (fills, strokes, text overrides). */
export function collectImageRefs(value, out = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectImageRefs(item, out)
  } else if (value && typeof value === 'object') {
    if (typeof value.imageRef === 'string' && value.imageRef.trim()) out.add(value.imageRef.trim())
    for (const child of Object.values(value)) {
      if (child && typeof child === 'object') collectImageRefs(child, out)
    }
  }
  return out
}

export function guessImageMime(bytes) {
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png'
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[8] === 0x57 && bytes[9] === 0x45) return 'image/webp'
  if (bytes.length >= 4 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'image/gif'
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString('utf8').startsWith('<svg')) return 'image/svg+xml'
  return 'image/png'
}

export class FigmaImageResolver {
  #fileKey
  #token
  #signal
  #urlMap = null
  #resolved = new Map()
  #warnings = []
  #missing = new Set()
  #timeoutMs

  constructor({ fileKey, token, signal, timeoutMs }) {
    this.#fileKey = fileKey
    this.#token = token
    this.#signal = signal
    this.#timeoutMs = timeoutMs
  }

  get warnings() {
    return [...this.#warnings]
  }

  async #urls() {
    if (this.#urlMap) return this.#urlMap
    try {
      const payload = await figmaFetch(figmaImageFillsUrl(this.#fileKey), { token: this.#token, signal: this.#signal, timeoutMs: this.#timeoutMs })
      this.#urlMap = payload?.meta?.images && typeof payload.meta.images === 'object' ? payload.meta.images : {}
    } catch (error) {
      if (this.#signal?.aborted) throw error
      // Images are non-fatal: structure still imports with placeholders.
      this.#warnings.push(`Image fills unavailable: ${error instanceof FigmaApiError ? error.code : error?.message ?? error}`)
      this.#urlMap = {}
    }
    return this.#urlMap
  }

  async #download(ref, url) {
    try {
      const bytes = await figmaFetch(url, { kind: 'bytes', retries: 1, signal: this.#signal, timeoutMs: this.#timeoutMs })
      if (bytes.byteLength > MAX_INLINE_IMAGE_BYTES) {
        this.#warnings.push(`Image ${ref} is ${(bytes.byteLength / 1048576).toFixed(1)} MB; kept as a remote URL`)
        return url
      }
      return `data:${guessImageMime(bytes)};base64,${bytes.toString('base64')}`
    } catch (error) {
      if (this.#signal?.aborted) throw error
      this.#warnings.push(`Image ${ref} download failed; kept as a remote URL`)
      return url
    }
  }

  /** Resolve refs to URLs; unknown refs are omitted (left as placeholders). */
  async resolve(refs) {
    const wanted = [...refs].filter(ref => !this.#resolved.has(ref))
    if (wanted.length > 0) {
      const urls = await this.#urls()
      const queue = wanted.filter(ref => typeof urls[ref] === 'string' && urls[ref])
      for (const ref of wanted) {
        if (!queue.includes(ref) && !this.#missing.has(ref)) {
          this.#missing.add(ref)
          this.#warnings.push(`Image ${ref} has no URL in the Figma file`)
        }
      }
      const workers = Array.from({ length: Math.min(DOWNLOAD_CONCURRENCY, queue.length) }, async () => {
        while (queue.length > 0) {
          const ref = queue.shift()
          this.#resolved.set(ref, await this.#download(ref, urls[ref]))
        }
      })
      await Promise.all(workers)
    }
    const out = {}
    for (const ref of refs) {
      if (this.#resolved.has(ref)) out[ref] = this.#resolved.get(ref)
    }
    return out
  }
}
