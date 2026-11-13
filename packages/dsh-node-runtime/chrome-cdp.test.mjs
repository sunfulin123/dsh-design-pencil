import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { launchHeadlessPage } from './chrome-cdp.mjs';

const CHROME_CDP_URL = new URL('./chrome-cdp.mjs', import.meta.url).href;

async function writeExecutable(dir, name, source) {
  const file = join(dir, name);
  await writeFile(file, `#!/usr/bin/env node\n${source}`, 'utf8');
  await chmod(file, 0o755);
  return file;
}

function processAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

const FAKE_CDP_SERVER_SNIPPET = `
import { createHash } from 'node:crypto';
import http from 'node:http';

export function startFakeCdpServer({ onMessage } = {}) {
  return new Promise((resolve) => {
    const sockets = new Set();
    const server = http.createServer((req, res) => {
      if (req.url === '/json/list') {
        const { port } = server.address();
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify([{
          type: 'page',
          webSocketDebuggerUrl: 'ws://127.0.0.1:' + port + '/devtools/page/1',
        }]));
        return;
      }
      res.statusCode = 404;
      res.end();
    });
    server.on('upgrade', (req, socket) => {
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
      const key = req.headers['sec-websocket-key'];
      const accept = createHash('sha1')
        .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
        .digest('base64');
      socket.write(
        'HTTP/1.1 101 Switching Protocols\\r\\n' +
        'Upgrade: websocket\\r\\n' +
        'Connection: Upgrade\\r\\n' +
        'Sec-WebSocket-Accept: ' + accept + '\\r\\n\\r\\n',
      );
      let buf = Buffer.alloc(0);
      socket.on('data', (chunk) => {
        buf = Buffer.concat([buf, chunk]);
        while (buf.length >= 2) {
          let offset = 2;
          let len = buf[1] & 0x7f;
          if (len === 126) {
            if (buf.length < 4) return;
            len = buf.readUInt16BE(2);
            offset = 4;
          }
          const masked = (buf[1] & 0x80) !== 0;
          const total = offset + (masked ? 4 : 0) + len;
          if (buf.length < total) return;
          const payload = Buffer.from(buf.subarray(offset + (masked ? 4 : 0), total));
          if (masked) {
            const mask = buf.subarray(offset, offset + 4);
            for (let i = 0; i < payload.length; i += 1) payload[i] ^= mask[i & 3];
          }
          buf = buf.subarray(total);
          if ((buf[0] & 0x0f) === 0x8) return;
          const msg = JSON.parse(payload.toString('utf8'));
          const reply = onMessage ? onMessage(msg) : { id: msg.id, result: {} };
          if (!reply) continue;
          const out = Buffer.from(JSON.stringify(reply), 'utf8');
          const head = out.length < 126
            ? Buffer.from([0x81, out.length])
            : Buffer.from([0x81, 126, (out.length >> 8) & 0xff, out.length & 0xff]);
          socket.write(Buffer.concat([head, out]));
        }
      });
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port, close: () => { for (const s of sockets) s.destroy(); server.close(); } });
    });
  });
}
`;

