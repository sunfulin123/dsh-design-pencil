/** Accept the copied recipe inside a real generated Workspace iframe. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { serveStatic } from './static-server.mjs';

const project = process.env.SYNAPSE_COBALT_TEST_PROJECT;
test('Workspace navigation opens Insights and keeps Copilot inside its themed app frame', { skip: !project, timeout: 90000 }, async t => {
  const server = await serveStatic(join(project, 'delivery'));
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  t.after(async () => { await browser.close(); await server.close(); });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(server.url, { waitUntil: 'domcontentloaded' });
  const app = page.frameLocator('iframe[data-primary-frame]');
  await app.getByRole('heading', { name: 'Users', exact: true }).waitFor();
  if (await page.locator('.ws-secondary').isVisible()) await page.getByTestId('workspace-secondary-toggle').click();
  const insights = page.getByTestId('dock-button-insights');
  if (!await insights.isVisible()) await page.getByTestId('dock-action-button').click();
  await insights.click();
  await app.getByRole('heading', { name: 'Insights', exact: true }).waitFor();
  for (const scheme of ['light', 'dark']) {
    if (scheme === 'dark') {
      await page.getByRole('button', { name: 'Profile menu', exact: true }).click();
      await page.getByRole('menuitem', { name: 'Theme', exact: true }).click();
      await page.getByRole('menuitemradio', { name: 'Dark', exact: true }).click();
      await page.keyboard.press('Escape');
      await app.locator('html[data-co-colorscheme="dark"]').waitFor();
    }
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await app.getByRole('button', { name: 'Ask Copilot', exact: true }).click();
      const panel = app.getByRole('dialog', { name: 'Insights Copilot', exact: true });
      await panel.waitFor();
      await panel.getByRole('textbox', { name: 'Message Copilot', exact: true }).focus();
      // Panel travel is a native animation; observe the final bounds before accepting.
      const dialog = await panel.elementHandle();
      const frame = await dialog.ownerFrame();
      await frame.waitForFunction(node => {
        const rect = node.getBoundingClientRect();
        return rect.left >= -1 && Math.abs(rect.right - innerWidth) <= 1;
      }, dialog);
      const geometry = await panel.evaluate(node => {
        const footer = node.querySelector('footer').getBoundingClientRect();
        return { bottom: footer.bottom, height: innerHeight, page: document.documentElement.scrollWidth, width: innerWidth };
      });
      assert.ok(geometry.bottom <= geometry.height + 1 && geometry.page <= geometry.width + 1, JSON.stringify(geometry));
      await page.screenshot({ path: `/private/tmp/cobalt-insights-workspace-${scheme}-${width}.png`, animations: 'disabled' });
      await panel.getByRole('textbox', { name: 'Message Copilot', exact: true }).press('Escape');
      await panel.waitFor({ state: 'hidden' });
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await app.getByRole('button', { name: 'More export options', exact: true }).click();
    const popover = app.getByRole('dialog', { name: 'Insight export options', exact: true });
    await popover.getByRole('button', { name: 'Download CSV', exact: true }).waitFor();
    await popover.getByRole('button', { name: 'Cancel', exact: true }).click();
    await popover.waitFor({ state: 'hidden' });
  }
  assert.deepEqual(errors, []);
});
