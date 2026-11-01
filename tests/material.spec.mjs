import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const member={member_id:'test',school_email:'test@students.uonbi.ac.ke',delivery_email:'test@students.uonbi.ac.ke',handle:'Test member',is_admin:true,available_coins:100,academic_year:2};
test.beforeEach(async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('smr_session_token_v1','fixture'));
 await page.route('**/api',async route=>{
  const action=route.request().postDataJSON()?.action;
  const responses={
   member_catalogue_state:{member,treasury_balance_coins:100,verified_access_ids:[]},
   catalogue_snapshot:{nodes:[],generated_at:new Date().toISOString()},
   site_tips:{tips:[]},
   community_tasks:{tasks:[]},
   community_review_queue:{mine:[],items:[],reviews:[],queue:[],academic_year:2},
   community_profile:{approved_contributions:0,reviews:0,activated_tasks:0,label:'Test member',level:1,points:0,next_level_points:25},
   member_request_history:{items:[],requests:[],history:[]},
   website_data:{avatar_seed:'test',stats:{},recent:[],additions:[]},
   chat_hub:{contacts:[],spaces:[],messages:[]}
  };await route.fulfill({json:{ok:true,data:responses[action]||{}}});
 });
});
for(const view of ['top','contribute','activity','chat']){
 test(view+' accessibility and layout',async({page})=>{
  await page.goto('http://127.0.0.1:4188');
  await page.locator('[data-view="'+view+'"]').click();
  await expect(page.locator('#'+view)).toBeVisible();
  const results=await new AxeBuilder({page}).analyze();
  console.log(view,results.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));
  await page.evaluate(()=>document.fonts.ready);
  await expect(page).toHaveScreenshot(view+'.png',{fullPage:true,animations:'disabled',maxDiffPixelRatio:0.001});
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
