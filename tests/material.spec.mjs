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
   community_tasks:{tasks:[{id:'fixture-open',title:'Add worked examples for Introduction to Programming',status:'open',target_path:'Year 1 / Semester 1',note:'Explain loops and arrays with clear examples.',reward_coins:5,votes:3},{id:'fixture-unfunded',title:'Organise past papers for Cloud Computing Technology & Applications',status:'open',target_path:'Year 4 / Semester 1',note:'Group papers by year and include marking guides where available.',reward_coins:0,votes:0}]},
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


