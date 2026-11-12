import {readFileSync} from 'node:fs';
const catalogue=JSON.parse(readFileSync(new URL('../catalogue-fallback.json',import.meta.url),'utf8'));
import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const member={member_id:'test',school_email:'test@students.uonbi.ac.ke',delivery_email:'test@students.uonbi.ac.ke',handle:'Test member',is_admin:true,available_coins:100,academic_year:2};
test.beforeEach(async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('smr_session_token_v1','fixture'));
 await page.route('**/api',async route=>{
  const action=route.request().postDataJSON()?.action;
  const responses={
   member_catalogue_state:{member,treasury_balance_coins:100,verified_access_ids:[]},
   catalogue_snapshot:{...catalogue,stale:false},
   site_tips:{tips:[]},
   community_tasks:{tasks:[{id:'fixture-open',title:'Add worked examples for Introduction to Programming',status:'open',target_path:'Year 1 / Semester 1',note:'Explain loops and arrays with clear examples.',reward_coins:5,votes:3,tags:['introduction-to-programming']},{id:'fixture-unfunded',title:'Organise past papers for Cloud Computing Technology & Applications',status:'open',target_path:'Year 4 / Semester 1',note:'Group papers by year and include marking guides where available.',reward_coins:0,votes:0}]},
   community_review_queue:{mine:[],items:[],reviews:[],queue:[],academic_year:2},
   community_profile:{approved_contributions:0,reviews:0,activated_tasks:0,label:'Test member',level:1,points:0,next_level_points:25},
   member_request_history:{items:[],requests:[],history:[]},
   website_data:{admin:{members:8,active_7_days:3,visits:42,messages:12,files:900,folders:40,new_files:5,days:[{day:'30/10/2026',active:3}],users:[{email:'test@students.uonbi.ac.ke',last_seen:'2026-10-30T12:00:00Z',visits:4}]},avatar_seed:'test',stats:{},recent:[],additions:[]},
   chat_hub:{contacts:[{id:'peer',label:'Alex',avatar_seed:'alex'}],spaces:[{id:'smr-central',label:'SMR Central',community:'SMR'}],thread:{id:'peer',kind:'dm',label:'Alex',can_send:true},messages:[{id:'one',sender:'Alex',body:'Here are the **revision notes**.\nLet me know what you think.',created_at:'2026-10-30T12:00:00Z',mine:false,reactions:[]},{id:'two',sender:'Test member',body:'Thank you! I will review them this evening.',created_at:'2026-10-30T12:01:00Z',mine:true,reactions:[]}]}
  };await route.fulfill({json:{ok:true,data:responses[action]||{}}});
 });
});
for(const view of ['top','contribute','activity','chat']){
 test(view+' accessibility and layout',async({page})=>{
  await page.goto('http://127.0.0.1:4188');
  await page.locator('[data-view="'+view+'"]').click();
  await expect(page.locator('#'+view)).toBeVisible();
  if(view==='top') await expect(page.locator('#sync-status')).toContainText('Up to date');
  const results=await new AxeBuilder({page}).analyze();
  console.log(view,results.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));
  await page.evaluate(()=>document.fonts.ready);
  if(test.info().project.name.startsWith('chromium')) await expect(page).toHaveScreenshot(view+'.png',{fullPage:true,animations:'disabled',maxDiffPixelRatio:0.001});
  else await page.screenshot({path:test.info().outputPath(view+'.png'),fullPage:true});
  expect(results.violations).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
 });
}
test('proposal dialog opens and preserves form validation',async({page})=>{
 await page.goto('http://127.0.0.1:4188');await page.locator('[data-view=contribute]').click();
 await page.locator('#propose-task').click();await expect(page.locator('#task-dialog')).toBeVisible();
 await expect(page.locator('#task-name')).toBeEditable();
 await page.keyboard.press('Escape');await expect(page.locator('#task-dialog')).not.toBeVisible();
});

