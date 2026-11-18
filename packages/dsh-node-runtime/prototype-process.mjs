/** Bounded owned subprocesses; cancellation kills only the spawned process group. */
import { spawn } from 'node:child_process';
export async function runPrototypeProcess(command, args, cwd, signal, timeoutMs = 60000) {
  signal?.throwIfAborted();
  return new Promise((resolveRun, reject) => {
    const processChild = spawn(command, args, {
      cwd,
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    let stopped = false;
    const stop = () => {
      stopped = true;
      try {
        process.kill(-processChild.pid, 'SIGKILL');
      } catch {
        processChild.kill('SIGKILL');
      }
    };
    const timer = setTimeout(stop, timeoutMs);
    signal?.addEventListener('abort', stop, { once: true });
    if (signal?.aborted) stop();
    for (const stream of [processChild.stdout, processChild.stderr])
      stream.on('data', (chunk) => {
        output = (output + chunk).slice(-4096);
      });
    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', stop);
    };
    processChild.once('error', (error) => {
      cleanup();
      reject(error);
    });
    processChild.once('close', (code) => {
      cleanup();
      if (signal?.aborted) reject(signal.reason);
      else if (stopped) reject(new Error('Authoring subprocess exceeded its time budget'));
      else resolveRun({ code, output });
    });
  });
}
