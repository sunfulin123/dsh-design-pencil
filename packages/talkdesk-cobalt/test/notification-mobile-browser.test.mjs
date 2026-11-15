/** Real shell notification history and fixed phone preset acceptance. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const url=process.env.SYNAPSE_COBALT_TEST_URL;
test('compact notification rows and a fixed phone viewport work in both themes', {skip:!url,timeout:60000}, async t=>{
 const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});t.after(()=>b.close());
 const p=await b.newPage({viewport:{width:1440,height:1000}});
 await p.goto(url);await p.frameLocator('iframe[data-primary-frame]').getByRole('heading',{name:'Users',exact:true}).waitFor();
 for(const scheme of ['light','dark']) {
  if(scheme==='dark') { await p.getByRole('button',{name:'Profile menu',exact:true}).click();await p.getByRole('menuitem',{name:'Theme',exact:true}).click();await p.getByRole('menuitemradio',{name:'Dark',exact:true}).click();await p.keyboard.press('Escape'); }
  await p.getByTestId('workspace-notifications').click();
  await p.getByRole('heading',{name:'Older',exact:true}).waitFor();
  await p.waitForTimeout(350);
  const history=p.getByTestId('notification-history-panel');
  assert.equal(await history.locator('.ws-notification-card').count(),8);
  assert.equal(await history.getByText("There's a new Talkdesk version",{exact:true}).count(),0);
  const before=await history.getByRole('button',{name:/Mark .* as read/}).count();
  await history.getByRole('button',{name:/Mark .* as read/}).first().click();
  assert.equal(await history.getByRole('button',{name:/Mark .* as read/}).count(),before-1);
  const bounds=await history.boundingBox();assert.ok(bounds.width<=361&&bounds.x+bounds.width<=1441,JSON.stringify(bounds));
  await p.screenshot({path:`/private/tmp/cobalt-notifications-${scheme}.png`});
  await p.getByRole('button',{name:'Close notifications panel',exact:true}).click();
 }
 await p.getByTestId('prototype-size').click();assert.equal(await p.getByTestId('prototype-size-desktop').count(),0);
 await p.getByTestId('prototype-size-mobile').click();
 await p.waitForFunction(()=>{const r=document.querySelector('.ws-window').getBoundingClientRect();return r.width===390&&r.height===844;});
 await p.getByTestId('workspace-secondary-toggle').click();
 assert.equal(await p.locator('.ws-window').evaluate(n=>n.getBoundingClientRect().width),390);
 await p.screenshot({path:'/private/tmp/cobalt-phone-dark.png'});
});
