import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { request } from 'node:http';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { startNodeHost } from './node-host.mjs';
import { solidPng } from './png-fixture.test-helper.mjs';

async function fixture(context, options = {}) {
  const host = await startNodeHost({
    document: { version: '0.8.5', children: [] },
    allowOrigins: ['dsh-app://app'],
    draftDirectory: options.sourcePath ? join(dirname(options.sourcePath), '.drafts') : undefined,
    ...options,
  });
  context.after(() => host.close());
  return host;
}

function write(body, headers = {}) {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  };
}

test('HTTP viewport metadata survives ordinary sync and supports explicit reset without content revisions', async (context) => {
  const viewport = { panX: 123.5, panY: -45.25, zoom: 1.5 };
  const document = { version: '0.8.5', children: [], editorMeta: { viewport } };
  const host = await fixture(context, { document });
  const route = `${host.baseUrl}/api/mcp/document`;
  const snapshot = async () => (await fetch(route)).json();
  const update = (body) =>
    fetch(
      route,
      write({
        document: { version: '0.8.5', children: [] },
        baseVersion: 0,
        metadataOnly: true,
        ...body,
      }),
    );
  assert.deepEqual((await snapshot()).viewport, viewport);
  assert.equal((await update({})).status, 200);
  assert.deepEqual((await snapshot()).viewport, viewport);

  const moved = { panX: -20.75, panY: 88.125, zoom: 2 };
  assert.equal((await update({ viewport: moved })).status, 200);
  assert.deepEqual((await snapshot()).viewport, moved);
  assert.equal((await snapshot()).version, 0);
  assert.equal((await update({ viewport: { ...moved, zoom: 0 } })).status, 400);
  assert.deepEqual((await snapshot()).viewport, moved);

  assert.equal((await update({ viewport: null })).status, 200);
  assert.equal((await snapshot()).viewport, null);
  assert.equal(Object.hasOwn((await snapshot()).document.editorMeta, 'viewport'), false);
  assert.equal((await update({ document })).status, 200);
  assert.deepEqual((await snapshot()).viewport, viewport);
  assert.equal((await update({ document: { ...document, editorMeta: {} } })).status, 200);
  assert.equal((await snapshot()).viewport, null);
  assert.equal((await snapshot()).version, 0);
});

test('metadata-only camera pushes preserve content and reject a stale camera baseline', async (context) => {
  const document = {
    version: '0.8.5',
    children: [{ type: 'rectangle', id: 'box', width: 20, height: 20 }],
    customExtension: { retained: true },
  };
  const host = await fixture(context, { document });
  const route = `${host.baseUrl}/api/mcp/document`;
  const snapshot = async () => (await fetch(route)).json();
  const initial = await snapshot();
  const identity = { panX: 0, panY: 0, zoom: 1 };
  const moved = { panX: 20.25, panY: -10.125, zoom: 1.25 };
  const push = (viewport, baseViewport) =>
    fetch(
      route,
      write({
        document: { children: [] },
        baseVersion: 0,
        metadataOnly: true,
        viewport,
        baseViewport,
      }),
    );
  assert.equal((await push(moved, identity)).status, 200);
  const before = await snapshot();
  assert.equal((await push(identity, identity)).status, 409);
  assert.deepEqual(await snapshot(), before);
  assert.equal(before.version, 0);
  assert.deepEqual(before.viewport, moved);
  assert.deepEqual(before.document.children, initial.document.children);
  assert.deepEqual(before.document.customExtension, document.customExtension);
  assert.equal(initial.metadataOnlyPush, true);
  assert.equal((await push(identity, moved)).status, 200);
  assert.equal((await snapshot()).viewport, null);
  assert.equal((await push(moved, { ...identity, panX: 'invalid' })).status, 400);
});