test('populated tasks can be expanded and searched',async({page})=>{
 await page.goto('http://127.0.0.1:4188');await page.locator('[data-view=contribute]').click();
 const task=page.locator('.task-row').filter({hasText:'Add worked examples'});
 await task.locator('summary').click();
 await expect(task.locator('.task-description')).toBeVisible();
 await page.getByPlaceholder('Search tasks').fill('Cloud Computing');
 await expect(task).toBeHidden();
 await expect(page.locator('.task-row').filter({hasText:'Organise past papers'})).toBeVisible();
});

for(const name of ['Edit avatar','Repository dashboard']){
 test(name+' opens and closes accessibly',async({page})=>{
  await page.goto('http://127.0.0.1:4188');await page.locator('[data-view=activity]').click();
  await page.getByRole('button',{name,exact:true}).click();
  const dialog=page.locator('dialog[open]');await expect(dialog).toBeVisible();
  const results=await new AxeBuilder({page}).analyze();expect(results.violations).toEqual([]);
  await page.screenshot({path:test.info().outputPath(name+'.png'),fullPage:true});
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
 });
}


test('message appears before the send request finishes',async({page})=>{
 await page.goto('http://127.0.0.1:4188');await page.locator('[data-view=chat]').click();
 let release;const pending=new Promise(resolve=>release=resolve);
 await page.route('**/api',async route=>{if(route.request().postDataJSON()?.action!=='chat_send')return route.fallback();await pending;await route.fulfill({json:{ok:true,data:{}}});});
 await page.locator('#message-body').fill('Optimistic send check');await page.locator('#message-compose').evaluate(form=>form.requestSubmit());
 try {await expect(page.locator('.pending-message')).toContainText('Optimistic send check');await expect(page.locator('#message-body')).toHaveValue('');await expect(page.locator('#page-progress')).toBeHidden();}finally{release();}
});

