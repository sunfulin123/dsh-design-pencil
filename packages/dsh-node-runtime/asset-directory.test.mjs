import assert from 'node:assert/strict';
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import {
  defaultAssetDirectory,
  documentAssetDirectory,
  openAssetStore,
} from './asset-directory.mjs';
import { startNodeHost } from './node-host.mjs';
import { AssetStore } from './asset-store.mjs';

async function root(context) {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-asset-directory-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

async function call(host, name, args = {}) {
  const response = await fetch(`${host.baseUrl}/mcp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }),
  });
  return (await response.json()).result;
}

test('default asset directory is user-level, platform specific and overridable', () => {
  assert.equal(defaultAssetDirectory({ DSH_ASSET_DIR: '/tmp/x' }, 'darwin'), '/tmp/x');
  assert.match(
    defaultAssetDirectory({}, 'darwin'),
    /Library\/Application Support\/dsh-design-pencil\/assets$/,
  );
  assert.equal(
    defaultAssetDirectory({ XDG_DATA_HOME: '/data' }, 'linux'),
    '/data/dsh-design-pencil/assets',
  );
  assert.equal(
    documentAssetDirectory('/work/a/design.op'),
    '/work/a/.dsh-design/assets',
  );
  assert.equal(documentAssetDirectory(undefined), undefined);
});

test('styles saved from one draft survive restarts and are visible to other documents', async (context) => {
  const base = await root(context);
  const shared = join(base, 'shared');
  const start = async (name) => {
    const draft = join(base, name);
    await mkdir(draft);
    return startNodeHost({
      document: { version: '0.8.5', children: [] },
      sourcePath: join(draft, 'draft.op'),
      assetDirectory: shared,
      documentAssetDirectory: documentAssetDirectory(join(draft, 'draft.op')),
    });
  };
  const first = await start('draft-a');
  const saved = await call(first, 'import_design_md', { markdown: '# Shared brand\nAccent #123456.' });
  assert.equal(saved.isError, false, JSON.stringify(saved));
  await first.close();
  const second = await start('draft-b');
  context.after(() => second.close());
  const guide = await call(second, 'get_style_guide', { id: saved.structuredContent.asset.id });
  assert.equal(guide.structuredContent.content, '# Shared brand\nAccent #123456.');
});

test('host migrates supported document-local assets once without restoring removed templates', async (context) => {
  const base = await root(context);
  const sourcePath = join(base, 'design.op');
  const document = { version: '0.8.5', children: [] };
  await writeFile(sourcePath, JSON.stringify(document));
  const local = documentAssetDirectory(sourcePath);
  const legacy = await AssetStore.open({ directory: local });
  const guide = await legacy.put('style-guide', { name: 'Existing', markdown: '# Existing style' });
  const theme = await legacy.put('theme-preset', { name: 'Existing theme', preset: { type: 'example' } });
  legacy.close();
  const db = new DatabaseSync(join(local, 'assets.sqlite'));
  db.prepare('INSERT INTO assets VALUES (?,?,?,?)').run('user:00000000-0000-4000-8000-000000000001', 'scene-template', 'Removed', '{"name":"Removed"}');
  db.close();
  const shared = join(base, 'shared');
  const openHost = () => startNodeHost({ document, sourcePath, assetDirectory: shared });
  const first = await openHost();
  try {
    const importedGuide = await call(first, 'get_style_guide', { id: guide.asset.id });
    assert.equal(importedGuide.structuredContent.content, '# Existing style');
    const importedTheme = await call(first, 'get_theme_preset', { id: theme.asset.id });
    assert.equal(importedTheme.isError, false, JSON.stringify(importedTheme));
  } finally { await first.close(); }

  const sharedStore = await AssetStore.open({ directory: shared });
  assert.deepEqual((await sharedStore.snapshot()).assets.map(asset => asset.id).sort(), [guide.asset.id, theme.asset.id].sort());
  await sharedStore.remove('style-guide', guide.asset.id, { expectedRevision: sharedStore.revision() });
  sharedStore.close();
  const second = await openHost();
  try {
    const removed = await call(second, 'get_style_guide', { id: guide.asset.id });
    assert.equal(removed.isError, true, 'removed migrated assets must not reappear after restart');
  } finally { await second.close(); }
  const localCheck = new DatabaseSync(join(local, 'assets.sqlite'));
  try { assert.equal(localCheck.prepare('SELECT count(*) AS n FROM assets').get().n, 3); }
  finally { localCheck.close(); }
});

test('a prior migration marker is honored for its target but not another library', async (context) => {
  const base = await root(context);
  const sourcePath = join(base, 'design.op');
  const local = documentAssetDirectory(sourcePath);
  const legacy = await AssetStore.open({ directory: local });
  const guide = await legacy.put('style-guide', { name: 'Old style', markdown: '# Old style' });
  legacy.close();
  const firstDirectory = join(base, 'first');
  await mkdir(firstDirectory);
  await writeFile(join(local, 'migrated.json'), JSON.stringify({ target: await realpath(firstDirectory) }));

  const first = await openAssetStore({ assetDirectory: firstDirectory, sourcePath });
  assert.deepEqual((await first.snapshot()).assets, []);
  first.close();
  await rm(join(local, 'migrated.json'));
  const reopened = await openAssetStore({ assetDirectory: firstDirectory, sourcePath });
  assert.deepEqual((await reopened.snapshot()).assets, [], 'the recorded source must not be imported later');
  reopened.close();

  const other = await openAssetStore({ assetDirectory: join(base, 'other'), sourcePath });
  assert.equal((await other.get('style-guide', guide.asset.id)).payload.markdown, '# Old style');
  other.close();
});
