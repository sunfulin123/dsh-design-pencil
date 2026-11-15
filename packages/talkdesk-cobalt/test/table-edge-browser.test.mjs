/** Regress square, borderless tables and page-to-table edge alignment in rendered output. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { serveStatic } from './static-server.mjs';

test('BasicTable and the full list recipe have square borderless surfaces with flush page edges', async (t) => {
  const server = await serveStatic(fileURLToPath(new URL('../site/dist', import.meta.url)));
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  t.after(async () => { await browser.close(); await server.close(); });
  const page = await browser.newPage();
  for (const scheme of ['light', 'dark']) {
    for (const width of [360, 640, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const entry of ['recipes/list-page.tsx']) {
        await page.goto(`${server.url}/demos/?entry=${entry}&scheme=${scheme}`);
        const table = page.locator('[data-component="WFMBasicTable"]');
        await table.waitFor();
        const geometry = await table.evaluate((node) => {
          const box = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          const row = node.querySelector('thead').getBoundingClientRect();
          return { left: box.left, rowLeft: row.left, width: box.width, rowWidth: row.width,
            borders: [style.borderLeftWidth, style.borderRightWidth, style.borderTopWidth, style.borderBottomWidth],
            radii: [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomLeftRadius, style.borderBottomRightRadius] };
        });
        assert.ok(geometry.borders.every((n) => parseFloat(n) === 0), JSON.stringify(geometry));
        assert.ok(geometry.radii.every((n) => parseFloat(n) === 0), JSON.stringify(geometry));
        assert.ok(Math.abs(geometry.left) <= 0.5, `${entry}: left gap ${geometry.left}`);
        assert.ok(Math.abs(geometry.rowLeft - geometry.left) <= 0.5, 'row inset');
        assert.ok(geometry.rowWidth >= geometry.width - 1, 'rows must fill or horizontally scroll within the table');
        assert.ok(geometry.width >= width - 1, 'table does not fill page');
      }
    }
  }
});
