/** The recipe must bound its table, not put pagination inside the page's scroll area. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const url=process.env.SYNAPSE_COBALT_TEST_URL;
test('list pagination stays inside the viewport while only rows scroll', {skip:!url,timeout:60000},async t=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});t.after(()=>browser.close());
 const page=await browser.newPage({viewport:{width:1024,height:650}});
 await page.goto(url);const app=page.frameLocator('iframe[data-primary-frame]');await app.getByRole('heading',{name:'Users',exact:true}).waitFor();
 for (const width of [360,390,640,1024,1440]) {
 await page.setViewportSize({width,height:900});
 await page.waitForTimeout(400);
 const geometry=await app.locator('[data-component="WFMBasicTable"]').evaluate(node=>{
  const pagination=node.querySelector('nav').getBoundingClientRect();const body=node.querySelector('tbody');
  return {bottom:pagination.bottom,right:pagination.right,viewport:{width:innerWidth,height:innerHeight},bodyScroll:body.scrollHeight,bodyHeight:body.clientHeight,pageScroll:document.documentElement.scrollHeight};
 });
 assert.ok(geometry.bottom<=geometry.viewport.height&&geometry.right<=geometry.viewport.width,JSON.stringify(geometry));
 assert.ok(geometry.pageScroll<=geometry.viewport.height+1,JSON.stringify(geometry));
 assert.ok(geometry.bodyScroll>geometry.bodyHeight,JSON.stringify(geometry));
 const footerBefore=geometry.bottom;
 await app.locator('tbody').evaluate(node=>{node.scrollTop=node.scrollHeight;});
 const footerAfter=await app.locator('[data-component="WFMBasicTable"] nav').evaluate(node=>node.getBoundingClientRect().bottom);
 assert.ok(Math.abs(footerAfter-footerBefore)<=1);
 }
 await app.getByRole('button',{name:'Filters',exact:true}).click();
 const panel=app.getByRole('dialog',{name:'Filters',exact:true});
 const active=panel.getByRole('checkbox',{name:'Active users only',exact:true});
 await active.focus();await page.keyboard.press('Space');
 await panel.getByRole('button',{name:'Cancel',exact:true}).click();
 await app.getByText('40 users',{exact:true}).waitFor();
 await app.getByRole('button',{name:'Filters',exact:true}).click();
 assert.equal(await active.isChecked(),true);
 await active.focus();await page.keyboard.press('Space');
 await panel.getByRole('button',{name:'Apply filters',exact:true}).click();
 await app.getByText('49 users',{exact:true}).waitFor();
 if (await page.locator('.ws-secondary').isVisible()) {
   await page.getByTestId('workspace-secondary-toggle').click();await page.locator('.ws-secondary').waitFor({state:'hidden'});
 }
 const centers=await app.getByTestId('list-heading-row').evaluate(node=>{
   const center=id=>{const r=node.querySelector(`[data-testid="${id}"]`).getBoundingClientRect();return r.top+r.height/2;};
   return Math.abs(center('list-heading-text')-center('list-heading-actions'));
 });
 assert.ok(centers<=1,`Header group center difference: ${centers}`);

});