test('invalid saved view hints do not prevent browser synchronization', async (context) => {
  const host = await fixture(context, {
    document: {
      version: '0.8.5',
      children: [],
      editorMeta: {
        viewport: { panX: 'invalid', panY: 0, zoom: 1 },
      },
    },
  });
  const route = `${host.baseUrl}/api/mcp/document`;
  assert.equal((await (await fetch(route)).json()).viewport, null);
  const response = await fetch(
    route,
    write({
      document: { version: '0.8.5', children: [] },
      baseVersion: 0,
      metadataOnly: true,
    }),
  );
  assert.equal(response.status, 200);
  assert.equal((await (await fetch(route)).json()).version, 0);
});

test('AI UI scale hints survive stale browser acknowledgements without changing content or undo', async (context) => {
  const host = await fixture(context, {
    document: {
      version: '0.8.5',
      children: [{ type: 'rectangle', id: 'box', width: 20, height: 20 }],
    },
  });
  const snapshot = async () => (await fetch(`${host.baseUrl}/api/mcp/document`)).json();
  const call = async (name, args = {}) => {
    const response = await fetch(
      `${host.baseUrl}/mcp`,
      write({
        jsonrpc: '2.0',
        id: name,
        method: 'tools/call',
        params: { name, arguments: args },
      }),
    );
    const result = (await response.json()).result;
    assert.equal(result.isError, false, JSON.stringify(result));
    return result.structuredContent;
  };
  const acknowledge = (uiScale) =>
    fetch(
      `${host.baseUrl}/api/mcp/selection`,
      write({
        selectedIds: [],
        activePageId: '0',
        uiScale,
      }),
    );
  assert.equal((await snapshot()).uiScale, null);
  assert.equal((await acknowledge(110)).status, 200);
  assert.equal((await call('get_ui_scale')).scale, 110);
  await call('update_node', { node_id: 'box', data: { width: 40 } });
  assert.equal((await call('set_ui_scale', { scale: 125 })).scale, 125);
  assert.equal((await snapshot()).uiScale, 125);
  assert.equal((await snapshot()).version, 1);
  assert.equal((await acknowledge(110)).status, 200);
  assert.equal((await snapshot()).uiScale, 125);
  assert.equal((await call('get_ui_scale')).scale, 125);
  assert.equal((await acknowledge(125)).status, 200);
  assert.equal((await snapshot()).uiScale, null);
  const current = await snapshot();
  assert.equal(
    (
      await fetch(
        `${host.baseUrl}/api/mcp/document`,
        write({
          document: current.document,
          baseVersion: 1,
          metadataOnly: true,
        }),
      )
    ).status,
    200,
  );
  assert.equal((await call('get_ui_scale')).scale, 125);
  assert.equal((await acknowledge(200)).status, 400);
  await call('undo');
  assert.equal((await snapshot()).document.children[0].width, 20);
  assert.equal((await call('get_ui_scale')).scale, 125);
});

test('renderer sampling completion bypasses the serialized MCP queue without editing the document', async (context) => {
  const host = await fixture(context);
  const catalog = await (
    await fetch(
      `${host.baseUrl}/mcp`,
      write({
        jsonrpc: '2.0',
        id: 'list',
        method: 'tools/list',
      }),
    )
  ).json();
  const schema = catalog.result.tools.find((tool) => tool.name === 'sample_color')?.inputSchema;
  assert.ok(schema, 'actual rendered sampling must be discoverable');
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.oneOf.length, 2);
  const search = await (
    await fetch(
      `${host.baseUrl}/mcp`,
      write({
        jsonrpc: '2.0',
        id: 'search',
        method: 'tools/call',
        params: { name: 'tool_search', arguments: { query: 'sample_color' } },
      }),
    )
  ).json();
  assert.equal(search.result.isError, false);
  assert.deepEqual(search.result.structuredContent.tools[0].inputSchema, schema);
  const resultPromise = fetch(
    `${host.baseUrl}/mcp`,
    write({
      jsonrpc: '2.0',
      id: 'sample',
      method: 'tools/call',
      params: { name: 'sample_color', arguments: { x: 10, y: 20 } },
    }),
  ).then((response) => response.json());
  const completion = (async () => {
    let pending;
    for (let attempt = 0; attempt < 100 && !pending; attempt++) {
      const response = await fetch(`${host.baseUrl}/api/mcp/color-samples`);
      assert.equal(response.status, 200);
      pending = (await response.json()).requests[0];
    }
    assert.ok(pending, 'MCP sampling must publish a renderer request');
    assert.deepEqual(pending.args, { x: 10, y: 20 });
    const completed = await fetch(
      `${host.baseUrl}/api/mcp/color-samples`,
      write({
        id: pending.id,
        version: pending.version,
        x: 10,
        y: 20,
        rgba: [239, 68, 68, 255],
      }),
    );
    assert.equal(completed.status, 200);
  })();
  const [reply] = await Promise.all([resultPromise, completion]);
  const result = reply.result;
  assert.equal(result.isError, false);
  assert.equal(result.structuredContent.hex, '#ef4444');
  assert.equal(result.structuredContent.source, 'canvaskit');
  assert.equal((await (await fetch(`${host.baseUrl}/api/mcp/version`)).json()).version, 0);
  assert.deepEqual(
    (await (await fetch(`${host.baseUrl}/api/mcp/color-samples`)).json()).requests,
    [],
  );
});

