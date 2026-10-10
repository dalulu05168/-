import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const get=path=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("Canva audit fix loads after unified palette and before protected logo",async()=>{
 const html=await get("index.html");
 const files=[...html.matchAll(/href="([^"]+\.css(?:\?[^"]*)?)"/g)].map(m=>m[1].split("?")[0]);
 assert.equal(files.at(-1),"/brand-logo-light-fix.css");
 assert.equal(files.at(-2),"/canva-ui-audit-polish.css");
 assert.equal(files.at(-3),"/canva-unified-ui-audit.css");
});
test("Canva design audit fixes tiny controls, blue pager, clock and ticker overflow",async()=>{
 const css=await get("canva-ui-audit-polish.css");
 for(const required of ["#faf9f5","#fffefa","#e5e9e5","#0e8f7e",
  ".viewportPager",".romaniaClock",".terminalTicker",".terminalChartSubtitleRow",
  ".projectPanelHeading",".dataTable",".brandLogo","font-size:12px!important"]){
   assert.ok(css.includes(required),"Missing Canva audit item: "+required);
 }
 assert.match(css,/\.viewportPager[\s\S]*?background:var\(--bv-ui-paper\)!important/);
 assert.match(css,/\.brandLogo[\s\S]*?object-fit:contain!important/);
 assert.ok(css.includes("#root#root #main#main#main#main#main"),"High specificity must outrank legacy theme selectors");
});
test("new style changes only presentation and keeps the existing brand asset",async()=>{
 const app=await get("app.js");
 const svg=await get("assets/brand-logo-transparent-color.svg");
 assert.match(app,/brand-logo-transparent-color\.svg/);
 assert.match(svg,/viewBox="123 180 1857 430"/);
 const css=await get("canva-ui-audit-polish.css");
 assert.doesNotMatch(css,/data:application\/json|fetch\(|supabase|\.onclick|\bprice\s*:/);
});
