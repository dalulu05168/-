import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('Canva visual QA stylesheet loads after every existing theme',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const styleNames=[...html.matchAll(/href="([^"]+\.css(?:\?[^"]*)?)"/g)].map(match=>match[1].split('?')[0]);
 assert.equal(styleNames.at(-1),'/canva-ui-audit-polish.css');
 assert.ok(styleNames.includes('/cream-shell-correction.css'));
 assert.ok(styleNames.includes('/brand-logo-light-fix.css'));
});
test('Canva audit uses the approved warm-white palette and restores readable small labels',async()=>{
 const css=await readFile(new URL('../canva-ui-audit-polish.css',import.meta.url),'utf8');
 for(const required of ['#faf9f5','#fffefa','#e5e9e5','#0e8f7e',
   '.viewportPager','.romaniaClock','.terminalTicker','.terminalChartSubtitleRow',
   '.projectPanelHeading','.dataTable','.brandLogo','font-size:12px!important']){
   assert.ok(css.includes(required),'Missing theme control: '+required);
 }
 assert.match(css,/\.viewportPager[\s\S]*?background:var\(--bv-ui-paper\)!important/);
 assert.match(css,/\.brandLogo[\s\S]*?object-fit:contain!important/);
});
test('production brand asset unchanged and UI audit does not add business data',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/\/app\.js\?v=/);
 const app=await readFile(new URL('../app.js',import.meta.url),'utf8');
 assert.match(app,/brand-logo-transparent-color\.svg/);
 const css=await readFile(new URL('../canva-ui-audit-polish.css',import.meta.url),'utf8');
 assert.doesNotMatch(css,/data:application\/json|fetch\(|supabase|\.onclick|\bprice\s*:/);
});
