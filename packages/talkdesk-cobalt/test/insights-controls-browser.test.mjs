/** Regress the exact Insights control composition, spacing and tag geometry. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { serveStatic } from './static-server.mjs';
async function open(t) {
  const server = await serveStatic(fileURLToPath(new URL('../site/dist', import.meta.url)));
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  t.after(async () => { await browser.close(); await server.close(); });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(process.env.SYNAPSE_INSIGHTS_REVIEW_URL ?? server.url + '/demos/?entry=recipes/echart-insights.tsx');
  await page.getByTestId('insights-chart').waitFor();
  await page.evaluate(() => document.fonts.ready);
  return page;
}
test('date field and period navigation have an 8px gap', async t => {
  const page = await open(t);
  const date = await page.locator('[data-qa="insights-date"]').boundingBox();
  const input = await page.locator('[data-qa="insights-date"] input').boundingBox();
  assert.ok(date.x + date.width - input.x - input.width <= 2.5, 'Input must fill the date field');
  const previous = await page.getByRole('button', { name: 'Previous period', exact: true }).boundingBox();
  assert.ok(Math.abs(previous.x - date.x - date.width - 8) <= 1, `Date-to-navigation gap: ${previous.x - date.x - date.width}`);
});
test('time ranges use the native Cobalt SelectionGroup', async t => {
  const page = await open(t);
  assert.equal(await page.locator('[class*="co-selection-group__items"]').count(), 1);
  const group = page.getByRole('radiogroup', { name: 'Insight time range', exact: true });
  await group.getByRole('radio', { name: 'Week', exact: true }).click();
  await group.getByRole('radio', { name: 'Week', exact: true }).press('ArrowRight');
  await group.getByRole('radio', { name: 'Month', exact: true }).press('Space');
  assert.equal(await group.getByRole('radio', { name: 'Month', exact: true }).isChecked(), true);
  await group.getByRole('radio', { name: 'Month', exact: true }).click();
  assert.equal(await group.getByRole('radio', { checked: true }).count(), 1);
  const range = await group.boundingBox();
  const date = await page.locator('[data-qa="insights-date"]').boundingBox();
  assert.ok(Math.abs(range.y + range.height / 2 - date.y - date.height / 2) <= 1, 'Date and range stay on the same desktop row');
  await page.screenshot({ path: '/private/tmp/cobalt-insights-controls-light.png' });
});
test('agent filters use the copied MultiDropdown instead of a long checkbox form', async t => {
  const page = await open(t);
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Insight filters', exact: true });
  await panel.waitFor();
  assert.equal(await panel.locator('[data-component="MultiDropdown"]').count(), 1);
  const trigger = panel.getByRole('button', { name: 'Agents', exact: true });
  await trigger.click();
  await page.getByPlaceholder('Search agents', { exact: true }).fill('agent37');
  await page.locator('[data-qa="insights-agents-option-agent1"]').waitFor({ state: 'hidden' });
  const option = page.locator('[data-qa="insights-agents-option-agent37"]');
  assert.equal(await option.isChecked(), true);
  await page.screenshot({ path: '/private/tmp/cobalt-insights-agents-dropdown.png' });
  await option.click();
  await panel.getByRole('heading', { name: 'Insight filters', exact: true }).click();
  await panel.getByRole('button', { name: 'Apply filters', exact: true }).click();
  await panel.waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: 'Show 33 more agents', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await trigger.click();
  await page.locator('[data-qa="insights-agents-option-agent1"]').click();
  await panel.getByRole('button', { name: 'Close insight filters', exact: true }).click();
  await panel.waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: 'Show 33 more agents', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Remove agent1', exact: true }).click();
  await page.getByRole('button', { name: 'Show 32 more agents', exact: true }).waitFor();
});
test('overflow count and selected filters use the same medium Tag height', async t => {
  const page = await open(t);
  const heights = await page.getByTestId('insights-applied-filters').evaluate(node => {
    const chip = node.querySelector('[class*="co-tag--medium"]');
    const count = node.querySelector('[aria-label="Show 34 more agents"]');
    return { chip: chip.getBoundingClientRect().height, count: count.getBoundingClientRect().height };
  });
  assert.ok(Math.abs(heights.chip - heights.count) <= 0.5, JSON.stringify(heights));
});
test('applied insight labels, agents, overflow and clear action remain on one row', async t => {
  const page = await open(t);
  for (const scheme of ['light', 'dark']) {
    for (const width of [1440, 990, 640, 331]) {
      await page.setViewportSize({ width, height: 900 });
      const url = new URL(page.url()); url.searchParams.set('scheme', scheme); await page.goto(url.href);
      const toolbar = page.getByTestId('insights-applied-filters');
      await toolbar.getByRole('button', { name: 'Show 34 more agents', exact: true }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      const geometry = await toolbar.evaluate(node => {
        const boxes = [node.querySelector('p'), ...node.querySelectorAll('[data-testid="insights-agent-tag"], [data-testid="insights-agent-overflow"]'), [...node.querySelectorAll('button')].at(-1)].map(n => n.getBoundingClientRect());
        return { height: node.getBoundingClientRect().height, centers: boxes.map(r => r.y + r.height / 2), width: document.documentElement.scrollWidth, viewport: innerWidth };
      });
      assert.equal(geometry.height, 48, JSON.stringify({scheme, width, geometry}));
      assert.ok(Math.max(...geometry.centers) - Math.min(...geometry.centers) <= 1, JSON.stringify(geometry));
      assert.ok(geometry.width <= geometry.viewport + 1);
      if (width === 990) await page.screenshot({path: `/private/tmp/insights-filter-row-${scheme}.png`});
    }
  }
});
