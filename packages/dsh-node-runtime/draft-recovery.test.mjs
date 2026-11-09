import assert from 'node:assert/strict';
import { chmod, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { startNodeHost } from './node-host.mjs';

const original = {
  version: '0.8.5',
  name: 'Recovery fixture',
  children: [{ type: 'rectangle', id: 'box', width: 20, height: 20 }],
  customExtension: { phase: 'original' },
};

function post(body) {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

async function fixture(context) {
  const root = await mkdtemp(join(tmpdir(), 'dsh-drafts-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const sourcePath = join(root, 'design.op');
  await writeFile(sourcePath, JSON.stringify(original));
  const options = { document: original, sourcePath, draftDirectory: join(root, 'drafts') };
  const hosts = [];
  context.after(async () => {
    for (const host of hosts) await host.close();
  });
  const start = async (overrides = {}) => {
    const host = await startNodeHost({ ...options, ...overrides });
    hosts.push(host);
    return {
      host,
      snapshot: async () => (await fetch(`${host.baseUrl}/api/mcp/document`)).json(),
      rpc: async (method, params) =>
        (
          await (
            await fetch(
              `${host.baseUrl}/mcp`,
              post({
                jsonrpc: '2.0',
                id: method,
                method,
                params,
              }),
            )
          ).json()
        ).result,
      call: async (name, args = {}) =>
        (
          await (
            await fetch(
              `${host.baseUrl}/mcp`,
              post({
                jsonrpc: '2.0',
                id: name,
                method: 'tools/call',
                params: { name, arguments: args },
              }),
            )
          ).json()
        ).result,
    };
  };
  return { ...(await start()), start, sourcePath, options };
}

function success(result) {
  assert.equal(result.isError, false, JSON.stringify(result));
  return result.structuredContent;
}

test('shared asset API design mutations produce a recoverable autosave', async (context) => {
  const f = await fixture(context);
  const saved = success(await f.call('save_theme_preset', { name: 'Recovery theme' }));
  const response = await fetch(
    `${f.host.baseUrl}/api/assets/tools`,
    post({
      name: 'load_theme_preset',
      arguments: { id: saved.asset.id },
    }),
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).isError, false);
  const drafts = success(await f.call('list_drafts')).drafts;
  assert.equal(drafts.length, 1);
  const before = (await f.snapshot()).document;
  await f.host.close();
  const reopened = await f.start();
  success(await reopened.call('restore_draft', { id: drafts[0].id }));
  assert.deepEqual((await reopened.snapshot()).document.children, before.children);
});

test('draft schemas are discoverable and autosaves survive host restart without saving the bound file', async (context) => {
  const f = await fixture(context);
  const tools = (await f.rpc('tools/list')).tools;
  for (const name of ['list_drafts', 'create_draft', 'restore_draft', 'delete_draft']) {
    const tool = tools.find((tool) => tool.name === name);
    assert.ok(tool, `${name} must be discoverable`);
    assert.equal(tool.inputSchema.additionalProperties, false);
    const search = success(await f.call('tool_search', { query: name }));
    assert.deepEqual(search.tools[0].inputSchema, tool.inputSchema);
  }
  assert.deepEqual(success(await f.call('list_drafts')).drafts, []);
  success(await f.call('update_node', { node_id: 'box', data: { width: 36 } }));
  const saved = success(await f.call('list_drafts')).drafts;
  assert.equal(saved.length, 1);
  assert.equal(saved[0].kind, 'autosave');
  assert.equal(saved[0].documentName, original.name);
  assert.equal(Object.hasOwn(saved[0], 'document'), false);
  await f.host.close();
  const reopened = await f.start();
  assert.equal((await reopened.snapshot()).document.children[0].width, 20);
  assert.equal(success(await reopened.call('list_drafts')).drafts[0].id, saved[0].id);
  const restored = success(
    await reopened.call('synapse_restore_draft', { id: saved[0].id, baseVersion: 0 }),
  );
  assert.ok(restored.backupId);
  assert.equal(restored.version, 1);
  assert.equal((await reopened.snapshot()).document.children[0].width, 36);
  assert.deepEqual(JSON.parse(await readFile(f.sourcePath, 'utf8')), original);
});

test('restoring a checkpoint preserves existing undo/redo and creates a persistent protective backup', async (context) => {
  const f = await fixture(context);
  success(await f.call('update_node', { node_id: 'box', data: { width: 30 } }));
  const checkpoint = success(await f.call('create_draft', { label: 'Before refinement' }));
  assert.equal((await f.snapshot()).version, 1);
  assert.equal(success(await f.call('list_drafts')).currentVersion, 1);
  success(await f.call('update_node', { node_id: 'box', data: { width: 48 } }));
  const restored = success(await f.call('restore_draft', { id: checkpoint.id, baseVersion: 2 }));
  assert.equal(restored.version, 3);
  assert.equal((await f.snapshot()).document.children[0].width, 30);
  const backups = success(await f.call('list_drafts')).drafts;
  assert.ok(
    backups.some((draft) => draft.id === restored.backupId && draft.kind === 'pre-restore'),
  );
  success(await f.call('undo'));
  assert.equal((await f.snapshot()).document.children[0].width, 48);
  success(await f.call('undo'));
  assert.equal((await f.snapshot()).document.children[0].width, 30);
  success(await f.call('redo'));
  assert.equal((await f.snapshot()).document.children[0].width, 48);
  success(await f.call('redo'));
  assert.equal((await f.snapshot()).document.children[0].width, 30);
  success(await f.call('restore_draft', { id: restored.backupId }));
  assert.equal((await f.snapshot()).document.children[0].width, 48);
  const version = (await f.snapshot()).version;
  success(await f.call('openpencil_delete_draft', { id: checkpoint.id }));
  assert.equal((await f.snapshot()).version, version);
  assert.ok(
    !success(await f.call('list_drafts')).drafts.some((draft) => draft.id === checkpoint.id),
  );
});

test('invalid, foreign and stale draft requests retain the live document and history', async (context) => {
  const f = await fixture(context);
  const checkpoint = success(await f.call('create_draft', { label: 'Original' }));
  success(await f.call('update_node', { node_id: 'box', data: { width: 40 } }));
  const before = await f.snapshot();
  for (const args of [
    { id: '../design.op' },
    { id: checkpoint.id, baseVersion: 0 },
    { id: checkpoint.id, unexpected: true },
    { id: '' },
  ]) {
    assert.equal((await f.call('restore_draft', args)).isError, true);
    assert.deepEqual(await f.snapshot(), before);
  }
  const otherPath = join(f.sourcePath, '..', 'other.op');
  await writeFile(otherPath, JSON.stringify(original));
  const other = await f.start({ sourcePath: otherPath });
  assert.deepEqual(success(await other.call('list_drafts')).drafts, []);
  assert.equal((await other.call('restore_draft', { id: checkpoint.id })).isError, true);
  success(await f.call('undo'));
  assert.equal((await f.snapshot()).document.children[0].width, 20);
});

test('autosave failures explicitly report that the live edit landed over MCP and browser HTTP', async (context) => {
  const f = await fixture(context);
  await writeFile(f.options.draftDirectory, 'not a directory');
  const failedCheckpoint = await f.call('create_draft');
  assert.equal(failedCheckpoint.isError, true);
  assert.equal((await f.snapshot()).version, 0);
  const failedAutosave = await f.call('update_node', { node_id: 'box', data: { width: 40 } });
  assert.equal(failedAutosave.isError, true);
  assert.deepEqual(failedAutosave.structuredContent, {
    applied: true,
    version: 1,
    error: 'draft-write-failed',
  });
  assert.equal((await f.snapshot()).document.children[0].width, 40);
  const next = structuredClone((await f.snapshot()).document);
  next.children[0].width = 56;
  const response = await fetch(
    `${f.host.baseUrl}/api/mcp/document`,
    post({ document: next, baseVersion: 1 }),
  );
  assert.equal(response.status, 507);
  const body = await response.json();
  assert.equal(body.error, 'draft-write-failed');
  assert.equal(body.applied, true);
  assert.equal(body.version, 2);
  assert.equal((await f.snapshot()).document.children[0].width, 56);
  assert.equal((await f.call('list_drafts')).isError, true);
});

test(
  'a failed protective backup aborts recovery before touching live state',
  {
    skip: process.platform === 'win32' || process.getuid?.() === 0,
  },
  async (context) => {
    const f = await fixture(context);
    const checkpoint = success(await f.call('create_draft'));
    success(await f.call('update_node', { node_id: 'box', data: { width: 40 } }));
    const before = await f.snapshot();
    await chmod(f.options.draftDirectory, 0o500);
    try {
      const result = await f.call('restore_draft', { id: checkpoint.id });
      assert.equal(result.isError, true);
      assert.match(result.content[0].text, /EACCES/);
      assert.deepEqual(await f.snapshot(), before);
    } finally {
      await chmod(f.options.draftDirectory, 0o700);
    }
    success(await f.call('undo'));
    assert.equal((await f.snapshot()).document.children[0].width, 20);
  },
);

test('corrupt canonical nodes fail before making a backup or changing the live document', async (context) => {
  const f = await fixture(context);
  const checkpoint = success(await f.call('create_draft'));
  const file = (await readdir(f.options.draftDirectory)).find((name) =>
    name.includes(checkpoint.id),
  );
  const path = join(f.options.draftDirectory, file);
  const record = JSON.parse(await readFile(path, 'utf8'));
  record.document.children = [{ type: 'not_a_node' }];
  await writeFile(path, JSON.stringify(record));
  const before = await f.snapshot();
  const result = await f.call('restore_draft', { id: checkpoint.id });
  assert.equal(result.isError, true);
  assert.equal(typeof result.content[0].text, 'string');
  assert.deepEqual(await f.snapshot(), before);
  assert.equal(success(await f.call('list_drafts')).drafts.length, 1);
  record.sourceKey = 'foreign-document';
  await writeFile(path, JSON.stringify(record));
  assert.equal((await f.call('restore_draft', { id: checkpoint.id })).isError, true);
  assert.equal((await f.call('list_drafts')).isError, true);
});

test('read-only tool calls and unchanged camera pushes never write an autosave', async (context) => {
  const { call, snapshot, host } = await fixture(context);
  const autosaves = async () =>
    (await call('list_drafts')).structuredContent.drafts.filter(
      (draft) => draft.kind === 'autosave',
    );
  await call('get_document_info');
  await call('list_pages');
  assert.deepEqual(await autosaves(), [], 'read-only calls');
  const current = await snapshot();
  const push = await fetch(
    `${host.baseUrl}/api/mcp/document`,
    post({
      document: current.document,
      baseVersion: current.version,
      metadataOnly: true,
    }),
  );
  assert.equal(push.status, 200);
  assert.deepEqual(await autosaves(), []);
  const updated = await call('update_node', { nodeId: 'box', data: { width: 44 } });
  assert.equal(updated.isError, false);
  assert.equal((await autosaves()).length, 1);
});
