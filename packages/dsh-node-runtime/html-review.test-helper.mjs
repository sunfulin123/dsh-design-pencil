/** Disposable ordinary HTML pages and a loopback server for review-control acceptance. */
import { mkdtemp, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

export const helper = fileURLToPath(new URL('../html-prototype-review/scripts/prepare-html-review.mjs', import.meta.url));
export const states = ['success', 'loading', 'empty', 'error', 'partial', 'permission'];
export function businessHtml(title = 'Project overview') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<script src="./prototype-review/page.js"></script><style>body{margin:0;font:15px/1.5 system-ui;background:#fff;color:#20242b}main{padding:24px}h1{margin:0 0 8px}section{margin-top:24px}button,a{font:inherit;padding:8px}.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.card{padding:20px;border:1px solid #dce0e5;border-radius:8px}section[hidden]{display:block}@media(max-width:480px){.cards{grid-template-columns:1fr}}@media(prefers-color-scheme:dark){body{background:#202428;color:#edf0f3}}</style></head><body><main>
<h1>${title}</h1><p>A responsive standalone HTML prototype.</p><a href="./details.html?record=sample">Open details</a>
${states.map(state => `<section data-prototype-state="${state}" hidden><h2>${state}</h2>${state === 'success' ? '<div class="cards"><div class="card">Research</div><div class="card">Design</div><div class="card">Review</div></div><label>Project name <input aria-label="Project name" value="Sample project"></label>' : `<p>Sample ${state} content.</p>`}</section>`).join('')}
</main></body></html>`;
}
export async function fixture(t, script = helper) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'html-review-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, 'index.html'), businessHtml());
  await writeFile(join(root, 'details.html'), businessHtml('Project details'));
  const run = (args = []) => spawnSync(process.execPath, [script, '--entry', join(root, 'index.html'), ...args], { env: { ...process.env, SYNAPSE_DESIGN_TASK_DIR: root }, encoding: 'utf8', timeout: 15000 });
  return { root, run };
}
export async function serve(root) {
  const server = createServer(async (request, response) => {
    try {
      const path = resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
      if (path !== root && !path.startsWith(root + sep)) throw new Error('Outside fixture');
      const target = (await stat(path)).isDirectory() ? join(path, 'index.html') : path;
      response.setHeader('content-type', { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }[extname(target)] ?? 'application/octet-stream');
      response.end(await readFile(target));
    } catch { response.writeHead(404).end(); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(resolve => server.close(resolve)) };
}
