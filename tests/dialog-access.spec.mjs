import {test, expect} from '@playwright/test';
const member = {member_id:'fixture',school_email:'student@example.com',delivery_email:'student@example.com'};
const nodes = [
 {id:'root',name:'Root',kind:'folder',parent_id:'',access:{mode:'open'}},
 {id:'folder',name:'🪙',kind:'folder',parent_id:'root',coin_marked:true,access:{mode:'locked_folder'}},
 {id:'file',name:'Example exam',kind:'file',parent_id:'folder',access:{mode:'requestable',price_millis:1000}},
];
for (const dismiss of ['escape', 'native']) test('access confirmation can be retried after ' + dismiss + ' dismissal', async ({page}) => {
 let checks = 0;
 await page.addInitScript(() => localStorage.setItem('smr_session_token_v1','fixture'));
 await page.route('**/api', async route => {
  const request = route.request().postDataJSON();
  const responses = {
   catalogue_snapshot:{nodes,stale:false}, member_catalogue_state:{member,owned_item_ids:[],verified_access_ids:[]},
   site_tips:{tips:[]}, community_tasks:{tasks:[]}, community_review_queue:{mine:[],items:[]},
   community_profile:{},member_request_history:{items:[],requests:[],history:[]},
   website_data:{stats:{},recent:[],additions:[]},chat_hub:{contacts:[],spaces:[],messages:[]},
  };
  if (request.action === 'request_catalogue_access') {
   checks++;
   await new Promise(resolve => setTimeout(resolve, 200));
   return route.fulfill({json:{ok:true,data:{status:'ACCESS_REQUIRED',price_coins:1,check_token:'fixture-token'}}});
  }
  return route.fulfill({json:{ok:true,data:responses[request.action] || {}}});
 });
 await page.goto('http://127.0.0.1:4188/');
 await page.locator('[data-view="top"]').click();
 await page.getByRole('button',{name:'Search materials'}).click();
 await page.locator('#catalogue-search').fill('Example exam');
 const open = page.getByRole('button',{name:'Open file',exact:true}).first();
 await open.click();
 const dialog = page.locator('#request-dialog');
 await expect(dialog).toBeVisible();
 await expect(dialog.locator('#confirm-request')).toHaveText('Request access');
 await expect(dialog.locator('#request-summary')).toContainText('1');
 if (dismiss === 'escape') await page.keyboard.press('Escape');
 else await dialog.evaluate(element => element.close());
 await expect(dialog).toBeHidden();
 await open.click();
 await expect(dialog).toBeVisible();
 await expect(dialog.locator('#confirm-request')).toHaveText('Request access');
 expect(checks).toBe(2);
});

test('folder picker hands off to contribution and can be opened again', async ({page}) => {
 await page.addInitScript(() => localStorage.setItem('smr_session_token_v1','fixture'));
 await page.route('**/api', async route => {
  const action = route.request().postDataJSON().action;
  const values = {catalogue_snapshot:{nodes,stale:false},member_catalogue_state:{member,owned_item_ids:[],verified_access_ids:[]},
   site_tips:{tips:[]},community_tasks:{tasks:[]},community_review_queue:{mine:[],items:[]},
   member_request_history:{items:[],requests:[],history:[]},website_data:{stats:{},recent:[],additions:[]},
   chat_hub:{contacts:[],spaces:[],messages:[]}};
  await route.fulfill({json:{ok:true,data:values[action]||{}}});
 });
 await page.goto('http://127.0.0.1:4188/');
 await page.locator('[data-view="contribute"]').click();
 await page.locator('#contribute-button').click();
 const picker=page.locator('#folder-picker');
 await expect(picker).toBeVisible();
 await picker.getByRole('button',{name:'Root ›'}).click();
 await picker.locator('#picker-use').click();
 const contribution=page.locator('#contribution-dialog');
 await expect(contribution).toBeVisible();
 await expect(contribution).toContainText('Root');
 await contribution.locator('#close-contribution-dialog').click();
 await expect(contribution).toBeHidden();
 await page.locator('#contribute-button').click();
 await expect(picker).toBeVisible();
});

