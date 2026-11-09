// compare_html_fidelity and the HTML import tool contracts. The host test
// needs DSH_E2E_CHROME=1 and a built web bundle; a skip is not acceptance.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { EngineSession } from './engine-session.mjs';
import { discoverChromiumBinary } from './html-browser-capture.mjs';
import { startNodeHost } from './node-host.mjs';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), 'web-bundle');
const CHROME_SKIP =
  process.env.DSH_E2E_CHROME === '1' &&
  discoverChromiumBinary() &&
  existsSync(join(webRoot, 'op_host_web_bg.wasm'))
    ? false
    : 'set DSH_E2E_CHROME=1 with Chrome and a built web-bundle';

test('the catalog advertises browser import arguments and the fidelity tool', () => {
  const session = new EngineSession({ version: '0.8.5', children: [] });
  try {
    const tools = new Map(session.listTools().map((tool) => [tool.name, tool]));
    for (const name of ['import_html', 'import_html_url']) {
      const properties = tools.get(name).inputSchema.properties;
      for (const key of [
        'viewports',
        'viewportWidth',
        'renderMode',
        'readyExpression',
        'waitMs',
        'fetchFonts',
      ]) {
        assert.ok(properties[key], `${name}.${key}`);
      }
    }
    assert.ok(tools.get('import_html').inputSchema.properties.htmlPath);
    const fidelity = tools.get('compare_html_fidelity');
    assert.deepEqual(fidelity.inputSchema.required, ['nodeId']);
    const engineOnly = session.callTool('compare_html_fidelity', { nodeId: 'x' });
    assert.equal(engineOnly.isError, true);
    assert.match(engineOnly.content[0].text, /requires a managed Node host/);
  } finally {
    session.close();
  }
});

const PAGE = `<!doctype html><html><head><title>Fidelity</title><style>
  body{margin:0;font-family:sans-serif;background:#f4f4f0}
  header{display:flex;justify-content:space-between;align-items:center;height:64px;padding:0 32px;background:#121316;color:#fff}
  .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:32px}
  .card{height:160px;border-radius:12px;background:#e2e8f0;border:1px solid color-mix(in oklch, #121316 14%, transparent)}
</style></head><body><header><b>Brand</b><span>Menu</span></header>
<main class="cards"><div class="card"></div><div class="card"></div><div class="card"></div></main></body></html>`;

test(
  'compare_html_fidelity verifies a faithful import and flags a different page',
  { skip: CHROME_SKIP },
  async (context) => {
    const dir = await mkdtemp(join(tmpdir(), 'dsh-html-fidelity-'));
    context.after(() => rm(dir, { recursive: true, force: true }));
    const htmlPath = join(dir, 'page.html');
    const otherPath = join(dir, 'other.html');
    await writeFile(htmlPath, PAGE);
    await writeFile(
      otherPath,
      PAGE.replace('grid-template-columns:repeat(3,1fr)', 'grid-template-columns:1fr').replace(
        '#121316;color',
        '#c2410c;color',
      ),
    );
    const host = await startNodeHost({
      document: { version: '0.8.5', children: [] },
      webRoot,
      canvaskitRoot: join(webRoot, 'canvaskit'),
      assetDirectory: join(dir, 'assets'),
      headless: true,
    });
    context.after(() => host.close());
    let id = 0;
    const call = async (name, args) => {
      const response = await fetch(`${host.baseUrl}/mcp`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: ++id,
          method: 'tools/call',
          params: { name, arguments: args },
        }),
      });
      return (await response.json()).result;
    };
    const imported = await call('import_html', {
      htmlPath,
      viewportWidth: 1000,
      fetchFonts: false,
    });
    assert.equal(imported.isError, false, imported.content?.[0]?.text);
    const nodeId = imported.structuredContent.rootIds[0];
    const same = await call('compare_html_fidelity', { nodeId, htmlPath });
    assert.equal(same.isError, false, same.content?.[0]?.text);
    const report = same.structuredContent;
    assert.equal(report.visual.comparable, true);
    assert.ok(report.visual.ratio < 0.02, `faithful import differs by ${report.visual.ratio}`);
    assert.equal(report.text.matched, report.text.expected);
    assert.equal(report.verified, true);
    assert.ok(report.visual.bands.length > 0);
    const different = (await call('compare_html_fidelity', { nodeId, htmlPath: otherPath }))
      .structuredContent;
    assert.equal(different.verified, false);
    assert.ok(
      different.visual.comparable === false || different.visual.ratio > 0.05,
      JSON.stringify(different.visual).slice(0, 300),
    );
    const missing = await call('compare_html_fidelity', { nodeId: 'nope', htmlPath });
    assert.equal(missing.isError, true);
  },
);
