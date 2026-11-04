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
  if(view==='top') await expect(page.locator('#sync-status')).toContainText('Synced');
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