test('screenshot completion returns renderer PNG image content without editing the document', async (context) => {
  const host = await fixture(context);
  const rpc = async (id, method, params) =>
    (
      await (
        await fetch(
          `${host.baseUrl}/mcp`,
          write({
            jsonrpc: '2.0',
            id,
            method,
            params,
          }),
        )
      ).json()
    ).result;
  const schema = (await rpc('list', 'tools/list')).tools.find(
    (tool) => tool.name === 'get_screenshot',
  )?.inputSchema;
  assert.ok(schema, 'rendered screenshots must be discoverable');
  assert.equal(schema.additionalProperties, false);
  const search = await rpc('search', 'tools/call', {
    name: 'tool_search',
    arguments: { query: 'screenshot' },
  });
  assert.equal(search.structuredContent.tools[0].name, 'get_screenshot');
  const resultPromise = rpc('shot', 'tools/call', {
    name: 'openpencil_get_screenshot',
    arguments: { scale: 0.5 },
  });
  let pending;
  for (let attempt = 0; attempt < 100 && !pending; attempt++) {
    pending = (await (await fetch(`${host.baseUrl}/api/mcp/screenshots`)).json()).requests[0];
  }
  assert.ok(pending, 'MCP screenshots must publish a renderer request');
  assert.deepEqual(pending.args, { scale: 0.5, maxSize: 1600, background: 'canvas' });
  const png = solidPng(3, 2).toString('base64');
  const completed = await fetch(
    `${host.baseUrl}/api/mcp/screenshots`,
    write({
      id: pending.id,
      version: pending.version,
      width: 3,
      height: 2,
      scale: 0.5,
      png,
    }),
  );
  assert.equal(completed.status, 200);
  const result = await resultPromise;
  assert.equal(result.isError, false);
  assert.deepEqual(result.content[0], { type: 'image', mimeType: 'image/png', data: png });
  assert.equal(result.structuredContent.width, 3);
  assert.equal((await (await fetch(`${host.baseUrl}/api/mcp/version`)).json()).version, 0);
  assert.deepEqual(
    (await (await fetch(`${host.baseUrl}/api/mcp/screenshots`)).json()).requests,
    [],
  );
});

