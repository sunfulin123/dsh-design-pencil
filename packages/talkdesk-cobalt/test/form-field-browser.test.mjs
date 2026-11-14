/** Measure rendered prefix/suffix geometry; code inspection cannot detect collapsed slots. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { serveStatic } from './static-server.mjs';
import { fileURLToPath } from 'node:url';

test('FormField reserves padded, centered prefix and suffix slots in both sizes and schemes', async (t) => {
  const server = await serveStatic(fileURLToPath(new URL('../site/dist', import.meta.url)));
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  t.after(async () => { await browser.close(); await server.close(); });
  const page = await browser.newPage({ viewport: { width: 640, height: 900 } });
  for (const scheme of ['light', 'dark']) {
    for (const example of ['datepicker-3', 'formfield-3']) {
      await page.goto(`${server.url}/demos/?entry=examples/extensions/${example}.tsx&scheme=${scheme}`);
      await page.locator('input').first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      const slots = await page.locator('[class*="co-group-item--min"]').evaluateAll((items) => items.map((item) => {
        const box = item.getBoundingClientRect();
        const content = item.firstElementChild.firstElementChild.getBoundingClientRect();
        return {
          size: item.parentElement.dataset.coSize,
          width: box.width,
          left: content.left - box.left,
          right: box.right - content.right,
          center: Math.abs(content.y + content.height / 2 - box.y - box.height / 2),
        };
      }));
      assert.equal(slots.length, 2, `${example}: two input slots`);
      for (const slot of slots) {
        assert.ok(slot.width >= (slot.size === 'small' ? 32 : 40), JSON.stringify(slot));
        assert.ok(slot.left >= 7 && slot.right >= 7, JSON.stringify(slot));
        assert.ok(slot.center <= 1, JSON.stringify(slot));
      }
    }
  }
});
