import { createRequire } from 'node:module'
import { DocumentStore } from './document-store.mjs'

const require = createRequire(import.meta.url)
const { DesignEngine } = require('./wasm/op_dsh_engine.js')

export class EngineSession {
  #store
  #engine
  #closed = false

  constructor(document) {
    this.#store = new DocumentStore(document)
    this.#engine = this.#loadEngine(document)
  }

  snapshot() {
    return this.#store.snapshot()
  }

  replace(document, baseVersion, { metadataOnly = false } = {}) {
    this.#assertOpen()
    if (baseVersion !== this.#store.snapshot().version) {
      return this.#store.replace(document, baseVersion, { metadataOnly })
    }
    const next = metadataOnly
      ? { ...this.#store.snapshot().document, editorMeta: document.editorMeta }
      : document
    const engine = this.#loadEngine(next)
    try {
      const result = this.#store.replace(next, baseVersion, { metadataOnly })
      if (result.ok && metadataOnly) {
        this.#engine.update_editor_meta(JSON.stringify(JSON.parse(engine.document_json()).editorMeta))
        engine.free()
      } else if (result.ok) {
        this.#engine.free()
        this.#engine = engine
      } else {
        engine.free()
      }
      return result
    } catch (error) {
      engine.free()
      throw error
    }
  }

  callTool(name, args = {}) {
    this.#assertOpen()
    const before = this.#engine.document_json()
    const result = JSON.parse(this.#engine.call_tool(name, JSON.stringify(args)))
    const after = this.#engine.document_json()
    if (before !== after) {
      const snapshot = this.#store.snapshot()
      const document = JSON.parse(after)
      this.#store.replace({
        ...snapshot.document,
        ...document,
        editorMeta: { ...snapshot.document.editorMeta, ...document.editorMeta },
      }, snapshot.version)
    }
    return result
  }

  listTools() {
    this.#assertOpen()
    return JSON.parse(this.#engine.tools_json())
  }

  close() {
    if (!this.#closed) {
      this.#closed = true
      this.#engine.free()
    }
  }

  #loadEngine(document) {
    const engine = new DesignEngine()
    try {
      engine.load_document(JSON.stringify(document))
      return engine
    } catch (error) {
      engine.free()
      throw error
    }
  }

  #assertOpen() {
    if (this.#closed) throw new Error('Design session is closed')
  }
}