test('MCP discovers only implemented passive tools and executes Position over HTTP', async (context) => {
  const host = await fixture(context, {
    document: {
      version: '0.8.5',
      children: [
        { type: 'rectangle', id: 'first', x: 0, y: 0, width: 20, height: 20 },
        { type: 'rectangle', id: 'second', x: 100, y: 100, width: 40, height: 40 },
      ],
    },
  });
  const rpc = async (method, params) =>
    (
      await (
        await fetch(
          `${host.baseUrl}/mcp`,
          write({
            jsonrpc: '2.0',
            id: method,
            method,
            params,
          }),
        )
      ).json()
    ).result;
  const catalog = await rpc('tools/list');
  const names = catalog.tools.map((tool) => tool.name);
  assert.equal(new Set(names).size, names.length);
  for (const name of [
    'batch_design',
    'set_selection_set',
    'align_selected',
    'undo',
    'redo',
    'update_node',
    'replace_node',
    'add_node_effect',
    'set_variables',
    'create_component',
    'add_page',
  ]) {
    assert.ok(names.includes(name), `${name} must be discoverable`);
  }
  for (const name of ['run_design_agent', 'spawn_agents', 'export_item']) {
    assert.ok(!names.includes(name), `${name} must not be advertised without an implementation`);
  }
  assert.ok(catalog.tools.every((tool) => tool.inputSchema.type === 'object'));
  const call = (name, args = {}) => rpc('tools/call', { name, arguments: args });
  assert.equal((await call('set_selection_set', { node_ids: 'first,second' })).isError, false);
  assert.deepEqual(await (await fetch(`${host.baseUrl}/api/mcp/version`)).json(), {
    version: 0,
    assetsRevision: 0,
    viewport: null,
    uiScale: null,
  });
  assert.deepEqual(await (await fetch(`${host.baseUrl}/api/mcp/selection`)).json(), {
    selectedIds: ['first', 'second'],
    activePageId: '0',
  });
  const pushSelection = await fetch(
    `${host.baseUrl}/api/mcp/selection`,
    write({
      selectedIds: ['second'],
      activePageId: '0',
    }),
  );
  assert.equal(pushSelection.status, 200);
  assert.deepEqual(await pushSelection.json(), { ok: true });
  assert.deepEqual((await call('get_selection', { readDepth: 0 })).structuredContent.selectedIds, [
    'second',
  ]);
  assert.equal((await call('set_selection_set', { node_ids: 'first,second' })).isError, false);
  assert.equal((await call('align_selected', { action: 'center_v' })).isError, false);
  let snapshot = await (await fetch(`${host.baseUrl}/api/mcp/document`)).json();
  assert.deepEqual(
    snapshot.document.children.map((node) => node.y),
    [60, 50],
  );
  assert.equal(snapshot.version, 1);
  assert.equal((await call('undo')).isError, false);
  snapshot = await (await fetch(`${host.baseUrl}/api/mcp/document`)).json();
  assert.deepEqual(
    snapshot.document.children.map((node) => node.y),
    [0, 100],
  );
  assert.equal(snapshot.version, 2);
});

test('Node HTTP host drives real WASM and exposes authoritative versioned documents', async (context) => {
  const host = await fixture(context);
  const response = await fetch(
    `${host.baseUrl}/mcp`,
    write({
      jsonrpc: '2.0',
      id: 'design',
      method: 'tools/call',
      params: {
        name: 'batch_design',
        arguments: { operations: 'frame=I(null, {"type":"frame","name":"HTTP WASM design"})' },
      },
    }),
  );
  assert.equal(response.status, 200);
  const reply = await response.json();
  assert.equal(reply.id, 'design');
  assert.equal(reply.result.isError, false);
  assert.deepEqual(await (await fetch(`${host.baseUrl}/api/mcp/version`)).json(), {
    version: 1,
    assetsRevision: 0,
    viewport: null,
    uiScale: null,
  });
  const snapshot = await (await fetch(`${host.baseUrl}/api/mcp/document`)).json();
  assert.equal(snapshot.document.children[0].name, 'HTTP WASM design');
  assert.equal(snapshot.version, 1);
});

