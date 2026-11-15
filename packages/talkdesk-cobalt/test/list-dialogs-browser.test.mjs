/** Generated recipe dialogs use real extension controls and local/host workflow contracts. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {serveStatic} from './static-server.mjs';
test('ListPage creates users and prepares CSV imports through Extensions dialogs', {timeout:90000}, async t => {
 const s=await serveStatic(fileURLToPath(new URL('../site/dist',import.meta.url)));
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 t.after(async()=>{await b.close();await s.close();});
 const page=await b.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url=s.url+'/demos/?entry=recipes/list-page.tsx';
 await page.goto(url);await page.getByTestId('list-create-user').click();
 const create=page.getByRole('dialog',{name:'New user',exact:true});await create.waitFor();
 await page.keyboard.press('Escape');await create.waitFor({state:'hidden'});
 await page.getByTestId('list-create-user').click();await create.waitFor();
 assert.equal(await create.locator('[data-component="WFMDialog"]').count(),1);
 await create.getByRole('button',{name:'Create user',exact:true}).click();
 await create.getByText('Enter a full name.',{exact:true}).waitFor();
 await create.getByText('Enter a valid email address.',{exact:true}).waitFor();
 await create.getByRole('textbox',{name:'Full name',exact:true}).fill('Taylor Sample');
 await create.getByRole('textbox',{name:'Email',exact:true}).fill('taylor.sample@example.com');
 await create.getByRole('textbox',{name:'Team',exact:true}).fill('Support');
 await create.getByLabel('Role',{exact:true}).click();
 await page.locator('[data-qa="create-role-option-Supervisor"]').click();
 await create.getByRole('button',{name:'Create user',exact:true}).click();await create.waitFor({state:'hidden'});
 await page.getByRole('status').getByText('Created Taylor Sample.',{exact:true}).waitFor();
 await page.getByRole('searchbox',{name:'Search users',exact:true}).fill('taylor.sample@example.com');
 await page.getByRole('link',{name:'Taylor Sample',exact:true}).waitFor();
 await page.getByText('Supervisor',{exact:true}).waitFor();
 await page.getByTestId('list-create-user').click();await create.getByRole('textbox',{name:'Full name',exact:true}).fill('Duplicate');
 await create.getByRole('textbox',{name:'Email',exact:true}).fill('taylor.sample@example.com');
 await create.getByRole('button',{name:'Create user',exact:true}).click();await create.getByText('A user with this email already exists.',{exact:true}).waitFor();
 await page.keyboard.press('Escape');await create.waitFor({state:'hidden'});
 await page.getByTestId('list-create-user').click();assert.equal(await create.getByRole('textbox',{name:'Full name',exact:true}).inputValue(),'');await create.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByTestId('list-import').click();const imp=page.getByRole('dialog',{name:'Import users',exact:true});await imp.waitFor();
 await imp.locator('[data-component="WFMUploadFile"]').waitFor();
 assert.equal(await imp.locator('[data-component="WFMUploadFile"]').count(),1);
 assert.equal(await imp.getByRole('button',{name:'Import file',exact:true}).isDisabled(),true);
 const input=imp.locator('input[type="file"]');
 await input.setInputFiles({name:'invalid.txt',mimeType:'text/plain',buffer:Buffer.from('invalid')});await imp.getByText('Choose a CSV file.',{exact:true}).waitFor();
 await input.setInputFiles({name:'huge.csv',mimeType:'text/csv',buffer:Buffer.alloc(5*1024*1024+1)});await imp.getByText('Choose a file smaller than 5 MB.',{exact:true}).waitFor();
 await input.setInputFiles({name:'users.csv',mimeType:'text/csv',buffer:Buffer.from('name,email\nTaylor,taylor@example.com')});await imp.getByText('users.csv',{exact:true}).waitFor();
 const chooser=page.waitForEvent('filechooser');await imp.getByRole('button',{name:'Change file',exact:true}).click();await(await chooser).setFiles({name:'replacement.csv',mimeType:'text/csv',buffer:Buffer.from('name,email')});
 await imp.getByText('replacement.csv',{exact:true}).waitFor();await imp.getByRole('button',{name:'Delete',exact:true}).click();assert.equal(await imp.getByRole('button',{name:'Import file',exact:true}).isDisabled(),true);
 await input.setInputFiles({name:'users.csv',mimeType:'text/csv',buffer:Buffer.from('name,email')});await imp.getByRole('button',{name:'Import file',exact:true}).click();await imp.waitFor({state:'hidden'});
 await page.getByRole('status').getByText('Selected file: users.csv',{exact:true}).waitFor();
 await page.goto(url+'&host=error');await page.getByTestId('list-create-user').click();await create.getByRole('textbox',{name:'Full name',exact:true}).fill('Taylor Retry');await create.getByRole('textbox',{name:'Email',exact:true}).fill('retry@example.com');await create.getByRole('button',{name:'Create user',exact:true}).click();await page.keyboard.press('Tab');await create.getByText('Could not create the user. Try again.',{exact:true}).waitFor();await create.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByTestId('list-import').click();await input.setInputFiles({name:'retry.csv',mimeType:'text/csv',buffer:Buffer.from('name,email')});await imp.getByRole('button',{name:'Import file',exact:true}).click();await imp.getByText('Could not submit the import. Try again.',{exact:true}).waitFor();await imp.getByRole('button',{name:'Cancel',exact:true}).click();
 for(const scheme of ['light','dark'])for(const width of [360,640,1024,1440]){
  await page.setViewportSize({width,height:900});await page.goto(url+'&scheme='+scheme);
  for(const action of ['list-create-user','list-import']){await page.getByTestId(action).click();const dialog=page.getByRole('dialog');await dialog.waitFor();const surface=dialog.locator('[data-component="WFMDialog"]');const rect=await surface.boundingBox();assert.ok(rect.x>=-1&&rect.x+rect.width<=width+1,JSON.stringify(rect));await page.screenshot({path:`/private/tmp/cobalt-${action}-${scheme}-${width}.png`});await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await dialog.waitFor({state:'hidden'});}
 }
 assert.deepEqual(errors,[]);
});
