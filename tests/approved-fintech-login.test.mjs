import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const read=name=>readFile(new URL("../"+name,import.meta.url),"utf8");

test("Approved navy/red enterprise login theme is the final scoped rule-set",async()=>{
  const [css,html]=await Promise.all([read("login-redesign.css"),read("index.html")]);
  const marker="/* P005 — Approved fintech login visual system, 2026-10-10 */";
  const start=css.lastIndexOf(marker);
  assert.ok(start>0,"Updated design system must be present and loaded after legacy overrides");
  const final=css.slice(start);
  assert.match(html,/<link rel="stylesheet" href="\/login-redesign\.css\?/);
  assert.ok(final.includes("--login-accent:#17386F"));
  assert.ok(final.includes("--login-ink:#142744"));
  assert.ok(final.includes("background:#17386F!important"));
  assert.ok(final.includes("background:#A31628!important"));
  assert.ok(final.includes("grid-template-columns:minmax(0,1.08fr) minmax(390px,.92fr)"));
  assert.ok(final.includes("@media (max-width:899px)"));
  assert.ok(final.includes("@media(max-width:359px)"));
  assert.ok(final.includes("font-size:16px!important"));
  assert.ok(final.includes("prefers-reduced-motion:reduce"));
  assert.ok(!/fake_(?:data|price|stock)|\d{4}\.\d{2}.*demo/i.test(final));
});

test("The live login and admin bootstrap both retain actual Supabase authentication",async()=>{
  const [app,svg]=await Promise.all([read("app.js"),read("assets/brand-logo-transparent-color.svg")]);
  const start=app.indexOf("function renderLogin(initialized)");
  const end=app.indexOf("async function loadProfileAndStart()",start);
  assert.ok(start>=0&&end>start,"Actual login view must be present");
  const login=app.slice(start,end);
  for(const name of ['id="loginForm"','name="username"','name="password"']){
    // The form uses a dynamic initialized/bootstrap id; account/password are literal controls.
    if(name==='id="loginForm"')assert.ok(login.includes('"loginForm":"bootstrapForm"'));
    else assert.ok(login.includes(name));
  }
  assert.match(login,/form\.addEventListener\("submit",initialized\?login:bootstrap\)/);
  assert.match(login,/supabase\.auth\.signInWithPassword/);
  assert.match(login,/username\+"@crm\.nuvexapro\.com"/);
  assert.match(login,/\/functions\/v1\/bootstrap-admin/);
  assert.ok(login.includes("brand-logo-transparent-color.svg"));
  assert.match(svg,/viewBox="101 127 1874 431"/);
  assert.ok(svg.includes('fill="#001242"')&&svg.includes('fill="#900006"'));
  assert.doesNotMatch(svg,/<(?:rect|image)\b/);
  assert.doesNotMatch(login,/虚拟行情|模拟股票盈利|交易所排行榜/);
});
