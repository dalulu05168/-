import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
test('Delivery override precedes scoped 1mm navigation stylesheet; no fullscreen',async()=>{
 const [html,app,projects,css]=await Promise.all(['index.html','app.js','allocation-projects.js','delivery-layout.css'].map(read));
 const links=[...html.matchAll(/rel="stylesheet"[^>]+href="([^"]+)"/g)].map(m=>m[1]);
 assert.match(links.at(-3),/^\/delivery-layout\.css\?v=/);
 assert.match(links.at(-2),/^\/crm-1mm-module-spacing\.css\?v=/);
 assert.match(links.at(-1),/^\/brand-logo-sharp-header\.css\?v=/);
 assert.doesNotMatch(app+projects,/requestFullscreen\(/);
 const stripped=css.replace(/\/\*[\s\S]*?\*\//g,'');
 assert.equal([...stripped].filter(x=>x==='{').length,[...stripped].filter(x=>x==='}').length);
 assert.doesNotMatch(css,/https?:\/\/|fetch\(|supabase\./);
});
