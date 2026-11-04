const http = require('http'),
  fs = require('fs'),
  path = require('path');
const root = path.resolve(__dirname, '..');
const test = fs.readFileSync(path.join(root, 'tests/material.spec.mjs'), 'utf8');
const source = test.slice(
  test.indexOf('const responses=') + 16,
  test.indexOf(';await route.fulfill'),
);
const catalogue = JSON.parse(fs.readFileSync(path.join(root, 'catalogue-fallback.json')));
const member = {
  member_id: 'preview',
  school_email: 'preview@students.uonbi.ac.ke',
  handle: 'Preview admin',
  is_admin: true,
  academic_year: 2,
  balance_coins: 100,
};
const responses = new Function('catalogue', 'member', 'return ' + source)(catalogue, member);
responses.chat_hub.spaces.push({ id: 'smr-general', label: 'General', community: 'SMR' });
const injection = `<script>window.previewData=${JSON.stringify(responses)};localStorage.setItem('smr_session_token_v1','local-preview');const realFetch=window.fetch.bind(window);window.fetch=(url,options)=>{if(String(url).endsWith('/api')){const request=JSON.parse(options?.body||'{}');const a=request.action;const p=request.payload||{};if(a==='website_data'&&p.operation==='username'){window.previewData.website_data.username=p.name;window.previewData.community_profile.label=p.name;window.previewData.member_catalogue_state.member.handle=p.name;}if(a==='propose_community_task'){window.previewData.community_tasks.tasks.push({id:'proposal-'+Date.now(),title:p.title,note:p.note,tags:p.tags,status:'proposed',task_type:p.task_type,reward_coins:0,votes:0,created_at:new Date().toISOString()});}if(a==='admin_edit_task'&&p.operation==='tag_catalog'){window.previewData.community_tasks.tags=p.tags;}else if(a==='admin_edit_task'){let task=window.previewData.community_tasks.tasks.find(t=>t.id===p.task_id);if(!task&&!p.task_id){task={id:'preview-'+p.request_id,created_at:new Date().toISOString(),votes:0};window.previewData.community_tasks.tasks.push(task);}if(task)Object.assign(task,{title:p.title,note:p.note,tags:p.tags,priority:p.priority,status:p.status,reward_coins:Number(p.reward_coins)});window.previewData.community_tasks.tasks=window.previewData.community_tasks.tasks.filter(t=>t.status!=='deleted');}return Promise.resolve(new Response(JSON.stringify({ok:true,data:window.previewData[a]||{}}),{headers:{'Content-Type':'application/json'}}));}return realFetch(url,options);};</script>`;
http
  .createServer((req, res) => {
    const target = path.resolve(
      root,
      '.' + (req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]),
    );
    if (!target.startsWith(root + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    fs.readFile(target, (err, data) => {
      if (err) {
        res.writeHead(404).end();
        return;
      }
      const ext = path.extname(target);
      res.setHeader(
        'Content-Type',
        {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.woff2': 'font/woff2',
        }[ext] || 'application/octet-stream',
      );
      res.end(ext === '.html' ? data.toString().replace('<head>', '<head>' + injection) : data);
    });
  })
  .listen(4190, '127.0.0.1', () =>
    console.log('Local sample-data preview: http://localhost:4190/#contribute'),
  );
