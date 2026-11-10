// Where the shared design-asset library lives.
//
// Saved styles and theme presets are shared by every document and session of
// one user. A managed host bound to a
// throwaway draft file would otherwise lose them on restart, because the
// historic default kept the library beside the document.
import { createHash } from 'node:crypto';
import { lstat, readFile, realpath } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { AssetStore, AssetStoreError } from './asset-store.mjs';

/** User-level library directory; `DSH_ASSET_DIR` overrides it. */
export function defaultAssetDirectory(env = process.env, platform = process.platform) {
  if (env.DSH_ASSET_DIR) return resolve(env.DSH_ASSET_DIR);
  const root =
    platform === 'darwin'
      ? join(homedir(), 'Library', 'Application Support')
      : platform === 'win32'
        ? env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local')
        : env.XDG_DATA_HOME || join(homedir(), '.local', 'share');
  return join(root, 'dsh-design-pencil', 'assets');
}

/** The pre-shared-library location beside a bound document. */
export function documentAssetDirectory(sourcePath) {
  return sourcePath ? join(dirname(resolve(sourcePath)), '.dsh-design', 'assets') : undefined;
}

async function mergeDocumentAssets(store, directory) {
  if (!directory || resolve(directory) === store.directory) return;
  try { await lstat(join(directory, 'assets.sqlite')); }
  catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  const localDirectory = await realpath(directory);
  if (localDirectory === store.directory) return;
  const key = createHash('sha256').update(localDirectory).digest('hex');
  if (store.hasImportedSource(key)) return;
  const local = await AssetStore.open({ directory });
  try {
    let migratedBefore = false;
    try {
      const marker = JSON.parse(await readFile(join(local.directory, 'migrated.json'), 'utf8'));
      migratedBefore = marker.target === store.directory;
    } catch (error) {
      if (error.code !== 'ENOENT') throw new AssetStoreError('asset-storage', 'Cannot read previous asset migration marker', { cause: error });
    }
    const snapshot = await local.snapshot();
    const assets = migratedBefore ? [] : await Promise.all(snapshot.assets.map(({ kind, id }) => local.get(kind, id)));
    if (local.revision() !== snapshot.revision) throw new AssetStoreError('asset-conflict', 'Document assets changed during import; retry');
    await store.importLegacyOnce(key, assets);
  } finally { local.close(); }
}

/** Open a library and import supported assets from an older document-local library once. */
export async function openAssetStore({ assetDirectory, sourcePath }) {
  const directory = assetDirectory ?? (sourcePath ? documentAssetDirectory(sourcePath) : undefined);
  if (!directory) return undefined;
  const store = await AssetStore.open({ directory });
  try {
    await mergeDocumentAssets(store, sourcePath && assetDirectory ? documentAssetDirectory(sourcePath) : undefined);
    return store;
  } catch (error) {
    store.close();
    throw error;
  }
}
