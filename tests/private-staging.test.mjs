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
  assert.match(app,/brand-logo-transparent-color\.svg/);
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

test("P005 embedded browser login uses a secure HTML form, not a native popup", {timeout:20000},async t=>{
  const p=await port(),origin="http://127.0.0.1:"+p;
  const user="local-auditor",pass="staging-test-32-character-secret";
  const server=spawn(process.execPath,["server.js"],{
    cwd:root,stdio:["ignore","pipe","pipe"],
    env:{...process.env,PORT:String(p),STAGING_PREVIEW:"1",STAGING_PREVIEW_USERNAME:user,STAGING_PREVIEW_PASSWORD:pass}
  });
  t.after(()=>{if(server.exitCode===null)server.kill("SIGTERM")});
  let stderr="";server.stderr.on("data",v=>stderr+=v);
  let ready=false;
  for(let i=0;i<80;i++){
    try{const r=await fetch(origin+"/healthz");if(r.status===200){ready=true;break}}catch{}
    if(server.exitCode!==null)break;
    await new Promise(r=>setTimeout(r,100));
  }
  assert.ok(ready,"Private staging server must start: "+stderr);

  // Native Basic challenge is gone: the initial page itself is always reachable.
  const page=await fetch(origin+"/");
  assert.equal(page.status,200);
  assert.equal(page.headers.get("www-authenticate"),null);
  assert.match(page.headers.get("x-robots-tag")||"",/noindex/);
  assert.match(page.headers.get("cache-control")||"",/no-store/);
  const html=await page.text();
  assert.match(html,/action="\/_preview\/login" method="POST"/);
  assert.match(html,/name="username"/);
  assert.match(html,/name="password" type="password"/);
  assert.match(html,/Brantone Veylor/i);

  const withoutCookie=await fetch(origin+"/api/security-info?symbol=TLV.RO");
  assert.equal(withoutCookie.status,401);
  const privateAsset=await fetch(origin+"/app.js");
  assert.equal(privateAsset.status,401);
  const privateCrmModule=await fetch(origin+"/crm-six-page.js");
  assert.equal(privateCrmModule.status,401,"New CRM module must stay behind the private gate");
  const privateBoot=await fetch(origin+"/crm-boot.js");
  assert.equal(privateBoot.status,401,"Recovery bootstrap also requires authentication");
  const fakeBasic=await fetch(origin+"/app.js",{
    headers:{Authorization:"Basic "+Buffer.from(user+":"+pass).toString("base64")}
  });
  assert.equal(fakeBasic.status,401,"Basic auth must no longer bypass the session gate");

  const bad=await fetch(origin+"/_preview/login",{
    method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams({username:user,password:"incorrect"}),redirect:"manual"
  });
  assert.equal(bad.status,401);
  assert.equal(bad.headers.get("set-cookie"),null);
  assert.match(await bad.text(),/用户名或密码不正确/);

  const signIn=await fetch(origin+"/_preview/login",{
    method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams({username:user,password:pass}),redirect:"manual"
  });
  assert.equal(signIn.status,303);
  assert.equal(signIn.headers.get("location"),"/?demo=1&loginPreview=1");
  const cookieHeader=signIn.headers.get("set-cookie")||"";
  assert.match(cookieHeader,/HttpOnly/);
  assert.match(cookieHeader,/Secure/);
  assert.match(cookieHeader,/SameSite=Lax/);
  const cookie=cookieHeader.split(";")[0];

  const redirect=await fetch(origin+"/",{headers:{Cookie:cookie},redirect:"manual"});
  assert.equal(redirect.status,302);
  assert.equal(redirect.headers.get("location"),"/?demo=1&loginPreview=1");

  const authorized=await fetch(origin+"/?demo=1&loginPreview=1",{headers:{Cookie:cookie}});
  assert.equal(authorized.status,200);
  assert.match(await authorized.text(),/Brantone Veylor/);
  const js=await fetch(origin+"/app.js",{headers:{Cookie:cookie}});
  assert.equal(js.status,200);
  assert.match(js.headers.get("cache-control")||"",/no-store/);
  assert.match(await js.text(),/const demoMode=true;/);
  const crmModule=await fetch(origin+"/crm-six-page.js",{headers:{Cookie:cookie}});
  assert.equal(crmModule.status,200);
  assert.match(await crmModule.text(),/renderCrmTrades/);
  const publicBoot=await fetch(origin+"/crm-boot.js",{headers:{Cookie:cookie}});
  assert.equal(publicBoot.status,200);
  assert.match(await publicBoot.text(),/showBootError/);
  const invalid=await fetch(origin+"/app.js",{headers:{Cookie:"p005_preview_session=1234567890."+ "0".repeat(64)}});
  assert.equal(invalid.status,401);
});


