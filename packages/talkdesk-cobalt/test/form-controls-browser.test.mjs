/** Real browser acceptance of the source-copy form's controlled Extensions examples. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { serveStatic } from './static-server.mjs';
async function open(t, scheme = 'light', width = 1440) {
  const server = await serveStatic(fileURLToPath(new URL('../site/dist', import.meta.url)));
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  t.after(async () => {
    await browser.close();
    await server.close();
  });
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.goto(`${server.url}/demos/?entry=recipes/form-page.tsx&scheme=${scheme}`);
  await page.getByTestId('form-control-examples').waitFor();
  return page;
}
test('Form page exposes working Extensions date/time/range/checkbox/radio/multi-select controls', async (t) => {
  const page = await open(t);
  await page.locator('[data-qa="form-start-date"] input').click();
  await page.getByRole('button', { name: '16', exact: true }).first().click();
  assert.match(await page.locator('[data-qa="form-start-date"] input').inputValue(), /16/);
  await page.locator('[data-qa="form-start-time-hours"]').fill('10');
  await page.locator('[data-qa="form-start-time-minutes"]').fill('45');
  await page.getByRole('heading', { name: 'Scheduling and preferences', exact: true }).click();
  assert.equal(await page.locator('[data-qa="form-start-time-hours"]').inputValue(), '10');
  assert.equal(await page.locator('[data-qa="form-start-time-minutes"]').inputValue(), '45');
  await page.locator('[data-qa="form-availability"] input').click();
  await page.getByRole('button', { name: '17', exact: true }).first().click();
  await page.getByRole('button', { name: '20', exact: true }).first().click();
  const range = await page.locator('[data-qa="form-availability"] input').inputValue();
  assert.match(range, /17/);
  assert.match(range, /20/);
  await page.getByRole('heading', { name: 'Scheduling and preferences', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Email notifications', exact: true }).uncheck();
  await page.getByRole('checkbox', { name: 'SMS notifications', exact: true }).check();
  const radios = page.getByRole('radiogroup', { name: 'Preferred contact channel', exact: true });
  await radios.getByRole('radio', { name: 'Email', exact: true }).check();
  assert.equal(await radios.getByRole('radio', { name: 'Voice', exact: true }).isChecked(), false);
  await page.getByRole('button', { name: 'Skills', exact: true }).click();
  await page.getByPlaceholder('Search skills', { exact: true }).fill('Billing');
  await page.locator('[data-qa="form-skills-option-billing"]').click();
  await page.getByRole('heading', { name: 'Scheduling and preferences', exact: true }).click();
  await page.getByPlaceholder('Search skills', {exact:true}).waitFor({state:'hidden'});
  assert.match(await page.locator('[data-qa="form-skills"]').innerText(), /Billing/);
  await page
    .getByTestId('form-control-examples')
    .screenshot({ path: '/private/tmp/cobalt-form-control-examples.png' });
});
test('control examples remain bounded and operable in dark and phone layouts', async (t) => {
  const page = await open(t, 'dark', 390);
  await page.getByRole('checkbox', { name: 'SMS notifications', exact: true }).check();
  await page
    .getByRole('radiogroup', { name: 'Preferred contact channel', exact: true })
    .getByRole('radio', { name: 'Email', exact: true })
    .check();
  await page.getByTestId('form-control-examples').scrollIntoViewIfNeeded();
  assert.equal(await page.locator('html').evaluate((n) => n.scrollWidth > innerWidth), false);
  const date = await page.locator('[data-qa="form-start-date"]').boundingBox();
  const time = await page.locator('[data-qa="form-start-time"]').boundingBox();
  assert.equal(time.height, 40);
  assert.ok(Math.abs(date.width - time.width) <= 4);
  await page.screenshot({ path: '/private/tmp/cobalt-form-controls-dark-phone.png' });
});
