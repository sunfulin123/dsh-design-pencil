import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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

test('OP guidance selects from the live catalogue and injects the complete selected design', async (t) => {
  const { host } = await fixture(t);
  const markdown = '# My distinctive brand\n\nUse a violet accent #6123ab and generous spacing.';
  const saved = await call(host, 'import_design_md', { name: 'My Brand', markdown });
  const { id } = saved.structuredContent.asset;
  const pending = await call(host, 'plan_design_style', { userMessage: '设计一个应用', taskKind: 'new' });
  assert.equal(pending.structuredContent.decision, 'ask_user');
  assert.equal(pending.structuredContent.recommendedId, 'talkdesk-cobalt');
  const importedPreview = pending.structuredContent.candidates.find((item) => item.id === id);
  assert.ok(importedPreview.swatches.some((color) => color.toLowerCase() === '#6123ab'));
  assert.equal(importedPreview.category ?? 'uncategorized', 'uncategorized');
  assert.equal(importedPreview.contentHash, createHash('sha256').update(markdown).digest('hex'));
  const builtinPreview = pending.structuredContent.candidates.find((item) => item.id === 'talkdesk-cobalt');
  assert.ok(builtinPreview.swatches.length > 0);
  assert.equal(typeof builtinPreview.summary, 'string');
  assert.equal(JSON.stringify(pending).includes(markdown), false);
  const canvas = await call(host, 'plan_design_canvas', { userMessage: '你决定', context: '设计手机应用' });
  assert.equal(canvas.isError, false, JSON.stringify(canvas));
  assert.equal(canvas.structuredContent.canvas.platform, 'mobile');
  const selected = await call(host, 'plan_design_style', { userMessage: '使用 My Brand 风格', taskKind: 'new' });
  assert.equal(selected.structuredContent.guideId, id);
  const prompt = await call(host, 'get_design_agent_prompt', {
    userMessage: '设计一个应用', mode: 'full', styleId: id,
    expectedRevision: pending.structuredContent.catalogRevision,
  });
  assert.equal(prompt.isError, false, JSON.stringify(prompt));
  assert.equal(prompt.structuredContent.style.id, id);
  assert.ok(prompt.structuredContent.prompt.includes(markdown));
  assert.ok(prompt.structuredContent.prompt.includes('three-layer context funnel'));
  assert.equal((await call(host, 'set_design_md', { markdown })).isError, false);
  const inherited = await call(host, 'get_design_agent_prompt', {
    userMessage: '缩小卡片', mode: 'local', useDocumentStyle: true,
  });
  assert.equal(inherited.isError, false, JSON.stringify(inherited));
  assert.ok(inherited.structuredContent.prompt.includes(markdown));
  assert.equal(inherited.structuredContent.style.source, 'document');
  const caps = await call(host, 'get_design_capabilities');
  assert.equal(caps.structuredContent.version, 1);
  assert.equal(caps.structuredContent.tools.find((item) => item.name === 'import_design_md').access, 'sensitive');
  assert.equal(caps.structuredContent.tools.find((item) => item.name === 'set_text_style').access, 'document-write');
  await call(host, 'rename_style_guide', { id, name: 'Updated Brand', expectedRevision: 1 });
  const stale = await call(host, 'get_design_agent_prompt', {
    userMessage: '设计一个应用', styleId: id, expectedRevision: 1,
  });
  assert.equal(stale.isError, true);
  assert.equal(stale.structuredContent.error, 'asset-conflict');
  const invalidRevision = await call(host, 'get_style_guide', { name: 'Updated Brand', expectedRevision: 1 });
  assert.equal(invalidRevision.isError, true);
  const missing = await call(host, 'get_design_agent_prompt', { userMessage: '设计', styleId: 'missing' });
  assert.equal(missing.isError, true);
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


test('all 84 DESIGN.md guides ship as immutable builtins beside Cobalt and templates are absent', async (t) => {
  const { host } = await fixture(t);
  const list = await call(host, 'list_style_guides', { source: 'builtin', limit: 100 });
  assert.equal(list.isError, false, JSON.stringify(list));
  assert.equal(list.structuredContent.count, 85);
  const guides = list.structuredContent.guides;
  assert.equal(guides[0].id, 'talkdesk-cobalt');
  assert.equal(guides.filter((g) => g.id.startsWith('design-md:')).length, 84);
  assert.ok(guides.every((g) => typeof g.category === 'string' && g.category.length > 0));
  assert.ok(guides.every((g) => /^[a-f0-9]{64}$/.test(g.contentHash)));
  assert.ok(guides.every((g) => g.isUser === false));
  assert.ok(!guides.some((g) => g.id === 'design-md:talkdesk'));
  const { readFile } = await import('node:fs/promises');
  const manifestUrl = new URL('../../crates/op-ai-skills/skills/style-guides/manifest.json', import.meta.url);
  const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));
  for (const entry of manifest) {
    const guide = await call(host, 'get_style_guide', { id: entry.id });
    assert.equal(guide.isError, false, entry.id);
    const original = await readFile(new URL(entry.path, manifestUrl), 'utf8');
    assert.equal(guide.structuredContent.content, original, entry.id);
  }
  const catalog = await (await fetch(`${host.baseUrl}/api/assets`)).json();
  assert.ok(catalog.assets.every((a) => a.kind !== 'scene-template'));
  const removed = await call(host, 'save_scene_template', { name: 'Retired' });
  assert.ok(!removed || removed.isError);
  const deletion = await call(host, 'delete_style_guide', { id: 'design-md:apple', expectedRevision: 0 });
  assert.equal(deletion.isError, true);
});
