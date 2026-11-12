/** Shared lifecycle primitives for managed OpenPencil editor daemons. */

import { spawn } from 'node:child_process';
import { isAbsolute } from 'node:path';

const START_TIMEOUT_MS = 20_000;
const READY_TIMEOUT_MS = 15_000;
const STOP_TIMEOUT_MS = 3_000;
const RESET_TIMEOUT_MS = 8_000;
const MAX_HANDSHAKE_BYTES = 16 * 1024;
const MAX_DIAGNOSTIC_BYTES = 64 * 1024;
const MAX_RESET_RESPONSE_BYTES = 16 * 1024;

function sanitizedDiagnostics(value, sourcePath) {
  const redacted = value.replace(/((?:authorization|bearer|token)[\s"'=:]+)[A-Za-z0-9._~-]{8,}/gi, '$1[redacted]');
  return (sourcePath === undefined ? redacted : redacted.split(sourcePath).join('[managed-document]')).trim();
}

function isValidHandshakeVersion(version) {
  if (typeof version === 'number') return Number.isSafeInteger(version) && version >= 0;
  return typeof version === 'string' && version.length > 0 && version.length <= 64;
}

function isValidHandshakePort(port) {
  return typeof port === 'number' && Number.isSafeInteger(port) && port >= 1 && port <= 65535;
}

function parseHandshake(line) {
  let value;
  try {
    value = JSON.parse(line);
  } catch {
    throw new Error('OpenPencil editor host returned an invalid handshake');
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('OpenPencil editor host returned an invalid handshake');
  }
  if (
    value.ok !== true
    || !isValidHandshakePort(value.port)
    || typeof value.token !== 'string'
    || value.token.length < 16
    || !isValidHandshakeVersion(value.version)
  ) {
    throw new Error('OpenPencil editor host returned an incomplete handshake');
  }
  return { port: value.port, token: value.token, version: value.version };
}

export async function waitForHandshake(child, diagnostics, signal) {
  signal?.throwIfAborted();
  return new Promise((resolveHandshake, rejectHandshake) => {
    let settled = false;
    let stdout = '';
    const finish = (outcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.stdout.off('data', onData);
      child.off('error', onError);
      child.off('close', onClose);
      signal?.removeEventListener('abort', onAbort);
      if ('error' in outcome) rejectHandshake(outcome.error);
      else resolveHandshake(outcome.handshake);
    };
    const onData = (chunk) => {
      stdout += chunk.toString('utf8');
      if (stdout.length > MAX_HANDSHAKE_BYTES) {
        finish({ error: new Error('OpenPencil editor host handshake exceeded its size limit') });
        return;
      }
      const newline = stdout.indexOf('\n');
      if (newline < 0) return;
      try {
        finish({ handshake: parseHandshake(stdout.slice(0, newline).trim()) });
      } catch (error) {
        finish({ error: error instanceof Error ? error : new Error(String(error)) });
      }
    };
    const onError = (error) => finish({ error });
    const onAbort = () => {
      const reason = signal?.reason;
      finish({ error: reason instanceof Error ? reason : new Error('OpenPencil editor startup was cancelled') });
    };
    const onClose = (code) => {
      const detail = diagnostics();
      finish({
        error: new Error(
          `OpenPencil editor host exited before startup (${String(code)})${detail === '' ? '' : `: ${detail}`}`,
        ),
      });
    };
    const timer = setTimeout(() => {
      const detail = diagnostics();
      finish({
        error: new Error(
          `OpenPencil editor host did not start within ${START_TIMEOUT_MS} ms${detail === '' ? '' : `: ${detail}`}`,
        ),
      });
    }, START_TIMEOUT_MS);
    child.stdout.on('data', onData);
    child.once('error', onError);
    child.once('close', onClose);
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) onAbort();
  });
}

export async function waitForEditorReady(baseUrl, signal) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let last = '';
  while (Date.now() < deadline) {
    signal?.throwIfAborted();
    try {
      const requestSignal = signal === undefined
        ? AbortSignal.timeout(2_000)
        : AbortSignal.any([signal, AbortSignal.timeout(2_000)]);
      // Poll readiness sequentially until web-bundle endpoints respond 200.
      // eslint-disable-next-line no-await-in-loop
      const [root, glue] = await Promise.all([
        fetch(`${baseUrl}/`, { signal: requestSignal }),
        fetch(`${baseUrl}/pkg/op_host_web.js`, { signal: requestSignal }),
      ]);
      // eslint-disable-next-line no-await-in-loop
      await Promise.all([root.arrayBuffer().catch(() => undefined), glue.arrayBuffer().catch(() => undefined)]);
      if (root.status === 200 && glue.status === 200) return;
      last = `root=${root.status}, bundle=${glue.status}`;
    } catch (error) {
      signal?.throwIfAborted();
      last = error instanceof Error ? error.message : String(error);
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 150));
  }
  throw new Error(`OpenPencil editor web bundle was not ready${last === '' ? '' : `: ${last}`}`);
}

const stoppingChildren = new WeakMap();

