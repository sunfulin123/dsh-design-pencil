import { readFile, realpath } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { startNodeHost } from './node-host.mjs';

async function main() {
  if (process.argv[2] && !process.argv[2].startsWith('-')) {
    const { runOfflineCommand } = await import('./offline-cli.mjs');
    const result = await runOfflineCommand(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  const { values } = parseArgs({
    options: {
      'serve-web': { type: 'boolean' },
      managed: { type: 'boolean' },
      port: { type: 'string', default: '0' },
      file: { type: 'string' },
      'draft-dir': { type: 'string' },
      'asset-dir': { type: 'string' },
      'allow-origin': { type: 'string', multiple: true, default: [] },
      'no-headless': { type: 'boolean' },
    },
  });
  if (!values['serve-web'] || !values.managed || !values.file || values.port !== '0') {
    throw new Error('Expected --serve-web --managed --port 0 --file <document>');
  }
  let host;
  let stopping = false;
  const stop = async () => {
    stopping = true;
    process.stdin.pause();
    await host?.close();
  };
  process.stdin.once('end', stop);
  process.stdin.once('error', stop);
  process.stdout.once('error', stop);
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);
  process.stdin.resume();
  const sourcePath = await realpath(values.file);
  const document = JSON.parse(await readFile(sourcePath, 'utf8'));
  const runtimeRoot = dirname(fileURLToPath(import.meta.url));
  const webRoot = process.env.OPENPENCIL_WEB_BUNDLE_DIR || join(runtimeRoot, 'web-bundle');
  const canvaskitRoot = process.env.OPENPENCIL_CANVASKIT_DIR || join(webRoot, 'canvaskit');
  host = await startNodeHost({
    document,
    sourcePath,
    draftDirectory: values['draft-dir'],
    allowOrigins: values['allow-origin'],
    webRoot,
    canvaskitRoot,
    onShutdown: stop,
    assetDirectory: values['asset-dir'],
    headless: !values['no-headless'] && process.env.DSH_HEADLESS !== '0',
  });
  if (stopping) return host.close();
  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      port: Number(new URL(host.baseUrl).port),
      token: host.token,
      version: 0,
    })}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
  process.stdin.pause();
});
