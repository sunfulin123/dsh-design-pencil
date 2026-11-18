import assert from 'node:assert/strict';
import test from 'node:test';
import { captureCurrentPage, renderPage, withBrowser } from './html-browser-capture.mjs';

test('capture composes editable nested iframe content at the scrolled viewport position', {
  skip: process.env.DSH_E2E_CHROME !== '1',
}, async () => {
  const htmlBytes = Buffer.from(`<!doctype html><body style="margin:0">
    <header>Workspace shell</header>
    <iframe id="main" style="position:absolute;left:100px;top:80px;width:240px;height:210px;border:2px solid"
      srcdoc="<body style='margin:0'><p style='margin:0'>Business dashboard</p>
      <iframe id='nested' style='position:absolute;left:25px;top:55px;width:180px;height:100px;border:0'
      srcdoc=&quot;<body style='margin:0'><div style='height:80px'></div><main>Inner request</main><div style='height:190px'></div>&quot;></iframe>">
    </iframe>
  </body>`);
  const viewport = { width: 640, height: 480 };
  await withBrowser({ htmlBytes, viewport }, async (page, network, url) => {
    await renderPage(page, network, url, viewport, { timeoutMs: 10000, preserveViewport: true });
    await page.evaluate("document.querySelector('#main').contentDocument.querySelector('#nested').contentWindow.scrollTo(0, 60)");
    const { snapshot } = await captureCurrentPage(page, viewport, viewport.height, [], {
      includeFrames: true, pixelMedia: false,
    });
    const root = JSON.parse(snapshot).root;
    const walk = function* (node) {
      yield node;
      for (const child of node.children ?? []) yield* walk(child);
    };
    const nodes = [...walk(root)];
    assert.ok(nodes.some(node => node.text === 'Workspace shell'));
    assert.ok(nodes.some(node => node.text === 'Business dashboard'));
    const request = nodes.find(node => node.text === 'Inner request');
    assert.ok(request, 'nested iframe text remains an editable snapshot node');
    assert.ok(Math.abs(request.rect.x - 127) <= 2, JSON.stringify(request.rect));
    assert.ok(Math.abs(request.rect.y - 157) <= 3, JSON.stringify(request.rect));
    assert.equal(nodes.filter(node => node.tag === 'iframe' && node.styles?.overflow === 'hidden').length, 2);
  });
});

test('browser imports CSS SVG masks from the root and iframe as shaped paint', {
  skip: process.env.DSH_E2E_CHROME !== '1',
}, async () => {
  const { captureHtmlPage } = await import('./html-browser-capture.mjs');
  const { decodePngRgba } = await import('./png-rgba-codec.mjs');
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M0 0H10V20H0Z"/></svg>';
  const mask = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  const button = `<button aria-label="Open reports" style="display:flex;background:white"><span
    style="width:20px;height:20px;background:rgb(40,50,60);mask:url(${mask}) center/contain no-repeat"></span>Reports</button>`;
  const viewport = { width: 640, height: 480 };
  function verify(snapshot) {
    const root = JSON.parse(snapshot).root;
    const walk = function* (node) {
      yield node;
      for (const child of node.children ?? []) yield* walk(child);
    };
    const nodes = [...walk(root)];
    const icon = nodes.find(node => node.kind === 'image' && node.tag === 'span');
    assert.ok(icon, 'the SVG mask must not import as an unmasked box');
    const png = decodePngRgba(Buffer.from(icon.src.split(',')[1], 'base64'));
    const pixel = (x, y) => [...png.rgba.subarray((y * png.width + x) * 4, (y * png.width + x) * 4 + 3)];
    assert.deepEqual(pixel(4, 10), [40, 50, 60]);
    assert.deepEqual(pixel(16, 10), [255, 255, 255]);
    assert.ok(nodes.some(node => node.text === 'Reports'));
    assert.ok(nodes.some(node => node.attrs?.['aria-label'] === 'Open reports'));
  }
  const direct = await captureHtmlPage({ htmlBytes: Buffer.from(button), viewports: [viewport] });
  verify(direct.captures[0].snapshot);

  const htmlBytes = Buffer.from(`<iframe title="Application" srcdoc="${button.replaceAll('"', '&quot;')}"></iframe>`);
  const checked = await withBrowser({ htmlBytes, viewport }, async (page, network, url) => {
    await renderPage(page, network, url, viewport, { timeoutMs: 10000, preserveViewport: true });
    const capture = await captureCurrentPage(page, viewport, viewport.height, [], {
      includeFrames: true, pixelMedia: true,
    });
    verify(capture.snapshot);
    return true;
  });
  assert.equal(checked, true);
});

