import {test,expect} from '@playwright/test';
const member={member_id:'test',school_email:'test@example.com',delivery_email:'test@example.com',is_admin:false};
test('navigation unread badge tracks notifications without marking background checks read',async({page})=>{
 let unread=2;const calls=[];
 await page.addInitScript(()=>localStorage.setItem('smr_session_token_v1','fixture'));
 await page.route('**/api',async route=>{
  const {action,payload}=route.request().postDataJSON();
  const values={member_catalogue_state:{member,owned_item_ids:[],verified_access_ids:[]},catalogue_snapshot:{nodes:[],stale:false},site_tips:{tips:[]},community_tasks:{tasks:[]},community_review_queue:{mine:[],items:[]},community_profile:{},member_request_history:{items:[],requests:[],history:[]},website_data:{stats:{},recent:[],additions:[]}};
  if(action==='chat_hub'){
   calls.push(payload);
   const selected=payload.space_id==='smr-notifications';
   const data={contacts:[],spaces:[{id:'smr-notifications',label:'Notifications',community:'Personal',unread}],thread:selected?{id:'smr-notifications',kind:'space',label:'Notifications',read_only:true,can_send:false}:null,messages:selected?[{id:'n1',sender:'Notifications',body:'Hello',created_at:'2026-11-11T00:00:00Z',mine:false,reactions:[]}]:[]};
   if(selected&&payload.mark_read)unread=0;
   return route.fulfill({json:{ok:true,data}});
  }
  return route.fulfill({json:{ok:true,data:values[action]||{}}});
 });
 await page.goto('http://127.0.0.1:4188/');
 const badge=page.locator('.chat-unread-badge');
 const nav=page.locator('[data-view="chat"]');
 await expect(badge).toBeVisible();
 await expect(nav).toHaveAttribute('aria-label','Chat, unread messages');
 await page.screenshot({path:test.info().outputPath('unread-indicator.png')});
 expect(calls.some(c=>c.mark_read===false)).toBe(true);
 expect(calls.some(c=>c.mark_read===true)).toBe(false);
 await nav.click();
 await page.getByRole('button',{name:/Notifications/}).click();
 await expect(badge).toBeHidden();
 await expect(nav).not.toHaveAttribute('aria-label','Chat, unread messages');
 expect(calls.some(c=>c.space_id==='smr-notifications'&&c.mark_read===true)).toBe(true);
});

test('sign-out clears unread badge and ignores delayed background results',async({page})=>{
 let calls=0,release;const pending=new Promise(resolve=>{release=resolve});
 await page.addInitScript(()=>localStorage.setItem('smr_session_token_v1','fixture'));
 await page.route('**/api',async route=>{
  const {action,payload}=route.request().postDataJSON();
  const values={member_catalogue_state:{member,owned_item_ids:[],verified_access_ids:[]},catalogue_snapshot:{nodes:[],stale:false},site_tips:{tips:[]},community_tasks:{tasks:[]},community_review_queue:{mine:[],items:[]},community_profile:{},member_request_history:{items:[],requests:[],history:[]},website_data:{stats:{},recent:[],additions:[]},sign_out:{signed_out:true}};
  if(action==='chat_hub'){
   if(!payload.space_id&&!payload.peer){calls++;if(calls>1)await pending;}
   return route.fulfill({json:{ok:true,data:{contacts:[],spaces:[{id:'smr-notifications',label:'Notifications',community:'Personal',unread:1}],thread:null,messages:[]}}});
  }
  return route.fulfill({json:{ok:true,data:values[action]||{}}});
 });
 await page.goto('http://127.0.0.1:4188/');
 const badge=page.locator('.chat-unread-badge');await expect(badge).toBeVisible();
 await page.locator('[data-view="activity"]').click();
 await page.locator('#activity-account').click();
 await expect(page.locator('#sign-out')).toBeVisible();
 await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 await expect.poll(()=>calls).toBeGreaterThan(1);
 await page.locator('#sign-out').click();
 await expect(badge).toBeHidden();
 release();
 await expect(badge).toBeHidden();
 await expect(page.locator('[data-view="chat"]')).not.toHaveAttribute('aria-label','Chat, unread messages');
});

test('background refresh detects direct-message unread without marking it read',async({page})=>{
 let unread=0,checks=0;
 await page.addInitScript(()=>localStorage.setItem('smr_session_token_v1','fixture'));
 await page.route('**/api',async route=>{
  const {action,payload}=route.request().postDataJSON();
  const values={member_catalogue_state:{member,owned_item_ids:[],verified_access_ids:[]},catalogue_snapshot:{nodes:[],stale:false},site_tips:{tips:[]},community_tasks:{tasks:[]},community_review_queue:{mine:[],items:[]},community_profile:{},member_request_history:{items:[],requests:[],history:[]},website_data:{stats:{},recent:[],additions:[]}};
  if(action==='chat_hub'){
   if(!payload.peer&&!payload.space_id){checks++;expect(payload.mark_read).toBe(false);}
   return route.fulfill({json:{ok:true,data:{contacts:[{id:'peer',label:'Peer',unread}],spaces:[],thread:null,messages:[]}}});
  }
  return route.fulfill({json:{ok:true,data:values[action]||{}}});
 });
 await page.goto('http://127.0.0.1:4188/');
 await expect.poll(()=>checks).toBeGreaterThan(0);
 const badge=page.locator('.chat-unread-badge');await expect(badge).toBeHidden();
 unread=1;
 await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 await expect.poll(()=>checks).toBeGreaterThan(1);
 await expect(badge).toBeVisible();
});
