import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests',timeout:45000,workers:2,
 webServer:{command:'node scripts/serve.cjs',url:'http://127.0.0.1:4188',reuseExistingServer:false},
 use:{headless:true,reducedMotion:'reduce'},
 projects:[
  {name:'chromium-desktop',use:{browserName:'chromium',viewport:{width:1440,height:1000}}},
  {name:'chromium-mobile',use:{browserName:'chromium',viewport:{width:390,height:844}}},
  {name:'firefox-tablet',use:{browserName:'firefox',viewport:{width:834,height:1112}}},
  {name:'webkit-mobile',use:{browserName:'webkit',viewport:{width:390,height:844}}}
 ],reporter:[['list'],['html',{open:'never'}]],
});
