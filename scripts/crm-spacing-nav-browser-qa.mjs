/* Read-only demo Chromium acceptance: icon-only fixed rail and compact all-module top.
   Never signs in to or writes to production. */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { readFile } from "node:fs/promises";
const fixture=JSON.parse(await readFile(new URL("../demo-data.json",import.meta.url),"utf8"));
if (fixture.environment!=="test"||fixture.is_simulated!==true)throw Error("Isolated test fixture required");
const admin=fixture.profiles.find(p=>p.role==="admin");
if(!admin)throw Error("Missing test administrator");
const portServer=createServer();
await new Promise((ok,fail)=>portServer.once("error",fail).listen(0,"127.0.0.1",ok));
const port=portServer.address().port;
await new Promise(ok=>portServer.close(ok));
const origin="http://127.0.0.1:"+port;
const server=spawn(process.execPath,["server.js"],{
 cwd:new URL("..",import.meta.url).pathname,
 env:{...process.env,PORT:String(port)},stdio:["ignore","pipe","pipe"]
});
let stderr="";server.stderr.on("data",d=>{stderr+=String(d)});
const routes=["dashboard","customers","personnel","trades","positions","market","reports","shareboard","settings"];
let browser;
try{
 let ready=false;
 for(let i=0;i<100;i++){
  try{const r=await fetch(origin);if(r.ok){ready=true;break}}catch{}
  if(server.exitCode!==null)throw Error("Demo server stopped: "+stderr);
  await new Promise(resolve=>setTimeout(resolve,120));
 }
 if(!ready)throw Error("Demo server unavailable: "+stderr);
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:width===1440?900:844}});
  const runtimeErrors=[];page.on("pageerror",e=>runtimeErrors.push(String(e)));
  try{
   await page.goto(origin+"/?demo=1&account="+encodeURIComponent(admin.id),{waitUntil:"domcontentloaded"});
   await page.waitForSelector("#main[data-view]",{timeout:20000});
   for(const view of routes){
    await page.locator('.nav button[data-view="'+view+'"]').click({timeout:10000});
    await page.waitForFunction(v=>{
      const m=document.querySelector("#main");
      return m?.dataset.view===v&&m.classList.contains("viewReveal")&&!m.classList.contains("viewBusy");
    },view,{timeout:20000});
    const diag=await page.evaluate(()=>{
      const main=document.querySelector("#main");
      const nav=document.querySelector(".navFrame");
      const shell=document.querySelector(".shell");
      const first=main?.firstElementChild;
      const projectCards=main?.querySelector(".projectOverviewCards");
      const target=main?.dataset.view==="shareboard"?(projectCards||first):first;
      const mainRect=main?.getBoundingClientRect();
      const targetRect=target?.getBoundingClientRect();
      const label=nav?.querySelector(".navLabel");
      const glyph=nav?.querySelector(".navGlyph");
      return {
        view:main?.dataset.view,mainGap:parseFloat(getComputedStyle(main).gap),
        mainPaddingTop:parseFloat(getComputedStyle(main).paddingTop),
        topInset:targetRect&&mainRect?targetRect.top-mainRect.top:null,
        navWidth:nav?.getBoundingClientRect().width,
        shellPadding:parseFloat(getComputedStyle(shell).paddingLeft),
        labelDisplay:label?getComputedStyle(label).display:null,
        glyphDisplay:glyph?getComputedStyle(glyph).display:null,
        menuCount:nav?.querySelectorAll("button").length,
        hasToggle:!!document.querySelector("#toggleNavigation"),
        hasProjectReturn:!!document.querySelector("#projectPresentationExit"),
        hasEmptyProjectHeader:!!document.querySelector(".projectPresentationHeader"),
        compact:document.body.classList.contains("navigationCompact"),
        contentLength:main?.innerText?.trim().length||0
      };
    });
    const fail=reason=>{throw Error(width+"/"+view+": "+reason+" "+JSON.stringify(diag))};
    if(diag.menuCount<8||!diag.compact||diag.hasToggle)fail("navigation must be permanently icon-only");
    if(diag.labelDisplay!=="none"||diag.glyphDisplay==="none")fail("icon-only presentation is broken");
    if(width===1440&&(Math.abs(diag.navWidth-72)>2||Math.abs(diag.shellPadding-72)>2))
      fail("fixed 72px rail and matching content width required");
    if(Math.abs(diag.mainGap-96/25.4)>0.08)fail("module gap differs from 1mm");
    if(diag.mainPaddingTop>6)fail("main panel has excessive top padding");
    if(diag.contentLength===0)fail("empty module");
    if(diag.topInset!==null&&diag.topInset>28&&width===1440)
      fail("unwanted empty strip before content");
    if(view==="shareboard"&&(diag.hasProjectReturn||diag.hasEmptyProjectHeader))
      fail("unused top-right arrow/blank header still present");
    console.log("CRM_FIXED_RAIL_QA",JSON.stringify({width,...diag}));
   }
   if(runtimeErrors.length)throw Error(width+": runtime errors: "+runtimeErrors.join("; "));
  } finally {await page.close()}
 }
}finally{if(browser)await browser.close();server.kill("SIGTERM")}