test('launchHeadlessPage scales startup timeout with timeoutMs, surfaces stderr tail, and cleans profile dir', async (context) => {
  const root = await mkdtemp(join(tmpdir(), 'chrome-cdp-timeout-'));
  context.after(() => rm(root, { recursive: true, force: true }));

  const marker = join(root, 'hang-meta.json');
  const hangingChrome = join(root, 'hang-chrome.sh');
  await writeFile(
    hangingChrome,
    `#!/bin/sh
[ "$1" = "--warmup" ] && exit 0
dir=""
for a in "$@"; do
  case "$a" in
    --user-data-dir=*) dir="\${a#--user-data-dir=}" ;;
  esac
done
printf '{"pid":%s,"userDataDir":"%s"}' "$$" "$dir" > ${JSON.stringify(marker)}
echo "[gpu_init] Metal shader cache busy" >&2
exec sleep 30
`,
    'utf8',
  );
  await chmod(hangingChrome, 0o755);
  // Pre-warm macOS syspolicyd vnode scan on the newly chmodded script before timing startup timeout.
  spawnSync(hangingChrome, ['--warmup']);

  const prevEnv = process.env.OPENPENCIL_CHROME_PATH;
  process.env.OPENPENCIL_CHROME_PATH = hangingChrome;
  context.after(() => {
    if (prevEnv === undefined) delete process.env.OPENPENCIL_CHROME_PATH;
    else process.env.OPENPENCIL_CHROME_PATH = prevEnv;
  });
  const startedAt = Date.now();
  await assert.rejects(
    launchHeadlessPage({ chromeBinary: hangingChrome, timeoutMs: 400, retries: 0 }),
    (error) => {
      assert.match(error.message, /Timed out waiting for DevTools listening endpoint/);
      assert.match(error.message, /Metal shader cache busy/);
      return true;
    },
  );
  const elapsedMs = Date.now() - startedAt;
  assert.ok(elapsedMs < 2000, `expected bounded startup wait < 2000ms, got ${elapsedMs}ms`);

  const meta = JSON.parse(await readFile(marker, 'utf8'));
  context.after(async () => {
    if (meta.pid && processAlive(meta.pid)) process.kill(meta.pid, 'SIGKILL');
    if (meta.userDataDir) await rm(meta.userDataDir, { recursive: true, force: true });
  });
  assert.equal(processAlive(meta.pid), false, 'hung Chrome child must be terminated');
  assert.equal(existsSync(meta.userDataDir), false, 'failed launch profile dir must be removed');
});

test('launchHeadlessPage retries startup once with a fresh profile directory when attempt 1 fails', async (context) => {
  const root = await mkdtemp(join(tmpdir(), 'chrome-cdp-retry-'));
  context.after(() => rm(root, { recursive: true, force: true }));

  await writeFile(join(root, 'fake-cdp.mjs'), FAKE_CDP_SERVER_SNIPPET, 'utf8');
  const attemptsFile = join(root, 'attempts.json');
  await writeFile(attemptsFile, '[]', 'utf8');

  const flakyChrome = await writeExecutable(
    root,
    'flaky-chrome.mjs',
    `import { readFileSync, writeFileSync } from 'node:fs';
import { startFakeCdpServer } from './fake-cdp.mjs';
const dir = process.argv.find((a) => a.startsWith('--user-data-dir=')).slice('--user-data-dir='.length);
const attempts = JSON.parse(readFileSync(${JSON.stringify(attemptsFile)}, 'utf8'));
attempts.push({ pid: process.pid, dir });
writeFileSync(${JSON.stringify(attemptsFile)}, JSON.stringify(attempts));
if (attempts.length === 1) {
  process.stderr.write('SingletonLock: profile in use\\n');
  process.exit(21);
}
const cdp = await startFakeCdpServer({
  onMessage: (msg) => ({
    id: msg.id,
    result: msg.method === 'Runtime.evaluate' ? { result: { value: 42 } } : {},
  }),
});
process.stderr.write('DevTools listening on ws://127.0.0.1:' + cdp.port + '/devtools/browser/ok\\n');
process.on('SIGTERM', () => { cdp.close(); process.exit(0); });
`,
  );

  const prevEnv = process.env.OPENPENCIL_CHROME_PATH;
  process.env.OPENPENCIL_CHROME_PATH = flakyChrome;
  context.after(() => {
    if (prevEnv === undefined) delete process.env.OPENPENCIL_CHROME_PATH;
    else process.env.OPENPENCIL_CHROME_PATH = prevEnv;
  });
  const page = await launchHeadlessPage({ chromeBinary: flakyChrome, timeoutMs: 5000 });
  assert.ok(page, 'expected launchHeadlessPage to succeed on second attempt');
  const attempts = JSON.parse(await readFile(attemptsFile, 'utf8'));
  assert.equal(attempts.length, 2);
  assert.notEqual(attempts[0].dir, attempts[1].dir, 'retry must allocate a fresh profile directory');
  assert.equal(existsSync(attempts[0].dir), false, 'first failed profile dir must already be cleaned up');
  assert.equal(await page.evaluate('6 * 7'), 42);
  await page.close();
  assert.equal(existsSync(attempts[1].dir), false, 'active profile dir must be removed on close');
});

