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
