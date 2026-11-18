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
