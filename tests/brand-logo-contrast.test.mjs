import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const read=name=>readFile(new URL("../"+name,import.meta.url),"utf8");
test("the original logo shapes are preserved while dark text matches the user-supplied transparent logo",async()=>{
  const [oldBrand,newBrand]=await Promise.all([read("assets/brand-logo-vector.svg"),read("assets/brand-logo-transparent-color.svg")]);
  assert.match(newBrand,/<svg[^>]*viewBox="123 180 1857 430"/);
  const shape=s=>[...s.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(shape(newBrand),shape(oldBrand),"logo paths must remain unchanged");
  assert.match(newBrand,/fill="#001242"/);
  assert.match(newBrand,/fill="#900006"/);
  assert.doesNotMatch(newBrand,/<rect\b/i,"transparent logo cannot have an opaque backdrop");
});
test("all application logo occurrences use the new transparent asset and remove blue plaque",async()=>{
  const [app,projects,css,index]=await Promise.all([read("app.js"),read("allocation-projects.js"),read("brand-logo-light-fix.css"),read("index.html")]);
  assert.equal((app.match(/brand-logo-transparent-color\.svg/g)||[]).length,3,"login, shell and customer share use the same logo");
  assert.equal((projects.match(/brand-logo-transparent-color\.svg/g)||[]).length,1,"project screenshot uses the same logo");
  assert.match(index,/brand-logo-light-fix\.css/);
  const cssLinks=[...index.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map(x=>x[1]);
  assert.match(cssLinks.at(-4),/^\/brand-logo-light-fix\.css/,"original logo contrast loads before mobile QA");
  assert.match(cssLinks.at(-3),/^\/canva-mobile-qa-fix\.css/,"mobile QA must retain original transparent logo");
  assert.match(cssLinks.at(-2),/^\/contrast-guard\.css/,"contrast guard must not recolor the logo");
  assert.match(cssLinks.at(-1),/^\/canva-fullsite-qa\.css/,"full site layout protects original SVG");
  assert.match(css,/\.topbar>\.brand/);
  assert.match(css,/background:transparent!important/);
});
