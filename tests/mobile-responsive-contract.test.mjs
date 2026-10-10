import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const read=async name=>readFile(new URL("../"+name,import.meta.url),"utf8");

test("Mobile stylesheet loads last without changing desktop frame",async()=>{
 const [html,css,viewport,app]=await Promise.all([
  read("index.html"),read("responsive-mobile-system.css"),read("viewport-layout.js"),read("app.js")
 ]);
 const links=[...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(x=>x[1]);
 assert.match(links.at(-2),/^\/responsive-mobile-system\.css\?v=20261010-mobile-native-v1$/);
 assert.match(links.at(-1),/^\/login-redesign\.css\?v=20261010-form-first-v2$/);
 assert.match(css,/@media \(max-width:899px\)/);
 assert.match(css,/@media \(min-width:600px\) and \(max-width:899px\)/);
 assert.match(css,/@media \(max-width:359px\)/);
 assert.match(viewport,/window\.innerWidth>=900&&window\.innerHeight>=500/);
 assert.match(viewport,/width:1600,height:900/);
 assert.match(app,/brand-logo-transparent-color\.svg/);
 assert.doesNotMatch(css,/https?:\/\/|fetch\(|supabase\./,"CSS cannot mutate business data");
});

test("All nine screens and three dashboard roles have responsive coverage",async()=>{
 const [css,app]=await Promise.all([read("responsive-mobile-system.css"),read("app.js")]);
 for(const marker of [".level1Workspace",".level2Workspace",".tradeflareShell",
  ".level1MetricGrid",".level2MetricGrid",".terminalTicker",".modulePanel",
  ".dataTable",".tableWrap",".level2HoldingsTable",".canvaReferenceMarket",
  ".referenceFeatureCards",".marketListPanel",".reportsLower",".settingsGrid",
  ".settingsList",".projectOverviewCards",".projectOverviewLower",".projectRecordPanel",
  ".modalCard",".loginPage","#clientSharePage",".shareTopbar",".shareKpiRow",
  ".shareMainGrid",".shareLowerGrid",".sharePositions",".shareServicePanel"]){
   assert.ok(css.includes(marker),"Missing responsive treatment for "+marker);
 }
 for(const view of ["dashboard","customers","personnel","trades","positions","market","reports","shareboard","settings"]){
   assert.ok(app.includes('["'+view+'"'),"Missing existing route "+view);
 }
 assert.ok(css.includes("overflow-x:auto!important"),"Wide business tables must scroll");
 assert.ok(css.includes("min-width:820px!important"),"Do not hide trading/holdings columns");
 assert.ok(css.includes(".marketRow"),"Market rows remain accessible");
 assert.ok(css.includes(".nav button.active"),"Active navigation state visible");
 assert.ok(css.includes("position:fixed!important;inset:0!important;z-index:5000!important"),"Customer detail must overlay customer list on phones");
});
test("Mobile CSS syntax is balanced and critical visual contracts remain",async()=>{
 const css=await read("responsive-mobile-system.css");
 let depth=0,comment=false,quote=null;
 for(let i=0;i<css.length;i++){
  const c=css[i],next=css[i+1];
  if(comment){if(c==="*"&&next==="/"){comment=false;i++}continue}
  if(quote){if(c==="\\"){i++;continue}if(c===quote)quote=null;continue}
  if(c==="/"&&next==="*"){comment=true;i++;continue}
  if(c==='"'||c==="'"){quote=c;continue}
  if(c==="{")depth++;
  if(c==="}"){depth--;assert.ok(depth>=0,"Stray closing brace")}
 }
 assert.equal(depth,0);assert.equal(comment,false);assert.equal(quote,null);
 for(const color of ["#FAF9F5","#FFFEFA","#24312E","#138B7D"]){
   assert.ok(css.includes(color),"Canva reference color is absent "+color);
 }
 assert.match(css,/\.brandLogo[\s\S]*?object-fit:contain!important/);
 assert.match(css,/\.projectOverviewCards[\s\S]*?grid-template-columns:minmax\(0,1fr\)!important/);
 assert.ok(css.includes(".viewportPager[hidden]"),"Do not show hidden pagination");
});
