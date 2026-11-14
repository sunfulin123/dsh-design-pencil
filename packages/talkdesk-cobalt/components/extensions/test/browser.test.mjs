import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
test('upgraded WFM controls work together in a real browser', { timeout: 60000 }, async () => {
  const server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('../demo/', import.meta.url)),
    server: { host: '127.0.0.1', port: 0 },
  });
  await server.listen();
  let browser;
  try {
    browser = await chromium.launch({
      executablePath:
        process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true,
    });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`, {
      waitUntil: 'networkidle',
    });
    await page.getByRole('radio', { name: 'Beta' }).click();
    await page.waitForFunction(
      () => document.querySelector('output[aria-label="Selection"]')?.textContent === 'b',
    );
    await page.getByRole('textbox').fill('Saved notes');
    await page.waitForFunction(
      () =>
        document.querySelector('output[aria-label="Notes value"]')?.textContent === 'Saved notes',
    );
    await page.getByRole('button', { name: 'Open details' }).click();
    await page.getByRole('dialog', { name: 'Details', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Close details' }).click();
    await page.getByRole('dialog', { name: 'Details', exact: true }).waitFor({ state: 'hidden' });
    await page.setViewportSize({ width: 360, height: 800 });
    const overflow = await page.locator('html').evaluate((html) => html.scrollWidth > innerWidth);
    assert.equal(overflow, false);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await server.close();
  }
});