test('SIGTERM on a process holding an open headless page kills Chrome and deletes its temp profile', async (context) => {
  const root = await mkdtemp(join(tmpdir(), 'chrome-cdp-sigterm-'));
  context.after(() => rm(root, { recursive: true, force: true }));

  await writeFile(join(root, 'fake-cdp.mjs'), FAKE_CDP_SERVER_SNIPPET, 'utf8');
  const metaFile = join(root, 'child-meta.json');
  const fakeChrome = await writeExecutable(
    root,
    'fake-chrome.mjs',
    `import { writeFileSync } from 'node:fs';
import { startFakeCdpServer } from './fake-cdp.mjs';
const dir = process.argv.find((a) => a.startsWith('--user-data-dir=')).slice('--user-data-dir='.length);
const cdp = await startFakeCdpServer();
writeFileSync(${JSON.stringify(metaFile)}, JSON.stringify({ pid: process.pid, dir }));
process.stderr.write('DevTools listening on ws://127.0.0.1:' + cdp.port + '/devtools/browser/sig\\n');
setInterval(() => {}, 1000);
`,
  );

  const holderScript = join(root, 'holder.mjs');
  await writeFile(
    holderScript,
    `import { launchHeadlessPage } from ${JSON.stringify(CHROME_CDP_URL)};
const page = await launchHeadlessPage({ chromeBinary: ${JSON.stringify(fakeChrome)}, timeoutMs: 5000 });
await page.send('Page.enable');
process.stdout.write('READY\\n');
setInterval(() => {}, 1000);
`,
    'utf8',
  );

  const holder = spawn(process.execPath, [holderScript], {
    env: { ...process.env, OPENPENCIL_CHROME_PATH: fakeChrome },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('holder did not reach READY')), 8000);
    let out = '';
    holder.stdout.setEncoding('utf8').on('data', (chunk) => {
      out += chunk;
      if (out.includes('READY')) {
        clearTimeout(timer);
        resolve();
      }
    });
    holder.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`holder exited early (${code})`));
    });
  });

  const meta = JSON.parse(await readFile(metaFile, 'utf8'));
  context.after(async () => {
    if (meta.pid && processAlive(meta.pid)) process.kill(meta.pid, 'SIGKILL');
    if (meta.dir) await rm(meta.dir, { recursive: true, force: true });
  });
  assert.equal(existsSync(meta.dir), true);
  assert.equal(processAlive(meta.pid), true);

  holder.kill('SIGTERM');
  await new Promise((resolve) => holder.once('exit', resolve));
  await new Promise((resolve) => setTimeout(resolve, 150));

  assert.equal(processAlive(meta.pid), false, `Chrome child ${meta.pid} should be dead after SIGTERM`);
  assert.equal(existsSync(meta.dir), false, `profile dir ${meta.dir} should be deleted on SIGTERM`);
});

test('close() kills Chrome helper grandchildren in the process group so they cannot outlive parent or recreate profile dirs', async (context) => {
  const root = await mkdtemp(join(tmpdir(), 'chrome-cdp-pgrp-'));
  context.after(() => rm(root, { recursive: true, force: true }));

  await writeFile(join(root, 'fake-cdp.mjs'), FAKE_CDP_SERVER_SNIPPET, 'utf8');
  const metaFile = join(root, 'pgrp-meta.json');
  const chromeWithHelper = await writeExecutable(
    root,
    'chrome-with-helper.mjs',
    `import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { startFakeCdpServer } from './fake-cdp.mjs';
const dir = process.argv.find((a) => a.startsWith('--user-data-dir=')).slice('--user-data-dir='.length);
const helper = spawn(process.execPath, [
  '-e',
  'import("node:fs").then(({ mkdirSync }) => { setTimeout(() => { try { mkdirSync(' + JSON.stringify(dir + '/Default') + ', { recursive: true }); } catch {} }, 80); setInterval(() => {}, 1000); });',
], { stdio: 'ignore' });
const cdp = await startFakeCdpServer();
writeFileSync(${JSON.stringify(metaFile)}, JSON.stringify({ pid: process.pid, helperPid: helper.pid, dir }));
process.stderr.write('DevTools listening on ws://127.0.0.1:' + cdp.port + '/devtools/browser/pgrp\\n');
setInterval(() => {}, 1000);
`,
  );

  const page = await launchHeadlessPage({ chromeBinary: chromeWithHelper, timeoutMs: 5000 });
  const meta = JSON.parse(await readFile(metaFile, 'utf8'));
  context.after(async () => {
    if (meta.helperPid && processAlive(meta.helperPid)) process.kill(meta.helperPid, 'SIGKILL');
    if (meta.dir) await rm(meta.dir, { recursive: true, force: true });
  });
  assert.equal(processAlive(meta.helperPid), true);

  await page.close();
  await new Promise((resolve) => setTimeout(resolve, 150));

  assert.equal(processAlive(meta.helperPid), false, 'helper grandchild must be killed with process group');
  assert.equal(existsSync(meta.dir), false, 'helper grandchild must not recreate Default/ inside profile dir');
});

