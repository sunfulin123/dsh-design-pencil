// Where the shared design-asset library lives.
//
// Like a Figma team library, saved styles, templates and theme presets are
// shared by every document and session of one user. A managed host bound to a
// throwaway draft file would otherwise lose them on restart, because the
// historic default kept the library beside the document.
import { access, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { AssetStore } from './asset-store.mjs';

const MARKER = 'migrated.json';

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
export function legacyAssetDirectory(sourcePath) {
  return sourcePath ? join(dirname(resolve(sourcePath)), '.dsh-design', 'assets') : undefined;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

/**
 * Copy a legacy per-document library into the shared one once. The legacy
 * database is never modified; a marker beside it records the target so a
 * user who later deletes a migrated asset does not see it come back.
 */
export async function mergeLegacyAssets(target, legacyDirectory) {
  if (!legacyDirectory || resolve(legacyDirectory) === resolve(target.directory)) return 0;
  if (!(await exists(join(legacyDirectory, 'assets.sqlite')))) return 0;
  const marker = join(legacyDirectory, MARKER);
  if (await exists(marker)) {
    const recorded = JSON.parse(await readFile(marker, 'utf8'));
    if (recorded.target === target.directory) return 0;
  }
  const legacy = await AssetStore.open({ directory: legacyDirectory });
  let copied = 0;
  try {
    const known = new Set((await target.snapshot()).assets.map((asset) => asset.id));
    for (const { id, kind } of (await legacy.snapshot()).assets) {
      if (known.has(id)) continue;
      const asset = await legacy.get(kind, id);
      try {
        await target.adopt(asset);
      } catch (error) {
        if (error.code === 'asset-quota') continue;
        throw error;
      }
      copied += 1;
    }
  } finally {
    legacy.close();
  }
  await writeFile(
    marker,
    JSON.stringify({ target: target.directory, copied, at: new Date().toISOString() }),
    { mode: 0o600 },
  );
  return copied;
}

/**
 * Open the host's library: the explicit directory, else (library callers) the
 * one beside an existing document. Merge a legacy library without failing
 * startup; the untouched legacy file can be merged on a later start.
 */
export async function openAssetStore({ assetDirectory, legacyDirectory, sourcePath }) {
  const directory = assetDirectory ?? (sourcePath ? legacyAssetDirectory(sourcePath) : undefined);
  if (!directory) return undefined;
  const store = await AssetStore.open({ directory });
  if (legacyDirectory) {
    try {
      await mergeLegacyAssets(store, legacyDirectory);
    } catch (error) {
      process.stderr.write(`Legacy asset library was not merged: ${error.message}\n`);
    }
  }
  return store;
}
