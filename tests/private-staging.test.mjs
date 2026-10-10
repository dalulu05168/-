import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {spawn} from "node:child_process";
import {createServer} from "node:net";
import {fileURLToPath} from "node:url";
import path from "node:path";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=name=>readFile(path.join(root,name),"utf8");

test("P005 private staging cannot initialize the live Supabase client",async()=>{
  const app=await read("app.js");
  assert.match(app,/const demoMode=true;/);
  assert.match(app,/const SUPABASE_URL = "https:\/\/preview-data\.invalid";/);
  assert.match(app,/const SUPABASE_KEY = "disabled-in-private-staging";/);
  assert.doesNotMatch(app,/igcmvzoxminzvcgwimwi|sb_publishable_/);
  assert.match(app,/brand-logo-transparent-color\\.svg/);
  const start=app.indexOf("function renderLogin(initialized)");
  const end=app.indexOf("async function bootstrap",start);
  const loginUi=app.slice(start,end);
  assert.match(loginUi,/if\(demoMode\)\{/);
  assert.match(loginUi,/const accounts=supabase\.previewAccounts\(\)/);
  assert.match(loginUi,/id="stagingDemoRole"/);
  assert.match(loginUi,/无需输入真实用户名或密码/);
  assert.match(loginUi,/supabase\.selectPreviewAccount\(selected\)/);
  assert.match(loginUi,/else\{[\s\S]*form\.addEventListener\("submit",initialized\?login:bootstrap\)/);
  assert.ok(loginUi.indexOf("supabase.selectPreviewAccount(selected)") <
            loginUi.indexOf('form.addEventListener("submit",initialized?login:bootstrap)'),
            "Demo branch must precede actual authentication path");
});

async function port(){
  const s=createServer();
  await new Promise((ok,fail)=>s.once("error",fail).listen(0,"127.0.0.1",ok));
  const n=s.address().port;
  await new Promise(ok=>s.close(ok));
  return n;
}

test("P005 staging HTTP denies unauthenticated access and serves only a protected demo", {timeout:20000},async t=>{
  const p=await port(),origin="http://127.0.0.1:"+p;
  const user="local-auditor",pass="staging-test-32-character-secret";
  const server=spawn(process.execPath,["server.js"],{cwd:root,stdio:["ignore","pipe","pipe"],env:{...process.env,PORT:String(p),STAGING_PREVIEW:"1",STAGING_PREVIEW_USERNAME:user,STAGING_PREVIEW_PASSWORD:pass}});
  t.after(()=>{if(server.exitCode===null)server.kill("SIGTERM")});
  let stderr="";server.stderr.on("data",v=>stderr+=v);
  let ready=false;
  for(let i=0;i<80;i++){try{const r=await fetch(origin+"/healthz");if(r.status===200){ready=true;break}}catch{}if(server.exitCode!==null)break;await new Promise(r=>setTimeout(r,100))}
  assert.ok(ready,"Private staging test server must start: "+stderr);
  const no=await fetch(origin+"/?demo=1&loginPreview=1");
  assert.equal(no.status,401);
  assert.match(no.headers.get("www-authenticate")||"",/^Basic/);
  assert.match(no.headers.get("x-robots-tag")||"",/noindex/);
  const unauthorizedApi=await fetch(origin+"/api/security-info?symbol=TLV.RO");
  assert.equal(unauthorizedApi.status,401);
  const wrong=await fetch(origin+"/",{headers:{Authorization:"Basic "+Buffer.from(user+":incorrect").toString("base64")}});
  assert.equal(wrong.status,401);
  const headers={Authorization:"Basic "+Buffer.from(user+":"+pass).toString("base64")};
  const redirect=await fetch(origin+"/",{headers,redirect:"manual"});
  assert.equal(redirect.status,302);
  assert.equal(redirect.headers.get("location"),"/?demo=1&loginPreview=1");
  const html=await fetch(origin+"/?demo=1&loginPreview=1",{headers});
  assert.equal(html.status,200);
  assert.match(await html.text(),/Brantone Veylor/);
  const js=await fetch(origin+"/app.js",{headers});
  assert.equal(js.status,200);
  assert.match(await js.text(),/const demoMode=true;/);
});