test('Node host refuses foreign origins, rebinding hosts and simple content types', async (context) => {
  const host = await fixture(context);
  const route = `${host.baseUrl}/api/mcp/document`;
  assert.equal((await fetch(route, { headers: { origin: 'https://evil.example' } })).status, 403);
  const reboundStatus = await new Promise((resolve, reject) => {
    const connection = request(route, { headers: { host: 'evil.example' } }, (response) => {
      response.resume();
      response.once('end', () => resolve(response.statusCode));
      response.once('error', reject);
    });
    connection.once('error', reject);
    connection.end();
  });
  assert.equal(reboundStatus, 403);
  assert.equal(
    (await fetch(route, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{}' }))
      .status,
    415,
  );
  const trusted = await fetch(route, { headers: { origin: 'dsh-app://app' } });
  assert.equal(trusted.status, 200);
  assert.equal(trusted.headers.get('access-control-allow-origin'), 'dsh-app://app');
  assert.equal((await (await fetch(`${host.baseUrl}/api/mcp/version`)).json()).version, 0);
});

test('concurrent browser writes at one baseline cannot overwrite each other', async (context) => {
  const host = await fixture(context);
  const writes = ['first', 'second'].map((name) =>
    fetch(
      `${host.baseUrl}/api/mcp/document`,
      write({
        document: { version: '0.8.5', children: [], name },
        baseVersion: 0,
        activePageIndex: 0,
        preserveAuthoredGeometry: true,
      }),
    ),
  );
  const responses = await Promise.all(writes);
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409]);
  const conflict = responses.find((response) => response.status === 409);
  assert.deepEqual(await conflict.json(), { ok: false, error: 'version-conflict', version: 1 });
  const snapshot = await (await fetch(`${host.baseUrl}/api/mcp/document`)).json();
  assert.equal(snapshot.version, 1);
  assert.equal(snapshot.preserveAuthoredGeometry, true);
});

test('metadata-only browser pushes keep design content and its revision', async (context) => {
  const host = await fixture(context);
  await fetch(
    `${host.baseUrl}/mcp`,
    write({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'batch_design',
        arguments: { operations: 'frame=I(null, {"type":"frame","name":"keep AI design"})' },
      },
    }),
  );
  const response = await fetch(
    `${host.baseUrl}/api/mcp/document`,
    write({
      document: { version: '0.8.5', children: [] },
      baseVersion: 1,
      metadataOnly: true,
      activePageIndex: 0,
      preserveAuthoredGeometry: true,
    }),
  );
  assert.deepEqual(await response.json(), { ok: true, version: 1 });
  const snapshot = await (await fetch(`${host.baseUrl}/api/mcp/document`)).json();
  assert.equal(snapshot.document.children[0].name, 'keep AI design');
  assert.equal(snapshot.preserveAuthoredGeometry, true);
});

