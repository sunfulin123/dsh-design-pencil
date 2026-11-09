import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  defaultAssetDirectory,
  documentAssetDirectory,
} from './asset-directory.mjs';
import { startNodeHost } from './node-host.mjs';

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
