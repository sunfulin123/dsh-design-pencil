/** Dismiss native portalled controls through real keyboard, focus and iframe boundaries. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { serveStatic } from './static-server.mjs';
import { fileURLToPath } from 'node:url';
test('timezone closes on Escape and focus leaving its trigger and popup', async (t) => {
  const server = await serveStatic(fileURLToPath(new URL('../site/dist', import.meta.url)));
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  t.after(async () => {
    await browser.close();
    await server.close();
  });
  const p = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await p.goto(server.url + '/demos/?entry=recipes/team-schedule.tsx');
  const trigger = p.getByRole('button', { name: 'Schedule timezone: Shanghai', exact: true });
  await trigger.click();
  await p.keyboard.press('Escape');
  await p.waitForFunction(
    () =>
      document
        .querySelector('button[aria-label="Schedule timezone: Shanghai"]')
        ?.getAttribute('aria-expanded') === 'false',
    {},
    { timeout: 3000 },
  );
  assert.equal(await trigger.evaluate((n) => n === document.activeElement), true);
  await trigger.click();
  await p.getByPlaceholder('Search timezones').fill('London');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  await p.getByPlaceholder('Search timezones').focus();
  for (
    let index = 0;
    index < 12 && (await trigger.getAttribute('aria-expanded')) === 'true';
    index++
  )
    await p.keyboard.press('Shift+Tab');
  await p.waitForFunction(
    () =>
      document
        .querySelector('button[aria-label="Schedule timezone: Shanghai"]')
        ?.getAttribute('aria-expanded') === 'false',
    {},
    { timeout: 3000 },
  );
});
async function setup(t, entry) {
  const server = await serveStatic(fileURLToPath(new URL('../site/dist', import.meta.url)));
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  t.after(async () => {
    await browser.close();
    await server.close();
  });
  const p = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  p.setDefaultTimeout(7000);
  await p.goto(server.url + '/demos/?entry=recipes/' + entry + '.tsx');
  return { p, server };
}
test('multi-selection stays open and Escape dismisses only the child of a modal panel', async (t) => {
  const { p } = await setup(t, 'echart-insights');
  await p.getByRole('button', { name: 'Filters', exact: true }).click();
  const panel = p.getByRole('dialog', { name: 'Insight filters', exact: true });
  const trigger = panel.getByRole('button', { name: 'Agents', exact: true });
  for (let i = 0; i < 3; i++) {
    await trigger.click();
    const search = p.getByPlaceholder('Search agents', { exact: true });
    await search.fill('agent37');
    await p.locator('[data-qa="insights-agents-option-agent37"]').click();
    assert.equal(await search.isVisible(), true);
    await search.press('Escape');
    await search.waitFor({ state: 'hidden' });
    assert.equal(await panel.isVisible(), true);
    await p.waitForFunction(
      (node) => node === document.activeElement,
      await trigger.elementHandle(),
    );
  }
  await trigger.press('Escape');
  await panel.waitFor({ state: 'hidden' });
});
test('single dropdown, calendar, range and overflow popup keep native selection and dismiss on Escape', async (t) => {
  const { p, server } = await setup(t, 'team-schedule');
  const dropdown = p.locator('[data-component="Dropdown"]').first();
  const trigger = dropdown.getByRole('button').first();
  await trigger.click();
  const nativePopup = p.locator('[class*="co-dropdown__content"][aria-expanded="true"]');
  await nativePopup.waitFor();
  await p.keyboard.press('Escape');
  await nativePopup.waitFor({ state: 'hidden' });
  await p.waitForFunction((node) => node === document.activeElement, await trigger.elementHandle());
  await p.getByRole('heading', { name: 'Schedule page', exact: true }).click();
  await p.goto(server.url + '/demos/?entry=recipes/form-page.tsx');
  for (const id of ['form-start-date', 'form-availability']) {
    const input = p.locator(`[data-qa="${id}"] input`);
    await input.click();
    const day = p.getByRole('button', { name: '17', exact: true }).first();
    await day.waitFor();
    await day.focus();
    await p.keyboard.press('Tab');
    assert.equal(await day.isVisible(), true);
    await p.keyboard.press('Escape');
    await day.waitFor({ state: 'hidden' });
    await input.click();
    await p.getByRole('button', { name: '18', exact: true }).first().waitFor();
    await p.getByRole('heading', { name: 'Scheduling and preferences', exact: true }).click();
    await p.getByRole('button', { name: '18', exact: true }).first().waitFor({ state: 'hidden' });
  }
  await p.goto(server.url + '/demos/?entry=recipes/list-page.tsx');
  const more = p.locator('[data-qa="user-queues-overflow"]').first();
  await more.press('Enter');
  const popup = p.locator('[data-qa="user-queues-popup-content"]');
  await popup.waitFor();
  await p.keyboard.press('Escape');
  await popup.waitFor({ state: 'hidden' });
});
test('leaving the business iframe dismisses the popup without stealing outer focus', async (t) => {
  const { p, server } = await setup(t, 'team-schedule');
  await p.route('**/__dismiss-harness', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: `<button id="outside">Outer control</button><iframe title="Business" style="width:1100px;height:900px" src="${server.url}/demos/?entry=recipes/team-schedule.tsx"></iframe>`,
    }),
  );
  await p.goto(server.url + '/__dismiss-harness');
  const f = p.frameLocator('iframe');
  const trigger = f.getByRole('button', { name: 'Schedule timezone: Shanghai', exact: true });
  await trigger.click();
  await f.getByPlaceholder('Search timezones').fill('London');
  await p.getByRole('button', { name: 'Outer control' }).focus();
  await f.getByPlaceholder('Search timezones').waitFor({ state: 'hidden' });
  assert.equal(await p.locator('#outside').evaluate((n) => n === document.activeElement), true);
});

test('calendar Escape preserves its parent callback Dialog', async (t) => {
  const { p } = await setup(t, 'active-call');
  await p.getByRole('button', { name: 'Add callback', exact: true }).click();
  const dialog = p.getByRole('dialog', { name: 'Add callback', exact: true });
  await dialog.locator('[data-qa="callback-date"] input').click();
  const day = p.getByRole('button', { name: '17', exact: true }).first();
  await day.waitFor();
  await day.focus();
  await p.keyboard.press('Escape');
  await day.waitFor({ state: 'hidden' });
  assert.equal(await dialog.isVisible(), true);
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
});

test('combined date/time picker keeps time editing and dismisses on Escape or outside focus', async (t) => {
  const { p, server } = await setup(t, 'form-page');
  await p.goto(server.url + '/demos/?entry=examples/extensions/datetimepicker-1.tsx');
  const trigger = p.locator('[data-qa="basic-datetimepicker-input"]');
  await trigger.click();
  const day = p.getByRole('button', { name: '17', exact: true });
  await day.waitFor();
  const time = p.locator('[data-co-name="Popup"] input').first();
  await time.focus();
  await p.keyboard.press('ArrowUp');
  assert.equal(await day.isVisible(), true);
  await p.keyboard.press('Escape');
  await day.waitFor({ state: 'hidden' });
  await trigger.click();
  await day.waitFor();
  await p.evaluate(() => {
    const button = document.createElement('button');
    button.textContent = 'Outside datetime';
    document.body.append(button);
    button.focus();
  });
  await day.waitFor({ state: 'hidden' });
  assert.equal(
    await p
      .getByRole('button', { name: 'Outside datetime' })
      .evaluate((n) => n === document.activeElement),
    true,
  );
});