test('launchHeadlessPage detects nested OS sandbox init failure even after DevTools URL and retries with --no-sandbox', async (context) => {
  const root = await mkdtemp(join(tmpdir(), 'chrome-cdp-nested-sbx-'));
  context.after(() => rm(root, { recursive: true, force: true }));

  await writeFile(join(root, 'fake-cdp.mjs'), FAKE_CDP_SERVER_SNIPPET, 'utf8');
  const attemptsFile = join(root, 'sbx-attempts.json');
  await writeFile(attemptsFile, '[]', 'utf8');

  const nestedSandboxedChrome = await writeExecutable(
    root,
    'nested-sbx-chrome.mjs',
    `import { readFileSync, writeFileSync } from 'node:fs';
import { startFakeCdpServer } from './fake-cdp.mjs';
const hasNoSandbox = process.argv.includes('--no-sandbox');
const dir = process.argv.find((a) => a.startsWith('--user-data-dir=')).slice('--user-data-dir='.length);
const attempts = JSON.parse(readFileSync(${JSON.stringify(attemptsFile)}, 'utf8'));
attempts.push({ pid: process.pid, dir, hasNoSandbox });
writeFileSync(${JSON.stringify(attemptsFile)}, JSON.stringify(attempts));

const cdp = await startFakeCdpServer({
  onMessage: (msg) => {
    if (!hasNoSandbox) return null; // Renderer hung because inner sandbox failed to initialize.
    if (msg.method === 'Runtime.evaluate') return { id: msg.id, result: { result: { value: 99 } } };
    return { id: msg.id, result: {} };
  },
});
process.stderr.write('DevTools listening on ws://127.0.0.1:' + cdp.port + '/devtools/browser/sbx\\n');
if (!hasNoSandbox) {
  setTimeout(() => {
    process.stderr.write('sandbox initialization failed: Operation not permitted\\naperitif: Failed to initialize sandbox\\n');
  }, 80);
}
setInterval(() => {}, 1000);
`,
  );

  const prevNoSbx = process.env.OPENPENCIL_CHROME_NO_SANDBOX;
  delete process.env.OPENPENCIL_CHROME_NO_SANDBOX;
  context.after(() => {
    if (prevNoSbx !== undefined) process.env.OPENPENCIL_CHROME_NO_SANDBOX = prevNoSbx;
  });

  const t0 = Date.now();
  const page = await launchHeadlessPage({ chromeBinary: nestedSandboxedChrome, timeoutMs: 8000 });
  context.after(() => page?.close());
  const elapsed = Date.now() - t0;
  assert.ok(elapsed < 3000, `expected fast fallback < 3000ms, got ${elapsed}ms`);
  assert.equal(page.noSandbox, true);
  assert.equal(await page.evaluate('99'), 99);
  await page.close();

  const attempts = JSON.parse(await readFile(attemptsFile, 'utf8'));
  assert.equal(attempts.length, 2);
  assert.equal(attempts[0].hasNoSandbox, false, 'first attempt keeps OS sandbox enabled');
  assert.equal(attempts[1].hasNoSandbox, true, 'fallback attempt adds --no-sandbox');
  assert.equal(processAlive(attempts[0].pid), false, 'failed sandboxed browser must be killed');
  assert.equal(existsSync(attempts[0].dir), false, 'failed sandboxed profile must be removed');
  assert.equal(existsSync(attempts[1].dir), false, 'second profile must be removed on close');

  // Subsequent launch in the same process remembers nested sandbox and passes --no-sandbox immediately.
  const page2 = await launchHeadlessPage({ chromeBinary: nestedSandboxedChrome, timeoutMs: 5000 });
  await page2.close();
  const attemptsAfter = JSON.parse(await readFile(attemptsFile, 'utf8'));
  assert.equal(attemptsAfter.length, 3);
  assert.equal(attemptsAfter[2].hasNoSandbox, true, 'cached nested sandbox skips broken first attempt');
});
