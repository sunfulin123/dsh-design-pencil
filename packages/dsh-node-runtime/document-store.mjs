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
  // Moves on every accepted change, including metadata-only ones.
  #revision = 0

  constructor(document) {
    this.#document = copyDocument(document)
  }

  snapshot() {
    return { document: structuredClone(this.#document), version: this.#version }
  }

  version() {
    return this.#version
  }

  revision() {
    return this.#revision
  }

  // The live document, without a copy. Callers must treat it as read-only.
  peek() {
    return this.#document
  }

  // `owned: true` hands over a freshly built document the caller will not
  // touch again, skipping the defensive copy.
  replace(document, baseVersion, { metadataOnly = false, owned = false } = {}) {
    if (!Number.isSafeInteger(baseVersion) || baseVersion < 0) {
      throw new TypeError('baseVersion must be a non-negative safe integer')
    }
    if (baseVersion !== this.#version) {
      return { ok: false, conflict: true, version: this.#version }
    }
    const next = owned && Array.isArray(document?.children) ? document : copyDocument(document)
    if (metadataOnly) {
      if (JSON.stringify(this.#document.editorMeta ?? {}) !== JSON.stringify(next.editorMeta ?? {})) this.#revision += 1
      this.#document.editorMeta = next.editorMeta
    } else {
      this.#document = next
      this.#version += 1
      this.#revision += 1
    }
    return { ok: true, version: this.#version }
  }
}