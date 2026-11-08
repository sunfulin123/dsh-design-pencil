import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { startNodeHost } from './node-host.mjs';
import { AssetStore } from './asset-store.mjs';
import { AssetTools } from './asset-tools.mjs';
import { EngineSession } from './engine-session.mjs';

async function fixture(t, options = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-assets-tools-'));
  const hosts = [];
  t.after(async () => {
    await Promise.all(hosts.map((h) => h.close()));
    await rm(directory, { recursive: true });
  });
  const start = async () => {
    const host = await startNodeHost({
      document: { version: '0.8.5', children: [] },
      assetDirectory: directory,
      ...options,
    });
    hosts.push(host);
    return host;
  };
  return { host: await start(), start };
}

async function call(host, name, args = {}) {
  const response = await fetch(`${host.baseUrl}/mcp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name, arguments: args },
    }),
  });
  const reply = await response.json();
  return reply.result;
}

test('catalogue rejects a concurrent cross-host revision instead of publishing mixed metadata', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-assets-catalog-'));
  const first = await AssetStore.open({ directory });
  const second = await AssetStore.open({ directory });
  const session = new EngineSession({ version: '0.8.5', children: [] });
  t.after(async () => {
    first.close();
    second.close();
    session.close();
    await rm(directory, { recursive: true });
  });
  const saved = await first.put('style-guide', { name: 'Before', markdown: '# Brand style' });
  const get = first.get.bind(first);
  first.get = async (...args) => {
    await second.rename('style-guide', saved.asset.id, 'After', { expectedRevision: 1 });
    return get(...args);
  };
  const assets = new AssetTools(session, { store: first });
  await assert.rejects(assets.catalog(), (error) => error.code === 'asset-conflict');
});

test('imported Markdown is queryable from both MCP and API after host restart', async (t) => {
  const { host, start } = await fixture(t);
  const markdown = '# Brand Library\n\nKeep this unknown section exactly.\nAccent #123456.';
  const saved = await call(host, 'import_design_md', { markdown });
  assert.equal(saved.isError, false, JSON.stringify(saved));
  const { asset, revision } = saved.structuredContent;
  assert.match(asset.id, /^user:/);
  assert.equal(revision, 1);
  const api = await (await fetch(`${host.baseUrl}/api/assets`)).json();
  assert.equal(api.revision, 1);
  assert.equal(api.assets.filter((a) => a.id === asset.id).length, 1);
  assert.equal(JSON.stringify(api).includes(markdown), false);
  await host.close();
  const reopened = await start();
  const guide = await call(reopened, 'get_style_guide', { id: asset.id });
  assert.equal(guide.structuredContent.content, markdown);
  const listed = await call(reopened, 'list_style_guides', { id: asset.id });
  assert.equal(listed.structuredContent.guides[0].content, markdown);
});

test('asset updates require current revisions and deleting assets does not change designs', async (t) => {
  const { host } = await fixture(t);
  const saved = await call(host, 'import_design_md', { markdown: '# A style guide with details.' });
  assert.equal(saved.isError, false);
  const id = saved.structuredContent.asset.id;
  assert.equal(
    (await call(host, 'rename_style_guide', { id, name: 'New', expectedRevision: 0 })).isError,
    true,
  );
  assert.equal(
    (await call(host, 'rename_style_guide', { id, name: 'New', expectedRevision: 1 })).isError,
    false,
  );
  const doc = await (await fetch(`${host.baseUrl}/api/mcp/document`)).json();
  assert.equal(doc.version, 0);
  assert.equal(
    (await call(host, 'delete_style_guide', { id, expectedRevision: 2 })).isError,
    false,
  );
  assert.deepEqual(await (await fetch(`${host.baseUrl}/api/mcp/document`)).json(), doc);
});

test('save, instantiate and undo retain authored nodes and extension fields', async (t) => {
  const { host } = await fixture(t, {
    document: {
      version: '0.8.5',
      extension: { retained: true },
      children: [
        {
          id: 'original',
          type: 'frame',
          width: 200,
          height: 100,
          fill: [{ type: 'solid', color: '#123456' }],
          custom: { retained: true },
        },
      ],
    },
  });
  const saved = await call(host, 'save_scene_template', { name: 'Board', nodeIds: ['original'] });
  assert.equal(saved.isError, false, JSON.stringify(saved));
  const id = saved.structuredContent.asset.id;
  const before = await (await fetch(`${host.baseUrl}/api/mcp/document`)).json();
  const applied = await call(host, 'instantiate_scene_template', { id });
  assert.equal(applied.isError, false, JSON.stringify(applied));
  assert.equal(applied.structuredContent.nodeIds.length, 1);
  const after = await (await fetch(`${host.baseUrl}/api/mcp/document`)).json();
  assert.equal(after.document.children.length, 2);
  assert.deepEqual(after.document.extension, { retained: true });
  assert.deepEqual(after.document.children[1].custom, { retained: true });
  await call(host, 'undo');
  const undone = await (await fetch(`${host.baseUrl}/api/mcp/document`)).json();
  assert.deepEqual(undone.document, before.document);
  await call(host, 'redo');
  const redone = await (await fetch(`${host.baseUrl}/api/mcp/document`)).json();
  assert.deepEqual(redone.document.children[1].custom, { retained: true });
});

test('theme presets preserve unknown fields, validate versions and apply in one undo', async (t) => {
  const { host } = await fixture(t);
  const preset = {
    type: 'openpencil-theme-preset',
    version: '1.0.0',
    name: 'Brand',
    themes: { Mode: ['Light', 'Dark'] },
    variables: { brand: { type: 'color', value: '#abcdef' } },
    custom: { unknown: 'keep' },
  };
  assert.equal(
    (await call(host, 'import_theme_preset', { preset: { ...preset, version: 'future' } })).isError,
    true,
  );
  const saved = await call(host, 'import_theme_preset', { preset });
  assert.equal(saved.isError, false, JSON.stringify(saved));
  const id = saved.structuredContent.asset.id;
  const exported = await call(host, 'export_theme_preset', { id });
  assert.deepEqual(exported.structuredContent.preset, preset);
  const loaded = await call(host, 'load_theme_preset', { id });
  assert.equal(loaded.isError, false);
  const changed = await (await fetch(`${host.baseUrl}/api/mcp/document`)).json();
  assert.deepEqual(changed.document.themes, preset.themes);
  await call(host, 'undo');
  const undone = await (await fetch(`${host.baseUrl}/api/mcp/document`)).json();
  assert.equal(undone.document.themes, undefined);
});

test('saving an updated template keeps old instances bound to their original alias values', async (t) => {
  const { host } = await fixture(t, {
    document: {
      version: '1.0.0',
      children: [
        {
          id: 'board',
          type: 'frame',
          width: 100,
          height: 50,
          fill: [{ type: 'solid', color: '$brand' }],
        },
      ],
      variables: {
        base: { type: 'color', value: '#112233' },
        brand: { type: 'color', value: '$base' },
      },
    },
  });
  const saved = await call(host, 'save_scene_template', { name: 'Brand', nodeIds: ['board'] });
  assert.equal(saved.isError, false);
  const { asset, revision } = saved.structuredContent;
  const first = await call(host, 'instantiate_scene_template', { id: asset.id });
  assert.equal(first.isError, false, JSON.stringify(first));
  const changed = await call(host, 'set_variables', {
    variables: { base: { type: 'color', value: '#aabbcc' } },
  });
  assert.equal(changed.isError, false, JSON.stringify(changed));
  const updated = await call(host, 'save_scene_template', {
    name: 'Brand',
    nodeIds: ['board'],
    id: asset.id,
    expectedRevision: revision,
  });
  assert.equal(updated.isError, false, JSON.stringify(updated));
  const before = (await (await fetch(`${host.baseUrl}/api/mcp/document`)).json()).document;
  const second = await call(host, 'instantiate_scene_template', { id: asset.id });
  assert.equal(second.isError, false, JSON.stringify(second));
  const doc = (await (await fetch(`${host.baseUrl}/api/mcp/document`)).json()).document;
  const refs = doc.children.slice(1).map((n) => n.fill[0].color.slice(1));
  assert.notEqual(refs[0], refs[1]);
  for (const [index, color] of ['#112233', '#aabbcc'].entries()) {
    const base = doc.variables[refs[index]].value.slice(1);
    assert.equal(doc.variables[base].value, color);
  }
  assert.equal((await call(host, 'undo')).isError, false);
  const undone = (await (await fetch(`${host.baseUrl}/api/mcp/document`)).json()).document;
  assert.deepEqual(undone, before);
});

test('canonical variable and theme tools retain their object arguments outside batch_design', async (t) => {
  const { host } = await fixture(t);
  const variables = { base: { type: 'color', value: '#aabbcc' } };
  const themes = { Mode: ['Light', 'Dark'] };
  for (const [name, args] of [
    ['set_variables', { variables }],
    ['set_themes', { themes }],
  ]) {
    const result = await call(host, name, args);
    assert.equal(result.isError, false, JSON.stringify(result));
  }
  const doc = (await (await fetch(`${host.baseUrl}/api/mcp/document`)).json()).document;
  assert.deepEqual(doc.variables, variables);
  assert.deepEqual(doc.themes, themes);
});

test('builtin assets are read-only and invalid requests cannot publish assets', async (t) => {
  const { host } = await fixture(t);
  const themes = await call(host, 'list_theme_presets');
  assert.equal(themes.structuredContent.presets.length, 4);
  assert.equal(
    (await call(host, 'delete_theme_preset', { id: 'halo', expectedRevision: 0 })).isError,
    true,
  );
  assert.equal((await call(host, 'save_scene_template', { name: 'Empty' })).isError, true);
  assert.equal(
    (await call(host, 'import_design_md', { markdown: ' ', path: '/etc/passwd' })).isError,
    true,
  );
  assert.equal((await (await fetch(`${host.baseUrl}/api/assets`)).json()).revision, 0);
});

test('style imports in separate scopes cannot leak through WASM globals', async (t) => {
  const one = await fixture(t);
  const two = await fixture(t);
  const saved = await call(one.host, 'import_design_md', {
    markdown: '# One private project style.',
  });
  assert.equal(saved.isError, false);
  assert.equal(
    (await call(two.host, 'get_style_guide', { id: saved.structuredContent.asset.id })).isError,
    true,
  );
});

test('asset conflicts expose machine-readable errors over MCP and the shared API', async (t) => {
  const { host } = await fixture(t);
  const saved = await call(host, 'import_design_md', { markdown: '# Brand style' });
  const args = { id: saved.structuredContent.asset.id, name: 'Changed', expectedRevision: 0 };
  const conflict = await call(host, 'rename_style_guide', args);
  assert.equal(conflict.structuredContent?.error, 'asset-conflict');
  const response = await fetch(`${host.baseUrl}/api/assets/tools`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'rename_style_guide', arguments: args }),
  });
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error, 'asset-conflict');
});

test('saving a ref includes its reusable master from another page', async (t) => {
  const { host } = await fixture(t, {
    document: {
      version: '0.8.5',
      children: [],
      pages: [
        { id: 'scene', name: 'Scene', children: [{ id: 'instance', type: 'ref', ref: 'master' }] },
        {
          id: 'library',
          name: 'Library',
          children: [
            {
              id: 'master',
              type: 'frame',
              reusable: true,
              width: 100,
              height: 50,
              children: [{ id: 'label', type: 'text', content: 'Shared label', fontSize: 14 }],
            },
          ],
        },
      ],
      editorMeta: { activePageIndex: 0 },
    },
  });
  const saved = await call(host, 'save_scene_template', {
    name: 'Component',
    nodeIds: ['instance'],
  });
  assert.equal(saved.isError, false, JSON.stringify(saved));
  const children = saved.structuredContent.asset.payload.document.children;
  assert.ok(children.some((node) => node.id === 'master' && node.reusable));
  const applied = await call(host, 'instantiate_scene_template', {
    id: saved.structuredContent.asset.id,
  });
  assert.equal(applied.isError, false, JSON.stringify(applied));
  const doc = (await (await fetch(`${host.baseUrl}/api/mcp/document`)).json()).document;
  const inserted = doc.pages[0].children.filter((n) =>
    applied.structuredContent.nodeIds.includes(n.id),
  );
  const ref = inserted.find((n) => n.type === 'ref');
  assert.ok(inserted.some((n) => n.id === ref.ref && n.reusable));
});
