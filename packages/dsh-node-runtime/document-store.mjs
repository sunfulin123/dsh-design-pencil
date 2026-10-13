function copyDocument(document) {
  if (!document || typeof document !== 'object' || Array.isArray(document) ||
      !Array.isArray(document.children)) {
    throw new TypeError('Document must contain a children array')
  }
  return structuredClone(document)
}

export class DocumentStore {
  #document
  #version = 0

  constructor(document) {
    this.#document = copyDocument(document)
  }

  snapshot() {
    return { document: structuredClone(this.#document), version: this.#version }
  }

  replace(document, baseVersion, { metadataOnly = false } = {}) {
    if (!Number.isSafeInteger(baseVersion) || baseVersion < 0) {
      throw new TypeError('baseVersion must be a non-negative safe integer')
    }
    if (baseVersion !== this.#version) {
      return { ok: false, conflict: true, version: this.#version }
    }
    const next = copyDocument(document)
    if (metadataOnly) {
      this.#document.editorMeta = next.editorMeta
    } else {
      this.#document = next
      this.#version += 1
    }
    return { ok: true, version: this.#version }
  }
}