test("P005 six-page account hierarchy filters unauthorized descendants",async()=>{
 const {__crmHelpers,renderCrmCustomers,renderCrmPersonnel,renderCrmTrades,renderCrmPositions,renderCrmReports}=await import("../crm-six-page.js");
 for(const item of [renderCrmCustomers,renderCrmPersonnel,renderCrmTrades,renderCrmPositions,renderCrmReports])assert.equal(typeof item,"function");
 const state={staff:[
  {id:"admin",status:"active"},
  {id:"level1",parent_user_id:"admin",status:"active"},
  {id:"level2",parent_user_id:"level1",status:"active"},
  {id:"other",parent_user_id:"elsewhere",status:"active"},
  {id:"deleted",parent_user_id:"admin",status:"deleted"}
 ],customers:[{id:"mine",owner_user_id:"level2"},{id:"notmine",owner_user_id:"other"},{id:"old",owner_user_id:"deleted"}]};
 assert.deepEqual([...__crmHelpers.descendantIds(state,"admin")].sort(),["admin","level1","level2"]);
 assert.deepEqual(__crmHelpers.visibleClients(state,"admin").map(c=>c.id),["mine"]);
 assert.deepEqual(__crmHelpers.visibleClients(state,"level1").map(c=>c.id),["mine"]);
 assert.deepEqual(__crmHelpers.visibleClients(state,"other").map(c=>c.id),["notmine"]);
 const [app,html,server,css]=await Promise.all(["app.js","index.html","server.js","crm-six-page.css"].map(read));
 assert.match(app,/renderCrmCustomers\(featureCtx\(\)\)/);
 assert.match(app,/grid:\{display:false\}/);
 assert.match(html,/crm-six-page\.css/);
 assert.match(server,/crm-six-page\.js/);
 assert.match(css,/crmCardGrid/);
});


test("Customer-facing reservation only includes confirmed records for one owner, project and customer",async()=>{
 const {__facingTest}=await import("../customer-facing.js");
 const project={id:"p1",owner_user_id:"staff-one",name:"Example"};
 const ctx={state:{
  customers:[{id:"c1",owner_user_id:"staff-one",name:"Customer One"},{id:"c2",owner_user_id:"staff-two",name:"Private Other"}],
  customerReservations:[
   {id:"r1",project_id:"p1",owner_user_id:"staff-one",customer_id:"c1",status:"confirmed",reserved_shares:10},
   {id:"r2",project_id:"p1",owner_user_id:"staff-two",customer_id:"c2",status:"confirmed",reserved_shares:20},
   {id:"r3",project_id:"p1",owner_user_id:"staff-one",customer_id:"c1",status:"pending",reserved_shares:30},
   {id:"r4",project_id:"p2",owner_user_id:"staff-one",customer_id:"c1",status:"confirmed",reserved_shares:40},
  ]
 }};
 const visible=__facingTest.visibleRows(ctx,project);
 assert.deepEqual(visible.map(r=>r.id),["r1"]);
 assert.equal(visible[0].client.name,"Customer One");
 const safeMarkup=__facingTest.frame({
  kind:"reservation",project:"Example",quantity:"10 份",amount:"未记录",status:"系统记录已确认",owner:"Service",
  client:"Customer One",code:"C01",generated:"2026-10-11",recordCount:"1",updated:"2026-10-11",symbol:"EX",projectDate:"2026-10-11",demo:true
 });
 assert.match(safeMarkup,/演示预览/);
 assert.doesNotMatch(safeMarkup,/Private Other|20 份|40 份/);
 assert.match(safeMarkup,/不表示资金到账/);
});

