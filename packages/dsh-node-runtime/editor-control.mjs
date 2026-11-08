import { randomUUID } from 'node:crypto';
import { AssetStoreError } from './asset-store.mjs';

export class EditorControl {
  #clients = new Map();
  #pending = new Map();
  #closed = false;
  constructor({ timeoutMs = 5000 } = {}) {
    this.timeoutMs = timeoutMs;
  }

  pending(client) {
    if (typeof client !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(client)) {
      throw new AssetStoreError('editor-invalid', 'Invalid editor client id');
    }
    if (this.#closed) throw new AssetStoreError('editor-unavailable', 'Editor control is closed');
    this.#clients.set(client, Date.now());
    return [...this.#pending.values()]
      .filter((p) => p.client === client)
      .map(({ id, name, args }) => ({ id, name, args }));
  }

  request(name, args) {
    const now = Date.now();
    const client = [...this.#clients]
      .filter(([, seen]) => now - seen < 10_000)
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    if (this.#closed || !client)
      throw new AssetStoreError('editor-unavailable', 'No live editor is connected');
    if (this.#pending.size >= 50)
      throw new AssetStoreError('editor-busy', 'Too many editor control requests');
    const id = randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.#pending.delete(id);
        reject(
          new AssetStoreError('editor-timeout', 'Editor did not acknowledge the theme request'),
        );
      }, this.timeoutMs);
      this.#pending.set(id, { id, name, args, client, timer, resolve, reject });
    });
  }

  complete(body) {
    const pending = this.#pending.get(body?.id);
    if (!pending || pending.client !== body.client) {
      throw new AssetStoreError('editor-invalid', 'Unknown or expired editor acknowledgement');
    }
    const value = body.value;
    if (
      typeof body.error !== 'string' &&
      (!value ||
        !['light', 'dark'].includes(value.effective) ||
        !['light', 'dark'].includes(value.preference) ||
        !(value.hostOverride === null || ['light', 'dark'].includes(value.hostOverride)) ||
        value.connected !== true ||
        (value.hostOverride !== null && value.effective !== value.hostOverride) ||
        (pending.name === 'set_editor_theme' &&
          (value.effective !== pending.args.theme ||
            (pending.args.persist === true && value.preference !== pending.args.theme))))
    ) {
      throw new AssetStoreError('editor-invalid', 'Invalid acknowledged theme state');
    }
    this.#pending.delete(body.id);
    clearTimeout(pending.timer);
    if (typeof body.error === 'string')
      pending.reject(new AssetStoreError('editor-rejected', body.error));
    else pending.resolve(value);
  }

  close() {
    this.#closed = true;
    for (const pending of this.#pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(
        new AssetStoreError('editor-unavailable', 'Editor host closed before acknowledgement'),
      );
    }
    this.#pending.clear();
    this.#clients.clear();
  }
}