test('invalid JSON and account routes do not change the design', async (context) => {
  const host = await fixture(context);
  const malformed = await fetch(`${host.baseUrl}/mcp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  });
  assert.equal(malformed.status, 400);
  assert.equal((await fetch(`${host.baseUrl}/api/auth/login`)).status, 404);
  assert.equal((await (await fetch(`${host.baseUrl}/api/mcp/version`)).json()).version, 0);
});

test('document responses expose the scenario used by the browser preview', async (context) => {
  const host = await fixture(context);
  const response = await fetch(
    `${host.baseUrl}/api/mcp/document`,
    write({
      document: { version: '0.8.5', children: [], editorMeta: { scenario: 'slides' } },
      baseVersion: 0,
    }),
  );
  assert.equal(response.status, 200);
  const snapshot = await (await fetch(`${host.baseUrl}/api/mcp/document`)).json();
  assert.equal(snapshot.scenario, 'slides');
});

test('save writes only the bound file and rejects a stale content baseline', async (context) => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-node-save-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const sourcePath = join(root, 'design.op');
  const foreignPath = join(root, 'foreign.op');
  const initial = { version: '0.8.5', children: [] };
  await writeFile(sourcePath, JSON.stringify(initial));
  await writeFile(foreignPath, 'untouched');
  const host = await fixture(context, { sourcePath });
  assert.equal((await (await fetch(`${host.baseUrl}/api/mcp/server`)).json()).draftRecovery, true);
  const document = {
    ...initial,
    children: [{ type: 'frame', id: 'f1', name: 'saved design', children: [] }],
  };
  const response = await fetch(
    `${host.baseUrl}/api/file/save`,
    write({
      document,
      baseVersion: 0,
      path: foreignPath,
      activePageIndex: 0,
    }),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, version: 1, fileName: 'design.op' });
  assert.equal(JSON.parse(await readFile(sourcePath, 'utf8')).children[0].name, 'saved design');
  assert.equal(await readFile(foreignPath, 'utf8'), 'untouched');
  const rejected = await fetch(
    `${host.baseUrl}/api/file/save`,
    write({ document: initial, baseVersion: 0 }),
  );
  assert.equal(rejected.status, 409);
  assert.equal(JSON.parse(await readFile(sourcePath, 'utf8')).children[0].name, 'saved design');
});

test('a failed save retains the current in-memory document', async (context) => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-node-save-failure-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const host = await fixture(context, { sourcePath: join(root, 'missing', 'design.op') });
  const response = await fetch(
    `${host.baseUrl}/api/file/save`,
    write({
      document: {
        version: '0.8.5',
        children: [{ type: 'frame', id: 'f1', name: 'must not commit', children: [] }],
      },
      baseVersion: 0,
    }),
  );
  assert.equal(response.status, 500);
  const snapshot = await (await fetch(`${host.baseUrl}/api/mcp/document`)).json();
  assert.equal(snapshot.version, 0);
  assert.deepEqual(snapshot.document.children, []);
});

test('save refuses an externally edited file without changing the memory baseline', async (context) => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-node-save-conflict-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const sourcePath = join(root, 'design.op');
  await writeFile(sourcePath, JSON.stringify({ version: '0.8.5', children: [] }));
  const host = await fixture(context, { sourcePath });
  const external = JSON.stringify({ version: '0.8.5', children: [], name: 'external edit' });
  await writeFile(sourcePath, external);
  const response = await fetch(
    `${host.baseUrl}/api/file/save`,
    write({
      document: { version: '0.8.5', children: [] },
      baseVersion: 0,
    }),
  );
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error, 'file-conflict');
  assert.equal(await readFile(sourcePath, 'utf8'), external);
  assert.equal((await (await fetch(`${host.baseUrl}/api/mcp/version`)).json()).version, 0);
});

for (const shutdownMethod of ['stdin', 'rpc']) {
  test(`managed CLI loads the selected file, emits a handshake and exits on ${shutdownMethod}`, async (context) => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-node-cli-'));
    context.after(() => rm(root, { recursive: true, force: true }));
    const sourcePath = join(root, 'design.op');
    await writeFile(
      sourcePath,
      JSON.stringify({ version: '0.8.5', children: [], name: 'opened document' }),
    );
    const child = spawn(
      process.execPath,
      [
        fileURLToPath(new URL('./cli.mjs', import.meta.url)),
        '--serve-web',
        '--managed',
        '--port',
        '0',
        '--file',
        sourcePath,
        '--allow-origin',
        'dsh-app://app',
        '--draft-dir',
        join(root, 'drafts'),
      ],
      { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, DSH_ASSET_DIR: join(root, 'assets') } },
    );
    const exited = once(child, 'exit');
    const lines = createInterface({ input: child.stdout });
    let diagnostics = '';
    child.stderr.setEncoding('utf8').on('data', (message) => {
      diagnostics += message;
    });
    context.after(async () => {
      lines.close();
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
      await exited;
    });
    const first = await Promise.race([
      once(lines, 'line', { signal: AbortSignal.timeout(5000) }),
      exited.then(() => {
        throw new Error(`CLI exited without a handshake: ${diagnostics}`);
      }),
    ]);
    const handshake = JSON.parse(first[0]);
    assert.equal(handshake.ok, true);
    assert.ok(handshake.port > 0);
    assert.ok(handshake.token.length >= 16);
    assert.equal(handshake.version, 0);
    const baseUrl = `http://127.0.0.1:${handshake.port}`;
    const snapshot = await (
      await fetch(`${baseUrl}/api/mcp/document`, { headers: { origin: 'dsh-app://app' } })
    ).json();
    assert.equal(snapshot.document.name, 'opened document');
    const checkpoint = await (
      await fetch(
        `${baseUrl}/mcp`,
        write({
          jsonrpc: '2.0',
          id: 'checkpoint',
          method: 'tools/call',
          params: { name: 'create_draft', arguments: { label: 'CLI recovery' } },
        }),
      )
    ).json();
    assert.equal(checkpoint.result.isError, false, JSON.stringify(checkpoint));
    const refused = await fetch(
      `${baseUrl}/mcp`,
      write({
        jsonrpc: '2.0',
        id: 1,
        method: 'openpencil/shutdown',
        params: { token: 'wrong-token' },
      }),
    );
    assert.equal((await refused.json()).error.code, -32601);
    if (shutdownMethod === 'stdin') child.stdin.end();
    else {
      const response = await fetch(
        `${baseUrl}/mcp`,
        write({
          jsonrpc: '2.0',
          id: 2,
          method: 'openpencil/shutdown',
          params: { token: handshake.token },
        }),
      );
      assert.deepEqual(await response.json(), {
        jsonrpc: '2.0',
        id: 2,
        result: { ok: true, shuttingDown: true },
      });
    }
    const [exitCode] = await Promise.race([
      exited,
      once(child, 'error', { signal: AbortSignal.timeout(5000) }),
    ]);
    assert.equal(exitCode, 0, diagnostics);
    await assert.rejects(fetch(`${baseUrl}/api/mcp/version`));
  });
}

