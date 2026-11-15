/** Verify the screenshot composition and local call controls in a real Cobalt renderer. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { serveStatic } from './static-server.mjs';
async function open(t, state = 'success', scheme = 'light', width = 1386) {
  const server = await serveStatic(fileURLToPath(new URL('../site/dist', import.meta.url)));
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  t.after(async () => {
    await browser.close();
    await server.close();
  });
  const page = await browser.newPage({ viewport: { width, height: 861 } });
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${server.url}/demos/?entry=recipes/active-call.tsx&state=${state}&scheme=${scheme}`,
  );
  await page.getByTestId('call-header').waitFor();
  await page.evaluate(() => document.fonts.ready);
  t.after(() => assert.deepEqual(errors, []));
  return page;
}
test('active-call reference content, Cobalt glyphs and pinned geometry match the screenshot', async (t) => {
  const page = await open(t);
  for (const name of ['Conversations', 'Callbacks', 'Callback thread', 'No upcoming callbacks'])
    await page.getByRole('heading', { name, exact: true }).waitFor();
  for (const text of [
    '6 conversations',
    'Call Quality:',
    'Excellent',
    'REC',
    'Talking',
    'via Sales Number',
    'Details to call the contact later will appear here',
    'Teresa Juarez',
    'Oct 20, 2022',
    '4:07 PM',
    'Alex Jones',
    '12:36 PM',
    'Need to review with spouse first, callback scheduled',
    'Customer busy at this time, callback scheduled',
  ])
    assert.ok(await page.getByText(text, { exact: true }).count(), text);
  assert.equal(await page.getByText('Warranty extension', { exact: true }).count(), 2);
  for (const label of [
    'Hold',
    'Mute',
    'Stop recording',
    'Keypad',
    'Consult',
    'Blind transfer',
    'Add guest',
    'End call',
    'New conversation',
  ])
    await page.getByRole('button', { name: label, exact: true }).waitFor();
  const geometry = await page.evaluate(() => {
    const rect = (selector) => {
      const r = document.querySelector(selector).getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom };
    };
    return {
      sidebar: rect('.call-conversations'),
      header: rect('.call-header'),
      footer: rect('.call-actions'),
      body: rect('.call-content'),
      left: rect('[data-component="CallCallbacks"]'),
      right: rect('[data-component="CallThread"]'),
      overflow: document.documentElement.scrollWidth > innerWidth,
      icons: [...document.querySelectorAll('.active-call i')].map(
        (node) => getComputedStyle(node).fontFamily,
      ),
    };
  });
  assert.equal(geometry.sidebar.width, 360);
  assert.equal(geometry.header.height, 164);
  assert.equal(geometry.footer.height, 66);
  assert.equal(geometry.footer.bottom, 861);
  assert.equal(geometry.body.bottom, geometry.footer.y);
  assert.ok(Math.abs(geometry.left.y - geometry.right.y) < 1);
  assert.ok(Math.abs(geometry.right.x - geometry.left.x - geometry.left.width - 24) < 1);
  assert.equal(geometry.overflow, false);
  assert.equal(await page.locator('.call-thread-icon[class*="co-avatar"]').count(), 2);
  assert.equal(await page.locator('.call-queue-tabs [data-qa="badgeChip"]').count(), 1);
  const count = await page.locator('.call-queue-tabs [data-qa="badgeChip"]').boundingBox();
  const label = await page.locator('.call-assigned-label').boundingBox();
  assert.ok(count.y < label.y && Math.abs(count.x - label.x - label.width - 2) <= 4, JSON.stringify({ count, label }));
  assert.ok(geometry.icons.length >= 16);
  assert.ok(
    geometry.icons.every((font) => /Material-Icons-TD/i.test(font)),
    JSON.stringify(geometry.icons),
  );
  await page.screenshot({ path: '/private/tmp/cobalt-active-call-light.png' });
});
test('hold, mute, recording, keypad, callback and end-call workflows operate locally', async (t) => {
  const page = await open(t);
  await page.getByRole('button', { name: 'Hold', exact: true }).click();
  await page.getByText('On hold', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.getByRole('button', { name: 'Mute', exact: true }).click();
  assert.equal(
    await page.getByRole('button', { name: 'Unmute', exact: true }).getAttribute('aria-pressed'),
    'true',
  );
  await page.getByRole('button', { name: 'Stop recording', exact: true }).click();
  assert.equal(await page.getByText('REC', { exact: true }).count(), 0);
  await page.getByRole('button', { name: 'Keypad', exact: true }).click();
  const keypad = page.getByRole('dialog', { name: 'Keypad', exact: true });
  await keypad.getByRole('button', { name: 'Dial 5', exact: true }).click();
  await keypad.getByRole('button', { name: 'Dial #', exact: true }).click();
  assert.equal(await keypad.getByLabel('Dialed digits', { exact: true }).inputValue(), '5#');
  await keypad.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Add callback', exact: true }).click();
  const callback = page.getByRole('dialog', { name: 'Add callback', exact: true });
  assert.equal(
    await callback.getByRole('button', { name: 'Schedule callback', exact: true }).isDisabled(),
    true,
  );
  await callback.locator('[data-qa="callback-date"] input').click();
  await page
    .locator('[data-qa="callback-date"]')
    .screenshot({ path: '/private/tmp/cobalt-active-call-calendar.png' });
  // DatePicker is a native Cobalt calendar, not an HTML date input.
  const day = page.locator('[data-qa="callback-date"] button').filter({ hasText: /^15$/ });
  const allDay = page.getByRole('button', { name: '15', exact: true });
  if (await day.count()) await day.first().click();
  else await allDay.first().click();
  assert.equal(await callback.locator('[data-component="WFMTimeSelectInput"]').count(), 1);
  await callback.locator('[data-qa="callback-time-hours"]').fill('14');
  await callback.locator('[data-qa="callback-time-minutes"]').fill('30');
  assert.equal(
    await callback.getByLabel('Note', { exact: true }).evaluate((node) => node.tagName),
    'TEXTAREA',
  );
  await callback
    .getByLabel('Note', { exact: true })
    .fill('Warranty follow-up\nDiscuss renewal options');
  await callback.getByRole('button', { name: 'Schedule callback', exact: true }).click();
  await page.getByText(/Warranty follow-up.*Discuss renewal options/s).waitFor();
  await page.getByText(/ at 14:30$/, { exact: false }).waitFor();
  await page.getByRole('button', { name: 'End call', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'End call', exact: true })
    .getByRole('button', { name: 'End call', exact: true })
    .click();
  assert.equal(
    await page.getByRole('button', { name: 'End call', exact: true }).isDisabled(),
    true,
  );
  await page.getByText('Call ended', { exact: true }).waitFor();
});
test('dark, narrow and reduced-data states retain usable content and controls', async (t) => {
  const page = await open(t, 'success', 'dark');
  await page.screenshot({ path: '/private/tmp/cobalt-active-call-dark.png' });
  for (const width of [390, 640, 1024]) {
    await page.setViewportSize({ width, height: 861 });
    assert.equal(
      await page.locator('html').evaluate((node) => node.scrollWidth > innerWidth),
      false,
    );
    await page.getByRole('button', { name: 'End call', exact: true }).scrollIntoViewIfNeeded();
    const footer = await page.getByTestId('call-actions').boundingBox();
    assert.ok(footer.y + footer.height <= 862);
    if (width === 390) {
      await page.getByRole('button', { name: 'Expand conversations', exact: true }).click();
      await page.getByRole('heading', { name: 'Conversations', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Collapse conversations', exact: true }).click();
      await page.screenshot({ path: '/private/tmp/cobalt-active-call-narrow.png' });
    }
  }
  for (const state of ['loading', 'permission', 'partial', 'empty', 'error']) {
    const url = new URL(page.url());
    url.searchParams.set('state', state);
    await page.goto(url.href);
    await page.getByTestId('call-header').waitFor();
    if (state === 'loading' || state === 'permission')
      assert.equal(
        await page.getByRole('button', { name: 'Hold', exact: true }).isDisabled(),
        true,
      );
    if (state === 'partial') assert.equal(await page.locator('.call-thread li').count(), 1);
    if (state === 'empty') await page.getByText('No callback history', { exact: true }).waitFor();
    if (state === 'error') {
      await page.getByRole('button', { name: 'Retry', exact: true }).click();
      await page.getByRole('heading', { name: 'Callback thread', exact: true }).waitFor();
    }
  }
});

test('source-copy geometry does not depend on a host border-box reset', async (t) => {
  const page = await open(t);
  await page.addStyleTag({ content: '* { box-sizing: content-box; }' });
  const header = await page.getByTestId('call-header').boundingBox();
  const sidebar = await page.getByTestId('call-conversations').boundingBox();
  const footer = await page.getByTestId('call-actions').boundingBox();
  assert.equal(header.height, 164);
  assert.equal(sidebar.width, 360);
  assert.equal(footer.height, 66);
  assert.equal(footer.y + footer.height, 861);
});

test('call details have a native divider, spaced Notes and Snapshot, and accessible motion behavior', async (t) => {
  const page = await open(t);
  const divider = page.getByTestId('call-tabs-divider');
  await divider.waitFor();
  assert.equal(await divider.getAttribute('role'), 'separator');
  assert.match(await divider.getAttribute('class'), /co-divider/);
  const header = await page.getByTestId('call-header').boundingBox();
  const line = await divider.boundingBox();
  assert.ok(Math.abs(line.y + line.height - header.y - header.height) <= 1);
  const halo = page.locator('.call-customer-halo');
  assert.equal(await halo.evaluate((node) => node.getAnimations({ subtree: true }).length), 2);
  const timings = await halo.evaluate((node) =>
    node.getAnimations({ subtree: true }).map((animation) => animation.effect.getTiming()),
  );
  assert.ok(timings.every((timing) => timing.duration === 2400));
  const waves = await halo.evaluate((node) =>
    node.getAnimations({ subtree: true }).map((animation) => {
      const frames = animation.effect.getKeyframes();
      return {
        start: new DOMMatrix(frames[0].transform).a,
        end: new DOMMatrix(frames.at(-1).transform).a,
        fade: Number(frames[0].opacity) > Number(frames.at(-1).opacity),
      };
    }),
  );
  assert.ok(
    waves.every((wave) => wave.end > wave.start && wave.fade),
    'Waves expand outward and fade',
  );
  await page.getByRole('button', { name: 'Hold', exact: true }).click();
  assert.equal(await halo.evaluate((node) => node.getAnimations({ subtree: true }).length), 0);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await halo.evaluate((node) => node.getAnimations({ subtree: true }).length), 0);
  await page.getByRole('link', { name: 'Notes', exact: true }).click();
  const heading = await page.getByRole('heading', { name: 'Notes', exact: true }).boundingBox();
  const label = await page.getByText('Conversation note', { exact: true }).boundingBox();
  const input = page.getByLabel('Conversation note', { exact: true });
  const field = await input.boundingBox();
  const save = await page.getByRole('button', { name: 'Save note', exact: true }).boundingBox();
  assert.ok(label.y - heading.y - heading.height >= 16);
  assert.ok(field.y - label.y - label.height >= 7);
  assert.ok(save.y - field.y - field.height >= 16);
  await input.fill('Warranty extension follow-up');
  await page.getByRole('button', { name: 'Save note', exact: true }).click();
  await page
    .getByRole('status')
    .filter({ hasText: 'Note saved for this prototype session.' })
    .waitFor();
  await page.screenshot({ path: '/private/tmp/cobalt-call-notes-spaced.png' });
  await page.getByRole('link', { name: 'Snapshot', exact: true }).click();
  const title = await page.getByTestId('call-snapshot-heading').boundingBox();
  const details = await page.getByTestId('call-snapshot-details').boundingBox();
  assert.ok(details.y - title.y - title.height >= 24);
  await page.screenshot({ path: '/private/tmp/cobalt-call-snapshot-spaced.png' });
});
