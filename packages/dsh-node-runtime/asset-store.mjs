import { randomUUID } from 'node:crypto';
import { lstat, mkdir, open, realpath } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const KINDS = new Set(['scene-template', 'style-guide', 'theme-preset']);
const MAX_BYTES = 32 * 1024 * 1024;
const USER_ID = /^user:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export class AssetStoreError extends Error {
  constructor(code, message, options) {
    super(message, options);
    this.code = code;
  }
}

function invalid(message) {
  return new AssetStoreError('asset-invalid', message);
}

function checkKind(kind) {
  if (!KINDS.has(kind)) throw invalid('Unknown asset kind');
}

function checkId(id) {
  if (typeof id !== 'string' || !USER_ID.test(id)) throw invalid('Expected a stable user asset id');
}

function checkName(name) {
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 200) {
    throw invalid('Asset name must contain between 1 and 200 characters');
  }
  return name.trim();
}

function payloadJson(kind, payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload))
    throw invalid('Invalid asset payload');
  checkName(payload.name);
  if (
    kind === 'style-guide' &&
    (typeof payload.markdown !== 'string' || !payload.markdown.trim())
  ) {
    throw invalid('Style guide requires nonempty Markdown');
  }
  if (
    kind === 'scene-template' &&
    (!payload.document ||
      typeof payload.document !== 'object' ||
      Array.isArray(payload.document) ||
      !Array.isArray(payload.document.children))
  ) {
    throw invalid('Scene template requires a canonical document with children');
  }
  if (
    kind === 'theme-preset' &&
    (!payload.preset || typeof payload.preset !== 'object' || Array.isArray(payload.preset))
  ) {
    throw invalid('Theme preset requires an object payload');
  }
  let json;
  try {
    json = JSON.stringify(payload);
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    throw invalid('Asset payload must be serializable JSON');
  }
  if (Buffer.byteLength(json) > MAX_BYTES) {
    throw new AssetStoreError('asset-too-large', 'Asset payload exceeds 32 MiB');
  }
  return json;
}

function storageError(error) {
  if (error instanceof AssetStoreError) return error;
  const busy = error.errcode === 5 || error.errcode === 6;
  return new AssetStoreError(
    busy ? 'asset-busy' : 'asset-storage',
    busy ? 'Asset storage is busy; retry the operation' : `Asset storage failed: ${error.message}`,
    { cause: error },
  );
}