test('static serving supports editor probes and WASM MIME without exposing outside paths', async (context) => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-node-static-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const webRoot = join(root, 'web-bundle');
  const canvaskitRoot = join(webRoot, 'canvaskit');
  await mkdir(canvaskitRoot, { recursive: true });
  await mkdir(join(webRoot, 'assets'));
  await writeFile(join(webRoot, 'assets', 'iconify-catalog-brands.json'), '{"icons":[]}');
  await writeFile(join(webRoot, 'index.html'), '<html><body>editor fixture</body></html>');
  await writeFile(join(webRoot, 'op_host_web.js'), 'export const testFixture = true');
  await writeFile(join(webRoot, 'op_host_web_bg.wasm'), Buffer.from([0, 97, 115, 109, 1, 0, 0, 0]));
  await writeFile(join(canvaskitRoot, 'canvaskit.js'), 'canvas fixture');
  await writeFile(join(root, 'secret.txt'), 'not public');
  await symlink(join(root, 'secret.txt'), join(webRoot, 'leak.txt'));
  const host = await fixture(context, { webRoot, canvaskitRoot });
  assert.equal((await fetch(`${host.baseUrl}/?embed=vscode`)).status, 200);
  assert.equal(
    (await fetch(`${host.baseUrl}/pkg/op_host_web.js`)).headers.get('content-type'),
    'text/javascript; charset=utf-8',
  );
  const wasm = await fetch(`${host.baseUrl}/pkg/op_host_web_bg.wasm`);
  assert.equal(wasm.headers.get('content-type'), 'application/wasm');
  assert.equal(WebAssembly.validate(await wasm.arrayBuffer()), true);
  assert.equal(
    await (await fetch(`${host.baseUrl}/canvaskit/canvaskit.js`)).text(),
    'canvas fixture',
  );
  assert.equal((await fetch(`${host.baseUrl}/assets/iconify-catalog-brands.json`)).status, 200);
  for (const path of [
    '/pkg/..%2fsecret.txt',
    '/pkg/%2e%2e%2fsecret.txt',
    '/pkg/leak.txt',
    '/pkg/%00.js',
  ]) {
    const response = await fetch(`${host.baseUrl}${path}`);
    assert.ok(response.status >= 400, path);
    assert.ok(!(await response.text()).includes('not public'), path);
  }
});

