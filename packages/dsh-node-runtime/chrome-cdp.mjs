import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export function discoverChromiumBinary() {
  if (process.env.OPENPENCIL_DISABLE_HEADLESS_BROWSER === '1') return null;
  const candidates = [
    process.env.OPENPENCIL_CHROME_PATH,
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim() && existsSync(candidate.trim())) {
      return candidate.trim();
    }
  }
  return null;
}

function waitForDevToolsUrl(child) {
  return new Promise((resolveWs, rejectWs) => {
    const timer = setTimeout(
      () => rejectWs(new Error('Timed out waiting for DevTools listening endpoint')),
      6000,
    );
    let stderrText = '';
    child.stderr.on('data', (chunk) => {
      stderrText += chunk.toString('utf8');
      const match = /DevTools listening on (ws:\/\/[^\s]+)/.exec(stderrText);
      if (match) {
        clearTimeout(timer);
        resolveWs(match[1]);
      }
    });
    child.once('error', (error) => {
      clearTimeout(timer);
      rejectWs(error);
    });
    child.once('exit', (code) => {
      clearTimeout(timer);
      rejectWs(new Error(`Headless browser exited early (${code})`));
    });
  });
}

function openSocket(url) {
  const ws = new WebSocket(url);
  return new Promise((resolveOpen, rejectOpen) => {
    const timer = setTimeout(() => rejectOpen(new Error('WebSocket open timeout')), 4000);
    ws.addEventListener(
      'open',
      () => {
        clearTimeout(timer);
        resolveOpen(ws);
      },
      { once: true },
    );
    ws.addEventListener(
      'error',
      (error) => {
        clearTimeout(timer);
        rejectOpen(error);
      },
      { once: true },
    );
  });
}

/**
 * Launch a throwaway headless Chromium and attach to its first page target.
 * WebGL renders through SwiftShader so `<canvas>` scenes produce pixels
 * without a GPU. The caller owns the returned page and must `close()` it.
 */
export async function launchHeadlessPage({ width = 1440, height = 900, timeoutMs = 15_000 } = {}) {
  const chromeBinary = discoverChromiumBinary();
  if (!chromeBinary || typeof WebSocket !== 'function') return null;
  const userDataDir = await mkdtemp(join(tmpdir(), 'op-headless-chrome-'));
  let child = null;
  let ws = null;
  const close = async () => {
    try {
      ws?.close();
    } catch {}
    if (child?.pid) {
      try {
        child.kill('SIGKILL');
      } catch {}
    }
    await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
  };
  try {
    child = spawn(
      chromeBinary,
      [
        '--headless=new',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-sync',
        '--hide-scrollbars',
        '--mute-audio',
        `--user-data-dir=${userDataDir}`,
        `--window-size=${width},${height}`,
        '--remote-debugging-port=0',
        'about:blank',
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] },
    );
    const browserWsUrl = await waitForDevToolsUrl(child);
    const httpBase = browserWsUrl
      .replace(/^ws:\/\//, 'http://')
      .replace(/\/devtools\/browser\/.*$/, '');
    const targets = await (
      await fetch(`${httpBase}/json/list`, { signal: AbortSignal.timeout(4000) })
    ).json();
    const pageTarget = Array.isArray(targets)
      ? targets.find((t) => t?.type === 'page' && typeof t.webSocketDebuggerUrl === 'string')
      : null;
    if (!pageTarget) throw new Error('No page target in headless browser');
    ws = await openSocket(pageTarget.webSocketDebuggerUrl);
  } catch (error) {
    await close();
    throw error;
  }

  let nextId = 1;
  const pending = new Map();
  const listeners = new Map();
  ws.addEventListener('message', (event) => {
    let msg;
    try {
      msg = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString('utf8'));
    } catch {
      return;
    }
    if (typeof msg.id === 'number' && pending.has(msg.id)) {
      const entry = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) entry.reject(new Error(msg.error.message || 'CDP error'));
      else entry.resolve(msg.result);
    } else if (typeof msg.method === 'string') {
      for (const listener of listeners.get(msg.method) ?? []) listener(msg.params ?? {});
    }
  });
  const send = (method, params = {}, callTimeoutMs = timeoutMs) =>
    new Promise((resolveCall, rejectCall) => {
      const id = nextId++;
      const timer = setTimeout(() => {
        pending.delete(id);
        rejectCall(new Error(`CDP timeout: ${method}`));
      }, callTimeoutMs);
      pending.set(id, {
        resolve: (result) => {
          clearTimeout(timer);
          resolveCall(result);
        },
        reject: (error) => {
          clearTimeout(timer);
          rejectCall(error);
        },
      });
      ws.send(JSON.stringify({ id, method, params }));
    });
  const on = (method, listener) => {
    if (!listeners.has(method)) listeners.set(method, new Set());
    listeners.get(method).add(listener);
    return () => listeners.get(method)?.delete(listener);
  };
  const evaluate = async (expression, { awaitPromise = false, evalTimeoutMs } = {}) => {
    const result = await send(
      'Runtime.evaluate',
      { expression, awaitPromise, returnByValue: true },
      evalTimeoutMs ?? timeoutMs,
    );
    if (result?.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || 'Page script failed');
    }
    return result?.result?.value;
  };
  return { send, on, evaluate, close };
}
