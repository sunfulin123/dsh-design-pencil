/** Exercise the screenshot recipe using the actual copied Cobalt controls and ECharts canvas. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {serveStatic} from './static-server.mjs';
test('Insights supports chart controls, agent filtering, summary and themes without overflow', {timeout:90000}, async t => {
 const s=await serveStatic(fileURLToPath(new URL('../site/dist',import.meta.url)));
 const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 t.after(async()=>{await b.close();await s.close();});
 const page=await b.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for (const scheme of ['light','dark']) {
  await page.goto(s.url+`/demos/?entry=recipes/echart-insights.tsx&scheme=${scheme}`);
  await page.getByTestId('insights-chart').locator('canvas').waitFor();
  await page.getByRole('button',{name:'Next period',exact:true}).click();
  assert.match(await page.locator('[data-qa="insights-date"] input').inputValue(),/16/);
  await page.getByRole('radio',{name:'Week',exact:true}).click();assert.equal(await page.getByRole('radio',{name:'Week',exact:true}).getAttribute('aria-checked'),'true');
  await page.getByRole('button',{name:'Collapse chart',exact:true}).click();assert.equal(await page.getByTestId('insights-chart').count(),0);
  await page.getByRole('button',{name:'Expand chart',exact:true}).click();await page.getByTestId('insights-chart').locator('canvas').waitFor();
  await page.getByRole('button',{name:'Show 34 more agents',exact:true}).click();
  const filters=page.getByRole('dialog',{name:'Insight filters',exact:true});await filters.getByRole('button',{name:'Agents',exact:true}).click();await page.locator('[data-qa="insights-agents-option-agent1"]').click();await filters.getByRole('heading',{name:'Insight filters',exact:true}).click();
  await filters.getByRole('button',{name:'Apply filters',exact:true}).click();await filters.waitFor({state:'hidden'});
  await page.getByRole('button',{name:'Show 33 more agents',exact:true}).waitFor();
  await page.getByRole('link',{name:'Summary',exact:true}).click();await page.getByRole('heading',{name:'Summary',exact:true}).waitFor();
  await page.getByRole('link',{name:'Chart',exact:true}).click();
  await page.getByRole('button',{name:'Add chart',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Add insight chart',exact:true});
  await dialog.getByRole('textbox',{name:'Chart title',exact:true}).fill('Second sample chart');await dialog.getByRole('button',{name:'Add chart',exact:true}).click();
  assert.equal(await page.getByTestId('insights-chart').count(),2);
  for (const width of [360,390,640,1024,1440]) {
   await page.setViewportSize({width,height:900});await page.waitForTimeout(150);
   const geometry=await page.getByTestId('insights-content').evaluate(node=>({width:node.clientWidth,page:document.documentElement.scrollWidth,viewport:innerWidth,chart:node.querySelector('canvas')?.getBoundingClientRect().width}));
   assert.ok(geometry.page<=width+1,JSON.stringify(geometry));assert.ok(geometry.chart<=width,JSON.stringify(geometry));
   const rows=await page.evaluate(()=>{const r=id=>document.querySelector(`[data-testid="${id}"]`).getBoundingClientRect();return {controls:r('insights-toolbar').bottom,filters:r('insights-applied-filters').top,content:r('insights-content').top,filterBottom:r('insights-applied-filters').bottom};});
   assert.ok(rows.controls<=rows.filters+1&&rows.filterBottom<=rows.content+1,JSON.stringify(rows));
   await page.screenshot({path:`/private/tmp/cobalt-insights-${scheme}-${width}.png`});
  }
 }
 assert.deepEqual(errors,[]);
});