test('browser bootstrap preserves the bound document and refuses credential persistence', async (context) => {
  const document = { version: '0.8.5', children: [], name: 'bound document' };
  const host = await fixture(context, { document });
  const health = await (await fetch(`${host.baseUrl}/api/mcp/server`)).json();
  assert.equal(health.running, true);
  assert.equal(health.draftRecovery, false);
  assert.equal(health.serveMode, 'managed');
  assert.equal(health.port, Number(new URL(host.baseUrl).port));
  const reset = await fetch(`${host.baseUrl}/api/mcp/sync-reset`, write({}));
  assert.equal(reset.status, 200);
  assert.deepEqual(await reset.json(), { ok: true, skipped: true, version: 0 });
  assert.deepEqual(
    (await (await fetch(`${host.baseUrl}/api/mcp/document`)).json()).document,
    document,
  );
  assert.deepEqual(await (await fetch(`${host.baseUrl}/api/settings/credential-policy`)).json(), {
    serverPersistence: false,
  });
  assert.deepEqual(await (await fetch(`${host.baseUrl}/api/ai/models`)).json(), []);
  assert.equal(
    (await fetch(`${host.baseUrl}/api/settings/credentials`, write({ apiKey: 'test-value' })))
      .status,
    404,
  );
});
test('a pending screenshot never blocks the renderer bootstrap or document writes', async (context) => {
  const host = await fixture(context);
  const pendingShot = fetch(
    `${host.baseUrl}/mcp`,
    write({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'get_screenshot', arguments: {} },
    }),
  );
  // Let the screenshot reach the renderer queue before the renderer boots.
  for (let i = 0; i < 50; i++) {
    const { requests } = await (
      await fetch(`${host.baseUrl}/api/mcp/screenshots?client=headless`)
    ).json();
    if (requests.length) break;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  const started = performance.now();
  const reset = await fetch(`${host.baseUrl}/api/mcp/sync-reset`, write({}));
  assert.equal(reset.status, 200);
  const info = await (
    await fetch(
      `${host.baseUrl}/mcp`,
      write({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: { name: 'add_page', arguments: { name: 'Second' } },
      }),
    )
  ).json();
  assert.equal(info.result.isError, false);
  assert.ok(performance.now() - started < 2000, 'writes are not serialized behind the capture');
  await host.close();
  // Closing either answers the capture with an error or drops its socket.
  const outcome = await pendingShot.then((response) => response.json()).catch(() => null);
  assert.ok(outcome === null || outcome.result.isError === true);
});

test('incremental pulls return only the pages changed since a version', async (context) => {
  const document = {
    version: '0.8.5',
    children: [],
    pages: [
      {
        id: 'p1',
        name: 'One',
        children: [{ type: 'rectangle', id: 'a', x: 0, y: 0, width: 10, height: 10 }],
      },
      {
        id: 'p2',
        name: 'Two',
        children: [{ type: 'rectangle', id: 'b', x: 0, y: 0, width: 10, height: 10 }],
      },
    ],
  };
  const host = await fixture(context, { document });
  const call = async (name, args) =>
    (
      await (
        await fetch(
          `${host.baseUrl}/mcp`,
          write({
            jsonrpc: '2.0',
            id: name,
            method: 'tools/call',
            params: { name, arguments: args },
          }),
        )
      ).json()
    ).result;
  const changes = async (since) =>
    (await fetch(`${host.baseUrl}/api/mcp/document/changes?since=${since}`)).json();
  const start = (await (await fetch(`${host.baseUrl}/api/mcp/version`)).json()).version;
  assert.equal(
    (await call('update_node', { nodeId: 'b', data: { width: 40 }, pageId: 'p2' })).isError,
    false,
  );
  const patch = await changes(start);
  assert.equal(patch.full, false);
  assert.deepEqual(patch.pageIds, ['p1', 'p2']);
  assert.deepEqual(
    patch.pages.map((page) => page.id),
    ['p2'],
  );
  assert.equal(patch.pages[0].children[0].width, 40);
  assert.equal(patch.version, start + 1);
  assert.deepEqual(
    (await changes(patch.version)).pages,
    [],
    'nothing changed since the latest version',
  );
  assert.equal((await call('add_page', { name: 'Three' })).isError, false);
  assert.equal((await changes(start)).full, true, 'a page-list change needs a full pull');
  assert.equal((await changes(-1)).full, true);
  assert.equal((await changes('x')).full, true);
});
