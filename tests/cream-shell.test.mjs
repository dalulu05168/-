import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const load=async name=>readFile(new URL("../"+name,import.meta.url),"utf8");

test("cream UI remains the final stylesheet and includes whole-page overrides",async()=>{
 const [index,cream]=await Promise.all([load("index.html"),load("cream-shell-correction.css")]);
 const links=[...index.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map(m=>m[1]);
 assert.ok(links.some(x=>x.startsWith("/cream-shell-correction.css?")),"cream shell stylesheet must load");
 const creamIndex=links.findIndex(x=>x.startsWith("/cream-shell-correction.css?"));
 const logoIndex=links.findIndex(x=>x.startsWith("/brand-logo-light-fix.css?"));
 const canvaIndex=links.findIndex(x=>x.startsWith("/canva-unified-ui-audit.css?"));
 assert.ok(creamIndex>=0&&canvaIndex===creamIndex+1&&logoIndex===canvaIndex+1&&logoIndex===links.length-1,"cream shell -> Canva visual audit -> original logo contrast must be the final stylesheet order");
 assert.match(cream,/#root#root \.app/,"outer app must be explicitly overridden");
 assert.match(cream,/#root#root \.shell/,"desktop shell must be explicitly overridden");
 assert.match(cream,/\.topbar>\.navFrame/,"sidebar must be covered");
 assert.match(cream,/\.projectOverviewCard/,"project cards must use warm-white surfaces");
 assert.match(cream,/\.projectRecordPanel[\s\S]*?display:none!important/,"legacy history row remains hidden visually");
 assert.match(cream,/#faf9f5/i,"warm white must remain available");
 assert.match(cream,/#e5f0ed/i,"mint surrounding workspace must remain available");
});
test("new cream UI CSS is a real CSS route, not SPA HTML",async()=>{
 const server=await load("server.js");
 assert.ok(server.includes("const cssAsset=")&&server.includes("!cssAsset"),"server should allow root-level CSS assets");
 const css=await load("cream-shell-correction.css");
 assert.ok(css.length>10000,"actual stylesheet content is present");
 assert.doesNotMatch(css,/<html/i);
});