test('admin task controls and advanced reward filters remain usable',async({page})=>{
 await page.goto('http://127.0.0.1:4188/#contribute');
 await page.getByRole('button',{name:'Create task',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Create treasury-funded task'});
 await expect(dialog).toBeVisible();
 await dialog.getByLabel('Title',{exact:true}).fill('Prepare worked examples');
 await dialog.getByLabel('Priority (0–10)',{exact:true}).fill('11');
 expect(await dialog.getByLabel('Priority (0–10)',{exact:true}).evaluate(e=>e.checkValidity())).toBe(false);
 expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
 await dialog.getByRole('button',{name:'Close',exact:true}).click();
 await page.getByRole('button',{name:'Advanced task search',exact:true}).click();
 await page.locator('#task-min-reward').fill('1');
 expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
 await page.screenshot({path:test.info().outputPath('advanced-search.png')});
 await expect(page.locator('.task-row').filter({hasText:'Organise past papers'})).toBeHidden();
 await expect(page.locator('.task-row').filter({hasText:'Add worked examples'})).toBeVisible();
 await page.getByRole('button',{name:'Save my filters',exact:true}).click();
 await page.reload();await expect(page.locator('#task-min-reward')).toHaveValue('1');
});

test('chat tools do not resize the message bubble',async({page})=>{
 await page.goto('http://127.0.0.1:4188/#chat');
 await expect(page.locator('.chat-bubble').first()).toBeVisible();
 const bubble=page.locator('.chat-bubble').first();
 await expect(bubble).toBeVisible();const before=await bubble.boundingBox();
 await bubble.focus();const after=await bubble.boundingBox();
 expect(after.height).toBe(before.height);expect(after.width).toBe(before.width);
});

test('task workflow and status menus fit their options',async({page})=>{
 await page.goto('http://127.0.0.1:4188/#contribute');
 await page.getByRole('button',{name:'Create task',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Create treasury-funded task'});
 await dialog.getByRole('button',{name:/Task type:/}).click();
 const types=page.getByRole('listbox',{name:'Task type',exact:true});
 await expect(types.getByRole('option',{name:'Find a book',exact:true})).toBeVisible();
 await expect(types.getByRole('option',{name:'Convert PDF to Doc or Markdown',exact:true})).toBeVisible();
 await types.getByRole('option',{name:'Find a book',exact:true}).click();
 await dialog.getByRole('button',{name:/Status:/}).click();
 const menu=page.getByRole('listbox',{name:'Status',exact:true});
 await expect(menu.getByRole('option',{name:'deleted',exact:true})).toBeVisible();
 expect(await menu.evaluate(e=>e.scrollWidth<=e.clientWidth+1&&e.scrollHeight<=e.clientHeight+1)).toBeTruthy();
 await expect.poll(()=>menu.evaluate(e=>Number(getComputedStyle(e).opacity))).toBeGreaterThan(0.99);
 await page.screenshot({path:test.info().outputPath('task-status-menu.png')});
});

test('catalogue menus are compact icon rows and email entry does not throw',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4188');
 await page.locator('.classroom-card').first().click({button:'right'});
 const menu=page.getByRole('menu',{name:'Catalogue actions'});
 await expect(menu).toBeVisible();
 await expect.poll(async()=>{const b=await menu.boundingBox();return b.x+b.width;}).toBeLessThanOrEqual(page.viewportSize().width-10);
 const box=await menu.boundingBox();expect(box.width).toBeLessThanOrEqual(321);
 for(const button of await menu.getByRole('menuitem').all()){
   if(await button.isVisible())await expect(button.locator('.material-symbols-outlined')).toHaveCount(1);
 }
 await page.screenshot({path:test.info().outputPath('catalogue-menu.png')});
 await page.evaluate(()=>{const input=document.querySelector('#login-email');input.value='person@students.uonbi.ac.ke';input.dispatchEvent(new Event('input',{bubbles:true}));});
 expect(errors).toEqual([]);
 expect(await page.locator('#login-email').evaluate(e=>e.closest('.school-input').querySelector(':scope > span:not(.m3e-text-field)').hidden)).toBe(true);
});

test('populated review queue opens the staged copy and records approval',async({page})=>{
 let approved=false;const calls=[];
 await page.route('**/api',async route=>{
  const {action,payload}=route.request().postDataJSON();
  if(action==='community_review_queue')return route.fulfill({json:{ok:true,data:{academic_year:2,is_admin:true,mine:[{id:'own',title:'My pending notes',status:'pending',source_url:'https://drive.google.com/file/d/source/view'}],items:approved?[]:[{id:'review-one',title:'Revision notes',path:'Year 2 / 2.1 / Notes',note:'Check the worked examples.',my_decision:''}]}}});
  if(action==='review_contribution'){calls.push(payload);if(payload.decision==='approve')approved=true;return route.fulfill({json:{ok:true,data:payload.decision==='open'?{preview:{grant:'review-grant',pages:1}}:{status:'approved'}}});}
  return route.fallback();
 });
 await page.route('**/api/review-page',route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII=','base64')}));
 await page.goto('http://127.0.0.1:4188/#contribute');
 const card=page.locator('#review-list article');await expect(card).toContainText('Revision notes');
 await expect(page.locator('#review-status')).not.toContainText('defined');
 await expect(page.locator('#submission-list')).toContainText('My pending notes');
 expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
 await page.screenshot({path:test.info().outputPath('populated-review.png'),fullPage:true});
 await card.getByRole('button',{name:'Open material',exact:true}).click();
 const preview=page.getByRole('dialog',{name:'Revision notes'});await expect(preview).toContainText('Page 1 of 1');await preview.getByRole('button',{name:'Close',exact:true}).click();
 await card.getByLabel('Published file name').fill('Approved notes.pdf');
 await card.getByRole('button',{name:'Approve',exact:true}).click();
 await expect(page.locator('#review-list')).toContainText('No matching submissions');
 expect(calls.map(c=>c.decision)).toEqual(['open','approve']);expect(calls[1].proposed_title).toBe('Approved notes.pdf');
});

test('populated file history renders without task-card variables',async({page})=>{
 await page.route('**/api',async route=>{
  if(route.request().postDataJSON().action!=='member_request_history')return route.fallback();
  return route.fulfill({json:{ok:true,data:{items:[{file:'Revision paper.pdf',file_id:'paper',date:'2026-11-04T12:00:00Z',status:'completed',coins:1}],next_cursor:null}}});
 });
 await page.goto('http://127.0.0.1:4188/#activity');
 await expect(page.locator('#history-list')).toContainText('Revision paper.pdf');
 await expect(page.locator('#history-status')).not.toContainText('defined');
});

test('submission editing, withdrawal and clear review notes',async({page})=>{
 let title='My pending notes',withdrawn=false;const calls=[];
 await page.route('**/api',async route=>{
  const {action,payload}=route.request().postDataJSON();
  if(action==='community_review_queue')return route.fulfill({json:{ok:true,data:{academic_year:2,is_admin:true,mine:[{id:'mine',title,status:withdrawn?'withdrawn':'pending',source_url:'https://example.com/notes',can_edit:!withdrawn,can_withdraw:!withdrawn}],items:[{id:'other',title:'Review notes',path:'Year 2',note:''}]}}});
  if(action==='manage_contribution'){calls.push(payload);if(payload.operation==='edit')title=payload.title;else withdrawn=true;return route.fulfill({json:{ok:true,data:{status:withdrawn?'withdrawn':'pending'}}});}
  return route.fallback();
 });
 await page.goto('http://127.0.0.1:4188/#contribute');
 await expect(page.locator('#review-list article')).toHaveCount(1);
 await page.locator('#review-list').getByRole('button',{name:'Request changes',exact:true}).click();
 await expect(page.getByLabel('Review note')).toBeFocused();
 expect(await page.getByLabel('Review note').evaluate(e=>e.checkValidity())).toBe(false);
 await page.getByRole('button',{name:'Edit submission',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Edit submission'});
 await dialog.getByLabel('Title',{exact:true}).fill('Updated submission');
 await dialog.getByRole('button',{name:'Change folder'}).click();
 await page.locator('#picker-folders button').first().click();
 await page.locator('#picker-use').click();
 expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
 await page.screenshot({path:test.info().outputPath('edit-submission.png')});
 await dialog.getByRole('button',{name:'Save changes',exact:true}).click();
 await expect(page.locator('#submission-list')).toContainText('Updated submission');
 await page.getByRole('button',{name:'Withdraw submission',exact:true}).click();
 await page.getByRole('dialog').getByRole('button',{name:'Withdraw submission',exact:true}).click();
 await expect(page.locator('#submission-list')).toContainText('withdrawn');
 await expect(page.locator('#review-list article')).toHaveCount(1);
 expect(calls.map(c=>c.operation)).toEqual(['edit','withdraw']);
 expect(calls[0].target_drive_item_id).toBeTruthy();
});

test('treasury payment requires confirmation and retries the same request',async({page})=>{
 const requests=[];
 await page.route('**/api',async route=>{
  const request=route.request().postDataJSON();
  if(request.action!=='admin_treasury_transfer')return route.fallback();
  requests.push(request.payload);
  if(requests.length===1)return route.fulfill({status:502,json:{ok:false,error:'Temporary failure'}});
  return route.fulfill({json:{ok:true,data:{recipient:'Test member',duplicate:true}}});
 });
 await page.goto('http://127.0.0.1:4188/#activity');
 await page.getByRole('button',{name:'Repository dashboard',exact:true}).click();
 const dialog=page.locator('dialog.repository-dashboard');
 await dialog.getByText('Pay from treasury',{exact:true}).first().click();
 await dialog.getByLabel('Member email or address').fill('test@example.com');
 await dialog.getByLabel('Coins',{exact:true}).fill('2.125');
 await dialog.getByLabel('Reason',{exact:true}).fill('Contribution reward');
 await dialog.getByRole('button',{name:'Review payment'}).click();
 expect(requests).toHaveLength(0);
 await dialog.getByRole('button',{name:'Confirm payment'}).click();
 await expect(dialog.getByRole('button',{name:'Retry payment'})).toBeVisible();
 await page.reload();
 await page.getByRole('button',{name:'Repository dashboard',exact:true}).click();
 await dialog.getByText('Pay from treasury',{exact:true}).first().click();
 await expect(dialog.getByLabel('Coins',{exact:true})).toHaveAttribute('readonly','');
 await dialog.getByRole('button',{name:'Retry payment'}).click();
 await expect(dialog.getByRole('status')).toContainText('Payment recorded');
 expect(requests).toHaveLength(2);expect(requests[0].request_id).toBe(requests[1].request_id);
});

test('economy dashboard shows safe aggregate figures and snapshot charts',async({page})=>{
 await page.route('**/api',async route=>{
  if(route.request().postDataJSON().action!=='website_data')return route.fallback();
  const economy={reserve_millis:10000,outside_millis:6000,mean_millis:3000,median_millis:3000,members:2,transactions_per_day:null,history:[
   {day:'2026-01-01',reserve_millis:9000,outside_millis:7000,mean_millis:3500,median_millis:3500,members:2},
   {day:'2026-01-02',reserve_millis:10000,outside_millis:6000,mean_millis:3000,median_millis:3000,members:2}]};
  return route.fulfill({json:{ok:true,data:{admin:{members:2,active_7_days:1,visits:3,messages:0,files:1,folders:1,new_files:0,users:[],days:[],economy},stats:{},recent:[],additions:[]}}});
 });
 await page.goto('http://127.0.0.1:4188/#activity');
 await page.getByRole('button',{name:'Repository dashboard',exact:true}).click();
 const dialog=page.locator('dialog.repository-dashboard');
 await expect(dialog).toContainText('Coins in reserve');await expect(dialog).toContainText('10');
 await expect(dialog.getByRole('img',{name:/Reserve from 2026-01-01/})).toBeVisible();
 await expect(dialog).toContainText('Historical transactions per day are not yet available');
 expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
 await page.screenshot({path:test.info().outputPath('economy-dashboard.png'),fullPage:true});
});

test('a rejected treasury payment can be corrected',async({page})=>{
 await page.route('**/api',async route=>{
  if(route.request().postDataJSON().action!=='admin_treasury_transfer')return route.fallback();
  return route.fulfill({status:502,json:{ok:false,error:'INSUFFICIENT_BALANCE'}});
 });
 await page.goto('http://127.0.0.1:4188/#activity');
 await page.getByRole('button',{name:'Repository dashboard',exact:true}).click();
 const dialog=page.locator('dialog.repository-dashboard');await dialog.getByText('Pay from treasury',{exact:true}).first().click();
 await dialog.getByLabel('Member email or address').fill('test@example.com');await dialog.getByLabel('Coins',{exact:true}).fill('999');await dialog.getByLabel('Reason',{exact:true}).fill('Correction');
 await dialog.getByRole('button',{name:'Review payment'}).click();await dialog.getByRole('button',{name:'Confirm payment'}).click();
 await expect(dialog.getByRole('status')).toContainText('does not have enough coins');
 await expect(dialog.getByLabel('Coins',{exact:true})).toBeEditable();
});

test('claimed task stays expanded and shows owner status in summary',async({page})=>{
 let claim=null;
 await page.route('**/api',async route=>{
  const {action}=route.request().postDataJSON();
  if(action==='community_tasks')return route.fulfill({json:{ok:true,data:{tasks:[{id:'claim-task',title:'Claim regression task',status:'open',reward_coins:5,votes:0,claim}]}}});
  if(action==='task_claim'){claim={mine:true,expires:Date.now()+7*86400000,submitted:false};return route.fulfill({json:{ok:true,data:claim}});}
  return route.fallback();
 });
 await page.goto('http://127.0.0.1:4188/#contribute');
 const task=page.locator('.task-row');await task.locator('summary').click();
 await task.getByRole('button',{name:'Claim task',exact:true}).click();
 await expect(task.locator('summary')).toContainText('Claimed by you');
 await expect(task).toHaveAttribute('open','');
 await expect(task.getByRole('button',{name:'Release claim',exact:true})).toBeVisible();
});

test('notifications chat has no composer or message actions',async({page})=>{
 await page.route('**/api',async route=>{
  if(route.request().postDataJSON().action!=='chat_hub')return route.fallback();
  return route.fulfill({json:{ok:true,data:{contacts:[],spaces:[{id:'smr-notifications',label:'Notifications',community:'Personal',unread:1}],thread:{id:'smr-notifications',kind:'space',label:'Notifications',can_send:false,can_manage:false,can_leave:false,read_only:true},messages:[{id:'approval',sender:'Notifications',body:'Your submission was approved and added to the repository.',created_at:'2026-11-05T12:00:00Z',mine:false,reactions:[]}]}}});
 });
 await page.goto('http://127.0.0.1:4188/#chat');
 await expect(page.locator('.chat-bubble')).toContainText('approved');
 await expect(page.locator('#message-compose')).toBeHidden();
 await expect(page.getByRole('button',{name:'Reply',exact:true})).toHaveCount(0);
 expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
 await page.screenshot({path:test.info().outputPath('notifications.png'),fullPage:true});
});

test('overlapping review refreshes render each submission only once',async({page})=>{
 let release;const ready=new Promise(resolve=>release=resolve);let requests=0;
 await page.route('**/api',async route=>{
  if(route.request().postDataJSON().action!=='community_review_queue')return route.fallback();
  requests++;await ready;await route.fulfill({json:{ok:true,data:{academic_year:2,is_admin:true,mine:[],items:[{id:'one-review',title:'One stored submission',path:'Year 2',note:''}]}}});
 });
 await page.goto('http://127.0.0.1:4188/#contribute');
 await expect.poll(()=>requests).toBeGreaterThan(0);
 await page.locator('#year-form').evaluate(form=>{form.querySelector('select').value='2';form.requestSubmit();});
 await expect.poll(()=>requests).toBeGreaterThan(1);release();
 await expect(page.locator('#review-list article')).toHaveCount(1);
 await expect(page.locator('#review-list')).toContainText('One stored submission');
});

test('direct contribution starts with a file and can skip a destination',async({page})=>{
 const submitted=[];let uploads=0;
 await page.route('**/api/upload',async route=>{uploads++;expect(route.request().headers().authorization).toBe('Bearer fixture');return route.fulfill({json:{ok:true,data:{id:'upload-fixture'}}});});
 await page.route('**/api',async route=>{const request=route.request().postDataJSON();if(request.action!=='submit_catalogue_contribution')return route.fallback();submitted.push(request.payload);return route.fulfill({json:{ok:true,data:{contribution_id:'new',duplicate:false}}});});
 await page.goto('http://127.0.0.1:4188/#contribute');
 await page.getByRole('button',{name:'Submit material',exact:true}).click();
 const form=page.locator('#contribution-dialog');await expect(form).toBeVisible();
 await page.locator('#choose-contribution-file').evaluate(element=>{const transfer=new DataTransfer();transfer.items.add(new File(['example'],'Revision notes.pdf',{type:'application/pdf'}));element.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:transfer}));});
 await expect(page.locator('#upload-file-label')).toContainText('Revision notes.pdf');
 await page.locator('#contribution-file').setInputFiles({name:'invalid.txt',mimeType:'text/plain',buffer:Buffer.from('wrong')});
 await expect(page.locator('#upload-file-label')).toHaveText('Drop a file here or choose a file');
 await expect(page.locator('#contribution-message')).toContainText('Choose a PDF');
 await page.locator('#contribution-file').setInputFiles({name:'Revision notes.pdf',mimeType:'application/pdf',buffer:Buffer.alloc(50*1024)});
 await expect(page.locator('#upload-file-label')).toContainText('50 KB');
 await page.getByRole('button',{name:'Next',exact:true}).click();
 await expect(page.locator('#contribution-title-input')).toHaveValue('Revision notes.pdf');
 await expect(page.locator('#contribution-target-path')).toHaveText('No folder selected');
 expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
 const surface=form.locator(':scope > .m3e-dialog__container');
 await expect(surface).toHaveCount(1);
 expect(await surface.evaluate(e=>parseFloat(getComputedStyle(e).borderTopLeftRadius))).toBeGreaterThan(0);
 await surface.evaluate(e=>e.scrollTop=e.scrollHeight);
 await expect(form.getByRole('button',{name:'Submit for review',exact:true})).toBeInViewport();
 await surface.evaluate(e=>e.scrollTop=0);
 await page.screenshot({path:test.info().outputPath('upload-contribution.png')});
 await form.getByRole('button',{name:'Submit for review',exact:true}).click();
 await expect(form).toBeHidden();expect(uploads).toBe(1);expect(submitted[0].upload_id).toBe('upload-fixture');
 expect(submitted[0].target_drive_item_id).toBe('');
});
