/** Exercise the generated copy, including iframe geometry rather than CSS declarations alone. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { serveStatic } from './static-server.mjs';

const project = process.env.SYNAPSE_COBALT_TEST_PROJECT;
test('Atlas chrome preserves navigation, themes, geometry and recipe workflows', { skip: !project, timeout: 120000 }, async t => {
  const server = await serveStatic(join(project, 'delivery'));
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  t.after(async () => { await browser.close(); await server.close(); });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(server.url);
  const app = page.frameLocator('iframe[data-primary-frame]');
  await app.getByRole('heading', { name: 'Users', exact: true }).waitFor();
  await page.getByTestId('workspace-secondary-toggle').click();
  await page.locator('.ws-secondary').waitFor({ state: 'hidden' });

  let lightBackground;
  for (const scheme of ['light', 'dark']) {
    if (scheme === 'dark') {
      await page.getByRole('button', { name: 'Profile menu', exact: true }).click();
      await page.getByRole('menuitem', { name: 'Theme', exact: true }).click();
      await page.getByRole('menuitemradio', { name: 'Dark', exact: true }).click();
      await page.keyboard.press('Escape');
      await app.locator('html[data-co-colorscheme="dark"]').waitFor();
    }
    for (const width of [360, 390, 640, 641, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.waitForTimeout(400); // Drawer geometry settles after its 300ms transition.
      const geometry = await page.locator('.ws-window').evaluate(node => {
        const rect = element => element.getBoundingClientRect();
        const title = node.querySelector('.ws-titlebar__frame');
        const dock = node.querySelector('.ws-dock__bar');
        const main = node.querySelector('.ws-areas');
        const frame = node.querySelector('iframe[data-primary-frame]');
        const w = rect(node), m = rect(main);
        const buttons = [...node.querySelectorAll('.ws-dock-button:not(.ws-dock-button--expanded)')];
        return { titleHeight: rect(title).height, dockWidth: rect(dock).width,
          background: getComputedStyle(title).backgroundColor, dockBackground: getComputedStyle(dock).backgroundColor,
          rightGap: w.right - m.right, bottomGap: w.bottom - m.bottom,
          logoOffset: Math.abs(rect(node.querySelector(".ws-titlebar__logo")).x + 14 - rect(dock).x - 24),
          frameWidth: rect(frame).width, readout: document.querySelector('[data-testid="ws-readout"]').textContent,
          titleOverflow: rect(title).right > w.right + 1 || title.scrollWidth > title.clientWidth,
          iconOffsets: buttons.map(button => {
            const icon = button.querySelector('[data-co-name="Icon"], .ws-svg');
            if (!icon) return 0;
            const b = rect(button), i = rect(icon);
            return Math.abs(b.x + b.width / 2 - i.x - i.width / 2);
          }) };
      });
      assert.equal(geometry.titleHeight, 44);
      assert.ok(geometry.logoOffset <= 0.5, String(geometry.logoOffset));
      assert.equal(geometry.dockWidth, 48);
      assert.equal(geometry.background, geometry.dockBackground);
      assert.equal(geometry.titleOverflow, false, JSON.stringify({ width, geometry }));
      assert.ok(Math.abs(geometry.rightGap - (width <= 640 ? 0 : 10)) <= 0.5);
      assert.ok(Math.abs(geometry.bottomGap - (width <= 640 ? 0 : 10)) <= 0.5);
      assert.equal(Number(geometry.readout.match(/App (\d+)px/)[1]), Math.round(geometry.frameWidth));
      assert.ok(geometry.iconOffsets.every(offset => offset <= 0.5), JSON.stringify(geometry.iconOffsets));
      const search = page.getByTestId('workspace-search');
      await search.focus();
      assert.equal(await search.evaluate(node => node === document.activeElement), true);
      if (width <= 640) assert.equal(await search.getAttribute('role'), null);
      if (width === 1440) {
        if (scheme === 'light') lightBackground = geometry.background;
        else assert.notEqual(geometry.background, lightBackground);
      }
      await page.screenshot({ path: `/private/tmp/cobalt-atlas-chrome-${scheme}-${width}.png` });
    }
  }

  await page.getByTestId('workspace-notifications').click();
  await page.getByTestId('notification-history-panel').waitFor();
  assert.equal(await page.getByTestId('workspace-notifications').getAttribute('aria-expanded'), 'true');
  await page.getByRole('button', { name: 'Close notifications panel', exact: true }).click();
  await page.getByTestId('current-status').click();
  await page.getByRole('menu', { name: 'Status', exact: true }).waitFor();
  await page.waitForFunction(() => document.querySelector('[aria-label="Status"][role="menu"]')?.contains(document.activeElement));
  await page.keyboard.press('Escape');
  await page.getByRole('menu', { name: 'Status', exact: true }).waitFor({ state: 'hidden' });
  assert.equal(await page.getByTestId('current-status').getAttribute('aria-expanded'), 'false');

  await page.getByRole('button', { name: 'Expand', exact: true }).click();
  await page.waitForTimeout(400);
  assert.equal(await page.locator('.ws-dock__bar').evaluate(node => node.getBoundingClientRect().width), 240);
  await page.getByRole('button', { name: 'Collapse', exact: true }).click();
  await page.waitForTimeout(400);
  await page.getByTestId('dock-action-button').click();
  await page.mouse.move(800, 300);
  await page.waitForTimeout(400);
  assert.equal(await page.locator('.ws-dock--drawer-fixed').count(), 0);
  await page.locator('.ws-drawer').hover();
  await page.waitForTimeout(700);
  assert.equal(await page.locator('.ws-dock--drawer-open').count(), 1);
  await page.getByTestId('dock-action-button').click();

  await page.getByTestId('workspace-secondary-toggle').click();
  await page.locator('.ws-secondary').waitFor();
  const separator = page.getByRole('separator');
  const secondaryBefore = await page.locator('.ws-secondary').evaluate(node => node.getBoundingClientRect().width);
  await separator.focus(); await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(width => document.querySelector('.ws-secondary').getBoundingClientRect().width === width + 16, secondaryBefore);
  await page.getByTestId('workspace-secondary-toggle').click();
  await page.getByRole('button', { name: 'Routing Studio', exact: true }).click();
  await app.getByRole('heading', { name: 'Overview', exact: true }).waitFor();
  await page.getByTestId('dock-button-rules').click();
  await app.getByRole('heading', { name: 'Rules', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Admin', exact: true }).click();
  await app.getByRole('heading', { name: 'Users', exact: true }).waitFor();
  const tableGeometry = await app.locator('[data-component="WFMBasicTable"]').evaluate(node => ({ left: node.getBoundingClientRect().left, radius: getComputedStyle(node).borderTopLeftRadius }));
  assert.equal(tableGeometry.left, 0);
  assert.equal(tableGeometry.radius, '0px');
  await app.getByTestId('list-create-user').click();
  const create = app.getByRole('dialog', { name: 'New user', exact: true });
  await create.getByRole('textbox', { name: 'Full name', exact: true }).fill('Chrome Sample');
  await create.getByRole('textbox', { name: 'Email', exact: true }).fill('chrome.sample@example.com');
  await create.getByRole('button', { name: 'Create user', exact: true }).click();
  await create.waitFor({ state: 'hidden' });
  await app.getByRole('searchbox', { name: 'Search users', exact: true }).fill('Chrome Sample');
  await app.getByRole('link', { name: 'Chrome Sample', exact: true }).click();
  await app.getByRole('heading', { name: 'Chrome Sample', exact: true }).waitFor();
  await page.reload();
  await app.getByTestId('list-import').click();
  const upload = app.getByRole('dialog', { name: 'Import users', exact: true });
  await upload.locator('input[type="file"]').setInputFiles({ name: 'chrome-users.csv', mimeType: 'text/csv', buffer: Buffer.from('name,email') });
  await upload.getByRole('button', { name: 'Import file', exact: true }).click();
  await upload.waitFor({ state: 'hidden' });
  await app.getByRole('status').getByText('Selected file: chrome-users.csv', { exact: true }).waitFor();
  assert.deepEqual(errors, []);
});