async function checkFile(path) {
  try {
    const stat = await lstat(path);
    if (!stat.isFile() || stat.isSymbolicLink())
      throw invalid('Asset database must be a regular file');
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

export class AssetStore {
  #db;
  #closed = false;

  static async open({ directory }) {
    if (typeof directory !== 'string' || !directory) throw invalid('Asset directory is required');
    const requested = resolve(directory);
    await mkdir(requested, { recursive: true, mode: 0o700 });
    if ((await lstat(requested)).isSymbolicLink())
      throw invalid('Asset directory must not be a symlink');
    const root = await realpath(requested);
    const path = join(root, 'assets.sqlite');
    for (const suffix of ['', '-journal', '-wal', '-shm']) await checkFile(path + suffix);
    try {
      const file = await open(path, 'wx', 0o600);
      await file.close();
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
    await checkFile(path);
    let db;
    try {
      db = new DatabaseSync(path);
      db.exec('PRAGMA busy_timeout=0; PRAGMA synchronous=FULL');
      const version = db.prepare('PRAGMA user_version').get().user_version;
      if (version === 0) {
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        if (tables.length)
          throw new AssetStoreError('asset-storage', 'Unrecognized asset database schema');
        db.exec(`BEGIN IMMEDIATE;
          CREATE TABLE metadata (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL);
          INSERT INTO metadata VALUES (1,0);
          CREATE TABLE assets (id TEXT PRIMARY KEY, kind TEXT NOT NULL, name TEXT NOT NULL, payload TEXT NOT NULL);
          PRAGMA user_version=1;
          COMMIT;`);
      } else if (version !== 1) {
        throw new AssetStoreError(
          'asset-storage',
          `Unsupported asset database version: ${version}`,
        );
      }
      if (db.prepare('PRAGMA quick_check').get().quick_check !== 'ok') {
        throw new AssetStoreError('asset-storage', 'Asset database integrity check failed');
      }
      const store = new AssetStore(db, root);
      await store.snapshot();
      return store;
    } catch (error) {
      db?.close();
      throw storageError(error);
    }
  }

  constructor(db, directory) {
    this.#db = db;
    this.directory = directory;
  }

  #assertOpen() {
    if (this.#closed) throw new AssetStoreError('asset-storage', 'Asset store is closed');
  }

  #revision() {
    const revision = this.#db.prepare('SELECT revision FROM metadata WHERE id=1').get()?.revision;
    if (!Number.isSafeInteger(revision) || revision < 0) {
      throw new AssetStoreError('asset-storage', 'Invalid persisted asset revision');
    }
    return revision;
  }

  revision() {
    this.#assertOpen();
    return this.#revision();
  }

  #entry(row) {
    if (!row) throw new AssetStoreError('asset-not-found', 'User asset was not found');
    try {
      checkKind(row.kind);
      checkId(row.id);
      const payload = JSON.parse(row.payload);
      payloadJson(row.kind, payload);
      return { id: row.id, kind: row.kind, name: checkName(row.name), payload };
    } catch (error) {
      throw new AssetStoreError('asset-storage', `Invalid persisted asset: ${row.id}`, {
        cause: error,
      });
    }
  }

  async snapshot() {
    this.#assertOpen();
    try {
      this.#db.exec('BEGIN');
      const revision = this.#revision();
      const rows = this.#db.prepare('SELECT id,kind,name FROM assets ORDER BY rowid').all();
      for (const row of rows) {
        checkId(row.id);
        checkKind(row.kind);
        checkName(row.name);
      }
      this.#db.exec('COMMIT');
      return { revision, assets: rows };
    } catch (error) {
      if (this.#db.isTransaction) this.#db.exec('ROLLBACK');
      throw storageError(error);
    }
  }

  async get(kind, id) {
    this.#assertOpen();
    checkKind(kind);
    checkId(id);
    try {
      return this.#entry(
        this.#db.prepare('SELECT * FROM assets WHERE kind=? AND id=?').get(kind, id),
      );
    } catch (error) {
      throw storageError(error);
    }
  }

  #mutate(expectedRevision, operation) {
    this.#assertOpen();
    try {
      this.#db.exec('BEGIN IMMEDIATE');
      const before = this.#revision();
      if (expectedRevision !== undefined && expectedRevision !== before) {
        throw new AssetStoreError(
          'asset-conflict',
          'Asset revision changed; refresh before writing',
        );
      }
      if (before === Number.MAX_SAFE_INTEGER)
        throw new AssetStoreError('asset-storage', 'Asset revision exhausted');
      const asset = operation();
      const revision = before + 1;
      this.#db.prepare('UPDATE metadata SET revision=? WHERE id=1').run(revision);
      this.#db.exec('COMMIT');
      return { revision, ...(asset ? { asset } : {}) };
    } catch (error) {
      if (this.#db.isTransaction) this.#db.exec('ROLLBACK');
      throw storageError(error);
    }
  }

  async put(kind, payload, { id, expectedRevision } = {}) {
    checkKind(kind);
    const json = payloadJson(kind, payload);
    if (id !== undefined) {
      checkId(id);
      if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
        throw invalid('Updating an asset requires expectedRevision');
      }
    }
    const assetId = id ?? `user:${randomUUID()}`;
    const name = checkName(payload.name);
    return this.#mutate(expectedRevision, () => {
      if (id !== undefined) {
        this.#entry(this.#db.prepare('SELECT * FROM assets WHERE kind=? AND id=?').get(kind, id));
        this.#db
          .prepare('UPDATE assets SET name=?,payload=? WHERE kind=? AND id=?')
          .run(name, json, kind, id);
      } else {
        if (
          kind === 'scene-template' &&
          this.#db.prepare('SELECT count(*) AS n FROM assets WHERE kind=?').get(kind).n >= 50
        ) {
          throw new AssetStoreError('asset-quota', 'The 50 saved-template quota is full');
        }
        this.#db.prepare('INSERT INTO assets VALUES (?,?,?,?)').run(assetId, kind, name, json);
      }
      return { id: assetId, kind, name, payload: JSON.parse(json) };
    });
  }

  async rename(kind, id, name, { expectedRevision } = {}) {
    checkKind(kind);
    checkId(id);
    name = checkName(name);
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0)
      throw invalid('Rename requires expectedRevision');
    return this.#mutate(expectedRevision, () => {
      const asset = this.#entry(
        this.#db.prepare('SELECT * FROM assets WHERE kind=? AND id=?').get(kind, id),
      );
      asset.name = name;
      asset.payload.name = name;
      this.#db
        .prepare('UPDATE assets SET name=?,payload=? WHERE kind=? AND id=?')
        .run(name, JSON.stringify(asset.payload), kind, id);
      return asset;
    });
  }

  async remove(kind, id, { expectedRevision } = {}) {
    checkKind(kind);
    checkId(id);
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0)
      throw invalid('Delete requires expectedRevision');
    return this.#mutate(expectedRevision, () => {
      this.#entry(this.#db.prepare('SELECT * FROM assets WHERE kind=? AND id=?').get(kind, id));
      this.#db.prepare('DELETE FROM assets WHERE kind=? AND id=?').run(kind, id);
    });
  }

  close() {
    if (!this.#closed) {
      this.#db.close();
      this.#closed = true;
    }
  }
}
