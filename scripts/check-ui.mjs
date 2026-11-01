import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const adapter=await readFile('src/ui/index.js','utf8');
assert(adapter.includes('@kyralabs/'));
for(const file of await readdir('.')){
 if(!file.endsWith('.js'))continue;
 const source=await readFile(file,'utf8');
 assert(!/from\s+['"]@(?:kyralabs|mui|radix-ui|chakra-ui)/.test(source),'Import UI libraries through src/ui: '+file);
}
const html=await readFile('index.html','utf8');
assert(html.includes('assets/material.css')&&html.includes('assets/material.js'),'Missing library bundle');
assert(!/href=["'][^"']*(mono-theme|expressive-ui)\.css/.test(html),'Do not load competing component styles outside the legacy layer');
console.log('PASS approved UI entry points and stylesheet layering');
