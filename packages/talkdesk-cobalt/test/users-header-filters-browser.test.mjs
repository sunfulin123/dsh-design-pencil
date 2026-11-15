/** Regress extension typography, Users filter control size and real label-to-control geometry. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { serveStatic } from './static-server.mjs';
import { fileURLToPath } from 'node:url';
async function open(t) {
  const server = await serveStatic(fileURLToPath(new URL('../site/dist', import.meta.url)));
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  t.after(async () => { await browser.close(); await server.close(); });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(process.env.SYNAPSE_USERS_REVIEW_URL ?? server.url + '/demos/?entry=recipes/list-page.tsx');
  await page.getByRole('heading', { name: 'Users', exact: true }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  return page;
}
test('Users heading and description use copied Extensions Typography', async t => {
  const page = await open(t);
  const title = page.getByRole('heading', { name: 'Users', exact: true });
  assert.equal(await title.getAttribute('data-component'), 'WFMTypography');
  const description = page.getByText('Manage users and access.', { exact: true });
  assert.equal(await description.getAttribute('data-component'), 'WFMTypography');
  const titleBounds = await title.boundingBox();
  const descriptionBounds = await description.boundingBox();
  const typography = await title.evaluate(node => ({ font: getComputedStyle(node).fontSize, line: getComputedStyle(node).lineHeight }));
  assert.deepEqual(typography, { font: '24px', line: '32px' });
  assert.ok(descriptionBounds.y - titleBounds.y - titleBounds.height <= 2.5, 'Compact title/description spacing');
});
test('Users Filters uses a 40px control aligned with search', async t => {
  const page = await open(t);
  const filter = await page.getByRole('button', { name: 'Filters', exact: true }).boundingBox();
  assert.equal(filter.height, 40);
  const search = await page.getByRole('searchbox', { name: 'Search users', exact: true }).boundingBox();
  assert.ok(Math.abs(filter.y + filter.height / 2 - search.y - search.height / 2) <= 1);
});
test('filter panel leaves 8px between Activation and the visible checkbox', async t => {
  const page = await open(t);
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Filters', exact: true });
  const label = await panel.getByText('Activation', { exact: true }).boundingBox();
  const control = await panel.locator('[class*="co-checkbox__button"]').boundingBox();
  assert.ok(control.height >= 20, `Checkbox reserves visible height: ${control.height}`);
  assert.ok(Math.abs(control.y - label.y - label.height - 8) <= 1, JSON.stringify({ label, control, gap: control.y - label.y - label.height }));
});

test('Users applied filter tags use the regular 24px size', async t => {
  const page = await open(t);
  const tag = await page.getByTestId('list-filter-toolbar').locator('[class*="co-tag--light-gray"]').boundingBox();
  assert.equal(tag.height, 24);
});
test('Users controls and panel spacing hold across schemes and viewport widths', { timeout: 90000 }, async t => {
  const page = await open(t);
  for (const scheme of ['light', 'dark']) {
    for (const width of [360, 640, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const url = new URL(page.url()); url.searchParams.set('scheme', scheme);
      await page.goto(url.href);
      await page.getByRole('heading', { name: 'Users', exact: true }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('html').getAttribute('data-co-colorscheme'), scheme);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      const trigger = page.getByRole('button', { name: 'Filters', exact: true });
      assert.equal((await trigger.boundingBox()).height, 40);
      if (width === 1440) await page.screenshot({ path: `/private/tmp/cobalt-users-header-${scheme}.png` });
      await trigger.click();
      const panel = page.getByRole('dialog', { name: 'Filters', exact: true });
      await page.waitForFunction(() => { const r = document.querySelector('[role="dialog"]')?.getBoundingClientRect(); return r && r.left >= 0 && r.right <= innerWidth + 1; });
      const label = await panel.getByText('Activation', { exact: true }).boundingBox();
      const control = await panel.locator('[class*="co-checkbox__button"]').boundingBox();
      assert.ok(control.height >= 20);
      assert.ok(Math.abs(control.y - label.y - label.height - 8) <= 1);
      if (width === 1440) await page.screenshot({ path: `/private/tmp/cobalt-users-filter-panel-${scheme}.png` });
      await panel.getByRole('button', { name: 'Close user filters', exact: true }).click();
      await panel.waitFor({ state: 'hidden' });
    }
  }
});

test('native user filters support keyboard removal and queue overflow reveals hidden values', async t => {
  const page = await open(t);
  await page.getByRole('button', { name: 'Remove Active', exact: true }).press('Enter');
  await page.getByTestId('list-filter-toolbar').getByText('None', { exact: true }).waitFor();
  const overflow = page.locator('[data-qa="user-queues-overflow"]').first();
  await overflow.press('Enter');
  const popup = page.locator('[data-qa="user-queues-popup-content"]');
  await popup.waitFor();
  assert.ok(await popup.locator('[data-qa^="user-queues-popup-"]').count() > 2);
});
