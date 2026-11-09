// Where the shared design-asset library lives.
//
// Like a Figma team library, saved styles, templates and theme presets are
// shared by every document and session of one user. A managed host bound to a
// throwaway draft file would otherwise lose them on restart, because the
// historic default kept the library beside the document.
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { AssetStore } from './asset-store.mjs';


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

/** Open an explicitly scoped or document-local asset library. */
export async function openAssetStore({ assetDirectory, sourcePath }) {
  const directory = assetDirectory ?? (sourcePath ? documentAssetDirectory(sourcePath) : undefined);
  return directory ? AssetStore.open({ directory }) : undefined;
}
