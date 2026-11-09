import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export function parseGoogleFontCss(css) {
  const faces = [];
  for (const block of css.matchAll(/@font-face\s*\{([^}]+)\}/g)) {
    const body = block[1]
    const source = /src:\s*[^;]*url\(['"]?([^'")]+)['"]?\)/.exec(body)
    if (!source) continue
    const url = new URL(source[1])
    if (url.protocol !== 'https:' || url.hostname !== 'fonts.gstatic.com') continue
    faces.push({ url: url.href })
  }
  return faces
}

function validFont(bytes) {
  const tag = bytes.subarray(0, 4).toString('hex')
  return ['00010000', '4f54544f', '74746366'].includes(tag)
}

export class FontFetcher {
  #directory
  #faces = new Map()
  #pending = new Map()
  #fetch
  #queue = Promise.resolve()

  constructor(directory, { fetchImpl = globalThis.fetch } = {}) {
    this.#directory = directory
    this.#fetch = fetchImpl
    const inventory = join(directory, 'manifest.json')
    if (existsSync(inventory)) {
      const saved = JSON.parse(readFileSync(inventory, 'utf8'))
      if (!Array.isArray(saved.faces)) throw new Error('Invalid font cache manifest')
      for (const face of saved.faces) {
        if (!/^[a-f0-9]{64}$/.test(face.id)) throw new Error('Invalid font cache identifier')
        this.#faces.set(face.id, face)
      }
    }
  }

  manifest() { return { faces: [...this.#faces.values()] } }

  async bytes(id) {
    if (!this.#faces.has(id)) return null
    return readFile(join(this.#directory, `${id}.ttf`))
  }

  /** Register font bytes a page served itself (TTF/OTF only; the renderer cannot load WOFF). */
  addFace(font, bytes) {
    const operation = this.#queue.then(async () => {
      const face = this.#face(font)
      if (!Buffer.isBuffer(bytes) || bytes.length > 20 * 1024 * 1024 || !validFont(bytes)) {
        return { ...face, available: false, error: 'Page font is not a TTF/OTF file' }
      }
      await mkdir(this.#directory, { recursive: true, mode: 0o700 })
      await writeFile(join(this.#directory, `${face.id}.ttf`), bytes, { mode: 0o600 })
      await this.#register(face)
      return { ...face, available: true }
    })
    this.#queue = operation.then(() => undefined, () => undefined)
    return operation
  }

  async #register(face) {
    this.#faces.set(face.id, { ...face, path: `/api/fonts/${face.id}` })
    await mkdir(this.#directory, { recursive: true, mode: 0o700 })
    const temporary = join(this.#directory, `manifest.${process.pid}.tmp`)
    await writeFile(temporary, JSON.stringify(this.manifest()), { mode: 0o600 })
    await rename(temporary, join(this.#directory, 'manifest.json'))
  }

  #face(font) {
    const family = String(font.family || '').trim()
    const weight = Number(font.weight || 400)
    const italic = Boolean(font.italic)
    if (!family || family.length > 200 || !Number.isInteger(weight) || weight < 1 || weight > 1000) {
      throw new TypeError('Invalid font face requested by import')
    }
    const id = createHash('sha256').update(JSON.stringify([family, weight, italic])).digest('hex')
    return { id, family, weight, italic }
  }

  ensure(fonts, { signal } = {}) {
    const operation = this.#queue.then(() => this.#ensure(fonts, signal))
    this.#queue = operation.then(() => undefined, () => undefined)
    return operation
  }

  async #ensure(fonts, signal) {
    const outcomes = []
    // At most one new network font at a time; imports share pending promises.
    for (const font of fonts) {
      signal?.throwIfAborted()
      const face = this.#face(font)
      const { id } = face
      if (!this.#pending.has(id)) {
        this.#pending.set(id, this.#load(face, signal).finally(() => this.#pending.delete(id)))
      }
      outcomes.push(await this.#pending.get(id))
    }
    return outcomes
  }

  async #load(face, signal) {
    if (this.#faces.has(face.id)) return { ...this.#faces.get(face.id), available: true }
    const path = join(this.#directory, `${face.id}.ttf`)
    let bytes
    try { bytes = await readFile(path) } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    try {
      if (!bytes) {
        const family = face.family.replaceAll(' ', '+')
        const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replaceAll('%2B', '+')}:ital,wght@${face.italic ? 1 : 0},${face.weight}`
        let fontUrl
        try {
          const css = await this.#fetch(url, {
            // Legacy UA asks Google for a full sfnt rather than WOFF2 subsets.
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(60000)]) : AbortSignal.timeout(60000),
          })
          if (!css.ok) throw new Error(`Font provider HTTP ${css.status}`)
          const sources = parseGoogleFontCss(await css.text())
          if (sources.length !== 1) throw new Error('Provider did not return one full sfnt face')
          fontUrl = sources[0].url
        } catch (googleError) {
          if (signal?.aborted) throw signal.reason
          try {
            const slug = face.family.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
            const response = await this.#fetch(`https://api.fontsource.org/v1/fonts/${encodeURIComponent(slug)}`, {
              signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(60000)]) : AbortSignal.timeout(60000),
            })
            if (!response.ok) throw new Error(`Fontsource HTTP ${response.status}`)
            const metadata = await response.json()
            if (metadata.family?.toLowerCase() !== face.family.toLowerCase()) throw new Error('Fontsource family does not match')
            const subset = metadata.defSubset
            const value = metadata.variants?.[face.weight]?.[face.italic ? 'italic' : 'normal']?.[subset]?.url?.ttf
            const source = new URL(value)
            if (source.protocol !== 'https:' || source.hostname !== 'cdn.jsdelivr.net' || !source.pathname.startsWith('/fontsource/fonts/')) {
              throw new Error('Unapproved Fontsource asset URL')
            }
            fontUrl = source.href
            face.warning = `Google Fonts unavailable; Fontsource ${subset} subset used for ${face.family} ${face.weight}. Other scripts may need fallback fonts.`
          } catch (fallbackError) {
            throw new Error(`${googleError.message}; fallback: ${fallbackError.message}`)
          }
        }
        const response = await this.#fetch(fontUrl, {
          signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(60000)]) : AbortSignal.timeout(60000),
        })
        if (!response.ok) throw new Error(`Font download HTTP ${response.status}`)
        bytes = Buffer.from(await response.arrayBuffer())
        if (bytes.length > 20 * 1024 * 1024 || !validFont(bytes)) throw new Error('Invalid or unsupported sfnt font')
        await mkdir(this.#directory, { recursive: true })
        await writeFile(path, bytes, { mode: 0o600 })
      }
      if (!validFont(bytes)) throw new Error('Invalid cached sfnt font')
      await this.#register(face)
      return { ...face, available: true }
    } catch (error) {
      if (signal?.aborted) throw signal.reason
      return { ...face, available: false, error: String(error.message ?? error) }
    }
  }
}
