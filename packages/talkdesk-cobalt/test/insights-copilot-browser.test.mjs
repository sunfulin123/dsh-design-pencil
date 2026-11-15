/** Verify native split actions and Copilot chat in the rendered Insights recipe. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { serveStatic } from './static-server.mjs';

test('Insights split actions and Copilot support themes, keyboard and narrow windows', { timeout: 90000 }, async t => {
  const server = await serveStatic(fileURLToPath(new URL('../site/dist', import.meta.url)));
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  t.after(async () => { await browser.close(); await server.close(); });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(6000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const scheme of ['light', 'dark']) {
    const url = new URL(process.env.SYNAPSE_INSIGHTS_REVIEW_URL ?? `${server.url}/demos/?entry=recipes/echart-insights.tsx`);
    url.searchParams.set('scheme', scheme);
    await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.getByTestId('insights-chart').locator('canvas').waitFor({ timeout: 30000 });
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-component="EchartInsights"]')).getPropertyValue('--primary-7').trim());
    await page.evaluate(() => document.fonts.ready);
    const split = page.getByRole('group', { name: 'Export insights actions', exact: true });
    await split.waitFor();
    const heading = await page.getByRole('heading', { name: 'Insights', exact: true }).boundingBox();
    const actions = await page.getByTestId('insights-header-actions').boundingBox();
    assert.ok(actions.x > heading.x + heading.width && Math.abs(actions.y + actions.height / 2 - heading.y - heading.height / 2) <= 1, 'Header actions stay to the right and centered at desktop width');
    assert.match(await split.getAttribute('class'), /co-split-button/);
    const ask = page.getByRole('button', { name: 'Ask Copilot', exact: true });
    const askBounds = await ask.boundingBox();
    const splitBounds = await split.boundingBox();
    assert.ok(askBounds.x + askBounds.width <= splitBounds.x, 'Transparent Ask Copilot precedes Export');
    assert.equal(await ask.evaluate(node => getComputedStyle(node).backgroundColor), 'rgba(0, 0, 0, 0)');
    const exportButton = split.getByRole('button', { name: 'Export', exact: true });
    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    assert.equal((await downloadPromise).suggestedFilename(), 'insights-summary.csv');
    const options = split.getByRole('button', { name: 'More export options', exact: true });
    await options.focus();
    await options.press('Enter');
    const popover = page.getByRole('dialog', { name: 'Insight export options', exact: true });
    await popover.waitFor();
    assert.equal(await options.getAttribute('aria-expanded'), 'true');
    await page.screenshot({ path: `/private/tmp/cobalt-insights-export-${scheme}.png`, animations: 'disabled' });
    await popover.press('Escape');
    await popover.waitFor({ state: 'hidden' });
    await page.waitForFunction(node => document.activeElement === node, await options.elementHandle());
    await options.click();
    await popover.waitFor();
    const jsonDownload = page.waitForEvent('download');
    await popover.getByRole('button', { name: 'Download JSON', exact: true }).click();
    const downloaded = await jsonDownload;
    assert.equal(downloaded.suggestedFilename(), 'insights-summary.json');
    const snapshot = JSON.parse(await readFile(await downloaded.path(), 'utf8'));
    assert.equal(snapshot.date, '2026-11-15');
    assert.equal(snapshot.agents.length, 37);
    await popover.waitFor({ state: 'hidden' });

    await ask.click();
    const panel = page.getByRole('dialog', { name: 'Insights Copilot', exact: true });
    await panel.waitFor();
    // Measure messages only after the native panel entrance transform settles.
    await page.waitForFunction(() => {
      const box = document.querySelector('[data-testid="insights-copilot-panel"]')?.getBoundingClientRect();
      return box && box.left >= 0 && Math.abs(box.right - innerWidth) <= 1;
    });
    assert.equal(await panel.locator('.insights-copilot-avatar[class*="co-avatar"]').count(), 1);
    const input = panel.getByRole('textbox', { name: 'Message Copilot', exact: true });
    await input.fill('hi');
    await input.press('Enter');
    const sent = panel.locator('[class*="co-chat-bubble--sent"]').first();
    const short = await sent.boundingBox();
    const transcript = await panel.getByRole('log', { name: 'Copilot conversation', exact: true }).boundingBox();
    assert.ok(short.width < 100 && short.x > transcript.x + transcript.width / 2, 'Short sent bubble hugs content on the right');
    const avatar = await panel.getByTestId('insights-copilot-user-avatar').first().boundingBox();
    assert.ok(avatar.x > short.x + short.width, 'Sent-message avatar follows the bubble');
    await input.fill('Explain the peak');
    await input.press('Enter');
    await panel.getByText('Explain the peak', { exact: true }).waitFor();
    await panel.getByText(/Sample insight: both predicted metrics/).last().waitFor();
    assert.equal(await input.inputValue(), '');
    await input.fill('First line');
    await input.press('Shift+Enter');
    await input.press('A');
    assert.match(await input.inputValue(), /\n/);
    await input.fill('x'.repeat(130));
    assert.equal((await input.inputValue()).length, 120);
    await input.fill('');
    assert.equal(await panel.getByRole('button', { name: 'Send message', exact: true }).isDisabled(), true);
    for (const width of [360, 390, 640, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      // Native panel entry/resize motion must settle before reading its painted bounds.
      await page.waitForFunction(() => {
        const box = document.querySelector('[data-testid="insights-copilot-panel"]')?.getBoundingClientRect();
        return box && box.left >= -1 && box.right <= innerWidth + 1;
      });
      const geometry = await panel.evaluate(node => {
        const box = node.getBoundingClientRect();
        const composer = node.querySelector('[data-testid="insights-copilot-composer"]').getBoundingClientRect();
        return { left: box.left, right: box.right, bottom: composer.bottom, width: innerWidth, height: innerHeight, page: document.documentElement.scrollWidth };
      });
      assert.ok(geometry.left >= -1 && Math.abs(geometry.right - width) <= 1 && geometry.bottom <= geometry.height + 1 && geometry.page <= width + 1, JSON.stringify(geometry));
      const sentBounds = await sent.boundingBox();
      const userAvatar = await panel.getByTestId('insights-copilot-user-avatar').first().boundingBox();
      assert.ok(sentBounds.width < 100 && userAvatar.x > sentBounds.x + sentBounds.width, 'Sent bubbles keep intrinsic width and right-side avatars');
      await page.screenshot({ path: `/private/tmp/cobalt-insights-copilot-${scheme}-${width}.png`, animations: 'disabled' });
    }
    await input.fill('x'.repeat(120));
    await input.press('Enter');
    const long = panel.locator('[class*="co-chat-bubble--sent"]').last();
    await long.getByText('x'.repeat(120), { exact: true }).waitFor();
    const longBox = await long.boundingBox();
    assert.ok(longBox.width <= transcript.width && longBox.height > 44, 'Long unbroken messages wrap within the transcript');
    await panel.getByRole('button', { name: 'Close Copilot', exact: true }).click();
    await panel.waitFor({ state: 'hidden' });
    await page.waitForFunction(node => document.activeElement === node, await ask.elementHandle());
    const bounds = await ask.boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 1441);
  }
  assert.deepEqual(errors, []);
});
