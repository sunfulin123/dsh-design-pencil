/** Real generated-shell acceptance; no model provider or existing user browser is used. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {chromium} from 'playwright';
import {serveStatic} from './static-server.mjs';
const project = process.env.SYNAPSE_COBALT_TEST_PROJECT;
test('responsive prototype controls expose named locators and operate sizes, states and flags', {skip: !project, timeout: 120000}, async t => {
 const server = await serveStatic(join(project, 'delivery'));
 const browser = await chromium.launch({executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true});
 t.after(async () => { await browser.close(); await server.close(); });
 const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
 const errors = []; page.on('pageerror', error => errors.push(error.message));
 await page.goto(server.url);
 const app = page.frameLocator('iframe[data-primary-frame]');
 await app.getByRole('heading', {name: 'Users', exact: true}).waitFor();
 assert.equal(await page.locator('.review-brand').count(),0);
 for (const preset of ['1920','1440','1280','1024','640','mobile','fill']) {
  await page.getByTestId('prototype-size').click();
  await page.getByTestId(`prototype-size-${preset}`).click();
  if (preset !== 'fill') await page.waitForFunction(width => Math.abs(document.querySelector('[data-testid="workspace-window"]').getBoundingClientRect().width-width)<1, preset==='mobile'?390:Number(preset));
 }
 for (const state of ['loading','empty','error','partial','permission','success']) {
  await page.getByRole('button', {name: 'Page state', exact: true}).click();
  await page.getByTestId(`prototype-state-${state}`).click();
  await app.locator(`html[data-prototype-scenario="${state}"]`).waitFor();
  if (state==='permission') await app.getByText('You do not have permission to manage users.', {exact:true}).waitFor();
  if (state==='empty') await app.getByText('There are no users yet.', {exact:true}).waitFor();
  if (state==='loading') assert.equal(await app.locator('[data-component="WFMBasicTable"]').getByRole('link').count(),0);
  if (state==='partial') await app.getByText('1 user',{exact:true}).waitFor();
  if (state==='error') await app.getByText('Something went wrong', {exact:true}).waitFor();
 }
 await page.getByTestId('prototype-flags').click();
 const flags = page.getByRole('switch'); assert.equal(await flags.count(),8);
 for (let index=0; index<8; index++) { const flag=flags.nth(index); await flag.uncheck(); assert.equal(await flag.isChecked(),false); await flag.check(); }
 await page.getByTestId('prototype-flag-expandedDock').uncheck();
 assert.equal(await page.getByRole('button',{name:'Expand',exact:true}).count(),0);
 await page.getByTestId('prototype-flags-reset').click();
 assert.equal(await page.getByRole('switch',{checked:true}).count(),8);
 await page.keyboard.press('Escape');
 assert.equal(await page.getByTestId('prototype-flags').evaluate(node=>node===document.activeElement),true);
 await page.getByTestId('prototype-size').focus(); await page.keyboard.press('Enter');
 await page.getByTestId('prototype-size-panel').waitFor(); await page.keyboard.press('Escape');
 for (const scheme of ['light','dark']) {
  if (scheme==='dark') { await page.getByRole('button',{name:'Profile menu',exact:true}).click(); await page.getByRole('menuitem',{name:'Theme',exact:true}).click(); await page.getByRole('menuitemradio',{name:'Dark',exact:true}).click(); await page.keyboard.press('Escape'); }
  for (const width of [320,390,768,1024,1440]) {
   await page.setViewportSize({width,height:900});
   for (const id of ['size','state','flags']) assert.equal(await page.getByTestId(`prototype-${id}-value`).evaluate(node=>node.scrollWidth>node.clientWidth),false,`${width}: clipped ${id} value`);
   const toolbar=page.getByTestId('prototype-toolbar');
   const geometry=await toolbar.evaluate(node=>({height:node.getBoundingClientRect().height,overflow:node.scrollWidth>node.clientWidth}));
   assert.equal(await page.getByTestId('prototype-size').evaluate(node=>node.getBoundingClientRect().height),width<=560?44:36);
   assert.equal(geometry.height,56); assert.equal(geometry.overflow,false,`${width}: toolbar overflow`);
   for (const id of ['size','state','flags']) {
    await page.getByTestId(`prototype-${id}`).click();
    const panel=page.getByTestId(`prototype-${id}-panel`);
    const bounds=await panel.boundingBox(); assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width+1&&bounds.y+bounds.height<=900,JSON.stringify(bounds));
    await page.getByTestId(`prototype-${id}-close`).click();
   }
   await page.screenshot({path:`/private/tmp/cobalt-toolbar-${scheme}-${width}.png`});
  }
 }
 await page.getByTestId('prototype-state').click(); await page.getByTestId('prototype-state-error').click();
 await page.getByTestId('prototype-reset').click();
 await app.locator('html[data-prototype-scenario="success"]').waitFor();
 assert.deepEqual(errors,[]);
});