function waitForChildClose(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(true);
  return new Promise((resolveClosed) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.off('close', onClose);
      resolveClosed(value);
    };
    const onClose = () => finish(true);
    const timer = setTimeout(() => finish(false), timeoutMs);
    child.once('close', onClose);
  });
}

export function stopManagedEditorChild(child) {
  const current = stoppingChildren.get(child);
  if (current !== undefined) return current;
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  const stopping = (async () => {
    if (!child.stdin.writableEnded) child.stdin.end();
    const closed = await waitForChildClose(child, STOP_TIMEOUT_MS);
    if (!closed && child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL');
      await waitForChildClose(child, STOP_TIMEOUT_MS);
    }
  })();
  stoppingChildren.set(child, stopping);
  void stopping.finally(() => {
    if (stoppingChildren.get(child) === stopping) stoppingChildren.delete(child);
  });
  return stopping;
}

export function verifyHandshakeVersion(runtime, handshake) {
  if (runtime.entrypoint !== undefined && typeof handshake.version !== 'number') {
    throw new Error('Node/WASM editor host returned an invalid document version');
  }
  const actualVersion = runtime.entrypoint === undefined ? String(handshake.version) : runtime.openPencilVersion;
  if (actualVersion !== runtime.openPencilVersion) {
    throw new Error(
      `OpenPencil editor runtime version mismatch: expected ${runtime.openPencilVersion}, received ${actualVersion}`,
    );
  }
  return actualVersion;
}

export async function spawnManagedDaemonWithLaunch(runtime, launch, options) {
  options.signal?.throwIfAborted();
  if (!isAbsolute(options.sourcePath) || !options.sourcePath.toLowerCase().endsWith('.op')) {
    throw new Error('OpenPencil managed daemon source must be an absolute .op path');
  }
  const origin = new URL(options.allowOrigin);
  if (origin.origin !== options.allowOrigin || (origin.protocol !== 'http:' && origin.protocol !== 'https:')) {
    throw new Error('OpenPencil managed daemon allow-origin must be an HTTP origin');
  }
  const child = spawn(runtime.binary, launch.args, { stdio: ['pipe', 'pipe', 'pipe'], env: launch.env });
  options.onSpawn?.(child);
  let diagnostics = '';
  child.stderr.on('data', (chunk) => {
    if (diagnostics.length < MAX_DIAGNOSTIC_BYTES) {
      diagnostics += chunk.toString('utf8').slice(0, MAX_DIAGNOSTIC_BYTES - diagnostics.length);
    }
  });
  const onAbort = () => {
    void stopManagedEditorChild(child);
  };
  options.signal?.addEventListener('abort', onAbort, { once: true });
  try {
    const handshake = await waitForHandshake(
      child,
      () => sanitizedDiagnostics(diagnostics, options.sourcePath),
      options.signal,
    );
    const actualVersion = verifyHandshakeVersion(runtime, handshake);
    options.signal?.throwIfAborted();
    const baseUrl = `http://127.0.0.1:${handshake.port}`;
    await waitForEditorReady(baseUrl, options.signal);
    options.signal?.throwIfAborted();
    return { child, baseUrl, token: handshake.token, sourcePath: options.sourcePath, runtimeVersion: actualVersion };
  } catch (error) {
    await stopManagedEditorChild(child);
    throw error;
  } finally {
    options.signal?.removeEventListener('abort', onAbort);
  }
}

export async function resetManagedDaemonHttp(baseUrl, signal) {
  if (signal?.aborted) throw new Error('OpenPencil managed daemon reset was cancelled');
  const timeout = AbortSignal.timeout(RESET_TIMEOUT_MS);
  const requestSignal = signal === undefined ? timeout : AbortSignal.any([signal, timeout]);
  let response;
  try {
    response = await fetch(`${baseUrl}/api/mcp/sync-reset`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
      signal: requestSignal,
    });
  } catch {
    if (signal?.aborted) throw new Error('OpenPencil managed daemon reset was cancelled');
    throw new Error(timeout.aborted ? 'OpenPencil managed daemon reset timed out' : 'OpenPencil managed daemon reset request failed');
  }
  let text;
  try {
    text = await response.text();
  } catch {
    if (signal?.aborted) throw new Error('OpenPencil managed daemon reset was cancelled');
    throw new Error(timeout.aborted ? 'OpenPencil managed daemon reset timed out' : 'OpenPencil managed daemon reset response failed');
  }
  if (Buffer.byteLength(text) > MAX_RESET_RESPONSE_BYTES) {
    throw new Error('OpenPencil managed daemon reset response exceeded its size limit');
  }
  if (response.status !== 200) throw new Error(`OpenPencil managed daemon reset failed (${response.status})`);
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('OpenPencil managed daemon reset returned invalid JSON');
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('OpenPencil managed daemon reset returned an invalid response');
  }
  if (
    value.ok !== true
    || (value.skipped !== undefined && typeof value.skipped !== 'boolean')
    || typeof value.version !== 'number'
    || !Number.isSafeInteger(value.version)
    || value.version < 0
  ) {
    throw new Error('OpenPencil managed daemon did not accept its initial reset');
  }
  return { version: value.version, skipped: value.skipped === true };
}
