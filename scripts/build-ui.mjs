import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
await mkdir('assets',{recursive:true});
await build({entryPoints:['src/ui/index.js'],bundle:true,format:'iife',outfile:'assets/material.js',minify:true});
await build({entryPoints:['src/ui/index.css'],bundle:true,outfile:'assets/material.css',loader:{'.woff2':'file'},minify:true});
const names=['styles.css','community-layout.css','ui-components.css','mono-theme.css','expressive-ui.css'];
const legacy=(await Promise.all(names.map(n=>readFile(n,'utf8')))).join('\n');
await writeFile('assets/legacy.css','@layer legacy {\n'+legacy+'\n}');
