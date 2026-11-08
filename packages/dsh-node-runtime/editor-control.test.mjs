import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';
import { startNodeHost } from './node-host.mjs';
import { EditorControl } from './editor-control.mjs';

test('a reloaded editor supersedes the earlier heartbeat for theme control', async () => {
  const control = new EditorControl();
  control.pending('old-editor');
  await delay(2);
  control.pending('reloaded-editor');
  const pending = control.request('get_editor_theme', {});
  try {
    assert.equal(control.pending('reloaded-editor').length, 1);
  } finally {
    control.close();
    await assert.rejects(pending, (error) => error.code === 'editor-unavailable');
  }
});

test('control timeouts clear pending requests without applied success', async () => {
  const control = new EditorControl({ timeoutMs: 10 });
  control.pending('editor');
  await assert.rejects(
    control.request('get_editor_theme', {}),
    (error) => error.code === 'editor-timeout',
  );
  assert.deepEqual(control.pending('editor'), []);
  control.close();
});

test('persistent acknowledgement must confirm both effective theme and saved preference', async () => {
  const control = new EditorControl();
  control.pending('editor');
  const pending = control.request('set_editor_theme', { theme: 'dark', persist: true });
  const [request] = control.pending('editor');
  const ack = {
    client: 'editor',
    id: request.id,
    value: { effective: 'dark', preference: 'light', hostOverride: null, connected: true },
  };
  try {
    assert.throws(
      () => control.complete({ ...ack, client: 'another-editor' }),
      (error) => error.code === 'editor-invalid',
    );
    assert.throws(
      () => control.complete(ack),
      (error) => error.code === 'editor-invalid',
    );
  } finally {
    if (control.pending('editor').length) {
      control.complete({ ...ack, value: { ...ack.value, preference: 'dark' } });
    }
    await pending;
    control.close();
  }
});

async function fixture(t) {
  const host = await startNodeHost({ document: { version: '0.8.5', children: [] } });
  t.after(() => host.close());
  const route = `${host.baseUrl}/api/mcp/editor-control?client=test-editor`;
  const call = async (name, args = {}) =>
    (
      await (
        await fetch(`${host.baseUrl}/mcp`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: { name, arguments: args },
          }),
        })
      ).json()
    ).result;
  const ack = (body) =>
    fetch(route, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  return { host, route, call, ack };
}

test('theme tools fail explicitly when no editor has connected', async (t) => {
  const { call } = await fixture(t);
  const result = await call('get_editor_theme');
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /editor/i);
});

test('theme waits release the document queue and report only acknowledged state', async (t) => {
  const { host, route, call, ack } = await fixture(t);
  assert.equal((await fetch(route)).status, 200);
  let settled = false;
  const pending = call('set_editor_theme', { theme: 'dark' }).then((result) => {
    settled = true;
    return result;
  });
  let request;
  for (let i = 0; i < 20 && !request; i++) {
    await delay(10);
    request = (await (await fetch(route)).json()).requests[0];
  }
  assert.ok(request);
  assert.equal(settled, false);
  const read = await fetch(`${host.baseUrl}/api/mcp/document`, {
    signal: AbortSignal.timeout(500),
  });
  assert.equal(read.status, 200);
  const value = { effective: 'dark', preference: 'light', hostOverride: null, connected: true };
  assert.equal((await ack({ client: 'test-editor', id: request.id, value })).status, 200);
  const result = await pending;
  assert.deepEqual(result.structuredContent, value);
  assert.equal((await read.json()).version, 0);
});

test('an editor host override refusal is returned as an error, not applied success', async (t) => {
  const { route, call, ack } = await fixture(t);
  await fetch(route);
  const pending = call('set_editor_theme', { theme: 'dark', persist: true });
  let request;
  for (let i = 0; i < 20 && !request; i++) {
    await delay(10);
    request = (await (await fetch(route)).json()).requests[0];
  }
  assert.ok(request);
  await ack({
    client: 'test-editor',
    id: request.id,
    error: 'Embedding host locks the effective theme',
  });
  assert.equal((await pending).isError, true);
});

test('shared asset API theme waits do not block document mutations', async (t) => {
  const { host, route, ack } = await fixture(t);
  await fetch(route);
  const pending = fetch(`${host.baseUrl}/api/assets/tools`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'set_editor_theme', arguments: { theme: 'dark' } }),
  });
  let request;
  for (let i = 0; i < 20 && !request; i++) {
    await delay(10);
    request = (await (await fetch(route)).json()).requests[0];
  }
  assert.ok(request);
  try {
    const response = await fetch(`${host.baseUrl}/api/mcp/sync-reset`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(300),
    });
    assert.equal(response.status, 200);
  } finally {
    await ack({
      client: 'test-editor',
      id: request.id,
      value: { effective: 'dark', preference: 'light', hostOverride: null, connected: true },
    });
    await pending;
  }
});
