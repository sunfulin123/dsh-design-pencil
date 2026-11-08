import { constants } from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import { lstat, mkdir, open, readdir, rename, unlink } from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { EngineSession } from './engine-session.mjs'

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const KINDS = new Set(['autosave', 'checkpoint', 'pre-restore'])
const TOOLS = new Set(['list_drafts', 'create_draft', 'restore_draft', 'delete_draft'])

function defaultDirectory() {
  const root = process.platform === 'darwin'
    ? join(homedir(), 'Library', 'Application Support')
    : process.platform === 'win32'
      ? process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local')
      : process.env.XDG_STATE_HOME || join(homedir(), '.local', 'state')
  return join(root, 'dsh-design-pencil', 'drafts')
}

function metadata(record) {
  const { id, kind, label, documentName, createdAt, updatedAt, version } = record
  return { id, kind, label, documentName, createdAt, updatedAt, version }
}

function validateArguments(args, keys) {
  if (!args || typeof args !== 'object' || Array.isArray(args) ||
      Object.keys(args).some(key => !keys.includes(key))) {
    throw new Error('Invalid draft tool arguments')
  }
}

export class DraftWriteError extends Error {
  constructor(cause, version) {
    super('The live document changed, but its recovery copy could not be saved', { cause })
    this.version = version
  }
}

export class DraftRecovery {
  #session
  #directory
  #sourceKey
  #documentName
  #autosaveId = randomUUID()
  #startedAt = new Date().toISOString()

  constructor(session, { sourcePath, draftDirectory }) {
    this.#session = session
    this.#directory = draftDirectory || defaultDirectory()
    this.#sourceKey = sourcePath ? createHash('sha256').update(resolve(sourcePath)).digest('hex') : null
    this.#documentName = sourcePath ? basename(sourcePath) : null
  }

  handles(name) {
    return TOOLS.has(name)
  }

  async persist(before) {
    if (!this.#sourceKey) return
    if (Number.isSafeInteger(before?.revision) && typeof this.#session.revision === 'function') {
      if (before.revision === this.#session.revision()) return
    } else if (JSON.stringify(before.document) === JSON.stringify(this.#session.snapshot().document)) {
      return
    }
    const snapshot = this.#session.snapshot()
    try {
      await this.#write(snapshot, {
        id: this.#autosaveId, kind: 'autosave', createdAt: this.#startedAt,
      })
    } catch (error) {
      throw new DraftWriteError(error, snapshot.version)
    }
  }

  async call(name, args) {
    if (!this.#sourceKey) throw new Error('Draft recovery requires a parent-bound document file')
    if (name === 'list_drafts') {
      validateArguments(args, [])
      return { drafts: await this.#list(), currentVersion: this.#session.snapshot().version }
    }
    if (name === 'create_draft') {
      validateArguments(args, ['label'])
      if (args.label !== undefined && (typeof args.label !== 'string' || !args.label.trim() || [...args.label].length > 160)) {
        throw new Error('Draft label must contain 1-160 characters')
      }
      return this.#write(this.#session.snapshot(), { kind: 'checkpoint', label: args.label?.trim() })
    }
    if (name === 'delete_draft') {
      validateArguments(args, ['id'])
      const record = await this.#read(args.id)
      await unlink(this.#path(record.id))
      return { deleted: record.id }
    }
    if (name !== 'restore_draft') throw new Error(`Unknown draft tool: ${name}`)
    validateArguments(args, ['id', 'baseVersion'])
    const snapshot = this.#session.snapshot()
    if (args.baseVersion !== undefined &&
        (!Number.isSafeInteger(args.baseVersion) || args.baseVersion < 0 || args.baseVersion !== snapshot.version)) {
      throw new Error(`Draft restore version conflict; current version is ${snapshot.version}`)
    }
    const record = await this.#read(args.id)
    const candidate = new EngineSession(record.document)
    candidate.close()
    const backup = await this.#write(snapshot, { kind: 'pre-restore' })
    const result = this.#session.restoreDocument(record.document, snapshot.version)
    if (!result.ok) throw new Error(`Draft restore version conflict; current version is ${result.version}`)
    return { restored: record.id, backupId: backup.id, version: result.version }
  }

  #path(id) {
    if (typeof id !== 'string' || !ID.test(id)) throw new Error('Draft id must be an opaque recovery UUID')
    return join(this.#directory, `${this.#sourceKey}.${id}.json`)
  }

  async #read(id) {
    const path = this.#path(id)
    if (!(await lstat(path)).isFile()) throw new Error('Draft is not a regular file')
    const flags = process.platform === 'win32' ? constants.O_RDONLY : constants.O_RDONLY | constants.O_NOFOLLOW
    const handle = await open(path, flags)
    try {
      if (!(await handle.stat()).isFile()) throw new Error('Draft is not a regular file')
      const record = JSON.parse(await handle.readFile('utf8'))
      if (record.schemaVersion !== 1 || record.sourceKey !== this.#sourceKey || record.id !== id ||
          !KINDS.has(record.kind) || typeof record.createdAt !== 'string' ||
          typeof record.updatedAt !== 'string' || typeof record.documentName !== 'string' ||
          !Number.isSafeInteger(record.version) || record.version < 0 ||
          !record.document || !Array.isArray(record.document.children)) {
        throw new Error('Invalid recovery snapshot or document identity')
      }
      return record
    } finally {
      await handle.close()
    }
  }

  async #list() {
    let entries
    try {
      entries = await readdir(this.#directory, { withFileTypes: true })
    } catch (error) {
      if (error.code === 'ENOENT') return []
      throw error
    }
    const prefix = `${this.#sourceKey}.`
    const drafts = []
    for (const entry of entries) {
      if (!entry.name.startsWith(prefix) || !entry.name.endsWith('.json')) continue
      const id = entry.name.slice(prefix.length, -5)
      if (!ID.test(id)) continue
      if (!entry.isFile()) throw new Error('Recovery snapshot is not a regular file')
      try {
        drafts.push(metadata(await this.#read(id)))
      } catch (error) {
        // A second editor may discard its own snapshot during this scan.
        if (error.code !== 'ENOENT') throw error
      }
    }
    return drafts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id))
  }

  async #write(snapshot, { id = randomUUID(), kind, label, createdAt = new Date().toISOString() }) {
    const path = this.#path(id)
    await mkdir(this.#directory, { recursive: true, mode: 0o700 })
    const temporary = `${path}.${randomUUID()}.tmp`
    const record = {
      schemaVersion: 1, sourceKey: this.#sourceKey, id, kind, label,
      documentName: snapshot.document.name || this.#documentName,
      createdAt, updatedAt: new Date().toISOString(), version: snapshot.version,
      document: snapshot.document,
    }
    const handle = await open(temporary, 'wx', 0o600)
    try {
      await handle.writeFile(JSON.stringify(record))
      await handle.sync()
      await handle.close()
      await rename(temporary, path)
      if (process.platform !== 'win32') {
        const directory = await open(this.#directory, constants.O_RDONLY)
        try {
          await directory.sync()
        } finally {
          await directory.close()
        }
      }
      return metadata(record)
    } finally {
      await handle.close()
      await unlink(temporary).catch(error => {
        if (error.code !== 'ENOENT') throw error
      })
    }
  }
}
