import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fixture, serve, states } from './html-review.test-helper.mjs';

test('generic review controls resize the real page, switch states, reset and retain accessible focus', { skip: process.env.DSH_E2E_CHROME !== '1', timeout: 90000 }, async t => {
  const { chromium } = await import('playwright');
  const f = await fixture(t, process.env.DSH_HTML_REVIEW_HELPER);
  const prepared = f.run(['--states', states.join(',')]);
  assert.equal(prepared.status, 0, prepared.stderr);
  const server = await serve(f.root);
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  t.after(async () => { await browser.close(); await server.close(); });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(8000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  for (const scheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto(server.url + '/preview.html');
    const frame = page.frameLocator('iframe');
    await frame.getByRole('heading', { name: 'success', exact: true }).waitFor();
    assert.equal(await page.getByText(/Feature flags/i).count(), 0);
    await page.getByRole('button', { name: 'Window size', exact: true }).click();
    await page.getByRole('button', { name: 'Window size 360 px', exact: true }).click();
    assert.equal(await frame.locator('html').evaluate(() => innerWidth), 360);
    assert.equal(await frame.locator('.cards').evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length), 1);
    await page.getByRole('button', { name: 'Window size', exact: true }).click();
    await page.getByRole('button', { name: 'Window size Phone · 390 × 844', exact: true }).click();
    assert.deepEqual(await frame.locator('html').evaluate(() => [innerWidth, innerHeight]), [390, 844]);
    await page.getByRole('button', { name: 'Window size', exact: true }).click();
    await page.getByRole('dialog', { name: 'Window size options', exact: true }).press('Escape');
    await page.waitForFunction(() => document.activeElement === document.getElementById('size-trigger'));
    await page.getByRole('button', { name: 'Window size', exact: true }).click();
    await frame.getByRole('heading', { name: 'Project overview', exact: true }).click();
    await page.getByRole('dialog', { name: 'Window size options', exact: true }).waitFor({ state: 'hidden' });
    for (const [value, label] of [['loading','Loading'], ['empty','Empty'], ['error','Error'], ['partial','Partial'], ['permission','No access'], ['success','Ready']]) {
      await page.getByRole('button', { name: 'Page state', exact: true }).click();
      await page.getByRole('button', { name: `Page state ${label}`, exact: true }).click();
      await frame.getByRole('heading', { name: value, exact: true }).waitFor();
      assert.equal(await frame.locator('[data-prototype-state]:visible').count(), 1);
      await page.waitForFunction(() => document.activeElement === document.getElementById('state-trigger'));
    }
    await frame.getByRole('link', { name: 'Open details', exact: true }).click();
    await frame.getByRole('heading', { name: 'Project details', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Page state', exact: true }).click();
    await page.getByRole('button', { name: 'Page state Error', exact: true }).click();
    await frame.getByRole('heading', { name: 'error', exact: true }).waitFor();
    await frame.getByRole('heading', { name: 'Project details', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Reset prototype settings', exact: true }).click();
    await frame.getByRole('heading', { name: 'Project overview', exact: true }).waitFor();
    await frame.getByRole('heading', { name: 'success', exact: true }).waitFor();
    assert.equal(await page.getByTestId('prototype-size-value').innerText(), 'Fill');
    for (const width of [360,390,768,1024,1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForFunction(() => document.querySelector('iframe').getBoundingClientRect().width === document.querySelector('.prototype-stage').clientWidth);
      assert.equal(await frame.locator('html').evaluate(() => innerWidth), width);
      assert.ok(await page.locator('html').evaluate(node => node.scrollWidth <= innerWidth));
      assert.equal((await page.getByTestId('prototype-toolbar').boundingBox()).height,44);
      const trigger=page.getByTestId('prototype-size-trigger');assert.equal((await trigger.boundingBox()).height,width<=560?36:32);
      const arrow=await trigger.locator('.review-icon--chevron').boundingBox(), button=await trigger.boundingBox();
      assert.ok(Math.abs(arrow.y+arrow.height/2-button.y-button.height/2)<=1);
      await page.screenshot({ path: `/private/tmp/html-prototype-review-${scheme}-${width}.png` });
    }
  }
  await page.goto(pathToFileURL(join(f.root, 'preview.html')).href);
  await page.getByRole('button', { name: 'Page state', exact: true }).waitFor({ state: 'visible' });
  await page.waitForFunction(() => !document.getElementById('state-trigger').disabled);
  await page.getByRole('button', { name: 'Page state', exact: true }).click();
  await page.getByRole('button', { name: 'Page state Error', exact: true }).click();
  await page.frameLocator('iframe').getByRole('heading', { name: 'error', exact: true }).waitFor();
  assert.deepEqual(errors, []);
});
