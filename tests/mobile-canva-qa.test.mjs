import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const read=name=>readFile(new URL("../"+name,import.meta.url),"utf8");

test("iPhone Canva acceptance: one visible logo, stacked cards, readable typography",async()=>{
 const [html,css,projects]=await Promise.all([
  read("index.html"),read("canva-mobile-qa-fix.css"),read("allocation-projects.js")
 ]);
 const links=[...html.matchAll(/href="(\/[^"]+\.css[^"]*)"/g)].map(m=>m[1]);
 assert.match(links.at(-2),/^\/canva-mobile-qa-fix\.css\?v=/,"Mobile fixes must load before contrast guard");
 assert.match(links.at(-1),/^\/contrast-guard\.css\?v=/,"All page text must pass contrast guard");
 assert.match(css,/body:not\(\.projectCaptureMode\)[\s\S]*?\.projectPresentationHeader>.\brand|body:not\(\.projectCaptureMode\)[\s\S]*?\.projectOverview>\.projectPresentationHeader>\.brand/,"Presentation duplicate logo must be hidden while global header exists");
 assert.match(css,/\.projectOverviewCards\s*\{\s*display:grid!important;\s*width:100%/,"Cards must be stacked on phone");
 assert.match(css,/grid-template-columns:minmax\(0,1fr\)!important;/,"Single full-width mobile card column");
 assert.match(css,/grid-template-columns:120px minmax\(0,1fr\)!important/,"Gauge gets a fixed clear ring area");
 assert.match(css,/font-size:clamp\(20px,6vw,29px\)!important/,"Share amount has readable numerical typography");
 assert.match(css,/\.projectOverviewLower\s*\{\s*display:flex!important;flex-direction:column!important/,"Trend and detail are stacked");
 assert.match(css,/\.projectRecordPanel\s*\{\s*display:none!important/,"Old bottom record row stays hidden");
 assert.ok(css.includes("var(--mobile-card)"),"Cream cards must be retained");
 assert.equal((projects.match(/brand-logo-transparent-color\.svg/g)||[]).length,1,"Screenshot logo remains available in capture mode");
});
test("Mobile visual CSS is syntactically balanced and cannot embed mock business data",async()=>{
 const css=await read("canva-mobile-qa-fix.css");
 let depth=0,comment=false,quote=null;
 for(let i=0;i<css.length;i++){
  const c=css[i],n=css[i+1];
  if(comment){if(c==="*"&&n==="/"){comment=false;i++;}continue}
  if(quote){if(c==="\\"){i++;continue}if(c===quote)quote=null;continue}
  if(c==="/"&&n==="*"){comment=true;i++;continue}
  if(c==='"'||c==="'"){quote=c;continue}
  if(c==="{")depth++;
  if(c==="}"){depth--;assert.ok(depth>=0,"Unexpected CSS close brace")}
 }
 assert.equal(depth,0);assert.equal(comment,false);assert.equal(quote,null);
 assert.doesNotMatch(css,/36,000,000|2,130,000|fake-data|simulation_only/,"CSS cannot encode mock business values");
});
