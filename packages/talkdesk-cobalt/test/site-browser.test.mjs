import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serveStatic } from './static-server.mjs';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { readFile, readdir, access } from 'node:fs/promises';

const root = fileURLToPath(new URL('../site/dist/', import.meta.url));
const registry = JSON.parse(await readFile(new URL('../registry/authoring.json', import.meta.url)));

test('every generated documentation and recipe page is reachable from navigation', async () => {
  const html = await readFile(root + 'index.html', 'utf8');
  const sidebar = html.match(/<aside[\s\S]*?<\/aside>/)?.[0];
  assert.ok(sidebar);
  const links = new Set([...sidebar.matchAll(/href="([^"]+)"/g)].map((match) => match[1]));
  for (const file of await readdir(root + 'reference', { recursive: true })) {
    if (!file.endsWith('/index.html')) continue;
    const document = await readFile(root + 'reference/' + file, 'utf8');
    const redirect = document.match(/http-equiv="refresh" content="[^"]*url=([^"]+)"/i)?.[1];
    if (redirect) {
      assert.ok(links.has(redirect), file + ' redirects to a canonical navigation item');
    } else assert.ok(links.has('/reference/' + file.replace(/index.html$/, '')), file);
  }
  for (const href of links) await access(root + href.replace(/^\//, '') + 'index.html');
});

test(
  'documentation shell supports navigation, persistent appearance and accessible mobile controls',
  { timeout: 90000 },
  async (t) => {
    const server = await serveStatic(root.replace(/\/$/, ''));
    const browser = await chromium.launch({
      executablePath:
        process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true,
    });
    t.after(async () => {
      await browser.close();
      await server.close();
    });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(server.url);
    await page.getByRole('heading', { name: 'Cobalt design library', exact: true }).waitFor();
    const layout = await page.evaluate(() => ({
      header: document.querySelector('.docs-header').getBoundingClientRect().height,
      sidebar: document.querySelector('.docs-sidebar').getBoundingClientRect().width,
      main: document.querySelector('.docs-main').getBoundingClientRect().x,
    }));
    assert.deepEqual(layout, { header: 64, sidebar: 272, main: 272 });
    await page
      .getByRole('searchbox', { name: 'Search documentation' })
      .fill('components/extensions/basictable');
    const sidebar = page.locator('#docs-sidebar');
    assert.equal(await sidebar.locator('li:not([hidden])').count(), 1);
    await sidebar.getByRole('link', { name: 'BasicTable', exact: true }).click();
    await page.getByRole('heading', { name: 'BasicTable', exact: true }).waitFor();
    assert.ok((await page.locator('iframe').count()) >= 12);
    await page.getByRole('combobox', { name: 'Color scheme', exact: true }).selectOption('dark');
    await page.frameLocator('iframe').first().locator('html[data-co-colorscheme="dark"]').waitFor();
    await page.getByLabel('Choose accent color', { exact: true }).click();
    await page.getByRole('button', { name: 'Blue accent', exact: true }).click();
    assert.equal(await page.locator('html').getAttribute('data-accent'), 'blue');
    await page.locator('[data-demo-scheme]').first().selectOption('light');
    await page
      .frameLocator('iframe')
      .first()
      .locator('html[data-co-colorscheme="light"]')
      .waitFor();
    assert.equal(await page.locator('html').getAttribute('data-scheme'), 'dark');
    await page.getByRole('tab', { name: 'Code', exact: true }).first().click();
    assert.match(
      await page.locator('.example-source:not([hidden]) pre').first().textContent(),
      /components\/extensions\/src/,
    );
    await page.getByRole('tab', { name: 'Code', exact: true }).first().press('ArrowLeft');
    assert.equal(
      await page
        .getByRole('tab', { name: 'Preview', exact: true })
        .first()
        .getAttribute('aria-selected'),
      'true',
    );
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('data-accent'), 'blue');
    assert.equal(await page.locator('html').getAttribute('data-scheme'), 'dark');
    await page.getByRole('combobox', { name: 'Color scheme', exact: true }).selectOption('light');
    assert.equal(await page.locator('html').getAttribute('data-scheme'), 'light');
    await page
      .frameLocator('iframe')
      .first()
      .locator('html[data-co-colorscheme="light"]')
      .waitFor();
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.getByRole('combobox', { name: 'Color scheme', exact: true }).selectOption('system');
    await page.waitForFunction(() => document.documentElement.dataset.scheme === 'dark');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForFunction(() => document.documentElement.dataset.scheme === 'light');
    await sidebar
      .locator('summary')
      .filter({ hasText: /^Recipes/ })
      .click();
    await sidebar.getByRole('link', { name: 'Users list with extensions', exact: true }).click();
    await page.getByRole('heading', { name: 'Users list with extensions', exact: true }).waitFor();
    for (const width of [1024, 820, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
        `overflow at ${width}`,
      );
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
    const drawer = page.getByRole('dialog', { name: 'Documentation navigation', exact: true });
    await drawer.waitFor();
    await page.keyboard.press('Shift+Tab');
    assert.equal(
      await drawer.evaluate((element) => element.contains(document.activeElement)),
      true,
      JSON.stringify(await page.evaluate(() => ({ active: document.activeElement?.outerHTML }))),
    );
    await page.keyboard.press('Escape');
    await drawer.waitFor({ state: 'hidden' });
    await page.keyboard.press('Control+k');
    await drawer.waitFor();
    await page.getByRole('searchbox').fill('nothing-matches-this-query');
    await page.getByText('No matching pages. Try a component name.', { exact: true }).waitFor();
    await page.keyboard.press('Escape');
    assert.deepEqual(errors, []);
  },
);

test(
  'all migrated examples and recipes render without browser exceptions',
  { timeout: 240000 },
  async (t) => {
    const server = await serveStatic(root.replace(/\/$/, ''));
    const browser = await chromium.launch({
      executablePath:
        process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true,
    });
    t.after(async () => {
      await browser.close();
      await server.close();
    });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const base = server.url + '/demos/';
    for (const entry of [...registry.examples, ...registry.recipes]) {
      errors.length = 0;
      await page.goto(base + '?entry=' + encodeURIComponent(entry.path), {
        waitUntil: 'domcontentloaded',
      });
      await page
        .waitForFunction(() => document.querySelector('#root')?.childElementCount > 0, null, {
          timeout: 5000,
        })
        .catch((error) => {
          throw new Error(entry.path + ': ' + errors.join('; ') + ': ' + error.message);
        });
      await page.waitForTimeout(70);
      assert.deepEqual(errors, [], entry.path);
    }
    await page.goto(base + '?entry=recipes/extensions/users-list.tsx&scheme=dark');
    await page.getByRole('button', { name: 'Create user', exact: true }).click();
    await page.getByRole('textbox', { name: 'Full name' }).fill('Taylor Sample');
    await page.getByRole('button', { name: 'Save user' }).click();
    await page.getByText('Taylor Sample', { exact: true }).waitFor();
    assert.equal(await page.locator('html').getAttribute('data-co-colorscheme'), 'dark');
  },
);

test(
  'ListPage reuses BasicTable and marketplace toolbars with working local interactions and states',
  { timeout: 90000 },
  async (t) => {
    const server = await serveStatic(root.replace(/\/$/, ''));
    const browser = await chromium.launch({
      executablePath:
        process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true,
    });
    t.after(async () => {
      await browser.close();
      await server.close();
    });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.setDefaultTimeout(7000);
    const url = server.url + '/demos/index.html?entry=recipes/list-page.tsx';
    await page.goto(url);
    const table = page.locator('[data-component="WFMBasicTable"]');
    await table.waitFor();
    const selectionMessage = table.getByText('Select users to perform batch actions.', { exact: true });
    await selectionMessage.waitFor();
    assert.equal(await table.locator('tbody').getByText('Select users to perform batch actions.', { exact: true }).count(), 1);
    const headerBox = await table.locator('thead').boundingBox();
    const messageBox = await selectionMessage.boundingBox();
    const firstUserBox = await table.getByRole('link').first().boundingBox();
    assert.ok(messageBox.y >= headerBox.y + headerBox.height - 1);
    assert.ok(messageBox.y + messageBox.height <= firstUserBox.y);
    await page.getByText('40 users', { exact: true }).waitFor();
    const geometry = () =>
      page.evaluate(() => ({
        top: document.querySelector('[data-testid="list-table-scroll"]').getBoundingClientRect()
          .top,
        bars: [
          ...document.querySelectorAll(
            '[data-testid="list-toolbar"], [data-testid="list-filter-toolbar"]',
          ),
        ].map((bar) => {
          const box = bar.getBoundingClientRect();
          return {
            height: box.height,
            deltas: [...bar.children].map((child) => {
              const rect = child.getBoundingClientRect();
              return Math.abs(rect.y + rect.height / 2 - box.y - box.height / 2);
            }),
          };
        }),
      }));
    const before = await geometry();
    for (const bar of before.bars) {
      assert.equal(bar.height, 48);
      assert.ok(
        bar.deltas.every((delta) => delta <= 1),
        JSON.stringify(bar),
      );
    }
    await page.getByRole('button', { name: 'Clear all', exact: true }).click();
    await page.getByText('49 users', { exact: true }).waitFor();
    assert.ok(
      Math.abs((await geometry()).top - before.top) <= 1,
      'clearing filters moves the table',
    );
    await page
      .getByRole('checkbox', { name: 'Select all users on this page', exact: true })
      .focus();
    await page.keyboard.press('Space');
    assert.equal(
      (await table
        .getByRole('checkbox')
        .filter({ hasNot: page.locator('[aria-label="Select all users on this page"]') })
        .count()) > 0,
      true,
    );
    assert.equal(await table.getByRole('checkbox', { checked: true }).count(), 16);
    await table.getByRole('link').first().click();
    await page.getByRole('dialog', { name: 'User details', exact: true }).waitFor();
    assert.equal(await page.locator('[data-component="WFMSidePanel"]').count(), 1);
    await page.getByRole('button', { name: 'Close user details', exact: true }).waitFor();
    await page.waitForFunction(() => {
      const rect = document.querySelector('[role="dialog"]')?.getBoundingClientRect();
      return rect && rect.width > 0 && rect.right <= innerWidth + 1;
    });
    assert.equal(await page.getByRole('button', { name: 'Edit', exact: true }).isDisabled(), true);
    await page.getByRole('button', { name: 'Close user details', exact: true }).click();
    await page.getByRole('dialog', { name: 'User details', exact: true }).waitFor({ state: 'hidden' });
    await table.getByRole('link').first().click();
    await page.getByRole('dialog', { name: 'User details', exact: true }).waitFor();
    await page.keyboard.press('Escape');
    await page
      .getByRole('dialog', { name: 'User details', exact: true })
      .waitFor({ state: 'hidden' });
    await table.getByText('Name', { exact: true }).click();
    await table.getByRole('link', { name: 'Finley Example 48', exact: true }).waitFor();
    await table.getByRole('button', { name: '2', exact: true }).click();
    await table.getByRole('link', { name: 'Drew Demo 46', exact: true }).waitFor();
    await page.getByRole('searchbox', { name: 'Search users', exact: true }).fill('Avery');
    await page.getByText('9 users', { exact: true }).waitFor();
    await page
      .getByRole('searchbox', { name: 'Search users', exact: true })
      .fill('nothing matches');
    await page.getByText('No users match your search or filters.', { exact: true }).waitFor();
    for (const width of [360, 640, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.getByRole('searchbox', { name: 'Search users', exact: true }).waitFor();
      // Cobalt's viewport provider updates responsive JSX after its resize observer fires.
      await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth + 1);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
        `overflow at ${width}`,
      );
      for (const bar of (await geometry()).bars) assert.equal(bar.height, 48);
    }
    for (const state of ['loading', 'empty', 'error', 'permission', 'partial']) {
      await page.goto(url + '&state=' + state + '&scheme=dark');
      await page.getByRole('heading', { name: 'Users', exact: true }).waitFor();
      if (state === 'permission')
        await page
          .getByText('You do not have permission to manage users.', { exact: true })
          .waitFor();
      else await table.waitFor();
      if (state === 'empty')
        await page.getByText(/There are no users yet|No users match/).waitFor();
      if (state === 'error')
        await page.getByText('Something went wrong', { exact: true }).waitFor();
      if (state === 'loading') assert.equal(await table.getByRole('link').count(), 0);
      if (state === 'partial') await page.getByText('1 user', { exact: true }).waitFor();
      assert.equal(await page.locator('html').getAttribute('data-co-colorscheme'), 'dark');
      assert.equal(await page.getByRole('group', { name: 'Prototype state' }).count(), 0);
    }
    assert.deepEqual(errors, []);
  },
);
