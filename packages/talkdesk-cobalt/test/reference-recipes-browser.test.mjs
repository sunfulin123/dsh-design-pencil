/** Real Cobalt/ECharts rendering and bounded schedule interactions for copied recipes. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { serveStatic } from './static-server.mjs';
async function open(t, entry, width = 1440, scheme = 'light') {
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
  page.on('pageerror', (e) => errors.push(e.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.goto(`${server.url}/demos/?entry=recipes/${entry}.tsx&scheme=${scheme}`);
  await page.locator('#root > *').waitFor();
  await page.evaluate(() => document.fonts.ready);
  return page;
}
test('card widgets include every supplied pattern and support local edit checkpoints', async (t) => {
  const p = await open(t, 'card-widgets');
  for (const text of [
    'Service Level',
    '85%',
    '02:17',
    '02:33',
    '00:00',
    'Count of Agents Logged-In',
    'Live Contacts (Inbound)',
    'Special Template',
    'Intent',
    'Summarization',
    'Overall Customer Sentiment',
    'Top Saved Search Keywords',
  ])
    assert.ok(await p.getByText(text, { exact: true }).count(), text);
  assert.ok(await p.getByText(/Shifts distribution/).count());
  assert.equal(await p.locator('canvas').count(), 3);
  await p.getByRole('button', { name: 'Delete Service Level', exact: true }).click();
  assert.equal(await p.getByText('Service Level', { exact: true }).count(), 0);
  await p.getByRole('button', { name: 'Discard', exact: true }).click();
  await p.getByText('Service Level', { exact: true }).waitFor();
  await p.getByRole('button', { name: 'Add widget', exact: true }).click();
  await p.getByLabel('Widget title', { exact: true }).fill('Sample metric');
  await p.getByRole('button', { name: 'Save widget', exact: true }).click();
  await p.getByText('Sample metric', { exact: true }).waitFor();
  await p.getByRole('button', { name: 'Done', exact: true }).click();
  await p.getByRole('button', { name: 'Edit dashboard', exact: true }).click();
  await p.getByRole('button', { name: 'Delete Sample metric', exact: true }).click();
  await p.getByRole('button', { name: 'Discard', exact: true }).click();
  await p.getByText('Sample metric', { exact: true }).waitFor();
  await p.screenshot({ path: '/private/tmp/cobalt-card-widgets-light.png' });
});
test('ECharts gallery renders three independent themed canvases and restores removed charts', async (t) => {
  const p = await open(t, 'echarts-gallery', 1440, 'dark');
  await p.locator('[data-testid="chart-comparison"] canvas').waitFor();
  assert.equal(await p.locator('canvas').count(), 3);
  for (const kind of ['predicted', 'forecast', 'comparison']) {
    assert.ok(await p.getByTestId('chart-' + kind).getAttribute('aria-label'));
  }
  await p.getByRole('button', { name: 'Remove forecast chart', exact: true }).click();
  assert.equal(await p.locator('canvas').count(), 2);
  await p.getByRole('button', { name: 'Reset charts', exact: true }).click();
  await p.getByTestId('chart-forecast').locator('canvas').waitFor();
  assert.equal(await p.locator('html').getAttribute('data-co-colorscheme'), 'dark');
  await p.screenshot({ path: '/private/tmp/cobalt-echarts-gallery-dark.png' });
});
test('Team Schedule matches reference dimensions, pins pagination and creates editable events', async (t) => {
  const p = await open(t, 'team-schedule', 2236);
  assert.equal(await p.locator('.schedule-hours [role="columnheader"]').count(), 25);
  assert.equal(await p.locator('.schedule-metric-label').count(), 6);
  assert.equal(await p.locator('.schedule-agent-row').count(), 25);
  const geometry = await p.evaluate(() => {
    const r = (s) => document.querySelector(s).getBoundingClientRect();
    return {
      left: r('.schedule-agent').width,
      row: r('.schedule-agent-row').height,
      footer: r('.schedule-pagination').bottom,
      header: r('.schedule-header').height,
      filters: r('.schedule-filters').height,
      color: getComputedStyle(document.querySelector('[data-testid="schedule-event-alex-work"]'))
        .backgroundColor,
      eventHeight: r('[data-testid="schedule-event-alex-work"]').height,
    };
  });
  assert.equal(geometry.left, 306);
  assert.equal(geometry.row, 60);
  assert.equal(geometry.header, 104);
  assert.equal(geometry.filters, 48);
  assert.equal(geometry.footer, 1000);
  assert.equal(geometry.color, 'rgb(16, 176, 0)');
  assert.equal(geometry.eventHeight, 46);
  await p.getByTestId('schedule-scroll').evaluate((n) => (n.scrollTop = 800));
  assert.equal((await p.getByTestId('schedule-pagination').boundingBox()).y, 944);
  await p.getByRole('button', { name: 'Add event', exact: true }).click();
  const panel = p.getByRole('dialog', { name: 'Add event', exact: true });
  await panel.getByLabel('Event title', { exact: true }).fill('Review meeting');
  await panel.getByRole('button', { name: 'Save event', exact: true }).click();
  await p.getByTestId('schedule-scroll').evaluate((n) => (n.scrollTop = 0));
  await p.getByRole('button', { name: /Andre Simoes: Review meeting/ }).click();
  const edit = p.getByRole('dialog', { name: 'Edit event', exact: true });
  await edit.getByRole('button', { name: 'Delete event', exact: true }).click();
  assert.equal(await p.getByRole('button', { name: /Andre Simoes: Review meeting/ }).count(), 0);
  await p.getByPlaceholder('Search by agent', { exact: true }).fill('Carmen');
  assert.equal(await p.locator('.schedule-agent-row').count(), 1);
  await p.getByText('Carmen Cortes', { exact: true }).waitFor();
  await p.getByPlaceholder('Search by agent', { exact: true }).fill('');
  await p.getByRole('button', { name: /^Filters/ }).click();
  const filters = p.getByRole('dialog', { name: 'Schedule filters', exact: true });
  await filters.getByRole('button', { name: 'Clear selection', exact: true }).click();
  await filters.getByRole('button', { name: 'Apply filters', exact: true }).click();
  assert.equal(
    await p.getByRole('grid', { name: 'Selected schedule agents' }).getByRole('row').count(),
    0,
  );
  await p.getByRole('dialog').waitFor({ state: 'hidden' });
  await p.screenshot({ path: '/private/tmp/cobalt-team-schedule-light.png' });
});
test('new recipes contain overflow at narrow widths and keep schedule footer visible in dark mode', async (t) => {
  const p = await open(t, 'team-schedule', 390, 'dark');
  for (const width of [331, 390, 640, 1125, 1440]) {
    await p.setViewportSize({ width, height: 1000 });
    const g = await p.evaluate(() => ({
      page: document.documentElement.scrollWidth,
      footer: document.querySelector('.schedule-pagination').getBoundingClientRect().bottom,
      scroll: document.querySelector('.schedule-scroll').scrollWidth,
    }));
    assert.ok(g.page <= width, JSON.stringify(g));
    assert.ok(g.footer <= 1000);
    assert.ok(g.scroll >= 1746);
    assert.ok(
      (await p.getByPlaceholder('Search by agent', { exact: true }).boundingBox()).width >= 140,
      'Search stays readable inside the shell frame',
    );
    assert.ok(await p.getByText('Clear all', { exact: true }).isVisible());
  }
  await p.setViewportSize({ width: 390, height: 1000 });
  await p.screenshot({ path: '/private/tmp/cobalt-team-schedule-dark-390.png' });
  for (const entry of ['card-widgets', 'echarts-gallery']) {
    await p.goto(new URL(`?entry=recipes/${entry}.tsx&scheme=dark`, p.url()).href);
    await p.locator('canvas').first().waitFor();
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), entry);
  }
});

test('phone timeline can reveal agent rows below the hour header', async (t) => {
  const p = await open(t, 'team-schedule', 331, 'dark');
  await p.setViewportSize({ width: 331, height: 798 });
  await p.getByTestId('schedule-scroll').evaluate((n) => (n.scrollTop = 500));
  const reachable = await p.locator('.schedule-agent-row a').evaluateAll((links) => {
    const box = document.querySelector('.schedule-scroll').getBoundingClientRect();
    return links.some((link) => {
      const r = link.getBoundingClientRect(),
        x = r.x + r.width / 2,
        y = r.y + r.height / 2;
      return (
        y > box.top + 46 && y < box.bottom && document.elementFromPoint(x, y)?.closest('a') === link
      );
    });
  });
  assert.equal(reachable, true, 'Metrics must scroll away to leave room for phone agent rows');
});

test('reference pages keep scrolling inside their content with no trailing document', async (t) => {
  const p = await open(t, 'card-widgets');
  for (const entry of ['card-widgets', 'echarts-gallery']) {
    await p.goto(new URL(`?entry=recipes/${entry}.tsx`, p.url()).href);
    await p.locator('canvas').first().waitFor();
    const geometry = await p.locator('.widget-page-content').evaluate((n) => {
      n.scrollTop = n.scrollHeight;
      const last = n.lastElementChild.getBoundingClientRect();
      return {
        document: document.documentElement.scrollHeight,
        viewport: innerHeight,
        tail: n.getBoundingClientRect().bottom - last.bottom,
        scroll: n.scrollTop,
      };
    });
    assert.ok(geometry.document <= geometry.viewport + 1, JSON.stringify(geometry));
    assert.ok(geometry.tail <= 25);
    assert.ok(geometry.scroll > 0);
  }
});
test('schedule uses a native wrapping Toolbar, badge anchors and searchable timezone template', async (t) => {
  const p = await open(t, 'team-schedule', 1125);
  assert.equal(await p.getByRole('button', { name: 'Select', exact: true }).count(), 0);
  assert.equal(await p.getByText('Show intraday adherence', { exact: true }).count(), 0);
  const toolbar = p.getByRole('toolbar', { name: 'Schedule controls', exact: true });
  await toolbar.waitFor();
  const centers = await toolbar
    .locator('[data-qa="schedule-date"], [data-qa="schedule-search"], button[aria-label="Filters"]')
    .evaluateAll((nodes) =>
      nodes.map((n) => {
        const r = n.getBoundingClientRect();
        return r.y + r.height / 2;
      }),
    );
  assert.equal(centers.length, 3);
  assert.ok(Math.max(...centers) - Math.min(...centers) <= 1);
  for (const width of [331, 640, 1125, 1440]) {
    await p.setViewportSize({ width, height: 1000 });
    await p.waitForFunction(() => {
      const button = document.querySelector('button[aria-label="Filters"]');
      const badge = button?.parentElement.parentElement.querySelector('[data-qa="badgeChip"]');
      if (!badge) return false;
      const b = button.getBoundingClientRect(), tag = badge.getBoundingClientRect();
      return Math.abs(tag.right - b.right) <= 4 && document.documentElement.scrollWidth <= innerWidth;
    });
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const height = await toolbar.evaluate((n) => n.getBoundingClientRect().height);
    const searchWidth = await toolbar.locator('[data-qa="schedule-search"]').evaluate(n => n.getBoundingClientRect().width);
    assert.equal(searchWidth, 160, `Agent search keeps its fixed width at ${width}px`);
    assert.ok(height >= 48);
    const bounds = await toolbar.evaluate(node => {
      const controls = [...node.querySelectorAll('input, button, [data-qa="schedule-date"]')].map(n => n.getBoundingClientRect());
      return { left: node.getBoundingClientRect().left, right: node.getBoundingClientRect().right, width: innerWidth,
        controls: controls.map(r => ({ left: r.left, right: r.right })) };
    });
    assert.ok(bounds.right <= bounds.width + 1 && bounds.left >= -1, JSON.stringify(bounds));
    assert.ok(bounds.controls.every(r => r.left >= -1 && r.right <= bounds.width + 1), JSON.stringify(bounds));
    if (width <= 640) assert.ok(height > 48, 'Narrow schedule controls wrap');
  }
  assert.equal(
    await p
      .getByRole('button', { name: '9 pending team requests', exact: true })
      .locator('[data-qa="badgeChip"]')
      .count(),
    0,
  );
  const zone = p.getByRole('button', { name: 'Schedule timezone: Shanghai', exact: true });
  await zone.press('Enter');
  assert.equal(await zone.getAttribute('aria-expanded'), 'true');
  assert.ok(
    (await p.getByPlaceholder('Search timezones', { exact: true }).boundingBox()).width >= 200,
    'Compact trigger keeps a readable popup width',
  );
  await p.getByPlaceholder('Search timezones', { exact: true }).fill('London');
  await p.locator('[data-qa="schedule-timezone-option-Europe/London"]').click();
  await p.getByRole('button', { name: 'Schedule timezone: London', exact: true }).waitFor();
  assert.equal(
    await p
      .getByRole('button', { name: 'Schedule timezone: London', exact: true })
      .getAttribute('aria-expanded'),
    'false',
  );
});

test('chart zoom handles have clear canvas space below their complete shape', async (t) => {
  const p = await open(t, 'echarts-gallery');
  for (const kind of ['predicted', 'comparison']) {
    const canvas = p.getByTestId('chart-' + kind).locator('canvas');
    await canvas.waitFor();
    const painted = await canvas.evaluate((c) => {
      const d = c.getContext('2d').getImageData(0, c.height - 4, c.width, 4).data;
      return d.some((v, i) => i % 4 === 3 && v > 0);
    });
    assert.equal(painted, false, `${kind}: zoom must not touch the canvas bottom`);
  }
});

test('schedule applied filters use the official Toolbar and native counts sit at action top-right', async (t) => {
  const p = await open(t, 'team-schedule', 1125);
  await p
    .getByRole('toolbar', { name: 'Applied schedule filters', exact: true })
    .waitFor({ timeout: 1500 });
  for (const name of ['9 pending team requests', 'Filters']) {
    await p.getByRole('button', { name, exact: true }).hover();
    const geometry = await p.getByRole('button', { name, exact: true }).evaluate((button) => {
      const b = button.getBoundingClientRect(),
        badge = button.parentElement.parentElement
          .querySelector('[data-qa="badgeChip"]')
          ?.getBoundingClientRect();
      return { b: { top: b.top, right: b.right, bottom: b.bottom }, badge: badge?.toJSON() };
    });
    assert.ok(geometry.badge, `${name}: native badge missing`);
    assert.ok(geometry.badge.top < geometry.b.top, JSON.stringify(geometry));
    // Native positioning rounds its anchor; late font metrics can inset the badge by a few pixels.
    assert.ok(
      geometry.badge.right <= geometry.b.right + 1 && geometry.b.right - geometry.badge.right <= 4,
      JSON.stringify(geometry),
    );
    assert.ok(
      geometry.badge.bottom > geometry.b.top,
      'Badge must overlap the corner instead of floating outside',
    );
  }
});

test('shared Filters badge hugs the corner on all three recipes in both themes and sizes', async (t) => {
  const p = await open(t, 'team-schedule');
  for (const entry of ['team-schedule', 'echart-insights', 'list-page']) {
    for (const scheme of ['light', 'dark']) {
      for (const width of [390, 1440]) {
        await p.setViewportSize({ width, height: 1000 });
        await p.goto(new URL(`?entry=recipes/${entry}.tsx&scheme=${scheme}`, p.url()).href);
        const button = p.getByRole('button', { name: 'Filters', exact: true });
        await button.waitFor();
        await p.evaluate(() => document.fonts.ready);
        await button.scrollIntoViewIfNeeded();
        await button.hover();
        const g = await button.evaluate((n) => {
          const b = n.getBoundingClientRect(),
            tag = n.parentElement.parentElement
              .querySelector('[data-qa="badgeChip"]')
              .getBoundingClientRect();
          return { top: b.top, right: b.right, tag: tag.toJSON() };
        });
        assert.ok(
          g.tag.right <= g.right + 1 && g.right - g.tag.right <= 4,
          `${entry}/${scheme}/${width}: ${JSON.stringify(g)}`,
        );
        assert.ok(
          g.tag.top < g.top && g.tag.bottom > g.top,
          `${entry}: badge must overlap top corner`,
        );
      }
    }
  }
});
