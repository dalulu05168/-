import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const load=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const logo=load("assets/brand-logo-transparent-color.svg");
const css=load("brand-logo-sharp-header.css");
const index=load("index.html");
const app=load("app.js");

test("original brand logo remains real navy/red vector geometry, never embedded bitmap",()=>{
  assert.match(logo,/^<svg\s/);
  assert.match(logo,/viewBox="123 180 1857 430"/);
  assert.equal((logo.match(/<path\b/g)||[]).length,2);
  assert.doesNotMatch(logo,/<image\b|data:image\/|base64|<filter\b/i);
  assert.match(logo,/fill="#001242"/);
  assert.match(logo,/fill="#900006"/);
  assert.match(app,/class="brandLogo" src="\/assets\/brand-logo-approved\.png/);
});

test("sharp logo styles are the final stylesheet without changing 1mm layout",()=>{
  const links=[...index.matchAll(/rel="stylesheet"[^>]+href="([^"]+)"/g)].map(m=>m[1]);
  assert.match(links.at(-1),/^\/brand-logo-sharp-header\.css\?v=/);
  assert.match(links.at(-2),/^\/crm-1mm-module-spacing\.css\?v=/);
  assert.match(css,/image-rendering:auto!important/);
  assert.match(css,/aspect-ratio:var\(--bv-logo-source-ratio\)!important/);
  assert.match(css,/width:clamp\(260px,18vw,320px\)!important/);
  assert.match(css,/filter:none!important/);
  assert.match(css,/transform:none!important/);
  assert.doesNotMatch(css,/image-rendering:pixelated|filter:blur|transform:scale/);
  assert.match(load("crm-1mm-module-spacing.css"),/--crm-module-gap:1mm/);
});
