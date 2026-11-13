import { spawn } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const MAX_STDERR_TAIL = 2048;
export const SANDBOX_INIT_ERROR_RE =
  /sandbox initialization failed|Failed to initialize sandbox|No usable sandbox|Failed to move to new namespace|Running as root without --no-sandbox/i;

const activeBrowsers = new Set();
let cleanupInstalled = false;
let nestedSandboxDetected = false;

function killBrowserTree(child) {
  if (!child?.pid) return;
  if (process.platform !== 'win32') {
    try {
      process.kill(-child.pid, 'SIGKILL');
      return;
    } catch {}
  }
  try {
    child.kill('SIGKILL');
  } catch {}
}

function cleanupAllActiveSync() {
  for (const entry of activeBrowsers) {
    activeBrowsers.delete(entry);
    killBrowserTree(entry.child);
    if (entry.userDataDir) {
      try {
        rmSync(entry.userDataDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 30 });
      } catch {}
    }
  }
  uninstallProcessCleanup();
}

function onTerminationSignal(signal) {
  const soleListener = process.listenerCount(signal) <= 1;
  cleanupAllActiveSync();
  if (soleListener) {
    try {
      process.kill(process.pid, signal);
    } catch {}
  }
}

const onSigterm = () => onTerminationSignal('SIGTERM');
const onSigint = () => onTerminationSignal('SIGINT');

function installProcessCleanup() {
  if (cleanupInstalled) return;
  cleanupInstalled = true;
  process.on('exit', cleanupAllActiveSync);
  process.on('SIGTERM', onSigterm);
  process.on('SIGINT', onSigint);
}

function uninstallProcessCleanup() {
  if (!cleanupInstalled || activeBrowsers.size > 0) return;
  cleanupInstalled = false;
  process.off('exit', cleanupAllActiveSync);
  process.off('SIGTERM', onSigterm);
  process.off('SIGINT', onSigint);
}

function withStderr(message, getStderrTail) {
  const tail = typeof getStderrTail === 'function' ? getStderrTail().trim() : '';
  if (!tail) return message;
  return `${message} (Chrome stderr: ${tail.replace(/\s+/g, ' ')})`;
}

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

function waitForDevToolsUrl(child, startupTimeoutMs, getStderrTail, { abortOnSandboxError = false } = {}) {
  return new Promise((resolveWs, rejectWs) => {
    const timer = setTimeout(
      () =>
        rejectWs(
          new Error(
            withStderr(
              `Timed out waiting for DevTools listening endpoint after ${startupTimeoutMs}ms`,
              getStderrTail,
            ),
          ),
        ),
      startupTimeoutMs,
    );
    let stderrText = '';
    const onData = (chunk) => {
      stderrText += chunk.toString('utf8');
      if (abortOnSandboxError && SANDBOX_INIT_ERROR_RE.test(stderrText)) {
        cleanup();
        const err = new Error(
          withStderr('Nested OS sandbox blocked Chromium helper sandbox initialization', getStderrTail),
        );
        err.sandboxInitFailed = true;
        rejectWs(err);
        return;
      }
      const match = /DevTools listening on (ws:\/\/[^\s]+)/.exec(stderrText);
      if (match) {
        cleanup();
        resolveWs(match[1]);
      }
    };
    const onError = (error) => {
      cleanup();
      rejectWs(error);
    };
    const onClose = (code, signal) => {
      cleanup();
      rejectWs(
        new Error(
          withStderr(
            `Headless browser exited early (${code ?? signal ?? 'unknown'})`,
            getStderrTail,
          ),
        ),
      );
    };
    const cleanup = () => {
      clearTimeout(timer);
      child.stderr?.off('data', onData);
      child.off('error', onError);
      child.off('close', onClose);
    };
    child.stderr.on('data', onData);
    child.once('error', onError);
    child.once('close', onClose);
  });
}

