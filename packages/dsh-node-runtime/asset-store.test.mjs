import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

const storeModule = await import('./asset-store.mjs').catch((error) => {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  return null;
});

async function fixture(t) {
  assert.ok(storeModule, 'The persistent scoped AssetStore is missing');
  const root = await mkdtemp(join(tmpdir(), 'dsh-asset-store-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const directory = join(root, 'assets');
  const store = await storeModule.AssetStore.open({ directory });
  t.after(() => store.close());
  return { root, directory, store };
}

test('saved Markdown survives closing and reopening the same asset scope', async (t) => {
  const { directory, store } = await fixture(t);
  const saved = await store.put('style-guide', {
    name: 'Brand',
    markdown: '# Brand\n\nCustom notes.',
  });
  assert.equal(saved.revision, 1);
  store.close();
  const reopened = await storeModule.AssetStore.open({ directory });
  t.after(() => reopened.close());
  assert.equal(
    (await reopened.get('style-guide', saved.asset.id)).payload.markdown,
    '# Brand\n\nCustom notes.',
  );
  assert.equal((await reopened.snapshot()).revision, 1);
});

test('two stores in one scope preserve both writes and reject stale updates', async (t) => {
  const { directory, store } = await fixture(t);
  const other = await storeModule.AssetStore.open({ directory });
  t.after(() => other.close());
  const a = await store.put('style-guide', { name: 'A', markdown: '# A' });
  const b = await other.put('style-guide', { name: 'B', markdown: '# B' });
  assert.equal(b.revision, 2);
  assert.equal((await store.snapshot()).assets.length, 2);
  await assert.rejects(
    other.rename('style-guide', a.asset.id, 'A changed', { expectedRevision: 1 }),
    (error) => error.code === 'asset-conflict',
  );
  assert.equal((await store.get('style-guide', a.asset.id)).name, 'A');
  assert.equal((await store.snapshot()).revision, 2);
});

test('unrelated asset scopes do not share imported guides', async (t) => {
  const { root, store } = await fixture(t);
  const other = await storeModule.AssetStore.open({ directory: join(root, 'other') });
  t.after(() => other.close());
  const saved = await store.put('style-guide', { name: 'Only here', markdown: '# Scoped' });
  assert.equal((await other.snapshot()).assets.length, 0);
  await assert.rejects(
    other.get('style-guide', saved.asset.id),
    (error) => error.code === 'asset-not-found',
  );
});

test('same display names allocate distinct ids and do not overwrite prior content', async (t) => {
  const { store } = await fixture(t);
  const first = await store.put('style-guide', { name: 'Same', markdown: '# First' });
  const second = await store.put('style-guide', { name: 'Same', markdown: '# Second' });
  assert.notEqual(first.asset.id, second.asset.id);
  assert.equal((await store.get('style-guide', first.asset.id)).payload.markdown, '# First');
});

test('rename preserves source while delete only removes the specified asset', async (t) => {
  const { store } = await fixture(t);
  const a = await store.put('style-guide', { name: 'Old name', markdown: '# Original' });
  const b = await store.rename('style-guide', a.asset.id, 'New name', { expectedRevision: 1 });
  assert.equal(b.asset.name, 'New name');
  assert.equal(b.asset.payload.markdown, '# Original');
  const deleted = await store.remove('style-guide', a.asset.id, { expectedRevision: 2 });
  assert.equal(deleted.revision, 3);
  assert.equal((await store.snapshot()).assets.length, 0);
});

test('builtin ids and malformed ids cannot be used for storage writes', async (t) => {
  const { store } = await fixture(t);
  for (const id of ['slide-deck', '../outside', 'user:../../outside']) {
    await assert.rejects(
      store.put('style-guide', { name: 'No', markdown: '# No' }, { id }),
      (error) => error.code === 'asset-invalid',
    );
  }
  assert.equal((await store.snapshot()).revision, 0);
});

test('invalid kinds and empty payloads never advance the asset revision', async (t) => {
  const { store } = await fixture(t);
  for (const [kind, payload] of [
    ['unknown', { name: 'Name' }],
    ['style-guide', { name: 'Name', markdown: '' }],
    ['scene-template', { name: 'Name', document: {} }],
    ['theme-preset', { name: 'Name', preset: null }],
  ]) {
    await assert.rejects(store.put(kind, payload), (error) => error.code === 'asset-invalid');
  }
  assert.equal((await store.snapshot()).revision, 0);
});

test('invalid update and missing version cannot overwrite a valid entry', async (t) => {
  const { store } = await fixture(t);
  const saved = await store.put('style-guide', { name: 'Good', markdown: '# Good' });
  await assert.rejects(
    store.put('style-guide', { name: 'Wrong', markdown: '# Changed' }, { id: saved.asset.id }),
    (error) => error.code === 'asset-invalid',
  );
  await assert.rejects(
    store.put(
      'style-guide',
      { name: 'Wrong', markdown: '' },
      { id: saved.asset.id, expectedRevision: 1 },
    ),
  );
  assert.equal((await store.get('style-guide', saved.asset.id)).payload.markdown, '# Good');
  assert.equal((await store.snapshot()).revision, 1);
});

test('payload exceeding the existing HTTP size budget is rejected before persistence', async (t) => {
  const { store } = await fixture(t);
  await assert.rejects(
    store.put('style-guide', { name: 'Huge', markdown: 'x'.repeat(32 * 1024 * 1024) }),
    (error) => error.code === 'asset-too-large',
  );
  assert.equal((await store.snapshot()).revision, 0);
});

test('a corrupt existing database is not silently replaced by an empty library', async (t) => {
  const { directory, store } = await fixture(t);
  store.close();
  await writeFile(join(directory, 'assets.sqlite'), 'not an asset database');
  await assert.rejects(
    storeModule.AssetStore.open({ directory }),
    (error) => error.code === 'asset-storage',
  );
  assert.equal(await readFile(join(directory, 'assets.sqlite'), 'utf8'), 'not an asset database');
});

test('database symlink cannot redirect writes outside the asset scope', async (t) => {
  const { root, store } = await fixture(t);
  store.close();
  const directory = join(root, 'linked');
  await mkdir(directory);
  const outside = join(root, 'outside.txt');
  await writeFile(outside, 'Leave this untouched');
  await symlink(outside, join(directory, 'assets.sqlite'));
  await assert.rejects(
    storeModule.AssetStore.open({ directory }),
    (error) => error.code === 'asset-invalid',
  );
  assert.equal(await readFile(outside, 'utf8'), 'Leave this untouched');
});

test('another transaction cannot produce a partial write or a false success', async (t) => {
  const { directory, store } = await fixture(t);
  const writer = new DatabaseSync(join(directory, 'assets.sqlite'));
  t.after(() => writer.close());
  writer.exec('BEGIN IMMEDIATE');
  await assert.rejects(
    store.put('style-guide', { name: 'Blocked', markdown: '# Not written' }),
    (error) => error.code === 'asset-busy',
  );
  writer.exec('ROLLBACK');
  assert.equal((await store.snapshot()).revision, 0);
  assert.equal((await store.snapshot()).assets.length, 0);
  assert.equal(
    (await store.put('style-guide', { name: 'Retry', markdown: '# Written' })).revision,
    1,
  );
});

test('a corrupt payload is reported when requested instead of silently returning a guide', async (t) => {
  const { directory, store } = await fixture(t);
  const saved = await store.put('style-guide', { name: 'Good', markdown: '# Good' });
  const writer = new DatabaseSync(join(directory, 'assets.sqlite'));
  t.after(() => writer.close());
  writer.prepare('UPDATE assets SET payload=? WHERE id=?').run('not-json', saved.asset.id);
  await assert.rejects(
    store.get('style-guide', saved.asset.id),
    (error) => error.code === 'asset-storage',
  );
});
