import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const load=async name=>readFile(new URL("../"+name,import.meta.url),"utf8");

test("cream UI remains the final stylesheet and includes whole-page overrides",async()=>{
 const [index,cream]=await Promise.all([load("index.html"),load("cream-shell-correction.css")]);
 const links=[...index.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map(m=>m[1]);
 assert.match(links.at(-1),/^\/cream-shell-correction\.css\?v=/,"full-cream shell MUST load last");
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
 assert.match(server,/const cssAsset=\/\^\\\/[a-zA-Z0-9]/,"server should allow root-level CSS assets");
 const css=await load("cream-shell-correction.css");
 assert.ok(css.length>10000,"actual stylesheet content is present");
 assert.doesNotMatch(css,/<html/i);
});