function openSocket(url, connectTimeoutMs, getStderrTail) {
  const ws = new WebSocket(url);
  return new Promise((resolveOpen, rejectOpen) => {
    const timer = setTimeout(
      () => rejectOpen(new Error(withStderr('WebSocket open timeout', getStderrTail))),
      connectTimeoutMs,
    );
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

async function launchSingleHeadlessAttempt({
  chromeBinary,
  width,
  height,
  startupBudgetMs,
  defaultCallTimeoutMs,
  softwareWebGL,
  noSandbox,
}) {
  const userDataDir = await mkdtemp(join(tmpdir(), 'op-headless-chrome-'));
  const tracked = { child: null, userDataDir };
  activeBrowsers.add(tracked);
  installProcessCleanup();

  let child = null;
  let ws = null;
  let closed = false;
  let sandboxInitFailed = false;
  let stderrTailBuf = '';
  const sandboxAbortListeners = new Set();
  const stderrTail = () => stderrTailBuf;
  const makeSandboxError = () => {
    const err = new Error(
      withStderr('Nested OS sandbox blocked Chromium helper sandbox initialization', stderrTail),
    );
    err.sandboxInitFailed = true;
    return err;
  };
  const raceWithSandboxFailure = (promise) => {
    if (noSandbox) return promise;
    if (sandboxInitFailed) return Promise.reject(makeSandboxError());
    let listener;
    const abortPromise = new Promise((_, rejectAbort) => {
      listener = () => rejectAbort(makeSandboxError());
      sandboxAbortListeners.add(listener);
    });
    return Promise.race([promise, abortPromise]).finally(() => {
      if (listener) sandboxAbortListeners.delete(listener);
    });
  };

  const close = async () => {
    if (closed) return;
    closed = true;
    try {
      ws?.close();
    } catch {}
    if (child?.pid) {
      const exited =
        child.exitCode !== null || child.signalCode !== null
          ? Promise.resolve()
          : new Promise((resolve) => {
              child.once('exit', resolve);
              setTimeout(resolve, 1000).unref?.();
            });
      killBrowserTree(child);
      await exited;
    }
    await rm(userDataDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 }).catch(() => {});
    activeBrowsers.delete(tracked);
    uninstallProcessCleanup();
  };

  const startupDeadline = Date.now() + startupBudgetMs;

  try {
    // macOS WindowServer clamps top-level windows to >=500px wide and stalls
    // Page.enable when forced onto SwiftShader software Vulkan. Keep an
    // unclamped backing window and let CDP Emulation + screenshot clip control
    // exact <500px viewports (such as 375px or 390px mobile captures).
    const windowWidth = Math.max(width, 800);
    const windowHeight = Math.max(height, 600);
    child = spawn(
      chromeBinary,
      [
        '--headless=new',
        ...(noSandbox ? ['--no-sandbox'] : []),
        ...(softwareWebGL ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : []),
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-breakpad',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-sync',
        '--hide-scrollbars',
        '--mute-audio',
        `--user-data-dir=${userDataDir}`,
        `--window-size=${windowWidth},${windowHeight}`,
        '--remote-debugging-port=0',
        'about:blank',
      ],
      { detached: process.platform !== 'win32', stdio: ['ignore', 'ignore', 'pipe'] },
    );
    tracked.child = child;
    child.stderr.on('data', (chunk) => {
      stderrTailBuf = (stderrTailBuf + chunk.toString('utf8')).slice(-MAX_STDERR_TAIL);
      if (!noSandbox && !sandboxInitFailed && SANDBOX_INIT_ERROR_RE.test(stderrTailBuf)) {
        sandboxInitFailed = true;
        nestedSandboxDetected = true;
        for (const notify of sandboxAbortListeners) notify();
      }
    });

    const browserWsUrl = await waitForDevToolsUrl(child, startupBudgetMs, stderrTail, {
      abortOnSandboxError: !noSandbox,
    });
    const httpBase = browserWsUrl
      .replace(/^ws:\/\//, 'http://')
      .replace(/\/devtools\/browser\/.*$/, '');
    let pageTarget = null;
    for (let attempt = 0; attempt < 25 && !pageTarget; attempt += 1) {
      if (sandboxInitFailed) throw makeSandboxError();
      const remaining = Math.max(200, startupDeadline - Date.now());
      const targets = await raceWithSandboxFailure(
        fetch(`${httpBase}/json/list`, {
          signal: AbortSignal.timeout(Math.min(4000, remaining)),
        }).then((res) => res.json()),
      );
      pageTarget = Array.isArray(targets)
        ? targets.find((t) => t?.type === 'page' && typeof t.webSocketDebuggerUrl === 'string')
        : null;
      if (!pageTarget) {
        if (Date.now() >= startupDeadline) break;
        // oxlint-disable-next-line no-await-in-loop -- sequential polling for first page target
        await raceWithSandboxFailure(new Promise((r) => setTimeout(r, 100)));
      }
    }
    if (!pageTarget) {
      throw new Error(withStderr('No page target in headless browser', stderrTail));
    }
    const wsBudget = Math.max(250, Math.min(4000, startupDeadline - Date.now()));
    ws = await raceWithSandboxFailure(openSocket(pageTarget.webSocketDebuggerUrl, wsBudget, stderrTail));
  } catch (error) {
    await close();
    if (sandboxInitFailed && error && typeof error === 'object') {
      error.sandboxInitFailed = true;
    }
    throw error;
  }

  let nextId = 1;
  const pending = new Map();
  const listeners = new Map();
  const rejectAllPending = (reason) => {
    for (const [id, entry] of pending) {
      pending.delete(id);
      entry.reject(new Error(withStderr(reason, stderrTail)));
    }
  };
  ws.addEventListener('close', () => rejectAllPending('Headless browser connection closed'));
  child.once('exit', (code, signal) => {
    if (!closed) {
      rejectAllPending(`Headless browser exited unexpectedly (${code ?? signal ?? 'unknown'})`);
    }
  });
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
  const send = (method, params = {}, callTimeoutMs = defaultCallTimeoutMs) =>
    new Promise((resolveCall, rejectCall) => {
      if (closed || ws.readyState !== WebSocket.OPEN) {
        rejectCall(new Error(withStderr(`CDP connection not open: ${method}`, stderrTail)));
        return;
      }
      const id = nextId++;
      const timer = setTimeout(() => {
        pending.delete(id);
        rejectCall(new Error(withStderr(`CDP timeout: ${method} (${callTimeoutMs}ms)`, stderrTail)));
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
      evalTimeoutMs ?? defaultCallTimeoutMs,
    );
    if (result?.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || 'Page script failed');
    }
    return result?.result?.value;
  };

  // Verify the renderer helper process actually initialized its sandbox and can answer CDP
  // before returning the page (catches DevTools-before-renderer-sandbox-failure races).
  try {
    const probeBudgetMs = Math.max(250, Math.min(5000, startupDeadline - Date.now()));
    await raceWithSandboxFailure(
      send('Runtime.evaluate', { expression: '1', returnByValue: true }, probeBudgetMs),
    );
  } catch (error) {
    await close();
    if (sandboxInitFailed && error && typeof error === 'object') {
      error.sandboxInitFailed = true;
    }
    throw error;
  }

  return { send, on, evaluate, close, stderrTail, noSandbox };
}

/**
 * Launch a throwaway headless Chromium and attach to its first page target.
 * Keeps the OS sandbox enabled by default, automatically falling back to
 * `--no-sandbox` when an outer OS sandbox (such as macOS Seatbelt) blocks
 * Chromium's nested helper sandbox initialization.
 */
export async function launchHeadlessPage({
  width = 1440,
  height = 900,
  timeoutMs = 25_000,
  retries = 1,
  chromeBinary: explicitBinary,
  softwareWebGL = process.platform !== 'darwin' || process.env.OPENPENCIL_FORCE_SWIFTSHADER === '1',
} = {}) {
  const chromeBinary =
    typeof explicitBinary === 'string' && explicitBinary.trim() && existsSync(explicitBinary.trim())
      ? explicitBinary.trim()
      : discoverChromiumBinary();
  if (!chromeBinary || typeof WebSocket !== 'function') return null;
  const maxRetries = Math.max(0, Math.min(3, Math.trunc(Number(retries) || 0)));
  const totalStartupCapMs = Math.max(150, Math.min(timeoutMs, 25_000));
  let launchDeadline = Date.now() + totalStartupCapMs;
  let noSandbox = process.env.OPENPENCIL_CHROME_NO_SANDBOX === '1' || nestedSandboxDetected;
  let sandboxFallbackUsed = false;
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const remaining = launchDeadline - Date.now();
    if (attempt > 0 && remaining < 150) break;
    const attemptsLeft = maxRetries - attempt + 1;
    const startupBudgetMs = Math.max(
      120,
      Math.min(20_000, attempt < maxRetries ? Math.ceil(remaining * (0.6 / Math.max(1, attemptsLeft - 0.4))) : remaining),
    );
    try {
      // oxlint-disable-next-line no-await-in-loop -- sequential launch retry with fresh profile
      return await launchSingleHeadlessAttempt({
        chromeBinary,
        width,
        height,
        startupBudgetMs,
        defaultCallTimeoutMs: timeoutMs,
        softwareWebGL,
        noSandbox,
      });
    } catch (error) {
      lastError = error;
      if (error?.sandboxInitFailed && !noSandbox && !sandboxFallbackUsed) {
        noSandbox = true;
        sandboxFallbackUsed = true;
        launchDeadline = Math.max(launchDeadline, Date.now() + Math.min(timeoutMs, 15_000));
        attempt -= 1;
      }
    }
  }
  throw lastError;
}