test("Customer-facing service report does not auto-publish internal follow-up notes",async()=>{
 const {__facingTest}=await import("../customer-facing.js");
 const unsafe="内部敏感评价与操作日志，不得给客户";
 const report=__facingTest.frame({
  kind:"followup",client:"客户甲",code:"C1",owner:"员工乙",status:"服务中",
  last:"2026-10-10",nextDate:"未安排",generated:"2026-10-11",totalRecords:1,
  entries:[{date:"2026-10-10",channel:"电话",summary:"已就服务方案进行沟通"}],
  conclusion:"当前等待客户确认",nextAction:"联系确认后续时间",demo:true
 });
 assert.doesNotMatch(report,new RegExp(unsafe));
 assert.match(report,/已就服务方案进行沟通/);
 assert.match(report,/演示预览/);
 const escaped=__facingTest.frame({
  kind:"followup",client:"C <script>alert(1)</script>",code:"C1",owner:"Service",
  status:"服务中",last:"2026-10-10",nextDate:"未安排",generated:"2026-10-11",totalRecords:1,
  entries:[{date:"2026-10-10",channel:"电话",summary:"<img src=x onerror=alert(1)>"}],
  conclusion:"",nextAction:"",demo:true
 });
 assert.doesNotMatch(escaped,/<script>|<img src=x/);
 assert.match(escaped,/&lt;script&gt;/);
 const [app,allocation,server,html,css]=await Promise.all(["app.js","allocation-projects.js","server.js","index.html","customer-facing.css"].map(read));
 assert.match(app,/openFollowupClientMode\(featureCtx\(\),c\)/);
 assert.match(allocation,/openReservationClientMode\(ctx,project\)/);
 assert.match(server,/customer-facing\.js/);
 assert.match(html,/customer-facing\.css/);
 assert.match(css,/@media print/);
});



test("CRM dashboard stays interactive even when chart scripts fail",async()=>{
 const [app,html,boot,css,demo]=await Promise.all([
  read("app.js"),read("index.html"),read("crm-boot.js"),read("crm-runtime-fix.css"),read("demo-client.js")
 ]);
 assert.match(html,/crm-boot\.js/);
 assert.doesNotMatch(html,/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/chart\.js/);
 assert.match(boot,/cdn\.jsdelivr\.net/);
 assert.match(boot,/cdnjs\.cloudflare\.com/);
 assert.match(boot,/fallbackChart/);
 assert.match(app,/document\.body\.dataset\.crmInteractiveReady="1"/);
 assert.match(css,/#main\.viewBusy,#main\.viewLeaving\{pointer-events:auto!important\}/);
 assert.match(demo,/response\.redirected\|\|response\.status===401/);
 const adminStart=app.indexOf("async function renderDashboard(){");
 const adminEnd=app.indexOf("function drawDashboardCharts(",adminStart);
 const dashboard=app.slice(adminStart,adminEnd);
 assert.ok(dashboard.indexOf('$$(".tradeflareRail [data-view]')<dashboard.lastIndexOf('try{drawDashboardCharts(7)}'),"Bind dashboard buttons before drawing charts");
 const teamStart=app.indexOf("function renderLevel1Dashboard(){");
 const teamEnd=app.indexOf("function openLevel2Overview(",teamStart);
 const team=app.slice(teamStart,teamEnd);
 assert.ok(team.indexOf('$$(".level1StaffCard").forEach')<team.indexOf('new Chart(orderEl'),"Staff details remain clickable if charts fail");
 assert.match(app,/if\(!main\.children\.length\)main\.innerHTML/);
});
