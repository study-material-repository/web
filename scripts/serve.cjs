const http = require('http');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const types = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript' };

http.createServer((request, response) => {
  const requested = request.url === '/' ? '/index.html' : request.url;
  const filePath = path.resolve(root, '.' + requested.split('?')[0]);
  if (!filePath.startsWith(root)) { response.writeHead(403).end(); return; }
  fs.readFile(filePath, (error, content) => {
    if (error) { response.writeHead(404).end('Not found'); return; }
    response.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'text/plain' });
    response.end(content);
  });
}).listen(4188, () => console.log('SMR prototype available at http://localhost:4188'));