test('access check updates the same dialog and purchase requires confirmation', async ({page}) => {
 const requests = [];
 await page.addInitScript(() => localStorage.setItem('smr_session_token_v1','fixture'));
 await page.route('**/api', async route => {
  const request=route.request().postDataJSON();
  const values={catalogue_snapshot:{nodes,stale:false},member_catalogue_state:{member,owned_item_ids:[],verified_access_ids:[]},
   site_tips:{tips:[]},community_tasks:{tasks:[]},community_review_queue:{mine:[],items:[]},
   member_request_history:{items:[],requests:[],history:[]},website_data:{stats:{},recent:[],additions:[]},
   chat_hub:{contacts:[],spaces:[],messages:[]}};
  if(request.action==='request_catalogue_access') {
   requests.push(request.payload);
   await new Promise(resolve=>setTimeout(resolve, 250));
   const data=request.payload.check_only ? {status:'ACCESS_REQUIRED',price_coins:1,check_token:'fixture-token'} : {status:'COMPLETED'};
   return route.fulfill({json:{ok:true,data}});
  }
  await route.fulfill({json:{ok:true,data:values[request.action]||{}}});
 });
 await page.goto('http://127.0.0.1:4188/');
 await page.locator('[data-view="top"]').click();
 await page.getByRole('button',{name:'Search materials'}).click();
 await page.locator('#catalogue-search').fill('Example exam');
 await page.locator('#request-dialog').evaluate(dialog=>{window.dialogCloseEvents=0;dialog.addEventListener('close',()=>window.dialogCloseEvents++);});
 await page.getByRole('button',{name:'Open file',exact:true}).first().click();
 const dialog=page.locator('#request-dialog');
 await expect(dialog).toBeVisible();
 await expect(dialog.locator('#confirm-request')).toHaveText('Request access');
 expect(await page.evaluate(()=>window.dialogCloseEvents)).toBe(0);
 expect(requests).toHaveLength(1);
 expect(requests[0].check_only).toBe(true);
 await dialog.locator('#confirm-request').click();
 await expect(dialog.locator('#confirm-request')).toHaveText('Open file');
 expect(await page.evaluate(()=>window.dialogCloseEvents)).toBe(0);
 expect(requests).toHaveLength(2);
 expect(requests[1].check_only).toBe(false);
 expect(requests[1].check_token).toBe('fixture-token');
 await dialog.locator('#cancel-request').click();
 await expect(dialog).toBeHidden();
});

test('failed access check can be retried without purchasing', async ({page}) => {
 let checks=0;
 await page.addInitScript(()=>localStorage.setItem('smr_session_token_v1','fixture'));
 await page.route('**/api',async route=>{
  const request=route.request().postDataJSON();
  const values={catalogue_snapshot:{nodes,stale:false},member_catalogue_state:{member,owned_item_ids:[],verified_access_ids:[]},
   site_tips:{tips:[]},community_tasks:{tasks:[]},community_review_queue:{mine:[],items:[]},
   member_request_history:{items:[],requests:[],history:[]},website_data:{stats:{},recent:[],additions:[]},
   chat_hub:{contacts:[],spaces:[],messages:[]}};
  if(request.action==='request_catalogue_access'){
   checks++;
   if(checks===1)return route.fulfill({status:400,json:{ok:false,error:'Simulated check failure'}});
   return route.fulfill({json:{ok:true,data:{status:'ACCESS_REQUIRED',price_coins:1,check_token:'fixture-token'}}});
  }
  return route.fulfill({json:{ok:true,data:values[request.action]||{}}});
 });
 await page.goto('http://127.0.0.1:4188/');
 await page.locator('[data-view="top"]').click();
 await page.getByRole('button',{name:'Search materials'}).click();
 await page.locator('#catalogue-search').fill('Example exam');
 const open=page.getByRole('button',{name:'Open file',exact:true}).first();
 await open.click();
 await expect(page.locator('#toast')).toContainText('Simulated check failure');
 await expect(page.locator('#request-dialog')).toBeHidden();
 await open.click();
 await expect(page.locator('#request-dialog')).toBeVisible();
 await expect(page.locator('#confirm-request')).toHaveText('Request access');
 expect(checks).toBe(2);
});
