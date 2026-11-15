/** Compare generated controls to unmodified Cobalt button styling under the same loaded theme. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const url = process.env.SYNAPSE_COBALT_TEST_URL;
test('Atlas title bar uses native Cobalt colors, type and state styling in both schemes', { skip: !url, timeout: 90000 }, async t => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.waitForFunction(() => document.querySelector('#atlas-theme')?.sheet);
  await page.addStyleTag({ content: '* { transition: none !important; }' });
  const reference = await page.evaluate(() => {
    const button = document.querySelector('.ws-dock-button');
    const prefix = [...button.classList].find(name => name.endsWith('_co-button'));
    const probe = document.createElement('button');
    probe.id = 'cobalt-reference-probe';
    probe.style.cssText = 'position:fixed;bottom:10px;right:10px;opacity:0;pointer-events:none';
    document.querySelector('.ws-titlebar__frame').append(probe);
    return prefix;
  });
  const snapshot = async (type, hover = false) => page.evaluate(({ reference, type, hover }) => {
    const probe = document.getElementById('cobalt-reference-probe');
    probe.className = `${reference} ${reference}--${type} ${reference}--small`;
    probe.toggleAttribute('data-hovered', hover);
    const style = getComputedStyle(probe);
    return { background: style.backgroundColor, color: style.color, size: style.fontSize, weight: style.fontWeight };
  }, { reference, type, hover });
  const styleOf = locator => locator.evaluate(node => {
    const style = getComputedStyle(node);
    return { background: style.backgroundColor, color: style.color, size: style.fontSize, weight: style.fontWeight };
  });
  for (const scheme of ['light', 'dark']) {
    if (scheme === 'dark') {
      await page.getByTestId('user-avatar').click();
      await page.getByRole('menuitem', { name: 'Theme', exact: true }).click();
      await page.getByRole('menuitemradio', { name: 'Dark', exact: true }).click();
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.documentElement.dataset.coColorscheme === 'dark');
    }
    await page.mouse.move(600, 800);
    const normal = await snapshot('secondary');
    for (const id of ['workspace-search', 'current-status', 'user-avatar']) {
      const control = page.getByTestId(id);
      assert.equal(await control.evaluate(node => node.tagName), 'BUTTON', `${id} must reuse Atlas Button`);
      const actual = await styleOf(control);
      assert.equal(actual.background, normal.background, `${scheme}: ${id} background`);
      if (id !== 'current-status') assert.deepEqual(actual, normal, `${scheme}: ${id} typography/color`);
      await control.hover();
      assert.equal((await styleOf(control)).background, (await snapshot('secondary', true)).background, `${scheme}: ${id} hover`);
      await page.mouse.move(600, 800);
    }
    for (const id of ['current-status', 'user-avatar']) {
      await page.getByTestId(id).click();
      const primary = await snapshot('primary', true);
      assert.equal((await styleOf(page.getByTestId(id))).background, primary.background, `${scheme}: ${id} expanded`);
      await page.mouse.click(700, 850);
      await page.waitForFunction(id => document.querySelector(`[data-testid="${id}"]`).getAttribute('aria-expanded') === 'false', id);
    }
    await page.screenshot({ path: `/private/tmp/cobalt-titlebar-${scheme}-1440.png` });
  }
  assert.deepEqual(errors, []);
});
