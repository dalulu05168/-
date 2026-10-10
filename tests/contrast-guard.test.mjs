import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const load=(file)=>readFile(new URL("../"+file,import.meta.url),"utf8");

function rgb(hex){
  let s=hex.replace("#","");
  return [0,2,4].map(i=>parseInt(s.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
}
function contrast(fg,bg){
  const luminance=v=>v[0]*.2126+v[1]*.7152+v[2]*.0722;
  const [a,b]=[luminance(rgb(fg)),luminance(rgb(bg))].sort((a,b)=>b-a);
  return (a+.05)/(b+.05);
}

test("cream card text contrast is WCAG AA and stays explicitly paired",async()=>{
 const c=await load("contrast-guard.css"),html=await load("index.html");
 assert.match(html,/\/contrast-guard\.css\?v=20261010-contrast-v1/);
 const cssTags=[...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map(x=>x[1]);
 assert.match(cssTags.at(-2),/\/contrast-guard\.css/,"Contrast guard must precede targeted Canva QA");
 assert.match(cssTags.at(-1),/\/canva-fullsite-qa\.css/,"Final visual QA must load last");
 for(const declaration of ["--contrast-paper:#FFFEFA","--contrast-page:#FAF9F5","--contrast-panel:#F7F7F2","--contrast-text:#24312E","--contrast-muted:#61736C"]){
   assert.ok(c.includes(declaration),"Missing paired light surface/dark text "+declaration);
 }
 for(const background of ["#FFFEFA","#FAF9F5","#F7F7F2"]){
   assert.ok(contrast("#24312E",background)>=7,"Main text must have high contrast on "+background);
   assert.ok(contrast("#61736C",background)>=4.5,"Muted labels must remain readable on "+background);
 }
 assert.ok(c.includes(".tradeflareRail")&&c.includes(".terminalChartCard")&&c.includes(".projectPanel")&&c.includes(".marketRow")&&c.includes(".dataTable")&&c.includes(".modalCard"),"Cover legacy dark panels across roles and modals");
 assert.ok(c.includes(".referenceFeatureChange.up")&&c.includes(".referenceFeatureChange.down"),"Financial gain/loss status must be preserved");
 assert.doesNotMatch(c,/filter:grayscale|filter:invert|mix-blend-mode:multiply/,"The source logo cannot be recolored");
});

test("contrast guard CSS is structurally valid",async()=>{
 const css=await load("contrast-guard.css");
 let depth=0,comment=false,quote=null;
 for(let i=0;i<css.length;i++){
   const c=css[i],n=css[i+1];
   if(comment){if(c==="*"&&n==="/"){comment=false;i++}continue}
   if(quote){if(c==="\\"){i++;continue}if(c===quote)quote=null;continue}
   if(c==="/"&&n==="*"){comment=true;i++;continue}
   if(c==='"'||c==="'"){quote=c;continue}
   if(c==="{")depth++;
   if(c==="}"){depth--;assert.ok(depth>=0,"Stray closing CSS brace")}
 }
 assert.equal(depth,0);
 assert.equal(comment,false);
 assert.equal(quote,null);
});