test('standalone capture preserves inline SVG masks below the PNG decoder height limit', {
  skip: process.env.DSH_E2E_CHROME !== '1',
}, async () => {
  const { captureHtmlPage } = await import('./html-browser-capture.mjs');
  const { decodePngRgba } = await import('./png-rgba-codec.mjs');
  const result = await captureHtmlPage({
    htmlBytes: Buffer.from(`<body style="margin:0;background:white">
      <div style="height:4500px"></div>
      <svg width="20" height="20" style="display:block" xmlns="http://www.w3.org/2000/svg">
        <defs><mask id="half"><rect width="10" height="20" fill="white"/></mask></defs>
        <rect width="20" height="20" fill="red" mask="url(#half)"/>
      </svg>
    </body>`),
    viewports: [{ width: 640, height: 480 }],
  });
  const [capture] = result.captures;
  assert.ok(!capture.warnings.some(warning => warning.includes('mask pixels skipped')));
  const icon = JSON.parse(capture.snapshot).root.children.find(node => node.tag === 'svg');
  assert.equal(icon.kind, 'image');
  assert.equal(icon.rect.y, 4500);
  assert.ok(!icon.d, 'a vector approximation would bypass the masked pixels');
  const png = decodePngRgba(Buffer.from(icon.src.split(',')[1], 'base64'));
  assert.deepEqual([...png.rgba.subarray(4 * 4, 4 * 4 + 4)], [255, 0, 0, 255]);
  assert.deepEqual([...png.rgba.subarray(16 * 4, 16 * 4 + 4)], [255, 255, 255, 255]);
});

test('captures a displayed non-CORS SVG in a frame as an offline PNG', {
  skip: process.env.DSH_E2E_CHROME !== '1',
}, async t => {
  const { createServer } = await import('node:http');
  const { once } = await import('node:events');
  const { decodePngRgba } = await import('./png-rgba-codec.mjs');
  const { convertSnapshotToDocument } = await import('./engine-session.mjs');
  const { startNodeHost } = await import('./node-host.mjs');
  const { callOpenPencilMcp } = await import('./managed-mcp-client.mjs');
  const { fileURLToPath } = await import('node:url');
  const server = createServer((_request, response) => {
    response.setHeader('Content-Type', 'image/svg+xml');
    response.end('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect x="1" y="1" width="18" height="18" fill="#235795"/></svg>');
  }).listen(0, '127.0.0.1');
  t.after(() => { if (server.listening) return new Promise(resolve => server.close(resolve)); });
  await once(server, 'listening');
  const src = `http://127.0.0.1:${server.address().port}/brand`;
  const markup = `<button style="display:flex" aria-label="Open project"><img width="20" height="20" src="${src}">Projects</button>`;
  const viewport = { width: 640, height: 480 };
  const checked = await withBrowser({
    htmlBytes: Buffer.from(`<iframe title="Project" srcdoc="${markup.replaceAll('"', '&quot;')}"></iframe>`), viewport,
  }, async (page, network, url) => {
    await renderPage(page, network, url, viewport, { timeoutMs: 10000, preserveViewport: true });
    const capture = await captureCurrentPage(page, viewport, viewport.height, [], { includeFrames: true, pixelMedia: true });
    const walk = function* (node) {
      yield node;
      for (const child of node.children ?? []) yield* walk(child);
    };
    const nodes = [...walk(JSON.parse(capture.snapshot).root)];
    const logo = nodes.find(node => node.kind === 'image' && node.tag === 'img');
    assert.match(logo.src, /^data:image\/png;base64,/);
    const png = decodePngRgba(Buffer.from(logo.src.split(',')[1], 'base64'));
    assert.deepEqual([png.width, png.height], [40, 40]);
    assert.deepEqual([...png.rgba.subarray(0, 4)], [0, 0, 0, 0]);
    const center = (20 * png.width + 20) * 4;
    assert.deepEqual([...png.rgba.subarray(center, center + 4)], [35, 87, 149, 255]);
    assert.ok(nodes.some(node => node.attrs?.['aria-label'] === 'Open project'));
    assert.ok(!capture.warnings.some(warning => warning.includes('pixels skipped')));
    return capture.snapshot;
  });
  assert.ok(checked);
  await new Promise(resolve => server.close(resolve));
  const converted = await convertSnapshotToDocument({ snapshot: checked });
  const host = await startNodeHost({
    document: converted.document, headless: true,
    webRoot: fileURLToPath(new URL('web-bundle/', import.meta.url)),
    canvaskitRoot: fileURLToPath(new URL('web-bundle/canvaskit/', import.meta.url)),
  });
  t.after(() => host.close());
  const shot = await callOpenPencilMcp({
    baseUrl: host.baseUrl, token: host.token, tool: 'get_screenshot',
    arguments: { nodeId: converted.document.children[0].id, isolate: true, scale: 1 },
    timeoutMs: 30000,
  });
  assert.equal(shot.value.renderer, 'canvaskit-headless');
  const { rgba } = decodePngRgba(shot.images[0].bytes);
  let retained = 0;
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i] === 35 && rgba[i + 1] === 87 && rgba[i + 2] === 149 && rgba[i + 3] === 255)
      retained++;
  }
  assert.ok(retained >= 300, 'the imported asset remains painted with its server closed');
});
