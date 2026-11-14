/** Exercise the generated shell, including visible icon geometry rather than CSS declarations. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { serveStatic } from './static-server.mjs';
import { join } from 'node:path';
const project = process.env.SYNAPSE_COBALT_TEST_PROJECT;

test('generated Dock centers default and selected icons and preserves expanded labels in both themes', { skip: !project, timeout: 60000 }, async (t) => {
  const server = await serveStatic(join(project, 'delivery'));
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  t.after(async () => { await browser.close(); await server.close(); });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(server.url);
  const app = page.getByRole('button', { name: 'Quality Center', exact: true });
  await app.waitFor();
  const measure = () => page.locator('.ws-dock-button:not(.ws-dock-button--expanded)').evaluateAll((buttons) => buttons.map((button) => {
    const icon = button.querySelector('[data-co-name="Icon"], .ws-svg, .ws-dock-icon__initials');
    if (!icon) throw new Error('Dock icon missing');
    const b = button.getBoundingClientRect(), i = icon.getBoundingClientRect();
    return { label: button.getAttribute('aria-label'), active: button.hasAttribute('data-active'),
      dx: Math.abs(b.x + b.width / 2 - i.x - i.width / 2),
      dy: Math.abs(b.y + b.height / 2 - i.y - i.height / 2) };
  }));
  for (const scheme of ['light', 'dark']) {
    if (scheme === 'dark') {
      await page.getByRole('button', { name: 'Profile menu', exact: true }).click();
      await page.getByRole('menuitem', { name: 'Theme', exact: true }).click();
      await page.getByRole('menuitemradio', { name: 'Dark', exact: true }).click();
      await page.locator('html[data-co-colorscheme="dark"]').waitFor();
    }
    for (const name of ['Quality Center', 'Home']) {
      await page.getByRole('button', { name, exact: true }).click();
      const measurements = await measure();
      assert.ok(measurements.some((icon) => icon.active));
      for (const icon of measurements) {
        assert.ok(icon.dx <= 0.5 && icon.dy <= 0.5, `${scheme}: ${JSON.stringify(icon)}`);
      }
    }
    await page.getByRole('button', { name: 'Expand', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.ws-dock-button--expanded .ws-dock-label--expanded')?.getBoundingClientRect().width > 0);
    assert.ok(await app.locator('.ws-dock-label').isVisible());
    const center = await app.evaluate((button) => {
      const icon = button.querySelector('[data-co-name="Icon"]');
      const b = button.getBoundingClientRect(), i = icon.getBoundingClientRect();
      return Math.abs(b.y + b.height / 2 - i.y - i.height / 2);
    });
    assert.ok(center <= 0.5);
    await page.getByRole('button', { name: 'Collapse', exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('.ws-dock-button--expanded'));
  }
});
